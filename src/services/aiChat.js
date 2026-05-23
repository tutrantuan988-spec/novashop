import { isBackendConfigured } from './api';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

export async function sendAIChatMessage(message, conversationHistory = []) {
  if (!isBackendConfigured()) {
    return {
      response: 'Hiện tại chatbot AI chưa được cấu hình. Vui lòng gọi hotline 0369712958 để được tư vấn.',
      fallback: true
    };
  }

  try {
    const res = await fetch(`${API_BASE}/api/chat-rag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversationHistory })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Gửi tin nhắn thất bại');
    }
    
    return data;
  } catch (error) {
    console.error('[AI Chat] Error:', error);
    return {
      response: 'Không thể kết nối với chatbot. Vui lòng gọi hotline 0369712958.',
      fallback: true
    };
  }
}
