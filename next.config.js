/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  reactStrictMode: true,
  trailingSlash: true, // optional, helps with some static hosts
};

module.exports = nextConfig;
