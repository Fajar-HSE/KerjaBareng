/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Kurangi memory usage saat build */
  swcMinify: true,
  experimental: {
    /* Matikan source maps di development untuk hemat memori */
    webpackBuildWorker: false,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      /* Di mode dev, matikan source map yang besar */
      config.devtool = false;
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-Content-Type-Options",     value: "nosniff" },
          { key: "X-XSS-Protection",           value: "1; mode=block" },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
          {
            key:   "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
