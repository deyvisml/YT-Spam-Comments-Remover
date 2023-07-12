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

const getVideoId = () => {
  const current_url = window.location.href;

  const params = new URLSearchParams(current_url.split("?")[1]);
  const video_id = params.get("v");

  return video_id;
};

const getComments = async (video_id) => {
  const result = await sendMessage("get-comments", video_id);

  if (result.errorOccurred) {
    alert("Error, problems getting the comments.");
    throw new Error(result.data);
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
    data: {
      categories: [{ name: "Fraude", model_name: "model" }],
    },
  }; // testing

  return {
    evaluate_by_image,
    evaluate_by_name,
    evaluate_by_text_comment,
  };
};

// TODO: THIS IS AN IMPORTANT FUNCTION
const evaluateByTextComment = (comment, categories, models_text_comment) => {
  let isSpam = false;
  const spamCategoriesMet = [];

  const tokens = text_preprocessor.preprocess(comment);

  for (const category of categories) {
    const [prediction] = models_text_comment[category.model_name].predict([
      tokens,
    ]); //! clasificando un comentario (predicción)

    console.log("-> prediction:", tokens, " ==> ", prediction);

    //! bad only is for testing, it must be "spam" or "true" or 1
    if (prediction == 1) {
      isSpam = true;
      spamCategoriesMet.push(category.name);
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
    result.data.forEach((category_name) => {
      comment_element["spamCategoriesMet"].push(category_name);
    });
  }
};

const loadModels = async (evaluation_types) => {
  const { evaluate_by_image, evaluate_by_name, evaluate_by_text_comment } =
    evaluation_types;

  const models = {};

  // se cargan todos los modelos que sean requeridos para los distintos tipos de evaluación
  //! por ahora solo se cargaran los modelos que se utlizen para el tipo de evaluación del texto de los comentarios (evaluate_by_text_comment)

  // este sera verdadero, siempre y cuando almenos una category haya sido seleccionada
  if (evaluate_by_text_comment?.isCheck) {
    // para cargar los distintos modelos para las distintas categories de evaluación de comentario de texto (self promo, bitcoin, etc)
    for (const category of evaluate_by_text_comment.data.categories) {
      const result = await sendMessage("get-model", category.model_name);
      if (result.errorOccurred)
        throw new Error(`Error loading the model: ${category.model_name}`);
      // genearting the model with json data
      models["text_comment"] = models["text_comment"] ?? {}; // en ese parte solo se almacenaran los modelos relacionadados al texto del comentario
      models["text_comment"][category.model_name] = MultinomialNB.load(
        result.data
      );
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

const isClientIDSet = async () => {
  const client_id_input_datas = await getValueFromLocalStorage(
    "client_id_input_datas"
  );

  return !!client_id_input_datas; // casting to a boolean result
};

const isThereAccessToken = async () => {
  const access_token = await getValueFromLocalStorage("access_token");

  return !!access_token;
};

const isAccessTokenAlive = async () => {
  // to verify if the access token is still alive, we call a random endpoint (in this case to get the channel data)
  const result = await sendMessage("get-channel-data-logged-user", null);

  return !result.errorOccurred;
};

const getClientID = async () => {
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

const getUserData = async () => {
  const result = await sendMessage("get-channel-data-logged-user", null);

  if (result.errorOccurred) throw new Error(result.data);

  return result.data;
};

const getPermissons = (is_video_author) => {
  let permissons = null;

  if (is_video_author)
    permissons = [
      { key: "remove", name: "Remove comments" },
      { key: "report", name: "Report comments" },
    ];
  else permissons = [{ key: "report", name: "Report comments" }];

  return permissons;
};

const signIn = async () => {
  const client_id = await getClientID();
  oauth2SignIn(client_id);
};

const main = async () => {
  // START verifying proccess

  if (!(await isClientIDSet())) {
    alert("There is not a Client ID set, please first do it.");
    await openOptionsPage();
    return;
  }

  if (!(await isThereAccessToken()) || !(await isAccessTokenAlive())) {
    alert("You need to sign-in first.");
    await signIn();
    return;
  }

  // END verifying proccess

  const video_id = getVideoId();

  const user_data = await getUserData();
  const is_video_author = await isVideoAuthor(video_id);
  const permissons = getPermissons(is_video_author);

  display_modal_into_body();
  display_user_profile_into_modal_body(user_data, is_video_author, permissons);
  display_start_buttons_into_modal_footer(permissons);
};

const changeAccountHandler = async () => {
  await removeValueFromLocalStorage("access_token");
  close_modal();

  signIn();
};

const evaluateCommentsHandler = async () => {
  clear_modal();
  display_evaluating_loader_into_modal_body();

  const video_id = getVideoId();

  let comments = null;
  if (MODE == "dev") {
    comments = await getValueFromLocalStorage("comments");
  } else {
    //comentado para no gastar tokens de yt en el desarrollo
    comments = await getComments(video_id);
    await setValueToLocalStorage("comments", comments);
    console.log(comments);
  }

  const evaluated_comments = await evaluateComments(comments);
  console.log("-> Evaluted comments: ", evaluated_comments);

  const spam_comments = filterSpamComments(evaluated_comments);
  console.log("-> Filtered comments: ", spam_comments);

  if (spam_comments.length == 0) {
    alert("There are not spam comments identified.");
    close_modal();
    return;
  }

  // Add spam comments into modal
  display_comments_into_modal_body(spam_comments);

  const is_video_author = await isVideoAuthor(video_id);
  const permissons = getPermissons(is_video_author);

  display_execute_options_into_modal_footer(permissons);
};

/**
 * Prepare comment ids in two ways, first replace "POINT" by . and the second, remove comment replies id if its parent will be delete (to avoid problems)
 * @param {Array} comment_ids Comment id's to prepare so they can be deleted successfully
 * @returns comments prepare
 */
const prepareCommentIDs = (comment_ids) => {
  const result = [];

  for (let comment_id of comment_ids) {
    if (comment_id.includes("POINT")) {
      comment_id = comment_id.replace("POINT", ".");
      const parent_comment_id = comment_id.split(".")[0];

      if (comment_ids.includes(parent_comment_id)) continue; // the actual comment is not included because its parent comment will be deleted
    }

    result.push(comment_id);
  }

  return result;
};

const execute = async (option, comment_ids) => {
  comment_ids = prepareCommentIDs(comment_ids);

  let result = null;

  switch (option) {
    case "remove":
      result = await sendMessage("remove-comments", comment_ids);
      break;

    case "report":
      result = await sendMessage("report-comments", comment_ids);
      break;

    default:
      alert("Unkown selected option.");
      throw new Error("Unkown selected option.");
      break;
  }

  return result;
};

// TODO: WORKING IN THIS METHOD
const executeHandler = async () => {
  // get ids from checked spam comments
  const spam_comments_id_checked = get_spam_comments_id_checked();

  // get selected option
  const selected_option = get_selected_option();

  clear_modal();
  display_executing_loader(selected_option, spam_comments_id_checked.length);

  const result = await execute(selected_option, spam_comments_id_checked);

  display_result(result);
};

display_button();
