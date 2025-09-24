import React from 'react';
import { 
  LayoutDashboard,
  Calendar,
  History,
  Building2,
  Users,
  Scissors,
  Clock,
  BarChart3,
  LogOut,
  Building,
  X
} from 'lucide-react';

const AdminSidebar = ({ activeSection, onSectionChange, currentUser, onLogout, isOpen, onClose }) => {
  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Visão geral'
    },
    {
      id: 'agendamentos',
      name: 'Agendamentos',
      icon: Calendar,
      description: 'Gerenciar agendamentos'
    },
    {
      id: 'historico',
      name: 'Histórico',
      icon: History,
      description: 'Consultar histórico'
    },
    {
      id: 'unidades',
      name: 'Unidades',
      icon: Building2,
      description: 'Gerenciar unidades'
    },
    {
      id: 'profissionais',
      name: 'Profissionais',
      icon: Users,
      description: 'Gerenciar equipe'
    },
    {
      id: 'servicos',
      name: 'Serviços',
      icon: Scissors,
      description: 'Gerenciar serviços'
    },
    {
      id: 'horarios',
      name: 'Horários',
      icon: Clock,
      description: 'Configurar funcionamento'
    },
    {
      id: 'relatorios',
      name: 'Relatórios',
      icon: BarChart3,
      description: 'Análises e métricas'
    }
  ];

  const handleSectionChange = (sectionId) => {
    onSectionChange(sectionId);
    onClose(); // Fechar sidebar no mobile após seleção
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        w-80 md:w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile Header com botão fechar */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center mr-2">
              <Building size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Menu</h1>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Logo - Desktop */}
        <div className="hidden md:block p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-orange-500 rounded-xl flex items-center justify-center mr-3">
              <Building size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Gestão</h1>
              <p className="text-xs text-gray-500">Sistema de gerenciamento</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleSectionChange(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon 
                      size={20} 
                      className={`mr-3 flex-shrink-0 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} 
                    />
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-medium truncate ${isActive ? 'text-orange-700' : ''}`}>
                        {item.name}
                      </div>
                      <div className={`text-xs truncate md:block hidden ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>
                        {item.description}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center mb-3">
            <div className="h-10 w-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-bold text-white">
                {currentUser?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                Administrador
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentUser?.email}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center px-3 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
          >
            <LogOut size={16} className="mr-2" />
            Sair da Conta
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
