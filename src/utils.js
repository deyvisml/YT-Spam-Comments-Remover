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

const setValueToLocalStorage = (key, value) => {
  return new Promise((resolve, reject) => {
    // https://share.bito.co/static/share?aid=758fea78-99b6-4b1b-a6da-61a32b136739
    // se crea la variable data, para  evitar que key sea tomado como "key" y en vez de ello toma el valor enviado
    const data = {};
    data[key] = value;

    chrome.storage.local.set(data, () => {
      if (!chrome.runtime.lastError) {
        resolve(true);
      } else {
        reject(chrome.runtime.lastError);
      }
    });
  });
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

const oauth2SignIn = () => {
  const YOUR_CLIENT_ID =
    "638815897163-tuf2u2l8bq6if08q4jjsod090l32kda4.apps.googleusercontent.com";
  const YOUR_REDIRECT_URI = "https://www.google.com";

  // Google's OAuth 2.0 endpoint for requesting an access token
  var oauth2Endpoint = "https://accounts.google.com/o/oauth2/v2/auth";

  // Create element to open OAuth 2.0 endpoint in new window.
  var form = document.createElement("form");
  form.setAttribute("method", "GET"); // Send as a GET request.
  form.setAttribute("action", oauth2Endpoint);
  form.setAttribute("target", "_blank");

  // Parameters to pass to OAuth 2.0 endpoint.
  var params = {
    client_id: YOUR_CLIENT_ID,
    redirect_uri: YOUR_REDIRECT_URI,
    scope: "https://www.googleapis.com/auth/youtube.force-ssl",
    state: "try_sample_request",
    include_granted_scopes: "true",
    response_type: "token",
  };

  // Add form parameters as hidden input values.
  for (var p in params) {
    var input = document.createElement("input");
    input.setAttribute("type", "hidden");
    input.setAttribute("name", p);
    input.setAttribute("value", params[p]);
    form.appendChild(input);
  }

  // Add form to page and submit it to open the OAuth 2.0 endpoint.
  document.body.appendChild(form);
  form.submit();
};
