import React from 'react';
import { 
  LayoutDashboard,
  Calendar,
  Users,
  BarChart3,
  Plus
} from 'lucide-react';

const BottomNavigation = ({ activeSection, onSectionChange, onNewAppointment }) => {
  const mainItems = [
    {
      id: 'dashboard',
      name: 'Início',
      icon: LayoutDashboard,
      color: 'text-blue-600'
    },
    {
      id: 'agendamentos',
      name: 'Agenda',
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      id: 'new-appointment',
      name: 'Novo',
      icon: Plus,
      color: 'text-orange-600',
      special: true
    },
    {
      id: 'profissionais',
      name: 'Equipe',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      id: 'relatorios',
      name: 'Relatórios',
      icon: BarChart3,
      color: 'text-indigo-600'
    }
  ];

  const handleItemClick = (item) => {
    if (item.id === 'new-appointment') {
      onNewAppointment();
    } else {
      onSectionChange(item.id);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-50">
      <div className="flex items-center justify-around px-2 py-1">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const isSpecial = item.special;
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 transition-all duration-200 ${
                isActive && !isSpecial
                  ? 'text-orange-600'
                  : isSpecial
                  ? 'text-white'
                  : 'text-gray-500'
              }`}
            >
              <div className={`p-2 rounded-full transition-all duration-200 ${
                isActive && !isSpecial
                  ? 'bg-orange-100'
                  : isSpecial
                  ? 'bg-orange-500 shadow-lg'
                  : 'hover:bg-gray-100'
              }`}>
                <Icon 
                  size={isSpecial ? 24 : 20} 
                  className={`${
                    isActive && !isSpecial
                      ? 'text-orange-600'
                      : isSpecial
                      ? 'text-white'
                      : 'text-gray-500'
                  }`}
                />
              </div>
              <span className={`text-xs font-medium mt-1 truncate ${
                isActive && !isSpecial
                  ? 'text-orange-600'
                  : isSpecial
                  ? 'text-orange-600'
                  : 'text-gray-500'
              }`}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
