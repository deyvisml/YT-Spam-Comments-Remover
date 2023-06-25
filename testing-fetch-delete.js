const api_key = "AIzaSyD9HrW-4nkzYM5QYPLk-HJzppE0iRIbdAU";
const comment_id = "1";

fetch(
  `https://youtube.googleapis.com/youtube/v3/comments?id=${comment_id}&key=${api_key}`,
  {
    method: "DELETE",
  }
)
  .then((res) => res.text()) // or res.json()
  .then((res) => console.log(res));
