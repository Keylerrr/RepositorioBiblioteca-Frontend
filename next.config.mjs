/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // Server Function arguments include passwords during authentication.
  logging: { serverFunctions: false },
  // Django's accounts endpoints require their trailing slash, including POSTs.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "https://repositorio-biblioteca-backend.onrender.com").replace(/\/+$/, "");
    return [{ source: "/api/accounts/:path*", destination: `${apiUrl}/api/accounts/:path*/` }];
  },
};

export default nextConfig;
