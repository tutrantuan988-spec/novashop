import { useEffect, useState, useCallback } from 'react';

const PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=900&q=80',
    caption: 'Đêm phố và những bó hoa',
    sub: 'Ánh đèn thành phố lung linh bên bó hồng'
  },
  {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80',
    caption: 'Săn mây sớm mai',
    sub: 'Biển mây bao la giữa núi rừng'
  },
  {
    src: 'https://images.unsplash.com/photo-1490750967868-88aa41e70e22?auto=format&fit=crop&w=900&q=80',
    caption: 'Nụ cười và hoa hồng',
    sub: 'Những điều nhỏ bé làm nên hạnh phúc'
  },
  {
    src: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=900&q=80',
    caption: 'Nắng sớm trên đỉnh đồi',
    sub: 'Một khoảnh khắc bình yên giữa thiên nhiên'
  }
];

const INTERVAL = 6000;

export default function CinematicSlideshow() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState('next');

  const goNext = useCallback(() => {
    setDirection('next');
    setIndex((i) => (i + 1) % PHOTOS.length);
  }, []);

  const goPrev = useCallback(() => {
    setDirection('prev');
    setIndex((i) => (i - 1 + PHOTOS.length) % PHOTOS.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(goNext, INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, goNext]);

  const current = PHOTOS[index];

  return (
    <div
      className="cinematic-slideshow"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Trình chiếu ảnh"
    >
      <div className="slide-stage">
        {PHOTOS.map((photo, i) => {
          const isActive = i === index;
          const isPrev = i === (index - 1 + PHOTOS.length) % PHOTOS.length;
          return (
            <div
              key={i}
              className={`slide-item ${isActive ? 'active' : ''} ${isPrev ? 'exit' : ''} ${direction}`}
              aria-hidden={!isActive}
            >
              <div className="ken-burns-wrap">
                <img src={photo.src} alt={photo.caption} loading={i === 0 ? 'eager' : 'lazy'} />
              </div>
              <div className="slide-overlay" />
              <div className="slide-caption">
                <h2>{photo.caption}</h2>
                <p>{photo.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="slide-arrow slide-prev"
        onClick={goPrev}
        aria-label="Ảnh trước"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
      </button>
      <button
        type="button"
        className="slide-arrow slide-next"
        onClick={goNext}
        aria-label="Ảnh sau"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
      </button>

      <div className="slide-dots" role="tablist">
        {PHOTOS.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={i === index ? 'active' : ''}
            onClick={() => {
              setDirection(i > index ? 'next' : 'prev');
              setIndex(i);
            }}
          />
        ))}
      </div>

      <div className="slide-progress">
        <div
          className="slide-progress-bar"
          style={{
            animationDuration: `${INTERVAL}ms`,
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        />
      </div>
    </div>
  );
}
