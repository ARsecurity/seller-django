"use client";
import { useEffect, useState } from "react";
import { WS, api } from "./api";
export type Note = { id: number; title: string; body: string };
export function useNotifications(token?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  useEffect(() => {
    if (!token) { setNotes([]); return; }
    let ws: WebSocket | undefined, retry = 0, stop = false;
    api<Note[]>("notifications/", {}, token).then((data) => setNotes(data)).catch(() => {});
    const connect = () => {
      ws = new WebSocket(`${WS}/ws/notifications/?token=${encodeURIComponent(token)}`);
      ws.onopen = () => (retry = 0);
      ws.onmessage = (e) => { const note = JSON.parse(e.data) as Note; setNotes((n) => [note, ...n.filter((x) => x.id !== note.id)].slice(0, 50)); };
      ws.onclose = () => { if (!stop) setTimeout(connect, Math.min(30000, 1000 * 2 ** retry++)); };
    };
    connect();
    return () => { stop = true; ws?.close(); };
  }, [token]);
  return notes;
}
