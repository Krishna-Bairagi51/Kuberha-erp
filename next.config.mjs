/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, 
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Content-Type',
            value: 'image/x-icon',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
    {
      source: '/',
      destination: '/login',
      permanent: true,
    }
  ]
},
}


export default nextConfig
