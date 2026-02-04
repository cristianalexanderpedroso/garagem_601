import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText, 
  ClipboardList, 
  Package, 
  History, 
  Search,
  Menu,
  X,
  Car,
  Settings,
  Calendar,
  Wrench,
  Bell,
  ExternalLink
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    return path.substring(1); // Remove leading slash
  };

  const currentPage = getCurrentPage();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
    { id: 'calendario', label: 'Calendário', icon: Calendar, path: '/calendario' },
    { id: 'clientes', label: 'Clientes', icon: Users, path: '/clientes' },
    { id: 'veiculos', label: 'Veículos', icon: Car, path: '/veiculos' },
    { id: 'orcamentos', label: 'Orçamentos', icon: FileText, path: '/orcamentos' },
    { id: 'laudos', label: 'Laudos', icon: ClipboardList, path: '/laudos' },
    { id: 'estoque', label: 'Estoque', icon: Package, path: '/estoque' },
    { id: 'servicos', label: 'Serviços', icon: Wrench, path: '/servicos' },
    { id: 'historico', label: 'Histórico', icon: History, path: '/historico' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleConsultaPublica = () => {
    window.open('https://garagem601.com.br/consulta', '_blank');
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#2e2e2e] transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-200 ease-in-out`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <img 
              src="/WhatsApp Image 2025-06-20 at 14.53.40-Photoroom.png" 
              alt="Garagem 601 Logo" 
              className="h-8 w-8 object-contain"
            />
            <span className="text-xl font-bold text-white">Garagem 601</span>
            <button 
              className="p-1 text-yellow-500 hover:text-yellow-400 transition-colors"
              title="Notificações (em breve)"
            >
              <Bell className="h-4 w-4" />
            </button>
          </div>
          <button 
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center px-3 py-3 mb-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentPage === item.id
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          {/* Consulta Pública */}
          <button
            onClick={handleConsultaPublica}
            className="w-full flex items-center px-3 py-3 mb-2 text-sm font-medium rounded-lg transition-all duration-200 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Search className="h-5 w-5 mr-3 flex-shrink-0" />
            <span className="truncate">Consulta Pública</span>
            <ExternalLink className="h-3 w-3 ml-auto" />
          </button>
        </nav>

        <div className="absolute bottom-4 left-3 right-3">
          <button 
            onClick={() => handleNavigation('/configuracoes')}
            className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
              currentPage === 'configuracoes'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Settings className="h-5 w-5 mr-3 flex-shrink-0" />
            <span className="truncate">Configurações</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-4 lg:px-6 bg-[#2e2e2e] border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <button 
              className="lg:hidden text-gray-400 hover:text-white p-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Logo e título para mobile */}
            <div className="flex items-center space-x-2 lg:hidden">
              <img 
                src="/WhatsApp Image 2025-06-20 at 14.53.40-Photoroom.png" 
                alt="Garagem 601 Logo" 
                className="h-6 w-6 object-contain"
              />
              <span className="text-lg font-bold text-white">Garagem 601</span>
              <button 
                className="p-1 text-yellow-500 hover:text-yellow-400 transition-colors"
                title="Notificações (em breve)"
              >
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 lg:space-x-4">
            <span className="text-xs lg:text-sm text-gray-400 hidden sm:block">
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short'
              })}
            </span>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;