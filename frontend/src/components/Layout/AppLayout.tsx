import React from 'react';
import { clsx } from 'clsx';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useUIStore } from '../../store';
import { ErrorBoundary } from '../common/ErrorBoundary';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={toggleSidebar} />
      
      <div className="flex">
        <Sidebar />
        
        <main
          className={clsx(
            'flex-1 min-h-[calc(100vh-3.5rem-2rem)] transition-all duration-300',
            sidebarOpen ? 'md:ml-0' : 'md:ml-0'
          )}
        >
          <ErrorBoundary>
            <div className="p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </ErrorBoundary>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

