// app/accounts/report/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Users } from "lucide-react";
import * as XLSX from "xlsx";

type Account = {
  id: string;
  number: string;
  accountName: string;
  prefix: string;
  firstName: string;
  lastName: string;
  type: string;
  balance: number;
  createdAt: string;
};

export default function AccountsReportPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await fetch("/api/accounts/all");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setAccounts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  const handleExport = () => {
    const dataToExport = accounts.map(acc => ({
      "เลขที่บัญชี": acc.number,
      "ชื่อบัญชี": acc.accountName,
      "ชื่อลูกค้า": `${acc.prefix}${acc.firstName} ${acc.lastName}`,
      "ประเภท": acc.type,
      "ยอดคงเหลือ": acc.balance,
      "วันที่เปิดบัญชี": new Date(acc.createdAt).toLocaleDateString('th-TH'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accounts");
    XLSX.writeFile(workbook, "accounts_report.xlsx");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Users className="w-6 h-6" />
              รายงานข้อมูลบัญชีทั้งหมด
            </CardTitle>
          </div>
          <Button onClick={handleExport} disabled={accounts.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่บัญชี</TableHead>
                  <TableHead>ชื่อบัญชี</TableHead>
                  <TableHead>ชื่อลูกค้า</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead className="text-right">ยอดคงเหลือ (บาท)</TableHead>
                  <TableHead>วันที่เปิดบัญชี</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : accounts.length > 0 ? (
                  accounts.map((acc) => (
                    <TableRow key={acc.id}>
                      <TableCell className="font-mono">{acc.number}</TableCell>
                      <TableCell>{acc.accountName}</TableCell>
                      <TableCell>{`${acc.prefix}${acc.firstName} ${acc.lastName}`}</TableCell>
                      <TableCell>{acc.type}</TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(acc.balance).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {new Date(acc.createdAt).toLocaleDateString('th-TH')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      ไม่พบข้อมูลบัญชี
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}