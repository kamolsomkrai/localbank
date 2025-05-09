// app/customers/register/page.tsx
"use client"
import { useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function CustomerRegisterPage() {
  const [form, setForm] = useState({
    prefix: "", firstName: "", lastName: "",
    birthDate: "", gender: "OTHER",
    address: "", province: "", district: "", subDistrict: "", moo: "",
    phone: "", email: "", occupation: "", cid: "",
    accountType: "SAVINGS", initialDeposit: 0
  })

  const submit = async () => {
    await api.post("/customers/register", form)
    alert("สมัครลูกค้าและเปิดบัญชีสำเร็จ")
  }

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader><CardTitle>สมัครลูกค้าใหม่</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {[
            { id: "prefix", label: "คำนำหน้า" },
            { id: "firstName", label: "ชื่อ" },
            { id: "lastName", label: "นามสกุล" },
            { id: "birthDate", label: "วันเกิด", type: "date" },
            { id: "gender", label: "เพศ", select: ["MALE", "FEMALE", "OTHER"] },
            { id: "address", label: "ที่อยู่" },
            { id: "province", label: "จังหวัด" },
            { id: "district", label: "อำเภอ" },
            { id: "subDistrict", label: "ตำบล" },
            { id: "moo", label: "หมู่ที่" },
            { id: "phone", label: "เบอร์โทร" },
            { id: "email", label: "Email", type: "email" },
            { id: "occupation", label: "อาชีพ" },
            { id: "cid", label: "เลขบัตรประชาชน" },
          ].map(field => (
            <div key={field.id}>
              <Label htmlFor={field.id}>{field.label}</Label>
              {field.select ? (
                <Select onValueChange={val => setForm({ ...form, [field.id]: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือก" />
                  </SelectTrigger>
                  <SelectContent>
                    {field.select.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={field.id}
                  type={field.type || "text"}
                  value={form[field.id as keyof typeof form]}
                  onChange={e => setForm({ ...form, [field.id]: e.target.value })}
                />
              )}
            </div>
          ))}
          <div>
            <Label>ประเภทบัญชี</Label>
            <Select onValueChange={val => setForm({ ...form, accountType: val })}>
              <SelectTrigger><SelectValue placeholder="เลือกประเภท" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SAVINGS">ออมทรัพย์</SelectItem>
                <SelectItem value="FIXED">ประจำ</SelectItem>
                <SelectItem value="CURRENT">กระแสรายวัน</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="initialDeposit">ยอดฝากครั้งแรก</Label>
            <Input
              id="initialDeposit" type="number"
              value={form.initialDeposit}
              onChange={e => setForm({ ...form, initialDeposit: Number(e.target.value) })}
            />
          </div>
          <div className="col-span-2">
            <Button className="w-full" onClick={submit}>สมัครและเปิดบัญชี</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
