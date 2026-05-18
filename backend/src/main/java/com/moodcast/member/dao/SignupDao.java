package com.moodcast.member.dao;

import com.moodcast.member.vo.AuthCode;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SignupDao {

    int countByEmail(String email);

    int insertAuthCode(AuthCode authCodeInfo);

    AuthCode findLastAuthCode(String email);

    int incrementAttempt(Long authCodeId);

    int updateEmailVerifiedAt(Long authCodeId);
}
