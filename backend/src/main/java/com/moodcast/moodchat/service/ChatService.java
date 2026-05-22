package com.moodcast.moodchat.service;

import com.moodcast.moodchat.dao.ChatDao;
import com.moodcast.moodchat.vo.ChatVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatDao chatDao;

    public int insertChat(ChatVo chatVo) {
        return chatDao.insertChat(chatVo);
    }
}