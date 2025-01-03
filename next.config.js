/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    appDir: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  }
}

module.exports = nextConfig 
