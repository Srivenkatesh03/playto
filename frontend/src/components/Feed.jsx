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
        <div className="text-center animate-pulse-slow">
          <div className="text-6xl mb-4">⏳</div>
          <div className="text-gray-600 text-lg font-medium">Loading amazing posts...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Create post button */}
      <div className="card-elevated p-4 md:p-6 mb-6 animate-fade-in">
        {!showPostForm ? (
          <button
            onClick={() => setShowPostForm(true)}
            className="w-full text-left px-4 md:px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl text-gray-500 hover:from-blue-50 hover:to-purple-50 hover:text-gray-700 hover:shadow-md transition-all duration-300 font-medium flex items-center gap-3 group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">💭</span>
            <span className="text-base md:text-lg">What's on your mind?</span>
          </button>
        ) : (
          <form onSubmit={handleCreatePost} className="animate-scale-in">
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-xl">✍️</span>
                Share your thoughts
              </label>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind? Share something interesting..."
                className="input-modern resize-none text-sm md:text-base"
                rows="5"
                autoFocus
              />
            </div>
            <div className="flex gap-2 md:gap-3 flex-wrap">
              <button
                type="submit"
                className="btn-primary text-sm md:text-base flex items-center gap-2"
              >
                <span className="text-lg">🚀</span>
                Post
              </button>
              <button
                type="button"
                onClick={() => setShowPostForm(false)}
                className="btn-outline text-sm md:text-base"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="card-elevated p-12 text-center animate-fade-in">
          <div className="text-6xl mb-4">📝</div>
          <div className="text-xl font-semibold text-gray-700 mb-2">No posts yet!</div>
          <div className="text-gray-500">Be the first to share something amazing with the community.</div>
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
