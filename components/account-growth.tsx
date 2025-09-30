// components/account-growth.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface MonthlyData {
  month: number;
  newAccounts: number;
}

interface AccountGrowthProps {
  data?: MonthlyData[];
  isLoading?: boolean;
}

export function AccountGrowth({ data, isLoading = false }: AccountGrowthProps) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Growth</CardTitle>
          <CardDescription>จำนวนบัญชีใหม่ที่เปิดในแต่ละเดือน</CardDescription>
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
        label: 'บัญชีเปิดใหม่',
        data: data.map(d => d.newAccounts),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        fill: true,
        tension: 0.1
      }
    ]
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Growth</CardTitle>
        <CardDescription>จำนวนบัญชีใหม่ที่เปิดในแต่ละเดือน</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full flex items-center justify-center">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: {
                  beginAtZero: true,
                }
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}