/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "prod.spline.design" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  }
};

export default nextConfig;
