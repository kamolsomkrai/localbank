// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { StatsGrid } from "@/components/stats-grid";
import { TransactionChart } from "@/components/transaction-chart";
import { RecentTransactions } from "@/components/recent-transactions";
import { AccountGrowth } from "@/components/account-growth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Reusable StatCard component for a cleaner look
const StatCard = ({ title, value, isLoading }: { title: string, value: string, isLoading: boolean }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {isLoading ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-bold">{value}</div>}
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("month");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stats?range=${range}`);
        if (!res.ok) throw new Error("Failed to fetch data");
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [range]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Tabs value={range} onValueChange={setRange}>
            <TabsList>
              <TabsTrigger value="today">วันนี้</TabsTrigger>
              <TabsTrigger value="week">สัปดาห์นี้</TabsTrigger>
              <TabsTrigger value="month">เดือนนี้</TabsTrigger>
              <TabsTrigger value="year">ปีนี้</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="ยอดเงินฝาก (วันนี้)" value={(data?.dailySummary?.deposits || 0).toLocaleString('th-TH') + ' ฿'} isLoading={loading} />
        <StatCard title="ยอดเงินถอน (วันนี้)" value={(data?.dailySummary?.withdrawals || 0).toLocaleString('th-TH') + ' ฿'} isLoading={loading} />
        <StatCard title="บัญชีใหม่ (วันนี้)" value={(data?.dailySummary?.newAccounts || 0).toLocaleString('th-TH')} isLoading={loading} />
        <StatCard title="ยอดสุทธิ (วันนี้)" value={(data?.dailySummary?.netFlow || 0).toLocaleString('th-TH') + ' ฿'} isLoading={loading} />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
        {/* Overall & Range Stats Card */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>สถิติภาพรวม</CardTitle>
            <CardDescription>ข้อมูลสะสมและในช่วงเวลาที่เลือก</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">บัญชีทั้งหมด</span>
              {loading ? <Skeleton className="h-6 w-16" /> : <span className="font-bold text-lg">{data?.mainStats?.totalAccounts.toLocaleString('th-TH')}</span>}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">ยอดเงินในระบบทั้งหมด</span>
              {loading ? <Skeleton className="h-6 w-24" /> : <span className="font-bold text-lg">{Number(data?.mainStats?.totalBalance || 0).toLocaleString('th-TH')} ฿</span>}
            </div>
            <hr />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">เงินฝาก (ช่วงที่เลือก)</span>
              {loading ? <Skeleton className="h-6 w-20" /> : <span className="font-semibold text-green-600">{(data?.mainStats?.depositAmount || 0).toLocaleString('th-TH')} ฿</span>}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">เงินถอน (ช่วงที่เลือก)</span>
              {loading ? <Skeleton className="h-6 w-20" /> : <span className="font-semibold text-red-600">{(data?.mainStats?.withdrawAmount || 0).toLocaleString('th-TH')} ฿</span>}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">บัญชีใหม่ (ช่วงที่เลือก)</span>
              {loading ? <Skeleton className="h-6 w-12" /> : <span className="font-semibold">{(data?.mainStats?.newAccounts || 0).toLocaleString('th-TH')}</span>}
            </div>
          </CardContent>
        </Card>
        {/* Recent Transactions List */}
        <RecentTransactions data={data?.recentTransactions} isLoading={loading} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <TransactionChart data={data?.chartData} isLoading={loading} />
        <AccountGrowth data={data?.chartData} isLoading={loading} />
      </div>
    </div>
  );
}