package com.moodcast.post.vo;

import lombok.Data;

@Data
public class CommentSummary {
    private Long commentId;
    private Long postId;
    private Long memberId;
    private String author;
    private String content;
    private String createdAt;
}
