/* ========= UTILS =========*/

const refresh_num_spam_comments_checked = () => {
  const num_is_spam_checkboxes = get_num_is_spam_checkboxes();
  const num_is_spam_checkboxes_checked = get_num_is_spam_checkboxes_checked();

  const num_total_comments_element = document.querySelector(
    ".num-total-comments"
  );
  const num_selected_comments_element = document.querySelector(
    ".num-selected-comments"
  );
  num_total_comments_element.innerText = num_is_spam_checkboxes;
  num_selected_comments_element.innerText = num_is_spam_checkboxes_checked;
};

const get_num_is_spam_checkboxes = () => {
  // Seleccionar todos los checkboxes
  const checkboxes = document.querySelectorAll(
    'article.comment input[type="checkbox"]'
  );

  return checkboxes.length;
};

const get_num_is_spam_checkboxes_checked = () => {
  // Seleccionar todos los checkboxes
  const checkboxes = document.querySelectorAll(
    'article.comment input[type="checkbox"]'
  );

  // Contar cuántos checkboxes están marcados
  let num_is_spam_checkboxes_checked = 0;
  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      num_is_spam_checkboxes_checked++;
    }
  });

  return num_is_spam_checkboxes_checked;
};

const get_spam_comments_id_checked = () => {
  // Seleccionar todos los checkboxes
  const checkboxes = document.querySelectorAll(
    'article.comment input[type="checkbox"]'
  );

  const spam_comments_id_checked = [];
  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      const spam_comment_id = checkbox.dataset.spamCommentId;
      spam_comments_id_checked.push(spam_comment_id);
    }
  });

  return spam_comments_id_checked;
};

/**
 * Get which was the user selected option
 * @returns the selection option by the user
 */
const get_selected_option = () => {
  const select_spam_comments_options = document.querySelector(
    ".select-spam-comments-options"
  );

  const selected_option = select_spam_comments_options.value;

  return selected_option;
};

const clear_modal_footer = () => {
  const modal_footer = document.querySelector(".modal-footer");
  modal_footer.innerHTML = "";
};

const clear_modal = () => {
  const modal_body = document.querySelector(".modal-body");
  modal_body.innerHTML = "";

  const modal_footer = document.querySelector(".modal-footer");
  modal_footer.innerHTML = "";
};
