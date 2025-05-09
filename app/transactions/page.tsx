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
import { Search, Clock, Wallet, ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react"
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
  type: "DEPOSIT" | "WITHDRAW"
  createdAt: string
}

export default function TransactionPage() {
  const [acctNo, setAcctNo] = useState("")
  const [debouncedAcctNo] = useDebounce(acctNo, 5000) // Debounce input by 500ms
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
        running = tx.type === "DEPOSIT" ? running + amt : running - amt
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
    SAVINGS: { label: "ออมทรัพย์", color: "text-blue-600" },
    FIXED: { label: "เงินฝากประจำ", color: "text-emerald-600" },
    CURRENT: { label: "กระแสรายวัน", color: "text-purple-600" }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-3">
          <Wallet className="w-8 h-8" />
          <span>ทำรายการทางการเงิน</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          บริการฝาก-ถอนเงินและตรวจสอบยอดคงเหลือ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Transaction Form */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5" />
                <span>ค้นหาบัญชี</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="accountNumber">เลขที่บัญชี</Label>
                  <Input
                    id="accountNumber"
                    placeholder="เช่น 123-4-56789-0"
                    value={acctNo}
                    onChange={(e) => {
                      const value = e.target.value
                      // Allow only numbers and dashes
                      if (/^[0-9-]*$/.test(value)) {
                        setAcctNo(value)
                      }
                    }}
                    className="mt-1 text-base h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid grid-cols-2 w-full h-12">
              <TabsTrigger value="deposit" className="h-full">
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                ฝากเงิน
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="h-full">
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                ถอนเงิน
              </TabsTrigger>
            </TabsList>

            {["deposit", "withdraw"].map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {tab === "deposit" ? "ฝากเงินเข้าบัญชี" : "ถอนเงินจากบัญชี"}
                    </CardTitle>
                    <CardDescription>
                      {tab === "deposit"
                        ? "กรอกจำนวนเงินที่ต้องการฝาก"
                        : "กรอกจำนวนเงินที่ต้องการถอน"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        doTx(tab === "deposit" ? "DEPOSIT" : "WITHDRAW")
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor={`amount-${tab}`}>จำนวนเงิน (บาท)</Label>
                        <div className="relative">
                          <Input
                            id={`amount-${tab}`}
                            type="text"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => {
                              const value = e.target.value
                              // Allow only numbers and decimal point
                              if (/^[0-9]*\.?[0-9]*$/.test(value)) {
                                setAmount(value)
                              }
                            }}
                            placeholder="0.00"
                            className="mt-1 text-right text-lg h-12 pl-8"
                            required
                            disabled={!account}
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            ฿
                          </span>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-12 text-lg"
                        disabled={isLoading || !account || !amount || parseFloat(amount) <= 0}
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : null}
                        {isLoading
                          ? "กำลังดำเนินการ..."
                          : tab === "deposit"
                            ? "ยืนยันการฝากเงิน"
                            : "ยืนยันการถอนเงิน"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Right Column: Account Statement */}
        <div className="space-y-6">
          {isFetchingAccount ? (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>กำลังโหลดข้อมูลบัญชี</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-6 w-3/4 rounded-full" />
                <Skeleton className="h-6 w-1/2 rounded-full" />
                <Skeleton className="h-6 w-2/3 rounded-full" />
              </CardContent>
            </Card>
          ) : account ? (
            <>
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">รายละเอียดบัญชี</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">เลขที่บัญชี</span>
                    <span className="font-mono font-medium">{account.number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">ชื่อบัญชี</span>
                    <span className="font-medium">{account.accountName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">ประเภทบัญชี</span>
                    <Badge variant="outline" className={accountTypeMap[account.type].color}>
                      {accountTypeMap[account.type].label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-muted-foreground">ยอดคงเหลือ</span>
                    <span className="text-2xl font-bold text-primary">
                      {account.balance.toLocaleString()} บาท
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>ประวัติรายการ</span>
                  </CardTitle>
                  <CardDescription>
                    รายการล่าสุดจะแสดงด้านบนสุด
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {txWithBalance.length > 0 ? (
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-[160px]">วันที่/เวลา</TableHead>
                            <TableHead>ประเภท</TableHead>
                            <TableHead className="text-right">จำนวนเงิน</TableHead>
                            <TableHead className="text-right">คงเหลือ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {txWithBalance.map((tx) => (
                            <TableRow key={tx.id} className="hover:bg-muted/50">
                              <TableCell className="font-medium">
                                {new Date(tx.createdAt).toLocaleString("th-TH", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    tx.type === "DEPOSIT" ? "default" : "destructive"
                                  }
                                >
                                  {tx.type === "DEPOSIT" ? "ฝาก" : "ถอน"}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className={`text-right font-medium ${tx.type === "DEPOSIT"
                                  ? "text-green-600"
                                  : "text-red-600"
                                  }`}
                              >
                                {tx.type === "DEPOSIT" ? "+" : "-"}
                                {tx.amount.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {tx.balance.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-muted-foreground mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mx-auto h-12 w-12 opacity-50"
                        >
                          <line x1="12" x2="12" y1="2" y2="22" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium">ไม่มีประวัติรายการ</h3>
                      <p className="text-sm text-muted-foreground">
                        ยังไม่มีการทำรายการสำหรับบัญชีนี้
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">ข้อมูลบัญชี</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-muted-foreground mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mx-auto h-12 w-12 opacity-50"
                    >
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <line x1="2" x2="22" y1="10" y2="10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium">กรอกเลขที่บัญชี</h3>
                  <p className="text-sm text-muted-foreground">
                    กรุณากรอกเลขที่บัญชีเพื่อดูข้อมูลและทำรายการ
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  )
}