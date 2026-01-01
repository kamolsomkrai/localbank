import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const logs = await prisma.interestCalculationLog.findMany({
      where: { status: "SUCCESS" },
      orderBy: { executedAt: "desc" },
      take: 10
    })

    return NextResponse.json(logs)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}
