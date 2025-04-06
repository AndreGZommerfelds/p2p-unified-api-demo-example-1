import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to debug environment variables
 * This is for development debugging only - only shows keys, not values
 */
export async function GET(request: NextRequest) {
  // Get all environment variable keys
  const allKeys = Object.keys(process.env).sort();

  // Get the ones related to wallet addresses
  const walletKeys = allKeys.filter(
    (key) =>
      key.includes("WALLET_ADDRESS") ||
      key.includes("CELESTIA") ||
      key.includes("POLKADOT") ||
      key.includes("SOLANA")
  );

  // Return just the keys (not the values for security)
  return NextResponse.json({
    walletAddressKeys: walletKeys,
    dashes: walletKeys
      .map((key) => (key.includes("-") ? key : null))
      .filter(Boolean),
    underscores: walletKeys
      .map((key) => (key.includes("_") ? key : null))
      .filter(Boolean),
  });
}
