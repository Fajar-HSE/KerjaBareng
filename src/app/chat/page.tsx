"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import AppShell from "@/components/layout/AppShell";
import {
  Send, Search, Loader2, AlertTriangle,
  RefreshCw, MessageSquareOff, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */
interface Contact {
  id:          string;
  fullName:    string;
  initial:     string;
  division:    string | null;
  role:        string;
  unread:      number;
  lastMessage: string | null;
  lastTime:    string | null;
}

interface DMessage {
  id:        string;
  content:   string;
  isRead:    boolean;
  createdAt: string;
  sender:    { id: string; fullName: string };
  receiver:  { id: string; fullName: string };
}

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
function formatTime(iso: string) {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Kemarin";
  if (days < 7)  return d.toLocaleDateString("id-ID", { weekday: "short" });
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function avatarColor(role: string) {
  return role === "admin" ? "#d97706" : "#1a5f7a";
}

/* ══════════════════════════════════════════════════════════════
   CONTACT ITEM
══════════════════════════════════════════════════════════════ */
function ContactItem({
  contact,
  active,
  onClick,
}: {
  contact: Contact;
  active:  boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-r-2",
        active
          ? "bg-[#e8f4f8] border-[#1a5f7a]"
          : "hover:bg-slate-50 border-transparent"
      )}
    >
      <div className="relative shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
          style={{ backgroundColor: avatarColor(contact.role) }}
        >
          {contact.initial}
        </div>
        {contact.unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center">
            <span className="text-[9px] font-bold text-white leading-none">
              {contact.unread > 9 ? "9+" : contact.unread}
            </span>
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={cn(
            "text-sm truncate",
            contact.unread > 0 ? "font-semibold text-slate-900" : "font-medium text-slate-800"
          )}>
            {contact.fullName}
          </span>
          {contact.lastTime && (
            <span className="text-[11px] text-slate-400 font-mono shrink-0">
              {formatTime(contact.lastTime)}
            </span>
          )}
        </div>
        <p className={cn(
          "text-xs truncate mt-0.5",
          contact.unread > 0 ? "text-slate-700 font-medium" : "text-slate-400"
        )}>
          {contact.lastMessage ?? (contact.division ?? contact.role)}
        </p>
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   MESSAGE BUBBLE
══════════════════════════════════════════════════════════════ */
function MessageBubble({
  msg,
  myId,
  prevMsg,
}: {
  msg:     DMessage;
  myId:    string;
  prevMsg: DMessage | null;
}) {
  const isOwn     = msg.sender.id === myId;
  const showTime  = !prevMsg ||
    new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 5 * 60 * 1000;

  return (
    <>
      {showTime && (
        <div className="flex justify-center my-2">
          <span className="text-[11px] text-slate-400 bg-slate-100 px-3 py-0.5 rounded-full font-mono">
            {new Date(msg.createdAt).toLocaleString("id-ID", {
              day: "numeric", month: "short",
              hour: "2-digit", minute: "2-digit",
            })}
          </span>
        </div>
      )}
      <div className={cn("flex gap-2 max-w-[75%]", isOwn ? "ml-auto flex-row-reverse" : "")}>
        {!isOwn && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-auto mb-1 text-white font-bold"
            style={{ fontSize: 9, backgroundColor: "#1a5f7a" }}
          >
            {msg.sender.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className={cn("flex flex-col gap-0.5", isOwn ? "items-end" : "items-start")}>
          <div className={cn(
            "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
            isOwn
              ? "bg-[#1a5f7a] text-white rounded-tr-sm"
              : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
          )}>
            {msg.content}
          </div>
          <span className="text-[10px] text-slate-400 font-mono px-1">
            {new Date(msg.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */
export default function ChatPage() {
  const { data: session } = useSession();
  const myId = session?.user?.id ?? "";

  /* ── Contacts ── */
  const [contacts, setContacts]         = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError]     = useState("");
  const [search, setSearch]             = useState("");

  /* ── Active conversation ── */
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages]           = useState<DMessage[]>([]);
  const [msgLoading, setMsgLoading]       = useState(false);
  const [msgError, setMsgError]           = useState("");

  /* ── Compose ── */
  const [input, setInput]     = useState("");
  const [sending, setSending] = useState(false);

  const endRef       = useRef<HTMLDivElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCreatedAt = useRef<string | null>(null);

  /* ── Fetch contacts ── */
  const fetchContacts = useCallback(async () => {
    try {
      const res  = await fetch("/api/chat/contacts");
      const data = await res.json();
      if (res.ok) {
        setContacts(data.contacts ?? []);
        setContactsError("");
      } else {
        setContactsError(data.error ?? "Gagal memuat kontak.");
      }
    } catch {
      setContactsError("Gagal terhubung ke server.");
    } finally {
      setContactsLoading(false);
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  /* ── Fetch messages ── */
  const fetchMessages = useCallback(async (contactId: string, isInitial = false) => {
    if (isInitial) setMsgLoading(true);
    setMsgError("");
    try {
      const afterParam = !isInitial && lastCreatedAt.current
        ? `&after=${encodeURIComponent(lastCreatedAt.current)}`
        : "";
      const res  = await fetch(`/api/chat?withUserId=${contactId}${afterParam}`);
      const data = await res.json();
      if (!res.ok) { setMsgError(data.error ?? "Gagal memuat pesan."); return; }

      const incoming: DMessage[] = data.messages ?? [];
      if (incoming.length > 0) {
        if (isInitial) {
          setMessages(incoming);
        } else {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const fresh = incoming.filter((m) => !existingIds.has(m.id));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
        }
        lastCreatedAt.current = incoming[incoming.length - 1].createdAt;

        /* Update unread di sidebar */
        setContacts((prev) =>
          prev.map((c) =>
            c.id === contactId
              ? { ...c, unread: 0, lastMessage: incoming[incoming.length - 1].content, lastTime: incoming[incoming.length - 1].createdAt }
              : c
          )
        );
      }
    } catch {
      if (isInitial) setMsgError("Gagal terhubung ke server.");
    } finally {
      if (isInitial) setMsgLoading(false);
    }
  }, []);

  /* ── Select contact ── */
  function selectContact(contact: Contact) {
    if (activeContact?.id === contact.id) return;
    setActiveContact(contact);
    setMessages([]);
    setInput("");
    setMsgError("");
    lastCreatedAt.current = null;

    /* Clear polling lama */
    if (pollRef.current) clearInterval(pollRef.current);

    fetchMessages(contact.id, true).then(() => {
      /* Mulai polling setiap 4 detik */
      pollRef.current = setInterval(() => {
        fetchMessages(contact.id, false);
      }, 4000);
    });
  }

  /* ── Cleanup polling on unmount ── */
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  /* ── Scroll ke bawah saat pesan baru ── */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Send message ── */
  async function sendMessage() {
    if (!input.trim() || !activeContact || sending) return;
    const text = input.trim();
    setInput("");

    /* Optimistic update */
    const optimisticMsg: DMessage = {
      id:        `optimistic-${Date.now()}`,
      content:   text,
      isRead:    false,
      createdAt: new Date().toISOString(),
      sender:    { id: myId, fullName: session?.user?.name ?? "Saya" },
      receiver:  { id: activeContact.id, fullName: activeContact.fullName },
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    setSending(true);
    try {
      const res  = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ receiverId: activeContact.id, content: text }),
      });
      const data = await res.json();
      if (res.ok) {
        /* Ganti optimistic dengan pesan nyata */
        setMessages((prev) =>
          prev.map((m) => m.id === optimisticMsg.id ? data : m)
        );
        lastCreatedAt.current = data.createdAt;

        /* Update preview di sidebar */
        setContacts((prev) =>
          prev.map((c) =>
            c.id === activeContact.id
              ? { ...c, lastMessage: text, lastTime: data.createdAt }
              : c
          )
        );
      } else {
        /* Hapus optimistic jika gagal */
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        setMsgError(data.error ?? "Gagal mengirim pesan.");
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setMsgError("Gagal terhubung ke server.");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  const filteredContacts = contacts.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (c.division ?? "").toLowerCase().includes(search.toLowerCase())
  );

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <AppShell title="Chat" subtitle="Pesan langsung dengan anggota tim">
      <div className="-m-6 h-[calc(100vh-60px)] flex overflow-hidden">

        {/* ── Sidebar Contacts ───────────────────────────────── */}
        <div className="w-72 shrink-0 flex flex-col bg-white border-r border-slate-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Cari anggota tim..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {contactsLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="h-3 bg-slate-200 rounded w-3/4" />
                      <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : contactsError ? (
              <div className="p-4 flex flex-col items-center gap-2 text-center">
                <AlertTriangle size={18} className="text-red-400" />
                <p className="text-xs text-red-500">{contactsError}</p>
                <button onClick={fetchContacts} className="text-xs text-[#1a5f7a] hover:underline flex items-center gap-1">
                  <RefreshCw size={11} /> Coba lagi
                </button>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-6 flex flex-col items-center gap-2 text-center">
                <Users size={22} className="text-slate-300" />
                <p className="text-xs text-slate-400">Tidak ada anggota tim</p>
              </div>
            ) : (
              filteredContacts.map((c) => (
                <ContactItem
                  key={c.id}
                  contact={c}
                  active={activeContact?.id === c.id}
                  onClick={() => selectContact(c)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Chat Area ───────────────────────────────────────── */}
        {!activeContact ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[#f8fafc]">
            <div className="w-14 h-14 rounded-2xl bg-[#e8f4f8] flex items-center justify-center">
              <MessageSquareOff size={24} className="text-[#1a5f7a]" />
            </div>
            <p className="text-slate-600 font-medium">Pilih percakapan</p>
            <p className="text-xs text-slate-400">Klik nama anggota tim untuk mulai chat</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">

            {/* Chat header */}
            <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center gap-3 shrink-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                style={{ backgroundColor: avatarColor(activeContact.role) }}
              >
                {activeContact.initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{activeContact.fullName}</p>
                <p className="text-xs text-slate-400">
                  {activeContact.division ?? activeContact.role}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1">
              {msgLoading ? (
                <div className="flex-1 flex items-center justify-center gap-2 text-slate-400">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Memuat pesan...</span>
                </div>
              ) : msgError ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10">
                  <AlertTriangle size={18} className="text-red-400" />
                  <p className="text-sm text-red-500">{msgError}</p>
                  <button
                    onClick={() => fetchMessages(activeContact.id, true)}
                    className="text-xs text-[#1a5f7a] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw size={11} /> Coba lagi
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-16">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <Send size={18} className="text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Belum ada pesan</p>
                  <p className="text-xs text-slate-400">Mulai percakapan dengan {activeContact.fullName}</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    myId={myId}
                    prevMsg={i > 0 ? messages[i - 1] : null}
                  />
                ))
              )}
              <div ref={endRef} />
            </div>

            {/* Error send */}
            {msgError && !msgLoading && messages.length > 0 && (
              <div className="px-5 py-2 flex items-center gap-2 text-xs text-red-500 bg-red-50 border-t border-red-100">
                <AlertTriangle size={13} />
                {msgError}
              </div>
            )}

            {/* Input */}
            <div className="px-5 py-4 bg-white border-t border-slate-200 shrink-0">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    placeholder={`Pesan ke ${activeContact.fullName}...`}
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
                  disabled={!input.trim() || sending}
                  className="btn btn-primary w-10 h-10 p-0 rounded-xl shrink-0 disabled:opacity-40"
                  aria-label="Kirim pesan"
                >
                  {sending
                    ? <Loader2 size={15} className="animate-spin" />
                    : <Send size={15} />
                  }
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 ml-1">
                Enter untuk kirim · Shift+Enter untuk baris baru
              </p>
            </div>

          </div>
        )}
      </div>
    </AppShell>
  );
}
