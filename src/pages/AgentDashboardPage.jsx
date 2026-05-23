/**
 * 🧠 Agent Dashboard Page — Trang quản lý hệ thống Agent
 * 
 * Tích hợp AgentConsole vào router của app
 */

import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AgentConsole from '../components/agents/AgentConsole';
import SITE from '../config/site-config';

export default function AgentDashboardPage() {
  const { isAdmin, authLoading } = useAuth();

  useEffect(() => {
    document.title = `Agent Console | ${SITE.name}`;
  }, []);

  if (authLoading) {
    return <div className="page-loading"><div className="spinner" aria-hidden /><span>Đang kiểm tra quyền...</span></div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

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
