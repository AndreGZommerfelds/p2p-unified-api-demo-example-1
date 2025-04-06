/**
 * Network configurations index
 * Central export for all network configuration modules
 */

// Import signing functions
import { signPolkadotTransaction } from "./signing-polkadot";
import { signSolanaTransaction } from "./signing-solana";
import { signCelestiaTransaction } from "./signing-celestia";
import {
  getPolkadotRpcProvider,
  getPolkadotKeystorePath,
  getPolkadotKeystorePassword,
} from "./polkadot.config.js";

// Import the SUPPORTED_CHAINS const and other helper functions
import { getCelestiaRpcEndpoint } from "./celestia.config.js";

// Export signing functions
export {
  signPolkadotTransaction,
  signSolanaTransaction,
  signCelestiaTransaction,
};

export const SUPPORTED_CHAINS = {
  POLKADOT: "polkadot",
  SOLANA: "solana",
  CELESTIA: "celestia",
};

/**
 * Get the wallet mnemonic for the given chain and network
 * @throws {Error} If the required environment variable is not defined
 */
export function getWalletMnemonic(chain: string, network: string): string {
  chain = chain.toLowerCase();
  network = network.toLowerCase();

  // Format network key for environment variable lookup
  // First try with original hyphens, then with underscores
  const hyphenNetworkKey = network.toUpperCase();
  const underscoreNetworkKey = network.toUpperCase().replace(/-/g, "_");

  if (chain === SUPPORTED_CHAINS.CELESTIA) {
    // Try both formats - first with hyphens, then with underscores
    const hyphenEnvKey = `CELESTIA_WALLET_MNEMONIC_${hyphenNetworkKey}`;
    const underscoreEnvKey = `CELESTIA_WALLET_MNEMONIC_${underscoreNetworkKey}`;

    // Check for mnemonic with hyphens format
    let mnemonic = process.env[hyphenEnvKey];

    // If not found, try underscore format
    if (!mnemonic) {
      mnemonic = process.env[underscoreEnvKey];
    }

    if (!mnemonic) {
      throw new Error(
        `Required environment variable ${hyphenEnvKey} or ${underscoreEnvKey} is not defined`
      );
    }

    return mnemonic;
  } else {
    throw new Error(`Wallet mnemonic not supported for chain: ${chain}`);
  }
}

/**
 * Get the wallet address for the given chain and network
 * @throws {Error} If the required environment variable is not defined
 */
export function getWalletAddress(chain: string, network: string): string {
  chain = chain.toLowerCase();
  network = network.toLowerCase();

  // Format network key for environment variable lookup
  // First try with original hyphens, then with underscores
  const hyphenNetworkKey = network.toUpperCase();
  const underscoreNetworkKey = network.toUpperCase().replace(/-/g, "_");

  let envKey = "";
  let altEnvKey = "";

  if (chain === SUPPORTED_CHAINS.CELESTIA) {
    // Celestia uses a different pattern for environment variables
    // Try both formats
    envKey = `CELESTIA_WALLET_ADDRESS_${hyphenNetworkKey}`;
    altEnvKey = `CELESTIA_WALLET_ADDRESS_${underscoreNetworkKey}`;
  } else {
    // Other chains follow a common pattern
    envKey = `WALLET_ADDRESS_${chain.toUpperCase()}_${underscoreNetworkKey}`;
  }

  // First try the primary env key
  let address = process.env[envKey];

  // If not found and we have an alternate key, try that
  if (!address && altEnvKey) {
    address = process.env[altEnvKey];
  }

  if (!address) {
    throw new Error(
      `Required environment variable ${envKey}${
        altEnvKey ? ` or ${altEnvKey}` : ""
      } is not defined`
    );
  }

  return address;
}

/**
 * Get the RPC provider for the given chain and network
 */
export function getRpcProvider(chain: string, network: string): string {
  chain = chain.toLowerCase();
  network = network.toLowerCase();

  if (chain === SUPPORTED_CHAINS.CELESTIA) {
    return getCelestiaRpcEndpoint(network);
  } else if (chain === SUPPORTED_CHAINS.POLKADOT) {
    return getPolkadotRpcProvider(network);
  } else {
    throw new Error(`RPC provider not supported for chain: ${chain}`);
  }
}

