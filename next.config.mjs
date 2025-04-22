/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "rugged-gecko-347.convex.cloud",
      },
    ],
  },
};

export default nextConfig;
