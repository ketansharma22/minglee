/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
  },
  experimental: {
    serverComponentsExternalPackages: ['firebase', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
  },
};

module.exports = nextConfig;
