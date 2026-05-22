package com.moodcast.moodchat.dao;

import org.apache.ibatis.annotations.Mapper;
import com.moodcast.moodchat.vo.ChatVo;

@Mapper
public interface ChatDao {
    int insertChat(ChatVo chatVo);
}