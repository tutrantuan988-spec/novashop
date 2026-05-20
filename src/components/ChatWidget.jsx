import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Eraser, Send, Sparkles, X, Zap } from 'lucide-react';
import { isBackendConfigured } from '../services/api';
import SITE from '../config/site-config';

const STORAGE_KEY = 'chatMessages_v2';
const BACKEND_OK = isBackendConfigured();

const WELCOME = { role: 'assistant', content: `Xin chao! Minh la tro ly AI cua ${SITE.name}.\n\nMình có thể giúp bạn **tư vấn sản phẩm**, **so sánh giá**, hoặc giải đáp mọi câu hỏi. Bạn cần hỏi gì nào?` };

const QUICK_QUESTIONS = [
  '🛍️ Sản phẩm nào đang hot?',
  '🚚 Freeship từ bao nhiêu?',
  '↩️ Đổi trả như thế nào?',
  '💳 Thanh toán ra sao?',
  '⚡ Giao hàng mất bao lâu?',
  '📦 Theo dõi đơn hàng?',
];

const SUGGESTED_REPLIES = {
  freeship:   ['Đơn tôi đã đủ 300k chưa?', 'Giao hàng mất bao lâu?'],
  doi_tra:    ['Cách tạo yêu cầu đổi trả', 'Điều kiện hàng được đổi'],
  gia:        ['Sản phẩm nào giá tốt?', 'Có khuyến mãi gì không?'],
  san_pham:   ['Có sản phẩm mới không?', 'Gợi ý sản phẩm hot'],
  thanh_toan: ['Có thanh toán COD không?', 'Chuyển khoản được không?'],
  don_hang:   ['Làm sao theo dõi đơn hàng?', 'Đơn hàng của tôi ở đâu?'],
};

function localNovaReply(text) {
  const t = text.toLowerCase();
  if (t.includes('đăng nhập') || t.includes('login') || t.includes('tài khoản')) {
    return 'Bạn bấm nút **Đăng nhập** màu cam trên thanh đầu trang. Nếu chưa có tài khoản, chọn **Đăng ký ngay** trong form đăng nhập nhé.';
  }
  if (t.includes('thanh toán') || t.includes('cod') || t.includes('chuyển khoản') || t.includes('visa') || t.includes('stripe')) {
    return `Shop hỗ trợ **COD khi nhận hàng** và **chuyển khoản MBBank**. ${SITE.name} đang tích hợp thêm thanh toán online đa dạng.`;
  }
  if (t.includes('giao') || t.includes('ship') || t.includes('freeship')) {
    return `Shop giao toàn quốc. Đơn từ **300K được freeship**. Nội thành thường giao trong ngày, tỉnh thành khoảng 2-4 ngày.`;
  }
  if (t.includes('đổi') || t.includes('trả') || t.includes('hoàn')) {
    return `Bạn được hỗ trợ **đổi trả 7 ngày** nếu sản phẩm còn nguyên tem nhãn hoặc có lỗi từ nhà sản xuất. Liên hệ Zalo **${SITE.phone}** để xử lý nhanh.`;
  }
  if (t.includes('giá') || t.includes('rẻ') || t.includes('khuyến mãi')) {
    return `Bạn có thể dùng ô **tìm kiếm** trên đầu trang hoặc vào mục **Khuyến mãi** để xem sản phẩm giá tốt. Nếu cần tư vấn nhanh, nhắn Zalo **${SITE.phone}**.`;
  }
  if (t.includes('theo dõi') || t.includes('tình trạng') || t.includes('đơn hàng')) {
    return `Bạn vào mục **Theo dõi đơn hàng** trên website, nhập mã đơn hàng để xem tình trạng giao hàng nhé.`;
  }
  return `Mình đã nhận được câu hỏi của bạn. Bạn có thể hỏi về **sản phẩm**, **giao hàng**, **thanh toán**, **đổi trả**, hoặc liên hệ Zalo **${SITE.phone}** để được tư vấn trực tiếp.`;
}

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}

