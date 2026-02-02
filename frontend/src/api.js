const API_BASE_URL = 'http://localhost:8000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper function to handle response errors
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw { response: { data: error }, message: error.detail || 'Request failed' };
  }
  return response.json();
};

export const api = {
  // Authentication
  async register(username, email, password, password2) {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password, password2 }),
    });
    return handleResponse(response);
  },

  async login(username, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
  },

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/auth/me/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Posts
  async getPosts() {
    const response = await fetch(`${API_BASE_URL}/posts/`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async getPost(id) {
    const response = await fetch(`${API_BASE_URL}/posts/${id}/`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async createPost(content) {
    const response = await fetch(`${API_BASE_URL}/posts/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content }),
    });
    return handleResponse(response);
  },

  async updatePost(postId, content) {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content }),
    });
    return handleResponse(response);
  },

  async deletePost(postId) {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
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
    });
    return handleResponse(response);
  },

  // Comments
  async createComment(postId, content, parentId = null) {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments/`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
      body: JSON.stringify({ content }),
    });
    return handleResponse(response);
  },

  async deleteComment(commentId) {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
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
      body: JSON.stringify({ content }),
    });
    return handleResponse(response);
  },

  async likeComment(commentId) {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/like/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Leaderboard
  async getLeaderboard() {
    const response = await fetch(`${API_BASE_URL}/leaderboard/`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },
};
