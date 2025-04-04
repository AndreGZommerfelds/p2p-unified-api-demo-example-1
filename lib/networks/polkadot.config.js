/**
 * Polkadot network configurations
 * Contains RPC endpoints and other network-specific information
 */

export const polkadotNetworks = {
  mainnet: {
    name: "Polkadot Mainnet",
    rpcUrl: "wss://rpc.polkadot.io",
    explorerUrl: "https://polkadot.subscan.io",
    decimals: 10,
    symbol: "DOT",
  },
  westend: {
    name: "Westend Testnet",
    rpcUrl: "wss://westend-rpc.polkadot.io",
    explorerUrl: "https://westend.subscan.io",
    decimals: 12,
    symbol: "WND",
  },
  // Add more networks as needed
};

/**
 * Get RPC provider URL for specified Polkadot network
 * @param {string} network - Network name (mainnet, westend, etc.)
 * @returns {string} RPC URL
 */
export function getPolkadotRpcProvider(network) {
  if (!network) {
    console.error("No network specified, defaulting to mainnet");
    network = "mainnet";
  }

  const networkConfig = polkadotNetworks[network.toLowerCase()];

  if (!networkConfig) {
    throw new Error(`Unsupported Polkadot network: ${network}`);
  }

  return networkConfig.rpcUrl;
}

/**
 * Get keystore path from environment variables
 * @param {string} network - Network name (mainnet, westend, etc.)
 * @returns {string} Keystore path
 */
export function getPolkadotKeystorePath(network) {
  if (!network) {
    console.error(
      "No network specified for keystore path, defaulting to mainnet"
    );
    network = "mainnet";
  }

  const envVar = `KEYSTORE_PATH_POLKADOT_${network.toUpperCase()}`;
  const keystorePath = process.env[envVar];

  if (!keystorePath) {
    throw new Error(
      `Missing keystore path for Polkadot ${network}. Set ${envVar} in .env file`
    );
  }

  return keystorePath;
}

/**
 * Get keystore password from environment variables
 * @param {string} network - Network name (mainnet, westend, etc.)
 * @returns {string} Keystore password
 */
export function getPolkadotKeystorePassword(network) {
  if (!network) {
    console.error(
      "No network specified for keystore password, defaulting to mainnet"
    );
    network = "mainnet";
  }

  const envVar = `KEYSTORE_PASSWORD_POLKADOT_${network.toUpperCase()}`;
  const password = process.env[envVar];

  if (!password) {
    throw new Error(
      `Missing keystore password for Polkadot ${network}. Set ${envVar} in .env file`
    );
  }

  return password;
}
