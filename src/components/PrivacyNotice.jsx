import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const CONSENT_KEY = 'trongdinh:privacy-consent';

export default function PrivacyNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setShow(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: false, date: new Date().toISOString() }));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="privacy-notice-banner" role="dialog" aria-label="Privacy notice">
      <button className="privacy-close" onClick={decline} aria-label="Đóng">
        <X size={16} />
      </button>
      <div className="privacy-content">
        <p>
          Chúng tôi sử dụng cookie để cải thiện trải nghiệm của bạn.
          Bằng cách tiếp tục sử dụng trang web, bạn đồng ý với việc sử dụng cookie.
          {' '}
          <a href="/chinh-sach/bao-mat">Chính sách bảo mật</a>
        </p>
        <div className="privacy-actions">
          <button className="privacy-btn privacy-btn-decline" onClick={decline}>
            Từ chối
          </button>
          <button className="privacy-btn privacy-btn-accept" onClick={accept}>
            Đồng ý
          </button>
        </div>
      </div>
      <style>{`
        .privacy-notice-banner {
          position: fixed;
          bottom: 80px;
          left: 16px;
          right: 16px;
          max-width: 480px;
          background: var(--surface, #FFFFFF);
          border: 1px solid var(--border, #D3D3D3);
          border-radius: 16px;
          padding: 20px 24px;
          box-shadow: 0 8px 32px rgba(43, 43, 43, 0.08);
          z-index: 9999;
          animation: privacySlideUp 0.3s ease;
        }
        @keyframes privacySlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .privacy-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--muted, #C2C2C2);
          padding: 4px;
          border-radius: 4px;
        }
        .privacy-close:hover {
          background: var(--highlight, #FCEEEF);
        }
        .privacy-content p {
          margin: 0 0 16px;
          font-size: 0.9rem;
          line-height: 1.6;
          color: var(--text, #2B2B2B);
        }
        .privacy-content a {
          color: var(--primary, #E05353);
          text-decoration: underline;
        }
        .privacy-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .privacy-btn {
          padding: 8px 20px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--border, #D3D3D3);
          transition: all 0.2s;
        }
        .privacy-btn-decline {
          background: transparent;
          color: var(--muted, #C2C2C2);
        }
        .privacy-btn-decline:hover {
          background: var(--highlight, #FCEEEF);
        }
        .privacy-btn-accept {
          background: var(--primary, #E05353);
          color: #fff;
          border-color: var(--primary, #E05353);
        }
        .privacy-btn-accept:hover {
          opacity: 0.9;
        }
        @media (max-width: 768px) {
          .privacy-notice-banner {
            bottom: 70px;
            left: 8px;
            right: 8px;
            max-width: none;
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
