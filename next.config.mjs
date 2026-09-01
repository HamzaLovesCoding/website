/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Next 16 only serves qualities declared here.
    qualities: [75, 80, 82, 84],
  },
};

export default nextConfig;
