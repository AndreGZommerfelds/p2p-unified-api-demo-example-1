/**
 * Network configurations index
 * Central export for all network configuration modules
 */

// Export all network configurations
export * from "./polkadot.config.js";
export * from "./solana.config.js";
export * from "./celestia.config.js";

// Supported chains and networks
export const SUPPORTED_CHAINS = {
  POLKADOT: "polkadot",
  SOLANA: "solana",
  CELESTIA: "celestia",
};

export const SUPPORTED_NETWORKS = {
  // Polkadot networks
  POLKADOT_MAINNET: "mainnet",
  POLKADOT_WESTEND: "westend",

  // Solana networks
  SOLANA_MAINNET_BETA: "mainnet-beta",
  SOLANA_TESTNET: "testnet",

  // Celestia networks
  CELESTIA_MAINNET_BETA: "celestia-mainnet-beta",
  CELESTIA_MOCHA_TESTNET: "celestia-mocha-testnet",
};

/**
 * Helper function to get the appropriate RPC provider for a chain and network
 */
export function getRpcProvider(chain, network) {
  chain = chain.toLowerCase();
  network = network.toLowerCase();

  // Chain-specific imports and logic
  if (chain === SUPPORTED_CHAINS.POLKADOT) {
    const { getPolkadotRpcProvider } = require("./polkadot.config.js");
    return getPolkadotRpcProvider(network);
  } else if (chain === SUPPORTED_CHAINS.SOLANA) {
    const { getSolanaRpcProvider } = require("./solana.config.js");
    return getSolanaRpcProvider(network);
  } else if (chain === SUPPORTED_CHAINS.CELESTIA) {
    const { getCelestiaRpcEndpoint } = require("./celestia.config.js");
    return getCelestiaRpcEndpoint(network);
  } else {
    throw new Error(
      `Unsupported chain: ${chain}. Supported chains are: ${Object.values(
        SUPPORTED_CHAINS
      ).join(", ")}`
    );
  }
}

/**
 * Get the keystore path for the given chain and network
 */
export function getKeystorePath(chain, network) {
  chain = chain.toLowerCase();
  network = network.toLowerCase();

  if (chain === SUPPORTED_CHAINS.POLKADOT) {
    const { getPolkadotKeystorePath } = require("./polkadot.config.js");
    return getPolkadotKeystorePath(network);
  } else {
    throw new Error(`Keystore path not supported for chain: ${chain}`);
  }
}

/**
 * Get the keystore password for the given chain and network
 */
export function getKeystorePassword(chain, network) {
  chain = chain.toLowerCase();
  network = network.toLowerCase();

  if (chain === SUPPORTED_CHAINS.POLKADOT) {
    const { getPolkadotKeystorePassword } = require("./polkadot.config.js");
    return getPolkadotKeystorePassword(network);
  } else {
    throw new Error(`Keystore password not supported for chain: ${chain}`);
  }
}

/**
 * Get the wallet private key for the given chain and network
 */
export function getWalletPrivateKey(chain, network) {
  chain = chain.toLowerCase();
  network = network.toLowerCase();

  if (chain === SUPPORTED_CHAINS.SOLANA) {
    // For Solana, we use the SOLANA_WALLET_PRIVATE_KEY env var
    return process.env.SOLANA_WALLET_PRIVATE_KEY;
  } else {
    throw new Error(`Wallet private key not supported for chain: ${chain}`);
  }
}

/**
 * Get the wallet mnemonic for the given chain and network
 * @throws {Error} If the required environment variable is not defined
 */
