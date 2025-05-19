// components/account-growth.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Users } from 'lucide-react'

interface AccountGrowthProps {
  data?: {
    monthlyNewAccounts: number
    growthRate: number
  }
  isLoading?: boolean
}

export function AccountGrowth({ data, isLoading = false }: AccountGrowthProps) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[300px]" />
        </CardContent>
      </Card>
    )
  }

  const { monthlyNewAccounts, growthRate } = data
  const isPositive = growthRate >= 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Growth</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">New Accounts</p>
              <p className="text-2xl font-bold">{monthlyNewAccounts}</p>
            </div>
          </div>
          <div className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            <TrendingUp className={`h-5 w-5 mr-1 ${!isPositive ? 'transform rotate-180' : ''}`} />
            <span>{Math.abs(growthRate).toFixed(1)}%</span>
          </div>
        </div>

        <Progress value={Math.min(100, Math.max(0, growthRate))} className="h-2" />

        <div className="text-sm text-muted-foreground">
          {isPositive ? 'Increase' : 'Decrease'} from last month
        </div>
      </CardContent>
    </Card>
  )
}
