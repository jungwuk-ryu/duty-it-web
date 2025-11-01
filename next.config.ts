import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = {
  async redirects() {
    return [
      {
        source: '/submit-event',
        destination: process.env['SUBMIT_FORM_URL'],
        permanent: false,
      },
    ]
  },
}

export default nextConfig;
