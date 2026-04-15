import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL || "http://localhost:3001";

export async function GET(req: NextRequest) {
  try {
    console.log("Fetching today's activities...");
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header is required" },
        { status: 401 }
      );
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await fetch(
      `${BACKEND_API_URL}/api/activity?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to fetch activities:", error);
      return NextResponse.json(
        { error: error.error || "Failed to fetch activities" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Activities fetched:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}
