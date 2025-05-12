import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  console.log("Updating print status..."); // Log สำหรับ debug

  const { transactionIds, printed } = await req.json();
  console.log("Transaction IDs:", transactionIds, "Status:", printed);

  try {
    const result = await prisma.transaction.updateMany({
      where: { id: { in: transactionIds } },
      data: { printed },
    });

    console.log("Update successful, count:", result.count);

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตสถานะการพิมพ์", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
