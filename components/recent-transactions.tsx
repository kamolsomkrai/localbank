// components/recent-transactions.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface Transaction {
  id: string
  account: { accountName: string }
  type: 'DEPOSIT' | 'WITHDRAW'
  amount: number
  createdAt: string
  printed: boolean
}

interface RecentTransactionsProps {
  data?: { transactions: Transaction[] }
  isLoading?: boolean
}

export function RecentTransactions({ data, isLoading = false }: RecentTransactionsProps) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[60px]" />
                <Skeleton className="h-4 w-[80px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{tx.account.accountName}</TableCell>
                <TableCell>
                  <Badge variant={tx.type === 'DEPOSIT' ? 'default' : 'destructive'}>
                    {tx.type}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(tx.amount)}</TableCell>
                <TableCell>{formatDate(tx.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant={tx.printed ? 'default' : 'secondary'}>
                    {tx.printed ? 'Completed' : 'Pending'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
