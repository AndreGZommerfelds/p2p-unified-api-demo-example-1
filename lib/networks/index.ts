// Export signing functions
import { signSolanaTransaction } from "./signing-solana";
import { signPolkadotTransaction } from "./signing-polkadot";
import {
  getPolkadotRpcProvider,
  getPolkadotKeystorePath,
  getPolkadotKeystorePassword,
} from "./polkadot.config.js";

// Re-export the functions
export { signSolanaTransaction };
export { signPolkadotTransaction };

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
  unsignedTransactionData: string;
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
  } else {
    throw new Error(`Unsupported chain type: ${chainLower}`);
  }
}
