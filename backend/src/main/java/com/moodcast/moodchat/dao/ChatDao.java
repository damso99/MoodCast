package com.moodcast.moodchat.dao;

import org.apache.ibatis.annotations.Mapper;
import com.moodcast.moodchat.vo.ChatVo;

import java.util.List;

@Mapper
public interface ChatDao {
    int insertChat(ChatVo chatVo);

    List<ChatVo> selectChatList();
}