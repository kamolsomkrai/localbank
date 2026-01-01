'use client';
import { useState, FormEvent } from 'react';
import { Search, AlertCircle, User, CreditCard, Calendar, Coins, Copy, Edit, X, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Account[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    
    setError('');
    setIsLoading(true);
    setHasSearched(true);

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
    SAVINGS: { label: 'ออมทรัพย์', variant: 'default' as const, bg: 'bg-green-100 text-green-700 border-green-200' },
    FIXED: { label: 'เงินฝากประจำ', variant: 'secondary' as const, bg: 'bg-amber-100 text-amber-700 border-amber-200' },
    CURRENT: { label: 'กระแสรายวัน', variant: 'outline' as const, bg: 'bg-blue-100 text-blue-700 border-blue-200' },
  };

  const copyToClipboard = (accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber);
    toast.success('คัดลอกเลขบัญชีเรียบร้อยแล้ว', {
      description: accountNumber,
    });
  };

  const handleEditClick = (account: Account) => {
    setCurrentAccount(account);
    setIsEditModalOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!currentAccount) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/accounts/${currentAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountType: currentAccount.type,
          cid: currentAccount.cid,
          prefixName: currentAccount.prefix,
          firstName: currentAccount.firstName,
          lastName: currentAccount.lastName,
          accountName: currentAccount.accountName,
        }),
      });

      if (!res.ok) throw new Error('ไม่สามารถบันทึกการเปลี่ยนแปลง');

      const updatedAccount = await res.json();
      setResults(results.map(acc =>
        acc.id === updatedAccount.id ? {
          ...updatedAccount,
          balance: acc.balance, // รักษาค่า balance เดิม
          createdAt: acc.createdAt // รักษาค่า createdAt เดิม
        } : acc
      ));
      toast.success('อัปเดตข้อมูลบัญชีเรียบร้อยแล้ว');
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Search Header Card */}
      <Card className="border-0 shadow-lg overflow-hidden bg-white mb-8">
        <CardHeader className="bg-gradient-to-r from-blue-800 to-blue-600 text-white pb-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Search className="w-6 h-6 text-amber-300" />
                ค้นหาบัญชีลูกค้า
              </CardTitle>
              <CardDescription className="text-blue-100 mt-1">
                ค้นหาด้วยเลขบัญชี, ชื่อ-นามสกุล, หรือเลขบัตรประชาชน
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="-mt-6">
          <Card className="shadow-md border border-slate-200 bg-white">
             <CardContent className="p-4">
                <form onSubmit={handleSearch} className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="กรอกคำค้นหา..."
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      className="pl-10 h-12 text-lg border-slate-200 focus-visible:ring-blue-600 bg-slate-50/50"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-12 px-8 bg-blue-700 hover:bg-blue-800 text-white font-medium shadow-sm transition-all"
                    disabled={isLoading || !query.trim()}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span>กำลังค้นหา...</span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-2">
                        ค้นหา
                      </span>
                    )}
                  </Button>
                </form>
             </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && !error && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="p-2 bg-red-100 rounded-full">
             <AlertCircle className="w-6 h-6" />
          </div>
          <div>
             <h4 className="font-semibold">ไม่พบข้อมูล</h4>
             <p className="text-sm text-red-600/80">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State (Not Searched) */}
      {!isLoading && !error && !hasSearched && (
         <div className="text-center py-16 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
               <Search className="w-8 h-8 text-blue-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">พร้อมค้นหาแล้ว</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-1">เริ่มค้นหาโดยกรอกรายละเอียดลูกค้าที่ต้องการด้านบน</p>
         </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <Card className="border-0 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="pb-3 border-b border-slate-100 bg-white pt-6">
             <CardTitle className="text-lg font-medium text-slate-700 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                ผลการค้นหา ({results.length} รายการ)
             </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[180px] font-semibold text-slate-600">เลขบัญชี</TableHead>
                  <TableHead className="font-semibold text-slate-600">ข้อมูลลูกค้า</TableHead>
                  <TableHead className="font-semibold text-slate-600">ประเภท</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600">ยอดเงินคงเหลือ</TableHead>
                  <TableHead className="font-semibold text-slate-600">วันที่เปิดบัญชี</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((account) => (
                  <TableRow key={account.id} className="hover:bg-blue-50/30 group transition-colors">
                    <TableCell className="font-medium align-top py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block">{account.number}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-600"
                              onClick={() => copyToClipboard(account.number)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>คัดลอก</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-800 text-base">{account.prefix}{account.firstName} {account.lastName}</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Wallet className="w-3 h-3" />
                          <span>{account.accountName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                           <CreditCard className="w-3 h-3" />
                           <span>{account.cid}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-4">
                       <Badge variant="outline" className={`font-medium border px-2.5 py-0.5 rounded-full ${accountTypeMap[account.type as keyof typeof accountTypeMap]?.bg || 'bg-slate-100 text-slate-600'}`}>
                        {accountTypeMap[account.type as keyof typeof accountTypeMap]?.label || account.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right align-top py-4">
                       <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-800 text-base">
                            {Number(account.balance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">THB</span>
                       </div>
                    </TableCell>
                    <TableCell className="align-top py-4 text-slate-500 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(account.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-top py-4">
                      <Tooltip>
                           <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 w-9 p-0 border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 shadow-sm"
                                onClick={() => handleEditClick(account)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>แก้ไขข้อมูล</TooltipContent>
                        </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Edit Account Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[550px] gap-6">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl text-slate-800">
              <div className="p-2 bg-blue-100 rounded-lg">
                 <Edit className="w-5 h-5 text-blue-600" />
              </div>
              แก้ไขข้อมูลบัญชี
            </DialogTitle>
            <DialogDescription className="text-slate-500 mt-1.5 ml-1">
              แก้ไขข้อมูลส่วนตัวและประเภทบัญชี
            </DialogDescription>
          </DialogHeader>

          {currentAccount && (
            <div className="grid gap-5 py-2">
              {/* Account Number Display */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                 <span className="text-sm text-slate-500">เลขที่บัญชี</span>
                 <span className="font-mono font-bold text-slate-700 text-lg">{currentAccount.number}</span>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="accountType" className="text-slate-700 font-medium">ประเภทบัญชี</Label>
                <Select
                  value={currentAccount.type}
                  onValueChange={(value) => setCurrentAccount({ ...currentAccount, type: value })}
                >
                  <SelectTrigger className="h-10 border-slate-200 focus:ring-blue-500">
                    <SelectValue placeholder="เลือกประเภทบัญชี" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAVINGS">ออมทรัพย์</SelectItem>
                    <SelectItem value="FIXED">เงินฝากประจำ</SelectItem>
                    <SelectItem value="CURRENT">กระแสรายวัน</SelectItem>
                  </SelectContent>
                </Select>
              </div>

               <div className="grid gap-2">
                <Label htmlFor="cid" className="text-slate-700 font-medium">เลขบัตรประชาชน</Label>
                 <Input
                  id="cid"
                  value={currentAccount.cid}
                  onChange={(e) => setCurrentAccount({ ...currentAccount, cid: e.target.value })}
                  className="h-10 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4 grid gap-2">
                   <Label htmlFor="prefix" className="text-slate-700 font-medium">คำนำหน้า</Label>
                   <Input
                      id="prefix"
                      value={currentAccount.prefix}
                      onChange={(e) => setCurrentAccount({ ...currentAccount, prefix: e.target.value })}
                      className="h-10 border-slate-200 focus-visible:ring-blue-500"
                    />
                </div>
                <div className="col-span-8 grid gap-2">
                   <Label htmlFor="firstName" className="text-slate-700 font-medium">ชื่อจริง</Label>
                   <Input
                      id="firstName"
                      value={currentAccount.firstName}
                      onChange={(e) => setCurrentAccount({ ...currentAccount, firstName: e.target.value })}
                      className="h-10 border-slate-200 focus-visible:ring-blue-500"
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                   <Label htmlFor="lastName" className="text-slate-700 font-medium">นามสกุล</Label>
                   <Input
                      id="lastName"
                      value={currentAccount.lastName}
                      onChange={(e) => setCurrentAccount({ ...currentAccount, lastName: e.target.value })}
                      className="h-10 border-slate-200 focus-visible:ring-blue-500"
                    />
                </div>
                <div className="grid gap-2">
                   <Label htmlFor="accountName" className="text-slate-700 font-medium">ชื่อบัญชี</Label>
                   <Input
                      id="accountName"
                      value={currentAccount.accountName}
                      onChange={(e) => setCurrentAccount({ ...currentAccount, accountName: e.target.value })}
                      className="h-10 border-slate-200 focus-visible:ring-blue-500"
                    />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
              className="h-10"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="h-10 bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  กำลังบันทึก...
                </>
              ) : 'บันทึกการเปลี่ยนแปลง'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}