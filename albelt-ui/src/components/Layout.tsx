import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import '../styles/Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className={`layout ${isSidebarOpen ? 'layout--sidebar-open' : ''}`}>
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="layout-container">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <button
          type="button"
          className={`layout-overlay ${isSidebarOpen ? 'is-visible' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close navigation"
        />
        <main className="layout-main">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
