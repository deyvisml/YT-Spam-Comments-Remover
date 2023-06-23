/**
 * Create the spam handler button element (HTML)
 * @returns button element
 */
const create_button = () => {
  const button = document.createElement("a");
  button.className = "get-spam-commment-button";

  button.innerHTML = `<i class="fa-solid fa-trash-can"></i>
                      <span>Spam comments</span>`;

  button.addEventListener("click", () => {
    buttonHandler();
  });

  return button;
};

/**
 * Dispay a button (it's firstly created inside and then display)
 */
const display_button = async () => {
  const container = await waitForElement(
    "#header > ytd-comments-header-renderer > #title",
    1000
  );

  const button = create_button();

  container.insertAdjacentElement("beforeend", button);
};
