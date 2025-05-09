// app/api/customers/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const {
    prefix,
    firstName,
    lastName,
    birthDate,
    gender,
    address,
    province,
    district,
    subDistrict,
    moo,
    phone,
    email,
    occupation,
    cid,
    accountType,
    initialDeposit,
  } = await req.json();

  const customer = await prisma.customer.create({
    data: {
      prefix,
      firstName,
      lastName,
      birthDate: new Date(birthDate),
      gender,
      address,
      province,
      district,
      subDistrict,
      moo,
      phone,
      email,
      occupation,
      cid,
      accounts: {
        create: {
          number: `AC${Date.now()}`,
          type: accountType,
          balance: initialDeposit,
        },
      },
    },
  });
  return NextResponse.json({
    message: "สมัครลูกค้าและเปิดบัญชีสำเร็จ",
    id: customer.id,
  });
}
