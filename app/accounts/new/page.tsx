// app/accounts/new/page.tsx
"use client"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { UserPlus, PiggyBank, Briefcase, CheckCircle2, ArrowRight, ArrowLeft, Loader2, CreditCard } from "lucide-react"

interface InterestRate {
  accountType: "SAVINGS" | "FIXED"
  rate: number
}

export default function NewAccountPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [accountType, setAccountType] = useState("SAVINGS")
  const [rates, setRates] = useState<InterestRate[]>([])
  const [formData, setFormData] = useState({
    prefixName: "",
    firstName: "",
    lastName: "",
    cid: "",
    accountName: "",
    initialDeposit: "",
  })

  useEffect(() => {
    fetchRates()
  }, [])

  const fetchRates = async () => {
    try {
      const { data } = await api.get("/interest-rates")
      setRates(data)
    } catch (error) {
      console.error("Failed to fetch rates:", error)
    }
  }

  const getRateDisplay = (type: "SAVINGS" | "FIXED", defaultRate: string) => {
    const rateObj = rates.find(r => r.accountType === type)
    if (!rateObj) return defaultRate
    return `${(rateObj.rate * 100).toFixed(2)}% ต่อปี`
  }

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
          duration: 5000,
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
      toast.error("เกิดข้อผิดพลาด", {
        description: error.response?.data?.message || "ไม่สามารถเปิดบัญชีได้",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const accountTypes = [
    {
      id: "SAVINGS",
      name: "ออมทรัพย์",
      icon: <PiggyBank className="w-6 h-6" />,
      description: "เหมาะสำหรับการออมเงินระยะสั้น คล่องตัวสูง",
      features: ["ถอนเงินได้ตลอดเวลา", `ดอกเบี้ย ${getRateDisplay("SAVINGS", "0.50% ต่อปี")}`, "ไม่มีเงินฝากขั้นต่ำ"],
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "peer-data-[state=checked]:border-emerald-500",
      activeBg: "peer-data-[state=checked]:bg-emerald-50"
    },
    {
      id: "FIXED",
      name: "เงินฝากประจำ",
      icon: <Briefcase className="w-6 h-6" />,
      description: "ออมระยะยาวเพื่อผลตอบแทนที่สูงกว่า",
      features: [`ดอกเบี้ย ${getRateDisplay("FIXED", "2.00% ต่อปี")}`, "ไม่มีเงินฝากขั้นต่ำ", "ระยะเวลาขั้นต่ำ 12 เดือน"],
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "peer-data-[state=checked]:border-amber-500",
      activeBg: "peer-data-[state=checked]:bg-amber-50"
    },
  ]

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="border-0 shadow-lg overflow-hidden bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-800 to-blue-600 text-white pb-8 pt-8 px-8">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                 <UserPlus className="w-8 h-8 text-blue-200" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  เปิดบัญชีใหม่
                </CardTitle>
                <CardDescription className="text-blue-100 mt-1">
                  กรอกข้อมูลเพื่อสร้างบัญชีใหม่สำหรับสมาชิก
                </CardDescription>
              </div>
           </div>
        </CardHeader>

        {/* Progress Steps */}
        <div className="bg-slate-50 border-b px-8 py-4">
          <div className="flex justify-between items-center relative">
             <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
             <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 -z-10 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
             ></div>

             {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center gap-2 bg-slate-50 px-2">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${
                      step <= currentStep 
                      ? "bg-blue-600 border-blue-600 text-white shadow-md scale-110" 
                      : "bg-white border-slate-300 text-slate-400"
                   }`}>
                      {step < currentStep ? <CheckCircle2 className="w-6 h-6" /> : step}
                   </div>
                   <span className={`text-xs font-semibold ${step <= currentStep ? "text-blue-700" : "text-slate-400"}`}>
                      {step === 1 && "ประเภทบัญชี"}
                      {step === 2 && "ข้อมูลส่วนตัว"}
                      {step === 3 && "รายละเอียด"}
                   </span>
                </div>
             ))}
          </div>
        </div>
        
        <CardContent className="p-8">
          <form onSubmit={handleSubmit}>
            <div className="min-h-[400px]">
              {/* Step 1: Account Type */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="text-center mb-6">
                     <h3 className="text-lg font-semibold text-slate-800">เลือกประเภทบัญชี</h3>
                     <p className="text-sm text-slate-500">เลือกบัญชีที่ตรงกับความต้องการของสมาชิก</p>
                  </div>
                  <RadioGroup value={accountType} onValueChange={setAccountType} className="grid md:grid-cols-2 gap-4">
                    {accountTypes.map((type) => (
                      <div key={type.id}>
                        <RadioGroupItem value={type.id} id={type.id} className="sr-only peer" />
                        <Label
                          htmlFor={type.id}
                          className={`flex flex-col h-full border-2 rounded-xl cursor-pointer hover:border-slate-300 transition-all ${type.borderColor} ${type.activeBg}`}
                        >
                          <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                               <div className={`p-3 rounded-full ${type.bgColor} ${type.color}`}>
                                  {type.icon}
                               </div>
                               <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${accountType === type.id ? `border-current ${type.color}` : "border-slate-300"}`}>
                                  {accountType === type.id && <div className={`w-3 h-3 rounded-full bg-current ${type.color}`} />}
                               </div>
                            </div>
                            
                            <div>
                               <h4 className="font-bold text-lg text-slate-800 mb-1">{type.name}</h4>
                               <p className="text-sm text-slate-600">{type.description}</p>
                            </div>

                            <ul className="space-y-2 pt-2 border-t border-slate-100/50">
                              {type.features.map((feature, i) => (
                                <li key={i} className="flex items-center text-sm text-slate-600">
                                  <CheckCircle2 className={`w-4 h-4 mr-2 ${type.color}`} />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Step 2: Personal Info */}
              {currentStep === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto">
                   <div className="text-center mb-6">
                     <h3 className="text-lg font-semibold text-slate-800">ข้อมูลส่วนตัว</h3>
                     <p className="text-sm text-slate-500">กรอกข้อมูลยืนยันตัวตนเจ้าของบัญชี</p>
                  </div>

                  <div className="space-y-6">
                    {/* Identity Section */}
                    <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="space-y-2">
                          <Label htmlFor="cid" className="text-slate-700 font-medium">เลขบัตรประชาชน <span className="text-red-500">*</span></Label>
                          <Input
                            id="cid"
                            placeholder="เลขประจำตัวประชาชน 13 หลัก"
                            value={formData.cid}
                            onChange={handleChange}
                            maxLength={13}
                            required
                            className="h-11 font-mono tracking-wide text-lg bg-white"
                          />
                           <p className="text-xs text-slate-400">กรอกเฉพาะตัวเลข 13 หลัก ไม่ต้องใส่เครื่องหมายขีด (-)</p>
                        </div>
                    </div>

                    {/* Name Section */}
                    <div className="space-y-4">
                       <Label className="text-slate-700 font-medium">ข้อมูลชื่อ - นามสกุล</Label>
                       <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="prefixName" className="text-xs text-slate-500">คำนำหน้า <span className="text-red-500">*</span></Label>
                            <Input
                              id="prefixName"
                              placeholder="เช่น นาย"
                              value={formData.prefixName}
                              onChange={handleChange}
                              required
                              className="h-11"
                            />
                          </div>
                          <div className="md:col-span-5 space-y-2">
                            <Label htmlFor="firstName" className="text-xs text-slate-500">ชื่อจริง <span className="text-red-500">*</span></Label>
                            <Input
                              id="firstName"
                              placeholder="กรอกชื่อจริงภาษาไทย"
                              value={formData.firstName}
                              onChange={handleChange}
                              required
                              className="h-11"
                            />
                          </div>
                          <div className="md:col-span-5 space-y-2">
                            <Label htmlFor="lastName" className="text-xs text-slate-500">นามสกุล <span className="text-red-500">*</span></Label>
                            <Input
                              id="lastName"
                              placeholder="กรอกนามสกุลภาษาไทย"
                              value={formData.lastName}
                              onChange={handleChange}
                              required
                              className="h-11"
                            />
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Account Info */}
              {currentStep === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 max-w-lg mx-auto">
                   <div className="text-center mb-6">
                     <h3 className="text-lg font-semibold text-slate-800">รายละเอียดบัญชี</h3>
                     <p className="text-sm text-slate-500">กำหนดเงินฝากเริ่มต้นและชื่อบัญชี</p>
                  </div>
                  
                  <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <div className="space-y-2">
                      <Label htmlFor="initialDeposit" className="text-base">จำนวนเงินฝากเริ่มต้น</Label>
                      <div className="relative">
                        <Input
                          id="initialDeposit"
                          type="text"
                          inputMode="decimal"
                          value={formData.initialDeposit}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*\.?\d*$/.test(value)) {
                              const parts = value.split('.');
                              if (parts[1] === undefined || parts[1].length <= 2) {
                                handleChange(e);
                              }
                            }
                          }}
                          className="pl-10 h-14 text-2xl font-bold text-slate-700"
                          placeholder="0.00"
                          required
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">฿</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="accountName">ชื่อบัญชี (Optional)</Label>
                    <div className="relative">
                      <Input
                        id="accountName"
                        placeholder="ระบุชื่อบัญชี (ถ้ามี)"
                        value={formData.accountName}
                        onChange={handleChange}
                        className="pl-10 h-11"
                      />
                       <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                    {!formData.accountName && (
                      <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                        <UserPlus className="w-4 h-4" />
                         <span>
                            ระบบจะใช้ชื่อ &ldquo;<span className="font-semibold">{`${formData.prefixName}${formData.firstName} ${formData.lastName}`}</span>&rdquo; โดยอัตโนมัติ
                         </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="pt-8 mt-8 border-t flex justify-between items-center">
               <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`px-6 h-11 text-slate-500 hover:text-slate-800 ${currentStep === 1 ? "invisible" : ""}`}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> ย้อนกลับ
                </Button>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="px-8 h-12 bg-blue-600 hover:bg-blue-700 text-lg shadow-lg hover:shadow-xl transition-all rounded-full"
                >
                  ถัดไป <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                   className="px-8 h-12 bg-emerald-600 hover:bg-emerald-700 text-lg shadow-lg hover:shadow-xl transition-all rounded-full"
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> กำลังสร้างบัญชี...</>
                  ) : (
                    <>ยืนยันการเปิดบัญชี <CheckCircle2 className="w-5 h-5 ml-2" /></>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Toaster position="top-center" richColors />
    </div>
  )
}