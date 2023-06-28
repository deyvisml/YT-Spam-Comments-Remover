/**
 * Create the basic modal structure
 * @returns modal
 */
const create_modal = () => {
  const modal = document.createElement("div");
  modal.classList.add("comments-modal-container");

  modal.innerHTML = `<div class="background-comments-modal"></div>
                      <div class="comments-modal">

                        <div class="modal-header">
                          <h1>YT Spam Comments Remover</h1>
                          <a class="close-modal-btn"><i class="fa-solid fa-xmark"></i></a>
                        </div>

                        <main class="modal-body">
                        </main>

                        <div class="modal-footer">
                        </div>
                      </div>`;

  return modal;
};

/**
 * Display the modal (but firstly it's created)
 */
const display_modal_into_body = () => {
  const modal = create_modal();

  const body_element = document.querySelector("body");
  body_element.insertAdjacentElement("beforeend", modal);

  add_events_to_close_modal();
};

/* ============================================================ */
/* ============================================================ */

/**
 *
 * @param {Object} params Values that define the custom content that will be created
 * @returns custom content element
 */
const create_custom_content = (params) => {
  const { text_header, url_imge, text_footer } = params;

  const custom_content = document.createElement("div");
  custom_content.className = "custom-content-container";
  custom_content.innerHTML = `<p>${text_header}</p>
    <img
    src="${url_imge}"
    alt=""
    />
    <p>${text_footer}</p>`;

  return custom_content;
};

/**
 * Display a custom content into modal body (so firstly it's created a custom content)
 * @param {params} params Values that  define the custom content that will be created
 */
const display_custom_content_into_modal_body = (params) => {
  const custom_content = create_custom_content(params);

  const modal_body = document.querySelector(".modal-body");
  modal_body.replaceChildren(custom_content);
};

/* ============================================================ */
/* ============================================================ */

/**
 * Display an evaluating loader (this is an specfic function to display the evaluating comments loader)
 */
const display_evaluating_loader_into_modal_body = () => {
  const params = {
    text_header: "Evaluando todos los comentarios...",
    url_imge:
      "http://cdn.lowgif.com/small/dad993fb030414a7-running-pikachu-animation-pkmn-awesome-arts.gif",
    text_footer: "(Por favor espere)",
  };

  display_custom_content_into_modal_body(params);
};

/**
 * Display an executing loader, it must be use while it's executing the procces related with the option that the user choose
 * @param {string} selected_option Option that user select previosly like remove, report, etc
 * @param {integer} num_selected_comments Amount how many spam comments were selected
 */
const display_executing_loader = (selected_option, num_selected_comments) => {
  let text_header = null;

  switch (selected_option) {
    case "remove":
      text_header = `Eliminando los ${num_selected_comments} comentarios seleccionados.`;
      break;
    case "report":
      text_header = `Reportando los ${num_selected_comments} comentarios seleccionados.`;
      break;
    default:
      break;
  }

  const params = {
    text_header: text_header,
    url_imge:
      "http://cdn.lowgif.com/small/dad993fb030414a7-running-pikachu-animation-pkmn-awesome-arts.gif",
    text_footer: "(Por favor espere)",
  };

  // in this case, displaying another loader into modal body
  display_custom_content_into_modal_body(params);

  // axuiliary remove modal footer
  clear_modal_footer();
};

/**
 * Display trhe result considering the object result, if there are no error, so it displays a succed message result and in the other case an error message is displays
 * @param {Object} result An object that container if error occurrd and also a data
 */
const display_result = (result) => {
  // response fail: show into modal body the error
  if (result.errorOcurred) {
    const params = {
      text_header: "Ocurrio un error :(",
      url_imge:
        "http://icons.iconarchive.com/icons/papirus-team/papirus-status/512/dialog-error-icon.png",
      text_footer: result.data,
    };

    display_custom_content_into_modal_body(params);

    throw new Error(result.data);
  }

  // response ok: show into modal body the results
  const params = {
    text_header: "Proceso finalizado exitosamente!",
    url_imge:
      "https://www.shareicon.net/data/512x512/2017/02/24/879486_green_512x512.png",
    text_footer: result.data,
  };

  display_custom_content_into_modal_body(params);
};

/* ============================================================ */
/* ============================================================ */

/**
 * Create a comment element (HTML)
 * @param {Object} comment_data Comment data in a json format
 * @returns commment element
 */
