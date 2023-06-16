const save_options_btn = document.querySelector("#save-options-btn");

const getCredentials = () => {
  const inputs_credential = document.querySelectorAll(".input-credential");

  let credentials = [];
  for (const input_credential of inputs_credential) {
    const credential = input_credential.value;
    credentials.push(credential);
  }

  return credentials;
};

const handler_save_options_btn = async () => {
  const credentials = getCredentials();

  try {
    await setValuesToLocalStorage("credentials", credentials);
  } catch (error) {
    console.error(error);
  }
};

save_options_btn.addEventListener("click", () => {
  handler_save_options_btn();
});
