"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ChainSelector } from "@/components/shared/ChainSelector";
import { ConnectionStatus } from "@/components/shared/ConnectionStatus";
import { NetworkSelector } from "@/components/shared/NetworkSelector";
import { WalletSelector } from "@/components/shared/WalletSelector";
import { PortfolioSection } from "@/components/sections/PortfolioSection";
import { useStaking } from "@/lib/store";
import { useState } from "react";

export function StakingContent() {
  const { selectedChain, selectedNetwork, isWalletConnected, selectChain } =
    useStaking();
  const [open, setOpen] = useState(false);

  // Reset the flow when dialog is closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      selectChain(null);
    }
    setOpen(open);
  };

  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Start Staking!</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Connect your wallet to start staking with P2P.ORG's unified staking
          API. Manage your assets across multiple chains with ease.
        </p>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button size="lg" className="px-8 py-6 text-lg">
            {isWalletConnected ? "Manage Your Staking" : "Get Started"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] md:max-w-[600px] p-6">
          <div className="space-y-6">
            {selectedChain && <ConnectionStatus />}

            {!selectedChain && <ChainSelector />}

            {selectedChain && !selectedNetwork && <NetworkSelector />}

            {selectedChain && selectedNetwork && !isWalletConnected && (
              <WalletSelector />
            )}

            {isWalletConnected && <PortfolioSection />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
