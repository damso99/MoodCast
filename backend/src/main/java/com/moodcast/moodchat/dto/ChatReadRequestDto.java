package com.moodcast.moodchat.dto;

import lombok.Data;

@Data
public class ChatReadRequestDto {
    private Long memberId;
    private Long partnerId;
}
