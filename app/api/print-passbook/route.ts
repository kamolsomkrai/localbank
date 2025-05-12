// app/api/print-passbook/route.ts (อัปเดตให้ข้อความอยู่กึ่งกลาง)
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { accountNumber } = await req.json();
  if (!accountNumber) {
    await prisma.$disconnect();
    return NextResponse.json(
      { error: "กรุณาระบุหมายเลขบัญชี" },
      { status: 400 }
    );
  }

  const acc = await prisma.account.findUnique({
    where: { number: accountNumber },
    select: {
      number: true,
      prefix: true,
      firstName: true,
      lastName: true,
      accountName: true,
      balance: true,
    },
  });
  await prisma.$disconnect();
  if (!acc) {
    return NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 });
  }

  const html = `
    <!DOCTYPE html>
    <html lang="th"><head><meta charset="utf-8"><title>สมุดบัญชี</title>
      <style>
        @page {
          size: 80mm auto;   /* กำหนดกว้าง 80 มม. สูงอัตโนมัติ */
          margin: 0;
        }
        body {
          font-family: "Courier New", monospace;
          padding: 5mm;
           /* จัดข้อความให้อยู่กึ่งกลาง */
        }
        h1 {
          font-size: 18pt;
          margin: 0 0 4mm 0;
        }
        p {
          font-size: 14pt;
          margin: .5em 0;
          
        }
        .accountNumber {
          margin-top: 100px;
          margin-left: 175px;
        }
        .accountName {
          padding: 25px 0px 0px 0px;
          margin-left: 175px; 
        }
      </style>
    </head>
    <body onload="window.print()">
      <div class="accountNumber">
      <p>${acc.number}</p>
      </div>
      <div class="accountName">
        <p>${acc.accountName}</p>
      </div>
      <script>window.onafterprint = () => window.close();</script>
    </body>
    </html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
