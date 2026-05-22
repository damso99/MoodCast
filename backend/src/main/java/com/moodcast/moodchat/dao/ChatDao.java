package com.moodcast.moodchat.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.moodcast.moodchat.vo.ChatVo;
import com.moodcast.moodchat.vo.ChatThreadVo;

import java.util.List;

@Mapper
public interface ChatDao {
    int insertChat(ChatVo chatVo);

    List<ChatThreadVo> selectChatThreads(@Param("memberId") Long memberId);

    List<ChatVo> selectChatMessages(
        @Param("memberId") Long memberId,
        @Param("partnerId") Long partnerId
    );

    int updateMessagesRead(
        @Param("memberId") Long memberId,
        @Param("partnerId") Long partnerId
    );
}
