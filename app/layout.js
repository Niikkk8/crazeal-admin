'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout } from '../firebase';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import './globals.css';

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoginPage, setIsLoginPage] = useState(false);

  useEffect(() => {
    setIsLoginPage(pathname === '/login');
    if (pathname !== '/login') {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [pathname]);

  const checkAuth = async () => {
    // Check for OTP session first
    const adminSession = localStorage.getItem('adminSession');
    const adminEmail = localStorage.getItem('adminEmail');
    
    if (adminSession && adminEmail) {
      // Valid OTP session exists
      setUser({ email: adminEmail, displayName: adminEmail.split('@')[0] });
      setLoading(false);
      return;
    }

    // Fallback to Firebase auth
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    // Check if user is admin
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
    if (adminEmails.length > 0 && !adminEmails.includes(currentUser.email)) {
      alert('Unauthorized: Admin access required');
      await logout();
      router.push('/login');
      return;
    }
    
    setUser(currentUser);
    setLoading(false);
  };

  const handleLogout = async () => {
    // Clear OTP session
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminEmail');
    
    // Clear Firebase session
    await logout();
    
    router.push('/login');
  };

  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: LayoutDashboard,
      exact: true 
    },
    { 
      name: 'Users', 
      path: '/users', 
      icon: Users 
    },
    { 
      name: 'Analytics', 
      path: '/analytics', 
      icon: BarChart3 
    },
  ];

  // Login page - no layout
  if (isLoginPage) {
    return (
      <html lang="en">
        <body>
          {children}
        </body>
      </html>
    );
  }

  // Loading state
  if (loading) {
    return (
      <html lang="en">
        <body>
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Loading...</p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  // Main dashboard layout
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-black text-white">
          {/* Sidebar */}
          <aside 
            className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } bg-zinc-950 border-r border-zinc-800`}
            style={{ width: '250px' }}
          >
            <div className="h-full px-3 py-4 overflow-y-auto flex flex-col">
              {/* Logo */}
              <div className="flex items-center justify-between mb-8 px-3">
                <h2 className="text-xl font-bold">Crazeal Admin</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1 rounded hover:bg-zinc-800"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation */}
              <ul className="space-y-2 flex-1">
                {navItems.map((item) => {
                  const isActive = item.exact 
                    ? pathname === item.path 
                    : pathname.startsWith(item.path) && item.path !== '/';
                  
                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className={`flex items-center p-3 rounded-lg hover:bg-zinc-800 transition-colors ${
                          isActive ? 'bg-zinc-800 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <item.icon size={20} className="mr-3" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* User Info */}
              <div className="mt-auto pt-4 border-t border-zinc-800">
                <div className="p-3 bg-zinc-900 rounded-lg">
                  <p className="text-xs text-zinc-400 mb-1">Logged in as</p>
                  <p className="text-sm font-medium truncate mb-2">{user?.email}</p>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center p-2 text-sm text-red-400 hover:bg-zinc-800 rounded transition-colors"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div 
            className={`transition-all ${sidebarOpen ? 'lg:ml-[250px]' : 'ml-0'}`}
          >
            {/* Top Bar */}
            <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-30">
              <div className="px-4 py-4 flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded hover:bg-zinc-800 transition-colors"
                >
                  <Menu size={24} />
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{user?.displayName || user?.email}</p>
                    <p className="text-xs text-zinc-400">Administrator</p>
                  </div>
                  {user?.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full border-2 border-zinc-800"
                    />
                  )}
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="p-6">
              {children}
            </main>
          </div>

          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </div>
      </body>
    </html>
  );
}
