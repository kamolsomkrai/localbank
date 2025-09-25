// components/Navbar.tsx
'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSession, signOut } from 'next-auth/react'
import { Menu, User, Banknote, Home, ArrowRightCircle, Search, ReceiptText } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const navLinks = [
    {
      name: "หน้าหลัก",
      href: "/",
      icon: <Home className="w-4 h-4" />,
    },
    {
      name: "ค้นหาบัญชี",
      href: "/search",
      icon: <Search className="w-4 h-4" />,
    },
    {
      name: "เปิดบัญชีใหม่",
      href: "/accounts/new",
      icon: <Banknote className="w-4 h-4" />,
    },
    {
      name: "ฝาก/ถอนเงิน",
      href: "/transactions",
      icon: <ArrowRightCircle className="w-4 h-4" />,
    },
    {
      name: "ปรับสมุด",
      href: "/print",
      icon: <ReceiptText className="w-4 h-4" />,
    },
    {
      name: "จัดการดอกเบี้ย",
      href: "/interest",
      icon: <ReceiptText className="w-4 h-4" />,
    },
    {
      name: "รายงานบัญชี",
      href: "/accounts/report",
      icon: <ReceiptText className="w-4 h-4" />,
    },
  ]

  return (
    <header className="w-full bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-lg fixed top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg">
              <Banknote className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:inline-block">
              <span className="text-white">ธนาคาร</span>
              <span className="text-amber-300">แม่ฮาว</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  pathname === link.href
                    ? "bg-white/10 text-white"
                    : "text-white/90 hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="mr-2">{link.icon}</span>
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right side - Auth */}
          <div className="flex items-center space-x-4">
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full hover:bg-white/20"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={session.user.image || undefined}
                        alt={session.user.name || "User"}
                      />
                      <AvatarFallback className="bg-white/20">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">โปรไฟล์</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">ตั้งค่า</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-500 focus:text-red-500 focus:bg-red-50"
                    onClick={() => signOut()}
                  >
                    ออกจากระบบ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button
                  variant="outline"
                  className="bg-transparent border-white/30 hover:bg-white/10 hover:text-white"
                >
                  เข้าสู่ระบบ
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <button className="md:hidden p-2 rounded-lg hover:bg-white/20">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}