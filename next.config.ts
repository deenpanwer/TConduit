import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false, // SIGNIFICANT performance boost in dev demos (no double-renders)
  /* config options here */
  async redirects() {
    return [
      {
        source: '/1',
        destination: '/',
        permanent: true,
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.brandfetch.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fiverr-res.cloudinary.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  devIndicators: {
    position: 'top-right',
  },
};

export default nextConfig;
