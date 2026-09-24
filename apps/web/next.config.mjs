const API = process.env.API_URL
  ?? (process.env.API_HOST ? `https://${process.env.API_HOST}` : 'http://localhost:4000');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ให้เบราว์เซอร์เรียก /api/* ที่ origin เดียวกัน (ไม่ต้องตั้ง CORS) รวมถึงรูป placeholder
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API}/api/:path*` },
      { source: '/uploads/:path*', destination: `${API}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
