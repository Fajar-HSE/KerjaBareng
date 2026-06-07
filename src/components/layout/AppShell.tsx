import Sidebar from "./Sidebar";
import Header, { type HeaderProps } from "./Header";

interface AppShellProps extends HeaderProps {
  children: React.ReactNode;
}

export default function AppShell({ children, title, subtitle, action }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <Header title={title} subtitle={subtitle} action={action} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
