"use client";

import { useCallback, useEffect, useRef } from "react";
import { Realtime, type ErrorInfo, type Message as AblyMessage, type RealtimeChannel, type TokenDetails, type TokenParams, type TokenRequest } from "ably";
import { supabase } from "@/lib/supabase";

export type DirectRealtimeMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

const channelName = (conversationId: string) => `nepsom:direct:${conversationId}`;

export function useDirectMessageRealtime(
  conversationId: string | null,
  onMessage: (message: DirectRealtimeMessage) => void,
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const handlerRef = useRef(onMessage);
  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!conversationId) return;
    let disposed = false;
    let client: Realtime | null = null;
    let channel: RealtimeChannel | null = null;

    client = new Realtime({
      autoConnect: false,
      authCallback: async (
        _params: TokenParams,
        callback: (error: ErrorInfo | string | null, token: TokenDetails | TokenRequest | string | null) => void,
      ) => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) throw new Error("Sign in required.");
          const response = await fetch("/api/ably-token", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ conversationId }),
          });
          if (!response.ok) throw new Error("Realtime authorization failed.");
          callback(null, await response.json() as TokenRequest);
        } catch (error) {
          callback(error instanceof Error ? error.message : "Realtime authorization failed.", null);
        }
      },
    });

    channel = client.channels.get(channelName(conversationId));
    const receive = (event: AblyMessage) => {
      const message = event.data as DirectRealtimeMessage | undefined;
      if (!disposed && message?.conversation_id === conversationId && message.id) handlerRef.current(message);
    };
    void channel.subscribe("message.created", receive);
    channelRef.current = channel;
    client.connect();

    return () => {
      disposed = true;
      channelRef.current = null;
      if (channel) void channel.unsubscribe("message.created", receive);
      client?.close();
    };
  }, [conversationId]);

  return useCallback(async (message: DirectRealtimeMessage) => {
    const channel = channelRef.current;
    if (!channel) return false;
    try {
      await channel.publish("message.created", message);
      return true;
    } catch (error) {
      console.warn("Realtime message delivery failed; database polling remains available.", error);
      return false;
    }
  }, []);
}
