/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export untuk Netlify (tanpa server) / Static export for Netlify (serverless)
  output: "export",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
