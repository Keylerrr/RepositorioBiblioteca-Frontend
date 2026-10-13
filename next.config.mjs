/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // Server Function arguments include passwords during authentication.
  logging: { serverFunctions: false },
  // Django's API endpoints require their trailing slash, including POSTs.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "https://repositorio-biblioteca-backend.onrender.com").replace(/\/+$/, "");
    return [
      // Avoid an empty wildcard producing a double slash in Vercel's destination.
      { source: "/api/platforms/", destination: `${apiUrl}/api/platforms/` },
      ...["accounts", "audit", "catalog", "harvesting", "journals", "platforms"].map((module) => ({
        source: `/api/${module}/:path*`, destination: `${apiUrl}/api/${module}/:path*/`,
      })),
    ];
  },
};

export default nextConfig;
