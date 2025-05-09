// app/lib/account.ts
import { prisma } from "@/lib/prisma";

// สร้างเลขบัญชีแบบ 10 หลัก (Thai bank standard) ตรวจสอบไม่ซ้ำ
export async function generateThaiAccountNumber(): Promise<string> {
  let acctNo: string;
  do {
    acctNo = Math.floor(Math.random() * 1e10)
      .toString()
      .padStart(10, "0");
  } while (await prisma.account.findUnique({ where: { number: acctNo } }));
  return acctNo;
}
