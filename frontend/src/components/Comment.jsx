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
    <div className="ml-2 md:ml-6 mt-2 border-l-2 border-blue-200 pl-2 md:pl-4 animate-fade-in">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 mb-2 flex-wrap">
              <span className="font-semibold text-gray-900 break-anywhere">{comment.author.username}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">{new Date(comment.created).toLocaleString()}</span>
            </div>
            
            <p className="text-gray-800 mb-3 text-sm md:text-base leading-relaxed break-anywhere">{comment.content}</p>
            
            <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm flex-wrap">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 hover:from-blue-100 hover:to-blue-200 hover:scale-105 active:scale-95 transition-all duration-200 font-medium shadow-sm"
              >
                <span className="text-base">👍</span>
                <span>{localLikeCount}</span>
              </button>
              
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 text-purple-600 hover:from-purple-100 hover:to-purple-200 hover:scale-105 active:scale-95 transition-all duration-200 font-medium shadow-sm"
              >
                💬 Reply
              </button>

              {hasReplies && (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 hover:from-gray-100 hover:to-gray-200 hover:scale-105 active:scale-95 transition-all duration-200 font-medium shadow-sm"
                >
                  {isCollapsed ? `👁️ Show ${comment.replies.length}` : '🔽 Hide'}
                </button>
              )}
            </div>
          </div>
        </div>

        {showReplyForm && (
          <form onSubmit={handleReply} className="mt-4 animate-slide-up">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="input-modern resize-none text-sm md:text-base"
              rows="3"
            />
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                type="submit"
                className="px-4 md:px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 hover:shadow-lg active:scale-95 transition-all duration-200 text-sm font-medium"
              >
                Post Reply
              </button>
              <button
                type="button"
                onClick={() => setShowReplyForm(false)}
                className="px-4 md:px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 active:scale-95 transition-all duration-200 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Nested replies */}
      {hasReplies && !isCollapsed && (
        <div className="mt-2">
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
