import { NextResponse } from "next/server";
import { isDemoMode } from "./db";

export function demoGuard() {
  if (isDemoMode) {
    return NextResponse.json(
      { error: "Demo mode — read only" },
      { status: 403 }
    );
  }
  return null;
}
