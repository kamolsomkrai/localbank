// components/recent-transactions.tsx
"use client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentTransactions({ data, isLoading }: { data: any[], isLoading: boolean }) {
  const router = useRouter();

  const handleRowClick = (accountNumber: string) => {
    router.push(`/transactions?accountNumber=${accountNumber}`);
  };

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle>รายการธุรกรรมล่าสุด</CardTitle>
        <CardDescription>แสดง 5 รายการล่าสุดในช่วงเวลาที่เลือก</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>บัญชี</TableHead>
              <TableHead className="hidden sm:table-cell">ประเภท</TableHead>
              <TableHead className="text-right">จำนวนเงิน</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={3}><Skeleton className="h-5 w-full" /></TableCell>
                </TableRow>
              ))
            ) : data && data.length > 0 ? (
              data.map((tx: any) => (
                <TableRow
                  key={tx.id}
                  onClick={() => handleRowClick(tx.account.number)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="font-medium">{tx.account.accountName}</div>
                    <div className="text-sm text-muted-foreground">{tx.account.number}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={tx.type === 'DEPOSIT' ? 'default' : 'destructive'}>
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {Number(tx.amount).toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">ไม่มีข้อมูลธุรกรรมในช่วงเวลานี้</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}