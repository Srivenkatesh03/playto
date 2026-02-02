from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from datetime import timedelta
from feed.models import Post, Comment, Like
import random


class Command(BaseCommand):
    help = 'Seed database with sample data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')
        
        # Create users
        users = []
        for i in range(10):
            username = f'user{i+1}'
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'email': f'{username}@example.com'}
            )
            if created:
                user.set_password('password123')
                user.save()
            users.append(user)
        
        self.stdout.write(f'Created {len(users)} users')
        
        # Create posts
        posts = []
        post_contents = [
            "Just finished reading an amazing book! Highly recommend.",
            "What's everyone working on this weekend?",
            "Looking for recommendations for learning Django. Any tips?",
            "Beautiful sunset today! 🌅",
            "New project launch coming soon. Stay tuned!",
            "Anyone else excited about the new tech releases?",
            "Coffee and coding - perfect combination ☕💻",
            "Just deployed my first Django app!",
            "Question: What's your favorite code editor?",
            "Weekend vibes! Time to relax and recharge.",
        ]
        
        for i, content in enumerate(post_contents):
            post = Post.objects.create(
                content=content,
                author=users[i % len(users)]
            )
            posts.append(post)
        
        self.stdout.write(f'Created {len(posts)} posts')
        
        # Create comments (some nested)
        comments = []
        comment_contents = [
            "Great post!",
            "I totally agree with this.",
            "Thanks for sharing!",
            "Interesting perspective.",
            "I have a different opinion on this.",
            "Can you elaborate more?",
            "This is really helpful!",
            "Love this!",
            "Not sure I understand.",
            "Amazing work!",
        ]
        
        for post in posts:
            # Create 3-7 top-level comments per post
            num_comments = random.randint(3, 7)
            post_comments = []
            
            for i in range(num_comments):
                comment = Comment.objects.create(
                    content=random.choice(comment_contents),
                    author=random.choice(users),
                    post=post,
                    parent=None
                )
                post_comments.append(comment)
                comments.append(comment)
            
            # Create some nested replies (1-2 levels deep)
            for comment in post_comments[:min(3, len(post_comments))]:
                # First level replies
                for _ in range(random.randint(1, 3)):
                    reply1 = Comment.objects.create(
                        content=random.choice(comment_contents),
                        author=random.choice(users),
                        post=post,
                        parent=comment
                    )
                    comments.append(reply1)
                    
                    # Second level replies (sometimes)
                    if random.random() > 0.5:
                        reply2 = Comment.objects.create(
                            content=random.choice(comment_contents),
                            author=random.choice(users),
                            post=post,
                            parent=reply1
                        )
                        comments.append(reply2)
        
        self.stdout.write(f'Created {len(comments)} comments')
        
        # Create likes (some from last 24h, some older)
        post_content_type = ContentType.objects.get_for_model(Post)
        comment_content_type = ContentType.objects.get_for_model(Comment)
        
        now = timezone.now()
        likes_count = 0
        
        # Like posts
        for post in posts:
            # Random number of likes
            num_likes = random.randint(0, len(users))
            liked_users = random.sample(users, num_likes)
            
            for user in liked_users:
                # Some likes are from last 24h, some are older
                is_recent = random.random() > 0.3  # 70% recent
                created_time = now - timedelta(hours=random.randint(0, 23)) if is_recent else now - timedelta(hours=random.randint(25, 72))
                
                try:
                    like = Like.objects.create(
                        user=user,
                        content_type=post_content_type,
                        object_id=post.id,
                    )
                    like.created = created_time
                    like.save()
                    
                    # Update denormalized like count
                    post.like_count += 1
                    likes_count += 1
                except:
                    pass  # Skip duplicates
            
            post.save()
        
        # Like comments
        for comment in comments:
            # Random number of likes
            num_likes = random.randint(0, min(5, len(users)))
            liked_users = random.sample(users, num_likes)
            
            for user in liked_users:
                # Some likes are from last 24h, some are older
                is_recent = random.random() > 0.3  # 70% recent
                created_time = now - timedelta(hours=random.randint(0, 23)) if is_recent else now - timedelta(hours=random.randint(25, 72))
                
                try:
                    like = Like.objects.create(
                        user=user,
                        content_type=comment_content_type,
                        object_id=comment.id,
                    )
                    like.created = created_time
                    like.save()
                    
                    # Update denormalized like count
                    comment.like_count += 1
                    likes_count += 1
                except:
                    pass  # Skip duplicates
            
            comment.save()
        
        self.stdout.write(f'Created {likes_count} likes')
        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
