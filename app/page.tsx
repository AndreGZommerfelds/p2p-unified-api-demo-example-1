import { StakingContent } from "@/components/sections/StakingContent";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex items-center">
          <h1 className="text-3xl font-bold">
            Staking Interface Demo - P2P.ORG Unified API
          </h1>
        </div>
      </header>

      <main className="flex-1 container mx-auto flex flex-col items-center justify-center">
        <StakingContent />
      </main>

      <footer className="py-4 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          A reference implementation for P2P.ORG's Unified Staking API
        </div>
      </footer>
    </div>
  );
}
