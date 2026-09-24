import type { Config } from 'tailwindcss';

// tokens ตาม 07-UI-UX §2 — สีหลักอ่านจาก CSS variable --primary (ตั้งค่าจากหลังบ้าน)
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '15px', screens: { '2xl': '1320px' } },
    extend: {
      colors: {
        primary: { DEFAULT: 'var(--primary)', hover: '#C42703', soft: '#FDE3DC' },
        body: '#F2F3F8',
        ink: { DEFAULT: '#1B1B28', secondary: '#4A4A5A', muted: '#8A8A9A' },
        line: '#E6E7EB',
        success: '#0ABB75',
        warning: '#FFA707',
        danger: '#EF486A',
      },
      fontFamily: { sans: ['"Noto Sans Thai"', '"Open Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'] },
      boxShadow: { card: '0 1px 3px rgba(0,0,0,.06)', hover: '0 6px 16px rgba(0,0,0,.10)' },
      borderRadius: { card: '4px' },
    },
  },
  plugins: [],
};

export default config;
