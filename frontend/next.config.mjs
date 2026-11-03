// Paths the FastAPI backend serves. In "same origin" mode the browser only talks to the
// frontend address and Next.js forwards these paths to BACKEND_URL (no cross-domain cookie).
// BACKEND_URL is read when the app is built, so set it before `next build`.
const API_PATHS = ['auth', 'handovers', 'questions', 'statements', 'pieces', 'health'];

const backendUrl = (process.env.BACKEND_URL || '').trim().replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  experimental: {
    // The AI analysis can run for a minute or more
    proxyTimeout: 300000,
  },
  async rewrites() {
    if (!backendUrl) return [];
    return API_PATHS.flatMap((p) => [
      { source: `/${p}`, destination: `${backendUrl}/${p}` },
      { source: `/${p}/:path*`, destination: `${backendUrl}/${p}/:path*` },
    ]);
  },
};

export default nextConfig;
