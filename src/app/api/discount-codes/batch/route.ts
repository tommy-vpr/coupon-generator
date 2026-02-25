import { NextRequest, NextResponse } from "next/server";
import { createBatchDiscountCodes } from "@/lib/shopify";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { price_rule_id, codes } = body;

    if (!price_rule_id || !codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: price_rule_id, codes (array of strings)",
        },
        { status: 400 }
      );
    }

    // Shopify limits batch to 100 codes at a time
    const BATCH_SIZE = 100;
    const results: Record<string, unknown>[] = [];
    const errors: string[] = [];

    for (let i = 0; i < codes.length; i += BATCH_SIZE) {
      const batch = codes.slice(i, i + BATCH_SIZE);

      try {
        const result = await createBatchDiscountCodes(
          Number(price_rule_id),
          batch
        );
        if (result.discount_codes) {
          results.push(...result.discount_codes);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Batch failed";
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${msg}`);
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      data: {
        created: results,
        total_requested: codes.length,
        total_created: results.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("Error creating batch discount codes:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create batch discount codes",
      },
      { status: 500 }
    );
  }
}
