package com.moodcast.member.dto.login;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class LoginResponse {
    private Boolean success;
    private String message;
    // refresh token은 body가 아니라 HttpOnly Cookie로 내려줄 예정입니다.
    private String accessToken;
    private LoginMemberResponse member;
}
