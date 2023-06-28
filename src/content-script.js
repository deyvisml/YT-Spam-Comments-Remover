const sendMessage = async (action, data) => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action, data }, (response) => {
      if (!chrome.runtime.lastError) {
        resolve(response);
      } else {
        reject(chrome.runtime.lastError);
      }
    });
  });
};

const openOptionsPage = async () => {
  try {
    await sendMessage("open-option-page", null);
  } catch (error) {
    console.error(error);
  }
};

const getVideoId = async () => {
  let video_id;

  try {
    const result = await sendMessage("get-current-url", null);

    if (!result.errorOccurred) {
      const current_url = result.data;
      video_id = current_url.substring(32, current_url.length);
    } else {
      alert("No se pudo obtener la url del video");
      throw new Error("No se pudo obtener la url actual");
    }
  } catch (error) {
    throw new Error(error);
  }

  return video_id;
};

const isYoutubeDataAPICredentialsSet = async () => {
  let is_credentials_set;

  try {
    const credentials = await getValueFromLocalStorage("credentials");

    // verificar si la variable fue guardada
    if (credentials != null) {
      is_credentials_set = true;
    } else {
      is_credentials_set = false;
    }
  } catch (error) {
    console.error(error);
    is_credentials_set = false;
  }

  return is_credentials_set;
};

const getComments = async (video_id) => {
  const result = await sendMessage("get-comments", video_id);

  if (result.errorOccurred) {
    alert(result.errorMessage);
    throw new Error(result.errorMessage);
  }

  return result.data;
};

// para obtener cuales son las formas que el usuario seleccionó para evaluar los comentarios
const getUserPreferences = async () => {
  // cada uno almacenara un objeto {isCheck: bool, data: []}
  const evaluate_by_image = await getValueFromLocalStorage("evaluate_by_image");
  const evaluate_by_name = await getValueFromLocalStorage("evaluate_by_name");
  let evaluate_by_text_comment = await getValueFromLocalStorage(
    "evaluate_by_text_comment"
  );

  evaluate_by_text_comment = {
    isCheck: true,
    data: { categories: ["spam", "bitcoin"] },
  }; // testing

  return {
    evaluate_by_image,
    evaluate_by_name,
    evaluate_by_text_comment,
  };
};

// TODO: This is an important function
const evaluateByTextComment = (comment, categories, models_text_comment) => {
  let isSpam = false;
  const spamCategoriesMet = [];

  const tokens = TextPreprocessor.preprocess(comment);

  for (const category of categories) {
    const [prediction] = models_text_comment[category].predict([tokens]); //! clasificando un comentario (prediccón)

    console.log("-> prediction:", tokens, " - ", prediction);
    if (prediction === "bad") {
      //! bad only is for testing, it must be "spam" or "true" or 1
      isSpam = true;
      spamCategoriesMet.push(category);
    }
  }

  return { isSpam, data: spamCategoriesMet };
};

// este metodo es el mas importante, ya que evalua y ademas guarda en el comentario si es spam o no (no retorna nada, establece los valores se podria considerar por referencia)
// comment_element es el nivel del objeto en donde se guardara el resultado
const evaluateComment = async (
  comment,
  comment_element,
  evaluation_types,
  models
) => {
  const { evaluate_by_image, evaluate_by_name, evaluate_by_text_comment } =
    evaluation_types;

  //! evaluando un comentario (los otras formas de evaluar se desarrollaran mas adelante)
  if (evaluate_by_text_comment?.isCheck) {
    const result = evaluateByTextComment(
      comment,
      evaluate_by_text_comment.data.categories,
      models["text_comment"]
    );

    // guardando los resultados
    comment_element.isSpam = result.isSpam;
    result.data.forEach((category) => {
      comment_element["spamCategoriesMet"].push(category);
    });
  }
};

const loadModels = async (evaluation_types) => {
  const { evaluate_by_image, evaluate_by_name, evaluate_by_text_comment } =
    evaluation_types;

  const models = {};

  // se cargan todos los modelos que sean requerdios para los distintos tipos de evaluación
  //! por ahora solo se cargaran los modelos que se utlizen para el tipo de evaluación del texto de los comentarios (evaluate_by_text_comment)

  // este sera verdadero, siempre y cuando almenos una category haya sido seleccionada
  if (evaluate_by_text_comment?.isCheck) {
    // para cargar los distintos modelos para las distintas categories de evaluación de comentario de texto (self promo, bitcoin, etc)
    for (const category of evaluate_by_text_comment.data.categories) {
      const result = await sendMessage("get-model", category);
      if (result.errorOccurred)
        throw new Error(`Error uploading the model: ${category}`);
      // genearintg the model with json data
      models["text_comment"] = models["text_comment"] ?? {}; // en ese parte solo se almacenaran los modelos relacionadados al texto del comentario
      models["text_comment"][category] = MultinomialNB.load(result.data);
    }
  }

  return models;
};

