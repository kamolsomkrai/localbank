import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const { periodIdentifier } = await req.json()
    
    // 1. Get Log & Rate
    const log = await prisma.interestCalculationLog.findUnique({ where: { periodIdentifier } })
    if (!log) return NextResponse.json({ error: "Log not found" }, { status: 404 })

    const rateRecord = await prisma.interestRate.findUnique({ where: { accountType: log.type } })
    if (!rateRecord) return NextResponse.json({ error: "Rate not found" }, { status: 400 })
    const currentRate = rateRecord.rate

    // 2. Find Transactions
    const [yearStr] = log.periodIdentifier.split("-")
    const year = parseInt(yearStr)
    const startDate = new Date(year, 11, 31, 0, 0, 0)
    const endDate = new Date(year, 11, 31, 23, 59, 59)
    
    const transactions = await prisma.transaction.findMany({
       where: {
          type: "INTEREST",
          createdAt: { gte: startDate, lte: endDate },
          account: { type: log.type }
       },
       include: { account: true }
    })

    let updatedCount = 0

    // 3. Execute Updates in Transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        for (const t of transactions) {
            const oldAmount = Number(t.amount)
            const balanceAfter = Number(t.balanceAfter)
            const impliedPrincipal = balanceAfter - oldAmount
            
            const newAmount = impliedPrincipal * currentRate
            const diff = newAmount - oldAmount

            if (Math.abs(diff) > 0.0001) { // Avoid float epsilon issues
                // Update Transaction
                await tx.transaction.update({
                    where: { id: t.id },
                    data: { amount: newAmount, balanceAfter: balanceAfter + diff } // Note: Updating historical balanceAfter is technically altering history, but necessary for consistency if we view that specific record.
                })

                // Update Current Account Balance
                // We add the diff to the CURRENT balance
                await tx.account.update({
                    where: { id: t.account.id },
                    data: { balance: { increment: diff } }
                })
                updatedCount++
            }
        }
    })

    return NextResponse.json({
        success: true,
        message: `Successfully updated ${updatedCount} transactions`,
        periodIdentifier,
        newRate: currentRate
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Execution failed" }, { status: 500 })
  }
}
