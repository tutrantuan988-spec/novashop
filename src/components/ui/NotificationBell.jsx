import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  listNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi
} from '../../services/api';

const POLL_INTERVAL_MS = 30 * 1000; // 30s — đỡ phải Firestore onSnapshot client-side

function NotificationBell() {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const userKey = user?.id || user?.email || '';

  const refresh = useCallback(async () => {
    if (!userKey) return;
    try {
      const list = await listNotificationsApi(userKey);
      setItems(Array.isArray(list) ? list : []);
    } catch {
      // Silent fail
    }
  }, [userKey]);

  useEffect(() => {
    if (!isAuthenticated || !userKey) return;
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, userKey, refresh]);

  useEffect(() => {
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const unread = items.filter((x) => !x.isRead).length;

  const handleItemClick = async (item) => {
    if (!item.isRead) {
      try {
        await markNotificationReadApi(item.id);
        setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, isRead: true } : x));
      } catch {}
    }
    setOpen(false);
  };

  const handleMarkAll = async () => {
    if (!userKey) return;
    try {
      await markAllNotificationsReadApi(userKey);
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    } catch {}
  };

  if (!isAuthenticated) return null;

  return (
    <div className="notif-bell" ref={wrapperRef}>
      <button
        type="button"
        className="icon-button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Thông báo (${unread} chưa đọc)`}
      >
        <Bell size={18} />
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-dropdown" role="dialog">
          <header className="notif-header">
            <strong>Thông báo</strong>
            {unread > 0 && (
              <button type="button" onClick={handleMarkAll} className="notif-mark-all">
                <Check size={14} /> Đánh dấu đã đọc
              </button>
            )}
          </header>

          {items.length === 0 && <div className="notif-empty">Chưa có thông báo</div>}

          <ul className="notif-list">
            {items.slice(0, 10).map((item) => (
              <li key={item.id} className={item.isRead ? 'notif-item read' : 'notif-item unread'}>
                {item.targetUrl ? (
                  <Link to={item.targetUrl} onClick={() => handleItemClick(item)}>
                    <strong>{item.title}</strong>
                    <small dangerouslySetInnerHTML={{ __html: item.body }} />
                  </Link>
                ) : (
                  <button type="button" onClick={() => handleItemClick(item)}>
                    <strong>{item.title}</strong>
                    <small dangerouslySetInnerHTML={{ __html: item.body }} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default memo(NotificationBell);
