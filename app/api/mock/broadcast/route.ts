import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("Mock broadcast API endpoint called");

  try {
    const body = await req.json();
    console.log("Request body:", body);

    // Mock successful response
    return NextResponse.json({
      success: true,
      transactionId: body.transactionId || "mock-tx-id",
      transactionHash: "0x" + "abcdef".repeat(8),
      status: "BROADCASTED",
      chain: body.chain || "polkadot",
      network: body.network || "westend",
    });
  } catch (error) {
    console.error("Error in mock broadcast endpoint:", error);
    return NextResponse.json(
      { error: "Mock broadcast error" },
      { status: 500 }
    );
  }
}
