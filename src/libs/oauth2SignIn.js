// ref: https://developers.google.com/youtube/v3/guides/auth/client-side-web-apps?hl=es-419
const oauth2SignIn = (client_id) => {
  const CLIENT_ID = client_id;
  //const CLIENT_ID = "638815897163-tuf2u2l8bq6if08q4jjsod090l32kda4.apps.googleusercontent.com";
  const REDIRECT_URI = "https://www.youtube.com"; // in this domain, we are going to recive the access_token in the url

  // Google's OAuth 2.0 endpoint for requesting an access token
  const oauth2_endpoint = "https://accounts.google.com/o/oauth2/v2/auth";

  // Create element to open OAuth 2.0 endpoint in new window.
  const form = document.createElement("form");
  form.setAttribute("method", "GET"); // Send as a GET request.
  form.setAttribute("action", oauth2_endpoint);
  form.setAttribute("target", "_blank");

  // Parameters to pass to OAuth 2.0 endpoint.
  const params = {
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "https://www.googleapis.com/auth/youtube.force-ssl",
    state: "getting_access_token",
    include_granted_scopes: "true",
    response_type: "token",
  };

  // Add form parameters as hidden input values.
  for (const p in params) {
    const input = document.createElement("input");
    input.setAttribute("type", "hidden");
    input.setAttribute("name", p);
    input.setAttribute("value", params[p]);
    form.appendChild(input);
  }

  // Add form to page and submit it to open the OAuth 2.0 endpoint.
  document.body.appendChild(form);
  form.submit();
};
