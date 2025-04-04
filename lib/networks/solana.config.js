/**
 * Solana network configurations
 * Contains RPC endpoints and other network-specific information
 */

export const solanaNetworks = {
  "mainnet-beta": {
    name: "Solana Mainnet Beta",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    explorerUrl: "https://explorer.solana.com",
    decimals: 9,
    symbol: "SOL",
  },
  testnet: {
    name: "Solana Testnet",
    rpcUrl: "https://api.testnet.solana.com",
    explorerUrl: "https://explorer.solana.com/?cluster=testnet",
    decimals: 9,
    symbol: "SOL",
  },
  // Note: Devnet not supported yet
};

/**
 * Get RPC provider URL for specified Solana network
 * @param {string} network - Network name (mainnet-beta, testnet)
 * @returns {string} RPC URL
 */
export function getSolanaRpcProvider(network) {
  const networkConfig = solanaNetworks[network.toLowerCase()];

  if (!networkConfig) {
    throw new Error(`Unsupported Solana network: ${network}`);
  }

  return networkConfig.rpcUrl;
}

/**
 * Get keystore path from environment variables
 * @param {string} network - Network name (mainnet-beta, testnet)
 * @returns {string} Keystore path
 */
export function getSolanaKeystorePath(network) {
  // Handle hyphenated network names for environment variables
  const envNetwork = network.toUpperCase();
  const envVar = `KEYSTORE_PATH_SOLANA_${envNetwork}`;
  const keystorePath = process.env[envVar];

  if (!keystorePath) {
    throw new Error(
      `Missing keystore path for Solana ${network}. Set ${envVar} in .env file`
    );
  }

  return keystorePath;
}

/**
 * Get keystore password from environment variables
 * @param {string} network - Network name (mainnet-beta, testnet)
 * @returns {string} Keystore password
 */
export function getSolanaKeystorePassword(network) {
  // Handle hyphenated network names for environment variables
  const envNetwork = network.toUpperCase();
  const envVar = `KEYSTORE_PASSWORD_SOLANA_${envNetwork}`;
  const password = process.env[envVar];

  if (!password) {
    throw new Error(
      `Missing keystore password for Solana ${network}. Set ${envVar} in .env file`
    );
  }

  return password;
}
