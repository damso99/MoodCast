package com.moodcast.member.dao;

import com.moodcast.member.vo.Member;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface LoginDao {

    Member findMemberByEmail(String email);

    int updateLastLoginAt(Long memberId);

    String findPasswordHashByEmail(String email);

    Member findMemberById(Long memberId);
}
