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
  Building
} from 'lucide-react';

const AdminSidebar = ({ activeSection, onSectionChange, currentUser, onLogout }) => {
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

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
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
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon 
                    size={20} 
                    className={`mr-3 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} 
                  />
                  <div>
                    <div className={`text-sm font-medium ${isActive ? 'text-orange-700' : ''}`}>
                      {item.name}
                    </div>
                    <div className={`text-xs ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>
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
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-3">
          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
            <span className="text-xs font-medium text-gray-700">
              {currentUser?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              Admin
            </p>
            <p className="text-xs text-gray-500 truncate">
              {currentUser?.email}
            </p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200"
        >
          <LogOut size={16} className="mr-2" />
          Sair
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
