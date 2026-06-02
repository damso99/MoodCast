package com.moodcast.moodchat.service;

import com.moodcast.member.dao.LoginDao;
import com.moodcast.member.vo.Member;
import com.moodcast.moodchat.dao.ChatDao;
import com.moodcast.moodchat.vo.ChatThreadVo;
import com.moodcast.moodchat.vo.ChatVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private static final String DIRECT_LEAVE_PREFIX = "__MOODCAST_DIRECT_LEAVE__::";

    private final ChatDao chatDao;
    private final LoginDao loginDao;

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

    public ChatVo deleteChatMessage(Long chatId, Long memberId) {
        if (chatId == null || memberId == null) {
            return null;
        }

        ChatVo chat = chatDao.selectChatMessageById(chatId);
        if (chat == null) {
            return null;
        }

        boolean isSender = chat.getSenderId() == memberId.intValue();
        boolean isReceiver = chat.getReceiverId() == memberId.intValue();
        if (!isSender && !isReceiver) {
            return null;
        }

        if (chat.getIsRead() == 0) {
            chatDao.deleteChatMessageGlobally(chatId);
            chat.setDeletedYn(1);
            chat.setSenderDeletedYn(1);
            chat.setReceiverDeletedYn(1);
            return chat;
        }

        if (isSender) {
            chatDao.deleteChatMessageForSender(chatId, memberId);
            chat.setSenderDeletedYn(1);
            if (chat.getReceiverDeletedYn() == 1) {
                chat.setDeletedYn(1);
            }
            return chat;
        }

        chatDao.deleteChatMessageForReceiver(chatId, memberId);
        chat.setReceiverDeletedYn(1);
        if (chat.getSenderDeletedYn() == 1) {
            chat.setDeletedYn(1);
        }
        return chat;
    }

    @Transactional
    public ChatVo leaveDirectChat(Long memberId, Long partnerId) {
        if (memberId == null || partnerId == null) {
            return null;
        }

        Member leavingMember = loginDao.findMemberById(memberId);
        Member partnerMember = loginDao.findMemberById(partnerId);
        if (leavingMember == null || partnerMember == null) {
            return null;
        }

        boolean partnerAlreadyLeft =
            chatDao.selectChatMessages(memberId, partnerId).stream()
                .anyMatch(chat ->
                    chat != null
                        && chat.getSenderId() == partnerId.intValue()
                        && chat.getContent() != null
                        && chat.getContent().startsWith(DIRECT_LEAVE_PREFIX));

        chatDao.hideDirectChatMessagesAsSender(memberId, partnerId);
        chatDao.hideDirectChatMessagesAsReceiver(memberId, partnerId);

        String displayName =
            leavingMember.getNickname() != null && !leavingMember.getNickname().isBlank()
                ? leavingMember.getNickname()
                : leavingMember.getName();
        if (displayName == null || displayName.isBlank()) {
            displayName = "회원 " + memberId;
        }

        String now = LocalDateTime.now(KOREA_ZONE).format(CHAT_TIME_FORMATTER);

        if (partnerAlreadyLeft) {
            ChatVo leaveState = new ChatVo();
            leaveState.setSenderId(memberId.intValue());
            leaveState.setReceiverId(partnerId.intValue());
            leaveState.setIsRead(1);
            leaveState.setCreatedAt(now);
            leaveState.setDeletedYn(0);
            return leaveState;
        }

        ChatVo systemChat = new ChatVo();
        systemChat.setSenderId(memberId.intValue());
        systemChat.setReceiverId(partnerId.intValue());
        systemChat.setContent(DIRECT_LEAVE_PREFIX + displayName + "님이 나갔습니다.");
        systemChat.setIsRead(1);
        systemChat.setDeletedYn(0);
        systemChat.setSenderDeletedYn(0);
        systemChat.setReceiverDeletedYn(0);
        systemChat.setCreatedAt(now);
        systemChat.setSenderHiddenAt(now);

        chatDao.insertChat(systemChat);
        return systemChat;
    }
}
