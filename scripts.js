const API_URL = 'https://jsonplaceholder.typicode.com/posts';
const POSTS_PER_PAGE = 10;

let currentPage = 1;
let totalPosts = 0;
let currentSearchTerm = '';
let localPosts = [];

function displayMessage(message, isError = false) {
    const messageDiv = document.getElementById('message');
    messageDiv.style.display = 'block';
    messageDiv.innerText = message;
    messageDiv.className = isError ? 'error' : 'success';
    setTimeout(() => messageDiv.style.display = 'none', 3000);
}

function showLoading(show) {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.style.display = show ? 'block' : 'none';
}

async function fetchPosts(page = 1, searchTerm = '') {
    showLoading(true);
    try {
        if (localPosts.length === 0) {
            const response = await fetch(`${API_URL}?_page=1&_limit=100`);
            localPosts = await response.json();
        }
        
        let filteredPosts = localPosts;
        if (searchTerm) {
            filteredPosts = localPosts.filter(post => 
                post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                post.body.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        totalPosts = filteredPosts.length;
        const startIndex = (page - 1) * POSTS_PER_PAGE;
        const endIndex = startIndex + POSTS_PER_PAGE;
        const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
        
        displayPosts(paginatedPosts);
        updatePagination();
    } catch (error) {
        displayMessage('Failed to fetch posts.', true);
    } finally {
        showLoading(false);
    }
}

function displayPosts(posts) {
    const postsContainer = document.getElementById('postsContainer');
    postsContainer.innerHTML = '';

    if (!posts || posts.length === 0) {
        postsContainer.innerHTML = '<p>No posts available.</p>';
        return;
    }

    posts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.classList.add('post');
        postDiv.innerHTML = `
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.body)}</p>
            <button onclick="editPost(${post.id})">Edit</button>
            <button onclick="deletePost(${post.id})">Delete</button>
        `;
        postsContainer.appendChild(postDiv);
    });
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

function updatePagination() {
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = `
        <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
        <span>Page ${currentPage} of ${totalPages}</span>
        <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
    `;
}

function changePage(newPage) {
    currentPage = newPage;
    fetchPosts(currentPage, currentSearchTerm);
}

function handleSearch(event) {
    event.preventDefault();
    currentSearchTerm = document.getElementById('searchInput').value;
    currentPage = 1;
    fetchPosts(currentPage, currentSearchTerm);
}

document.getElementById('createPostForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('createTitle').value;
    const body = document.getElementById('createBody').value;
    
    showLoading(true);
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, body }),
        });
        if (response.ok) {
            const newPost = await response.json();
            newPost.id = Date.now();
            localPosts.unshift(newPost);
            displayMessage('Post created successfully!');
            fetchPosts(currentPage, currentSearchTerm);
            document.getElementById('createTitle').value = '';
            document.getElementById('createBody').value = '';
        } else {
            throw new Error('Failed to create post.');
        }
    } catch (error) {
        displayMessage('Failed to create post.', true);
    } finally {
        showLoading(false);
    }
});

function editPost(id) {
    const post = localPosts.find(p => p.id === id);
    if (post) {
        document.getElementById('updateId').value = post.id;
        document.getElementById('updateTitle').value = post.title;
        document.getElementById('updateBody').value = post.body;
        document.getElementById('updatePostFormContainer').style.display = 'block';
        document.getElementById('createPostForm').style.display = 'none';
    } else {
        displayMessage('Error: Post not found', true);
    }
}

document.getElementById('updatePostForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('updateId').value);
    const title = document.getElementById('updateTitle').value;
    const body = document.getElementById('updateBody').value;

    if (!confirm('Are you sure you want to update this post?')) {
        return;
    }

    showLoading(true);
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, title, body }),
        });
        if (response.ok) {
            const index = localPosts.findIndex(post => post.id === id);
            if (index !== -1) {
                localPosts[index] = { ...localPosts[index], title, body };
                displayMessage('Post updated successfully!');
                fetchPosts(currentPage, currentSearchTerm);
            } else {
                throw new Error('Post not found in local data.');
            }
        } else {
            throw new Error('Failed to update post.');
        }
    } catch (error) {
        displayMessage('Failed to update post.', true);
    } finally {
        showLoading(false);
        document.getElementById('updatePostFormContainer').style.display = 'none';
        document.getElementById('createPostForm').style.display = 'block';
    }
});

async function deletePost(id) {
    if (confirm('Are you sure you want to delete this post?')) {
        showLoading(true);
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                localPosts = localPosts.filter(post => post.id !== id);
                displayMessage('Post deleted successfully!');
                fetchPosts(currentPage, currentSearchTerm);
            } else {
                throw new Error('Failed to delete post.');
            }
        } catch (error) {
            displayMessage('Failed to delete post.', true);
        } finally {
            showLoading(false);
        }
    }
}

document.getElementById('searchForm').addEventListener('submit', handleSearch);

fetchPosts();
