package com.moodcast.member.dao;

import com.moodcast.member.vo.AuthCode;
import com.moodcast.member.vo.Member;
import com.moodcast.member.vo.Terms;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface SignupDao {



    int insertAuthCode(AuthCode authCodeInfo);

    AuthCode findLastAuthCode(
            @Param("targetType") String targetType,
            @Param("targetValue") String targetValue,
            @Param("purpose") String purpose
            );

    int incrementAttempt(@Param("authCodeId") Long authCodeId);

    int updateVerifiedAt(@Param("authCodeId") Long authCodeId);

    int countByEmail(@Param("email") String email);
    int countByPhone(@Param("phone") String phone);
    int countByNickname(@Param("nickname") String nickname);

    int countAuthCodeSend(
            @Param("targetType") String targetType,
            @Param("targetValue") String targetValue,
            @Param("purpose") String purpose,
            @Param("from") LocalDateTime from
    );

    List<Terms> findActiveTerms();

    List<Terms> findRequiredTerms();


    int countVerifiedEmailAuthCode(@Param("email") String email);
    int countVerifiedPhoneAuthCode(@Param("phone") String phone);

    int insertMember(Member member);

    int insertMemberTermsAgreement(
            @Param("memberId") Long memberId,
            @Param("termsId") Long termsId,
            @Param("agreed") Integer agreed
    );

    int updateAuthCodeUsed(
            @Param("targetType") String targetType,
            @Param("targetValue") String targetValue,
            @Param("purpose") String purpose
    );
}
