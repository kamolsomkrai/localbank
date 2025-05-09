// app/api/interest-rates/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rates = await prisma.interestRate.findMany();
  return NextResponse.json(rates);
}

export async function POST(req: Request) {
  const { accountType, rate } = await req.json();
  const ir = await prisma.interestRate.upsert({
    where: { accountType },
    update: { rate },
    create: { accountType, rate },
  });
  return NextResponse.json(ir);
}
