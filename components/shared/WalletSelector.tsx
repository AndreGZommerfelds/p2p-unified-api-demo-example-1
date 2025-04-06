import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useStaking } from "@/lib/store";

export function WalletSelector() {
  const { selectedChain, selectedNetwork, connectWallet } = useStaking();
  const [address, setAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWalletAddress() {
      if (!selectedChain || !selectedNetwork) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch wallet address from our API endpoint
        const response = await fetch(
          `/api/wallet-address?chain=${selectedChain}&network=${selectedNetwork}`
        );

        const data = await response.json();

        if (!response.ok) {
          console.error("Error fetching wallet address:", data);
          setError(data.error || "Failed to fetch wallet address");
          setAddress("");
          return;
        }

        setAddress(data.address);
      } catch (error) {
        console.error("Error fetching wallet address:", error);
        setError("Failed to fetch wallet address. Check console for details.");
        setAddress("");
      } finally {
        setIsLoading(false);
      }
    }

    fetchWalletAddress();
  }, [selectedChain, selectedNetwork]);

  if (!selectedChain || !selectedNetwork) return null;

  // Format the address for display (show first 8 and last 8 characters)
  const formatAddress = (addr: string) => {
    if (!addr || addr.length <= 16) return addr;
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

          {isLoading ? (
            <div className="h-6 w-full bg-muted animate-pulse rounded"></div>
          ) : error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : !address ? (
            <p className="text-xs text-red-500">
              No wallet address found for {selectedChain}/{selectedNetwork}
            </p>
          ) : (
            <div className="font-mono text-sm break-all">{address}</div>
          )}

          <Button
            className="mt-2 w-full"
            onClick={() => connectWallet(address)}
            disabled={!address || isLoading}
          >
            Connect Wallet
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-2">
        Using wallet for {selectedChain} on {selectedNetwork}
      </p>
    </div>
  );
}
