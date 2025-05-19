// app/api/accounts/create/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateThaiAccountNumber } from "@/lib/account";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // ✱ นำเข้า authOptions จาก lib/auth ไม่ใช่จาก route

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STAFF") {
    return NextResponse.json({ error: "สิทธิ์ไม่เพียงพอ" }, { status: 403 });
  }

  const {
    accountType,
    cid,
    prefixName,
    firstName,
    lastName,
    accountName,
    initialDeposit,
  } = await req.json();

  const number = await generateThaiAccountNumber();

  const account = await prisma.account.create({
    data: {
      number,
      cid,
      prefix: prefixName,
      firstName,
      lastName,
      accountName,
      type: accountType,
      balance: initialDeposit,
      transactions: {
        create: {
          amount: initialDeposit,
          balanceAfter: initialDeposit,
          type: "DEPOSIT",
          staffId: session.user.id,
        },
      },
    },
    include: { transactions: true },
  });

  return NextResponse.json(account);
}
