/**
 * 🧠 Agent Dashboard Page — Trang quản lý hệ thống Agent
 * 
 * Tích hợp AgentConsole vào router của app
 */

import { useEffect } from 'react';
import AgentConsole from '../components/agents/AgentConsole';

export default function AgentDashboardPage() {
  useEffect(() => {
    document.title = 'Agent Console | TRỌNG ĐỊNH STORE';
  }, []);

  return (
    <>
      <div className="agent-dashboard-page">
        <AgentConsole />
      </div>

      <style>{pageStyles}</style>
    </>
  );
}

const pageStyles = `
  .agent-dashboard-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
    padding-top: 1px;
  }

  @media (max-width: 768px) {
    .agent-dashboard-page {
      padding: 0 8px;
    }
  }
`;
