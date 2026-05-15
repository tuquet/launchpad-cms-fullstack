/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NEXT_OUTPUT || undefined,
  // Enable Next.js 16 cache components
  cacheComponents: true,
  turbopack: {
    root: process.cwd().replace('/next', ''),
  },
  images: {
    // Cho phép load ảnh từ các mạng Docker ảo (Private IP) để tránh lỗi SSRF block trong Next.js 14+
    dangerouslyAllowLocalIP: true,
    // Disable image optimization for localhost in development
    ...(process.env.NODE_ENV === 'development' ? { unoptimized: true } : {}),
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'strapi',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: process.env.IMAGE_HOSTNAME || 'localhost',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.strapiapp.com',
      },
    ],
  },
  pageExtensions: ['ts', 'tsx'],
  // async rewrites() {
  //   // Sử dụng URL nội bộ khi chạy trong Docker, mặc định là http://strapi:1337
  //   const strapiUrl =
  //     process.env.STRAPI_INTERNAL_URL ||
  //     process.env.NEXT_PUBLIC_API_URL ||
  //     'http://strapi:1337';
  //   return [
  //     {
  //       source: '/uploads/:path*',
  //       destination: `${strapiUrl}/uploads/:path*`,
  //     },
  //   ];
  // },
  async redirects() {
    if (process.env.NEXT_PUBLIC_API_URL === undefined) {
      console.warn(
        '[next.config] NEXT_PUBLIC_API_URL is not defined. Skipping redirect generation.'
      );
      return [];
    }

    let redirections = [];
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/redirections`
      );
      const result = await res.json();
      if (result?.data && Array.isArray(result.data)) {
        const redirectItems = result.data.map(({ source, destination }) => {
          return {
            source: `/:locale${source}`,
            destination: `/:locale${destination}`,
            permanent: false,
          };
        });

        redirections = redirections.concat(redirectItems);
      }

      return redirections;
    } catch (error) {
      // Log warning but don't fail build - redirects are optional
      console.warn(
        '[next.config] Failed to fetch redirects from Strapi:',
        error instanceof Error ? error.message : error
      );
      return [];
    }
  },
};

export default nextConfig;
