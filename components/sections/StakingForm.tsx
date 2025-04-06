"use client";

import { useState } from "react";
import { useStaking } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DUMMY_BALANCES } from "@/lib/constants";

interface StakingFormProps {
  onStake: (amount: string) => void;
  isLoading: boolean;
}

export function StakingForm({ onStake, isLoading }: StakingFormProps) {
  const { selectedChain, selectedNetwork, selectedWalletAddress } =
    useStaking();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  if (!selectedChain || !selectedWalletAddress) return null;

  const balance = DUMMY_BALANCES[selectedChain][selectedWalletAddress];

  // Get the appropriate token symbol for the selected chain
  const getTokenSymbol = (chain: string) => {
    switch (chain) {
      case "polkadot":
        return "DOT";
      case "celestia":
        return "TIA";
      case "solana":
        return "SOL";
      default:
        return "TOKENS";
    }
  };

  const tokenSymbol = getTokenSymbol(selectedChain);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate amount
    if (!amount) {
      setError("Please enter an amount");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (amountNum > balance.available) {
      setError(`You don't have enough ${tokenSymbol} available`);
      return;
    }

    setError("");
    onStake(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="amount">Amount to stake</Label>
          <span className="text-xs text-muted-foreground">
            Available: {balance.available} {tokenSymbol}
          </span>
        </div>
        <div className="relative">
          <Input
            id="amount"
            type="text"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pr-16"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-sm text-muted-foreground">{tokenSymbol}</span>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Network</span>
          <span className="capitalize font-medium">{selectedNetwork}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Chain</span>
          <span className="capitalize font-medium">{selectedChain}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Est. APR</span>
          <span className="font-medium">7-12%</span>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating staking request..." : "Stake Now"}
      </Button>
    </form>
  );
}
