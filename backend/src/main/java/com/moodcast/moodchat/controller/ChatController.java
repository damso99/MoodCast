package com.moodcast.moodchat.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import com.moodcast.moodchat.dto.ChatMessageDto;
import com.moodcast.moodchat.service.ChatService;
import com.moodcast.moodchat.vo.ChatVo;
import com.moodcast.moodchat.vo.ChatThreadVo;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping("/messages")
    public ResponseEntity<?> messages(
        @RequestParam Long memberId,
        @RequestParam Long partnerId
    ) {
        List<ChatVo> list = chatService.selectChatMessages(memberId, partnerId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/threads")
    public ResponseEntity<?> threads(@RequestParam Long memberId) {
        List<ChatThreadVo> list = chatService.selectChatThreads(memberId);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody ChatVo chatVo) {
        ChatVo savedChat = chatService.insertChat(chatVo);
        return ResponseEntity.ok(savedChat);
    }

    @PostMapping("/read")
    public ResponseEntity<?> markMessagesAsRead(
        @RequestParam Long memberId,
        @RequestParam Long partnerId
    ) {
        int updatedCount = chatService.markMessagesAsRead(memberId, partnerId);
        if (updatedCount > 0) {
            ChatMessageDto readReceipt = new ChatMessageDto();
            readReceipt.setSenderId(partnerId.intValue());
            readReceipt.setReceiverId(memberId.intValue());
            readReceipt.setIsRead(1);
            readReceipt.setEventType("READ_RECEIPT");
            messagingTemplate.convertAndSend("/sub/chat/" + partnerId, readReceipt);
        }
        return ResponseEntity.ok(updatedCount);
    }
}
