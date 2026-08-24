import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.redirect(new URL("/crm", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"), 307);
}
