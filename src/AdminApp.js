import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
// Sistema admin independente - não usa auth do Supabase
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminSidebar from './components/admin/AdminSidebar';
import AccessDenied from './components/admin/AccessDenied';
import BottomNavigation from './components/admin/BottomNavigation';

const AdminApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isValidAdmin, setIsValidAdmin] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Verificar se há sessão admin no localStorage
    const checkAdminSession = () => {
      const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
      const storedAdminData = localStorage.getItem('adminData');
      
      if (isLoggedIn && storedAdminData) {
        try {
          const adminData = JSON.parse(storedAdminData);
          setCurrentUser({ 
            email: adminData.email,
            unidade_id: adminData.unidade_id,
            nome: adminData.nome 
          });
          setIsValidAdmin(true);
          setAdminData(adminData);
        } catch (error) {
          // Dados corrompidos - limpar
          localStorage.removeItem('adminLoggedIn');
          localStorage.removeItem('adminData');
          setCurrentUser(null);
          setIsValidAdmin(false);
          setAdminData(null);
        }
      } else {
        setCurrentUser(null);
        setIsValidAdmin(false);
        setAdminData(null);
      }
      
      setLoading(false);
    };

    checkAdminSession();
  }, []);

  const handleLogout = () => {
    // Limpar sessão admin
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminData');
    setCurrentUser(null);
    setIsValidAdmin(false);
    setAdminData(null);
    setActiveSection('dashboard');
    setSidebarOpen(false);
  };

  const handleNewAppointment = () => {
    setActiveSection('agendamentos');
    // Aqui você pode adicionar lógica específica para abrir modal de novo agendamento
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não há usuário logado, mostrar login
  if (!currentUser) {
    return <AdminLogin />;
  }

  // Se usuário logado MAS não é admin válido, mostrar acesso negado
  if (!isValidAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col pb-16 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={24} className="text-gray-600" />
            </button>
            
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {getSectionTitle(activeSection)}
            </h1>
            
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {currentUser?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:block bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {getSectionTitle(activeSection)}
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bem-vindo, {adminData?.nome || currentUser.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <AdminDashboard 
            activeSection={activeSection}
            currentUser={currentUser}
          />
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onNewAppointment={handleNewAppointment}
      />
    </div>
  );
};

const getSectionTitle = (section) => {
  const titles = {
    dashboard: 'Dashboard',
    agendamentos: 'Gerenciar Agendamentos',
    historico: 'Histórico',
    unidades: 'Gerenciar Unidades',
    profissionais: 'Gerenciar Profissionais',
    servicos: 'Gerenciar Serviços',
    horarios: 'Configurar Horários',
    relatorios: 'Relatórios'
  };
  return titles[section] || 'Gestão';
};

export default AdminApp;
