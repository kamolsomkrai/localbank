// app/interest/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  DollarSign, Loader2, Settings, Percent, AlertTriangle, 
  PiggyBank, Briefcase, Calculator, CalendarClock, CheckCircle2,
  Wrench, Play, RefreshCw, Archive, ArrowRight
} from "lucide-react";
import { api } from "@/lib/api";

interface InterestRate {
  id: string;
  accountType: "SAVINGS" | "FIXED" | "CURRENT";
  rate: number;
  updatedAt: string;
}

interface CorrectionLog {
    periodIdentifier: string;
    type: string;
    executedAt: string;
}

interface PreviewResult {
    targetRate: number;
    affectedCount: number;
    totalOldInterest: number;
    totalNewInterest: number;
    netChange: number;
    previewItems: any[];
}

export default function InterestPage() {
  const [isSavingsLoading, setIsSavingsLoading] = useState(false);
  const [isFixedLoading, setIsFixedLoading] = useState(false);
  const [rates, setRates] = useState<InterestRate[]>([]);
  const [savingsRate, setSavingsRate] = useState("");
  const [fixedRate, setFixedRate] = useState("");
  const [isSavingRates, setIsSavingRates] = useState(false);
  
  // Late calculation states
  const [lateCalculationConfirmed, setLateCalculationConfirmed] = useState(false);
  const isDecember = new Date().getMonth() === 11;
  const previousYear = new Date().getFullYear() - 1;

  // Correction states
  const [correctionLogs, setCorrectionLogs] = useState<CorrectionLog[]>([]);
  const [selectedLog, setSelectedLog] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [isExecutingCorrection, setIsExecutingCorrection] = useState(false);

  // Fetch current rates on mount
  useEffect(() => {
    fetchRates();
    fetchCorrectionLogs();
  }, []);

  const fetchRates = async () => {
    try {
      const { data } = await api.get("/interest-rates");
      setRates(data);
      
      // Set form values
      const savings = data.find((r: InterestRate) => r.accountType === "SAVINGS");
      const fixed = data.find((r: InterestRate) => r.accountType === "FIXED");
      if (savings) setSavingsRate((savings.rate * 100).toFixed(2));
      if (fixed) setFixedRate((fixed.rate * 100).toFixed(2));
    } catch (error) {
      console.error("Failed to fetch rates:", error);
    }
  };

  const fetchCorrectionLogs = async () => {
    try {
        const { data } = await api.get("/interest/correction/options");
        setCorrectionLogs(data);
    } catch (error) {
        console.error("Failed to fetch logs:", error);
    }
  };

  const handleCalculate = async (type: "savings" | "fixed") => {
    const isLoading = type === "savings" ? isSavingsLoading : isFixedLoading;
    if (isLoading) return;

    // Check if late calculation is required
    if (!isDecember && !lateCalculationConfirmed) {
      toast.error("กรุณายืนยันการคำนวณย้อนหลัง", {
        description: "กรุณาติ๊กช่องยืนยันการคำนวณดอกเบี้ยย้อนหลังก่อน",
      });
      return;
    }

    const yearText = isDecember ? new Date().getFullYear() : previousYear;
    const confirmed = window.confirm(
      `คุณต้องการคำนวณดอกเบี้ยสำหรับบัญชีประเภท '${type}' ปี ${yearText} ใช่หรือไม่?\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`
    );

    if (!confirmed) return;

    if (type === "savings") setIsSavingsLoading(true);
    else setIsFixedLoading(true);

    try {
      const body: any = { type };
      if (!isDecember) {
        body.lateCalculation = true;
        body.targetYear = previousYear;
      }

      const { data: result } = await api.post("/interest", body);

      toast.success(result.message, {
        description: `มีผล ${result.accountsAffected} บัญชี, ยอดรวม ${result.totalInterestPaid.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`,
      });
      fetchCorrectionLogs();

    } catch (error: any) {
      toast.error("ดำเนินการไม่สำเร็จ", {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      if (type === "savings") setIsSavingsLoading(false);
      else setIsFixedLoading(false);
    }
  };

  const handleSaveRate = async (accountType: "SAVINGS" | "FIXED", ratePercent: string) => {
    const rate = parseFloat(ratePercent) / 100;
    
    if (isNaN(rate) || rate < 0 || rate > 1) {
      toast.error("อัตราดอกเบี้ยไม่ถูกต้อง", {
        description: "กรุณาระบุค่าระหว่าง 0-100%",
      });
      return;
    }

    setIsSavingRates(true);
    try {
      await api.post("/interest-rates", { accountType, rate });

      toast.success("บันทึกสำเร็จ", {
        description: `อัตราดอกเบี้ย${accountType === "SAVINGS" ? "ออมทรัพย์" : "ประจำ"}: ${formatThaiRate(parseFloat(ratePercent))}`,
      });
      
      fetchRates();
    } catch (error: any) {
      toast.error("บันทึกไม่สำเร็จ", {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setIsSavingRates(false);
    }
  };
  
  const handleSimulateCorrection = async () => {
      if (!selectedLog) {
          toast.error("กรุณาเลือกรอบการคำนวณ");
          return;
      }
      setIsPreviewLoading(true);
      try {
          const { data } = await api.post("/interest/correction/preview", { periodIdentifier: selectedLog });
          setPreviewResult(data);
          toast.success("จำลองการคำนวณสำเร็จ");
      } catch (error: any) {
          toast.error("เกิดข้อผิดพลาด", { description: error.response?.data?.error });
      } finally {
          setIsPreviewLoading(false);
      }
  };

  const handleExecuteCorrection = async () => {
      if (!selectedLog || !previewResult) return;
      if (!window.confirm("คำเตือน: นี่คือการแก้ไขฐานข้อมูลจริง (History Rewrite)\n\nรายการธุรกรรมเดิมจะถูกเขียนทับ และยอดเงินในบัญชีลูกค้าจะเปลี่ยนแปลงทันที\nยืนยันที่จะทำต่อหรือไม่?")) return;

      setIsExecutingCorrection(true);
      try {
          const { data } = await api.post("/interest/correction/execute", { periodIdentifier: selectedLog });
          toast.success("แก้ไขข้อมูลสำเร็จ", { description: data.message });
          setPreviewResult(null);
          setSelectedLog("");
      } catch (error: any) {
          toast.error("เกิดข้อผิดพลาด", { description: error.response?.data?.error });
      } finally {
          setIsExecutingCorrection(false);
      }
  };

  const formatThaiRate = (ratePercent: number) => {
    const baht = Math.floor(ratePercent);
    const satang = Math.round((ratePercent - baht) * 100);
    
    if (satang === 0) {
      return `ร้อยละ ${baht} บาท`;
    } else if (baht === 0) {
      return `ร้อยละ ${satang} สตางค์`;
    } else {
      return `ร้อยละ ${baht} บาท ${satang} สตางค์`;
    }
  };

  const getCurrentRateDisplay = (type: "SAVINGS" | "FIXED") => {
    const rateObj = rates.find(r => r.accountType === type);
    if (!rateObj) return "ไม่ได้ตั้งค่า";
    
    const ratePercent = rateObj.rate * 100;
    // Format to 2 decimal places for number display
    const formattedNum = ratePercent.toFixed(2) + "%";
    // Thai text format
    const thaiText = formatThaiRate(ratePercent);
    
    return `${thaiText} (${formattedNum}) ต่อปี`;
  };

  // Helper for input placeholder or small display
  const getRateValue = (type: "SAVINGS" | "FIXED") => {
     const rateObj = rates.find(r => r.accountType === type);
     if (!rateObj) return "0.00";
     return (rateObj.rate * 100).toFixed(2);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Card className="border-0 shadow-lg overflow-hidden bg-white mb-6">
        <CardHeader className="bg-gradient-to-r from-blue-800 to-blue-600 text-white pb-8 pt-8 px-8">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                 <Calculator className="w-8 h-8 text-amber-300" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  การจัดการดอกเบี้ย
                </CardTitle>
                <CardDescription className="text-blue-100 mt-1">
                  คำนวณและจ่ายดอกเบี้ยประจำปี, ปรับเปลี่ยนอัตราดอกเบี้ย
                </CardDescription>
              </div>
           </div>
        </CardHeader>
        
        <CardContent className="grid gap-6 p-6">
          <Tabs defaultValue="savings" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-12 bg-slate-100 p-1 mb-6">
              <TabsTrigger value="savings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-base flex items-center gap-2">
                 <PiggyBank className="w-4 h-4 text-emerald-600" /> ออมทรัพย์
              </TabsTrigger>
              <TabsTrigger value="fixed" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-base flex items-center gap-2">
                 <Briefcase className="w-4 h-4 text-amber-600" /> ฝากประจำ
              </TabsTrigger>
               <TabsTrigger value="correction" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-base flex items-center gap-2">
                 <Wrench className="w-4 h-4 text-rose-600" /> แก้ไขระบบ
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-base flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-600" />
                ตั้งค่า
              </TabsTrigger>
            </TabsList>

            {/* Savings Content */}
            <TabsContent value="savings" className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
               <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <Card className="border-slate-200">
                      <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-4">
                        <CardTitle className="text-emerald-800 flex items-center gap-2">
                           <PiggyBank className="w-5 h-5" /> คำนวณดอกเบี้ยออมทรัพย์
                        </CardTitle>
                        <CardDescription>จ่ายปีละ 1 ครั้ง (สิ้นเดือนธันวาคม)</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-6">
                        {/* Late calculation warning */}
                        {!isDecember && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2 text-amber-700 font-semibold">
                              <CalendarClock className="w-5 h-5" />
                              <span>โหมดคำนวณย้อนหลัง</span>
                            </div>
                            <p className="text-sm text-amber-600 leading-relaxed">
                              ขณะนี้ไม่ใช่เดือนธันวาคม ระบบจะทำการคำนวณดอกเบี้ยย้อนหลังสำหรับปี <strong>{previousYear}</strong> (คิดยอดคงเหลือ ณ วันที่ 31 ธ.ค. {previousYear})
                            </p>
                            <div className="flex items-start space-x-3 pt-2 bg-white/50 p-3 rounded border border-amber-100">
                              <Checkbox
                                id="late-savings"
                                checked={lateCalculationConfirmed}
                                onCheckedChange={(checked) => setLateCalculationConfirmed(checked === true)}
                                className="mt-1 border-amber-400 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                              />
                              <label
                                htmlFor="late-savings"
                                className="text-sm font-medium leading-tight cursor-pointer text-amber-900"
                              >
                                ยืนยันการดำเนินการคำนวณย้อนหลัง
                              </label>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col gap-3">
                           <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500">อัตราดอกเบี้ยปัจจุบัน</span>
                              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                                {getCurrentRateDisplay("SAVINGS")}
                              </span>
                           </div>
                           <Button
                              onClick={() => handleCalculate("savings")}
                              disabled={isSavingsLoading}
                              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-lg shadow-md transition-all hover:shadow-lg"
                            >
                              {isSavingsLoading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> กำลังประมวลผล...</>
                              ) : "คำนวณและจ่ายดอกเบี้ย"}
                            </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Info Card */}
                  <div className="space-y-4">
                     <Card className="bg-slate-50 border-slate-200 h-full">
                        <CardHeader className="pb-2">
                           <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">เงื่อนไข</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-slate-600 space-y-3">
                           <p className="flex gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              คิดจากยอดคงเหลือต่ำสุดในแต่ละเดือน (หรือยอด ณ สิ้นวัน)
                           </p>
                           <p className="flex gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              เข้าบัญชีอัตโนมัติเป็นรายการฝาก (INTEREST)
                           </p>
                        </CardContent>
                     </Card>
                  </div>
               </div>
            </TabsContent>

            {/* Fixed Content */}
            <TabsContent value="fixed" className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
               <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <Card className="border-slate-200">
                      <CardHeader className="bg-amber-50/50 border-b border-amber-100 pb-4">
                        <CardTitle className="text-amber-800 flex items-center gap-2">
                           <Briefcase className="w-5 h-5" /> คำนวณดอกเบี้ยฝากประจำ
                        </CardTitle>
                        <CardDescription>จ่ายปีละ 1 ครั้ง (เงื่อนไขตามระยะเวลาฝาก)</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-6">
                        {/* Late calculation warning */}
                        {!isDecember && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2 text-amber-700 font-semibold">
                              <CalendarClock className="w-5 h-5" />
                              <span>โหมดคำนวณย้อนหลัง</span>
                            </div>
                            <p className="text-sm text-amber-600 leading-relaxed">
                              ขณะนี้ไม่ใช่เดือนธันวาคม ระบบจะทำการคำนวณดอกเบี้ยย้อนหลังสำหรับปี <strong>{previousYear}</strong>
                            </p>
                            <div className="flex items-start space-x-3 pt-2 bg-white/50 p-3 rounded border border-amber-100">
                              <Checkbox
                                id="late-fixed"
                                checked={lateCalculationConfirmed}
                                onCheckedChange={(checked) => setLateCalculationConfirmed(checked === true)}
                                className="mt-1 border-amber-400 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                              />
                              <label
                                htmlFor="late-fixed"
                                className="text-sm font-medium leading-tight cursor-pointer text-amber-900"
                              >
                                ยืนยันการดำเนินการคำนวณย้อนหลัง
                              </label>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col gap-3">
                           <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500">อัตราดอกเบี้ยปัจจุบัน</span>
                              <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                {getCurrentRateDisplay("FIXED")}
                              </span>
                           </div>
                           <Button
                              onClick={() => handleCalculate("fixed")}
                              disabled={isFixedLoading}
                              className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-lg shadow-md transition-all hover:shadow-lg"
                            >
                              {isFixedLoading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> กำลังประมวลผล...</>
                              ) : "คำนวณและจ่ายดอกเบี้ย"}
                            </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Info Card */}
                  <div className="space-y-4">
                     <Card className="bg-slate-50 border-slate-200 h-full">
                        <CardHeader className="pb-2">
                           <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">เงื่อนไข</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-slate-600 space-y-3">
                           <p className="flex gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              เงื่อนไขการถอนภายในช่วงเวลาที่กำหนด
                           </p>
                           <p className="flex gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              คำนวณตามเงินต้นคงเหลือ
                           </p>
                        </CardContent>
                     </Card>
                  </div>
               </div>
            </TabsContent>
            
            {/* Correction Content (New) */}
            <TabsContent value="correction" className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
               <Card className="border-rose-100 shadow-md">
                   <CardHeader className="bg-rose-50 border-b border-rose-100 pb-4">
                       <CardTitle className="text-rose-800 flex items-center gap-2">
                           <Wrench className="w-5 h-5" /> แก้ไขทั้งระบบ (Limitless Correction)
                       </CardTitle>
                       <CardDescription className="text-rose-600">
                           ทำรายการคำนวณใหม่และปรับปรุงฐานข้อมูลย้อนหลัง (History Rewrite)
                       </CardDescription>
                   </CardHeader>
                   <CardContent className="p-6 space-y-6">
                       <div className="grid md:grid-cols-2 gap-8 items-start">
                           <div className="space-y-4">
                               <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
                                   <div className="space-y-2">
                                       <Label className="text-slate-700">เลือกรอบการคำนวณ (Event)</Label>
                                       <Select value={selectedLog} onValueChange={setSelectedLog}>
                                           <SelectTrigger>
                                               <SelectValue placeholder="-- กรุณาเลือก --" />
                                           </SelectTrigger>
                                           <SelectContent>
                                               {correctionLogs.map(log => (
                                                   <SelectItem key={log.periodIdentifier} value={log.periodIdentifier}>
                                                       {log.periodIdentifier} (Run at: {new Date(log.executedAt).toLocaleDateString("th-TH")})
                                                   </SelectItem>
                                               ))}
                                           </SelectContent>
                                       </Select>
                                       <p className="text-xs text-slate-400">ระบบจะแสดงรายการที่เคยคำนวณสำเร็จแล้วเท่านั้น</p>
                                   </div>

                                   {selectedLog && (
                                       <div className="bg-blue-50 p-3 rounded border border-blue-100 text-sm text-blue-800">
                                           <p className="font-semibold mb-1">สถานะปัจจุบัน:</p>
                                           <ul className="list-disc list-inside space-y-1">
                                               <li>ประเภทบัญชี: {selectedLog.split("-")[1]}</li>
                                               <li>อัตราดอกเบี้ยที่จะใช้คำนวณใหม่: <span className="font-bold text-lg">{getRateValue(selectedLog.split("-")[1] as any)}%</span></li>
                                           </ul>
                                           <p className="text-xs mt-2 text-blue-600">* อ้างอิงจากค่าที่ตั้งในหน้า Settings ปัจจุบัน</p>
                                       </div>
                                   )}

                                   <Button 
                                       onClick={handleSimulateCorrection}
                                       disabled={!selectedLog || isPreviewLoading}
                                       className="w-full bg-slate-800 hover:bg-slate-900"
                                   >
                                       {isPreviewLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                       จำลองการคำนวณ (Simulate)
                                   </Button>
                               </div>
                           </div>

                           <div className="space-y-4">
                               {previewResult ? (
                                   <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                       <div className="bg-slate-200 p-3 font-semibold text-slate-700 flex justify-between items-center">
                                           <span>ผลการจำลอง</span>
                                           <span className="text-xs bg-slate-300 px-2 py-0.5 rounded text-slate-800">Target Rate: {(previewResult.targetRate * 100).toFixed(2)}%</span>
                                       </div>
                                       <div className="p-4 space-y-3">
                                           <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                                               <span className="text-slate-500">จำนวนบัญชีที่กระทบ</span>
                                               <span className="font-mono font-bold">{previewResult.affectedCount}</span>
                                           </div>
                                            <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                                               <span className="text-slate-500">ยอดดอกเบี้ยเดิม (รวม)</span>
                                               <span className="font-mono">{previewResult.totalOldInterest.toLocaleString()}</span>
                                           </div>
                                            <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                                               <span className="text-slate-500">ยอดดอกเบี้ยใหม่ (รวม)</span>
                                               <span className="font-mono font-bold text-blue-600">{previewResult.totalNewInterest.toLocaleString()}</span>
                                           </div>
                                           <div className="flex justify-between items-center pt-2">
                                               <span className="font-semibold text-slate-700">ผลต่างสุทธิ (Net Impact)</span>
                                               <span className={`font-mono font-bold text-lg ${previewResult.netChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                                   {previewResult.netChange > 0 ? "+" : ""}{previewResult.netChange.toLocaleString()} บาท
                                               </span>
                                           </div>
                                       </div>
                                       <div className="p-4 bg-slate-100 border-t border-slate-200">
                                            <Button 
                                                variant="destructive" 
                                                className="w-full"
                                                onClick={handleExecuteCorrection}
                                                disabled={isExecutingCorrection}
                                            >
                                                {isExecutingCorrection ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                                ยืนยันการแก้ไขข้อมูลจริง (Execute)
                                            </Button>
                                            <p className="text-[10px] text-center text-rose-500 mt-2">
                                                * การกระทำนี้ไม่สามารถย้อนกลับได้
                                            </p>
                                       </div>
                                   </div>
                               ) : (
                                   <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                                       <Archive className="w-10 h-10 mb-2 opacity-50" />
                                       <p className="text-sm">ผลการจำลองจะแสดงที่นี่</p>
                                   </div>
                               )}
                           </div>
                       </div>
                   </CardContent>
               </Card>
            </TabsContent>

            {/* Settings Content */}
             <TabsContent value="settings" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <Card className="border-slate-200">
                  <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                       <Settings className="w-5 h-5 text-slate-500" /> ตั้งค่าอัตราดอกเบี้ย
                    </CardTitle>
                    <CardDescription>ปรับปรุงอัตราดอกเบี้ยสำหรับบัญชีประเภทต่างๆ</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-8 px-8 pb-8">
                     <div className="grid md:grid-cols-2 gap-10">
                        {/* Savings Rate Config */}
                        <div className="space-y-4">
                           <Label htmlFor="savings-rate" className="text-base font-semibold text-emerald-800 flex items-center gap-2">
                              <PiggyBank className="w-5 h-5" /> ดอกเบี้ยออมทรัพย์
                           </Label>
                           <div className="p-5 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-4">
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <Input
                                    id="savings-rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    placeholder="0.001"
                                    value={savingsRate}
                                    onChange={(e) => setSavingsRate(e.target.value)}
                                    className="pr-10 h-11 text-lg border-emerald-200 focus:ring-emerald-500"
                                  />
                                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                                </div>
                              </div>
                              <Button
                                onClick={() => handleSaveRate("SAVINGS", savingsRate)}
                                disabled={isSavingRates}
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                              >
                                {isSavingRates ? <Loader2 className="h-4 w-4 animate-spin" /> : "บันทึกการเปลี่ยนแปลง"}
                              </Button>
                              <p className="text-xs text-center text-emerald-600 bg-white py-1 rounded border border-emerald-100">
                                ปัจจุบัน: <span className="font-mono font-bold">{getRateValue("SAVINGS")}% ({formatThaiRate(parseFloat(getRateValue("SAVINGS")))})</span>
                              </p>
                           </div>
                        </div>

                        {/* Fixed Rate Config */}
                        <div className="space-y-4">
                            <Label htmlFor="fixed-rate" className="text-base font-semibold text-amber-800 flex items-center gap-2">
                              <Briefcase className="w-5 h-5" /> ดอกเบี้ยฝากประจำ
                           </Label>
                           <div className="p-5 bg-amber-50/50 rounded-xl border border-amber-100 space-y-4">
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <Input
                                    id="fixed-rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    placeholder="2.00"
                                    value={fixedRate}
                                    onChange={(e) => setFixedRate(e.target.value)}
                                    className="pr-10 h-11 text-lg border-amber-200 focus:ring-amber-500"
                                  />
                                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                                </div>
                              </div>
                               <Button
                                onClick={() => handleSaveRate("FIXED", fixedRate)}
                                disabled={isSavingRates}
                                className="w-full bg-amber-600 hover:bg-amber-700"
                              >
                                {isSavingRates ? <Loader2 className="h-4 w-4 animate-spin" /> : "บันทึกการเปลี่ยนแปลง"}
                              </Button>
                              <p className="text-xs text-center text-amber-600 bg-white py-1 rounded border border-amber-100">
                                ปัจจุบัน: <span className="font-mono font-bold">{getRateValue("FIXED")}% ({formatThaiRate(parseFloat(getRateValue("FIXED")))})</span>
                              </p>
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}