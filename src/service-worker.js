const YOUTUBE_URI = "https://youtube.googleapis.com/youtube/v3/";

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
      const video_id = message.data;
      const result = await getComments(video_id);
      sendResponse(result);
    })();
  } else if (message.action === "get-model") {
    (async () => {
      const model_name = message.data;
      const result = await getModel(model_name);
      sendResponse(result);
    })();
  } else if (message.action === "verify-is-access-token-alive") {
    (async () => {
      const result = await verifyIsAccessTokenAlive();
      sendResponse(result);
    })();
  } else if (message.action === "get-video-data") {
    (async () => {
      const video_id = message.data;
      const result = await getVideoData(video_id);
      sendResponse(result);
    })();
  } else if (message.action === "get-channel-data-logged-user") {
    (async () => {
      const result = await getChannelDataLoggedUser();
      sendResponse(result);
    })();
  }

  return true; // to not close the port of comunication when there is a delay https://stackoverflow.com/a/59915897
});

const getChannelDataLoggedUser = async () => {
  const access_token = await getValueFromLocalStorage("access_token");
  if (!access_token) return { errorOccurred: true, data: false };

  try {
    const headers = {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(
      YOUTUBE_URI + `channels?part=id,snippet&mine=true`,
      {
        method: "GET",
        headers: headers,
      }
    );

    const data = await response.json();

    return { errorOccurred: false, data: data };
  } catch (error) {
    console.error(error);
    return { errorOccurred: true, data: null };
  }
};

const getVideoData = async (video_id) => {
  const access_token = await getValueFromLocalStorage("access_token");
  if (!access_token) return { errorOccurred: true, data: false };

  try {
    const headers = {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(
      YOUTUBE_URI + `videos?part=id,snippet&id=${video_id}`,
      {
        method: "GET",
        headers: headers,
      }
    );

    const data = await response.json();

    return { errorOccurred: false, data: data };
  } catch (error) {
    console.error(error);
    return { errorOccurred: true, data: null };
  }
};

const verifyIsAccessTokenAlive = async () => {
  console.log("working");
  const access_token = await getValueFromLocalStorage("access_token");

  if (!access_token) return { errorOccurred: true, data: false };

  try {
    // we only call this endpoint to verify if the access token is alive
    const headers = {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(
      YOUTUBE_URI + `channels?part=id,snippet&mine=true`,
      {
        method: "GET",
        headers: headers,
      }
    );

    const data = await response.json();

    console.log("the access token is alive");

    return { errorOccurred: false, data: true };
  } catch (error) {
    console.error("Error:", error);
    return { errorOccurred: false, data: false }; // both false in this line are ok
  }
};

const getModel = async (model_name) => {
  try {
    const response = await fetch(
      chrome.runtime.getURL(`models/${model_name}.json`)
    );
    const model = await response.json();

    return { errorOccurred: false, data: model };
  } catch (error) {
    console.error(error);
    return { errorOccurred: true, data: null };
  }
};

const getCommentsYoutubeDataApi = async (video_id, credentials) => {
  //video_id = "sH7DNJj4vus"; // < 100 comments
  //video_id = "i4ompLBhUg4"; // > 100 comments

  //const api_key = "AIzaSyD9HrW-4nkzYM5QYPLk-HJzppE0iRIbdAU";
  const api_key = credentials[0];

  const comments = [];
  let nextPageToken = "";

  // esta variable solo fue creada para representar una situacion de error, eso de debe de verifciar en el if de abajo
  let errorOccurred = false;
  let errorMessage = "";

  // sacar todos los comentarios de un video (la api te vuelve maximo 100 comentarios a la vez)
  do {
    try {
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
    } catch (error) {
      console.log(error);
      errorOccurred = true;
      errorMessage = error;
    }
  } while (nextPageToken !== "");

  if (errorOccurred) {
    console.log("Error en el metodo que llama a la API");
    return { errorOccurred, errorMessage };
  }

  console.log("data fetched");
  console.log(comments);

  return { errorOccurred: false, data: comments };
};

const getComments = async (video_id) => {
  const credentials = await getValueFromLocalStorage("credentials");

  if (credentials == null) {
    console.log("No existen credenciales establecidas");
    return { errorOccurred: true, errorMessage: "Without credentials" };
  }

  // TODO: feature to add in the future: select the credential that has many tokens available, to prevent errors.
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

const getValueFromLocalStorage = (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      if (!chrome.runtime.lastError) {
        resolve(result[key] ?? null);
      } else {
        reject(chrome.runtime.lastError);
      }
    });
  });
};
