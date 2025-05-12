// app/accounts/new/page.tsx
"use client"
import { useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function NewAccountPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [accountType, setAccountType] = useState("SAVINGS")
  const [formData, setFormData] = useState({
    prefixName: "",
    firstName: "",
    lastName: "",
    cid: "",
    accountName: "",
    initialDeposit: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // ตั้งชื่อบัญชีอัตโนมัติถ้าไม่ได้กรอก
    const accountName = formData.accountName.trim() ||
      `${formData.prefixName}${formData.firstName} ${formData.lastName}`.trim()

    try {
      const response = await api.post("/accounts/create", {
        accountType,
        ...formData,
        accountName, // ใช้ชื่อที่คำนวณแล้ว
        initialDeposit: Number(formData.initialDeposit)
      })

      toast.success(
        <div className="space-y-1">
          <h4 className="font-medium">บัญชีใหม่ถูกสร้างแล้ว!</h4>
          <p className="text-sm">เลขที่บัญชี: {response.data.accountNumber}</p>
        </div>,
        {
          action: {
            label: "คัดลอก",
            onClick: () => {
              navigator.clipboard.writeText(response.data.accountNumber)
              toast.info("คัดลอกเลขบัญชีเรียบร้อย")
            },
          },
        }
      )

      setFormData({
        prefixName: "",
        firstName: "",
        lastName: "",
        cid: "",
        accountName: "",
        initialDeposit: "",
      })
      setCurrentStep(1)
    } catch (error: any) {
      toast.error(
        <div className="space-y-1">
          <h4 className="font-medium">เกิดข้อผิดพลาด</h4>
          <p className="text-sm">{error.response?.data?.message || "ไม่สามารถเปิดบัญชีได้"}</p>
        </div>
      )
    } finally {
      setIsLoading(false)
    }
  }

  const accountTypes = [
    {
      id: "SAVINGS",
      name: "ออมทรัพย์",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      ),
      description: "เหมาะสำหรับการออมเงินระยะสั้น",
      features: ["ถอนเงินได้ตลอดเวลา", "ดอกเบี้ย 0.001% ต่อปี", "ไม่มีเงินฝากขั้นต่ำ"],
      color: "text-blue-600"
    },
    {
      id: "FIXED",
      name: "เงินฝากประจำ",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <rect width="20" height="12" x="2" y="6" rx="2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      ),
      description: "อัตราดอกเบี้ยสูงกว่า",
      features: ["ดอกเบี้ย 2% ต่อปี", "ไม่มีเงินฝากขั้นต่ำ", "ระยะเวลาขั้นต่ำ 12 เดือน"],
      color: "text-emerald-600"
    },
    // {
    //   id: "CURRENT",
    //   name: "กระแสรายวัน",
    //   icon: (
    //     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    //       <line x1="12" x2="12" y1="2" y2="22" />
    //       <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    //     </svg>
    //   ),
    //   description: "เหมาะสำหรับธุรกิจ",
    //   features: ["ไม่มีดอกเบี้ย", "บริการเช็ค", "โอนเงินไม่จำกัดครั้ง"],
    //   color: "text-purple-600"
    // }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">เปิดบัญชีใหม่</h1>
          <p className="text-lg text-gray-600">เพียง 3 ขั้นตอนง่ายๆ เพื่อเริ่มใช้บริการ</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 space-y-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>ขั้นตอนที่ {currentStep} จาก 3</span>
            <span>{Math.round((currentStep / 3) * 100)}%</span>
          </div>
          <Progress value={(currentStep / 3) * 100} className="h-2" />
        </div>

        {/* Form Container */}
        <Card className="shadow-xl border-0">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-xl font-semibold text-gray-800">
              {currentStep === 1 && "เลือกประเภทบัญชี"}
              {currentStep === 2 && "ข้อมูลส่วนตัว"}
              {currentStep === 3 && "ข้อมูลบัญชี"}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {currentStep === 1 && "เลือกบัญชีที่เหมาะกับความต้องการของคุณ"}
              {currentStep === 2 && "กรอกข้อมูลส่วนตัวของคุณ"}
              {currentStep === 3 && "กำหนดรายละเอียดบัญชีของคุณ"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Account Type */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <RadioGroup value={accountType} onValueChange={setAccountType} className="grid gap-4">
                    {accountTypes.map((type) => (
                      <div key={type.id}>
                        <RadioGroupItem value={type.id} id={type.id} className="sr-only peer" />
                        <Label
                          htmlFor={type.id}
                          className="flex flex-col items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 transition-all"
                        >
                          <div className="flex items-center gap-4 w-full">
                            <div className={`p-2 rounded-full bg-opacity-10 ${type.color} bg-current`}>
                              {type.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{type.name}</span>
                                <Badge variant="outline" className={type.color}>
                                  {type.features[0]}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                            </div>
                          </div>
                          <ul className="mt-3 pl-2 text-sm text-gray-600 space-y-1">
                            {type.features.map((feature, i) => (
                              <li key={i} className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Step 2: Personal Info */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="prefixName">คำนำหน้า</Label>
                      <Input
                        id="prefixName"
                        placeholder="เช่น นาย, นาง, นางสาว"
                        value={formData.prefixName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">ชื่อจริง</Label>
                      <Input
                        id="firstName"
                        placeholder="กรอกชื่อจริง"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">นามสกุล</Label>
                      <Input
                        id="lastName"
                        placeholder="กรอกนามสกุล"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cid">เลขบัตรประชาชน</Label>
                      <Input
                        id="cid"
                        placeholder="กรอกเลข 13 หลัก"
                        value={formData.cid}
                        onChange={handleChange}
                        pattern="[0-9]{13}"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Account Info */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="accountName">ชื่อบัญชี</Label>
                    <Input
                      id="accountName"
                      placeholder={`เช่น ${formData.prefixName || 'นาย'}${formData.firstName || 'สมชาย'} ${formData.lastName || 'ดีมาก'}`}
                      value={formData.accountName}
                      onChange={handleChange}
                    />
                    {!formData.accountName && (
                      <p className="text-sm text-gray-500 mt-1">
                        หากไม่กรอก จะใช้ชื่อ "<span className="font-medium">{`${formData.prefixName}${formData.firstName} ${formData.lastName}`}</span>" โดยอัตโนมัติ
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="initialDeposit">จำนวนเงินฝากเริ่มต้น (บาท)</Label>
                    <div className="relative">
                      <Input
                        id="initialDeposit"
                        type="text"  // ใช้ type="text" เพื่อให้ควบคุมการแสดงผลได้ง่ายกว่า
                        inputMode="decimal"  // ทำให้มือถือแสดงคีย์บอร์ดแบบตัวเลขพร้อมจุดทศนิยม
                        value={formData.initialDeposit}
                        onChange={(e) => {
                          const value = e.target.value;
                          // อนุญาตเฉพาะ: ตัวเลข 0-9 และจุดทศนิยม (ไม่เกิน 1 จุด)
                          if (/^\d*\.?\d*$/.test(value)) {
                            // Optional: จำกัดทศนิยมไม่เกิน 2 ตำแหน่ง
                            const parts = value.split('.');
                            if (parts[1] === undefined || parts[1].length <= 2) {
                              handleChange(e); // หรือ setFormData(...)
                            }
                          }
                        }}
                        className="pl-8 text-lg"
                        required
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">฿</span>
                    </div>
                    {/* {accountType === "FIXED" && (
                      <p className="text-sm text-gray-500 mt-1">
                        เงินฝากขั้นต่ำ: 5,000 บาท
                      </p>
                    )} */}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className={`mt-8 flex ${currentStep === 1 ? "justify-end" : "justify-between"}`}>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="px-6 py-3"
                  >
                    ย้อนกลับ
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700"
                  >
                    ดำเนินการต่อ
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        กำลังดำเนินการ...
                      </span>
                    ) : (
                      "เปิดบัญชีใหม่"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* <div className="mt-6 text-center text-sm text-gray-500">
          มีคำถาม? ติดต่อเราได้ที่ 02-123-4567 หรือ support@bank.com
        </div> */}
      </div>

      <Toaster position="top-center" richColors />
    </div>
  )
}