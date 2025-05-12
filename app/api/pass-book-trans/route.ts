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

  // ดึงข้อมูลบัญชี
  const account = await prisma.account.findUnique({
    where: { number: accountNumber },
    select: { id: true },
  });
  if (!account) {
    await prisma.$disconnect();
    return NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 });
  }

  // ดึง transaction ทั้งหมด (เรียงจากเก่าไปใหม่)
  const allTxs = await prisma.transaction.findMany({
    where: { accountId: account.id }, // ดึงเฉพาะที่ยังไม่ได้พิมพ์
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      amount: true,
      type: true,
      balanceAfter: true,
      staffId: true,
      printed: true,
    },
  });

  if (!allTxs.length) {
    await prisma.$disconnect();
    return NextResponse.json(
      { message: "ไม่มีรายการใหม่ที่ต้องพิมพ์" },
      { status: 204 }
    );
  }

  // แบ่ง transaction เป็นชุดๆ ละ 30 รายการ
  const chunkSize = 27;
  const txChunks = [];
  for (let i = 0; i < allTxs.length; i += chunkSize) {
    txChunks.push(allTxs.slice(i, i + chunkSize));
  }

  // ใช้เฉพาะหน้าสุดท้าย
  const lastChunk = txChunks[txChunks.length - 1];
  const transactionIds = lastChunk.map((tx) => tx.id);

  // เรียงข้อมูลจากน้อยไปมากตามวันที่ (ในหน้าสุดท้าย)
  const sortedTxs = [...lastChunk].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  // สร้างแถวข้อมูล
  const rows = sortedTxs
    .map((tx, index) => {
      // เพิ่ม padding-top 15mm สำหรับแถวที่ 16 เป็นต้นไป
      const paddingStyle = index === 13 ? "padding-top: 10mm;" : "";

      return `
  <tr>
    <td style="${paddingStyle} width: 10%; ${
        tx.printed ? "color: transparent" : ""
      }">
      ${new Date(tx.createdAt).toLocaleString("th-TH", {
        dateStyle: "short",
      })}
    </td>
    <td style="${paddingStyle} width: 10%; text-align: left; ${
        tx.printed ? "color: transparent" : ""
      }">
      ${tx.type === "DEPOSIT" ? "DEP" : tx.type === "WITHDRAW" ? "WD" : "INT"}
    </td>
    <td style="${paddingStyle} width: 30%; text-align: ${
        tx.type === "WITHDRAW" ? "left" : "right"
      }; ${tx.printed ? "color: transparent" : ""}">
    ${parseFloat(tx.amount).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
    </td>
    <td style="${paddingStyle} width: 25%; text-align: right; ${
        tx.printed ? "color: transparent" : ""
      }">
    ${parseFloat(tx.balanceAfter).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
    </td>
    <td style="${paddingStyle} width: 10%; text-align: right; ${
        tx.printed ? "color: transparent" : ""
      }">${tx.staffId?.split("-")[1] || ""}</td>
  </tr>
`;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="th">
      <head>
        <meta charset="utf-8">
        <title>สมุดบัญชี - ${account.name}</title>
        <style>
          body {
            font-family: "Courier New", monospace;
            margin: 0;
            padding-top: 10mm;
            font-size: 12pt;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr style="display: none">
              <th style="width: 20%; text-align: left;">วันที่</th>
              <th style="width: 5%; text-align: center;">ประเภท</th>
              <th style="width: 45%; text-align: right;">จำนวน</th>
              <th style="width: 20%; text-align: right; margin-left: 2mm;">คงเหลือ</th>
              <th style="width: 10%; text-align: right; margin-left: 5mm;">Staff</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <script>
          // ส่งข้อมูลกลับไปยังเซิร์ฟเวอร์เมื่อพิมพ์เสร็จ
          async function confirmPrint() {
            try {
              const response = await fetch('/api/update-print-status', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  transactionIds: ${JSON.stringify(transactionIds)},
                  printed: true
                }),
              });
              
              if (!response.ok) {
                throw new Error('Failed to update print status');
              }
              return await response.json();
            } catch (error) {
              console.error('Error:', error);
              // ลองอีกครั้งหลังจากดีเลย์
              setTimeout(confirmPrint, 1000);
            }
          }

          // ตรวจสอบการพิมพ์
          let printAttempted = false;
          
          window.onbeforeprint = () => {
            printAttempted = true;
          };
          
          window.onafterprint = async () => {
            if (printAttempted) {
              await confirmPrint();
            }
            window.close();
          };
          
          // เปิดหน้าต่างพิมพ์หลังจากตั้งค่า event listeners แล้ว
          setTimeout(() => {
            window.print();
          }, 100);
        </script>
      </body>
    </html>
  `;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
