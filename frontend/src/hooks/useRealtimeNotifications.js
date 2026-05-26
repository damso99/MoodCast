import { Client } from '@stomp/stompjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { websocketBaseUrl } from '../shared/lib/websocketUrl';

export function useRealtimeNotifications(memberId) {
  const clientRef = useRef(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!memberId) {
      setNotifications([]);
      return undefined;
    }

    const client = new Client({
      brokerURL: websocketBaseUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
    });

    client.onConnect = () => {
      client.subscribe(`/sub/notifications/${memberId}`, (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          if (payload?.eventType !== 'CHAT_NOTIFICATION') {
            return;
          }

          const notificationId = `${payload.eventType || 'notification'}-${payload.chatId || Date.now()}`;

          setNotifications((prevNotifications) => {
            const nextNotifications = [
              {
                id: notificationId,
                ...payload,
              },
              ...prevNotifications.filter((item) => item.id !== notificationId),
            ];

            return nextNotifications.slice(0, 20);
          });
        } catch (error) {
          console.error('채팅 알림 메시지 수신 실패', error);
        }
      });
    };

    client.onWebSocketClose = () => {
      clientRef.current = null;
    };

    client.onStompError = (frame) => {
      console.error('채팅 알림 STOMP 오류', frame.headers?.message || frame.body);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      clientRef.current = null;
      client.deactivate();
    };
  }, [memberId]);

  const unreadCount = useMemo(() => notifications.length, [notifications]);

  const removeNotification = (notificationId) => {
    setNotifications((prevNotifications) => prevNotifications.filter((item) => item.id !== notificationId));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    unreadCount,
    removeNotification,
    clearNotifications,
  };
}
