import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models";
import { verifyToken } from "@/lib/auth";

/**
 * GET /api/auth/me
 * Returns current authenticated user based on token
 */
export async function GET(request: Request) {
  try {
    await connectDB();
    
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "User not found or deactivated" },
        { status: 401 }
      );
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = user.toObject();
    
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
