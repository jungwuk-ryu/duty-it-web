import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    qualities: [70, 75],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dutyit.net',
        pathname: '/uploads/**',
      },
    ],
  },
  async rewrites() {
    // Public sitemap files stay at the origin root so they cover every route.
    return [{ source: '/sitemap-:name.xml', destination: '/sitemaps/:name' }];
  },
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
