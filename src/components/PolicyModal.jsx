import { useEffect } from 'react';
import { X } from 'lucide-react';

function PolicyModal({ policy, onClose }) {
  useEffect(() => {
    if (!policy) return;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [policy, onClose]);

  if (!policy) return null;

  const Icon = policy.icon;

  return (
    <div
      className="modal-overlay policy-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-modal-title"
      onClick={onClose}
    >
      <div className="modal policy-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">
          <X size={18} />
        </button>

        <div className="policy-modal-head">
          {Icon ? (
            <span className="policy-modal-icon" aria-hidden>
              <Icon size={22} />
            </span>
          ) : null}
          <div>
            {policy.kicker && <span className="policy-modal-kicker">{policy.kicker}</span>}
            <h2 id="policy-modal-title">{policy.title}</h2>
            {policy.lead && <p className="policy-modal-lead">{policy.lead}</p>}
          </div>
        </div>

        <ul className="policy-modal-list">
          {policy.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>

        {policy.footnote && <p className="policy-modal-foot">{policy.footnote}</p>}
      </div>
    </div>
  );
}

export default PolicyModal;