/**
 * Get the appropriate signing function for a given chain
 * @param chain The blockchain to sign for
 * @returns The signing function for the given chain
 */
export function getSigningFunction(chain: string) {
  const signers: Record<string, any> = {
    polkadot: signPolkadotTransaction,
    solana: signSolanaTransaction,
    celestia: signCelestiaTransaction,
  };

  return signers[chain.toLowerCase()];
}

/**
 * Get required parameters for signing a transaction
 * @param chain The blockchain to get parameters for
 * @returns Array of required parameter names
 */
export function getRequiredSigningParams(chain: string): string[] {
  const paramMap: Record<string, string[]> = {
    polkadot: ["rpcProvider", "keystorePath", "password", "rawTransaction"],
    solana: ["rpcProvider", "secretKey", "rawTransaction"],
    celestia: ["rpcProvider", "mnemonic", "stakerAddress", "rawTransaction"],
  };

  return paramMap[chain.toLowerCase()] || [];
}

/**
 * Get environment variable names for signing parameters
 * @param chain The blockchain to get env var names for
 * @param network The network within the blockchain
 * @returns Record mapping parameter names to environment variable names
 */
export function getSigningEnvVars(
  chain: string,
  network: string
): Record<string, string> {
  // Common mappings for all chains
  const commonVars: Record<string, string> = {
    rpcProvider: `${chain.toUpperCase()}_${network.toUpperCase()}_RPC`,
  };

  // Chain-specific mappings
  const chainVars: Record<string, Record<string, string>> = {
    polkadot: {
      keystorePath: `${chain.toUpperCase()}_KEYSTORE_PATH`,
      password: `${chain.toUpperCase()}_KEYSTORE_PASSWORD`,
    },
    solana: {
      secretKey: `${chain.toUpperCase()}_WALLET_PRIVATE_KEY`,
    },
    celestia: {
      mnemonic: `${chain.toUpperCase()}_WALLET_MNEMONIC`,
    },
  };

  return {
    ...commonVars,
    ...(chainVars[chain.toLowerCase()] || {}),
  };
}

/**
 * Generic function to sign a transaction based on the chain type
 * @param chain - The blockchain type (eth_ssv, solana, etc.)
 * @param network - The network (mainnet, testnet)
 * @param unsignedTransactionData - The raw transaction data from the API
 * @returns Promise resolving to the transaction hash
 */
export async function signTransaction({
  chain,
  network,
  unsignedTransactionData,
}: {
  chain: string;
  network: string;
  unsignedTransactionData: any;
}): Promise<string> {
  // Convert chain to lowercase for case-insensitive comparison
  const chainLower = chain.toLowerCase();

  // Route to the appropriate chain-specific signing function
  if (chainLower === "solana" || chainLower === "sol") {
    return signSolanaTransaction({
      network,
      unsignedTransactionData,
    });
  } else if (chainLower === "polkadot" || chainLower === "dot") {
    // Get Polkadot configuration from helper functions
    const rpcProvider = getPolkadotRpcProvider(network);
    const keystorePath = getPolkadotKeystorePath(network);
    const password = getPolkadotKeystorePassword(network);

    return signPolkadotTransaction({
      rpcProvider,
      keystorePath,
      password,
      rawTransaction: unsignedTransactionData,
    });
  } else if (chainLower === "celestia") {
    // For Celestia, we need the mnemonic and staker address
    console.log("[signTransaction] Using Celestia signing flow");
    console.log(
      "[signTransaction] Celestia transaction data type:",
      typeof unsignedTransactionData
    );

    // Use the helper functions for consistency
    const rpcProvider = getRpcProvider(chain, network);
    console.log(`[signTransaction] Using RPC provider: ${rpcProvider}`);

    const mnemonic = getWalletMnemonic(chain, network);
    const stakerAddress = getWalletAddress(chain, network);

    if (typeof unsignedTransactionData === "object") {
      console.log("[signTransaction] Celestia transaction data format:", {
        hasMessages: !!unsignedTransactionData.messages,
        hasFee: !!unsignedTransactionData.fee,
        hasMemo: !!unsignedTransactionData.memo,
      });
    }

    return signCelestiaTransaction({
      rpcProvider,
      mnemonic,
      stakerAddress,
      rawTransaction: unsignedTransactionData,
    });
  } else {
    throw new Error(`Unsupported chain type: ${chainLower}`);
  }
}
