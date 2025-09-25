// app/api/accounts/all/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Failed to fetch all accounts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
