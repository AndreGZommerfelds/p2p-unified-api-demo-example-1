import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data || !data.transactionId) {
      return NextResponse.json(
        { error: "Invalid transaction data" },
        { status: 400 }
      );
    }

    // Ensure the directory exists
    const dirPath = path.join(process.cwd(), "transactions");
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Save transaction data to a file
    const filePath = path.join(dirPath, `tx-${data.transactionId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true, filePath });
  } catch (error) {
    console.error("Error saving transaction data:", error);
    return NextResponse.json(
      { error: "Failed to save transaction data" },
      { status: 500 }
    );
  }
}
