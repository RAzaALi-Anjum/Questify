import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit"; 


export async function GET(req: Request) {
    return NextResponse.json({ remainingGenerations: Infinity });
}
