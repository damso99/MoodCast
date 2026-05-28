package com.moodcast.chat.mapper;

import com.moodcast.chat.vo.ChatMessageVo;
import com.moodcast.chat.vo.ChatRoomMemberVo;
import com.moodcast.chat.vo.ChatRoomVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface GroupChatMapper {
    int insertChatRoom(ChatRoomVo chatRoomVo);

    int upsertChatRoomMember(ChatRoomMemberVo chatRoomMemberVo);

    int softDeleteChatRoomMember(@Param("roomId") Long roomId, @Param("memberId") Long memberId);

    int softDeleteChatRoomIfEmpty(@Param("roomId") Long roomId);

    int updateChatRoomMemberLastReadAt(@Param("roomId") Long roomId, @Param("memberId") Long memberId);

    ChatRoomVo selectChatRoomById(@Param("roomId") Long roomId);

    List<ChatRoomVo> selectChatRoomsByMemberId(@Param("memberId") Long memberId);

    ChatRoomMemberVo selectActiveChatRoomMember(@Param("roomId") Long roomId, @Param("memberId") Long memberId);

    List<ChatRoomMemberVo> selectChatRoomMembersByRoomId(@Param("roomId") Long roomId);

    int countActiveChatRoomMembers(@Param("roomId") Long roomId);

    int insertChatMessage(ChatMessageVo chatMessageVo);

    ChatMessageVo selectChatMessageById(@Param("messageId") Long messageId);

    List<ChatMessageVo> selectChatMessagesByRoomId(@Param("roomId") Long roomId, @Param("memberId") Long memberId);
}
