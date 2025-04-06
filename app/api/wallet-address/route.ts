import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to get wallet addresses from server-side environment variables
 * This allows us to access .env variables securely from client components
 */
export async function GET(request: NextRequest) {
  // Get chain and network from query parameters
  const searchParams = request.nextUrl.searchParams;
  const chain = searchParams.get("chain");
  const network = searchParams.get("network");

  if (!chain || !network) {
    return NextResponse.json(
      { error: "Chain and network parameters are required" },
      { status: 400 }
    );
  }

  // For Celestia, we need to handle the environment variable format differently
  // because the .env file has dashes instead of underscores
  if (chain === "celestia") {
    // Special case for Celestia - use the exact format as in .env
    const directCelestiaKey = `CELESTIA_WALLET_ADDRESS_${network.toUpperCase()}`;
    const celestiaAddress = process.env[directCelestiaKey];

    if (celestiaAddress) {
      return NextResponse.json({ address: celestiaAddress });
    }

    // Alternative formatting for Celestia network key (with underscores)
    const formattedNetworkKey = network.toUpperCase().replace(/-/g, "_");
    const altCelestiaKey = `CELESTIA_WALLET_ADDRESS_${formattedNetworkKey}`;
    const altCelestiaAddress = process.env[altCelestiaKey];

    if (altCelestiaAddress) {
      return NextResponse.json({ address: altCelestiaAddress });
    }
  } else {
    // For other chains, use standard formatting (underscores)
    const networkKey = network.toUpperCase().replace(/-/g, "_");
    const standardKey = `WALLET_ADDRESS_${chain.toUpperCase()}_${networkKey}`;
    const address = process.env[standardKey];

    if (address) {
      return NextResponse.json({ address: address });
    }
  }

  // If we get here, we couldn't find the wallet address in any format
  // Search for relevant environment variables to help debug
  const relevantKeys = Object.keys(process.env).filter(
    (key) =>
      key.includes(chain.toUpperCase()) ||
      (chain === "celestia" && key.includes("CELESTIA")) ||
      key.includes("WALLET_ADDRESS")
  );

  return NextResponse.json(
    {
      error: `No wallet address found for ${chain}/${network}`,
      searchedKeys:
        chain === "celestia"
          ? [
              `CELESTIA_WALLET_ADDRESS_${network.toUpperCase()}`,
              `CELESTIA_WALLET_ADDRESS_${network
                .toUpperCase()
                .replace(/-/g, "_")}`,
            ]
          : [
              `WALLET_ADDRESS_${chain.toUpperCase()}_${network
                .toUpperCase()
                .replace(/-/g, "_")}`,
            ],
      availableKeys: relevantKeys,
    },
    { status: 404 }
  );
}
