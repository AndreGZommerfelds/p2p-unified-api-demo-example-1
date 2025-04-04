import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: "API test endpoint is working" });
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    return NextResponse.json({
      message: "POST request received",
      receivedData: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to parse request body" },
      { status: 400 }
    );
  }
}
