// components/stats-grid.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { ArrowUp, ArrowDown, Wallet, Users } from 'lucide-react'

interface StatsGridProps {
  data?: {
    totalBalance: number
    totalAccounts: number
    depositAmount: number
    withdrawAmount: number
  }
  isLoading?: boolean  // ทำให้ optional
}

export function StatsGrid({ data, isLoading = false }: StatsGridProps) {
  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex items-center justify-between pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[150px] mt-2" />
              <Skeleton className="h-4 w-[200px] mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stats = [
    {
      title: "Total Balance",
      value: formatCurrency(data.totalBalance),
      icon: <Wallet className="h-4 w-4 text-muted-foreground" />,
      description: "Sum of all account balances"
    },
    {
      title: "Total Accounts",
      value: data.totalAccounts,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      description: "All active accounts"
    },
    {
      title: "Total Deposits",
      value: formatCurrency(data.depositAmount),
      icon: <ArrowUp className="h-4 w-4 text-muted-foreground" />,
      description: "This month's deposits"
    },
    {
      title: "Total Withdrawals",
      value: formatCurrency(data.withdrawAmount),
      icon: <ArrowDown className="h-4 w-4 text-muted-foreground" />,
      description: "This month's withdrawals"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <Card key={i}>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
