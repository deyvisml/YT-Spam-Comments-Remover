const main = async () => {
  // getting the url
  const url = window.location.href;

  // parsing the URL
  const url_params = new URLSearchParams(url.split("#")[1]);

  const state = url_params.get("state") || null;
  const authuser = url_params.get("authuser") || null;

  if (state == "getting_access_token") {
    const access_token = url_params.get("access_token") || null;
    const expires_in = url_params.get("expires_in") || null;

    // saving the generated access token (very important)
    await setValueToLocalStorage("access_token", access_token);

    alert("You are logged!");
    // closing the window
    window.close();
  }
};

main();
