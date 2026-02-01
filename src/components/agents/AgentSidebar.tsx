import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Bot,
  BookOpen,
  Phone,
  PhoneCall,
  History,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  Bell,
  CreditCard,
  Settings,
  ArrowLeft,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    label: "Build",
    items: [
      { name: "Agents", href: "/dashboard/agents", icon: Bot },
      { name: "Knowledge Base", href: "/dashboard/agents/knowledge", icon: BookOpen },
    ],
  },
  {
    label: "Deploy",
    items: [
      { name: "Phone Numbers", href: "/dashboard/agents/phone-numbers", icon: Phone },
      { name: "Batch Call", href: "/dashboard/agents/batch-call", icon: PhoneCall },
    ],
  },
  {
    label: "Monitor",
    items: [
      { name: "Call History", href: "/dashboard/agents/call-history", icon: History },
      { name: "Chat History", href: "/dashboard/agents/chat-history", icon: MessageSquare },
      { name: "Analytics", href: "/dashboard/agents/analytics", icon: BarChart3 },
      { name: "AI Quality Assurance", href: "/dashboard/agents/quality", icon: ShieldCheck },
      { name: "Alerting", href: "/dashboard/agents/alerting", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Billing", href: "/dashboard/agents/billing", icon: CreditCard },
      { name: "Settings", href: "/dashboard/agents/settings", icon: Settings },
    ],
  },
];

const AgentSidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border gap-3">
        <Link
          to="/dashboard"
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-sidebar-foreground/70" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">AI Agents</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navigation.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default AgentSidebar;
