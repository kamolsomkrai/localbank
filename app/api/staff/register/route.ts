// app/api/staff/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();
  const hashed = await hash(password, 10);
  const staff = await prisma.staff.create({
    data: { name, email, password: hashed },
  });
  return NextResponse.json({ id: staff.id, email: staff.email });
}
