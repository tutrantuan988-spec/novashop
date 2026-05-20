import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Bot, ChevronDown, Loader2, Send, Sparkles, X } from 'lucide-react';

const QUICK_COMMANDS = [
  'Tìm thức ăn cho chó',
  'Thêm sản phẩm đầu tiên vào giỏ hàng',
  'Cuộn xuống sản phẩm nổi bật',
  'Mở giỏ hàng',
  'Tìm sản phẩm giá rẻ nhất',
];

const SYSTEM_CONTEXT = `Bạn là AI trợ lý điều hướng giao diện cho cửa hàng trực tuyến "NovaShop".
Trang web bán thức ăn, đồ chơi và phụ kiện cho chó mèo.
Các tính năng chính: tìm sản phẩm, thêm vào giỏ hàng, xem chi tiết sản phẩm, thanh toán.
Hãy thực hiện các thao tác trên trang web theo yêu cầu của người dùng bằng tiếng Việt.`;

function AICopilotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [agentReady, setAgentReady] = useState(false);
  const agentRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const tryInit = () => {
      if (window.PageAgent) {
        try {
          agentRef.current = new window.PageAgent({
            language: 'vi-VN',
            systemPrompt: SYSTEM_CONTEXT,
          });
          setAgentReady(true);
        } catch (e) {
          console.warn('[AICopilot] PageAgent init error:', e);
        }
        return true;
      }
      return false;
    };

    if (!tryInit()) {
      const id = setInterval(() => { if (tryInit()) clearInterval(id); }, 400);
      return () => clearInterval(id);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  const execute = useCallback(async (cmd) => {
    const text = (cmd || input).trim();
    if (!text || running) return;

    setInput('');
    setLog((prev) => [...prev, { role: 'user', text }]);
    setRunning(true);

    if (!agentRef.current) {
      setLog((prev) => [...prev, { role: 'agent', text: '⚠️ AI Copilot chưa sẵn sàng. Vui lòng thử lại sau vài giây.' }]);
      setRunning(false);
      return;
    }

    try {
      setLog((prev) => [...prev, { role: 'agent', text: '🤔 Đang xử lý...', loading: true }]);
      await agentRef.current.execute(text);
      setLog((prev) => {
        const next = [...prev];
        const idx = next.findLastIndex((m) => m.loading);
        if (idx >= 0) next[idx] = { role: 'agent', text: `✅ Đã thực hiện: "${text}"` };
        return next;
      });
    } catch (err) {
      setLog((prev) => {
        const next = [...prev];
        const idx = next.findLastIndex((m) => m.loading);
        const errMsg = err?.message || 'Không thực hiện được lệnh này.';
        if (idx >= 0) next[idx] = { role: 'agent', text: `❌ ${errMsg}` };
        return next;
      });
    } finally {
      setRunning(false);
    }
  }, [input, running]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); execute(); }
  };

  return (
    <div className="ai-copilot-widget" role="region" aria-label="AI Copilot">
      {open && (
        <div className="ai-copilot-panel" role="dialog" aria-label="AI Copilot điều hướng trang">
          <div className="ai-copilot-header">
            <div className="ai-copilot-header-left">
              <div className="ai-copilot-avatar">
                <Bot size={16} />
              </div>
              <div>
                <strong>AI Copilot</strong>
                <span className={agentReady ? 'ai-copilot-status ready' : 'ai-copilot-status'}>
                  {agentReady ? 'Sẵn sàng' : 'Đang khởi động...'}
                </span>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng AI Copilot">
              <ChevronDown size={18} />
            </button>
          </div>

          <div className="ai-copilot-body">
            {log.length === 0 && (
              <div className="ai-copilot-empty">
                <Sparkles size={28} />
                <p>Gõ lệnh tự nhiên để điều khiển trang</p>
                <small>Ví dụ: "tìm thức ăn cho mèo" hoặc "thêm vào giỏ hàng"</small>
              </div>
            )}
            {log.map((m, i) => (
              <div key={i} className={`ai-copilot-msg ${m.role}${m.loading ? ' loading' : ''}`}>
                {m.loading ? (
                  <span className="ai-copilot-thinking">
                    <Loader2 size={14} className="spin" /> Đang thực hiện...
                  </span>
                ) : m.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {log.length === 0 && (
            <div className="ai-copilot-quick">
              {QUICK_COMMANDS.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="ai-copilot-quick-btn"
                  onClick={() => execute(q)}
                  disabled={running || !agentReady}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            className="ai-copilot-footer"
            onSubmit={(e) => { e.preventDefault(); execute(); }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={agentReady ? 'Nhập lệnh tự nhiên...' : 'Đang khởi động AI...'}
              disabled={running || !agentReady}
              aria-label="Lệnh AI Copilot"
            />
            <button
              type="submit"
              disabled={!input.trim() || running || !agentReady}
              aria-label="Thực hiện lệnh"
            >
              {running ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            </button>
          </form>

          <p className="ai-copilot-note">
            Powered by <a href="https://github.com/alibaba/page-agent" target="_blank" rel="noopener noreferrer">PageAgent</a> · Demo LLM
          </p>
        </div>
      )}

      <button
        type="button"
        className={`ai-copilot-toggle${open ? ' active' : ''}`}
        onClick={() => setOpen((p) => !p)}
        aria-label={open ? 'Đóng AI Copilot' : 'Mở AI Copilot'}
        title="AI Copilot — điều khiển trang bằng ngôn ngữ tự nhiên"
      >
        {open ? <X size={22} /> : <Bot size={22} />}
        {!open && <span className="ai-copilot-toggle-label">AI</span>}
      </button>
    </div>
  );
}

export default memo(AICopilotWidget);
