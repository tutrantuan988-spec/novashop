import { useCallback, useEffect, useState } from 'react';
import { Check, X, ImageIcon, Loader } from 'lucide-react';
import { listReturnsApi, approveReturnApi, rejectReturnApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatVND } from '../../utils/format';

function ReturnsManager({ adminEmail }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [busy, setBusy] = useState(null); // returnId hiện đang xử lý
  const [note, setNote] = useState({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listReturnsApi({ adminEmail });
      setItems(list);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [adminEmail, toast]);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = items.filter((r) => filter === 'all' || r.status === filter);

  const handleApprove = async (ret) => {
    setBusy(ret.id);
    try {
      const res = await approveReturnApi(ret.id, { adminNote: note[ret.id] || '' }, adminEmail);
      if (res.refundResult?.ok) {
        toast.success(`Đã duyệt + hoàn tiền ${formatVND(res.refundResult.amount || 0)}`);
      } else if (res.refundResult?.skipped) {
        toast.success('Đã duyệt (refund cần xử lý thủ công)');
      } else {
        toast.success('Đã duyệt');
      }
      refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async (ret) => {
    if (!note[ret.id]) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setBusy(ret.id);
    try {
      await rejectReturnApi(ret.id, note[ret.id], adminEmail);
      toast.success('Đã từ chối');
      refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="card-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Yêu cầu đổi/trả</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: 8 }}>
          <option value="pending">Đang chờ ({items.filter((r) => r.status === 'pending').length})</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Đã từ chối</option>
          <option value="all">Tất cả</option>
        </select>
      </div>

      {loading && <Loader size={20} className="spin" />}

      {!loading && filtered.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
          Không có yêu cầu nào
        </p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 16 }}>
        {filtered.map((ret) => (
          <li key={ret.id} className="card-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <strong>#{ret.id}</strong>
                <span style={{
                  marginLeft: 8,
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  background: ret.status === 'pending' ? '#fef3c7' : ret.status === 'approved' ? '#d1fae5' : '#fee2e2',
                  color: ret.status === 'pending' ? '#92400e' : ret.status === 'approved' ? '#065f46' : '#991b1b'
                }}>
                  {ret.status}
                </span>
                <p style={{ margin: '6px 0', fontSize: 13, color: 'var(--muted)' }}>
                  Đơn: {ret.orderId} | Loại: {ret.type === 'return' ? 'Trả hàng' : 'Đổi hàng'} | Hoàn: {formatVND(ret.refundAmount || 0)}
                </p>

                <ul style={{ paddingLeft: 18, margin: '8px 0' }}>
                  {(ret.items || []).map((it, i) => (
                    <li key={i} style={{ fontSize: 13, marginBottom: 6 }}>
                      <strong>{it.quantity} ×</strong> SP {it.productId}
                      {it.variantId && <span> (variant {it.variantId})</span>}
                      <span style={{ color: 'var(--muted)' }}> — {it.reason}</span>
                      {Array.isArray(it.images) && it.images.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                          {it.images.map((src, j) => (
                            <img key={j} src={src} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                {ret.adminNote && (
                  <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>
                    Ghi chú admin: {ret.adminNote}
                  </p>
                )}
                {ret.refundResult?.ok && (
                  <p style={{ fontSize: 12, color: '#16a34a' }}>
                    ✓ Đã hoàn {formatVND(ret.refundResult.amount || 0)} (Stripe: {ret.refundResult.refundId})
                  </p>
                )}
              </div>

              {ret.status === 'pending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                  <textarea
                    placeholder="Ghi chú admin..."
                    value={note[ret.id] || ''}
                    onChange={(e) => setNote((p) => ({ ...p, [ret.id]: e.target.value }))}
                    rows={2}
                    style={{ padding: 6, fontSize: 12 }}
                  />
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleApprove(ret)}
                    disabled={busy === ret.id}
                  >
                    <Check size={14} /> Duyệt + Hoàn tiền
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleReject(ret)}
                    disabled={busy === ret.id}
                    style={{ color: '#ef4444' }}
                  >
                    <X size={14} /> Từ chối
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ReturnsManager;
