import { Button } from "@/components/ui/button";
import { useStaking } from "@/lib/store";

export function ConnectionStatus() {
  const {
    selectedChain,
    selectedNetwork,
    selectedWalletAddress,
    isWalletConnected,
    disconnectWallet,
    selectChain,
  } = useStaking();

  if (!selectedChain) return null;

  // Format the address for display (show first 8 and last 8 characters)
  const formatAddress = (addr: string) => {
    if (!addr || addr.length <= 16) return addr;
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 8)}`;
  };

  return (
    <div className="w-full rounded-lg p-4 border bg-secondary/5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Connection Status</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (isWalletConnected) {
                disconnectWallet();
              } else {
                selectChain(null);
              }
            }}
          >
            {isWalletConnected ? "Disconnect" : "Change Chain"}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Chain</span>
            <span className="capitalize font-medium">{selectedChain}</span>
          </div>

          {selectedNetwork && (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Network</span>
              <span className="capitalize font-medium">{selectedNetwork}</span>
            </div>
          )}

          {isWalletConnected && selectedWalletAddress && (
            <div className="flex flex-col col-span-2 mt-1">
              <span className="text-xs text-muted-foreground">Wallet</span>
              <span className="font-mono text-xs truncate">
                {selectedWalletAddress}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
