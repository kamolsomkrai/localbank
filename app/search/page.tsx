'use client';
import { useState, FormEvent } from 'react';
import { Search, AlertCircle, User, CreditCard, Calendar, Coins, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

type Account = {
  id: string;
  number: string;
  cid: string;
  prefix: string;
  firstName: string;
  lastName: string;
  accountName: string;
  type: string;
  balance: string;
  createdAt: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Account[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่พบข้อมูล');
      setResults(data);
    } catch (err: any) {
      setResults([]);
      setError(err.message || 'เกิดข้อผิดพลาดในการค้นหา');
    } finally {
      setIsLoading(false);
    }
  }

  const accountTypeMap = {
    SAVINGS: { label: 'ออมทรัพย์', variant: 'default' },
    FIXED: { label: 'เงินฝากประจำ', variant: 'secondary' },
    CURRENT: { label: 'กระแสรายวัน', variant: 'outline' },
  };

  const copyToClipboard = (accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber);
    toast.success('คัดลอกเลขบัญชีเรียบร้อยแล้ว', {
      description: accountNumber,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Search className="w-6 h-6" />
            <span>ค้นหาบัญชีลูกค้า</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="ค้นหาด้วยหมายเลขบัญชี, ชื่อลูกค้า, หรือเลขบัตรประชาชน"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 h-12 text-base"
              />
              <Button
                type="submit"
                className="h-12 px-6"
                disabled={isLoading || !query.trim()}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังค้นหา...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    ค้นหา
                  </span>
                )}
              </Button>
            </div>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}

          {isLoading && !error && (
            <div className="mt-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-6 border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="w-[180px]">
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-4 h-4 opacity-70" />
                        <span>เลขบัญชี</span>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 opacity-70" />
                        <span>ชื่อลูกค้า</span>
                      </div>
                    </TableHead>
                    <TableHead>ชื่อบัญชี</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Coins className="w-4 h-4 opacity-70" />
                        <span>ยอดเงิน</span>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 opacity-70" />
                        <span>วันที่เปิด</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((account) => (
                    <TableRow key={account.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-2 px-0 hover:bg-transparent"
                              onClick={() => copyToClipboard(account.number)}
                            >
                              {account.number}
                              <Copy className="w-3 h-3 opacity-70 hover:text-primary" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>คัดลอกเลขบัญชี</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{`${account.prefix}${account.firstName} ${account.lastName}`}</span>
                          <span className="text-sm text-muted-foreground">{account.cid}</span>
                        </div>
                      </TableCell>
                      <TableCell>{account.accountName}</TableCell>
                      <TableCell>
                        <Badge variant={accountTypeMap[account.type as keyof typeof accountTypeMap]?.variant || 'outline'}>
                          {accountTypeMap[account.type as keyof typeof accountTypeMap]?.label || account.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(account.balance).toLocaleString('th-TH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </TableCell>
                      <TableCell>
                        {new Date(account.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}