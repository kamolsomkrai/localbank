// app/interest/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { DollarSign, Loader2 } from "lucide-react";

export default function InterestPage() {
  const [isSavingsLoading, setIsSavingsLoading] = useState(false);
  const [isFixedLoading, setIsFixedLoading] = useState(false);

  const handleCalculate = async (type: "savings" | "fixed") => {
    const isLoading = type === "savings" ? isSavingsLoading : isFixedLoading;
    if (isLoading) return;

    const confirmed = window.confirm(
      `คุณต้องการคำนวณดอกเบี้ยสำหรับบัญชีประเภท '${type}' ใช่หรือไม่?\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`
    );

    if (!confirmed) return;

    if (type === "savings") setIsSavingsLoading(true);
    else setIsFixedLoading(true);

    try {
      const response = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "เกิดข้อผิดพลาด");
      }

      toast.success(result.message, {
        description: `มีผล ${result.accountsAffected} บัญชี, ยอดรวม ${result.totalInterestPaid.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`,
      });

    } catch (error: any) {
      toast.error("ดำเนินการไม่สำเร็จ", {
        description: error.message,
      });
    } finally {
      if (type === "savings") setIsSavingsLoading(false);
      else setIsFixedLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <DollarSign className="w-6 h-6" />
            การจัดการและคำนวณดอกเบี้ย
          </CardTitle>
          <CardDescription>
            เลือกประเภทบัญชีเพื่อคำนวณและจ่ายดอกเบี้ยตามรอบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="savings">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="savings">เงินฝากออมทรัพย์</TabsTrigger>
              <TabsTrigger value="fixed">เงินฝากประจำ</TabsTrigger>
            </TabsList>
            <TabsContent value="savings" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>ดอกเบี้ยเงินฝากออมทรัพย์</CardTitle>
                  <CardDescription>
                    จ่ายดอกเบี้ยปีละ 2 ครั้ง (สิ้นเดือน มิ.ย. และ ธ.ค.) ตามมาตรฐานธนาคาร
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="font-medium">อัตราดอกเบี้ย:</span> 0.001% ต่อปี
                  </div>
                  <Button
                    onClick={() => handleCalculate("savings")}
                    disabled={isSavingsLoading}
                    className="w-full"
                  >
                    {isSavingsLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {isSavingsLoading ? "กำลังประมวลผล..." : "คำนวณและจ่ายดอกเบี้ยออมทรัพย์"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="fixed" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>ดอกเบี้ยเงินฝากประจำ</CardTitle>
                  <CardDescription>
                    จ่ายดอกเบี้ย 2% ต่อปี ถอนเงินได้ในช่วง 1 - 10 ม.ค. เท่านั้น
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="font-medium">อัตราดอกเบี้ย:</span> 2% ต่อปี
                  </div>
                  <Button
                    onClick={() => handleCalculate("fixed")}
                    disabled={isFixedLoading}
                    className="w-full"
                  >
                    {isFixedLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {isFixedLoading ? "กำลังประมวลผล..." : "ตรวจสอบและจ่ายดอกเบี้ยเงินฝากประจำ"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}