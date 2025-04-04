import { NextRequest, NextResponse } from "next/server";
import { broadcastTransactionToAPI } from "@/lib/broadcastUtils";

// Explorer URLs by chain and network
const BLOCK_EXPLORERS: Record<string, Record<string, string>> = {
  polkadot: {
    mainnet: "https://polkadot.subscan.io/extrinsic/",
    westend: "https://westend.subscan.io/extrinsic/",
  },
  kusama: {
    mainnet: "https://kusama.subscan.io/extrinsic/",
  },
  // Add more chains as needed
};

export async function POST(req: NextRequest) {
  try {
    const { transactionId } = await req.json();

    console.log(
      `[broadcast] Received request for transaction: ${transactionId}`
    );

    if (!transactionId) {
      return NextResponse.json(
        { error: "Missing transaction ID" },
        { status: 400 }
      );
    }

    try {
      // Use the shared broadcast utility
      const result = await broadcastTransactionToAPI(transactionId);

      return NextResponse.json({
        success: true,
        transactionId: result.transactionId,
        transactionHash: result.transactionHash,
        status: result.status,
        explorerUrl: result.explorerUrl,
        message: `Transaction broadcast with status: ${result.status}`,
      });
    } catch (error) {
      console.error(`[broadcast] Error during broadcasting:`, error);
      return NextResponse.json(
        {
          error: "Failed to broadcast transaction",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`[broadcast] Error:`, error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to broadcast transaction",
      },
      { status: 500 }
    );
  }
}

function getExplorerUrl(
  chain: string,
  network: string,
  transactionHash: string
): string | null {
  const explorerBaseUrl = BLOCK_EXPLORERS[chain]?.[network];
  return transactionHash && explorerBaseUrl
    ? `${explorerBaseUrl}${transactionHash}`
    : null;
}
