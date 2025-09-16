import React from 'react';
import { Calendar, History, CreditCard, Newspaper, User } from 'lucide-react';

const BottomNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'agenda', label: 'Agendar', icon: Calendar },
    { id: 'historico', label: 'Histórico', icon: History },
    { id: 'assinatura', label: 'Assinatura', icon: CreditCard },
    { id: 'feed', label: 'Feed', icon: Newspaper },
    { id: 'perfil', label: 'Perfil', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-3 px-2 flex flex-col items-center space-y-1 ${
                isActive ? 'text-white' : 'text-gray-500'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
