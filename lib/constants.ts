//export const CHAINS = ["polkadot", "solana", "celestia"] as const; // SOLANA IS CURRENTLY DISABLED
export const CHAINS = ["polkadot", "celestia"] as const;
export type Chain = (typeof CHAINS)[number];

export const NETWORKS: Record<Chain, readonly string[]> = {
  polkadot: ["mainnet", "westend"] as const,
  solana: ["mainnet-beta", "testnet"] as const,
  celestia: ["celestia-mainnet-beta", "celestia-mocha-testnet"] as const,
};
export type Network<C extends Chain> = (typeof NETWORKS)[C][number];

/**
 * Get wallet address from environment variables based on chain and network
 * This function is mostly used server-side; client components should use the API endpoint.
 *
 * @param chain Blockchain chain
 * @param network Network within the chain
 * @returns Wallet address from environment variables
 */
export function getWalletAddress(chain: Chain, network: string): string {
  // Format network key for environment variable lookup
  // Convert network to uppercase and replace hyphens with underscores for environment variable naming
  const networkKey = network.toUpperCase().replace(/-/g, "_");

  let envKey = "";

  if (chain === "celestia") {
    // Celestia uses a different pattern for environment variables
    envKey = `CELESTIA_WALLET_ADDRESS_${networkKey}`;
  } else {
    // Other chains follow a common pattern
    envKey = `WALLET_ADDRESS_${chain.toUpperCase()}_${networkKey}`;
  }

  // For server-side
  if (typeof process !== "undefined" && process.env && process.env[envKey]) {
    return process.env[envKey] as string;
  }

  // No fallbacks - return an empty string if no environment variable is found
  console.warn(
    `No wallet address found for ${chain}/${network} (env var: ${envKey})`
  );
  return "";
}

// Dummy balances for demo purposes
export type Balance = {
  total: number;
  available: number;
  staked: number;
  unstaking: number;
  rewards: number;
};

// Generate demo balances using dynamic addresses from environment variables
// The keys will be populated at runtime based on getWalletAddress
export const DUMMY_BALANCES: Record<Chain, Record<string, Balance>> = {
  polkadot: {},
  solana: {},
  celestia: {},
};

// Helper to initialize dummy balances with addresses from environment variables
export async function initializeDummyBalances() {
  // Clear any existing data
  CHAINS.forEach((chain) => {
    DUMMY_BALANCES[chain] = {};
  });

  // For client-side, fetch addresses from our API endpoint
  if (typeof window !== "undefined") {
    for (const chain of CHAINS) {
      for (const network of NETWORKS[chain]) {
        try {
          // Fetch wallet address from API endpoint
          const response = await fetch(
            `/api/wallet-address?chain=${chain}&network=${network}`
          );

          if (response.ok) {
            const data = await response.json();
            const address = data.address;

            if (address) {
              // Create dummy balance for this address
              DUMMY_BALANCES[chain][address] = {
                total:
                  chain === "polkadot"
                    ? 1000
                    : chain === "solana"
                    ? 2000
                    : 1500,
                available:
                  chain === "polkadot" ? 500 : chain === "solana" ? 1000 : 750,
                staked:
                  chain === "polkadot" ? 400 : chain === "solana" ? 800 : 600,
                unstaking:
                  chain === "polkadot" ? 50 : chain === "solana" ? 100 : 75,
                rewards:
                  chain === "polkadot" ? 50 : chain === "solana" ? 100 : 75,
              };
            }
          }
        } catch (error) {
          console.error(
            `Error fetching address for ${chain}/${network}:`,
            error
          );
        }
      }
    }
  }
  // For server-side, use the original method if available
  else if (typeof process !== "undefined") {
    for (const chain of CHAINS) {
      for (const network of NETWORKS[chain]) {
        try {
          // Format network key for environment variable lookup
          const networkKey = network.toUpperCase().replace(/-/g, "_");
          let envKey = "";

          if (chain === "celestia") {
            envKey = `CELESTIA_WALLET_ADDRESS_${networkKey}`;
          } else {
            envKey = `WALLET_ADDRESS_${chain.toUpperCase()}_${networkKey}`;
          }

          const address = process.env[envKey];
          if (address) {
            // Create dummy balance for this address
            DUMMY_BALANCES[chain][address] = {
              total:
                chain === "polkadot" ? 1000 : chain === "solana" ? 2000 : 1500,
              available:
                chain === "polkadot" ? 500 : chain === "solana" ? 1000 : 750,
              staked:
                chain === "polkadot" ? 400 : chain === "solana" ? 800 : 600,
              unstaking:
                chain === "polkadot" ? 50 : chain === "solana" ? 100 : 75,
              rewards:
                chain === "polkadot" ? 50 : chain === "solana" ? 100 : 75,
            };
          }
        } catch (error) {
          console.error(
            `Error getting address for ${chain}/${network}:`,
            error
          );
        }
      }
    }
  }
}

// Explorers for different chains/networks
export const EXPLORERS: Record<Chain, Record<string, string>> = {
  polkadot: {
    mainnet: "https://polkadot.subscan.io/extrinsic/",
    westend: "https://westend.subscan.io/extrinsic/",
  },
  solana: {
    "mainnet-beta": "https://explorer.solana.com/tx/",
    testnet: "https://explorer.solana.com/tx/?cluster=testnet",
  },
  celestia: {
    "celestia-mainnet-beta": "https://explorer.celestia.org/mainnet/tx/",
    "celestia-mocha-testnet": "https://testnet.celenium.io/tx/",
  },
};

// Chains that require an amount parameter for unstaking
export const CHAINS_REQUIRING_UNSTAKE_AMOUNT: Chain[] = [
  "polkadot",
  "solana",
  "celestia",
];
