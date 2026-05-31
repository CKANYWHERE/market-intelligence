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
    // 광고 스크립트가 로드된 후 한 번만 push
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense 스크립트 미로드 시 무시
    }
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
