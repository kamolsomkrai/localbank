import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AccountType } from "@prisma/client"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const { periodIdentifier } = await req.json()
    
    // 1. Get Log Details
    const log = await prisma.interestCalculationLog.findUnique({
      where: { periodIdentifier }
    })
    
    if (!log) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 })
    }

    // 2. Get Current Configured Rate
    const rateRecord = await prisma.interestRate.findUnique({
       where: { accountType: log.type }
    })
    
    if (!rateRecord) {
        return NextResponse.json({ error: "Interest Rate not configured" }, { status: 400 })
    }
    const currentRate = rateRecord.rate // e.g., 0.02

    // 3. Find Transactions in that period
    // Parse year from identifier (Format: YEAR-TYPE)
    const [yearStr] = log.periodIdentifier.split("-")
    const year = parseInt(yearStr)
    
    const startDate = new Date(year, 11, 31, 0, 0, 0)
    const endDate = new Date(year, 11, 31, 23, 59, 59)
    
    const transactions = await prisma.transaction.findMany({
       where: {
          type: "INTEREST",
          createdAt: {
             gte: startDate,
             lte: endDate
          },
          account: {
             type: log.type
          }
       },
       include: {
          account: true
       }
    })

    let affectedCount = 0
    let totalOldInterest = 0
    let totalNewInterest = 0
    let netChange = 0

    // 4. Simulate
    const previewItems = transactions.map(tx => {
       const oldAmount = Number(tx.amount)
       const balanceAfter = Number(tx.balanceAfter)
       // Reverse calculate principal: The balance BEFORE adding interest
       const impliedPrincipal = balanceAfter - oldAmount
       
       const newAmount = impliedPrincipal * currentRate
       const diff = newAmount - oldAmount
       
       totalOldInterest += oldAmount
       totalNewInterest += newAmount
       netChange += diff
       affectedCount++

       return {
          accountNumber: tx.account.number,
          oldInterest: oldAmount,
          newInterest: newAmount,
          diff: diff,
          impliedPrincipal
       }
    })

    return NextResponse.json({
       targetRate: currentRate,
       affectedCount,
       totalOldInterest,
       totalNewInterest,
       netChange,
       previewItems: previewItems.slice(0, 5) // Send first 5 as sample
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Simulation failed" }, { status: 500 })
  }
}
