/**
 * Network configurations index
 * Central export for all network configuration modules
 */

// Export all network configurations
export * from "./polkadot.config.js";
export * from "./solana.config.js";

// Supported chains and networks
export const SUPPORTED_CHAINS = {
  POLKADOT: "polkadot",
  SOLANA: "solana",
};

export const SUPPORTED_NETWORKS = {
  // Polkadot networks
  POLKADOT_MAINNET: "mainnet",
  POLKADOT_WESTEND: "westend",

  // Solana networks
  SOLANA_MAINNET_BETA: "mainnet-beta",
  SOLANA_TESTNET: "testnet",
};

/**
 * Get RPC provider URL based on chain and network
 * @param {string} chain - Chain name (polkadot, solana, etc.)
 * @param {string} network - Network name (mainnet, testnet, etc.)
 * @returns {string} RPC URL
 */
export function getRpcProvider(chain, network) {
  if (!chain) throw new Error("Chain parameter is required");
  if (!network) throw new Error("Network parameter is required");

  chain = chain.toLowerCase();

  if (chain === SUPPORTED_CHAINS.POLKADOT) {
    const { getPolkadotRpcProvider } = require("./polkadot.config.js");
    return getPolkadotRpcProvider(network);
  } else if (chain === SUPPORTED_CHAINS.SOLANA) {
    const { getSolanaRpcProvider } = require("./solana.config.js");
    return getSolanaRpcProvider(network);
  } else {
    throw new Error(
      `Unsupported chain: ${chain}. Supported chains are: ${Object.values(
        SUPPORTED_CHAINS
      ).join(", ")}`
    );
  }
}

/**
 * Get keystore path based on chain and network
 * @param {string} chain - Chain name (polkadot, solana, etc.)
 * @param {string} network - Network name (mainnet, testnet, etc.)
 * @returns {string} Keystore path
 */
export function getKeystorePath(chain, network) {
  if (!chain) throw new Error("Chain parameter is required");
  if (!network) throw new Error("Network parameter is required");

  chain = chain.toLowerCase();

  if (chain === SUPPORTED_CHAINS.POLKADOT) {
    const { getPolkadotKeystorePath } = require("./polkadot.config.js");
    return getPolkadotKeystorePath(network);
  } else if (chain === SUPPORTED_CHAINS.SOLANA) {
    const { getSolanaKeystorePath } = require("./solana.config.js");
    return getSolanaKeystorePath(network);
  } else {
    throw new Error(
      `Unsupported chain: ${chain}. Supported chains are: ${Object.values(
        SUPPORTED_CHAINS
      ).join(", ")}`
    );
  }
}

/**
 * Get keystore password based on chain and network
 * @param {string} chain - Chain name (polkadot, solana, etc.)
 * @param {string} network - Network name (mainnet, testnet, etc.)
 * @returns {string} Keystore password
 */
export function getKeystorePassword(chain, network) {
  if (!chain) throw new Error("Chain parameter is required");
  if (!network) throw new Error("Network parameter is required");

  chain = chain.toLowerCase();

  if (chain === SUPPORTED_CHAINS.POLKADOT) {
    const { getPolkadotKeystorePassword } = require("./polkadot.config.js");
    return getPolkadotKeystorePassword(network);
  } else if (chain === SUPPORTED_CHAINS.SOLANA) {
    const { getSolanaKeystorePassword } = require("./solana.config.js");
    return getSolanaKeystorePassword(network);
  } else {
    throw new Error(
      `Unsupported chain: ${chain}. Supported chains are: ${Object.values(
        SUPPORTED_CHAINS
      ).join(", ")}`
    );
  }
}
