// app/print-passbook/page.tsx
"use client";
import { useState } from "react";
import { Printer, CreditCard, FileText, Search, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

export default function PrintPassbook() {
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePrint = async (apiEndpoint: string) => {
    if (!accountNumber) {
      setError("กรุณาระบุหมายเลขบัญชี");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error("ไม่สามารถเปิดหน้าต่างพิมพ์ได้ (Popup blocked)");
      }

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "เกิดข้อผิดพลาด");
      }

      const html = await response.text();
      printWindow.document.write(html);
      printWindow.document.close();

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error("Print error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintAccount = () => handlePrint("/api/pass-book-account");
  const handlePrintTransactions = () => handlePrint("/api/pass-book-trans");

  return (
    <div className="min-h-screen bg-neutral-50 pt-20 px-4 pb-8">
      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4">
        
        {/* Main Action Card */}
        <div className="md:col-span-3">
          <Card className="shadow-lg border-blue-100 h-full">
            <CardHeader className="bg-gradient-to-r from-blue-800 to-blue-600 text-white rounded-t-xl py-4">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Printer className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <CardTitle className="text-lg">ระบบพิมพ์สมุดคู่ฝาก</CardTitle>
                  <CardDescription className="text-blue-100 text-xs">
                    Passbook Printing System
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <Label htmlFor="account-number" className="text-sm font-semibold text-blue-900">
                  ระบุเลขที่บัญชี
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 w-4 h-4" />
                  <Input 
                    id="account-number"
                    placeholder="เช่น 123-456-7890" 
                    className="pl-9 h-11 text-base border-blue-200 focus-visible:ring-blue-600 bg-blue-50/50"
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value);
                      if (error) setError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePrintTransactions();
                    }}
                  />
                </div>
                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-sm font-semibold">ข้อผิดพลาด</AlertTitle>
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={handlePrintAccount}
                  disabled={loading}
                  className="h-12 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-900 justify-start px-3 gap-2 group"
                >
                  <div className="p-1.5 bg-blue-100 rounded-full text-blue-600 group-hover:bg-blue-200 transition-colors">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="text-left leading-tight">
                    <div className="font-semibold text-sm">พิมพ์หน้าปก</div>
                    <div className="text-[10px] text-blue-600/80 font-normal">ข้อมูลบัญชี</div>
                  </div>
                </Button>

                <Button 
                  size="lg"
                  onClick={handlePrintTransactions}
                  disabled={loading}
                  className="h-12 bg-blue-700 hover:bg-blue-800 justify-start px-3 gap-2 shadow-md shadow-blue-900/10"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <div className="p-1.5 bg-white/20 rounded-full text-white">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}
                  <div className="text-left leading-tight">
                    <div className="font-semibold text-white text-sm">พิมพ์รายการ</div>
                    <div className="text-[10px] text-blue-100 font-normal">อัปเดตยอด</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info / Preview Card */}
        <div className="md:col-span-2 space-y-3">
            <Card className="shadow-md border-blue-100 bg-white">
              <CardHeader className="pb-2 border-b border-blue-50 py-3">
                <CardTitle className="text-xs font-medium text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    คำแนะนำการใช้งาน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-3">
                <div className="flex gap-2.5 text-xs text-slate-600">
                  <div className="min-w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-[10px] mt-0.5">
                    1
                  </div>
                  <p>ใส่สมุดให้ชิดขอบซ้าย และบรรทัดบนสุดเสมอ</p>
                </div>
                <div className="flex gap-2.5 text-xs text-slate-600">
                   <div className="min-w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-[10px] mt-0.5">
                    2
                  </div>
                  <p>ตรวจสอบความถูกต้องก่อนกด <span className="font-semibold text-green-600">"พิมพ์สำเร็จ"</span> ในหน้ายืนยัน</p>
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50/50 rounded-xl p-4 border-2 border-dashed border-blue-200">
                <div className="text-center space-y-2">
                    <div className="mx-auto w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-blue-100">
                        <Printer className="w-5 h-5 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-900 font-medium">พร้อมใช้งาน</p>
                      <p className="text-[10px] text-blue-400">ระบุเลขบัญชีเพื่อเริ่มพิมพ์</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}