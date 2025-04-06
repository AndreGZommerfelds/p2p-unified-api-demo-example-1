/**
 * Celestia Blockchain Configuration
 *
 * This file contains constants and configuration settings for interacting with the Celestia blockchain.
 */

// Celestia networks
export const CELESTIA_NETWORKS = {
  MAINNET_BETA: "celestia-mainnet-beta",
  MOCHA_TESTNET: "celestia-mocha-testnet",
};

// RPC Endpoints by network - hardcoded values instead of using environment variables
export const CELESTIA_RPC_ENDPOINTS = {
  [CELESTIA_NETWORKS.MAINNET_BETA]: "https://celestia-rpc.polkachu.com",
  [CELESTIA_NETWORKS.MOCHA_TESTNET]: "https://rpc-mocha.pops.one",
};

// Default gas settings
export const CELESTIA_DEFAULT_GAS = {
  STAKE: "250000", // Gas for staking transactions
  UNSTAKE: "250000", // Gas for unstaking transactions
  WITHDRAW: "200000", // Gas for withdrawal transactions
};

// Denomination constants
export const CELESTIA_DENOM = {
  MAIN: "utia", // Base unit for Celestia (1 TIA = 1,000,000 utia)
};

// Transaction fee settings
export const CELESTIA_DEFAULT_FEES = {
  [CELESTIA_NETWORKS.MAINNET_BETA]: {
    amount: [{ denom: CELESTIA_DENOM.MAIN, amount: "2000" }],
  },
  [CELESTIA_NETWORKS.MOCHA_TESTNET]: {
    amount: [{ denom: CELESTIA_DENOM.MAIN, amount: "2000" }],
  },
};

// Validation helpers
export const ADDRESS_PATTERN = /^celestia1[a-z0-9]{38}$/;
export const MNEMONIC_PATTERN = /^(([a-z]+ ){11}|([a-z]+ ){23})[a-z]+$/;

/**
 * Converts TIA to uTIA (the base denomination used in transactions)
 * 1 TIA = 1,000,000 uTIA
 *
 * @param {number} amount - Amount in TIA
 * @returns {string} - Amount in uTIA as a string
 */
export function tiaToUtia(amount) {
  // Convert to uTIA and ensure 0 decimal places
  return BigInt(Math.floor(amount * 1000000)).toString();
}

/**
 * Converts uTIA to TIA
 *
 * @param {string|number} amount - Amount in uTIA
 * @returns {number} - Amount in TIA as a number
 */
export function utiaToTia(amount) {
  return Number(amount) / 1000000;
}

/**
 * Creates transaction fee object for Celestia
 *
 * @param {string} network - Celestia network
 * @param {string} gasLimit - Gas limit for the transaction
 * @returns {Object} - Fee object for transaction
 */
export function createCelestiaFee(network, gasLimit) {
  return {
    amount: CELESTIA_DEFAULT_FEES[network].amount,
    gas: gasLimit,
  };
}

/**
 * Validates if a string is a valid Celestia address
 *
 * @param {string} address - Address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidCelestiaAddress(address) {
  return ADDRESS_PATTERN.test(address);
}

/**
 * Get RPC endpoint for a Celestia network
 *
 * @param {string} network - Celestia network name
 * @returns {string} - RPC endpoint URL
 * @throws {Error} If the network is not supported
 */
export function getCelestiaRpcEndpoint(network) {
  const endpoint = CELESTIA_RPC_ENDPOINTS[network];

  if (!endpoint) {
    throw new Error(`Unsupported Celestia network: ${network}`);
  }

  return endpoint;
}
