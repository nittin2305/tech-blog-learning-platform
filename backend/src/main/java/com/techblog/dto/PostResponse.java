package com.techblog.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class PostResponse {
    private Long id;
    private String title;
    private String slug;
    private String content;
    private String excerpt;
    private String coverImageUrl;
    private String authorUsername;
    private Long authorId;
    private String status;
    private Integer viewCount;
    private Integer likeCount;
    private String tags;
    private Instant createdAt;
    private Instant updatedAt;
    private boolean likedByCurrentUser;
}
