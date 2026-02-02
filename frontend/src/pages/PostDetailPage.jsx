import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import Post from '../components/Post';

function PostDetailPage({ onUserAction }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getPost(id);
      setPost(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/')}
            className="mb-6 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-gray-700 font-medium"
          >
            <span>←</span> Back to Feed
          </button>
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center animate-pulse-slow">
              <div className="text-6xl mb-4">⏳</div>
              <div className="text-gray-600 text-lg font-medium">Loading post...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/')}
            className="mb-6 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-gray-700 font-medium"
          >
            <span>←</span> Back to Feed
          </button>
          <div className="card-elevated p-12 text-center">
            <div className="text-6xl mb-4">😕</div>
            <div className="text-xl font-semibold text-gray-700 mb-2">Post not found</div>
            <div className="text-gray-500">The post you're looking for doesn't exist or has been removed.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="mb-6 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-gray-700 font-medium hover:bg-gray-50"
        >
          <span>←</span> Back to Feed
        </button>
        <Post post={post} detailed={true} onUpdate={fetchPost} onUserAction={onUserAction} />
      </div>
    </div>
  );
}

export default PostDetailPage;
