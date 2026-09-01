import { ImageResponse } from 'next/og';

export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

/** App icon / push badge: a wax-seal dot on near-black. Served at /icon. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#090a0c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 40,
        }}
      >
        <div style={{ width: 72, height: 72, borderRadius: 9999, background: '#c9a15a', boxShadow: '0 0 0 18px rgba(201,161,90,0.18)' }} />
      </div>
    ),
    size,
  );
}
