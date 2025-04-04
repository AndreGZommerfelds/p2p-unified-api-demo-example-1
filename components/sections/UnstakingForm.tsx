"use client";

import { useState } from "react";
import { useStaking } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DUMMY_BALANCES,
  CHAINS_REQUIRING_UNSTAKE_AMOUNT,
} from "@/lib/constants";

interface UnstakingFormProps {
  onUnstake: (amount: string) => void;
  isLoading: boolean;
}

export function UnstakingForm({ onUnstake, isLoading }: UnstakingFormProps) {
  const { selectedChain, selectedNetwork, selectedWalletAddress } =
    useStaking();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  if (!selectedChain || !selectedWalletAddress) return null;

  const balance = DUMMY_BALANCES[selectedChain][selectedWalletAddress];
  const tokenSymbol = selectedChain === "polkadot" ? "DOT" : "SOL";

  // Use the centralized configuration for chains requiring an amount
  const requiresAmount =
    CHAINS_REQUIRING_UNSTAKE_AMOUNT.includes(selectedChain);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate amount if required
    if (requiresAmount) {
      if (!amount) {
        setError("Please enter an amount");
        return;
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      if (amountNum > balance.staked) {
        setError(`You don't have enough ${tokenSymbol} staked`);
        return;
      }
    }

    setError("");
    onUnstake(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {requiresAmount && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="amount">Amount to unstake</Label>
            <span className="text-xs text-muted-foreground">
              Staked: {balance.staked} {tokenSymbol}
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
              <span className="text-sm text-muted-foreground">
                {tokenSymbol}
              </span>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}

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
          <span className="text-muted-foreground">Unstaking Period</span>
          <span className="font-medium">~28 days</span>
        </div>
      </div>

      <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-md text-sm">
        <p className="text-amber-800 dark:text-amber-200">
          Unstaking will initiate the unbonding period. Your funds will be
          available for withdrawal after the unbonding period ends.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating unstaking request..." : "Unstake Now"}
      </Button>
    </form>
  );
}
