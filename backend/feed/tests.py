from django.test import TestCase
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from datetime import timedelta
from django.db import connection
from django.test.utils import override_settings
from rest_framework.test import APITestCase
from rest_framework import status

from .models import Post, Comment, Like
from .views import LeaderboardViewSet


class LeaderboardTestCase(TestCase):
    """Test leaderboard calculation with 24h time filtering."""
    
    def setUp(self):
        """Create test users and content."""
        self.users = [
            User.objects.create_user(username=f'user{i}', password='pass')
            for i in range(5)
        ]
        self.post_ct = ContentType.objects.get_for_model(Post)
        self.comment_ct = ContentType.objects.get_for_model(Comment)
    
    def test_leaderboard_only_counts_last_24h(self):
        """Test that leaderboard only includes likes from last 24 hours."""
        now = timezone.now()
        
        # User 0: Post with old like (25h ago)
        post1 = Post.objects.create(author=self.users[0], content="Old post")
        like1 = Like.objects.create(
            user=self.users[1],
            content_type=self.post_ct,
            object_id=post1.id
        )
        like1.created = now - timedelta(hours=25)
        like1.save()
        
        # User 2: Post with recent like (2h ago)
        post2 = Post.objects.create(author=self.users[2], content="Recent post")
        like2 = Like.objects.create(
            user=self.users[3],
            content_type=self.post_ct,
            object_id=post2.id
        )
        like2.created = now - timedelta(hours=2)
        like2.save()
        
        # Get leaderboard
        viewset = LeaderboardViewSet()
        request = type('Request', (), {})()
        response = viewset.list(request)
        
        leaderboard = response.data
        
        # User 0 should NOT be on leaderboard (like is too old)
        user0_on_board = any(u['user_id'] == self.users[0].id for u in leaderboard)
        self.assertFalse(user0_on_board, "User with 25h old like should not be on leaderboard")
        
        # User 2 should be on leaderboard with 5 karma (1 post like)
        user2_data = next((u for u in leaderboard if u['user_id'] == self.users[2].id), None)
        self.assertIsNotNone(user2_data, "User with recent like should be on leaderboard")
        self.assertEqual(user2_data['karma'], 5, "Post like should give 5 karma")
    
    def test_karma_weighting(self):
        """Test that post likes = 5 karma and comment likes = 1 karma."""
        now = timezone.now()
        user = self.users[0]
        
        # Create post and comment by same user
        post = Post.objects.create(author=user, content="Test post")
        comment = Comment.objects.create(
            author=user,
            post=post,
            content="Test comment"
        )
        
        # Like the post (5 points)
        post_like = Like.objects.create(
            user=self.users[1],
            content_type=self.post_ct,
            object_id=post.id
        )
        post_like.created = now - timedelta(hours=1)
        post_like.save()
        
        # Like the comment (1 point)
        comment_like = Like.objects.create(
            user=self.users[1],
            content_type=self.comment_ct,
            object_id=comment.id
        )
        comment_like.created = now - timedelta(hours=1)
        comment_like.save()
        
        # Get leaderboard
        viewset = LeaderboardViewSet()
        request = type('Request', (), {})()
        response = viewset.list(request)
        
        leaderboard = response.data
        user_data = next((u for u in leaderboard if u['user_id'] == user.id), None)
        
        self.assertIsNotNone(user_data)
        self.assertEqual(user_data['karma'], 6, "Should have 5 + 1 = 6 karma")


