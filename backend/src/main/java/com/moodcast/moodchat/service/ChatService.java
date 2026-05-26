package com.moodcast.moodchat.service;

import com.moodcast.moodchat.dao.ChatDao;
import com.moodcast.moodchat.vo.ChatVo;
import com.moodcast.moodchat.vo.ChatThreadVo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter CHAT_TIME_FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    @Autowired
    private ChatDao chatDao;

    public ChatVo insertChat(ChatVo chatVo) {
        if (chatVo == null) {
            return null;
        }

        chatVo.setCreatedAt(LocalDateTime.now(KOREA_ZONE).format(CHAT_TIME_FORMATTER));
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
