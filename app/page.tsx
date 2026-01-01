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
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  UserPlus, 
  Coins, 
  Wallet,
  Landmark,
  PiggyBank,
  TrendingUp,
  TrendingDown
} from "lucide-react";

// Reusable StatCard component for a cleaner look
const StatCard = ({ 
  title, 
  value, 
  isLoading, 
  icon, 
  trend,
  colorClass 
}: { 
  title: string, 
  value: string, 
  isLoading: boolean, 
  icon?: React.ReactNode, 
  trend?: string,
  colorClass?: string
}) => (
  <Card className="border-l-4 shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-32" />
      ) : (
        <div className={`text-2xl font-bold ${colorClass || ''}`}>
          {value}
        </div>
      )}
      {trend && (
        <p className="text-xs text-muted-foreground mt-1">
          {trend}
        </p>
      )}
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

  // Helper to format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { 
      style: 'currency', 
      currency: 'THB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
           <p className="text-muted-foreground">ภาพรวมสถานะการเงินและบัญชีลูกค้า</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Tabs value={range} onValueChange={setRange} className="w-full md:w-auto">
            <TabsList className="grid w-full grid-cols-4 md:w-auto bg-slate-200/50">
              <TabsTrigger value="today">วันนี้</TabsTrigger>
              <TabsTrigger value="week">สัปดาห์</TabsTrigger>
              <TabsTrigger value="month">เดือน</TabsTrigger>
              <TabsTrigger value="year">ปี</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Daily Summary Cards (Highlights) */}
      <h3 className="text-lg font-semibold text-slate-700 mt-6 mb-3 flex items-center gap-2">
        <Landmark className="w-5 h-5 text-blue-600" />
        สรุปรายการวันนี้
      </h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="ยอดเงินฝาก" 
          value={formatMoney(data?.dailySummary?.deposits || 0)} 
          isLoading={loading}
          icon={<ArrowUpCircle className="h-4 w-4 text-green-600" />}
          colorClass="text-green-700"
          trend="ยอดฝากวันนี้"
        />
        <StatCard 
          title="ยอดเงินถอน" 
          value={formatMoney(data?.dailySummary?.withdrawals || 0)} 
          isLoading={loading}
          icon={<ArrowDownCircle className="h-4 w-4 text-red-600" />}
          colorClass="text-red-700"
          trend="ยอดถอนวันนี้"
        />
        <StatCard 
          title="บัญชีใหม่" 
          value={formatNumber(data?.dailySummary?.newAccounts || 0)} 
          isLoading={loading}
          icon={<UserPlus className="h-4 w-4 text-blue-600" />}
          colorClass="text-blue-700"
          trend="เปิดบัญชีวันนี้"
        />
         <StatCard 
          title="กระแสเงินสดสุทธิ" 
          value={formatMoney(data?.dailySummary?.netFlow || 0)} 
          isLoading={loading}
          icon={<Wallet className="h-4 w-4 text-slate-600" />}
          colorClass={data?.dailySummary?.netFlow >= 0 ? "text-green-700" : "text-red-700"}
          trend="ฝากลบถอนวันนี้"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Main Stats (Left Column) */}
        <div className="lg:col-span-2 space-y-6">
           {/* Charts */}
           <div className="grid gap-4 md:grid-cols-2">
            <TransactionChart data={data?.chartData} isLoading={loading} />
            <AccountGrowth data={data?.chartData} isLoading={loading} />
          </div>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-100/50 pb-4">
               <div className="flex items-center justify-between">
                 <div>
                    <CardTitle className="text-lg font-bold text-slate-800">สถิติภาพรวม</CardTitle>
                    <CardDescription>ข้อมูลสะสมและในช่วงเวลา {range === 'today' ? 'วันนี้' : range === 'week' ? 'สัปดาห์นี้' : range === 'month' ? 'เดือนนี้' : 'ปีนี้'}</CardDescription>
                 </div>
               </div>
            </CardHeader>
            <CardContent className="pt-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                  <div className="space-y-4">
                     <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wide">ยอดสะสมทั้งหมด</h4>
                     <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-600 flex items-center gap-2">
                           <UserPlus className="w-4 h-4" /> บัญชีทั้งหมด
                        </span>
                        {loading ? <Skeleton className="h-6 w-16" /> : <span className="font-bold text-lg text-slate-900">{formatNumber(data?.mainStats?.totalAccounts || 0)}</span>}
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-600 flex items-center gap-2">
                           <PiggyBank className="w-4 h-4" /> เงินในระบบ
                        </span>
                        {loading ? <Skeleton className="h-6 w-24" /> : <span className="font-bold text-lg text-blue-700">{formatMoney(Number(data?.mainStats?.totalBalance || 0))}</span>}
                      </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wide">ช่วงเวลาที่เลือก ({range})</h4>
                      <div className="space-y-3">
                         <div className="flex justify-between text-sm">
                           <span className="text-slate-500 flex items-center gap-2"><ArrowUpCircle className="w-4 h-4 text-green-500"/> รายรับ (ฝาก)</span>
                           {loading ? <Skeleton className="h-5 w-20" /> : <span className="font-semibold text-green-700">{formatMoney(data?.mainStats?.depositAmount || 0)}</span>}
                         </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-slate-500 flex items-center gap-2"><ArrowDownCircle className="w-4 h-4 text-red-500"/> รายจ่าย (ถอน)</span>
                           {loading ? <Skeleton className="h-5 w-20" /> : <span className="font-semibold text-red-700">{formatMoney(data?.mainStats?.withdrawAmount || 0)}</span>}
                         </div>
                         <div className="pt-2 border-t border-slate-100 flex justify-between text-sm">
                           <span className="text-slate-500 flex items-center gap-2"><Coins className="w-4 h-4 text-amber-500"/> ดอกเบี้ยจ่าย</span>
                           {loading ? <Skeleton className="h-5 w-20" /> : <span className="font-semibold text-amber-700">{formatMoney(data?.mainStats?.interestAmount || 0)}</span>}
                         </div>
                      </div>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions (Right Column) */}
        <div className="lg:col-span-1">
          <RecentTransactions data={data?.recentTransactions} isLoading={loading} />
        </div>
      </div>
    </div>
  );
}