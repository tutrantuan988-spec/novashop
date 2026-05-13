import { memo, useEffect, useRef, useState } from 'react';

/**
 * Progressive Image (P9):
 * - Load thumbnail trước, swap medium khi vào viewport
 * - WebP với fallback JPG dùng <picture>
 *
 * src có thể là string đơn giản, hoặc object { thumbnail, medium, original }.
 *
 * @param {{ src: string|{thumbnail?: string, medium?: string, original?: string}, alt: string, className?: string, width?: number, height?: number, eager?: boolean }} props
 */
function ProgressiveImage({ src, alt, className, width, height, eager = false, ...rest }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(eager);
  const [loaded, setLoaded] = useState(false);

  const isObj = typeof src === 'object' && src !== null;
  const thumbnail = isObj ? src.thumbnail : src;
  const medium = isObj ? (src.medium || src.original || src.thumbnail) : src;

  useEffect(() => {
    if (eager) return;
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            obs.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [eager]);

  const finalSrc = inView ? medium : thumbnail;
  const placeholder = thumbnail || '/placeholder.png';

  return (
    <picture className={className} style={{ display: 'block', position: 'relative' }}>
      <img
        ref={ref}
        src={finalSrc}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? 'eager' : 'lazy'}
        onLoad={() => setLoaded(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: loaded ? 'none' : 'blur(8px)',
          transition: 'filter 0.3s ease',
          background: `url(${placeholder}) center/cover no-repeat`
        }}
        {...rest}
      />
    </picture>
  );
}

export default memo(ProgressiveImage);
