const waitForElement = (selector, time) => {
  return new Promise((resolve, reject) => {
    const intervalId = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(intervalId);
        resolve(element);
      }
    }, time);
  });
};

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
    console.error(error);
  }

  return video_id;
};

const checkIsYoutubeDataAPICredentialsSet = async () => {
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

// para obtener cuales son las formas que el usuario seleccionio para evaluar los comentarios
const getUserPreferences = async () => {
  // cada uno almacenara un objeto {isCheck: bool, data: []}
  const evaluate_by_image = await getValueFromLocalStorage("evaluate_by_image");
  const evaluate_by_name = await getValueFromLocalStorage("evaluate_by_name");
  let evaluate_by_text_comment = await getValueFromLocalStorage(
    "evaluate_by_text_comment"
  );

  evaluate_by_text_comment = { isCheck: true, data: [] }; // testing

  return {
    evaluate_by_image,
    evaluate_by_name,
    evaluate_by_text_comment,
  };
};

const evaluateByTextComment = (comment, categories) => {
  //console.log("codigo para evaluar por el contenido textual de un comentario");

  return { isSpam: true, data: ["cat xd", "cat xd1"] };
};

const preprocessComment = (comment) => {
  return comment;
};

const evaluateComment = async (comment, comment_element, evaluation_types) => {
  const { evaluate_by_image, evaluate_by_name, evaluate_by_text_comment } =
    evaluation_types;

  // evaluando un comentario
  if (evaluate_by_text_comment?.isCheck) {
    const result = evaluateByTextComment(
      comment,
      evaluate_by_text_comment.data
    );

    // guardando los resultados
    comment_element.isSpam = result.isSpam;
    result.data.forEach((category) => {
      comment_element.spamCategoriesMet.push(category);
    });
  }
};

const evaluateComments = async (comments) => {
  // get user preferences
  const evaluation_types = await getUserPreferences();

  console.log("debug1:", evaluation_types);

  // evaluando todos los comentarios
  for (const element of comments) {
    element.topLevelComment.isSpam = false;
    element.topLevelComment.spamCategoriesMet = [];

    let comment = preprocessComment(
      element.topLevelComment.snippet.textOriginal
    );

    /*
    // evaluando un comentario
    if (evaluation_types.evaluate_by_text_comment?.isCheck) {
      const result = evaluateByTextComment(
        comment,
        evaluate_by_text_comment.data
      );

      // guardando los resultados
      element.topLevelComment.isSpam = result.isSpam;
      result.data.forEach((category) => {
        element.topLevelComment.spamCategoriesMet.push(category);
      });
    }*/

    evaluateComment(comment, element.topLevelComment, evaluation_types);

    for (const replyComment of element.repliesComments) {
      replyComment.isSpam = false;
      replyComment.spamCategoriesMet = [];

      comment = preprocessComment(replyComment.snippet.textOriginal);

      // evaluando la respuesta de un comentario
      evaluateComment(comment, replyComment, evaluation_types);

      /*
      if (evaluation_types.evaluate_by_text_comment?.isCheck) {
        evaluateByTextComment(
          comment,
          evaluation_types.evaluate_by_text_comment.data
        );
      }*/
    }
  }

  console.log("commets array after to modify");
  console.log(comments);

  return comments;
};

const getSpamComments = async () => {
  // check if credentials were set
  if (!(await checkIsYoutubeDataAPICredentialsSet())) {
    await openOptionsPage();
    throw new Error("Credenciales no establecidas");
  }

  const video_id = await getVideoId();

  // comentado para no gastar tokens de yt en el desarrollo
  //const comments = await getComments(video_id);
  //await setValueToLocalStorage("comments", comments);

  // TODO: WORKING IN THIS PART
  const comments = await getValueFromLocalStorage("comments");

  console.log("***Comments2***");
  console.log(comments);

  evaluateComments(comments);

  return true;
};

const getSpamCommentsButton = () => {
  const element = document.createElement("a");

  element.innerHTML = `<i class="fa-solid fa-trash-can"></i>
                    <span>Spam comments</span>`;

  //element.innerText = "Spam comments";
  element.classList.add("get-spam-commment-button");

  element.addEventListener("click", () => {
    getSpamComments();
  });

  return element;
};

const displayGetSpamCommentsButton = () => {
  (async () => {
    const container = await waitForElement(
      "#header > ytd-comments-header-renderer > #title",
      1000
    );

    const get_spam_commment_button = getSpamCommentsButton();

    container.insertAdjacentElement("beforeend", get_spam_commment_button);
  })();
};

displayGetSpamCommentsButton();
