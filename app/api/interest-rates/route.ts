// app/api/interest-rates/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const rates = await prisma.interestRate.findMany();
  return NextResponse.json(rates);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STAFF") {
    return NextResponse.json({ error: "สิทธิ์ไม่เพียงพอ" }, { status: 403 });
  }

  const { accountType, rate } = await req.json();
  
  // Validate rate is a positive number
  if (typeof rate !== "number" || rate < 0 || rate > 1) {
    return NextResponse.json(
      { error: "อัตราดอกเบี้ยต้องอยู่ระหว่าง 0-100%" },
      { status: 400 }
    );
  }

  const ir = await prisma.interestRate.upsert({
    where: { accountType },
    update: { rate },
    create: { accountType, rate },
  });
  return NextResponse.json(ir);
}
