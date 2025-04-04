import { Button } from "@/components/ui/button";
import { NETWORKS } from "@/lib/constants";
import { useStaking } from "@/lib/store";

export function NetworkSelector() {
  const { selectedChain, selectNetwork } = useStaking();

  if (!selectedChain) return null;

  const networks = NETWORKS[selectedChain];

  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-2xl font-bold text-center">Select Network</h2>
      <p className="text-muted-foreground text-center mb-2">
        Choose a network for {selectedChain}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {networks.map((network) => (
          <Button
            key={network}
            variant="outline"
            className="h-20 text-lg capitalize flex flex-col items-center justify-center gap-2 hover:bg-primary/10"
            onClick={() => selectNetwork(network)}
          >
            <span className="text-lg font-semibold">{network}</span>
            <span className="text-xs text-muted-foreground">
              {network.includes("main") ? "Production" : "Testing"}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
