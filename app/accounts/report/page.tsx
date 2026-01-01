// app/accounts/report/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Download, Users, ArrowUpDown, Search } from "lucide-react";
import { useAccountsTable } from "@/hooks/use-accounts-table";
import { type ColumnDef, flexRender } from "@tanstack/react-table";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Types ---
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

const columns: ColumnDef<Account>[] = [
  {
    accessorKey: "number",
    header: "เลขที่บัญชี",
    cell: ({ row }) => <div className="font-mono">{row.getValue("number")}</div>,
  },
  {
    accessorKey: "accountName",
    header: "ชื่อบัญชี",
    cell: ({ row }) => (
        <div>
            <div className="font-medium">{row.getValue("accountName")}</div>
            <div className="text-xs text-slate-500">{row.original.prefix}{row.original.firstName} {row.original.lastName}</div>
        </div>
    )
  },
  {
    accessorKey: "type",
    header: "ประเภท",
    cell: ({ row }) => {
      const type = row.getValue("type") as Account["type"];
       const colors = {
          SAVINGS: "bg-emerald-100 text-emerald-800 border-emerald-200",
          FIXED: "bg-amber-100 text-amber-800 border-amber-200",
          CURRENT: "bg-purple-100 text-purple-800 border-purple-200"
      }
      return <Badge variant="outline" className={`${colors[type] || ""} border`}>{type}</Badge>;
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
      <div className="text-right font-mono font-semibold text-slate-700">
        {Number(row.getValue("balance")).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "วันที่เปิดบัญชี",
    cell: ({ row }) => <span className="text-slate-500">{new Date(row.getValue("createdAt")).toLocaleDateString('th-TH')}</span>,
  },
];

export default function AccountsReportPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const accRes = await fetch("/api/accounts/all");
        if (accRes.ok) setAccounts(await accRes.json());
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Memoize to prevent infinite re-render loop
  const filteredAccounts = useMemo(() => {
      if (typeFilter === "ALL") return accounts;
      return accounts.filter(account => account.type === typeFilter);
  }, [accounts, typeFilter]);

  const { table, setGlobalFilter } = useAccountsTable(columns, filteredAccounts);

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
    <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex flex-col gap-2 mb-6 border-b pb-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">Account Registry</h1>
            <p className="text-slate-500">ทะเบียนข้อมูลบัญชีทั้งหมดในระบบ</p>
        </div>

        <Card className="border shadow-sm bg-white">
            <CardHeader className="border-b bg-slate-50/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                            <span>รายการบัญชี</span>
                        </CardTitle>
                        <CardDescription>จำนวนทั้งหมด {filteredAccounts.length} บัญชี</CardDescription>
                    </div>
                    <div className="flex w-full md:w-auto items-center gap-2 flex-wrap">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[160px] bg-white">
                                <SelectValue placeholder="ประเภทบัญชี" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                                <SelectItem value="SAVINGS">ออมทรัพย์</SelectItem>
                                <SelectItem value="FIXED">ฝากประจำ</SelectItem>
                                <SelectItem value="CURRENT">กระแสรายวัน</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="relative w-full md:w-56">
                            <Input
                                placeholder="ค้นหาชื่อ, เลขบัญชี..."
                                onChange={(event) => setGlobalFilter(event.target.value)}
                                className="pl-9 bg-white"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </div>
                        </div>
                        <Button 
                            onClick={handleExport} 
                            disabled={table.getFilteredRowModel().rows.length === 0} 
                            variant="outline"
                            className="text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Excel
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="rounded-none border-0 min-h-[400px]">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map(headerGroup => (
                                <TableRow key={headerGroup.id} className="bg-slate-50/50 hover:bg-slate-50/50">
                                    {headerGroup.headers.map(header => (
                                        <TableHead key={header.id} className="text-slate-700 font-semibold h-12">
                                            {header.isPlaceholder ? null : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={columns.length}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                                ))
                            ) : table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map(row => (
                                    <TableRow key={row.id} className="hover:bg-slate-50 border-b border-slate-100">
                                        {row.getVisibleCells().map(cell => (
                                            <TableCell key={cell.id} className="py-3">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={columns.length} className="h-32 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <Users className="w-8 h-8 text-slate-300 mb-2" />
                                        <p>ไม่พบข้อมูลบัญชี</p>
                                    </div>
                                </TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-between px-4 py-4 border-t bg-slate-50/30">
                    <div className="text-xs text-slate-500">
                        แสดง {table.getRowModel().rows.length} จากทั้งหมด {filteredAccounts.length} รายการ
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>ก่อนหน้า</Button>
                        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>ถัดไป</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}