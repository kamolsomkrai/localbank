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
  const chunkSize = 25;
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
    <td style="${paddingStyle} width: 15%; ${
        tx.printed ? "color: transparent" : ""
      }">
      ${new Date(tx.createdAt).toLocaleString("th-TH", {
        dateStyle: "short",
      })}
    </td>
    <td style="${paddingStyle} width: 5%; text-align: left; ${
        tx.printed ? "color: transparent" : ""
      }">
      ${tx.type === "DEPOSIT" ? "DEP" : tx.type === "WITHDRAW" ? "WD" : "INT"}
    </td>
    <td style="${paddingStyle} width: 43%; text-align: ${
        tx.type === "WITHDRAW" ? "left" : "right"
      }; ${tx.printed ? "color: transparent" : ""}">
    ${parseFloat(tx.amount.toString()).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
    </td>
    <td style="${paddingStyle} width: 22%; text-align: right; ${
        tx.printed ? "color: transparent" : ""
      }">
    ${parseFloat(tx.balanceAfter.toString()).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
    </td>
    <td style="${paddingStyle} width: 15%; text-align: right; ${
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
        <title>สมุดบัญชี - ${account.id}</title>
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
              <th style="width: 15%; text-align: left;">วันที่</th>
              <th style="width: 5%; text-align: center;">ประเภท</th>
              <th style="width: 43%; text-align: right;">จำนวน</th>
              <th style="width: 22%; text-align: right; margin-left: 2mm;">คงเหลือ</th>
              <th style="width: 15%; text-align: right; margin-left: 5mm;">Staff</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div id="confirm-dialog" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 2px solid black; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; z-index: 1000;">
          <h3 style="margin-top: 0;">ผลการพิมพ์</h3>
          <p>พิมพ์รายการลงสมุดบัญชีเรียบร้อยแล้วใช่หรือไม่?</p>
          <div style="margin-top: 15px;">
            <button onclick="confirmPrint(true)" style="background: #22c55e; color: white; border: none; padding: 8px 16px; margin: 0 5px; cursor: pointer; border-radius: 4px;">พิมพ์สำเร็จ</button>
            <button onclick="confirmPrint(false)" style="background: #ef4444; color: white; border: none; padding: 8px 16px; margin: 0 5px; cursor: pointer; border-radius: 4px;">ไม่ได้พิมพ์ / ยกเลิก</button>
          </div>
        </div>
        <div id="overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999;"></div>

        <script>
          const transactionIds = ${JSON.stringify(transactionIds)};

          // รอให้ DOM โหลดและพิมพ์อัตโนมัติ
          window.onload = () => {
             // Delay เล็กน้อยเพื่อให้ render เสร็จสมบูรณ์
             setTimeout(() => {
               window.print();
             }, 500);
          };

          // จับ event หลังปิดหน้าต่างพิมพ์ (ทั้งพิมพ์เสร็จและยกเลิก)
          window.onafterprint = () => {
            showConfirmation();
          };

          // Fallback สำหรับบาง browser ที่ onafterprint ไม่ทำงานสมบูรณ์
          // เราจะแสดง dialog เสมอเมื่อ window กลับมา focus หรือผ่านไปสักพัก
          /*
          window.onfocus = () => {
             // สามารถเพิ่ม logic เช็คว่าสั่งพิมพ์ไปแล้วหรือยังได้ถ้าจำเป็น
          };
          */

          function showConfirmation() {
            document.getElementById('confirm-dialog').style.display = 'block';
            document.getElementById('overlay').style.display = 'block';
          }

          async function confirmPrint(success) {
            if (success) {
              try {
                const response = await fetch('/api/update-print-status', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ transactionIds, printed: true }),
                });
                
                if (!response.ok) throw new Error('Update failed');
                alert('บันทึกสถานะเรียบร้อย');
              } catch (error) {
                alert('เกิดข้อผิดพลาดในการบันทึกสถานะ: ' + error.message);
                return; // ไม่ปิดหน้าต่างหาก error
              }
            }
            window.close();
          }
        </script>
      </body>
    </html>
  `;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
