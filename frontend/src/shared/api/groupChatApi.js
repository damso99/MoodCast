import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

export function fetchGroupChatRooms(memberId) {
  return axios.get(`${API_BASE}/chat/rooms/member/${memberId}`);
}

export function fetchGroupChatMessages(roomId) {
  return axios.get(`${API_BASE}/chat/rooms/${roomId}/messages`);
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
