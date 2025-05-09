import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { q } = await req.json();
  const keyword = String(q || "").trim();
  if (!keyword) {
    return NextResponse.json({ error: "กรุณาระบุคำค้นหา" }, { status: 400 });
  }
  const where = {
    OR: [
      { number: { contains: keyword } },
      { cid: { contains: keyword } },
      { prefix: { contains: keyword } },
      { firstName: { contains: keyword } },
      { lastName: { contains: keyword } },
      { accountName: { contains: keyword } },
    ],
  };

  try {
    const records = await prisma.account.findMany({ where });
    await prisma.$disconnect();
    if (records.length === 0) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลที่ตรงกัน" },
        { status: 404 }
      );
    }
    const results = records.map((acc) => ({
      id: acc.id,
      number: acc.number,
      cid: acc.cid,
      prefix: acc.prefix,
      firstName: acc.firstName,
      lastName: acc.lastName,
      accountName: acc.accountName,
      type: acc.type,
      balance: acc.balance.toString(),
      createdAt: acc.createdAt.toISOString(),
    }));
    return NextResponse.json(results);
  } catch (error) {
    await prisma.$disconnect();
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
