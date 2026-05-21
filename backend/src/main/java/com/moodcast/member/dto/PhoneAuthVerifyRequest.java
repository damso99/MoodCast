package com.moodcast.member.dto;

import lombok.Data;

@Data
public class PhoneAuthVerifyRequest {
    private String phone;
    private String authCode;
}
