package com.moodcast.member.dao;

import com.moodcast.member.vo.AuthCode;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface SignupDao {

    int countByEmail(String email);

    int insertAuthCode(AuthCode authCodeInfo);

    AuthCode findLastAuthCode(
            @Param("targetType") String targetType,
            @Param("targetValue") String targetValue,
            @Param("purpose") String purpose
            );

    int incrementAttempt(Long authCodeId);

    int updateVerifiedAt(Long authCodeId);

    int countByPhone(String phone);

    int countAuthCodeSend(
            @Param("targetType") String targetType,
            @Param("targetValue") String targetValue,
            @Param("purpose") String purpose,
            @Param("from") LocalDateTime from
    );


}
