"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/fetcher";
import { useRealTimeSync } from "@/hooks/useRealTimeSync";
import { MessageSquare, X } from "lucide-react";

type Channel = { id: string; name: string; type: string };

type Message = {
  id: string;
  content: string;
  createdAt: string;
  channelId?: string;
  sender: { id: string; name: string };
};

export function ChatDrawer() {
  const [open, setOpen] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  const loadChannels = useCallback(async () => {
    const r = await api<{ channels: Channel[] }>("/api/chat/channels");
    setChannels(r.channels);
    setActiveId((prev) => prev || r.channels[0]?.id || "");
  }, []);

  const loadMessages = useCallback(async () => {
    if (!activeId) return;
    const r = await api<{ messages: Message[] }>(
      `/api/chat/messages?channelId=${activeId}`
    );
    setMessages(r.messages);
  }, [activeId]);

  useEffect(() => {
    if (open) loadChannels();
  }, [open, loadChannels]);

  useEffect(() => {
    if (open && activeId) loadMessages();
  }, [open, activeId, loadMessages]);

  useRealTimeSync({
    chat_message: (payload) => {
      const m = payload as Message;
      if (m.channelId === activeId || !m.channelId) loadMessages();
    },
  });

  const send = async () => {
    if (!text.trim() || !activeId) return;
    await api("/api/chat/messages", {
      method: "POST",
      body: JSON.stringify({ channelId: activeId, content: text }),
    });
    setText("");
    loadMessages();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700"
        aria-label="Open chat"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-semibold text-slate-900">Team chat</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="flex flex-1 min-h-0">
              <div className="w-36 border-r overflow-y-auto bg-slate-50">
                {channels.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    className={`w-full text-left px-3 py-2 text-xs border-b ${
                      activeId === c.id
                        ? "bg-white font-medium text-brand-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              <div className="flex flex-1 flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {messages.map((m) => (
                    <div key={m.id} className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
                      <div className="font-medium text-slate-800 text-xs">{m.sender.name}</div>
                      <p className="text-slate-700">{m.content}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(m.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="border-t p-3 flex gap-2">
                  <input
                    className="flex-1 rounded-lg border px-3 py-2 text-sm"
                    placeholder="Type a message…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                  />
                  <Button size="sm" onClick={send}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
