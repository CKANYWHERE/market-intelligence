'use client';

import { useEffect, useRef } from 'react';

interface Props {
  slot:   string;          // AdSense ad unit slot ID
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdBanner({ slot, format = 'auto', className = '' }: Props) {
  const adRef  = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    const tryPush = () => {
      // 컨테이너 너비가 0이면 push 하지 않음 (availableWidth=0 에러 방지)
      if (!adRef.current || adRef.current.offsetWidth === 0) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      } catch {
        // AdSense 스크립트 미로드 시 무시
      }
    };
    // 레이아웃이 완전히 그려진 후 실행
    const raf = requestAnimationFrame(tryPush);
    return () => cancelAnimationFrame(raf);
  }, []);

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!clientId) return null; // 개발 환경 또는 미설정 시 광고 영역 숨김

  return (
    <div className={`overflow-hidden ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
