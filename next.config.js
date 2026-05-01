/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "pics.avs.io" },
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "restcountries.com" },
    ],
  },
};

module.exports = nextConfig;
