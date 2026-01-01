// app/transactions/page.tsx
"use client"
import { useState, useEffect, useMemo, useCallback } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Clock, Wallet, ArrowDownCircle, ArrowUpCircle, Loader2, AlertCircle, Banknote, CreditCard, History } from "lucide-react"
import { useDebounce } from "use-debounce"

type Account = {
  number: string
  accountName: string
  type: "SAVINGS" | "FIXED" | "CURRENT"
  balance: number
}

type Tx = {
  id: string
  amount: number
  type: "DEPOSIT" | "WITHDRAW" | "INTEREST"
  createdAt: string
}

export default function TransactionPage() {
  const [acctNo, setAcctNo] = useState("")
  const [debouncedAcctNo] = useDebounce(acctNo, 500) // Debounce input by 500ms
  const [account, setAccount] = useState<Account | null>(null)
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [txList, setTxList] = useState<Tx[]>([])
  const [isFetchingAccount, setIsFetchingAccount] = useState(false)

  // Fetch account data with debounce
  const fetchAccountData = useCallback(async (accountNumber: string) => {
    if (!accountNumber) {
      setAccount(null)
      setTxList([])
      return
    }

    setIsFetchingAccount(true)
    try {
      const res = await api.get("/transactions", { params: { accountNumber } })
      setAccount(res.data.account)
      setTxList(res.data.transactions)
    } catch (err) {
      toast.error("ไม่พบข้อมูลบัญชี", {
        description: "กรุณาตรวจสอบเลขที่บัญชีอีกครั้ง"
      })
      setAccount(null)
      setTxList([])
    } finally {
      setIsFetchingAccount(false)
    }
  }, [])

  useEffect(() => {
    fetchAccountData(debouncedAcctNo)
  }, [debouncedAcctNo, fetchAccountData])

  // Calculate running balance
  const txWithBalance = useMemo(() => {
    let running = 0
    return [...txList]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map(tx => {
        const amt = Number(tx.amount)
         if (tx.type === "DEPOSIT" || tx.type === "INTEREST") {
            running += amt
        } else {
            running -= amt
        }
        return {
          ...tx,
          balance: running,
        }
      })
      .reverse()
  }, [txList])

  const doTx = async (type: "DEPOSIT" | "WITHDRAW") => {
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("กรุณากรอกจำนวนเงินให้ถูกต้อง")
      return
    }

    setIsLoading(true)
    try {
      const res = await api.post("/transactions", {
        accountNumber: acctNo,
        amount: numericAmount,
        type: type.toUpperCase(),
      })
      const { balance, transaction } = res.data
      toast.success(
        <div className="flex items-start gap-3">
          {type === "DEPOSIT" ? (
            <ArrowDownCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          ) : (
            <ArrowUpCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className="font-medium">
              {type === "DEPOSIT" ? "ฝากเงินสำเร็จ" : "ถอนเงินสำเร็จ"}
            </p>
            <p className="text-sm">ยอดคงเหลือใหม่: {balance.toLocaleString()} บาท</p>
          </div>
        </div>
      )
      setAccount(prev => prev && { ...prev, balance })
      setTxList(prev => [transaction, ...prev])
      setAmount("")
    } catch (err: any) {
      const msg = err.response?.data?.error || "เกิดข้อผิดพลาด"
      toast.error(
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">
              {type === "DEPOSIT" ? "ฝากเงินไม่สำเร็จ" : "ถอนเงินไม่สำเร็จ"}
            </p>
            <p className="text-sm">{msg}</p>
          </div>
        </div>
      )
    } finally {
      setIsLoading(false)
    }
  }

  const accountTypeMap = {
    SAVINGS: { label: "ออมทรัพย์", color: "text-blue-600", bg: "bg-blue-50" },
    FIXED: { label: "เงินฝากประจำ", color: "text-emerald-600", bg: "bg-emerald-50" },
    CURRENT: { label: "กระแสรายวัน", color: "text-purple-600", bg: "bg-purple-50" }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-12 px-4 shadow-lg mb-8">
         <div className="max-w-7xl mx-auto flex items-center gap-6">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl shadow-inner border border-white/20">
               <Wallet className="w-10 h-10 text-blue-100" />
            </div>
            <div>
               <h1 className="text-3xl font-bold tracking-tight">ทำรายการทางการเงิน</h1>
               <p className="text-blue-100 mt-2 text-lg opacity-90">
                 ระบบฝาก-ถอนเงินสด และตรวจสอบยอดเงินในบัญชี
               </p>
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Transaction Interface (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Account Search Card */}
          <Card className="border-0 shadow-md overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                <Search className="w-5 h-5 text-blue-600" />
                <span>ค้นหาบัญชีสมาชิก</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="relative">
                <Label htmlFor="accountNumber" className="sr-only">เลขที่บัญชี</Label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    id="accountNumber"
                    placeholder="ระบุเลขที่บัญชี (เช่น 001-0-00001-1)"
                    value={acctNo}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^[0-9-]*$/.test(value)) {
                        setAcctNo(value)
                      }
                    }}
                    className="pl-12 text-lg h-14 border-slate-200 focus:border-blue-500 focus:ring-blue-500 shadow-sm transition-all"
                    autoComplete="off"
                  />
                </div>
                {!account && !isFetchingAccount && acctNo.length > 0 && (
                   <p className="text-sm text-slate-400 mt-2 pl-2">กำลังค้นหา...</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transaction Tabs */}
          <Card className="border-0 shadow-md bg-white overflow-hidden min-h-[400px]">
             <Tabs defaultValue="deposit" className="w-full">
               <div className="bg-slate-50 border-b p-1">
                  <TabsList className="grid grid-cols-2 w-full h-14 p-1 bg-slate-200/50 rounded-lg gap-2">
                    <TabsTrigger 
                      value="deposit" 
                      className="h-full data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all rounded-md text-slate-600"
                    >
                      <div className="flex items-center gap-2">
                         <div className="p-1 rounded-full bg-white/20">
                           <ArrowDownCircle className="w-5 h-5" />
                         </div>
                         <span className="text-base font-semibold">ฝากเงิน</span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="withdraw" 
                      className="h-full data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all rounded-md text-slate-600"
                    >
                       <div className="flex items-center gap-2">
                         <div className="p-1 rounded-full bg-white/20">
                           <ArrowUpCircle className="w-5 h-5" />
                         </div>
                         <span className="text-base font-semibold">ถอนเงิน</span>
                      </div>
                    </TabsTrigger>
                  </TabsList>
               </div>

                {["deposit", "withdraw"].map((tab) => (
                  <TabsContent key={tab} value={tab} className="mt-0 p-8 outline-none">
                     <div className="flex flex-col items-center justify-center space-y-8 max-w-md mx-auto py-4">
                        <div className={`p-4 rounded-full bg-slate-50 border-4 border-white shadow-lg ${
                            tab === "deposit" ? "text-emerald-500" : "text-rose-500"
                        }`}>
                           <Banknote className="w-12 h-12" />
                        </div>
                        
                        <div className="text-center space-y-1">
                           <h2 className="text-2xl font-bold text-slate-800">
                              {tab === "deposit" ? "ฝากเงินเข้าบัญชี" : "ถอนเงินจากบัญชี"}
                           </h2>
                           <p className="text-slate-500">
                             {tab === "deposit" 
                              ? "ระบุจำนวนเงินที่ต้องการฝากเข้า" 
                              : "ระบุจำนวนเงินที่ต้องการถอนออก"}
                           </p>
                        </div>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            doTx(tab === "deposit" ? "DEPOSIT" : "WITHDRAW")
                          }}
                          className="w-full space-y-6"
                        >
                          <div className="space-y-3">
                            <Label htmlFor={`amount-${tab}`} className="text-base font-medium text-slate-700">จำนวนเงิน (บาท)</Label>
                            <div className="relative group">
                              <Input
                                id={`amount-${tab}`}
                                type="text"
                                inputMode="decimal"
                                value={amount}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (/^[0-9]*\.?[0-9]*$/.test(value)) {
                                    setAmount(value)
                                  }
                                }}
                                placeholder="0.00"
                                className="text-right text-3xl font-bold h-20 pl-12 pr-6 shadow-sm border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-xl"
                                required
                                disabled={!account}
                                autoComplete="off"
                              />
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-2xl group-focus-within:text-blue-500 transition-colors">
                                ฿
                              </span>
                            </div>
                          </div>

                          <Button
                            type="submit"
                            className={`w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl ${
                                tab === "deposit" 
                                ? "bg-emerald-600 hover:bg-emerald-700" 
                                : "bg-rose-600 hover:bg-rose-700"
                            }`}
                            disabled={isLoading || !account || !amount || parseFloat(amount) <= 0}
                          >
                            {isLoading ? (
                              <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                            ) : (
                               tab === "deposit" ? <ArrowDownCircle className="w-6 h-6 mr-2" /> : <ArrowUpCircle className="w-6 h-6 mr-2" />
                            )}
                            {isLoading
                              ? "กำลังดำเนินการ..."
                              : tab === "deposit"
                                ? "ยืนยันการฝากเงิน"
                                : "ยืนยันการถอนเงิน"}
                          </Button>
                        </form>
                     </div>
                  </TabsContent>
                ))}
             </Tabs>
          </Card>
        </div>

        {/* Right Column: Account Info & History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {isFetchingAccount ? (
            <Card className="border-0 shadow-md">
              <CardContent className="p-8 flex flex-col items-center justify-center space-y-4">
                 <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                 <p className="text-slate-500 font-medium">กำลังโหลดข้อมูลบัญชี...</p>
              </CardContent>
            </Card>
          ) : account ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              {/* Account Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                 <div className="absolute bottom-0 left-0 p-24 bg-emerald-500/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>
                 
                 <CardHeader className="pb-2 border-b border-white/10 relative z-10">
                    <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">บัญชีสมาชิก</CardTitle>
                 </CardHeader>
                 <CardContent className="pt-6 relative z-10">
                    <div className="space-y-6">
                       <div>
                          <p className="text-3xl font-bold font-mono tracking-widest">{account.number}</p>
                          <p className="text-slate-300 mt-1 text-lg">{account.accountName}</p>
                       </div>
                       
                       <div className="flex items-end justify-between">
                          <div>
                             <p className="text-xs text-slate-400 mb-1">ยอดเงินคงเหลือ</p>
                             <p className="text-4xl font-bold text-emerald-400">฿{account.balance.toLocaleString()}</p>
                          </div>
                          <Badge className={`${accountTypeMap[account.type].bg} ${accountTypeMap[account.type].color} border-0 px-3 py-1 text-xs font-bold`}>
                             {accountTypeMap[account.type].label}
                          </Badge>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              {/* History Card */}
              <Card className="border-0 shadow-md bg-white overflow-hidden flex flex-col h-[500px]">
                <CardHeader className="bg-slate-50 border-b py-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
                    <History className="w-5 h-5 text-blue-600" />
                    <span>ประวัติรายการล่าสุด</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-auto">
                  {txWithBalance.length > 0 ? (
                    <Table>
                      <TableHeader className="bg-slate-50 sticky top-0 z-10">
                        <TableRow className="border-slate-100">
                          <TableHead className="w-[140px] text-xs font-semibold text-slate-500">วันที่ / เวลา</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500">รายการ</TableHead>
                          <TableHead className="text-right text-xs font-semibold text-slate-500">จำนวนเงิน</TableHead>
                          <TableHead className="text-right text-xs font-semibold text-slate-500">คงเหลือ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {txWithBalance.map((tx) => (
                          <TableRow key={tx.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <TableCell className="text-xs text-slate-500 font-medium">
                              <div className="flex flex-col">
                                <span>{new Date(tx.createdAt).toLocaleDateString("th-TH", { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                                <span className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`border-0 font-bold px-2 py-0.5 text-[10px] ${
                                  tx.type === "DEPOSIT" 
                                    ? "bg-green-50 text-green-700" 
                                    : tx.type === "WITHDRAW"
                                      ? "bg-red-50 text-red-700" 
                                      : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {tx.type === "DEPOSIT" 
                                  ? "ฝาก" 
                                  : tx.type === "WITHDRAW"
                                    ? "ถอน"
                                    : "ดอกเบี้ย"}
                              </Badge>
                            </TableCell>
                            <TableCell
                              className={`text-right font-bold tabular-nums ${
                                tx.type === "DEPOSIT" || tx.type === "INTEREST"
                                ? "text-green-600"
                                : "text-red-600"
                                }`}
                            >
                              {tx.type === "DEPOSIT" || tx.type === "INTEREST" ? "+" : "-"}
                              {tx.amount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-slate-600 font-medium tabular-nums">
                              {tx.balance.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 p-6">
                      <Clock className="w-12 h-12 opacity-20" />
                      <p className="text-sm">ไม่มีประวัติรายการ</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            // Empty State
            <Card className="border-2 border-dashed border-slate-200 shadow-none bg-slate-50/50 h-full min-h-[400px] flex items-center justify-center">
               <div className="text-center space-y-4 max-w-xs mx-auto p-6">
                  <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                     <Search className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700">รอการระบุบัญชี</h3>
                  <p className="text-slate-500 text-sm">
                    กรุณากรอกเลขที่บัญชีทางด้านซ้ายเพื่อดูรายละเอียดและทำรายการ
                  </p>
               </div>
            </Card>
          )}
        </div>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  )
}