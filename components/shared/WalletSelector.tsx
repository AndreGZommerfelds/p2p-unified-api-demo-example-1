import { Button } from "@/components/ui/button";
import { WALLET_ADDRESSES } from "@/lib/constants";
import { useStaking } from "@/lib/store";

export function WalletSelector() {
  const { selectedChain, selectedNetwork, connectWallet } = useStaking();

  if (!selectedChain || !selectedNetwork) return null;

  const address = WALLET_ADDRESSES[selectedChain];

  // Format the address for display (show first 8 and last 8 characters)
  const formatAddress = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 8)}`;
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-2xl font-bold text-center">Connect Wallet</h2>
      <p className="text-muted-foreground text-center mb-2">
        Select a wallet address to manage your staking
      </p>

      <div className="border rounded-lg p-4 bg-secondary/20 hover:bg-secondary/30 transition-colors">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Address</span>
            <span className="text-xs bg-primary/20 text-primary rounded-full px-2 py-1">
              {selectedChain.toUpperCase()}
            </span>
          </div>
          <div className="font-mono text-sm break-all">{address}</div>
          <Button
            className="mt-2 w-full"
            onClick={() => connectWallet(address)}
          >
            Connect Wallet
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-2">
        Using demo wallet for {selectedChain} on {selectedNetwork}
      </p>
    </div>
  );
}
