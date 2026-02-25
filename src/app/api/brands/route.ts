import { NextRequest, NextResponse } from "next/server";
import { getBrandList, getActiveBrand, COOKIE_NAME } from "@/lib/brands";

// GET — return list of brands + which is active
export async function GET() {
  try {
    const brands = getBrandList();
    const active = await getActiveBrand();

    return NextResponse.json({
      success: true,
      data: {
        brands,
        activeBrandId: active.id,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load brands",
      },
      { status: 500 }
    );
  }
}

// POST — switch active brand
export async function POST(request: NextRequest) {
  try {
    const { brandId } = await request.json();

    if (!brandId) {
      return NextResponse.json(
        { success: false, error: "brandId is required" },
        { status: 400 }
      );
    }

    const brands = getBrandList();
    const target = brands.find((b) => b.id === brandId);

    if (!target) {
      return NextResponse.json(
        { success: false, error: `Brand "${brandId}" not found` },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        activeBrandId: target.id,
        name: target.name,
        domain: target.domain,
      },
    });

    response.cookies.set(COOKIE_NAME, brandId, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to switch brand",
      },
      { status: 500 }
    );
  }
}
