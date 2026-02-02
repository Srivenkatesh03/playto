const API_BASE_URL = 'http://localhost:8000/api';

// Helper function to get CSRF token from cookies
const getCookie = (name) => {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

// Initialize CSRF token
const initCSRF = async () => {
  try {
    await fetch(`${API_BASE_URL}/auth/csrf/`, {
      credentials: 'include',
    });
  } catch (error) {
    console.error('Failed to initialize CSRF token:', error);
  }
};

// Call once when module loads
initCSRF();

// Helper function to get auth headers with CSRF token
const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }
  
  return headers;
};

// Helper function to handle response errors
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw { response: { data: error }, message: error.detail || error.error || 'Request failed' };
  }
  return response.json();
};

export const api = {
  // Authentication
  async register(username, email, password, password2) {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ username, email, password, password2 }),
    });
    return handleResponse(response);
  },

  async login(username, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
  },

  async logout() {
    const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/auth/me/`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Posts
  async getPosts() {
    const response = await fetch(`${API_BASE_URL}/posts/`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return response.json();
  },

  async getPost(id) {
    const response = await fetch(`${API_BASE_URL}/posts/${id}/`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return response.json();
  },

  async createPost(content) {
    const response = await fetch(`${API_BASE_URL}/posts/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ content }),
    });
    return handleResponse(response);
  },

  async updatePost(postId, content) {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ content }),
    });
    return handleResponse(response);
  },

  async deletePost(postId) {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (response.status === 204) {
      return { success: true };
    }
    return handleResponse(response);
  },

  async likePost(postId) {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/like/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Comments
  async createComment(postId, content, parentId = null) {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ 
        content,
        post: postId,
        parent: parentId 
      }),
    });
    return handleResponse(response);
  },

  async updateComment(commentId, content) {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ content }),
    });
    return handleResponse(response);
  },

  async deleteComment(commentId) {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (response.status === 204) {
      return { success: true };
    }
    return handleResponse(response);
  },

  async replyToComment(commentId, content) {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/reply/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ content }),
    });
    return handleResponse(response);
  },

  async likeComment(commentId) {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/like/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Leaderboard
  async getLeaderboard() {
    const response = await fetch(`${API_BASE_URL}/leaderboard/`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return response.json();
  },
};
