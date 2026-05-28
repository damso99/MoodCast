package com.moodcast.chat.controller;

import com.moodcast.chat.dto.ChatRoomMessageSendRequestDto;
import com.moodcast.chat.dto.ChatRoomMessageResponseDto;
import com.moodcast.chat.service.GroupChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class GroupChatStompController {

    private final SimpMessagingTemplate messagingTemplate;
    private final GroupChatService groupChatService;

    @MessageMapping("/chat/rooms/{roomId}/send")
    public void sendMessage(
            @DestinationVariable Long roomId,
            @Payload ChatRoomMessageSendRequestDto request
    ) {
        ChatRoomMessageResponseDto savedMessage = groupChatService.saveMessage(roomId, request);
        if (savedMessage == null) {
            return;
        }

        messagingTemplate.convertAndSend("/topic/chat/rooms/" + roomId, savedMessage);
    }
}
