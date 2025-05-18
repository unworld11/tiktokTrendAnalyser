import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['p16-sign-sg.tiktokcdn.com', 'p16-sign-va.tiktokcdn.com', 'picsum.photos'],
  },
  experimental: {
    serverComponentsExternalPackages: ['formidable'],
  },
  api: {
    // Allow reading form data with formidable
    bodyParser: false,
  },
};

export default nextConfig;
