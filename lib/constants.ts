export const CHAINS = ["polkadot", "solana"] as const;
export type Chain = (typeof CHAINS)[number];

export const NETWORKS: Record<Chain, readonly string[]> = {
  polkadot: ["mainnet", "westend"] as const,
  solana: ["mainnet-beta", "testnet"] as const,
};
export type Network<C extends Chain> = (typeof NETWORKS)[C][number];

// Dummy wallet addresses
export const WALLET_ADDRESSES: Record<Chain, string> = {
  polkadot: "5FU44bZkd8iza8Sw8xS9QeRamsj9MpcBiwvLBReVDLBmd25q",
  solana: "BPYjkv7BguAKz3Uw6eKidBPX9bvum1oDpwMvJHcSYunm",
};

// Dummy balances for demo purposes
export type Balance = {
  total: number;
  available: number;
  staked: number;
  unstaking: number;
  rewards: number;
};

export const DUMMY_BALANCES: Record<Chain, Record<string, Balance>> = {
  polkadot: {
    "5FU44bZkd8iza8Sw8xS9QeRamsj9MpcBiwvLBReVDLBmd25q": {
      total: 1000,
      available: 500,
      staked: 400,
      unstaking: 50,
      rewards: 50,
    },
  },
  solana: {
    BPYjkv7BguAKz3Uw6eKidBPX9bvum1oDpwMvJHcSYunm: {
      total: 2000,
      available: 1000,
      staked: 800,
      unstaking: 100,
      rewards: 100,
    },
  },
};

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
};

// Chains that require an amount parameter for unstaking
export const CHAINS_REQUIRING_UNSTAKE_AMOUNT: Chain[] = ["polkadot", "solana"];
