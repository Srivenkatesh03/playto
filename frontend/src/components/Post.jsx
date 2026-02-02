import { useState } from 'react';
import { api } from '../api';
import Comment from './Comment';

function Post({ post, detailed = false, onUpdate }) {
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [localPost, setLocalPost] = useState(post);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    try {
      const result = await api.likePost(localPost.id);
      setLocalPost({ ...localPost, like_count: result.like_count });
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      await api.createComment(localPost.id, commentContent);
      setCommentContent('');
      setShowCommentForm(false);
      
      // Refresh post details if in detailed view
      if (detailed && onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleCommentAdded = () => {
    if (detailed && onUpdate) {
      onUpdate();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      {/* Post header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
          {localPost.author.username[0].toUpperCase()}
        </div>
        <div>
          <div className="font-semibold text-gray-900">{localPost.author.username}</div>
          <div className="text-sm text-gray-500">{new Date(localPost.created).toLocaleString()}</div>
        </div>
      </div>

      {/* Post content */}
      <p className="text-gray-800 mb-4 text-lg">{localPost.content}</p>

      {/* Post actions */}
      <div className="flex items-center gap-4 text-sm border-t border-gray-200 pt-3">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
        >
          <span className="text-xl">👍</span>
          <span>{localPost.like_count} Likes</span>
        </button>
        
        <button
          onClick={() => setShowCommentForm(!showCommentForm)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
        >
          <span className="text-xl">💬</span>
          <span>{localPost.comment_count || 0} Comments</span>
        </button>
      </div>

      {/* Comment form */}
      {showCommentForm && (
        <form onSubmit={handleComment} className="mt-4 border-t border-gray-200 pt-4">
          <textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="Write a comment..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="3"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Post Comment
            </button>
            <button
              type="button"
              onClick={() => setShowCommentForm(false)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Comments section (only in detailed view) */}
      {detailed && localPost.comments && localPost.comments.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h3 className="font-semibold text-gray-900 mb-4">Comments</h3>
          {localPost.comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              onCommentAdded={handleCommentAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Post;
