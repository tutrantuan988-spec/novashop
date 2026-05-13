import { memo, useEffect, useRef, useState } from 'react';
import { Send, X, Sparkles } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

const STORAGE_KEY = 'trongdinhstore:chatMessages';

const QUICK_QUESTIONS = [
  'Ship bao lâu?',
  'Đổi trả thế nào?',
  'Thanh toán COD không?',
  'Freeship từ bao nhiêu?'
];

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [
        { role: 'assistant', content: 'Xin chào! Mình là Nova 👋 Mình có thể giúp gì cho bạn?' }
      ];
    } catch {
      return [{ role: 'assistant', content: 'Xin chào! Mình là Nova 👋 Mình có thể giúp gì cho bạn?' }];
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, loading]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!open && last?.role === 'assistant') {
      setUnreadCount((c) => c + 1);
    }
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) setUnreadCount(0);
  }, [open]);

  const send = async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi server');
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Xin lỗi, mình đang gặp sự cố. Bạn thử lại sau nhé! 🙏'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const showQuickQuestions = messages.length === 1 && !loading;

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel" role="dialog" aria-label="Chat hỗ trợ Nova">
          <div className="chat-header">
            <span>
              <Sparkles size={16} aria-hidden />
              <strong>Nova</strong>
              <span className="chat-status">Luôn sẵn sàng hỗ trợ</span>
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng chat"><X size={16} /></button>
          </div>
          <div className="chat-body">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="chat-bubble assistant chat-typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-label">Nova đang trả lời...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          {showQuickQuestions && (
            <div className="chat-quick-questions">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="chat-quick-btn"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <form
            className="chat-footer"
            onSubmit={(e) => { e.preventDefault(); send(); }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhắn tin cho Nova..."
              aria-label="Tin nhắn"
              disabled={loading}
            />
            <button type="submit" aria-label="Gửi" disabled={!input.trim() || loading}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
      <div className="chat-toggle-wrap"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {!open && showTooltip && (
          <div className="chat-tooltip">Chat với Nova 👋</div>
        )}
        {!open && unreadCount > 0 && (
          <span className="chat-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
        <button
          type="button"
          className={`chat-toggle ${!open ? 'chat-pulse' : ''}`}
          onClick={() => setOpen((p) => !p)}
          aria-label={open ? 'Đóng chat' : 'Mở chat hỗ trợ'}
          title={open ? 'Đóng chat' : 'Chat với Nova'}
        >
          {open ? <X size={22} /> : <span style={{ fontSize: 24, fontWeight: 700 }}>N</span>}
        </button>
      </div>
    </div>
  );
}

export default memo(ChatWidget);
