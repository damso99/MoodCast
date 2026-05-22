package com.moodcast.moodchat.service;

import com.moodcast.moodchat.dao.ChatDao;
import com.moodcast.moodchat.vo.ChatVo;
import com.moodcast.moodchat.vo.ChatThreadVo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    @Autowired
    private ChatDao chatDao;

    public ChatVo insertChat(ChatVo chatVo) {
        chatDao.insertChat(chatVo);
        return chatVo;
    }

    public List<ChatThreadVo> selectChatThreads(Long memberId) {
        return chatDao.selectChatThreads(memberId);
    }

    public List<ChatVo> selectChatMessages(Long memberId, Long partnerId) {
        return chatDao.selectChatMessages(memberId, partnerId);
    }

    public int markMessagesAsRead(Long memberId, Long partnerId) {
        return chatDao.updateMessagesRead(memberId, partnerId);
    }
}
