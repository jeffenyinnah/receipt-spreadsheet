import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Menu,
  Home,
  BarChart,
  FileText,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  FilePlus,
} from "lucide-react";

const sidebarItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Receipts", href: "/receipts", icon: FileText },
  {
    name: "Multiple Receipts",
    href: "/upload-multiple",
    icon: FilePlus,
  },
  { name: "Settings", href: "#", icon: Settings },
  { name: "Help", href: "#", icon: HelpCircle },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  className,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();

  return (
    <div className={cn("relative pb-12 border-r", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <h2
              className={cn(
                "text-lg font-semibold tracking-tight",
                isCollapsed && "sr-only"
              )}
            >
              Receipt Manager
            </h2>
            <Button variant="ghost" size="icon" onClick={onToggleCollapse}>
              {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </Button>
          </div>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <TooltipProvider key={item.href}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={pathname === item.href ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isCollapsed && "justify-center"
                      )}
                      asChild
                      size="icon"
                    >
                      <Link href={item.href}>
                        <item.icon
                          className={cn("h-4 w-4", !isCollapsed && "mr-2")}
                        />
                        {!isCollapsed && item.name}
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div
          className={cn(
            "flex items-center justify-between",
            isCollapsed && "flex-col"
          )}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar>
                  {/* <AvatarImage src="/avatar.png" alt="User" /> */}
                  <AvatarFallback>US</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>User Profile</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className={cn("ml-auto", isCollapsed && "mt-4")}
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Toggle theme</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <ScrollArea className="h-full">
          <Sidebar isCollapsed={false} onToggleCollapse={() => {}} />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
