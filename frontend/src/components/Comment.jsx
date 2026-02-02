import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

function Comment({ comment, onCommentAdded, onUserAction }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [localComment, setLocalComment] = useState(comment);
  const [isLiking, setIsLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const { user, isAuthenticated } = useAuth();

  const isAuthor = isAuthenticated && user && localComment.author.id === user.id;
  const wasEdited = localComment.updated && new Date(localComment.updated) > new Date(localComment.created);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !isAuthenticated) return;

    try {
      await api.replyToComment(localComment.id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error('Error posting reply:', error);
      if (error.message.includes('401')) {
        alert('Please login to reply');
      }
    }
  };

  const handleLike = async () => {
    if (isLiking || !isAuthenticated) return;
    setIsLiking(true);

    try {
      const result = await api.likeComment(localComment.id);
      setLocalComment({ ...localComment, like_count: result.like_count });
      
      // Trigger leaderboard refresh
      if (onUserAction) {
        onUserAction();
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      if (error.message.includes('401')) {
        alert('Please login to like comments');
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleEdit = async () => {
    if (!editedContent.trim()) return;

    try {
      const updatedComment = await api.updateComment(localComment.id, editedContent);
      setLocalComment({ ...localComment, content: updatedComment.content, updated: updatedComment.updated });
      setIsEditing(false);
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.deleteComment(localComment.id);
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const handleReplyClick = () => {
    if (!isAuthenticated) {
      alert('Please login to reply');
      return;
    }
    setShowReplyForm(!showReplyForm);
  };

  const hasReplies = localComment.replies && localComment.replies.length > 0;

  return (
    <div className="ml-2 md:ml-6 mt-2 border-l-2 border-blue-200 pl-2 md:pl-4 animate-fade-in">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 mb-2 flex-wrap">
              <span className="font-semibold text-gray-900 break-anywhere">{localComment.author.username}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">
                {new Date(localComment.created).toLocaleString()}
                {wasEdited && <span className="text-gray-400 ml-1">(edited)</span>}
              </span>
            </div>
            
            {/* Comment content or edit form */}
            {isEditing ? (
              <div className="mb-3">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="input-modern resize-none text-sm md:text-base"
                  rows="3"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-xs font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 border-2 border-gray-300 text-gray-700 rounded-lg text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 mb-3 text-sm md:text-base leading-relaxed break-anywhere">{localComment.content}</p>
            )}
            
            <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm flex-wrap">
              <button
                onClick={handleLike}
                disabled={isLiking || !isAuthenticated}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 hover:from-blue-100 hover:to-blue-200 hover:scale-105 active:scale-95 transition-all duration-200 font-medium shadow-sm disabled:opacity-50"
              >
                <span className="text-base">👍</span>
                <span>{localComment.like_count}</span>
              </button>
              
              <button
                onClick={handleReplyClick}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 text-purple-600 hover:from-purple-100 hover:to-purple-200 hover:scale-105 active:scale-95 transition-all duration-200 font-medium shadow-sm"
              >
                💬 Reply
              </button>

              {isAuthor && !isEditing && (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditedContent(localComment.content);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 hover:from-gray-100 hover:to-gray-200 hover:scale-105 active:scale-95 transition-all duration-200 font-medium shadow-sm"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-50 to-red-100 text-red-600 hover:from-red-100 hover:to-red-200 hover:scale-105 active:scale-95 transition-all duration-200 font-medium shadow-sm"
                  >
                    🗑️ Delete
                  </button>
                </>
              )}

              {hasReplies && (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 hover:from-gray-100 hover:to-gray-200 hover:scale-105 active:scale-95 transition-all duration-200 font-medium shadow-sm"
                >
                  {isCollapsed ? `👁️ Show ${localComment.replies.length}` : '🔽 Hide'}
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
          {localComment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              onCommentAdded={onCommentAdded}
              onUserAction={onUserAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Comment;
