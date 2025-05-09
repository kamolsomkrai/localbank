// app/api/interest/calculate/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const rates = await prisma.interestRate.findMany();
  const rateMap = new Map(rates.map((r) => [r.accountType, r.rate]));
  const accounts = await prisma.account.findMany();
  let applied = 0;

  for (const acc of accounts) {
    const rate = rateMap.get(acc.type) ?? 0;
    const interest = acc.balance.mul(rate);
    const value = Number(interest.toString());
    if (value !== 0) {
      await prisma.account.update({
        where: { id: acc.id },
        data: { balance: { increment: value } },
      });
    }
    applied++;
  }

  return NextResponse.json({ message: "คำนวณดอกเบี้ยสำเร็จ", applied });
}
