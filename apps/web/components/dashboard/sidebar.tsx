"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useProductTour } from "@/components/tour/use-product-tour";
import {
  LayoutDashboard,
  MessageSquare,
  MapPin,
  Zap,
  BarChart3,
  Settings,
  LogOut,
  Activity,
  HelpCircle,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, tour: "nav-dashboard" },
  { name: "Reseñas", href: "/dashboard/reviews", icon: MessageSquare, tour: "nav-reviews" },
  { name: "Ubicaciones", href: "/dashboard/locations", icon: MapPin, tour: "nav-locations" },
  { name: "Automatización", href: "/dashboard/automation", icon: Zap, tour: "nav-automation" },
  { name: "Analíticas", href: "/dashboard/analytics", icon: BarChart3, tour: "nav-analytics" },
  { name: "Actividad", href: "/dashboard/activity", icon: Activity, tour: "nav-activity" },
  { name: "Configuración", href: "/dashboard/settings", icon: Settings, tour: "nav-settings" },
];

interface SidebarProps {
  autoStartTour: boolean;
}

export function Sidebar({ autoStartTour }: SidebarProps) {
  const pathname = usePathname();
  const { startTour } = useProductTour(autoStartTour);

  return (
    <div className="flex flex-col w-64 bg-card border-r">
      <div className="p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold">Review Manager</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              data-tour={item.tour}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t space-y-1">
        <button
          onClick={() => void startTour()}
          data-tour="tour-restart"
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
          Ver tour
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
