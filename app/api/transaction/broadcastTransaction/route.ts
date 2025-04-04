import { NextRequest, NextResponse } from "next/server";
import { broadcastTransactionToAPI } from "@/lib/broadcastUtils";

export async function POST(req: NextRequest) {
  console.log("Transaction broadcast API endpoint called");

  try {
    const body = await req.json();
    console.log("Request body:", body);

    const { transactionId } = body;

    if (!transactionId) {
      console.error("Missing transaction ID");
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
      });
    } catch (error) {
      console.error("Error broadcasting transaction:", error);
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
  } catch (error) {
    console.error("Error in broadcast transaction endpoint:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to broadcast transaction",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
