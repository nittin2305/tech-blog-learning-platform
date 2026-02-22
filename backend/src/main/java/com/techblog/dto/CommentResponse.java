package com.techblog.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class CommentResponse {
    private String id;
    private Long postId;
    private Long authorId;
    private String authorUsername;
    private String content;
    private Instant createdAt;
}
