import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { session } = await request.json();

  if (!session) {
    (await cookies()).delete("trac_auth_session");
    return NextResponse.json({ status: "cleared" });
  }

  // Set the cookie for 365 days
  (await cookies()).set("trac_auth_session", session, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Set to true only in production (HTTPS)
    sameSite: "lax",
  });

  return NextResponse.json({ status: "success" });
}

export async function DELETE() {
  (await cookies()).delete("trac_auth_session");
  return NextResponse.json({ status: "success" });
}