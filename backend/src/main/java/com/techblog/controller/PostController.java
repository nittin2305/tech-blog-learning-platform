package com.techblog.controller;

import com.techblog.dto.PostRequest;
import com.techblog.dto.PostResponse;
import com.techblog.entity.User;
import com.techblog.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<Page<PostResponse>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User currentUser
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(postService.getPublishedPosts(pageable, currentUser));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<PostResponse> getPostBySlug(
            @PathVariable String slug,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(postService.getPostBySlug(slug, currentUser));
    }

    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            @Valid @RequestBody PostRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(postService.createPost(request, currentUser));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable Long postId,
            @Valid @RequestBody PostRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(postService.updatePost(postId, request, currentUser));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal User currentUser
    ) {
        postService.deletePost(postId, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<Boolean> toggleLike(
            @PathVariable Long postId,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(postService.toggleLike(postId, currentUser));
    }
}
