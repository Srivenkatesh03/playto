from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Post, Comment, Like


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm Password")
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']

    def validate(self, attrs):
        """Validate that passwords match."""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})
        
        return attrs

    def create(self, validated_data):
        """Create a new user."""
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


class CommentSerializer(serializers.ModelSerializer):
    """Recursive serializer for nested comments."""
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'content', 'author', 'post', 'parent', 'created', 'updated', 'like_count', 'replies']
        read_only_fields = ['created', 'updated', 'like_count']

    def get_replies(self, obj):
        """
        Get nested replies. This method efficiently uses prefetched data
        to avoid N+1 queries. The replies are already loaded via prefetch_related.
        """
        if hasattr(obj, 'prefetched_replies'):
            # Use prefetched data if available
            replies = obj.prefetched_replies
        else:
            # Fallback for when prefetch is not used
            replies = obj.replies.all()
        
        return CommentSerializer(replies, many=True).data


class PostSerializer(serializers.ModelSerializer):
    """Serializer for Post model with optimized comment tree."""
    author = UserSerializer(read_only=True)
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'content', 'author', 'created', 'updated', 'like_count', 'comment_count']
        read_only_fields = ['created', 'updated', 'like_count']

    def get_comment_count(self, obj):
        """Get total comment count for the post."""
        if hasattr(obj, 'comment_count_annotated'):
            return obj.comment_count_annotated
        return obj.comments.count()


class PostDetailSerializer(PostSerializer):
    """Detailed post serializer with full comment tree."""
    comments = serializers.SerializerMethodField()

    class Meta(PostSerializer.Meta):
        fields = PostSerializer.Meta.fields + ['comments']

    def get_comments(self, obj):
        """
        Get comment tree efficiently. This builds the tree structure in Python
        after fetching all comments in a single query (via prefetch_related).
        """
        if hasattr(obj, 'all_comments'):
            # Use prefetched comments
            all_comments = obj.all_comments
        else:
            # Fallback: fetch all comments for this post
            all_comments = list(obj.comments.select_related('author').all())
        
        # Build tree structure in Python (no additional queries)
        comment_dict = {comment.id: comment for comment in all_comments}
        
        # Attach replies to their parents
        for comment in all_comments:
            comment.prefetched_replies = []
        
        root_comments = []
        for comment in all_comments:
            if comment.parent_id is None:
                root_comments.append(comment)
            elif comment.parent_id in comment_dict:
                parent = comment_dict[comment.parent_id]
                parent.prefetched_replies.append(comment)
        
        return CommentSerializer(root_comments, many=True).data


class CommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating comments."""
    class Meta:
        model = Comment
        fields = ['content', 'post', 'parent']

    def validate(self, data):
        """Validate that parent comment belongs to the same post if provided."""
        if data.get('parent') and data.get('post'):
            if data['parent'].post != data['post']:
                raise serializers.ValidationError(
                    "Parent comment must belong to the same post."
                )
        return data


class LeaderboardSerializer(serializers.Serializer):
    """Serializer for leaderboard data."""
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    karma = serializers.IntegerField()
