const API_BASE_URL = 'http://localhost:8000/api';

export const api = {
  // Posts
  async getPosts() {
    const response = await fetch(`${API_BASE_URL}/posts/`);
    return response.json();
  },

  async getPost(id) {
    const response = await fetch(`${API_BASE_URL}/posts/${id}/`);
    return response.json();
  },

  async createPost(content) {
    const response = await fetch(`${API_BASE_URL}/posts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    return response.json();
  },

  async likePost(postId) {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/like/`, {
      method: 'POST',
    });
    return response.json();
  },

  // Comments
  async createComment(postId, content, parentId = null) {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        content,
        post: postId,
        parent: parentId 
      }),
    });
    return response.json();
  },

  async replyToComment(commentId, content) {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/reply/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    return response.json();
  },

  async likeComment(commentId) {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/like/`, {
      method: 'POST',
    });
    return response.json();
  },

  // Leaderboard
  async getLeaderboard() {
    const response = await fetch(`${API_BASE_URL}/leaderboard/`);
    return response.json();
  },
};
