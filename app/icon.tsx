import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#030712',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 3,
          padding: '4px 4px 4px 4px',
        }}
      >
        {/* Bar 1 */}
        <div style={{ width: 5, height: 8, background: '#22c55e', borderRadius: 1 }} />
        {/* Bar 2 */}
        <div style={{ width: 5, height: 13, background: '#22c55e', borderRadius: 1 }} />
        {/* Bar 3 */}
        <div style={{ width: 5, height: 18, background: '#4ade80', borderRadius: 1 }} />
      </div>
    ),
    { ...size }
  );
}
