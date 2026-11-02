import { ImageResponse } from 'next/og';
import { siteConfig } from '../lib/brand';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = siteConfig.name;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#f6f3ed',
          color: '#151515',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          position: 'relative',
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            border: '1px solid rgba(21, 21, 21, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            height: 558,
            justifyContent: 'center',
            width: 1128,
          }}
        >
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 122, fontStyle: 'italic', lineHeight: 1 }}>
            {siteConfig.name.split(' ')[0]}
          </span>
          <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 24, letterSpacing: 18, marginTop: 24 }}>
            {siteConfig.name.split(' ').slice(1).join(' ').toUpperCase()}
          </span>
        </div>
      </div>
    ),
    size,
  );
}
