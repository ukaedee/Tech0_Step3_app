/** @type {import('next').NextConfig} */
const nextConfig = {
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