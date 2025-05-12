import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STAFF") {
    return NextResponse.json({ error: "สิทธิ์ไม่เพียงพอ" }, { status: 403 });
  }

  const { id } = params;
  const { accountType, cid, prefixName, firstName, lastName, accountName } =
    await req.json();

  try {
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
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตข้อมูลบัญชี" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const { id } = params;

  try {
    const account = await prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      return NextResponse.json({ error: "ไม่พบข้อมูลบัญชี" }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลบัญชี" },
      { status: 500 }
    );
  }
}
