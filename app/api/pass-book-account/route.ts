// app/api/print-passbook/route.ts
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

  const account = await prisma.account.findUnique({
    where: { number: accountNumber },
    select: {
      number: true,
      prefix: true,
      firstName: true,
      lastName: true,
      accountName: true,
      balance: true,
      createdAt: true,
    },
  });
  await prisma.$disconnect();

  if (!account) {
    return NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 });
  }

  const html = `
    <!DOCTYPE html>
    <html lang="th">
      <head>
        <meta charset="utf-8">
        <title>สมุดบัญชี - ${account.number}</title>
        <style>
          @page {
            margin: 0;
          }
          body {
            font-family: "Courier New", monospace;
            padding: 5mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            // justify-content: center;
            // height: 100vh;
            text-align: center;
          }
          .header {
            font-size: 16pt;
            margin-bottom: 10mm;
            font-weight: bold;
          }
          .account-info {
            font-size: 18pt;
            margin: 2mm 0;
            width: 100%;
            // padding-top: 5mm;
          }
          .account-number {
            font-size: 18pt;
            font-weight: bold;
            margin: 1mm 0;
            padding-top: 112mm;
          }
          .balance {
            font-size: 18pt;
            font-weight: bold;
            margin: 1mm 0;
          }
          .date {
            font-size: 10pt;
            margin-top: 10mm;
          }
        </style>
      </head>
      <body onload="window.print()">
        <div class="account-number">${
          account.number.toString().slice(0, 3) +
          "-" +
          account.number.toString().slice(3, 9) +
          "-" +
          account.number.toString().slice(9, 10)
        }</div>
        <div class="account-info">${account.accountName}</div>
        <script>
          window.onafterprint = () => window.close();
        </script>
      </body>
    </html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
