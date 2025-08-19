/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
    // Allow development origins for CORS
    allowedDevOrigins: [
        'http://localhost:4000',
        'http://127.0.0.1:4000',
        'http://172.24.128.1:4000'
    ],
}

export default nextConfig