export function getWalletMnemonic(chain, network) {
  chain = chain.toLowerCase();
  network = network.toLowerCase();

  // Format network key for environment variable lookup
  // Convert network to uppercase and replace hyphens with underscores
  const networkKey = network.toUpperCase().replace(/-/g, "_");

  if (chain === SUPPORTED_CHAINS.CELESTIA) {
    // For Celestia, we use the network-specific CELESTIA_WALLET_MNEMONIC env var
    const envKey = `CELESTIA_WALLET_MNEMONIC_${networkKey}`;
    const mnemonic = process.env[envKey];

    if (!mnemonic) {
      throw new Error(`Required environment variable ${envKey} is not defined`);
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
export function getWalletAddress(chain, network) {
  chain = chain.toLowerCase();
  network = network.toLowerCase();

  // Format network key for environment variable lookup
  // Convert network to uppercase and replace hyphens with underscores
  const networkKey = network.toUpperCase().replace(/-/g, "_");

  let envKey = "";

  if (chain === SUPPORTED_CHAINS.CELESTIA) {
    // Celestia uses a different pattern for environment variables
    envKey = `CELESTIA_WALLET_ADDRESS_${networkKey}`;
  } else {
    // Other chains follow a common pattern
    envKey = `WALLET_ADDRESS_${chain.toUpperCase()}_${networkKey}`;
  }

  const address = process.env[envKey];
  if (!address) {
    throw new Error(`Required environment variable ${envKey} is not defined`);
  }

  return address;
}

/**
 * Sign transaction data based on chain and network
 * @param {object} options - Options object
 * @param {string} options.chain - Chain name (polkadot, solana, celestia, etc.)
 * @param {string} options.network - Network name (mainnet, testnet, etc.)
 * @param {string} options.unsignedTransactionData - Raw unsigned transaction data
 * @param {string} [options.rpcProvider] - RPC provider URL
 * @param {string} [options.keystorePath] - Keystore path (for Polkadot)
 * @param {string} [options.password] - Keystore password (for Polkadot)
 * @param {string} [options.secretKey] - Secret key (for Solana)
 * @param {string} [options.mnemonic] - Mnemonic phrase (for Celestia)
 * @param {string} [options.stakerAddress] - Staker address (for Celestia)
 * @returns {Promise<string>} Signed transaction data
 */
export async function signTransaction({
  chain,
  network,
  unsignedTransactionData,
  rpcProvider,
  keystorePath,
  password,
  secretKey,
  mnemonic,
  stakerAddress,
}) {
  if (!chain) throw new Error("Chain parameter is required");
  if (!network) throw new Error("Network parameter is required");
  if (!unsignedTransactionData) throw new Error("Transaction data is required");

  chain = chain.toLowerCase();

  if (chain === SUPPORTED_CHAINS.POLKADOT) {
    const { signPolkadotTransaction } = require("./signing-polkadot.ts");

    // Use provided values or get defaults from configuration
    const finalRpcProvider = rpcProvider || getRpcProvider(chain, network);
    const finalKeystorePath = keystorePath || getKeystorePath(chain, network);
    const finalPassword = password || getKeystorePassword(chain, network);

    return signPolkadotTransaction({
      rpcProvider: finalRpcProvider,
      keystorePath: finalKeystorePath,
      password: finalPassword,
      rawTransaction: unsignedTransactionData,
    });
  } else if (chain === SUPPORTED_CHAINS.SOLANA) {
    const { signSolanaTransaction } = require("./signing-solana.ts");

    // Use provided values or get defaults from configuration
    const finalSecretKey = secretKey || getWalletPrivateKey(chain, network);
    const finalRpcProvider = rpcProvider || getRpcProvider(chain, network);

    return signSolanaTransaction({
      rpcProvider: finalRpcProvider,
      secretKey: finalSecretKey,
      rawTransaction: unsignedTransactionData,
    });
  } else if (chain === SUPPORTED_CHAINS.CELESTIA) {
    const { signCelestiaTransaction } = require("./signing-celestia.ts");

    // Use provided values or get defaults from configuration
    const finalRpcProvider = rpcProvider || getRpcProvider(chain, network);
    const finalMnemonic = mnemonic || getWalletMnemonic(chain, network);
    const finalStakerAddress =
      stakerAddress || getWalletAddress(chain, network);

    console.log(
      "[signTransaction] Celestia transaction data type:",
      typeof unsignedTransactionData
    );
    if (typeof unsignedTransactionData === "object") {
      console.log("[signTransaction] Celestia transaction data format:", {
        hasMessages: !!unsignedTransactionData.messages,
        hasFee: !!unsignedTransactionData.fee,
        hasMemo: !!unsignedTransactionData.memo,
      });
    }

    return signCelestiaTransaction({
      rpcProvider: finalRpcProvider,
      mnemonic: finalMnemonic,
      stakerAddress: finalStakerAddress,
      rawTransaction: unsignedTransactionData,
    });
  } else {
    throw new Error(
      `Unsupported chain: ${chain}. Supported chains are: ${Object.values(
        SUPPORTED_CHAINS
      ).join(", ")}`
    );
  }
}
