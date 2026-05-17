import { memo, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import AnalyticsCharts from '../../components/AnalyticsCharts';
import { getIntegrationsStatusApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function AnalyticsTab() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    getIntegrationsStatusApi(user.email)
      .then(setIntegrations)
      .catch(() => setIntegrations(null));
  }, [user?.email]);

  return (
    <div className="admin-dashboard">
      <AnalyticsCharts adminEmail={user?.email} />

      <div className="card-box">
        <h2>Trạng thái tích hợp</h2>
        {!integrations ? (
          <p className="empty-result">Đang tải trạng thái dịch vụ...</p>
        ) : (
          <div className="integration-status-list">
            {Object.entries(integrations).map(([key, item]) => (
              <div key={key} className="integration-status-row">
                <div>
                  <strong>{item.label}</strong>
                  {!item.configured && <span>{item.action}</span>}
                </div>
                <span className={item.configured ? 'status-badge badge-paid' : 'status-badge badge-pending'}>
                  {item.configured ? <CheckCircle2 size={14} aria-hidden /> : <AlertTriangle size={14} aria-hidden />}
                  {item.configured ? 'Đã cấu hình' : 'Chưa cấu hình'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(AnalyticsTab);
