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
    sendResponse(true);
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
  } else if (message.action === "remove-comments") {
    (async () => {
      const comment_ids = message.data;
      const result = await removeComments(comment_ids);
      sendResponse(result);
    })();
  } else if (message.action === "report-comments") {
    (async () => {
      const comment_ids = message.data;
      const result = await reportComments(comment_ids);
      sendResponse(result);
    })();
  }

  return true; // to not close the port of comunication when there is a delay https://stackoverflow.com/a/59915897
});

const reportComments = async (comment_ids) => {
  const access_token = await getValueFromLocalStorage("access_token");

  console.log("comment_ids:", comment_ids);

  try {
    const headers = {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    };

    const payload = {
      id: comment_ids,
    };

    const response = await fetch(YOUTUBE_URI + `comments/markAsSpam`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    console.log(response);

    if (response.status == 204)
      return { errorOccurred: false, data: "Comments have been reported." };
    else return { errorOccurred: true, data: response.status };
  } catch (error) {
    console.log(error);
    return { errorOccurred: true, data: error };
  }
};

const removeComments = async (comment_ids) => {
  const access_token = await getValueFromLocalStorage("access_token");

  try {
    const headers = {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    };

    const payload = {
      id: comment_ids,
      moderationStatus: "rejected",
    };

    const response = await fetch(YOUTUBE_URI + `comments/setModerationStatus`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    console.log(response);

    if (response.status == 204)
      return { errorOccurred: false, data: "Comments have been removed." };
    else return { errorOccurred: true, data: response.status };
  } catch (error) {
    console.error(error);
    return { errorOccurred: true, data: error };
  }
};

const getChannelDataLoggedUser = async () => {
  const access_token = await getValueFromLocalStorage("access_token");
  if (!access_token) return { errorOccurred: true, data: null };

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

    if (!("error" in data)) return { errorOccurred: false, data: data };
    else return { errorOccurred: true, data: data.error };
  } catch (error) {
    console.error(error);
    return { errorOccurred: true, data: error };
  }
};

const getVideoData = async (video_id) => {
  const access_token = await getValueFromLocalStorage("access_token");
  if (!access_token) return { errorOccurred: true, data: null };

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
    return { errorOccurred: true, data: error };
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
    return { errorOccurred: true, data: error };
  }
};

const getCommentsYoutubeDataAPI = async (video_id, access_token) => {
  //video_id = "sH7DNJj4vus"; // < 100 comments
  //video_id = "i4ompLBhUg4"; // > 100 comments

  const comments = [];
  let nextPageToken = "";

  // sacar todos los comentarios de un video (la api te vuelve maximo 100 comentarios a la vez)
  do {
    try {
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      };

      const response = await fetch(
        YOUTUBE_URI +
          `commentThreads?part=snippet%2Creplies&maxResults=100&order=relevance&pageToken=${nextPageToken}&videoId=${video_id}`,
        {
          method: "GET",
          headers: headers,
        }
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
      return { errorOccurred: true, data: error };
    }
  } while (nextPageToken !== "");

  return { errorOccurred: false, data: comments };
};

const getComments = async (video_id) => {
  const access_token = await getValueFromLocalStorage("access_token");

  if (!access_token)
    return { errorOccurred: true, data: "Without access_token" };

  // TODO: feature to add in the future: select the credential that has many tokens available, to prevent errors.
  const result = await getCommentsYoutubeDataAPI(video_id, access_token);

  return result;
};

const openOptionPage = () => {
  chrome.runtime.openOptionsPage();
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
