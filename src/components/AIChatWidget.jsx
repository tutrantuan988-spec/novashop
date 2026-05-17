import { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Minimize2, Maximize2, Loader2 } from 'lucide-react';
import { sendAIChatMessage } from '../services/aiChat';
import { saveContext, getContext } from '../services/contextCache';

function AIChatWidget() {
  // Anonymous user ID for context persistence (persisted in localStorage)
  const [userId] = useState(() => {
    try {
      let id = localStorage.getItem('ai_userId');
      if (!id) {
        id = 'anon_' + Math.random().toString(36).slice(2, 9);
        localStorage.setItem('ai_userId', id);
      }
      return id;
    } catch {
      return 'anon_' + Math.random().toString(36).slice(2, 9);
    }
  });
  const sessionId = 'ai_chat_main';
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Xin chào! Tôi là trợ lý AI của NovaShop. Tôi có thể giúp gì cho bạn về thức ăn thú cưng?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await sendAIChatMessage(userMessage, messages);
      const updatedMessages = [...messages, { role: 'user', content: userMessage }, { role: 'assistant', content: response.response }];
      setMessages(updatedMessages);
      // Save context to server cache asynchronously
      saveContext(userId, sessionId, { messages: updatedMessages }).catch(() => {});
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#ff7a1a',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(255, 122, 26, 0.3)',
          zIndex: 1000,
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Bot size={28} />
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: isMinimized ? 320 : 400,
        height: isMinimized ? 60 : 600,
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #e5e7eb'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #ff7a1a 0%, #ff9a56 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Bot size={24} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Trợ lý AI NovaShop</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>Hỗ trợ 24/7</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: '#f9fafb'
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? '#ff7a1a' : 'white',
                  color: msg.role === 'user' ? 'white' : '#1f2937',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  wordBreak: 'break-word'
                }}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div
                style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  alignSelf: 'flex-start',
                  background: 'white',
                  color: '#6b7280',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff7a1a', animation: 'pulse 1s infinite' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff7a1a', animation: 'pulse 1s 0.2s infinite' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff7a1a', animation: 'pulse 1s 0.4s infinite' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            style={{
              padding: 16,
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: 8,
              background: 'white'
            }}
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập câu hỏi..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#ff7a1a'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              style={{
                padding: '12px',
                background: '#ff7a1a',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: isLoading || !message.trim() ? 'not-allowed' : 'pointer',
                opacity: isLoading || !message.trim() ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={20} />
            </button>
          </form>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default AIChatWidget;
