/**
 * SEI Blockchain Configuration
 *
 * This file contains constants and configuration settings for interacting with the SEI blockchain.
 */

// SEI networks
export const SEI_NETWORKS = {
  MAINNET: "sei-mainnet",
  TESTNET: "sei-testnet",
};

// RPC Endpoints by network - hardcoded values
export const SEI_RPC_ENDPOINTS = {
  [SEI_NETWORKS.MAINNET]: "https://rpc.sei-apis.com",
  [SEI_NETWORKS.TESTNET]: "https://rpc.atlantic-2.sei-apis.com",
};

// Default gas settings
export const SEI_DEFAULT_GAS = {
  STAKE: "250000", // Gas for staking transactions
  UNSTAKE: "250000", // Gas for unstaking transactions
  WITHDRAW: "200000", // Gas for withdrawal transactions
};

// Denomination constants
export const SEI_DENOM = {
  MAIN: "usei", // Base unit for SEI (1 SEI = 1,000,000 usei)
};

// Transaction fee settings
export const SEI_DEFAULT_FEES = {
  [SEI_NETWORKS.MAINNET]: {
    amount: [{ denom: SEI_DENOM.MAIN, amount: "2000" }],
  },
  [SEI_NETWORKS.TESTNET]: {
    amount: [{ denom: SEI_DENOM.MAIN, amount: "2000" }],
  },
};

// Validation helpers
export const ADDRESS_PATTERN = /^sei1[a-z0-9]{38}$/;
export const MNEMONIC_PATTERN = /^(([a-z]+ ){11}|([a-z]+ ){23})[a-z]+$/;

/**
 * Converts SEI to uSEI (the base denomination used in transactions)
 * 1 SEI = 1,000,000 uSEI
 *
 * @param {number} amount - Amount in SEI
 * @returns {string} - Amount in uSEI as a string
 */
export function seiToUsei(amount) {
  // Convert to uSEI and ensure 0 decimal places
  return BigInt(Math.floor(amount * 1000000)).toString();
}

/**
 * Converts uSEI to SEI
 *
 * @param {string|number} amount - Amount in uSEI
 * @returns {number} - Amount in SEI as a number
 */
export function useiToSei(amount) {
  return Number(amount) / 1000000;
}

/**
 * Creates transaction fee object for SEI
 *
 * @param {string} network - SEI network
 * @param {string} gasLimit - Gas limit for the transaction
 * @returns {Object} - Fee object for transaction
 */
export function createSeiFee(network, gasLimit) {
  return {
    amount: SEI_DEFAULT_FEES[network].amount,
    gas: gasLimit,
  };
}

/**
 * Validates if a string is a valid SEI address
 *
 * @param {string} address - Address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidSeiAddress(address) {
  return ADDRESS_PATTERN.test(address);
}

/**
 * Get RPC endpoint for a SEI network
 *
 * @param {string} network - SEI network name
 * @returns {string} - RPC endpoint URL
 * @throws {Error} If the network is not supported
 */
export function getSeiRpcEndpoint(network) {
  const endpoint = SEI_RPC_ENDPOINTS[network];

  if (!endpoint) {
    throw new Error(`Unsupported SEI network: ${network}`);
  }

  return endpoint;
}
