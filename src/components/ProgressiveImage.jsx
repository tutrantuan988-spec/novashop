import { useState, useEffect } from 'react';

const LUXURY_FALLBACK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="100%" height="100%" fill="%23111111"/><circle cx="300" cy="300" r="140" fill="none" stroke="%23D4AF37" stroke-width="1" stroke-dasharray="4 6" opacity="0.4"/><circle cx="300" cy="300" r="160" fill="none" stroke="%23D4AF37" stroke-width="1.5" opacity="0.6"/><text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Inter', sans-serif" font-size="26" font-weight="300" fill="%23D4AF37" letter-spacing="6">NOVASHOP</text><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" fill="%23888888" letter-spacing="2">PREMIUM BOUTIQUE</text></svg>`;

const KITTY_FALLBACK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="100%" height="100%" fill="%23FFEAF2"/><circle cx="300" cy="300" r="140" fill="none" stroke="%23FF69B4" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.5"/><text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', sans-serif" font-size="32" font-weight="700" fill="%23FF69B4" letter-spacing="2">NovaShop</text><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', sans-serif" font-size="14" fill="%23FFB6C1" letter-spacing="4">♥ HELLO KITTY MODE ♥</text></svg>`;

export default function ProgressiveImage({ src, alt, className, ...props }) {
  const [currentSrc, setCurrentSrc] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  // Check if Hello Kitty theme is currently active
  const isKittyTheme = typeof window !== 'undefined' && (
    document.documentElement.classList.contains('hello-kitty') ||
    document.body.classList.contains('hello-kitty') ||
    window.location.pathname.includes('kitty')
  );

  const fallbackImage = isKittyTheme ? KITTY_FALLBACK_SVG : LUXURY_FALLBACK_SVG;

  useEffect(() => {
    setLoaded(false);
    setCurrentSrc(src || fallbackImage);
    setErrorCount(0);
  }, [src, fallbackImage]);

  const handleLoad = () => {
    setLoaded(true);
  };

  const handleError = () => {
    if (errorCount < 2) {
      setErrorCount(prev => prev + 1);
      setCurrentSrc(fallbackImage);
    }
  };

  return (
    <div 
      className={`progressive-image-container ${loaded ? 'loaded' : 'loading'}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: isKittyTheme ? '#FFEAF2' : '#141414',
        width: '100%',
        height: '100%'
      }}
    >
      {/* Blurred preview skeleton */}
      {!loaded && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: isKittyTheme 
              ? 'linear-gradient(90deg, #FFEAF2 25%, #FFF0F5 50%, #FFEAF2 75%)'
              : 'linear-gradient(90deg, #161616 25%, #222222 50%, #161616 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear'
          }}
        />
      )}
      <img
        src={currentSrc || fallbackImage}
        alt={alt}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.4s ease-in-out',
          ...props.style
        }}
        {...props}
      />
    </div>
  );
}
