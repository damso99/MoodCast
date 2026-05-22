package com.moodcast.moodchat.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.moodcast.moodchat.service.ChatService;
import com.moodcast.moodchat.vo.ChatVo;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chat")
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/messages")
    public ResponseEntity<?> messages() {
        return ResponseEntity.ok("연결 성공");
    }
    @PostMapping("/send")
    public String sendMessage(@RequestBody ChatVo chatVo) {
        chatService.insertChat(chatVo);
        return "success";
    }
}