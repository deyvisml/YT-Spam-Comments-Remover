/* ========= EVENTS =========*/

const add_events_to_close_modal = () => {
  /*const background_comments_modal = document.querySelector(
    ".background-comments-modal"
  );
  background_comments_modal.addEventListener("click", () => {
    document.querySelector(".comments-modal-container").remove();
  });*/

  const close_modal_btn = document.querySelector(".close-modal-btn");
  close_modal_btn.addEventListener("click", () => {
    document.querySelector(".comments-modal-container").remove();

    // enable website scroll
    document.body.style.overflow = "auto";
  });
};

const add_event_to_show_more_less_text = (
  show_more_less_text_btn,
  max_chars
) => {
  // add event to the created show-more-less-text-btn (this method allows to show more text or less text of a comment)
  show_more_less_text_btn.addEventListener("click", (event) => {
    const current_btn = event.target;
    let show_more = true;

    if (current_btn.id == "show-less") show_more = false;

    const spam_comment_id = current_btn.dataset.spamCommentId;

    const text_comment_element = document.querySelector(
      `#${spam_comment_id} .text-comment`
    );

    const full_text_comment = text_comment_element.dataset.fullTextComment;

    if (show_more) {
      text_comment_element.innerHTML = full_text_comment; // setting the full text
      current_btn.innerText = "Mostrar menos";
      current_btn.id = "show-less";
    } else {
      const truncated_text_comment =
        full_text_comment.substring(0, max_chars) + "...";
      text_comment_element.innerHTML = truncated_text_comment; // setting the full text
      current_btn.innerText = "Leer más";
      current_btn.id = "show-more";
    }
  });
};

const add_event_to_make_comment_check_its_checkbox = (comment) => {
  // add event to the created comment element (this method allows to check the checkbox clicking the comment element)
  comment.addEventListener("click", (event) => {
    // if to exclude checkbox and show-more-less-text buttons
    if (
      !event.target.classList.contains("is-spam-checkbox") &&
      !event.target.classList.contains("show-more-less-text-btn")
    ) {
      const checkbox = comment.querySelector('input[type="checkbox"]');
      checkbox.checked = checkbox.checked ? false : true;
    }
  });
};

const add_event_to_refresh_num_spam_comments_checked = () => {
  const comments_container = document.querySelector(".comments-container");

  comments_container.addEventListener("click", () => {
    console.log("change");
    const num_is_spam_checkboxes_checked = get_num_is_spam_checkboxes_checked();

    const num_selected_comments_element = document.querySelector(
      ".num-selected-comments"
    );
    num_selected_comments_element.innerText = num_is_spam_checkboxes_checked;
  });
};

const add_event_to_execute = () => {
  const execute_btn = document.querySelector(".execute-btn");

  execute_btn.addEventListener("click", () => {
    execute();
  });
};
