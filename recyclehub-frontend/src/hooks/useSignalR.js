import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { SIGNALR_HUB_URL } from '../config/env';
import { getAuthToken } from '../utils/authStorage';

export const useSignalR = ({ onNotification, onMessage, onOrderChanged }) => {
  const connectionRef = useRef(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_HUB_URL, {
        accessTokenFactory: () => getAuthToken() || '',
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    if (onNotification) {
      connection.on('ReceiveNotification', onNotification);
    }
    if (onMessage) {
      connection.on('ReceiveMessage', onMessage);
    }
    if (onOrderChanged) {
      connection.on('OrderStatusChanged', onOrderChanged);
    }

    connection.start().catch((err) => {
      console.warn('SignalR connection failed:', err);
    });

    return () => {
      connection.stop();
    };
  }, [onNotification, onMessage, onOrderChanged]);

  return connectionRef;
};

export default useSignalR;
