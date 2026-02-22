package com.techblog.service;

import com.techblog.dto.CommentRequest;
import com.techblog.dto.CommentResponse;
import com.techblog.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    private final DynamoDbClient dynamoDbClient;

    @Value("${aws.dynamodb.comments-table}")
    private String commentsTable;

    public CommentResponse createComment(Long postId, CommentRequest request, User author) {
        String commentId = UUID.randomUUID().toString();
        Instant now = Instant.now();

        Map<String, AttributeValue> item = new HashMap<>();
        item.put("commentId", AttributeValue.builder().s(commentId).build());
        item.put("postId", AttributeValue.builder().s(postId.toString()).build());
        item.put("authorId", AttributeValue.builder().s(author.getId().toString()).build());
        item.put("authorUsername", AttributeValue.builder().s(author.getUsername()).build());
        item.put("content", AttributeValue.builder().s(request.getContent()).build());
        item.put("createdAt", AttributeValue.builder().s(now.toString()).build());
        item.put("isDeleted", AttributeValue.builder().bool(false).build());

        try {
            dynamoDbClient.putItem(PutItemRequest.builder()
                    .tableName(commentsTable)
                    .item(item)
                    .build());
        } catch (Exception e) {
            log.error("Failed to save comment to DynamoDB", e);
            throw new RuntimeException("Failed to save comment", e);
        }

        CommentResponse response = new CommentResponse();
        response.setId(commentId);
        response.setPostId(postId);
        response.setAuthorId(author.getId());
        response.setAuthorUsername(author.getUsername());
        response.setContent(request.getContent());
        response.setCreatedAt(now);
        return response;
    }

    public List<CommentResponse> getCommentsByPostId(Long postId) {
        try {
            QueryRequest queryRequest = QueryRequest.builder()
                    .tableName(commentsTable)
                    .indexName("postId-createdAt-index")
                    .keyConditionExpression("postId = :postId")
                    .filterExpression("isDeleted = :isDeleted")
                    .expressionAttributeValues(Map.of(
                            ":postId", AttributeValue.builder().s(postId.toString()).build(),
                            ":isDeleted", AttributeValue.builder().bool(false).build()
                    ))
                    .build();

            QueryResponse response = dynamoDbClient.query(queryRequest);
            return response.items().stream().map(this::toCommentResponse).toList();
        } catch (Exception e) {
            log.error("Failed to fetch comments from DynamoDB", e);
            return Collections.emptyList();
        }
    }

    public void deleteComment(String commentId, User currentUser) {
        try {
            Map<String, AttributeValue> key = Map.of(
                    "commentId", AttributeValue.builder().s(commentId).build()
            );

            Map<String, AttributeValue> item = dynamoDbClient.getItem(
                    GetItemRequest.builder().tableName(commentsTable).key(key).build()
            ).item();

            if (item == null || item.isEmpty()) {
                throw new IllegalArgumentException("Comment not found");
            }

            String authorId = item.get("authorId").s();
            if (!authorId.equals(currentUser.getId().toString()) && currentUser.getRole() != User.Role.ADMIN) {
                throw new AccessDeniedException("Not authorized");
            }

            dynamoDbClient.updateItem(UpdateItemRequest.builder()
                    .tableName(commentsTable)
                    .key(key)
                    .updateExpression("SET isDeleted = :del")
                    .expressionAttributeValues(Map.of(
                            ":del", AttributeValue.builder().bool(true).build()
                    ))
                    .build());
        } catch (IllegalArgumentException | AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to delete comment", e);
            throw new RuntimeException("Failed to delete comment", e);
        }
    }

    private CommentResponse toCommentResponse(Map<String, AttributeValue> item) {
        CommentResponse response = new CommentResponse();
        AttributeValue commentIdAttr = item.get("commentId");
        AttributeValue postIdAttr = item.get("postId");
        AttributeValue authorIdAttr = item.get("authorId");
        AttributeValue authorUsernameAttr = item.get("authorUsername");
        AttributeValue contentAttr = item.get("content");
        AttributeValue createdAtAttr = item.get("createdAt");
        if (commentIdAttr != null) response.setId(commentIdAttr.s());
        if (postIdAttr != null) response.setPostId(Long.parseLong(postIdAttr.s()));
        if (authorIdAttr != null) response.setAuthorId(Long.parseLong(authorIdAttr.s()));
        if (authorUsernameAttr != null) response.setAuthorUsername(authorUsernameAttr.s());
        if (contentAttr != null) response.setContent(contentAttr.s());
        if (createdAtAttr != null) response.setCreatedAt(Instant.parse(createdAtAttr.s()));
        return response;
    }
}
