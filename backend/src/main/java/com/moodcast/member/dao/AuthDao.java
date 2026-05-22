package com.moodcast.member.dao;

import com.moodcast.member.vo.Member;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AuthDao {
    Member findMemberByEmail(@Param("email") String email);

    Member findMemberById(@Param("memberId") Long memberId);

    int updateLastLoginAt(@Param("memberId") Long memberId);
}
