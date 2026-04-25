import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { License } from "@/lib/db/models";
import type { NextRequest } from "next/server";

/**
 * GET /api/licenses
 * Fetch all licenses
 */
export async function GET() {
  try {
    await connectDB();
    const licenses = await License.find({}).sort({ expiryDate: 1 });
    return NextResponse.json(licenses);
  } catch (error) {
    console.error("Error fetching licenses:", error);
    return NextResponse.json({ error: "Failed to fetch licenses" }, { status: 500 });
  }
}

/**
 * POST /api/licenses
 * Create a new license
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();

    const { name, type, licenseNumber, issueDate, expiryDate } = data;

    if (!name || !type || !issueDate || !expiryDate) {
      return NextResponse.json(
        { error: "Name, type, issue date, and expiry date are required" },
        { status: 400 }
      );
    }

    const license = await License.create({
      name,
      type,
      licenseNumber: licenseNumber || "",
      issueDate: new Date(issueDate),
      expiryDate: new Date(expiryDate),
      status: "Valid",
    });

    return NextResponse.json(license, { status: 201 });
  } catch (error) {
    console.error("Error creating license:", error);
    return NextResponse.json({ error: "Failed to create license" }, { status: 500 });
  }
}
