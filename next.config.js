/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'crests.football-data.org' },
      { protocol: 'https', hostname: '**.football-data.org' }
    ]
  },
  experimental: {
    // Set Router Cache TTL to 0 for dynamic pages so router.refresh()
    // always fetches fresh server data instead of serving a stale
    // client-side cached payload (the root cause of picks disappearing).
    staleTimes: {
      dynamic: 0,
    }
  }
};
module.exports = nextConfig;