const create_comment = (comment_data) => {
  const {
    spam_comment_id,
    photo_url,
    username,
    date_commented,
    text_comment,
    spam_categories_matched,
  } = comment_data;

  const comment = document.createElement("article");
  comment.classList.add("comment");
  comment.id = spam_comment_id;

  const max_chars = 80;
  let truncate = false;
  let text_comment_to_show = text_comment;

  if (text_comment.length > max_chars) {
    truncate = true;
    text_comment_to_show = text_comment.substring(0, max_chars) + "...";
  }

  let comment_structure = `<div class="comment-left-side comment-author-image-container">
                          <img
                            src="${photo_url}"
                            alt=""
                          />
                        </div>

                        <div class="comment-right-side">
                          <div class="container-comment-data-and-spam-categories-matched">
                            <div class="container-data">
                              <p class="username">
                                ${username} <span class="commented-date">${date_commented}</span>
                              </p>

                              <p
                                class="text-comment"
                                data-full-text-comment="${text_comment}"
                              >
                                ${text_comment_to_show}
                              </p>
                            </div>

                            <ul class="spam-categories-matched-container">`;

  for (const spam_category_matched of spam_categories_matched) {
    comment_structure += `<li class="spam-category-matched">${spam_category_matched}</li>`;
  }

  comment_structure += `
                            </ul>
                          </div>

                          <div class="is-spam-checkbox-container">
                            <input
                              type="checkbox"
                              class="is-spam-checkbox"
                              name="is-spam-checkbox"
                              data-spam-comment-id="${spam_comment_id}"
                              checked
                            />
                          </div>
                        </div>`;

  comment.innerHTML = comment_structure;

  // adding the button show-more-less-text
  if (truncate) {
    const container_data_element = comment.querySelector(".container-data");

    const show_more_less_text_btn = document.createElement("a");
    show_more_less_text_btn.className = "show-more-less-text-btn";
    show_more_less_text_btn.id = "show-more";
    show_more_less_text_btn.dataset.spamCommentId = `${spam_comment_id}`;
    show_more_less_text_btn.textContent = "Leer más";

    container_data_element.insertAdjacentElement(
      "beforeend",
      show_more_less_text_btn
    );

    add_event_to_show_more_less_text(show_more_less_text_btn, max_chars);
  }

  add_event_to_make_comment_check_its_checkbox(comment);

  return comment;
};

/**
 * Create a comments container element (HTML), it includes many comments
 * @param {Array} comments Array of comments
 * @returns comments container element
 */
const create_comments_container = (comments) => {
  const comments_container = document.createElement("div");
  comments_container.classList.add("comments-container");

  for (const comment of comments) {
    const comment_element = create_comment(comment);

    comments_container.insertAdjacentElement("beforeend", comment_element);
  }

  return comments_container;
};

/**
 * Dsiplay the comments into modal body, so firtly create a comments container with all the comments included
 * @param {Array} comments Array of comments that will be display
 */
const display_comments_into_modal_body = (comments) => {
  const comments_container = create_comments_container(comments);

  const modal_body = document.querySelector(".modal-body");
  modal_body.replaceChildren(comments_container);
};

/* ============================================================ */
/* ============================================================ */

/**
 * Create the modal footer content element (with the counter of selected comments, the user options and the execute button)
 * @param {Array} options Array of options (remove, report, etc) that the user can select
 * @returns modal footer content element
 */
const create_modal_footer_content = (options) => {
  const modal_footer_content = document.createElement("div");
  modal_footer_content.classList.add("modal-footer-content");

  const num_is_spam_checkboxes_checked = get_num_is_spam_checkboxes_checked();

  let modal_footer_content_element_structure = `
        <div class="total-count-container">
          <p>
            Selected: 
            <span class="num-selected-comments">${num_is_spam_checkboxes_checked}</span>
            /
            <span class="num-total-comments">${num_is_spam_checkboxes_checked}</span>
          </p>
        </div>

        <div class="select-and-button-container">
          <select
            name="select-spam-comments-options"
            class="select-spam-comments-options"
            id="select-spam-comments-options"
          >`;

  for (const { key, name } of options) {
    console.log(key, name);
    modal_footer_content_element_structure += `
            <option value="${key}">${name}</option>`;
  }

  modal_footer_content_element_structure += `
          </select>
          <a class="execute-btn"> Execute </a>
        </div>`;

  modal_footer_content.innerHTML = modal_footer_content_element_structure;

  return modal_footer_content;
};

/**
 * Display the modal footer content into the modal footer
 * @param {options} options Array of options like remove, report, which are the user can select to execute a proccess related to the comments
 */
const display_modal_footer_content_into_modal_footer = (options) => {
  const modal_footer_content = create_modal_footer_content(options);

  const modal_footer = document.querySelector(".modal-footer");
  modal_footer.replaceChildren(modal_footer_content);

  add_event_to_refresh_num_spam_comments_checked();
  add_event_to_execute();
};

/* ============================================================ */
/* ============================================================ */

/*
/**
 *
 * @param {Object} params Values that define the custom content that will be created
 * @returns custom content element
 
const create_custom_content = (params) => {
  const { text_header, url_imge, text_footer } = params;

  const custom_content = document.createElement("div");
  custom_content.className = "custom-content-container";
  custom_content.innerHTML = `<p>${text_header}</p>
    <img
    src="${url_imge}"
    alt=""
    />
    <p>${text_footer}</p>`;

  return custom_content;
};

/**
 * Display a custom content into modal body (so firstly it's created a custom content)
 * @param {params} params Values that  define the custom content that will be created
 
const display_custom_content_into_modal_body = (params) => {
  const custom_content = create_custom_content(params);

  const modal_body = document.querySelector(".modal-body");
  modal_body.replaceChildren(custom_content);
};
*/
