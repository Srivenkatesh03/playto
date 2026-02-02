import { useState } from 'react';
import { api } from '../api';

function Comment({ comment, onCommentAdded }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(comment.like_count);
  const [isLiking, setIsLiking] = useState(false);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      await api.replyToComment(comment.id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    try {
      const result = await api.likeComment(comment.id);
      setLocalLikeCount(result.like_count);
    } catch (error) {
      console.error('Error liking comment:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className="ml-6 mt-2 border-l-2 border-gray-200 pl-4">
      <div className="bg-white rounded-lg p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <span className="font-medium text-gray-900">{comment.author.username}</span>
              <span>•</span>
              <span>{new Date(comment.created).toLocaleString()}</span>
            </div>
            
            <p className="text-gray-800 mb-2">{comment.content}</p>
            
            <div className="flex items-center gap-3 text-sm">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <span>👍</span>
                <span>{localLikeCount}</span>
              </button>
              
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Reply
              </button>

              {hasReplies && (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {isCollapsed ? `Show ${comment.replies.length} replies` : 'Hide replies'}
                </button>
              )}
            </div>
          </div>
        </div>

        {showReplyForm && (
          <form onSubmit={handleReply} className="mt-3">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="2"
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Post Reply
              </button>
              <button
                type="button"
                onClick={() => setShowReplyForm(false)}
                className="px-4 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Nested replies */}
      {hasReplies && !isCollapsed && (
        <div className="mt-1">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              onCommentAdded={onCommentAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Comment;
