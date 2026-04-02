import { NextResponse } from "next/server";
import { getCollections } from "@/lib/shopify";

export async function GET() {
  try {
    const collections = await getCollections();
    return NextResponse.json({ success: true, data: collections });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch collections",
      },
      { status: 500 },
    );
  }
}
