import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Receipt, Repeat, Landmark,
  Wallet, CreditCard, Settings, Menu, X, LogOut, Bell, BellOff, Tv, Sparkles, Languages
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useLoans } from "@/hooks/useFinanceData";
import { checkLoanReminders, requestNotificationPermission } from "@/lib/notifications";
import { toast } from "sonner";

const useNavItems = () => {
  const { t } = useTranslation();
  return [
    { to: "/", icon: LayoutDashboard, label: t("nav.dashboard") },
    { to: "/transactions", icon: Receipt, label: t("nav.transactions") },
    { to: "/recurring", icon: Repeat, label: t("nav.recurring") },
    { to: "/subscriptions", icon: Tv, label: t("nav.subscriptions") },
    { to: "/loans", icon: Landmark, label: t("nav.loans") },
    { to: "/cards", icon: CreditCard, label: t("nav.cards") },
    { to: "/accounts", icon: Wallet, label: t("nav.accounts") },
    { to: "/insights", icon: Sparkles, label: t("nav.insights") },
    { to: "/settings", icon: Settings, label: t("nav.settings") },
  ];
};

export function AppLayout({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const navItems = useNavItems();
  const bottomNav = navItems.slice(0, 5);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: loans = [] } = useLoans();
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  useEffect(() => { if (loans.length) checkLoanReminders(loans); }, [loans]);

  const enableNotif = async () => {
    const p = await requestNotificationPermission();
    setNotifPerm(p);
    if (p === "granted") toast.success("Notifications enabled");
    else toast.error("Notifications blocked");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Wallet className="text-primary-foreground" size={18} />
            </div>
            <div>
              <div className="font-semibold text-foreground text-sm">Money Manager</div>
              <div className="text-[10px] text-muted-foreground -mt-0.5">PRO</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-primary/15 text-primary shadow-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="px-3 py-2 text-xs">
            <div className="text-muted-foreground">Signed in as</div>
            <div className="font-medium text-foreground truncate">{user?.email}</div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => { signOut(); navigate("/auth"); }}>
            <LogOut size={16} /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center px-4 lg:px-6 gap-4 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-semibold truncate flex-1">
            {navItems.find((n) => n.to === location.pathname)?.label || "Money Manager"}
          </h1>
          <Button variant="ghost" size="icon" onClick={enableNotif} title={notifPerm === "granted" ? "Notifications on" : "Enable notifications"}>
            {notifPerm === "granted" ? <Bell size={18} className="text-primary" /> : <BellOff size={18} />}
          </Button>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto pb-24 lg:pb-6 animate-fade-in">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border">
          <div className="grid grid-cols-5">
            {bottomNav.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to} className={cn(
                  "flex flex-col items-center justify-center py-2.5 text-[10px] font-medium gap-1 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}>
                  <item.icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
