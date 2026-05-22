package com.moodcast.moodchat.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
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
    public String sendMessage(@RequestBody ChatVo chatVo) {
        chatService.insertChat(chatVo);
        return "success";
    }
}
