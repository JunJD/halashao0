/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.externals.push({
      canvas: 'canvas',
      jsdom: 'jsdom',
    });
    return config;
  },
};

module.exports = nextConfig;
