package com.moodcast.member.dto.login;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class LoginResult {
    private String accessToken;
    private String refreshToken;
    private LoginMemberResponse member;
}
