import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jsPDF } from "jspdf";
import fs from "fs";
import os from "os";
import path from "path";
import { exec, execSync } from "child_process";
import { print } from "pdf-to-printer";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { accountNumber } = await req.json();
  if (!accountNumber) {
    return NextResponse.json(
      { error: "กรุณาระบุหมายเลขบัญชี" },
      { status: 400 }
    );
  }

  const acc = await prisma.account.findUnique({
    where: { number: accountNumber },
  });
  if (!acc) {
    await prisma.$disconnect();
    return NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 });
  }

  // สร้าง PDF ด้วย jsPDF
  const doc = new jsPDF();
  doc.setFont("Courier", "normal");
  doc.setFontSize(14);
  doc.text("สมุดบัญชีธนาคาร", 20, 30);
  doc.setFontSize(12);
  doc.text(`เลขบัญชี: ${acc.number}`, 20, 50);
  doc.text(`ชื่อ: ${acc.prefix} ${acc.firstName} ${acc.lastName}`, 20, 65);
  doc.text(`ยอดเงิน: ${acc.balance.toString()}`, 20, 80);

  // เขียนไฟล์ PDF ลง temp
  const tmpDir = os.tmpdir();
  const pdfPath = path.join(tmpDir, `passbook_${acc.number}.pdf`);
  fs.writeFileSync(pdfPath, Buffer.from(doc.output("arraybuffer")));

  // หา path ของ SumatraPDF.exe แบบอัตโนมัติ (ต้องอยู่ใน PATH หรือ ติดตั้งใน Program Files)
  let sumatraPath: string;
  try {
    // คำสั่ง where จะคืนค่า path แรกของ SumatraPDF.exe
    const result = execSync("where SumatraPDF.exe", { encoding: "utf8" })
      .split(/\r?\n/)[0]
      .trim();
    if (!fs.existsSync(result)) throw new Error();
    sumatraPath = result;
  } catch {
    // ถ้า 'where' หาไม่เจอ ให้ลองค่า default ใน Program Files
    const defaultPath =
      "C:\\Users\\kirav\\AppData\\Local\\SumatraPDF\\SumatraPDF.exe";
    if (fs.existsSync(defaultPath)) {
      sumatraPath = defaultPath;
    } else {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: `ไม่พบ SumatraPDF.exe (ติดตั้งแล้วหรือเพิ่มลง PATH ก่อน)` },
        { status: 500 }
      );
    }
  }

  // สั่งพิมพ์แบบเงียบไปยัง default printer
  try {
    await print(pdfPath, {
      appPath: sumatraPath,
      win32: ["-print-to-default", "-silent"],
    });
  } catch (err: any) {
    fs.unlinkSync(pdfPath);
    await prisma.$disconnect();
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  // ลบไฟล์ temp และปิดเชื่อมต่อ
  fs.unlinkSync(pdfPath);
  await prisma.$disconnect();
  return NextResponse.json({ success: true });
}
