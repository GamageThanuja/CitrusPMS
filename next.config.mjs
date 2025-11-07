/** Base Next.js config */
const baseConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
  },
};

async function getNextConfig() {
  let userConfig = {};
  try {
    // Dynamically import the user configuration file if it exists.
    const imported = await import("./v0-user-next.config");
    userConfig = imported.default || imported;
  } catch (e) {
    // If the file doesn't exist, ignore the error.
  }

  // Merge userConfig values into baseConfig.
  for (const key in userConfig) {
    if (typeof baseConfig[key] === "object" && !Array.isArray(baseConfig[key])) {
      baseConfig[key] = {
        ...baseConfig[key],
        ...userConfig[key],
      };
    } else {
      baseConfig[key] = userConfig[key];
    }
  }

  return baseConfig;
}

// Export the configuration using ES module syntax.
// Next.js accepts a promise that resolves to a config object.
export default getNextConfig();
