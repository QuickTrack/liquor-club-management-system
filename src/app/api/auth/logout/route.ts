import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * Clears refresh token cookie
 */
export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" });
  
  // Clear refresh token cookie
  response.cookies.set("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  
  return response;
}
