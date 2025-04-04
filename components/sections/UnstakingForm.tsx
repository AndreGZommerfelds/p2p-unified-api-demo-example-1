"use client";

import { useStaking } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { DUMMY_BALANCES } from "@/lib/constants";

interface UnstakingFormProps {
  onUnstake: () => void;
  isLoading: boolean;
}

export function UnstakingForm({ onUnstake, isLoading }: UnstakingFormProps) {
  const { selectedChain, selectedNetwork, selectedWalletAddress } =
    useStaking();

  if (!selectedChain || !selectedWalletAddress) return null;

  const balance = DUMMY_BALANCES[selectedChain][selectedWalletAddress];
  const tokenSymbol = selectedChain === "polkadot" ? "DOT" : "SOL";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUnstake();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Staked Balance</span>
          <span className="font-medium">
            {balance.staked} {tokenSymbol}
          </span>
        </div>
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
