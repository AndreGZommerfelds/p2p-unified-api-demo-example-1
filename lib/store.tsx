"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import {
  Chain,
  Network,
  CHAINS,
  NETWORKS,
  WALLET_ADDRESSES,
} from "./constants";

type StakingState = {
  selectedChain: Chain | null;
  selectedNetwork: string | null;
  selectedWalletAddress: string | null;
  isWalletConnected: boolean;
};

type StakingActions = {
  selectChain: (chain: Chain | null) => void;
  selectNetwork: (network: string) => void;
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
};

type StakingContextType = StakingState & StakingActions;

const initialState: StakingState = {
  selectedChain: null,
  selectedNetwork: null,
  selectedWalletAddress: null,
  isWalletConnected: false,
};

const StakingContext = createContext<StakingContextType | undefined>(undefined);

export function StakingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StakingState>(initialState);

  const selectChain = (chain: Chain | null) => {
    setState((prev) => ({
      ...prev,
      selectedChain: chain,
      selectedNetwork: null,
      selectedWalletAddress: null,
      isWalletConnected: false,
    }));
  };

  const selectNetwork = (network: string) => {
    setState((prev) => ({
      ...prev,
      selectedNetwork: network,
    }));
  };

  const connectWallet = (address: string) => {
    setState((prev) => ({
      ...prev,
      selectedWalletAddress: address,
      isWalletConnected: true,
    }));
  };

  const disconnectWallet = () => {
    setState((prev) => ({
      ...prev,
      selectedWalletAddress: null,
      isWalletConnected: false,
    }));
  };

  const value = {
    ...state,
    selectChain,
    selectNetwork,
    connectWallet,
    disconnectWallet,
  };

  return (
    <StakingContext.Provider value={value}>{children}</StakingContext.Provider>
  );
}

export function useStaking() {
  const context = useContext(StakingContext);
  if (context === undefined) {
    throw new Error("useStaking must be used within a StakingProvider");
  }
  return context;
}
