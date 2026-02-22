package com.techblog.service;

import com.techblog.dto.PostRequest;
import com.techblog.dto.PostResponse;
import com.techblog.entity.Post;
import com.techblog.entity.PostLike;
import com.techblog.entity.User;
import com.techblog.repository.PostLikeRepository;
import com.techblog.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final FirehoseService firehoseService;

    @Transactional(readOnly = true)
    @Cacheable(value = "posts", key = "'page:' + #pageable.pageNumber")
    public Page<PostResponse> getPublishedPosts(Pageable pageable, User currentUser) {
        return postRepository.findByStatus(Post.Status.PUBLISHED, pageable)
                .map(post -> toResponse(post, currentUser));
    }

    @Transactional
    public PostResponse getPostBySlug(String slug, User currentUser) {
        Post post = postRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Post not found: " + slug));
        postRepository.incrementViewCount(post.getId());
        firehoseService.sendEvent("post_view", "{\"postId\":\"" + post.getId() + "\",\"slug\":\"" + slug + "\"}");
        return toResponse(post, currentUser);
    }

    @Transactional
    @CacheEvict(value = "posts", allEntries = true)
    public PostResponse createPost(PostRequest request, User author) {
        String slug = generateSlug(request.getTitle());
        String baseSlug = slug;
        int counter = 1;
        while (postRepository.findBySlug(slug).isPresent()) {
            slug = baseSlug + "-" + counter++;
        }

        Post.Status status = Post.Status.DRAFT;
        if ("PUBLISHED".equalsIgnoreCase(request.getStatus())) {
            status = Post.Status.PUBLISHED;
        }

        Post post = Post.builder()
                .title(request.getTitle())
                .slug(slug)
                .content(request.getContent())
                .excerpt(request.getExcerpt())
                .coverImageUrl(request.getCoverImageUrl())
                .author(author)
                .status(status)
                .tags(request.getTags())
                .viewCount(0)
                .likeCount(0)
                .build();

        Post saved = postRepository.save(post);
        firehoseService.sendEvent("post_create",
                "{\"postId\":\"" + saved.getId() + "\",\"authorId\":\"" + author.getId() + "\"}");
        return toResponse(saved, author);
    }

    @Transactional
    @CacheEvict(value = "posts", allEntries = true)
    public PostResponse updatePost(Long postId, PostRequest request, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (!post.getAuthor().getId().equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("Not authorized to update this post");
        }

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setExcerpt(request.getExcerpt());
        post.setCoverImageUrl(request.getCoverImageUrl());
        post.setTags(request.getTags());
        if (request.getStatus() != null) {
            post.setStatus(Post.Status.valueOf(request.getStatus().toUpperCase()));
        }

        return toResponse(postRepository.save(post), currentUser);
    }

    @Transactional
    @CacheEvict(value = "posts", allEntries = true)
    public void deletePost(Long postId, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (!post.getAuthor().getId().equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("Not authorized to delete this post");
        }

        postRepository.delete(post);
    }

    @Transactional
    @CacheEvict(value = "posts", allEntries = true)
    public boolean toggleLike(Long postId, User user) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        Optional<PostLike> existingLike = postLikeRepository.findByPostIdAndUserId(postId, user.getId());
        if (existingLike.isPresent()) {
            postLikeRepository.delete(existingLike.get());
            postRepository.decrementLikeCount(postId);
            return false;
        } else {
            PostLike like = PostLike.builder().post(post).user(user).build();
            postLikeRepository.save(like);
            postRepository.incrementLikeCount(postId);
            return true;
        }
    }

    private PostResponse toResponse(Post post, User currentUser) {
        PostResponse response = new PostResponse();
        response.setId(post.getId());
        response.setTitle(post.getTitle());
        response.setSlug(post.getSlug());
        response.setContent(post.getContent());
        response.setExcerpt(post.getExcerpt());
        response.setCoverImageUrl(post.getCoverImageUrl());
        response.setAuthorUsername(post.getAuthor().getUsername());
        response.setAuthorId(post.getAuthor().getId());
        response.setStatus(post.getStatus().name());
        response.setViewCount(post.getViewCount());
        response.setLikeCount(post.getLikeCount());
        response.setTags(post.getTags());
        response.setCreatedAt(post.getCreatedAt());
        response.setUpdatedAt(post.getUpdatedAt());
        if (currentUser != null) {
            response.setLikedByCurrentUser(
                    postLikeRepository.existsByPostIdAndUserId(post.getId(), currentUser.getId())
            );
        }
        return response;
    }

    private String generateSlug(String title) {
        String normalized = Normalizer.normalize(title, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(normalized)
                .replaceAll("")
                .toLowerCase(Locale.ENGLISH)
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("[\\s-]+", "-")
                .replaceAll("^-|-$", "");
    }
}
