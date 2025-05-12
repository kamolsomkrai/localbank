// app/lib/account.ts
import { prisma } from "@/lib/prisma";

// สร้างเลขบัญชีแบบ 10 หลักตามรูปแบบ: 432 (bankcode) + random 6 หลัก + random 1 หลัก
export async function generateThaiAccountNumber(): Promise<string> {
  let acctNo: string;
  do {
    // สร้าง 6 หลักแบบสุ่ม
    const randomSixDigits = Math.floor(Math.random() * 1e6)
      .toString()
      .padStart(6, "0");

    // สร้าง 1 หลักแบบสุ่ม
    const randomOneDigit = Math.floor(Math.random() * 10).toString();

    // รวมเป็นเลขบัญชี 10 หลัก: 432 + random 6 หลัก + random 1 หลัก
    acctNo = `432${randomSixDigits}${randomOneDigit}`;

    // ตรวจสอบว่าเลขบัญชีนี้มีในระบบแล้วหรือไม่
  } while (await prisma.account.findUnique({ where: { number: acctNo } }));

  return acctNo;
}
