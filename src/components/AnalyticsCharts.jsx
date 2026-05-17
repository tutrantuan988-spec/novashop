import { useCallback, useEffect, useMemo, useState } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Activity, RefreshCw } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getAnalyticsApi } from '../services/api';
import { formatVND } from '../utils/format';

const STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  paid: 'Đã thanh toán',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy'
};

const STATUS_COLORS = {
  pending: '#f59e0b',
  paid: '#10b981',
  processing: '#3b82f6',
  shipped: '#6366f1',
  delivered: '#14b8a6',
  cancelled: '#ef4444'
};

const PAYMENT_LABELS = {
  cod: 'COD',
  bank: 'Chuyển khoản',
  stripe: 'Stripe',
  momo: 'MoMo',
  vnpay: 'VNPay'
};

function RevenueChart({ data }) {
  return (
    <div className="chart-wrap" style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => v?.slice(5) || v}
            stroke="#94a3b8"
            fontSize={12}
          />
          <YAxis
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            stroke="#94a3b8"
            fontSize={12}
          />
          <Tooltip
            formatter={(value) => formatVND(value)}
            labelFormatter={(label) => label}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#f97316"
            strokeWidth={2.5}
            fill="url(#revFill)"
            dot={{ r: 3, fill: '#f97316' }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatusBars({ data, labels = STATUS_LABELS, colors = STATUS_COLORS }) {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;
  return (
    <div className="status-bars">
      {entries.length === 0 && <p className="empty-state">Chưa có dữ liệu.</p>}
      {entries.map(([key, count]) => {
        const pct = (count / total) * 100;
        return (
          <div key={key} className="status-bar-row">
            <span className="status-label">{labels[key] || key}</span>
            <div className="status-bar-track">
              <div
                className="status-bar-fill"
                style={{ width: `${pct}%`, background: colors[key] || '#94a3b8' }}
              />
            </div>
            <span className="status-bar-value">{count} ({pct.toFixed(1)}%)</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsCharts({ adminEmail }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    if (!adminEmail) return;
    setLoading(true);
    setError(null);
    getAnalyticsApi(adminEmail, days)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [adminEmail, days]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const kpiCards = useMemo(() => {
    if (!data?.kpis) return [];
    const k = data.kpis;
    return [
      { label: 'Doanh thu', value: formatVND(k.totalRevenue), icon: DollarSign, accent: 'gold' },
      { label: 'Đơn đã thanh toán', value: k.paidOrders, icon: ShoppingBag, accent: 'green' },
      { label: 'Giá trị TB / đơn', value: formatVND(k.avgOrderValue), icon: TrendingUp, accent: 'blue' },
      { label: 'Tỷ lệ chuyển đổi', value: `${k.conversionRate}%`, icon: Activity, accent: 'purple' }
    ];
  }, [data]);

  if (loading && !data) return <p className="dashboard-loading">Đang tải báo cáo...</p>;
  if (error) return <p className="empty-state">Không tải được analytics: {error}</p>;
  if (!data) return null;

  return (
    <div className="analytics">
      <div className="analytics-header">
        <div className="period-switch">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              className={days === d ? 'period active' : 'period'}
              onClick={() => setDays(d)}
            >
              {d} ngày
            </button>
          ))}
        </div>
        <button type="button" className="icon-button" onClick={refresh} title="Làm mới">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="dashboard-stats">
        {kpiCards.map((c, i) => (
          <div key={i} className={`stat-card stat-${c.accent}`}>
            <c.icon size={24} aria-hidden />
            <div>
              <strong>{c.value}</strong>
              <span>{c.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card-box">
        <h2>Doanh thu {days} ngày qua</h2>
        <RevenueChart data={data.revenueSeries} />
      </div>

      <div className="analytics-grid">
        <div className="card-box">
          <h2>Trạng thái đơn hàng</h2>
          <StatusBars data={data.statusBreakdown} />
        </div>
        <div className="card-box">
          <h2>Phương thức thanh toán</h2>
          <StatusBars
            data={data.paymentBreakdown}
            labels={PAYMENT_LABELS}
            colors={{ cod: '#64748b', bank: '#0ea5e9', stripe: '#6366f1', momo: '#d92560', vnpay: '#f97316' }}
          />
        </div>
      </div>

      <div className="analytics-grid">
        <div className="card-box">
          <h2>Top sản phẩm</h2>
          {data.topProducts.length === 0 ? (
            <p className="empty-state">Chưa có dữ liệu bán hàng.</p>
          ) : (
            <div className="top-list">
              {data.topProducts.map((p, i) => (
                <div key={p.id} className="top-row">
                  <span className="rank">#{i + 1}</span>
                  {p.image && <img src={p.image} alt={p.name} loading="lazy" />}
                  <div className="top-info">
                    <strong>{p.name}</strong>
                    <small>{p.quantity} đã bán</small>
                  </div>
                  <span className="top-value">{formatVND(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card-box">
          <h2>Top khách hàng</h2>
          {data.topCustomers.length === 0 ? (
            <p className="empty-state">Chưa có dữ liệu.</p>
          ) : (
            <div className="top-list">
              {data.topCustomers.map((c, i) => (
                <div key={c.email} className="top-row">
                  <span className="rank">#{i + 1}</span>
                  <div className="top-info">
                    <strong>{c.name || c.email}</strong>
                    <small>{c.email} · {c.orders} đơn</small>
                  </div>
                  <span className="top-value">{formatVND(c.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
