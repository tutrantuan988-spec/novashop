/**
 * 🧠 Agent Console — Dashboard quản lý và giám sát tất cả Agent
 * 
 * Hiển thị:
 * - Danh sách 10 Agent với trạng thái real-time
 * - Thông tin chi tiết từng Agent
 * - Workflow builder & executor
 * - System health monitoring
 * - Vietnam Geo data viewer
 * - Analytics từ Agent
 */

import { useState, useEffect } from 'react';
import { 
  Activity, AlertTriangle, BarChart3, Bot, CheckCircle, Cpu, 
  Database, FileText, Globe, MapPin, Monitor, RefreshCw, 
  Search, Send, Settings, ShoppingBag, TrendingUp, Users, X
} from 'lucide-react';
import api from '../../services/api';

// ─── Agent Definitions ────────────────────────────────────────

const AGENT_DEFS = [
  { id: 'supervisor-agent', name: 'Supervisor Agent', icon: Bot, color: '#8b5cf6', desc: 'Điều phối toàn bộ hệ thống' },
  { id: 'memory-agent', name: 'Memory Agent', icon: Database, color: '#06b6d4', desc: 'Quản lý bộ nhớ đa tầng' },
  { id: 'analytics-agent', name: 'Analytics Agent', icon: BarChart3, color: '#f59e0b', desc: 'Phân tích dữ liệu kinh doanh' },
  { id: 'seo-agent', name: 'SEO Agent', icon: Search, color: '#10b981', desc: 'Tối ưu hóa công cụ tìm kiếm' },
  { id: 'content-agent', name: 'Content Agent', icon: FileText, color: '#ec4899', desc: 'Tạo nội dung tự động' },
  { id: 'vietnam-geo-agent', name: 'Vietnam Geo Agent', icon: MapPin, color: '#ef4444', desc: 'Dữ liệu 63 tỉnh thành VN' },
  { id: 'recommendation-agent', name: 'Recommendation Agent', icon: ShoppingBag, color: '#f97316', desc: 'Gợi ý sản phẩm thông minh' },
  { id: 'marketing-agent', name: 'Marketing Agent', icon: TrendingUp, color: '#8b5cf6', desc: 'Tự động hóa tiếp thị' },
  { id: 'data-pipeline-agent', name: 'Data Pipeline Agent', icon: Database, color: '#14b8a6', desc: 'ETL & xử lý dữ liệu' },
  { id: 'monitoring-agent', name: 'Monitoring Agent', icon: Monitor, color: '#6b7280', desc: 'Giám sát toàn bộ hệ thống' }
];

// ─── Main Component ───────────────────────────────────────────

