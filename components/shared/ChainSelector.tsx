import { Button } from "@/components/ui/button";
import { CHAINS } from "@/lib/constants";
import { useStaking } from "@/lib/store";

export function ChainSelector() {
  const { selectChain } = useStaking();

  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-2xl font-bold text-center">Select Chain</h2>
      <p className="text-muted-foreground text-center mb-2">
        Choose a blockchain to start staking
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CHAINS.map((chain) => (
          <Button
            key={chain}
            variant="outline"
            className="h-20 text-lg capitalize flex flex-col items-center justify-center gap-2 hover:bg-primary/10"
            onClick={() => selectChain(chain)}
          >
            <span className="text-lg font-semibold">{chain}</span>
            <span className="text-xs text-muted-foreground">
              {chain === "polkadot" ? "DOT" : "SOL"}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
