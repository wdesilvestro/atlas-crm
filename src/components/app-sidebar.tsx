"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { UsersIcon, Building2, LogOut, ChevronDown, Tags as TagsIcon, UserCheck } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"

const navItems = [
  {
    title: "Persons",
    url: "/persons",
    icon: UsersIcon,
  },
  {
    title: "Organizations",
    url: "/organizations",
    icon: Building2,
  },
  {
    title: "Relationship Owners",
    url: "/relationship-owners",
    icon: UserCheck,
  },
  {
    title: "Tags",
    url: "/tags",
    icon: TagsIcon,
    submenu: [
      {
        title: "Person Tags",
        url: "/tags#person-tags",
      },
      {
        title: "Organization Tags",
        url: "/tags#org-tags",
      },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [hash, setHash] = React.useState("")

  React.useEffect(() => {
    const updateHash = () => {
      if (typeof window !== "undefined") {
        setHash(window.location.hash)
      }
    }

    updateHash()
    window.addEventListener("hashchange", updateHash)
    return () => window.removeEventListener("hashchange", updateHash)
  }, [])

  const isSubItemActive = React.useCallback(
    (url: string) => {
      const [hrefPath, hrefHash] = url.split("#")
      const pathMatches = pathname === hrefPath
      if (!hrefHash) {
        return pathMatches
      }
      return pathMatches && hash === `#${hrefHash}`
    },
    [pathname, hash]
  )

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const handleSubItemClick = React.useCallback((url: string) => {
    const [, hrefHash] = url.split("#")
    if (hrefHash) {
      setHash(`#${hrefHash}`)
    } else {
      setHash("")
    }
  }, [])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="pb-6">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/persons" className="flex items-center gap-2">
                <Image
                  src="/logo.webp"
                  alt="Atlas CRM logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-lg object-cover"
                  priority
                />
                <span className="text-base font-semibold">Atlas CRM</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item: any) => {
            const Icon = item.icon
            return (
              <React.Fragment key={item.url}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(`${item.url}/`)}
                  >
                    <Link href={item.url}>
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {item.submenu && (
                  <SidebarMenuSub>
                    {item.submenu.map((subitem: any) => (
                      <SidebarMenuSubItem key={subitem.url}>
                        <SidebarMenuButton asChild isActive={isSubItemActive(subitem.url)}>
                          <Link href={subitem.url} onClick={() => handleSubItemClick(subitem.url)}>
                            <span>{subitem.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </React.Fragment>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm truncate">{user?.email}</span>
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
