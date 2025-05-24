/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
  // Disable font optimization for environments without internet access
  optimizeFonts: false,
  experimental: {
    fontLoaders: []
  }
};

module.exports = nextConfig;
