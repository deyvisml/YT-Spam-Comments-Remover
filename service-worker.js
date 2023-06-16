/**
 * LImpiar el storage local y la cache de google auth (esto para permitir al usuario ingresar una cuenta cualquiera)
 */
const clearStorage = () => {
  chrome.storage.local.clear(() => {
    if (!chrome.runtime.lastError) {
      console.log("storge cleared");
    } else {
      console.error(chrome.runtime.lastError);
    }
  });
};

chrome.runtime.onInstalled.addListener((details) => {
  //clearStorage();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "open-option-page") {
    openOptionPage();
    console.log(message);
    sendResponse(true);
  } else if (message.action === "get-current-url") {
    (async () => {
      const result = await getCurrentUrl();

      sendResponse(result);
    })();
  } else if (message.action === "get-comments") {
    (async () => {
      const video_id = message.video_id;
      const result = await getComments(video_id);
      sendResponse(result);
    })();
  }

  return true; // to not close the port of comunication when there is a delay https://stackoverflow.com/a/59915897
});

const getCommentsYoutubeDataApi = async (video_id, credentials) => {
  video_id = "sH7DNJj4vus"; // < 100 comments
  //video_id = "i4ompLBhUg4"; // > 100 comments

  const api_key = "AIzaSyD9HrW-4nkzYM5QYPLk-HJzppE0iRIbdAU";

  const comments = [];
  let nextPageToken = "";

  // sacar todos los comentarios de un video (la api te vuelve maximo 100 comentarios a la vez)
  do {
    const response = await fetch(
      `https://youtube.googleapis.com/youtube/v3/commentThreads?part=snippet%2Creplies&maxResults=100&order=relevance&pageToken=${nextPageToken}&videoId=${video_id}&key=${api_key}`
    );
    const result = await response.json();

    result.items.forEach((item) => {
      comments.push({
        topLevelComment: item.snippet.topLevelComment, // comentario
        repliesComments: item.replies?.comments ?? [], // respuestas a ese comentario
      });
    });

    nextPageToken = result.nextPageToken ?? "";
    console.log("nextPageToken: ", nextPageToken);
  } while (nextPageToken !== "");

  console.log("data fetched");
  console.log(comments);

  const aux_error = false;

  if (aux_error) {
    console.log("Error en el metodo que llama a la API");
    return { errorOccurred: true, errorMessage: "message about the error" };
  }

  return { errorOccurred: false, data: comments };
};

const getComments = async (video_id) => {
  const credentials = await getValuesFromLocalStorage("credentials");
  console.log("CREDENTIALS:", credentials);

  if (Object.keys(credentials).length == 0) {
    console.log("No existen credenciales establecidas");
    return { errorOccurred: true, errorMessage: "Without credentials" };
  }

  // feature to add in the future: select the credential that has many tokens available, to prevent errors.
  const result = await getCommentsYoutubeDataApi(video_id, credentials);

  return result;
};

const openOptionPage = () => {
  chrome.runtime.openOptionsPage();
};

const getCurrentUrl = async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return { errorOccurred: false, data: tab.url };
  } catch (error) {
    console.error(error);
    return { errorOccurred: true, data: null };
  }
};

// hacer que el metodo solo sea para un solo key, no para varios key y que se devuelve el valor no un objeto simillar a plasmo, pero primero usar githbu
const getValuesFromLocalStorage = async (keys) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (!chrome.runtime.lastError) {
        resolve(result);
      } else {
        reject(chrome.runtime.lastError);
      }
    });
  });
};
