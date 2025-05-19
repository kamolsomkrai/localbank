// app/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import { StatsGrid } from "@/components/stats-grid"
import { TransactionChart } from "@/components/transaction-chart"
import { RecentTransactions } from "@/components/recent-transactions"
import { AccountGrowth } from "@/components/account-growth"
import { api } from "@/lib/api"

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    api.get("/stats")
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-4">กำลังโหลดข้อมูล...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Banking Dashboard</h1>
        <StatsGrid data={data} isLoading={loading} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TransactionChart data={data} isLoading={loading} />
        <AccountGrowth data={data} isLoading={loading} />
      </div>
      <div className="grid gap-4">
        <RecentTransactions data={data} isLoading={loading} />
      </div>
    </div>
  )
}
