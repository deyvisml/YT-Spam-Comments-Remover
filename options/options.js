/* Setting user preferences values */

const create_client_id_li_element = (data) => {
  const { input_id, client_id, checked } = data;

  const li_element = document.createElement("li");
  li_element.className = "client-id-input-element";

  li_element.innerHTML = `<input id="${input_id}" value="${client_id}" class="client-id-input" type="text" />
                          <input name="cliend_id" value="${input_id}" type="radio" ${
    checked ? "checked" : ""
  }/>`;

  return li_element;
};

const deployClientIdInputs = async () => {
  // get client id input datas
  let client_id_input_datas = await getValueFromLocalStorage(
    "client_id_input_datas"
  );

  if (!client_id_input_datas) {
    client_id_input_datas = [{ input_id: 1, client_id: "", checked: true }]; // default client id
  }

  // get parent element
  const client_id_inputs_container = document.querySelector(
    ".client-id-inputs-container"
  );

  // inserting n client id inputs to the parent element
  for (const client_id_input_data of client_id_input_datas) {
    const li_element = create_client_id_li_element(client_id_input_data);

    client_id_inputs_container.insertAdjacentElement("beforeend", li_element);
  }
};

deployClientIdInputs();

/* END Setting user preferences values */

const getValueInputRadioChecked = (name) => {
  const input_radios = document.getElementsByName(name);

  let value = null;

  for (const input_radio of input_radios) {
    if (input_radio.checked) {
      value = input_radio.value;
      return value;
    }
  }

  alert("Error, at least one client id mush be selected");
  throw new Error("There is not an input radio checked");
};

const getClientIdInputDatas = () => {
  const client_id_inputs = document.querySelectorAll(".client-id-input");
  const input_id_checked = getValueInputRadioChecked("cliend_id");

  let client_id_input_datas = [];

  for (const client_id_input of client_id_inputs) {
    const input_id = client_id_input.id;
    const client_id = client_id_input.value.trim();

    if (input_id == input_id_checked) {
      if (client_id.length > 0)
        client_id_input_datas.push({ input_id, client_id, checked: true });
      else {
        alert("Error, the selected client id must not be empty");
        throw new Error("The client id of the checked input is empty");
      }
    } else {
      client_id_input_datas.push({ input_id, client_id, checked: false });
    }
  }

  return client_id_input_datas;
};

const handler_save_options_btn = async () => {
  const client_id_input_datas = getClientIdInputDatas();
  console.log("debug", client_id_input_datas);

  try {
    await setValueToLocalStorage(
      "client_id_input_datas",
      client_id_input_datas
    );
  } catch (error) {
    console.error(error);
  }
};

const save_options_btn = document.querySelector("#save-options-btn");
save_options_btn.addEventListener("click", () => {
  handler_save_options_btn();
});

const handler_add_client_id_input_btn = () => {
  // get the last id of the inputs
  const clientInputs = document.querySelectorAll(".client-id-input");
  const last_client_id_input = clientInputs[clientInputs.length - 1];
  const last_id = last_client_id_input.id;

  // data for the new input
  const data = {
    input_id: Number(last_id) + 1,
    client_id: "",
    checked: false,
  };

  // creating li element
  const li_element = create_client_id_li_element(data);

  // get parent element
  const client_id_inputs_container = document.querySelector(
    ".client-id-inputs-container"
  );

  client_id_inputs_container.insertAdjacentElement("beforeend", li_element);
};

const add_client_id_input_btn = document.querySelector(
  "#add-client-id-input-btn"
);
add_client_id_input_btn.addEventListener("click", () => {
  handler_add_client_id_input_btn();
});
