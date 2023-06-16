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

  console.log("video_id", video_id);

  return video_id;
};

const checkIsYoutubeDataAPICredentialsSet = async () => {
  let is_credentials_set;

  try {
    const values = await getValuesFromLocalStorage("credentials");

    // verificar si la respuesta no es {}
    if (Object.keys(values).length != 0) {
      is_credentials_set = true;
      console.log("credentials:", values);
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
  // TODO: WORKING IN THIS PART
  const result = await sendMessage("get-comments", video_id);

  if (result.errorOccurred) {
    alert(result.errorMessage);
    throw new Error(result.errorMessage);
  }

  return result.data;
};

const getSpamComments = async () => {
  // check if credentials were set
  if (!(await checkIsYoutubeDataAPICredentialsSet())) {
    await openOptionsPage();
    throw new Error("Credenciales no establecidas");
  }

  const video_id = getVideoId();

  const comments = await getComments(video_id);

  console.log("***Comments***");
  console.log(comments);
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
