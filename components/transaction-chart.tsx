// components/transaction-chart.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bar } from 'react-chartjs-2'
import { Skeleton } from '@/components/ui/skeleton'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Define the structure of the monthly data we expect from the API
interface MonthlyData {
  month: number;
  deposits: number;
  withdrawals: number;
}

interface TransactionChartProps {
  data?: MonthlyData[];
  isLoading?: boolean;
}

export function TransactionChart({ data, isLoading = false }: TransactionChartProps) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Summary</CardTitle>
          <CardDescription>สรุปยอดฝาก-ถอนรายเดือน</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[300px]" />
        </CardContent>
      </Card>
    )
  }

  const monthLabels = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  const chartData = {
    labels: data.map(d => monthLabels[d.month]),
    datasets: [
      {
        label: 'ยอดฝาก',
        data: data.map(d => d.deposits),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1
      },
      {
        label: 'ยอดถอน',
        data: data.map(d => d.withdrawals),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1
      }
    ]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Summary</CardTitle>
        <CardDescription>สรุปยอดฝาก-ถอนรายเดือน</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full flex items-center justify-center">
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' as const },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function (value) {
                      return (Number(value) / 1000).toLocaleString('en-US') + 'K';
                    }
                  }
                }
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}