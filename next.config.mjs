/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdf-parse uses a dynamic require that webpack mangles; keep it external so
  // the /api/extract route loads it as a plain Node module at runtime.
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
};

export default nextConfig;
