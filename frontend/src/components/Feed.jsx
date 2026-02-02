import { useState, useEffect } from 'react';
import { api } from '../api';
import Post from './Post';

function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await api.getPosts();
      setPosts(data.results || data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      await api.createPost(newPostContent);
      setNewPostContent('');
      setShowPostForm(false);
      fetchPosts(); // Refresh the feed
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500 text-lg">Loading posts...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Create post button */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        {!showPostForm ? (
          <button
            onClick={() => setShowPostForm(true)}
            className="w-full text-left px-4 py-3 bg-gray-100 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
          >
            What's on your mind?
          </button>
        ) : (
          <form onSubmit={handleCreatePost}>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="4"
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Post
              </button>
              <button
                type="button"
                onClick={() => setShowPostForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          No posts yet. Be the first to post!
        </div>
      ) : (
        posts.map((post) => (
          <Post key={post.id} post={post} onUpdate={fetchPosts} />
        ))
      )}
    </div>
  );
}

export default Feed;
