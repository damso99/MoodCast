package com.moodcast.post.vo;

import lombok.Data;

@Data
public class PostDetail {
    private Long postId;
    private Long memberId;
    private String author;
    private String title;
    private String content;
    private Long emotionId;
    private String createdAt;
    private String tags;
    private Long likes;
    private Long comments;
    private Long saves;
    private Boolean likedByMe;
    private Boolean savedByMe;
}
