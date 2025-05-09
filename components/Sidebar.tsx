// components/Sidebar.tsx
"use client"
import Link from "next/link"

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r">
      <ul className="space-y-2 p-4">
        <li><Link href="/staff/register" className="block px-4 py-2 hover:bg-gray-100 rounded">สมัครเจ้าหน้าที่</Link></li>
        <li><Link href="/customers/register" className="block px-4 py-2 hover:bg-gray-100 rounded">สมัครลูกค้า</Link></li>
        <li><Link href="/accounts/new" className="block px-4 py-2 hover:bg-gray-100 rounded">เปิดบัญชีใหม่</Link></li>
        <li><Link href="/transactions" className="block px-4 py-2 hover:bg-gray-100 rounded">ฝาก/ถอน</Link></li>
      </ul>
    </aside>
  )
}
