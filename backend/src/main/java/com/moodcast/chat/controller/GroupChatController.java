package com.moodcast.chat.controller;

import com.moodcast.chat.dto.ChatRoomCreateRequestDto;
import com.moodcast.chat.dto.ChatRoomMemberInviteRequestDto;
import com.moodcast.chat.dto.ChatRoomMemberResponseDto;
import com.moodcast.chat.dto.ChatRoomMessageResponseDto;
import com.moodcast.chat.dto.ChatRoomMessageSendRequestDto;
import com.moodcast.chat.dto.ChatRoomResponseDto;
import com.moodcast.chat.service.GroupChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chat")
public class GroupChatController {

    private final GroupChatService groupChatService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/rooms")
    public ResponseEntity<ChatRoomResponseDto> createRoom(@RequestBody ChatRoomCreateRequestDto request) {
        return ResponseEntity.ok(groupChatService.createChatRoom(request));
    }

    @GetMapping("/rooms/member/{memberId}")
    public ResponseEntity<List<ChatRoomResponseDto>> getRoomsByMemberId(@PathVariable Long memberId) {
        return ResponseEntity.ok(groupChatService.getRoomsByMemberId(memberId));
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatRoomMessageResponseDto>> getMessagesByRoomId(@PathVariable Long roomId) {
        return ResponseEntity.ok(groupChatService.getMessagesByRoomId(roomId));
    }

    @PostMapping("/rooms/{roomId}/messages")
    public ResponseEntity<ChatRoomMessageResponseDto> sendMessage(
            @PathVariable Long roomId,
            @RequestBody ChatRoomMessageSendRequestDto request
    ) {
        ChatRoomMessageResponseDto savedMessage = groupChatService.saveMessage(roomId, request);
        messagingTemplate.convertAndSend("/topic/chat/rooms/" + roomId, savedMessage);
        return ResponseEntity.ok(savedMessage);
    }

    @GetMapping("/rooms/{roomId}/members")
    public ResponseEntity<List<ChatRoomMemberResponseDto>> getMembersByRoomId(@PathVariable Long roomId) {
        return ResponseEntity.ok(groupChatService.getMembersByRoomId(roomId));
    }

    @PostMapping("/rooms/{roomId}/members")
    public ResponseEntity<ChatRoomResponseDto> inviteMembers(
            @PathVariable Long roomId,
            @RequestBody ChatRoomMemberInviteRequestDto request
    ) {
        return ResponseEntity.ok(groupChatService.inviteMembers(roomId, request));
    }

    @DeleteMapping("/rooms/{roomId}/members/{memberId}")
    public ResponseEntity<Void> leaveRoom(
            @PathVariable Long roomId,
            @PathVariable Long memberId
    ) {
        groupChatService.leaveRoom(roomId, memberId);
        return ResponseEntity.noContent().build();
    }
}
