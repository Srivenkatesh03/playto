import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Comment from './Comment';

function Post({ post, detailed = false, onUpdate, onUserAction }) {
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [localPost, setLocalPost] = useState(post);
  const [isLiking, setIsLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const isAuthor = isAuthenticated && user && localPost.author.id === user.id;
  const wasEdited = localPost.updated && new Date(localPost.updated) > new Date(localPost.created);

  const handleLike = async () => {
    if (isLiking || !isAuthenticated) return;
    setIsLiking(true);

    try {
      const result = await api.likePost(localPost.id);
      setLocalPost({ ...localPost, like_count: result.like_count });
      
      // Trigger leaderboard refresh
      if (onUserAction) {
        onUserAction();
      }
    } catch (error) {
      console.error('Error liking post:', error);
      if (error.message.includes('401')) {
        alert('Please login to like posts');
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim() || !isAuthenticated) return;

    try {
      await api.createComment(localPost.id, commentContent);
      setCommentContent('');
      setShowCommentForm(false);
      
      // Update the comment count to reflect the new comment
      setLocalPost({ 
        ...localPost, 
        comment_count: (localPost.comment_count || 0) + 1 
      });
      
      // Refresh post details if in detailed view
      if (detailed && onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      if (error.message.includes('401')) {
        alert('Please login to comment');
      }
    }
  };

  const handleEdit = async () => {
    if (!editedContent.trim()) return;

    try {
      const updatedPost = await api.updatePost(localPost.id, editedContent);
      setLocalPost({ ...localPost, content: updatedPost.content, updated: updatedPost.updated });
      setIsEditing(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.deletePost(localPost.id);
      if (detailed) {
        navigate('/');
      } else if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const handleCommentAdded = () => {
    if (detailed && onUpdate) {
      onUpdate();
    }
  };

  const handleCommentClick = () => {
    if (!isAuthenticated) {
      alert('Please login to comment');
      return;
    }
    
    if (detailed) {
      // In detailed view, toggle the comment form
      setShowCommentForm(!showCommentForm);
    } else {
      // In feed view, navigate to detailed post page
      navigate(`/posts/${localPost.id}`);
    }
  };

  return (
    <div className="card-elevated p-4 md:p-6 mb-6 animate-fade-in hover:scale-[1.01] transition-all duration-300">
      {/* Post header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
          {localPost.author.username[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-base md:text-lg break-anywhere">{localPost.author.username}</div>
          <div className="text-xs md:text-sm text-gray-500">
            {new Date(localPost.created).toLocaleString()}
            {wasEdited && <span className="text-gray-400 ml-1">(edited)</span>}
          </div>
        </div>
        
        {/* Edit/Delete buttons */}
        {isAuthor && !isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(true);
                setEditedContent(localPost.content);
              }}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200"
            >
              ✏️ Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200"
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>

      {/* Post content or edit form */}
      {isEditing ? (
        <div className="mb-4">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="input-modern resize-none text-sm md:text-base"
            rows="4"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 text-sm font-medium"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-800 mb-4 text-base md:text-lg leading-relaxed break-anywhere">{localPost.content}</p>
      )}

      {/* Post actions */}
      <div className="flex items-center gap-3 md:gap-4 text-sm border-t border-gray-200 pt-4 flex-wrap">
        <button
          onClick={handleLike}
          disabled={isLiking || !isAuthenticated}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 hover:from-blue-100 hover:to-blue-200 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 font-semibold disabled:opacity-50"
        >
          <span className="text-xl md:text-2xl">👍</span>
          <span className="text-sm md:text-base">{localPost.like_count} Likes</span>
        </button>
        
        <button
          onClick={handleCommentClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 text-purple-600 hover:from-purple-100 hover:to-purple-200 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 font-semibold"
        >
          <span className="text-xl md:text-2xl">💬</span>
          <span className="text-sm md:text-base">{localPost.comment_count || 0} Comments</span>
        </button>
      </div>

      {/* Comment form */}
      {showCommentForm && (
        <form onSubmit={handleComment} className="mt-6 border-t border-gray-200 pt-6 animate-slide-up">
          <textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="Write a comment..."
            className="input-modern resize-none text-sm md:text-base"
            rows="4"
          />
          <div className="flex gap-2 md:gap-3 mt-3 flex-wrap">
            <button
              type="submit"
              className="btn-primary text-sm md:text-base"
            >
              Post Comment
            </button>
            <button
              type="button"
              onClick={() => setShowCommentForm(false)}
              className="btn-outline text-sm md:text-base"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Comments section (only in detailed view) */}
      {detailed && localPost.comments && localPost.comments.length > 0 && (
        <div className="mt-6 border-t-2 border-blue-200 pt-6">
          <h3 className="font-bold text-gray-900 mb-5 text-lg md:text-xl flex items-center gap-2">
            <span className="text-2xl">💭</span>
            Comments
          </h3>
          {localPost.comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              onCommentAdded={handleCommentAdded}
              onUserAction={onUserAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Post;
