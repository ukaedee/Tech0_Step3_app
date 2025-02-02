/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // バックエンドのAPI URL
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' 
      ? 'http://backend:8080'  // Railway.app環境
      : 'http://localhost:8080', // ローカル開発環境
  },
  // その他の設定
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig 