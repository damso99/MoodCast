package com.moodcast.moodchat.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.moodcast.moodchat.service.ChatService;
import com.moodcast.moodchat.vo.ChatVo;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @GetMapping("/messages")
    public ResponseEntity<?> messages() {
        List<ChatVo> list = chatService.selectChatList();
        return ResponseEntity.ok(list);
    }
    @PostMapping("/send")
    public String sendMessage(@RequestBody ChatVo chatVo) {
        chatService.insertChat(chatVo);
        return "success";
    }
}