package com.moodcast.member.dto.login;

import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
public class LoginResponse {
    private Boolean success;
    private String message;
    private String accessToken;
    private LoginMemberResponse member;
    private Boolean remember;

    public LoginResponse(Boolean success, String message, String accessToken, LoginMemberResponse member) {
        this(success, message, accessToken, member, null);
    }

    public LoginResponse(Boolean success, String message, String accessToken, LoginMemberResponse member, Boolean remember) {
        this.success = success;
        this.message = message;
        this.accessToken = accessToken;
        this.member = member;
        this.remember = remember;
    }
}
