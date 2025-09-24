import React from 'react';
import DashboardOverview from './sections/DashboardOverview';
import AgendamentosManager from './sections/AgendamentosManager';
import HistoricoView from './sections/HistoricoView';
import UnidadesManager from './sections/UnidadesManager';
import ProfissionaisManager from './sections/ProfissionaisManager';
import ServicosManager from './sections/ServicosManager';
import HorariosConfig from './sections/HorariosConfig';
import RelatoriosView from './sections/RelatoriosView';

const AdminDashboard = ({ activeSection, currentUser }) => {
  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview currentUser={currentUser} />;
      case 'agendamentos':
        return <AgendamentosManager currentUser={currentUser} />;
      case 'historico':
        return <HistoricoView currentUser={currentUser} />;
      case 'unidades':
        return <UnidadesManager currentUser={currentUser} />;
      case 'profissionais':
        return <ProfissionaisManager currentUser={currentUser} />;
      case 'servicos':
        return <ServicosManager currentUser={currentUser} />;
      case 'horarios':
        return <HorariosConfig currentUser={currentUser} />;
      case 'relatorios':
        return <RelatoriosView currentUser={currentUser} />;
      default:
        return <DashboardOverview currentUser={currentUser} />;
    }
  };

  return (
    <div className="w-full">
      {renderSection()}
    </div>
  );
};

export default AdminDashboard;
