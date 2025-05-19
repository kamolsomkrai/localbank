// app/api/accounts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✱ await params เพราะ Next.js 15 เปลี่ยน params ให้เป็น Promise
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const account = await prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      return NextResponse.json({ error: "ไม่พบข้อมูลบัญชี" }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลบัญชี" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✱ await params เช่นกัน
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "STAFF") {
      return NextResponse.json({ error: "สิทธิ์ไม่เพียงพอ" }, { status: 403 });
    }

    const { accountType, cid, prefixName, firstName, lastName, accountName } =
      await request.json();

    const updatedAccount = await prisma.account.update({
      where: { id },
      data: {
        cid,
        prefix: prefixName,
        firstName,
        lastName,
        accountName,
        type: accountType,
      },
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตข้อมูลบัญชี" },
      { status: 500 }
    );
  }
}
