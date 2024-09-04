const API_URL = "https://jsonplaceholder.typicode.com/posts";



let totalPosts = 0;
let localPosts = [];

function displayMessage(message, isError = false) {
  const messageDiv = document.getElementById("message");
  messageDiv.style.display = "block";
  messageDiv.innerText = message;
  messageDiv.className = isError ? "error" : "success";
  setTimeout(() => (messageDiv.style.display = "none"), 3000);
}

function showLoading(show) {
  const loadingDiv = document.getElementById("loading");
  loadingDiv.style.display = show ? "block" : "none";
}

async function fetchPosts() {
  showLoading(true);
  try {
    if (localPosts.length === 0) {
      const response = await fetch(`${API_URL}`);
      localPosts = await response.json();
    }
    displayPosts(localPosts);
  } catch (error) {
    displayMessage("Failed to fetch posts.", true);
  } finally {
    showLoading(false);
  }
}

function displayPosts(posts) {
  const postsContainer = document.getElementById("postsContainer");
  postsContainer.innerHTML = "";

  if (!posts || posts.length === 0) {
    postsContainer.innerHTML = "<p>No posts available.</p>";
    return;
  }

  posts.forEach((post) => {
    const postDiv = document.createElement("div");
    postDiv.classList.add("post");
    postDiv.innerHTML = `
            <h3>${post.title}</h3>
            <p>${post.body}</p>
            <button onclick="editPost(${post.id})">Edit</button>
            <button onclick="deletePost(${post.id})">Delete</button>
        `;
    postsContainer.appendChild(postDiv);
  });
}


document.getElementById("createPostForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("createTitle").value;
    const body = document.getElementById("createBody").value;

    showLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      if (response.ok) {
        const newPost = await response.json();
        newPost.id = Date.now();
        localPosts.unshift(newPost);
        displayMessage("Post created successfully!");
        fetchPosts();
        document.getElementById("createTitle").value = "";
        document.getElementById("createBody").value = "";
      } else {
        throw new Error("Failed to create post.");
      }
    } catch (error) {
      displayMessage("Failed to create post.", true);
    } finally {
      showLoading(false);
    }
  });

function editPost(id) {
  const post = localPosts.find((p) => p.id === id);
  if (post) {
    document.getElementById("updateId").value = post.id;
    document.getElementById("updateTitle").value = post.title;
    document.getElementById("updateBody").value = post.body;
    document.getElementById("updatePostFormContainer").style.display = "block";
    document.getElementById("createPostForm").style.display = "none";
  } else {
    displayMessage("Error: Post not found", true);
  }
}

document
  .getElementById("updatePostForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById("updateId").value);
    const title = document.getElementById("updateTitle").value;
    const body = document.getElementById("updateBody").value;

    if (!confirm("Are you sure you want to update this post?")) {
      return;
    }

    showLoading(true);
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title, body }),
      });
      if (response.ok) {
        const index = localPosts.findIndex((post) => post.id === id);
        if (index !== -1) {
          localPosts[index] = { ...localPosts[index], title, body };
          displayMessage("Post updated successfully!");
          fetchPosts();
        } else {
          throw new Error("Post not found in local data.");
        }
      } else {
        throw new Error("Failed to update post.");
      }
    } catch (error) {
      displayMessage("Failed to update post.", true);
    } finally {
      showLoading(false);
      document.getElementById("updatePostFormContainer").style.display = "none";
      document.getElementById("createPostForm").style.display = "block";
    }
  });

async function deletePost(id) {
  if (confirm("Are you sure you want to delete this post?")) {
    showLoading(true);
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        localPosts = localPosts.filter((post) => post.id !== id);
        displayMessage("Post deleted successfully!");
        fetchPosts();
      } else {
        throw new Error("Failed to delete post.");
      }
    } catch (error) {
      displayMessage("Failed to delete post.", true);
    } finally {
      showLoading(false);
    }
  }
}


fetchPosts();
