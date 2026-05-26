package com.moodcast.post.vo;

import lombok.Data;

@Data
public class PostSummary {
    private Long postId;
    private String author;
    private String title;
    private String content;
    private Long emotionId;
    private String createdAt;
    private Long likes;
    private Long comments;
    private Boolean likedByMe;
    private Boolean savedByMe;
}