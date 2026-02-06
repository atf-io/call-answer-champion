import { useAuth } from "@/contexts/AuthContext";
import AgentSidebar from "./AgentSidebar";
import { Loader2 } from "lucide-react";

interface AgentLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

const AgentLayout = ({ children, title, description }: AgentLayoutProps) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AgentSidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AgentLayout;
