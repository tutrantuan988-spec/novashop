import { useEffect, useState, useCallback } from 'react';

const PHOTOS = [
  {
    src: '/images/slideshow/photo1.jpg',
    caption: 'Đêm phố và những bó hoa',
    sub: 'Ánh đèn lung linh giữa lòng thành phố'
  },
  {
    src: '/images/slideshow/photo2.jpg',
    caption: 'Săn mây sớm mai',
    sub: 'Biển mây bao la giữa núi rừng'
  },
  {
    src: '/images/slideshow/photo3.jpg',
    caption: 'Nụ cười và hoa hồng',
    sub: 'Những điều nhỏ bé làm nên hạnh phúc'
  },
  {
    src: '/images/slideshow/photo4.jpg',
    caption: 'Nắng sớm trên đỉnh đồi',
    sub: 'Khoảnh khắc bình yên giữa thiên nhiên'
  }
];

const INTERVAL = 5500;

export default function AnimatedHeroCard() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % PHOTOS.length);
  }, []);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + PHOTOS.length) % PHOTOS.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(goNext, INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, goNext]);

  const currentPhoto = PHOTOS[index];

  return (
    <div
      className="hero-card premium-showcase luxury-slideshow"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Trình chiếu"
    >
      <div className="luxury-orb orb-one" />
      <div className="luxury-orb orb-two" />
      <div className="luxury-meta">
        <span>TRỌNG ĐỊNH STORE EDITORIAL</span>
        <strong>{String(index + 1).padStart(2, '0')} / {String(PHOTOS.length).padStart(2, '0')}</strong>
      </div>
      <div className="luxury-stage">
        {PHOTOS.map((photo, i) => {
          const isActive = i === index;
          return (
            <div
              key={i}
              className={`luxury-slide ${isActive ? 'active' : ''}`}
              aria-hidden={!isActive}
            >
              <div className="luxury-kenburns">
                <img src={photo.src} alt={photo.caption} loading={i === 0 ? 'eager' : 'lazy'} />
              </div>
              <div className="luxury-overlay" />
              <div className="luxury-caption">
                <h3>{photo.caption}</h3>
                <p>{photo.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button type="button" className="luxury-arrow prev" onClick={goPrev} aria-label="Trước">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
      </button>
      <button type="button" className="luxury-arrow next" onClick={goNext} aria-label="Sau">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
      </button>

      <div className="luxury-dots" role="tablist">
        {PHOTOS.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={i === index ? 'active' : ''}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>

      <div className="luxury-thumb-rail" aria-label="Ảnh thu nhỏ">
        {PHOTOS.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            className={i === index ? 'active' : ''}
            onClick={() => setIndex(i)}
            aria-label={`Xem ${photo.caption}`}
          >
            <img src={photo.src} alt="" loading="lazy" />
          </button>
        ))}
      </div>

      <div className="luxury-title-card">
        <span>Đang trình chiếu</span>
        <strong>{currentPhoto.caption}</strong>
      </div>

      <div className="luxury-progress">
        <div
          className="luxury-progress-bar"
          style={{
            animationDuration: `${INTERVAL}ms`,
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        />
      </div>
    </div>
  );
}