const evaluateComments = async (comments) => {
  // get user preferences
  const evaluation_types = await getUserPreferences();
  // load the models (considering evaluation_types)
  const models = await loadModels(evaluation_types);

  // evaluando todos los comentarios
  for (const element of comments) {
    element.topLevelComment.isSpam = false;
    element.topLevelComment.spamCategoriesMet = [];

    let comment = element.topLevelComment.snippet.textOriginal;

    // evaluando un comentario (los atributos del resultado se estableceran en element.topLevelComment )
    evaluateComment(comment, element.topLevelComment, evaluation_types, models);

    for (const replyComment of element.repliesComments) {
      replyComment.isSpam = false;
      replyComment.spamCategoriesMet = [];

      comment = replyComment.snippet.textOriginal;

      evaluateComment(comment, replyComment, evaluation_types, models);
    }
  }

  return comments;
};

const filterSpamComments = (evaluated_comments) => {
  const spam_comments = [];

  for (const evaluated_comment of evaluated_comments) {
    if (evaluated_comment.topLevelComment.isSpam) {
      spam_comments.push(evaluated_comment.topLevelComment);
    }

    if ("repliesComments" in evaluated_comment) {
      for (const reply_comment of evaluated_comment.repliesComments) {
        if (reply_comment.isSpam) {
          spam_comments.push(reply_comment);
        }
      }
    }
  }

  return spam_comments;
};

const is_client_id_set = async () => {
  const client_id_input_datas = await getValueFromLocalStorage(
    "client_id_input_datas"
  );

  return !!client_id_input_datas; // casting to a boolean result
};

const is_there_access_token = async () => {
  const access_token = await getValueFromLocalStorage("access_token");

  return !!access_token;
};

const is_access_token_alive = async () => {
  const result = await sendMessage("verify-is-access-token-alive", null);

  if (result.errorOccurred)
    throw new Error("Error verifying if the access token is alive");

  return result.data;
};

const get_client_id = async () => {
  const client_id_input_datas = await getValueFromLocalStorage(
    "client_id_input_datas"
  );

  for (const client_id_input_data of client_id_input_datas) {
    if (client_id_input_data.checked) {
      return client_id_input_data.client_id;
    }
  }

  return null;
};

const isVideoAuthor = async (video_id) => {
  // get video data
  let video_data = null;
  const result = await sendMessage("get-video-data", video_id);
  if (result.errorOccurred) throw new Error("Error getting the video data");
  else video_data = result.data;

  // get channel data logged user
  let channel_data_logged_user = null;
  const restul2 = await sendMessage("get-channel-data-logged-user", null);
  if (result.errorOccurred)
    throw new Error("Error getting the channel data of the logged user");
  else channel_data_logged_user = restul2.data;

  // verifying
  //console.log("video_data:", video_data);
  //console.log("channel_data_logged_user:", channel_data_logged_user);

  let video_made_by_channel_id = null;
  let channel_id_logged_user = null;
  try {
    video_made_by_channel_id = video_data.items[0].snippet.channelId;
    channel_id_logged_user = channel_data_logged_user.items[0].id;
  } catch (error) {
    throw new Error(
      "Error at verifying if the current user is the video author, problems accessing to the id's"
    );
  }

  if (video_made_by_channel_id == channel_id_logged_user) return true;

  return false;
};

// TODO: WORKING IN THIS METHOD
const main = async () => {
  // START verificating proccess

  if (!(await is_client_id_set())) {
    alert("There is not a Client ID set, please first do it.");
    await openOptionsPage();
    return;
  }

  if (!(await is_there_access_token()) || !(await is_access_token_alive())) {
    alert("You need to sign-in first.");
    const client_id = await get_client_id();
    oauth2SignIn(client_id);
    return;
  }

  // END verificating proccess

  //const access_token = await getValueFromLocalStorage("access_token");
  const video_id = await getVideoId(); // TODO: This method would be improve (without interacting with sw)

  const is_video_author = await isVideoAuthor(video_id);

  return true;

  // TODO: Display a modal and then a loader
  display_modal_into_body();
  display_evaluating_loader_into_modal_body();

  // comentado para no gastar tokens de yt en el desarrollo
  //const comments = await getComments(video_id);
  //console.log(comments);
  //await setValueToLocalStorage("comments", comments);

  const comments = await getValueFromLocalStorage("comments");

  const evaluated_comments = await evaluateComments(comments);
  console.log("-> Evaluted comments");
  console.log(evaluated_comments);

  const spam_comments = filterSpamComments(evaluated_comments);
  console.log("-> Filtered comments");
  console.log(spam_comments);

  return true;
  // Add spam comments to modal
  display_comments_into_modal_body(spam_comments);

  // TODO: Verify if the set token belongs to channel that created this video (video_id)
  //const is_video_author = isVideoAuthor(video_id);
  // hasSetTokenDeleteCommentsPermisson(video_id)

  // TODO: Get user options
  const options = [
    { key: "remove", name: "Action 1" },
    { key: "report", name: "Action 2" },
  ];

  // TODO: Add user options to modal
  display_modal_footer_content_into_modal_footer(options);
};

const execute = () => {
  console.log("OAUTH RUNNING");
  oauth2SignIn();
  // get id from checked spam comments
  const spam_comments_id_checked = get_spam_comments_id_checked();

  // get selected option
  const selected_option = get_selected_option();
  console.log(selected_option);

  // display executing loader (it also hide the modal footer)
  display_executing_loader(selected_option, spam_comments_id_checked.length);

  // execute_option(selected_option) this method belongs to the content script
  const result = { errorOcurred: false, data: "Mensaje succed xd" };

  // displaying the final result
  //display_result(result);
};

display_button();
