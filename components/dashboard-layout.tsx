"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Filter,
  Users,
  Wallet,
  Settings,
  TrendingUp,
  LogOut,
  Database,
  ShoppingCart,
  Truck,
  Tags,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface DashboardLayoutProps {
  children: ReactNode
  userType: "buyer" | "seller"
  profileImage?: string | null
}

export function DashboardLayout({ children, userType, profileImage }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  const buyerNavItems = [
    { href: "/buyer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/buyer/campaigns", label: "Buy Leads", icon: ShoppingCart },
    { href: "/buyer/leads", label: "Leads", icon: Users },
    { href: "/buyer/wallet", label: "Wallet", icon: Wallet },
    { href: "/buyer/settings", label: "Settings", icon: Settings },
  ]

  const sellerNavItems = [
    { href: "/seller", label: "Dashboard", icon: LayoutDashboard },
    { href: "/seller/buyers", label: "Buyers", icon: Users },
    { href: "/seller/suppliers", label: "Suppliers", icon: Truck },
    { href: "/seller/leads", label: "Leads", icon: Database },
    { href: "/seller/categories", label: "Categories & Fields", icon: Tags },
    { href: "/seller/campaigns", label: "Campaigns", icon: Filter },
    { href: "/seller/settings", label: "Settings", icon: Settings },
  ]

  const navItems = userType === "buyer" ? buyerNavItems : sellerNavItems

  const handleLogout = () => {
    router.push("/")
  }

  const handleProfileClick = () => {
    router.push(`/${userType}/settings?tab=profile`)
  }

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-lg text-foreground">LeadFlow</h1>
              <p className="text-xs text-muted-foreground capitalize">{userType}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 w-full rounded-lg">
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
            >
              <Avatar className="w-8 h-8">
                {profileImage && <AvatarImage src={profileImage || "/placeholder.svg"} />}
                <AvatarFallback className="text-xs font-semibold">{userType === "buyer" ? "BU" : "SE"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {userType === "buyer" ? "Buyer Account" : "Seller Account"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{userType}@leadflow.com</p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="text-red-500 hover:text-red-600 transition-colors p-1"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
