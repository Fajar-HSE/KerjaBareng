"use client";

import { useState, useRef, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { Send, Paperclip, Search, Circle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────── */
interface ChatRoom {
  id: string;
  name: string;
  initial: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  online: boolean;
  taskTitle?: string;
}

interface Message {
  id: number;
  senderId: string;
  text: string;
  time: string;
  isOwn: boolean;
  attachmentName?: string;
  read: boolean;
}

/* ─── Mock Data ─────────────────────────────────────────────── */
const ROOMS: ChatRoom[] = [
  { id: "1", name: "Budi Santoso",   initial: "BS", lastMessage: "Oke siap, nanti saya update progress.", lastTime: "14:32", unread: 2, online: true,  taskTitle: "Finalisasi desain landing page" },
  { id: "2", name: "Citra Ayu",      initial: "CA", lastMessage: "PR sudah saya review, ada beberapa catatan.", lastTime: "13:15", unread: 0, online: true,  taskTitle: "Review PR authentication module" },
  { id: "3", name: "Deni Ramadhan",  initial: "DR", lastMessage: "Dokumentasi sudah selesai.", lastTime: "11:00", unread: 0, online: false, taskTitle: "Update dokumentasi API v2" },
  { id: "4", name: "Eka Mulyani",    initial: "EM", lastMessage: "Maaf, ada kendala di upload test.", lastTime: "Kem.", unread: 1, online: false, taskTitle: "Testing fitur upload bukti" },
  { id: "5", name: "Fajar Laksono",  initial: "FL", lastMessage: "Cron sudah berjalan, monitoring dulu.", lastTime: "Kem.", unread: 0, online: true,  taskTitle: "Setup cron deadline checker" },
];

const MESSAGES: Record<string, Message[]> = {
  "1": [
    { id: 1,  senderId: "1", text: "Halo, update desain landing page sudah sampai mana?",          time: "14:00", isOwn: true,  read: true },
    { id: 2,  senderId: "BS", text: "Baru selesai wireframe-nya pak, lagi ngerjain mockup.",        time: "14:05", isOwn: false, read: true },
    { id: 3,  senderId: "1", text: "Oke, nanti kalau mockup selesai langsung share ya ke Figma.",  time: "14:10", isOwn: true,  read: true },
    { id: 4,  senderId: "BS", text: "Siap! Mau nanya dulu, font heading pakai Inter atau Plus Jakarta Sans?", time: "14:20", isOwn: false, read: true },
    { id: 5,  senderId: "1", text: "Pakai Inter aja, konsisten sama codebase.",                    time: "14:22", isOwn: true,  read: true },
    { id: 6,  senderId: "BS", text: "Oke siap, nanti saya update progress.",                       time: "14:32", isOwn: false, read: false, },
  ],
  "2": [
    { id: 1, senderId: "1",  text: "Citra, bisa review PR #42 hari ini?",                          time: "09:00", isOwn: true,  read: true },
    { id: 2, senderId: "CA", text: "Bisa pak, saya cek sekarang.",                                 time: "09:05", isOwn: false, read: true },
    { id: 3, senderId: "CA", text: "PR sudah saya review, ada beberapa catatan.",                  time: "13:15", isOwn: false, read: true, attachmentName: "review-notes.md" },
  ],
  "3": [
    { id: 1, senderId: "DR", text: "Dokumentasi sudah selesai, bisa dicek di Confluence.",          time: "11:00", isOwn: false, read: true },
    { id: 2, senderId: "1",  text: "Mantap, terima kasih Deni.",                                   time: "11:05", isOwn: true,  read: true },
  ],
  "4": [
    { id: 1, senderId: "1",  text: "Eka, gimana progress testing upload?",                         time: "Kem.", isOwn: true,  read: true },
    { id: 2, senderId: "EM", text: "Maaf, ada kendala di upload test. File PDF di atas 5MB error.", time: "Kem.", isOwn: false, read: false },
  ],
  "5": [
    { id: 1, senderId: "FL", text: "Cron sudah berjalan, monitoring dulu.",                        time: "Kem.", isOwn: false, read: true },
  ],
};

/* ─── Room Item ─────────────────────────────────────────────── */
function RoomItem({ room, active, onClick }: { room: ChatRoom; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
        active ? "bg-[#e8f4f8] border-r-2 border-[#1a5f7a]" : "hover:bg-slate-50 border-r-2 border-transparent"
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#1a5f7a] flex items-center justify-center">
          <span className="text-xs font-bold text-white">{room.initial}</span>
        </div>
        {room.online && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-800 truncate">{room.name}</span>
          <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-1">{room.lastTime}</span>
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">{room.lastMessage}</p>
      </div>

      {/* Unread badge */}
      {room.unread > 0 && (
        <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-[#1a5f7a] text-white text-[10px] font-bold flex items-center justify-center px-1">
          {room.unread}
        </span>
      )}
    </button>
  );
}

/* ─── Message Bubble ────────────────────────────────────────── */
function MessageBubble({ msg }: { msg: Message }) {
  return (
    <div className={cn("flex gap-2 max-w-[80%]", msg.isOwn ? "ml-auto flex-row-reverse" : "")}>
      {!msg.isOwn && (
        <div className="w-7 h-7 rounded-full bg-[#1a5f7a] flex items-center justify-center shrink-0 mt-auto mb-1">
          <span className="text-[9px] font-bold text-white">{msg.senderId}</span>
        </div>
      )}
      <div className={cn("flex flex-col gap-1", msg.isOwn ? "items-end" : "items-start")}>
        <div className={cn(
          "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
          msg.isOwn
            ? "bg-[#1a5f7a] text-white rounded-tr-sm"
            : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-card"
        )}>
          {msg.text}
          {msg.attachmentName && (
            <div className={cn(
              "flex items-center gap-1.5 mt-2 pt-2 border-t text-xs",
              msg.isOwn ? "border-white/20 text-white/80" : "border-slate-200 text-[#1a5f7a]"
            )}>
              <Paperclip size={11} />
              {msg.attachmentName}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 font-mono">{msg.time}</span>
          {msg.isOwn && (
            msg.read
              ? <CheckCircle2 size={11} className="text-[#1a5f7a]" />
              : <Circle size={11} className="text-slate-300" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function ChatPage() {
  const [activeRoom, setActiveRoom] = useState<ChatRoom>(ROOMS[0]);
  const [messages, setMessages]     = useState<Message[]>(MESSAGES[ROOMS[0].id]);
  const [input, setInput]           = useState("");
  const [search, setSearch]         = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function selectRoom(room: ChatRoom) {
    setActiveRoom(room);
    setMessages(MESSAGES[room.id] ?? []);
  }

  function sendMessage() {
    if (!input.trim()) return;
    const newMsg: Message = {
      id:       messages.length + 1,
      senderId: "1",
      text:     input.trim(),
      time:     new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      isOwn:    true,
      read:     false,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  }

  const filteredRooms = ROOMS.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell title="Chat" subtitle="Diskusi langsung dengan anggota tim">
      {/* Override padding — full height chat layout */}
      <div className="-m-6 h-[calc(100vh-60px)] flex overflow-hidden rounded-none">

        {/* ── Sidebar Rooms ── */}
        <div className="w-72 shrink-0 flex flex-col bg-white border-r border-slate-200">
          {/* Search */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Cari percakapan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Room list */}
          <div className="flex-1 overflow-y-auto">
            {filteredRooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                active={activeRoom.id === room.id}
                onClick={() => selectRoom(room)}
              />
            ))}
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
          {/* Chat header */}
          <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center gap-3 shrink-0">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-[#1a5f7a] flex items-center justify-center">
                <span className="text-xs font-bold text-white">{activeRoom.initial}</span>
              </div>
              {activeRoom.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{activeRoom.name}</p>
              {activeRoom.taskTitle && (
                <p className="text-xs text-slate-400 truncate">
                  Task: <span className="text-[#1a5f7a]">{activeRoom.taskTitle}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className={cn(
                "flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
                activeRoom.online ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", activeRoom.online ? "bg-emerald-500" : "bg-slate-400")} />
                {activeRoom.online ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-4 bg-white border-t border-slate-200 shrink-0">
            <div className="flex items-end gap-2">
              <button className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100 shrink-0">
                <Paperclip size={18} />
              </button>
              <div className="flex-1 relative">
                <textarea
                  placeholder="Tulis pesan..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  rows={1}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm resize-none outline-none focus:border-[#1a5f7a] focus:ring-2 focus:ring-[#1a5f7a]/10 transition-all bg-white max-h-32"
                  style={{ fieldSizing: "content" } as React.CSSProperties}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="btn btn-primary w-10 h-10 p-0 rounded-xl shrink-0 disabled:opacity-40"
                aria-label="Kirim pesan"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 ml-1">
              Enter untuk kirim · Shift+Enter untuk baris baru
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
