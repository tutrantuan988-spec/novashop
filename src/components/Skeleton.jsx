import { memo } from 'react';

function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden>
      <div className="skeleton-image" />
      <div className="skeleton-text" style={{ width: '70%' }} />
      <div className="skeleton-text" style={{ width: '40%' }} />
    </div>
  );
}

function SkeletonGrid({ count = 8 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export { SkeletonCard, SkeletonGrid };
export default memo(SkeletonGrid);
