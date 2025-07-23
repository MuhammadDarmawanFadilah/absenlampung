import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
    optimizeCss: true,
  },
  
  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Compress responses
  compress: true,
  
  // Build performance
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            enforce: true,
          },
        },
      };
    }
    return config;
  },
  
  // ESLint configuration - treat warnings as warnings not errors
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },  // Optimasi images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "smarthr.my.id",
      },
      {
        protocol: "http",
        hostname: "smarthr.my.id",
      },
      // Backend URL untuk images
      ...(process.env.NEXT_PUBLIC_BACKEND_URL ? [
        {
          protocol: new URL(process.env.NEXT_PUBLIC_BACKEND_URL).protocol.slice(0, -1) as "http" | "https",
          hostname: new URL(process.env.NEXT_PUBLIC_BACKEND_URL).hostname,
          port: new URL(process.env.NEXT_PUBLIC_BACKEND_URL).port || undefined,
        }
      ] : []),
      // Frontend URL untuk images yang di-proxy
      ...(process.env.NEXT_PUBLIC_BASE_URL ? [
        {
          protocol: new URL(process.env.NEXT_PUBLIC_BASE_URL).protocol.slice(0, -1) as "http" | "https",
          hostname: new URL(process.env.NEXT_PUBLIC_BASE_URL).hostname,
          port: new URL(process.env.NEXT_PUBLIC_BASE_URL).port || undefined,
        }
      ] : []),
    ],
    // Optimasi untuk mengurangi requests
    minimumCacheTTL: 60,
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
  },
  // CORS configuration untuk direct backend access
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  // Redirect API calls to backend
  async rewrites() {
    return [
      // Disabled to avoid double /api prefix since we're making direct calls
      // {
      //   source: '/api/:path*',
      //   destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/:path*`,
      // },
    ];
  },
};

export default nextConfig;
