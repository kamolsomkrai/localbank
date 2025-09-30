// app/accounts/report/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Download, Users, ArrowUpDown } from "lucide-react";
import { useAccountsTable } from "@/hooks/use-accounts-table";
// --- CHANGE START: Import flexRender ---
import { type ColumnDef, flexRender } from "@tanstack/react-table";
// --- CHANGE END ---
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";

// Define Account Type remains the same
type Account = {
  id: string;
  number: string;
  accountName: string;
  prefix: string;
  firstName: string;
  lastName: string;
  type: "SAVINGS" | "FIXED" | "CURRENT";
  balance: number;
  createdAt: string;
};

// Define Table Columns remains the same
const columns: ColumnDef<Account>[] = [
  {
    accessorKey: "number",
    header: "เลขที่บัญชี",
    cell: ({ row }) => <div className="font-mono">{row.getValue("number")}</div>,
  },
  {
    accessorKey: "accountName",
    header: "ชื่อบัญชี",
  },
  {
    id: "customerName",
    header: "ชื่อลูกค้า",
    accessorFn: row => `${row.prefix}${row.firstName} ${row.lastName}`,
  },
  {
    accessorKey: "type",
    header: "ประเภท",
    cell: ({ row }) => {
      const type = row.getValue("type") as Account["type"];
      const variant: "default" | "secondary" | "outline" =
        type === "SAVINGS" ? "default" : type === "FIXED" ? "secondary" : "outline";
      const text = type === "SAVINGS" ? "ออมทรัพย์" : type === "FIXED" ? "ฝากประจำ" : "กระแสรายวัน";
      return <Badge variant={variant}>{text}</Badge>;
    },
  },
  {
    accessorKey: "balance",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-right w-full p-0 justify-end"
      >
        ยอดคงเหลือ
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono font-semibold">
        {Number(row.getValue("balance")).toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "วันที่เปิดบัญชี",
    cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString('th-TH'),
  },
];

// Main Component
export default function AccountsReportPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAccounts() {
      setIsLoading(true);
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

  const { table, setGlobalFilter } = useAccountsTable(columns, accounts);

  const handleExport = () => {
    const dataToExport = table.getFilteredRowModel().rows.map(row => ({
      "เลขที่บัญชี": row.original.number,
      "ชื่อบัญชี": row.original.accountName,
      "ชื่อลูกค้า": `${row.original.prefix}${row.original.firstName} ${row.original.lastName}`,
      "ประเภท": row.original.type,
      "ยอดคงเหลือ": row.original.balance,
      "วันที่เปิดบัญชี": new Date(row.original.createdAt).toLocaleDateString('th-TH'),
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accounts");
    XLSX.writeFile(workbook, `accounts_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="flex-shrink-0 bg-primary text-primary-foreground p-3 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <span>รายงานข้อมูลบัญชีทั้งหมด</span>
          </CardTitle>
          <CardDescription>ค้นหา, จัดเรียง และส่งออกข้อมูลบัญชีทั้งหมดในระบบ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-4">
            <Input
              placeholder="ค้นหาทั้งหมด..."
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm"
            />
            <Button onClick={handleExport} disabled={table.getFilteredRowModel().rows.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          </div>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id}>
                        {/* --- CHANGE START: Use flexRender for header --- */}
                        {header.isPlaceholder ? null : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {/* --- CHANGE END --- */}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(10)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={columns.length}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {/* --- CHANGE START: Use flexRender for cell --- */}
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          {/* --- CHANGE END --- */}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">ไม่พบข้อมูล</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>ก่อนหน้า</Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>ถัดไป</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}