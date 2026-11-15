import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The API reads data/*.csv and data/*.json from disk at request time. This
  // makes sure those files are shipped with the serverless functions on Vercel.
  // (data/private/ is not matched, and is gitignored anyway.)
  outputFileTracingIncludes: {
    "/api/**/*": ["./data/*.csv", "./data/*.json"],
  },
  // data/private/ holds emails. It is gitignored, so it is not on the host
  // anyway; this also keeps it out of the function bundle when someone deploys
  // straight from a laptop.
  outputFileTracingExcludes: {
    "/**/*": ["./data/private/**/*"],
  },
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
