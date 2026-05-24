import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarOpen } = useStore();

  return (
    <div className="min-h-screen bg-surface-950 grid-pattern">
      <Sidebar />
      <Header />
      
      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarOpen ? 260 : 72 }}
        className={cn(
          "pt-16 min-h-screen transition-all duration-300"
        )}
      >
        <div className="p-6">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
