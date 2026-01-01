import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    // 1. Account Stats
    const accounts = await prisma.account.findMany({
        select: { type: true, balance: true, createdAt: true } // Reduced payload
    })

    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)
    const totalAccounts = accounts.length
    
    // Distribution
    const distribution = {
        SAVINGS: accounts.filter(a => a.type === "SAVINGS").length,
        FIXED: accounts.filter(a => a.type === "FIXED").length,
        CURRENT: accounts.filter(a => a.type === "CURRENT").length,
    }

    // 2. Today's Inflow/Outflow
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todaysTx = await prisma.transaction.findMany({
        where: { createdAt: { gte: today } }
    })
    
    let dailyInflow = 0
    let dailyOutflow = 0
    
    todaysTx.forEach(tx => {
        const amt = Number(tx.amount)
        if (tx.type === "DEPOSIT" || tx.type === "INTEREST") dailyInflow += amt
        else if (tx.type === "WITHDRAW") dailyOutflow += amt
    })

    // 3. Last 30 Days Trend
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)

    const recentTx = await prisma.transaction.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: "asc" }
    })

    // Group by Date
    const trendsMap = new Map<string, { date: string, deposit: number, withdraw: number }>()

    // Initialize map with all 30 days (even if empty) to avoid gaps in chart
    for (let i = 0; i <= 30; i++) {
        const d = new Date(thirtyDaysAgo)
        d.setDate(d.getDate() + i)
        // Format: YYYY-MM-DD for key, but Short Date (D MMM) for display
        const dateKey = d.toISOString().split("T")[0] 
        const displayDate = d.toLocaleDateString("th-TH", { day: 'numeric', month: 'short' })
        trendsMap.set(dateKey, { date: displayDate, deposit: 0, withdraw: 0 })
    }

    recentTx.forEach(tx => {
         const dateKey = tx.createdAt.toISOString().split("T")[0]
         const entry = trendsMap.get(dateKey)
         if (entry) {
             const amt = Number(tx.amount)
             if (tx.type === "DEPOSIT" || tx.type === "INTEREST") entry.deposit += amt
             else if (tx.type === "WITHDRAW") entry.withdraw += amt
         }
    })

    const trends = Array.from(trendsMap.values())

    // 4. Whale Watch (Large Transactions)
    const whaleTx = await prisma.transaction.findMany({
        where: { amount: { gte: 50000 } }, // Threshold 50,000
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { account: { select: { number: true, accountName: true } } }
    })

    return NextResponse.json({
        summary: {
            totalBalance,
            totalAccounts,
            dailyInflow,
            dailyOutflow,
            newAccountsToday: accounts.filter(a => new Date(a.createdAt) >= today).length
        },
        distribution,
        trends,
        whaleTx
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
