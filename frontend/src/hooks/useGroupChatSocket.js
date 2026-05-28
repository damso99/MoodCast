import { Client } from '@stomp/stompjs';
import { useEffect, useRef, useState } from 'react';
import { groupChatWebsocketBaseUrl } from '../shared/lib/websocketUrl';

function parseMessage(frameBody) {
  try {
    return JSON.parse(frameBody);
  } catch (error) {
    console.error('그룹 채팅 메시지 파싱 실패', error);
    return null;
  }
}

export function useGroupChatSocket(memberId, activeRoomId, onMessage) {
  const clientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const activeRoomIdRef = useRef(activeRoomId);
  const onMessageRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;

    if (!clientRef.current?.connected) {
      return;
    }

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    if (!activeRoomId) {
      return;
    }

    subscriptionRef.current = clientRef.current.subscribe(
      `/topic/chat/rooms/${activeRoomId}`,
      (frame) => {
        const payload = parseMessage(frame.body);
        if (payload) {
          onMessageRef.current?.(payload);
        }
      },
    );
  }, [activeRoomId]);

  useEffect(() => {
    if (!memberId) {
      setConnected(false);
      return undefined;
    }

    const client = new Client({
      brokerURL: groupChatWebsocketBaseUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
    });

    client.onConnect = () => {
      setConnected(true);

      if (!activeRoomIdRef.current) {
        return;
      }

      subscriptionRef.current = client.subscribe(
        `/topic/chat/rooms/${activeRoomIdRef.current}`,
        (frame) => {
          const payload = parseMessage(frame.body);
          if (payload) {
            onMessageRef.current?.(payload);
          }
        },
      );
    };

    client.onWebSocketClose = () => {
      setConnected(false);
    };

    client.onStompError = (frame) => {
      console.error('그룹 채팅 STOMP 오류', frame.headers?.message || frame.body);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      setConnected(false);

      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }

      clientRef.current = null;
      client.deactivate();
    };
  }, [memberId]);

  const sendMessage = (roomId, payload) => {
    if (!clientRef.current || !clientRef.current.connected || !roomId) {
      return false;
    }

    clientRef.current.publish({
      destination: `/app/chat/rooms/${roomId}/send`,
      body: JSON.stringify(payload),
    });

    return true;
  };

  return {
    connected,
    sendMessage,
  };
}
