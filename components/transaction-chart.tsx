// components/transaction-chart.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar } from 'react-chartjs-2'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface TransactionChartProps {
  data?: {
    depositAmount: number
    withdrawAmount: number
  }
  isLoading?: boolean
}

export function TransactionChart({ data, isLoading = false }: TransactionChartProps) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[300px]" />
        </CardContent>
      </Card>
    )
  }

  const chartData = {
    labels: ['Deposits', 'Withdrawals'],
    datasets: [
      {
        label: 'Amount',
        data: [data.depositAmount, data.withdrawAmount],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      }
    ]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function (value) {
                    return new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(Number(value))
                  }
                }
              }
            }
          }}
        />
      </CardContent>
    </Card>
  )
}