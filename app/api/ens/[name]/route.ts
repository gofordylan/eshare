import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

    if (!name || !name.endsWith(".eth")) {
      return NextResponse.json(
        { error: "Invalid ENS name" },
        { status: 400 }
      );
    }

    const normalizedName = normalize(name);
    const address = await client.getEnsAddress({ name: normalizedName });

    if (!address) {
      return NextResponse.json(
        { error: "ENS name not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ address });
  } catch (error) {
    console.error("ENS resolution error:", error);
    return NextResponse.json(
      { error: "Failed to resolve ENS name" },
      { status: 500 }
    );
  }
}