function ChatBubble({ msg }) {
  const html = msg.role === 'assistant' ? renderMarkdown(msg.content) : null;
  return (
    <div className={`chat-bubble ${msg.role}`}>
      {msg.role === 'assistant' && (
        <div className="nova-avatar" aria-hidden>🐾</div>
      )}
      <div className="chat-bubble-inner">
        {html
          ? <span dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />
          : msg.content}
        <span className="chat-bubble-time">{msg.time || ''}</span>
      </div>
    </div>
  );
}

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [WELCOME];
    } catch {
      return [WELCOME];
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [chatError, setChatError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, loading]);

  const messagesLen = messages.length;
  useEffect(() => {
    const last = messages[messagesLen - 1];
    if (!open && last?.role === 'assistant') setUnreadCount((c) => c + 1);
  }, [messagesLen, messages, open]);

  useEffect(() => {
    if (open) { setUnreadCount(0); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [open]);

  const getSuggestions = useCallback((text) => {
    const t = text.toLowerCase();
    if (t.includes('theo dõi') || t.includes('tình trạng') || t.includes('đơn hàng')) return SUGGESTED_REPLIES.don_hang;
    if (t.includes('giá') || t.includes('rẻ') || t.includes('khuyến mãi')) return SUGGESTED_REPLIES.gia;
    if (t.includes('sản phẩm') || t.includes('gợi ý') || t.includes('hot')) return SUGGESTED_REPLIES.san_pham;
    if (t.includes('thanh toán') || t.includes('cod') || t.includes('chuyển khoản')) return SUGGESTED_REPLIES.thanh_toan;
    if (t.includes('freeship') || t.includes('vận chuyển') || t.includes('giao hàng') || t.includes('300')) return SUGGESTED_REPLIES.freeship;
    if (t.includes('đổi') || t.includes('trả') || t.includes('hoàn tiền')) return SUGGESTED_REPLIES.doi_tra;
    return [];
  }, []);

  const now = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const send = useCallback(async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text || loading) return;
    if (!isBackendConfigured()) return;
    setSuggestions([]);
    setChatError(null);

    const userMsg = { role: 'user', content: text, time: now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const base = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
      const res = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi server');
      const reply = { role: 'assistant', content: data.message, time: now() };
      setMessages((prev) => [...prev, reply]);
      setSuggestions(getSuggestions(data.message));
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Không thể kết nối 😔 Liên hệ Zalo: ${SITE.phone} để được hỗ trợ.`
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, getSuggestions]);

  const clearChat = () => {
    setMessages([WELCOME]);
    setSuggestions([]);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const showQuick = messages.length === 1 && !loading;

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel" role="dialog" aria-label={`Chat hỗ trợ ${SITE.name}`}>
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="nova-header-avatar">🐾</div>
              <div>
                <strong>{SITE.name} <Zap size={13} className="nova-zap" /></strong>
                <span className="chat-status">
                  <span className="chat-online-dot" />
                  AI trợ lý · 24/7
                </span>
              </div>
            </div>
            <div className="chat-header-actions">
              <button type="button" onClick={clearChat} aria-label="Xóa lịch sử chat" title="Xóa lịch sử" className="chat-clear-btn">
                <Eraser size={15} />
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng chat">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="chat-body">
            {!BACKEND_OK && (
              <div className="chat-bubble assistant">
                <div className="nova-avatar" aria-hidden>🐾</div>
                <div className="chat-bubble-inner">
                  <p>Chat đang bảo trì 🛠️ Liên hệ Zalo: <strong>{SITE.phone}</strong> để được hỗ trợ ngay.</p>
                </div>
              </div>
            )}
            {chatError && BACKEND_OK && (
              <div className="chat-bubble assistant">
                <div className="nova-avatar" aria-hidden>🐾</div>
                <div className="chat-bubble-inner">
                  <p style={{ color: '#e74c3c' }}>{chatError}</p>
                </div>
              </div>
            )}
            {messages.map((m, i) => <ChatBubble key={i} msg={m} />)}
            {loading && (
              <div className="chat-bubble assistant">
                <div className="nova-avatar" aria-hidden>🐾</div>
                <div className="chat-bubble-inner chat-typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {showQuick && (
            <div className="chat-quick-questions">
              {QUICK_QUESTIONS.map((q) => (
                <button key={q} type="button" onClick={() => send(q)} className="chat-quick-btn">{q}</button>
              ))}
            </div>
          )}

          {suggestions.length > 0 && !loading && (
            <div className="chat-suggestions">
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} className="chat-suggestion-btn">{s}</button>
              ))}
            </div>
          )}

          {isBackendConfigured() ? (
            <form className="chat-footer" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={`Hỏi ${SITE.name} về sản phẩm...`}
                aria-label={`Tin nhắn cho ${SITE.name}`}
                disabled={loading}
              />
              <button type="submit" aria-label="Gửi" disabled={!input.trim() || loading}>
                <Send size={16} />
              </button>
            </form>
          ) : (
            <p style={{ textAlign: 'center', padding: '12px', color: '#888', fontSize: '13px' }}>
              Chat đang bảo trì 🛠️<br/>
              Liên hệ Zalo: <strong>{SITE.phone}</strong>
            </p>
          )}
          <p className="chat-powered">Powered by <Sparkles size={10} /> AI</p>
        </div>
      )}

      <div className="chat-toggle-wrap"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {!open && showTooltip && <div className="chat-tooltip">Chat với {SITE.name} 💬</div>}
        {!open && unreadCount > 0 && <span className="chat-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        <button
          type="button"
          className={`chat-toggle ${!open ? 'chat-pulse' : ''}`}
          onClick={() => setOpen((p) => !p)}
          aria-label={open ? 'Đóng chat' : `Chat với ${SITE.name}`}
          title={open ? 'Đóng chat' : `Chat với ${SITE.name}`}
        >
          {open ? <X size={22} /> : <span style={{ fontSize: 22 }}>🐾</span>}
        </button>
      </div>
    </div>
  );
}

export default memo(ChatWidget);
