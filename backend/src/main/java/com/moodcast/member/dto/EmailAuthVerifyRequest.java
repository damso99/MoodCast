package com.moodcast.member.dto;

import lombok.Data;

@Data
public class EmailAuthVerifyRequest {
    private String email;
    private String authCode;
}
