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
  // disable website scroll
  document.body.style.overflow = "hidden";
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
    text_footer: "(Please wait...)",
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
      text_header = `Removing the ${num_selected_comments} selected comments.`;
      break;
    case "report":
      text_header = `Reporting the ${num_selected_comments} selected comments.`;
      break;
    default:
      break;
  }

  const params = {
    text_header: text_header,
    url_imge:
      "http://cdn.lowgif.com/small/dad993fb030414a7-running-pikachu-animation-pkmn-awesome-arts.gif",
    text_footer: "(Please wait...)",
  };

  // in this case, displaying another loader into modal body
  display_custom_content_into_modal_body(params);
};

/**
 * Display trhe result considering the object result, if there are no error, so it displays a succed message result and in the other case an error message is displays
 * @param {Object} result An object that container if error occurrd and also a data
 */
const display_result = (result) => {
  // response fail: show into modal body the error
  if (result.errorOccurred) {
    const params = {
      text_header: "An error occurred :(",
      url_imge:
        "http://icons.iconarchive.com/icons/papirus-team/papirus-status/512/dialog-error-icon.png",
      text_footer: result.data,
    };

    display_custom_content_into_modal_body(params);

    throw new Error(result.data);
  }

  // response ok: show into modal body the results
  const params = {
    text_header: "Process completed successfully!",
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
  let spam_comment_id = comment_data.id;
  const photo_url = comment_data.snippet.authorProfileImageUrl ?? null;
  const username = comment_data.snippet.authorDisplayName ?? null;
  const date_commented = comment_data.snippet.publishedAt ?? null;
  const text_comment = comment_data.snippet.textOriginal ?? null; // it also could be textDisplay
  const spam_categories_matched = comment_data.spamCategoriesMet;

  // fixing error about the id (because an id must not include points (.)
  if (spam_comment_id.includes("."))
    spam_comment_id = spam_comment_id.replace(".", "POINT");

  const comment = document.createElement("article");
  comment.classList.add("comment");
  comment.id = spam_comment_id;

  const max_chars = MAX_CHARS_COMMENT;
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
    comment_structure += `<li class="${spam_category_matched}">${spam_category_matched}</li>`;
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
const create_modal_footer_content = (permissons) => {
  const modal_footer_content = document.createElement("div");
  modal_footer_content.classList.add("modal-footer-content");

  let modal_footer_content_element_structure = `
        <div class="total-count-container">
          <p>
            Selected: 
            <span class="num-selected-comments">0</span>
            /
            <span class="num-total-comments">0</span>
          </p>
        </div>

        <div class="rigurosity-slider-container">
          <label for="rigurosity">Rigurosity:</label>
          <input type="range" id="rigurosity" name="rigurosity" min="${MIN_RIGUROSITY_VALUE}" max="${MAX_RIGUROSITY_VALUE}" step="0.1" value="${INITIAL_RIGUROSITY_VALUE}">
        </div>

        <div class="select-and-button-container">
          <select
            name="select-spam-comments-options"
            class="select-spam-comments-options"
            id="select-spam-comments-options"
          >`;

  for (const { key, name } of permissons) {
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
 * @param {Array} permissons Array of options like remove, report, which are the user can select to execute a proccess related to the comments
 */
const display_execute_options_into_modal_footer = (permissons) => {
  const modal_footer_content = create_modal_footer_content(permissons);

  const modal_footer = document.querySelector(".modal-footer");
  modal_footer.replaceChildren(modal_footer_content);

  add_event_to_refresh_num_spam_comments_checked();
  add_event_to_show_comments_by_rigusority();
  add_event_to_execute();
};

/* ============================================================ */
/* ============================================================ */

/**
 * Create the user profile container considering its parameters
 * @param {Object} user_data User information obtained from the API
 * @param {Bool} is_video_author If it's the video author or not
 * @param {Array} permissons Array of permissons
 * @returns user_profile element
 */
const create_user_profile = (userdata, is_video_author, permissons) => {
  const user_data = userdata.items[0].snippet;
  const channel_photo_url = user_data.thumbnails.default.url;
  const channel_url = `https://www.youtube.com/${user_data.customUrl}`;
  const channel_name = user_data.title;

  const user_profile = document.createElement("div");
  user_profile.className = "user-profile-container";

  let user_profile_content = `<div class="channel-photo-container">
                              <img
                                src="${channel_photo_url}"
                                alt=""
                              />
                            </div>
                            <a href="${channel_url}" target="_blank" class="channel-url">${channel_name}</a>
                            <p class="video-author-info ${
                              is_video_author
                                ? "is-video-author"
                                : "is-not-video-author"
                            }">
                              [${
                                is_video_author
                                  ? "You are the author of this video"
                                  : "You are not the author of this video"
                              }]
                            </p>
                            <label class="permissons-label">Permissons:</label>
                            <ul class="user-permissons">`;
  for (const permisson of permissons) {
    user_profile_content += `<li class="permisson">${permisson.name}</li>`;
  }

  user_profile_content += `</ul>`;

  user_profile.innerHTML = user_profile_content;
  return user_profile;
};

/**
 * Dispay the user profile into modal body (so first is create a user_profile element)
 * @param {Object} user_data User information obtained from the API
 * @param {Bool} is_video_author If it's the video author or not
 * @param {Array} permissons Array of permissons
 */
const display_user_profile_into_modal_body = (
  user_data,
  is_video_author,
  permissons
) => {
  const user_profile = create_user_profile(
    user_data,
    is_video_author,
    permissons
  );

  const modal_body = document.querySelector(".modal-body");
  modal_body.replaceChildren(user_profile);
};

/* ============================================================ */
/* ============================================================ */

/**
 * Create the start buttons (change account and evalute comments)
 * @returns start buttons elements
 */
const create_start_buttons = () => {
  const start_buttons = document.createElement("div");
  start_buttons.className = "start-buttons-container";

  start_buttons.innerHTML = `<a class="change-account-btn"> Change account </a>
                            <a class="evaluate-comments-btn"> Evaluate Comments </a>`;

  return start_buttons;
};

/**
 * Display the start buttons into modal footer, so firstlly the buttons are created
 */
const display_start_buttons_into_modal_footer = () => {
  const start_buttons = create_start_buttons();

  const modal_footer = document.querySelector(".modal-footer");
  modal_footer.replaceChildren(start_buttons);

  add_event_to_evaluate_comments_btn();
  add_event_to_change_account_btn();
};

/* ============================================================ */
/* ============================================================ */
