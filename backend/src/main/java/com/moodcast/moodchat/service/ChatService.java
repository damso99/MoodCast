package com.moodcast.moodchat.service;

import com.moodcast.moodchat.dao.ChatDao;
import com.moodcast.moodchat.vo.ChatVo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    @Autowired
    private ChatDao chatDao;

    public int insertChat(ChatVo chatVo) {
        return chatDao.insertChat(chatVo);
    }

    public List<ChatVo> selectChatList() {
        List<ChatVo> list = chatDao.selectChatList();
        return list;
    }
}