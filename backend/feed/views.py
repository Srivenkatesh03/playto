from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.contenttypes.models import ContentType
from django.db import IntegrityError, transaction
from django.db.models import Count, Q, Sum, Case, When, IntegerField, F, Prefetch
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny, IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from .models import Post, Comment, Like
from .serializers import (
    PostSerializer, PostDetailSerializer, CommentSerializer,
    CommentCreateSerializer, LeaderboardSerializer, UserSerializer, RegisterSerializer
)
from .permissions import IsAuthorOrReadOnly


class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination for feed."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Post model with optimized queries.
    Handles listing, creating, retrieving posts with comment trees.
    """
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """Optimize queryset with select_related for author."""
        queryset = Post.objects.select_related('author').annotate(
            comment_count_annotated=Count('comments')
        )
        return queryset

    def get_serializer_class(self):
        """Use detailed serializer for retrieve action."""
        if self.action == 'retrieve':
            return PostDetailSerializer
        return PostSerializer

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve post with full comment tree using optimized queries.
        This fetches all comments in ONE additional query (total ~3 queries).
        """
        instance = self.get_object()
        
        # Prefetch all comments for this post in one query
        # This avoids N+1 queries for nested comments
        comments = Comment.objects.filter(post=instance).select_related('author').order_by('created')
        instance.all_comments = list(comments)
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        """Set the author to the current authenticated user."""
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """
        Toggle like on a post with concurrency handling.
        Returns whether the post is now liked or unliked.
        """
        post = self.get_object()
        user = request.user
        
        content_type = ContentType.objects.get_for_model(Post)
        
        try:
            with transaction.atomic():
                like, created = Like.objects.get_or_create(
                    user=user,
                    content_type=content_type,
                    object_id=post.id
                )
                
                if not created:
                    # Unlike: delete the like
                    like.delete()
                    post.like_count = F('like_count') - 1
                    post.save(update_fields=['like_count'])
                    post.refresh_from_db()
                    return Response({
                        'liked': False,
                        'like_count': post.like_count
                    })
                else:
                    # Like: increment count
                    post.like_count = F('like_count') + 1
                    post.save(update_fields=['like_count'])
                    post.refresh_from_db()
                    return Response({
                        'liked': True,
                        'like_count': post.like_count
                    })
        except IntegrityError:
            # Handle race condition
            return Response(
                {'error': 'Concurrent modification detected. Please retry.'},
                status=status.HTTP_409_CONFLICT
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def comments(self, request, pk=None):
        """Add a comment to a post."""
        post = self.get_object()
        user = request.user
        
        serializer = CommentCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(author=user, post=post)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for Comment model."""
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def get_queryset(self):
        """Optimize queryset with select_related for author."""
        return Comment.objects.select_related('author', 'post')

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reply(self, request, pk=None):
        """Add a reply to a comment."""
        parent_comment = self.get_object()
        user = request.user
        
        data = request.data.copy()
        data['post'] = parent_comment.post.id
        data['parent'] = parent_comment.id
        
        serializer = CommentCreateSerializer(data=data)
        if serializer.is_valid():
            serializer.save(author=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """
        Toggle like on a comment with concurrency handling.
        Returns whether the comment is now liked or unliked.
        """
        comment = self.get_object()
        user = request.user
        
        content_type = ContentType.objects.get_for_model(Comment)
        
        try:
            with transaction.atomic():
                like, created = Like.objects.get_or_create(
                    user=user,
                    content_type=content_type,
                    object_id=comment.id
                )
                
                if not created:
                    # Unlike: delete the like
                    like.delete()
                    comment.like_count = F('like_count') - 1
                    comment.save(update_fields=['like_count'])
                    comment.refresh_from_db()
                    return Response({
                        'liked': False,
                        'like_count': comment.like_count
                    })
                else:
                    # Like: increment count
                    comment.like_count = F('like_count') + 1
                    comment.save(update_fields=['like_count'])
                    comment.refresh_from_db()
                    return Response({
                        'liked': True,
                        'like_count': comment.like_count
                    })
        except IntegrityError:
            # Handle race condition
            return Response(
                {'error': 'Concurrent modification detected. Please retry.'},
                status=status.HTTP_409_CONFLICT
            )


class LeaderboardViewSet(viewsets.ViewSet):
    """
    ViewSet for dynamic leaderboard calculation.
    Calculates karma from last 24 hours only.
    """
    permission_classes = [AllowAny]

    def list(self, request):
        """
        Calculate and return top 5 users by karma from last 24 hours.
        Karma: 5 points per post like, 1 point per comment like.
        """
        twenty_four_hours_ago = timezone.now() - timedelta(hours=24)
        
        # Get content types
        post_content_type = ContentType.objects.get_for_model(Post)
        comment_content_type = ContentType.objects.get_for_model(Comment)
        
        # Calculate karma using subqueries
        # For each user, sum karma from their posts' likes and comments' likes
        leaderboard = User.objects.annotate(
            # Karma from post likes (5 points each)
            post_karma=Count(
                'posts__id',
                filter=Q(
                    posts__id__in=Like.objects.filter(
                        content_type=post_content_type,
                        created__gte=twenty_four_hours_ago
                    ).values('object_id')
                ),
                distinct=True
            ) * 5,
            # Karma from comment likes (1 point each)
            comment_karma=Count(
                'comments__id',
                filter=Q(
                    comments__id__in=Like.objects.filter(
                        content_type=comment_content_type,
                        created__gte=twenty_four_hours_ago
                    ).values('object_id')
                ),
                distinct=True
            ),
            # Total karma
            total_karma=F('post_karma') + F('comment_karma')
        ).filter(
            total_karma__gt=0
        ).order_by('-total_karma')[:5]
        
        # Format response
        result = [
            {
                'user_id': user.id,
                'username': user.username,
                'karma': user.total_karma
            }
            for user in leaderboard
        ]
        
        return Response(result)


class RegisterView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    """
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        """Create a new user and log them in."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Log the user in
        login(request, user)
        
        return Response({
            'user': UserSerializer(user).data,
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    API endpoint for user login using Django's built-in authentication.
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Please provide both username and password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        login(request, user)
        return Response({
            'user': UserSerializer(user).data,
            'message': 'Login successful'
        })
    else:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    API endpoint for user logout.
    """
    logout(request)
    return Response({'message': 'Logout successful'})


class CurrentUserView(generics.RetrieveAPIView):
    """
    API endpoint to get the current authenticated user.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
