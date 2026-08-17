import { useEffect, useRef, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [fading, setFading] = useState(false);
  const calledRef = useRef(false);

  const finish = () => {
    if (calledRef.current) return;
    calledRef.current = true;
    setFading(true);
    // Wait for CSS fade-out to finish, then unmount
    setTimeout(onComplete, 700);
  };

  useEffect(() => {
    // Safety fallback — call onComplete after 8s even if video never ends
    const fallback = setTimeout(finish, 8000);
    return () => clearTimeout(fallback);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{
        transition: 'opacity 0.7s ease',
        opacity: fading ? 0 : 1,
      }}
      aria-hidden="true"
    >
      {/* Desktop video */}
      <video
        className="absolute inset-0 w-full h-full object-cover hidden sm:block"
        src="/loading_web.mp4"
        autoPlay
        muted
        playsInline
        onEnded={finish}
      />

      {/* Mobile video */}
      <video
        className="absolute inset-0 w-full h-full object-cover block sm:hidden"
        src="/loading_mobile.mp4"
        autoPlay
        muted
        playsInline
        onEnded={finish}
      />

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.45)' }}
      />
    </div>
  );
}
