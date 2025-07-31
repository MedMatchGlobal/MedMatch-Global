/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true, // Important for App Router support
  },
};

module.exports = nextConfig;
