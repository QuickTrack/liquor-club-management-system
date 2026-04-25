import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models";
import { generateToken, generateRefreshToken, verifyRefreshToken } from "@/lib/auth";

/**
 * POST /api/auth/refresh
 * body: { refreshToken }
 * Returns new access token
 */
export async function POST(request: Request) {
  try {
    await connectDB();
    
    const { refreshToken } = await request.json();
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token required" },
        { status: 400 }
      );
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
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
    
    // Generate new access token
    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Set new refresh token cookie
    const response = NextResponse.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
    
    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });
    
    return response;
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