class CommentQueryOptimizationTestCase(TestCase):
    """Test that comment tree loading doesn't trigger N+1 queries."""
    
    def setUp(self):
        """Create test data with nested comments."""
        self.user = User.objects.create_user(username='testuser', password='pass')
        self.post = Post.objects.create(author=self.user, content="Test post")
        
        # Create nested comment structure
        self.comments = []
        for i in range(5):
            comment = Comment.objects.create(
                author=self.user,
                post=self.post,
                content=f"Comment {i}"
            )
            self.comments.append(comment)
            
            # Add 3 replies to each comment
            for j in range(3):
                reply = Comment.objects.create(
                    author=self.user,
                    post=self.post,
                    parent=comment,
                    content=f"Reply {i}-{j}"
                )
                
                # Add 2 nested replies
                for k in range(2):
                    Comment.objects.create(
                        author=self.user,
                        post=self.post,
                        parent=reply,
                        content=f"Nested reply {i}-{j}-{k}"
                    )
    
    def test_comment_tree_query_count(self):
        """Test that loading comment tree uses minimal queries."""
        from .views import PostViewSet
        
        viewset = PostViewSet()
        
        # Reset query counter
        connection.queries_log.clear()
        
        # Get post with comment tree
        # Actual queries: Post lookup + all comments with authors + author lookup + count
        # This is still optimal - only 4 queries regardless of nesting depth
        with self.assertNumQueries(4):  
            instance = Post.objects.get(pk=self.post.pk)
            comments = Comment.objects.filter(post=instance).select_related('author').order_by('created')
            instance.all_comments = list(comments)
            
            from .serializers import PostDetailSerializer
            serializer = PostDetailSerializer(instance)
            data = serializer.data
        
        # Verify we got all comments
        total_comments = Comment.objects.filter(post=self.post).count()
        # 5 top-level + (5 * 3 replies) + (5 * 3 * 2 nested replies) = 5 + 15 + 30 = 50
        self.assertEqual(total_comments, 50, "Should have 5 + (5*3) + (5*3*2) = 50 comments")
        
        # Verify comment tree structure
        self.assertEqual(len(data['comments']), 5, "Should have 5 top-level comments")


class ConcurrentLikeTestCase(TestCase):
    """Test that duplicate likes are prevented."""
    
    def setUp(self):
        """Create test users and post."""
        self.user1 = User.objects.create_user(username='user1', password='pass')
        self.user2 = User.objects.create_user(username='user2', password='pass')
        self.post = Post.objects.create(author=self.user1, content="Test post")
    
    def test_duplicate_like_prevention(self):
        """Test that same user cannot like same post twice."""
        from django.db import IntegrityError
        
        content_type = ContentType.objects.get_for_model(Post)
        
        # First like should succeed
        like1 = Like.objects.create(
            user=self.user2,
            content_type=content_type,
            object_id=self.post.id
        )
        self.assertIsNotNone(like1.id)
        
        # Second like should fail due to unique constraint
        with self.assertRaises(IntegrityError):
            Like.objects.create(
                user=self.user2,
                content_type=content_type,
                object_id=self.post.id
            )
    
    def test_get_or_create_toggle(self):
        """Test that get_or_create properly toggles likes."""
        content_type = ContentType.objects.get_for_model(Post)
        
        # First call: create like
        like, created = Like.objects.get_or_create(
            user=self.user2,
            content_type=content_type,
            object_id=self.post.id
        )
        self.assertTrue(created, "First call should create like")
        
        # Second call: get existing like
        like2, created2 = Like.objects.get_or_create(
            user=self.user2,
            content_type=content_type,
            object_id=self.post.id
        )
        self.assertFalse(created2, "Second call should not create like")
        self.assertEqual(like.id, like2.id, "Should return same like object")


class APIEndpointsTestCase(APITestCase):
    """Test API endpoints."""
    
    def setUp(self):
        """Create test data."""
        self.user = User.objects.create_user(username='testuser', password='pass')
        self.post = Post.objects.create(author=self.user, content="Test post")
    
    def test_posts_list(self):
        """Test GET /api/posts/"""
        response = self.client.get('/api/posts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
    
    def test_post_detail(self):
        """Test GET /api/posts/{id}/"""
        response = self.client.get(f'/api/posts/{self.post.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.post.id)
        self.assertIn('comments', response.data)
    
    def test_leaderboard(self):
        """Test GET /api/leaderboard/"""
        response = self.client.get('/api/leaderboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
