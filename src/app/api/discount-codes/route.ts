import { NextRequest, NextResponse } from "next/server";
import { createDiscountCode, getDiscountCodes } from "@/lib/shopify";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { price_rule_id, code } = body;

    if (!price_rule_id || !code) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: price_rule_id, code" },
        { status: 400 }
      );
    }

    const result = await createDiscountCode(Number(price_rule_id), code);

    return NextResponse.json({
      success: true,
      data: result.discount_code,
    });
  } catch (error) {
    console.error("Error creating discount code:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create discount code",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const priceRuleId = searchParams.get("price_rule_id");

    if (!priceRuleId) {
      return NextResponse.json(
        { success: false, error: "price_rule_id is required" },
        { status: 400 }
      );
    }

    const result = await getDiscountCodes(Number(priceRuleId));

    return NextResponse.json({
      success: true,
      data: result.discount_codes,
    });
  } catch (error) {
    console.error("Error fetching discount codes:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch discount codes",
      },
      { status: 500 }
    );
  }
}