export default function AgentConsole() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [agentStatuses, setAgentStatuses] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workflowResult, setWorkflowResult] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [contentForm, setContentForm] = useState({ productName: '', productCategory: 'thoi-trang', productBrand: '' });
  const [contentResult, setContentResult] = useState(null);
  const [seoResult, setSeoResult] = useState(null);
  const [seoProduct, setSeoProduct] = useState({ name: '', category: '', brand: '' });
  const [requestType, setRequestType] = useState('');
  const [requestPayload, setRequestPayload] = useState('');

  // ─── Load Data ────────────────────────────────────────────

  useEffect(() => {
    loadSystemStatus();
    const interval = setInterval(loadSystemStatus, 30000); // Refresh mỗi 30s
    return () => clearInterval(interval);
  }, []);

  const loadSystemStatus = async () => {
    try {
      const [agentsRes, healthRes] = await Promise.allSettled([
        api.get('api/agents/status'),
        api.get('api/agents/monitoring/health')
      ]);

      if (agentsRes.status === 'fulfilled' && agentsRes.value) {
        setAgentStatuses(agentsRes.value.agents || []);
        setSystemStatus(agentsRes.value);
      }
      if (healthRes.status === 'fulfilled' && healthRes.value) {
        setSystemStatus(prev => ({ ...prev, health: healthRes.value }));
      }
    } catch (err) {
      setError('Không thể kết nối đến Agent System. Đảm bảo server đang chạy.');
      // Dùng mock data nếu API fail
      setAgentStatuses(AGENT_DEFS.map(a => ({
        id: a.id,
        name: a.name,
        status: 'idle',
        metrics: { tasksProcessed: 0, tasksFailed: 0 }
      })));
    } finally {
      setLoading(false);
    }
  };

  // ─── Send Agent Request ───────────────────────────────────

  const sendAgentRequest = async () => {
    if (!requestType) return;
    setWorkflowResult(null);
    
    try {
      let payload;
      try { payload = JSON.parse(requestPayload || '{}'); } 
      catch { payload = {}; }

      const res = await api.post('api/agents/request', {
        type: requestType,
        payload
      });
      setWorkflowResult({ status: 'success', data: res });
    } catch (err) {
      setWorkflowResult({ status: 'error', message: err.message });
    }
  };

  // ─── Execute Workflow ─────────────────────────────────────

  const executeWorkflow = async (templateName) => {
    try {
      const res = await api.post('api/agents/workflows/execute', {
        template: templateName,
        context: {},
        options: {}
      });
      setWorkflowResult({ status: 'success', data: res, workflow: true });
    } catch (err) {
      setWorkflowResult({ status: 'error', message: err.message });
    }
  };

  // ─── Render: Dashboard Tab ────────────────────────────────

  const renderDashboard = () => (
    <div className="agent-dashboard">
      {/* Header Stats */}
      <div className="agent-stats-grid">
        <div className="agent-stat-card">
          <Bot size={24} color="#8b5cf6" />
          <div>
            <strong>{AGENT_DEFS.length}</strong>
            <span>Agents</span>
          </div>
        </div>
        <div className="agent-stat-card">
          <CheckCircle size={24} color="#10b981" />
          <div>
            <strong>{agentStatuses.filter(a => a.status === 'idle' || a.status === 'busy').length}</strong>
            <span>Đang hoạt động</span>
          </div>
        </div>
        <div className="agent-stat-card">
          <Activity size={24} color="#f59e0b" />
          <div>
            <strong>{agentStatuses.reduce((s, a) => s + (a.metrics?.tasksProcessed || 0), 0)}</strong>
            <span>Tasks đã xử lý</span>
          </div>
        </div>
        <div className="agent-stat-card">
          <Cpu size={24} color="#06b6d4" />
          <div>
            <strong>{systemStatus?.supervisor?.status || 'N/A'}</strong>
            <span>Supervisor</span>
          </div>
        </div>
      </div>

      {/* Agent Grid */}
      <h3 style={{ margin: '24px 0 16px', color: '#1f2937' }}>🧠 Hệ thống 10 Agent</h3>
      <div className="agent-grid">
        {AGENT_DEFS.map(agent => {
          const status = agentStatuses.find(a => a.id === agent.id);
          const Icon = agent.icon;
          const isHealthy = status?.status !== 'error';
          
          return (
            <div 
              key={agent.id}
              className={`agent-card ${selectedAgent?.id === agent.id ? 'selected' : ''} ${isHealthy ? '' : 'error'}`}
              onClick={() => setSelectedAgent({ ...agent, status })}
              style={{ borderLeftColor: agent.color }}
            >
              <div className="agent-card-header">
                <Icon size={24} color={agent.color} />
                <span className={`agent-status-dot ${status?.status || 'idle'}`} />
              </div>
              <h4>{agent.name}</h4>
              <p>{agent.desc}</p>
              <div className="agent-card-meta">
                <small>Tasks: {status?.metrics?.tasksProcessed || 0}</small>
                {status?.metrics?.tasksFailed > 0 && (
                  <small style={{ color: '#ef4444' }}>Lỗi: {status.metrics.tasksFailed}</small>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Detail Panel */}
      {selectedAgent && (
        <div className="agent-detail-panel">
          <div className="agent-detail-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <selectedAgent.icon size={28} color={selectedAgent.color} />
              <div>
                <h3>{selectedAgent.name}</h3>
                <p>{selectedAgent.desc}</p>
              </div>
            </div>
            <button className="agent-close-btn" onClick={() => setSelectedAgent(null)}>
              <X size={20} />
            </button>
          </div>
          {selectedAgent.status && (
            <div className="agent-detail-body">
              <div className="detail-row">
                <span>Trạng thái</span>
                <span className={`status-badge ${selectedAgent.status.status}`}>
                  {selectedAgent.status.status}
                </span>
              </div>
              <div className="detail-row">
                <span>Tasks đã xử lý</span>
                <span>{selectedAgent.status.metrics?.tasksProcessed || 0}</span>
              </div>
              <div className="detail-row">
                <span>Tasks lỗi</span>
                <span style={{ color: selectedAgent.status.metrics?.tasksFailed > 0 ? '#ef4444' : '#10b981' }}>
                  {selectedAgent.status.metrics?.tasksFailed || 0}
                </span>
              </div>
              <div className="detail-row">
                <span>Lần hoạt động cuối</span>
                <span>{selectedAgent.status.metrics?.lastActive ? new Date(selectedAgent.status.metrics.lastActive).toLocaleString('vi-VN') : 'N/A'}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ─── Render: Workflows Tab ────────────────────────────────

  const renderWorkflows = () => (
    <div className="agent-workflows">
      <h3 style={{ marginBottom: 16, color: '#1f2937' }}>🔄 Workflow Templates</h3>
      
      <div className="workflow-list">
        {[
          { name: 'product-import', desc: 'Import sản phẩm tự động + SEO + Content', steps: 4 },
          { name: 'daily-report', desc: 'Báo cáo hàng ngày tự động', steps: 3 },
          { name: 'marketing-campaign', desc: 'Chiến dịch marketing tự động', steps: 5 },
          { name: 'system-health', desc: 'Kiểm tra sức khỏe hệ thống', steps: 2 }
        ].map(wf => (
          <div key={wf.name} className="workflow-card">
            <div className="workflow-info">
              <strong>{wf.name}</strong>
              <p>{wf.desc}</p>
              <small>{wf.steps} steps</small>
            </div>
            <div className="workflow-actions">
              <button 
                className="workflow-btn"
                onClick={() => executeWorkflow(wf.name)}
              >
                <Play size={16} /> Chạy
              </button>
              <button className="workflow-btn secondary">
                <Info size={16} /> Chi tiết
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Result */}
      {workflowResult && (
        <div className={`workflow-result ${workflowResult.status}`}>
          <h4>{workflowResult.status === 'success' ? '✅ Thành công!' : '❌ Lỗi'}</h4>
          <pre>{JSON.stringify(workflowResult.data || workflowResult.message, null, 2)}</pre>
        </div>
      )}

      {/* Agent Request Sender */}
      <h3 style={{ margin: '24px 0 16px', color: '#1f2937' }}>📤 Gửi yêu cầu đến Agent</h3>
      <div className="agent-request-form">
        <select 
          value={requestType}
          onChange={e => setRequestType(e.target.value)}
          className="agent-select"
        >
          <option value="">Chọn loại request...</option>
          <optgroup label="Analytics">
            <option value="analytics.revenue">analytics.revenue</option>
            <option value="analytics.products">analytics.products</option>
            <option value="analytics.forecast">analytics.forecast</option>
          </optgroup>
          <optgroup label="SEO">
            <option value="seo.optimize">seo.optimize</option>
            <option value="seo.audit">seo.audit</option>
            <option value="seo.keywords">seo.keywords</option>
          </optgroup>
          <optgroup label="Content">
            <option value="content.generate">content.generate</option>
            <option value="content.blog">content.blog</option>
            <option value="content.promotion">content.promotion</option>
          </optgroup>
          <optgroup label="Vietnam">
            <option value="vietnam.provinces">vietnam.provinces</option>
            <option value="vietnam.shipping">vietnam.shipping</option>
            <option value="vietnam.stats">vietnam.stats</option>
          </optgroup>
          <optgroup label="Marketing">
            <option value="marketing.campaign">marketing.campaign</option>
            <option value="marketing.email">marketing.email</option>
          </optgroup>
          <optgroup label="Recommendation">
            <option value="recommend.cross-sell">recommend.cross-sell</option>
            <option value="recommend.personalized">recommend.personalized</option>
          </optgroup>
          <optgroup label="Data">
            <option value="datapipeline.export">datapipeline.export</option>
            <option value="datapipeline.validate">datapipeline.validate</option>
          </optgroup>
        </select>
        
        <textarea
          placeholder='{"period": "30d", "category": "thức ăn chó"}'
          value={requestPayload}
          onChange={e => setRequestPayload(e.target.value)}
          className="agent-textarea"
          rows={3}
        />
        
        <button 
          onClick={sendAgentRequest}
          disabled={!requestType}
          className="agent-send-btn"
        >
          <Send size={16} /> Gửi Request
        </button>
      </div>
    </div>
  );

  // ─── Render: Analytics Tab

  const renderAnalytics = () => (
    <div className="agent-analytics">
      <h3 style={{ marginBottom: 16, color: '#1f2937' }}>Analytics Dashboard</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {[
          { label: 'Doanh thu', endpoint: 'api/agents/analytics/revenue', icon: TrendingUp, color: '#10b981' },
          { label: 'Sản phẩm', endpoint: 'api/agents/analytics/products', icon: ShoppingBag, color: '#f59e0b' },
          { label: 'Khách hàng', endpoint: 'api/agents/analytics/customers', icon: Users, color: '#8b5cf6' },
          { label: 'Dự báo', endpoint: 'api/agents/analytics/forecast', icon: TrendingUp, color: '#06b6d4' }
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="analytics-card"
              style={{ padding: 20, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', cursor: 'pointer' }}
              onClick={async () => {
                setAnalyticsLoading(true);
                try {
                  const res = await api.get(item.endpoint);
                  setAnalyticsData(res);
                } catch (e) {
                  setAnalyticsData({ error: e.message });
                }
                setAnalyticsLoading(false);
              }}
            >
              <Icon size={24} color={item.color} />
              <h4 style={{ margin: '8px 0 4px', color: '#111827' }}>{item.label}</h4>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Xem phan tich {item.label.toLowerCase()}</p>
            </div>
          );
        })}
      </div>
      {analyticsLoading && <p style={{ color: '#6b7280', marginTop: 16 }}>Dang tai du lieu...</p>}
      {analyticsData && !analyticsLoading && (
        <div style={{ marginTop: 16, padding: 16, background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
          <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(analyticsData, null, 2)}</pre>
        </div>
      )}
    </div>
  );

  // ─── Render: Content Tab

  const renderContent = () => (
    <div className="agent-content">
      <h3 style={{ marginBottom: 16, color: '#1f2937' }}>Content Generator</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, background: 'white', borderRadius: 10, border: '1px solid #e5e7eb' }}>
        <input
          placeholder="Ten san pham"
          value={contentForm.productName}
          onChange={e => setContentForm(f => ({ ...f, productName: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
        />
        <select
          value={contentForm.productCategory}
          onChange={e => setContentForm(f => ({ ...f, productCategory: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
        >
          <option value="thoi-trang">Thời trang</option>
          <option value="thuc an meo">Thuc an meo</option>
          <option value="phu kien">Phu kien</option>
        </select>
        <input
          placeholder="Thuong hieu"
          value={contentForm.productBrand}
          onChange={e => setContentForm(f => ({ ...f, productBrand: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
        />
        <button
          onClick={async () => {
            try {
              const res = await api.post('api/agents/content/generate', {
                product: { name: contentForm.productName, category: contentForm.productCategory, brand: contentForm.productBrand }
              });
              setContentResult(res);
            } catch (e) {
              setContentResult({ error: e.message });
            }
          }}
          disabled={!contentForm.productName}
          className="agent-send-btn"
          style={{ alignSelf: 'flex-end' }}
        >
          Tao noi dung
        </button>
      </div>
      {contentResult && (
        <div style={{ marginTop: 16, padding: 16, background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
          <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(contentResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );

  // ─── Render: SEO Tab

  const renderSEO = () => (
    <div className="agent-seo">
      <h3 style={{ marginBottom: 16, color: '#1f2937' }}>SEO Optimization</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, background: 'white', borderRadius: 10, border: '1px solid #e5e7eb' }}>
        <input
          placeholder="Ten san pham"
          value={seoProduct.name}
          onChange={e => setSeoProduct(f => ({ ...f, name: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
        />
        <input
          placeholder="Danh muc"
          value={seoProduct.category}
          onChange={e => setSeoProduct(f => ({ ...f, category: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
        />
        <input
          placeholder="Thuong hieu"
          value={seoProduct.brand}
          onChange={e => setSeoProduct(f => ({ ...f, brand: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={async () => {
              try {
                const res = await api.post('api/agents/seo/optimize', {
                  product: { name: seoProduct.name, category: seoProduct.category, brand: seoProduct.brand }
                });
                setSeoResult(res);
              } catch (e) {
                setSeoResult({ error: e.message });
              }
            }}
            disabled={!seoProduct.name}
            className="agent-send-btn"
          >
            Toi uu SEO
          </button>
          <button
            onClick={async () => {
              try {
                const res = await api.post('api/agents/seo/keywords', {
                  product: { name: seoProduct.name, category: seoProduct.category, brand: seoProduct.brand }
                });
                setSeoResult(res);
              } catch (e) {
                setSeoResult({ error: e.message });
              }
            }}
            disabled={!seoProduct.name}
            className="agent-send-btn"
            style={{ background: '#06b6d4' }}
          >
            Goi y tu khoa
          </button>
        </div>
      </div>
      {seoResult && (
        <div style={{ marginTop: 16, padding: 16, background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
          <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(seoResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );

  // ─── Render: Vietnam Data Tab

  const renderVietnam = () => (
    <div className="agent-vietnam">
      <h3 style={{ marginBottom: 16, color: '#1f2937' }}>🇻🇳 Dữ liệu 63 tỉnh thành Việt Nam</h3>
      <div className="vietnam-info">
        <div className="vietnam-stat">
          <Globe size={20} color="#ef4444" />
          <span>63 tỉnh thành</span>
        </div>
        <div className="vietnam-stat">
          <MapPin size={20} color="#f97316" />
          <span>700+ quận huyện</span>
        </div>
        <div className="vietnam-stat">
          <Users size={20} color="#10b981" />
          <span>100M+ dân số</span>
        </div>
      </div>
      <p style={{ color: '#6b7280', fontSize: 14 }}>
        Sử dụng API <code>/api/vietnam/provinces</code> để lấy danh sách tỉnh thành.
        Xem chi tiết tại <code>/api/vietnam/:id</code> (vd: hn, hcm, dn).
      </p>
    </div>
  );

  // ─── Render: Monitoring Tab ───────────────────────────────

  const renderMonitoring = () => (
    <div className="agent-monitoring">
      <h3 style={{ marginBottom: 16, color: '#1f2937' }}>📡 Hệ thống giám sát</h3>
      
      {systemStatus?.health ? (
        <div className="health-checks">
          {Object.entries(systemStatus.health.checks || {}).map(([key, check]) => (
            <div key={key} className="health-item">
              <span className={`health-dot ${check.status}`} />
              <div>
                <strong>{check.name || key}</strong>
                <p>Status: {check.status}</p>
                {check.responseTime && <small>{check.responseTime}</small>}
              </div>
            </div>
          ))}
          <div className="health-summary">
            <p>
              Tổng quan: <strong>{systemStatus.health.overall}</strong> | 
              Response: {systemStatus.health.responseTime}
            </p>
          </div>
        </div>
      ) : (
        <p style={{ color: '#6b7280' }}>Đang tải dữ liệu monitoring...</p>
      )}

      <button 
        onClick={loadSystemStatus}
        className="refresh-btn"
        style={{ marginTop: 16 }}
      >
        <RefreshCw size={16} /> Làm mới
      </button>
    </div>
  );

  // ─── Main Render ──────────────────────────────────────────

  if (loading) {
    return (
      <div className="agent-console-loading">
        <div className="loading-spinner" />
        <p>Đang khởi tạo hệ thống Agent...</p>
      </div>
    );
  }

  return (
    <div className="agent-console">
      {/* Header */}
      <div className="agent-console-header">
        <div>
          <h2>🧠 Agent Console</h2>
          <p>Hệ thống 10 AI Agent tự động cho TRỌNG ĐỊNH STORE</p>
        </div>
        <button onClick={loadSystemStatus} className="refresh-btn">
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="agent-error-banner">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="agent-tabs">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'workflows', label: 'Workflows', icon: Settings },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'content', label: 'Content', icon: FileText },
          { id: 'seo', label: 'SEO', icon: Search },
          { id: 'vietnam', label: 'Vietnam Data', icon: MapPin },
          { id: 'monitoring', label: 'Monitoring', icon: Monitor }
        ].map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`agent-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <TabIcon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="agent-tab-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'workflows' && renderWorkflows()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'content' && renderContent()}
        {activeTab === 'seo' && renderSEO()}
        {activeTab === 'vietnam' && renderVietnam()}
        {activeTab === 'monitoring' && renderMonitoring()}
      </div>

      <style>{agentStyles}</style>
    </div>
  );
}

// ─── Missing import ────────────────────────────────────────────

function Play({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
}

function Info({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
}

// ─── Styles ────────────────────────────────────────────────────

const agentStyles = `
  .agent-console { 
    padding: 24px; max-width: 1200px; margin: 0 auto; 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .agent-console-header { 
    display: flex; justify-content: space-between; align-items: flex-start; 
    margin-bottom: 20px;
  }
  .agent-console-header h2 { margin: 0; font-size: 1.5rem; color: #111827; }
  .agent-console-header p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
  
  .refresh-btn {
    display: flex; align-items: center; gap: 6px; padding: 8px 16px;
    background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px;
    cursor: pointer; font-size: 14px; color: #374151; transition: all 0.2s;
  }
  .refresh-btn:hover { background: #e5e7eb; }
  
  .agent-error-banner {
    display: flex; align-items: center; gap: 8px; padding: 12px 16px;
    background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
    color: #dc2626; font-size: 14px; margin-bottom: 16px;
  }
  
  .agent-tabs {
    display: flex; gap: 4px; background: #f3f4f6; padding: 4px;
    border-radius: 10px; margin-bottom: 24px;
  }
  .agent-tab {
    display: flex; align-items: center; gap: 6px; padding: 8px 16px;
    border: none; background: transparent; border-radius: 8px;
    cursor: pointer; font-size: 14px; color: #6b7280; transition: all 0.2s;
  }
  .agent-tab.active { background: white; color: #111827; font-weight: 500; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .agent-tab:hover:not(.active) { color: #374151; }
  
  /* Dashboard */
  .agent-stats-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px; margin-bottom: 24px;
  }
  .agent-stat-card {
    display: flex; align-items: center; gap: 12px; padding: 16px;
    background: white; border-radius: 12px; border: 1px solid #e5e7eb;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .agent-stat-card div { display: flex; flex-direction: column; }
  .agent-stat-card strong { font-size: 1.5rem; color: #111827; }
  .agent-stat-card span { font-size: 12px; color: #6b7280; }
  
  .agent-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }
  .agent-card {
    background: white; border-radius: 12px; padding: 16px;
    border-left: 4px solid #8b5cf6; border-top: 1px solid #e5e7eb;
    border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;
    cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .agent-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .agent-card.selected { border-color: #8b5cf6; box-shadow: 0 0 0 2px rgba(139,92,246,0.2); }
  .agent-card.error { border-left-color: #ef4444; }
  .agent-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .agent-card h4 { margin: 0; font-size: 14px; color: #111827; }
  .agent-card p { margin: 4px 0; font-size: 12px; color: #6b7280; }
  .agent-card-meta { display: flex; gap: 8px; margin-top: 8px; }
  .agent-card-meta small { color: #9ca3af; font-size: 11px; }
  
  .agent-status-dot {
    width: 10px; height: 10px; border-radius: 50%; display: inline-block;
  }
  .agent-status-dot.idle { background: #10b981; }
  .agent-status-dot.busy { background: #f59e0b; animation: pulse 1.5s infinite; }
  .agent-status-dot.error { background: #ef4444; }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; } 50% { opacity: 0.5; }
  }
  
  /* Detail Panel */
  .agent-detail-panel {
    margin-top: 16px; padding: 20px; background: white; border-radius: 12px;
    border: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  .agent-detail-header { display: flex; justify-content: space-between; align-items: flex-start; }
  .agent-detail-header h3 { margin: 0; font-size: 1.1rem; color: #111827; }
  .agent-detail-header p { margin: 2px 0 0; color: #6b7280; font-size: 13px; }
  .agent-close-btn {
    background: none; border: none; cursor: pointer; color: #9ca3af; padding: 4px;
  }
  .agent-close-btn:hover { color: #374151; }
  .agent-detail-body { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
  .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
  .detail-row span:first-child { color: #6b7280; font-size: 13px; }
  .detail-row span:last-child { font-weight: 500; font-size: 14px; color: #111827; }
  .status-badge {
    padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;
  }
  .status-badge.idle { background: #d1fae5; color: #065f46; }
  .status-badge.busy { background: #fef3c7; color: #92400e; }
  .status-badge.error { background: #fee2e2; color: #991b1b; }
  
  /* Workflows */
  .workflow-list { display: flex; flex-direction: column; gap: 8px; }
  .workflow-card {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px; background: white; border-radius: 10px;
    border: 1px solid #e5e7eb; transition: all 0.2s;
  }
  .workflow-card:hover { border-color: #d1d5db; }
  .workflow-info strong { display: block; color: #111827; margin-bottom: 4px; }
  .workflow-info p { margin: 0; font-size: 13px; color: #6b7280; }
  .workflow-info small { color: #9ca3af; font-size: 11px; }
  .workflow-actions { display: flex; gap: 8px; }
  .workflow-btn {
    display: flex; align-items: center; gap: 4px; padding: 6px 12px;
    border-radius: 8px; border: 1px solid #e5e7eb; background: white;
    cursor: pointer; font-size: 13px; transition: all 0.2s;
  }
  .workflow-btn:hover { background: #f9fafb; border-color: #d1d5db; }
  
  .workflow-result {
    margin-top: 16px; padding: 16px; border-radius: 10px;
    background: #f0fdf4; border: 1px solid #bbf7d0;
  }
  .workflow-result.error { background: #fef2f2; border-color: #fecaca; }
  .workflow-result pre {
    font-size: 12px; max-height: 200px; overflow: auto; 
    white-space: pre-wrap; background: rgba(0,0,0,0.03); padding: 8px; border-radius: 6px;
  }
  
  .agent-request-form {
    display: flex; flex-direction: column; gap: 12px;
    padding: 16px; background: white; border-radius: 10px; border: 1px solid #e5e7eb;
  }
  .agent-select {
    padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px;
    font-size: 14px; background: white; cursor: pointer;
  }
  .agent-textarea {
    padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px;
    font-size: 13px; font-family: monospace; resize: vertical;
  }
  .agent-send-btn {
    display: flex; align-items: center; gap: 6px; padding: 10px 20px;
    background: #8b5cf6; color: white; border: none; border-radius: 8px;
    cursor: pointer; font-size: 14px; transition: all 0.2s; align-self: flex-end;
  }
  .agent-send-btn:hover { background: #7c3aed; }
  .agent-send-btn:disabled { background: #d1d5db; cursor: not-allowed; }
  
  /* Vietnam */
  .vietnam-info {
    display: flex; gap: 20px; margin-bottom: 16px; flex-wrap: wrap;
  }
  .vietnam-stat {
    display: flex; align-items: center; gap: 8px; padding: 12px 16px;
    background: white; border-radius: 10px; border: 1px solid #e5e7eb;
  }
  .vietnam-stat span { font-size: 14px; font-weight: 500; color: #374151; }
  
  /* Monitoring */
  .health-checks { display: flex; flex-direction: column; gap: 8px; }
  .health-item {
    display: flex; align-items: center; gap: 12px; padding: 12px 16px;
    background: white; border-radius: 10px; border: 1px solid #e5e7eb;
  }
  .health-dot {
    width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
  }
  .health-dot.healthy { background: #10b981; }
  .health-dot.warning { background: #f59e0b; }
  .health-dot.error { background: #ef4444; }
  .health-item strong { display: block; color: #111827; font-size: 14px; }
  .health-item p { margin: 2px 0; font-size: 13px; color: #6b7280; }
  .health-item small { color: #9ca3af; font-size: 11px; }
  .health-summary {
    padding: 12px 16px; background: #f9fafb; border-radius: 10px;
    border: 1px solid #e5e7eb; font-size: 13px; color: #374151;
  }
  
  .agent-console-loading {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 100px 20px; color: #6b7280;
  }
  .loading-spinner {
    width: 40px; height: 40px; border: 3px solid #e5e7eb; 
    border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.8s linear infinite;
    margin-bottom: 16px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
