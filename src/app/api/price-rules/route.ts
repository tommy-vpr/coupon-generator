import { NextRequest, NextResponse } from "next/server";
import { createPriceRule, getPriceRules, deletePriceRule } from "@/lib/shopify";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      title,
      value_type,
      value,
      starts_at,
      ends_at,
      usage_limit,
      once_per_customer,
    } = body;

    // Validate required fields
    if (!title || !value_type || value === undefined || !starts_at) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title, value_type, value, starts_at" },
        { status: 400 }
      );
    }

    // Shopify expects negative values for discounts
    const shopifyValue =
      value_type === "fixed_amount"
        ? `-${Math.abs(Number(value))}`
        : `-${Math.abs(Number(value))}`;

    const priceRule = {
      title,
      target_type: "line_item" as const,
      target_selection: "all" as const,
      allocation_method: "across" as const,
      value_type,
      value: shopifyValue,
      customer_selection: "all" as const,
      starts_at,
      ...(ends_at && { ends_at }),
      ...(usage_limit && { usage_limit: Number(usage_limit) }),
      ...(once_per_customer !== undefined && { once_per_customer }),
    };

    const result = await createPriceRule(priceRule);

    return NextResponse.json({
      success: true,
      data: result.price_rule,
    });
  } catch (error) {
    console.error("Error creating price rule:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create price rule",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await getPriceRules();

    return NextResponse.json({
      success: true,
      data: result.price_rules,
    });
  } catch (error) {
    console.error("Error fetching price rules:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch price rules",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Price rule ID is required" },
        { status: 400 }
      );
    }

    await deletePriceRule(Number(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting price rule:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete price rule",
      },
      { status: 500 }
    );
  }
}
