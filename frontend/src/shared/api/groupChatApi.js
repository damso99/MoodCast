import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

export function fetchGroupChatRooms(memberId) {
  return axios.get(`${API_BASE}/chat/rooms/member/${memberId}`);
}

export function fetchGroupChatMessages(roomId, memberId) {
  return axios.get(`${API_BASE}/chat/rooms/${roomId}/messages`, {
    params: memberId ? { memberId } : undefined,
  });
}

export function createGroupChatRoom(payload) {
  return axios.post(`${API_BASE}/chat/rooms`, payload);
}

export function inviteGroupChatMembers(roomId, payload) {
  return axios.post(`${API_BASE}/chat/rooms/${roomId}/members`, payload);
}

export function leaveGroupChatRoom(roomId, memberId) {
  return axios.delete(`${API_BASE}/chat/rooms/${roomId}/members/${memberId}`);
}

export function markGroupChatRoomAsRead(roomId, memberId) {
  return axios.post(`${API_BASE}/chat/rooms/${roomId}/read`, null, {
    params: memberId ? { memberId } : undefined,
  });
}

export function deleteGroupChatMessage(roomId, messageId, memberId) {
  return axios.delete(`${API_BASE}/chat/rooms/${roomId}/messages/${messageId}`, {
    params: { memberId },
  });
}
