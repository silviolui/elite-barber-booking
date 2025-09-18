import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Star, User, Scissors } from 'lucide-react';
import { supabase } from '../services/supabase';

const Historico = ({ usuarioId }) => {
  const [agendamentosAbertos, setAgendamentosAbertos] = useState([]);
  const [historicoPassado, setHistoricoPassado] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (usuarioId) {
      carregarDados();
    }
  }, [usuarioId]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar agendamentos em aberto
      await carregarAgendamentosAbertos();
      
      // Carregar histórico passado
      await carregarHistoricoPassado();
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarAgendamentosAbertos = async () => {
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        *,
        profissionais (nome, foto_url),
        unidades (nome),
        servicos (nome, duracao)
      `)
      .eq('usuario_id', usuarioId)
      .eq('status', 'agendado')
      .gte('data_agendamento', new Date().toISOString().split('T')[0])
      .order('data_agendamento', { ascending: true });

    if (!error && data) {
      setAgendamentosAbertos(data);
    }
  };

  const carregarHistoricoPassado = async () => {
    const { data, error } = await supabase
      .from('historico')
      .select(`
        *,
        profissionais (nome, foto_url),
        unidades (nome),
        servicos (nome, duracao)
      `)
      .eq('usuario_id', usuarioId)
      .order('data_agendamento', { ascending: false });

    if (!error && data) {
      setHistoricoPassado(agruparPorMes(data));
    }
  };

  const agruparPorMes = (dados) => {
    const grupos = {};
    dados.forEach(item => {
      const data = new Date(item.data_agendamento);
      const chave = `${data.getFullYear()}-${data.getMonth()}`;
      const mesAno = data.toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      if (!grupos[chave]) {
        grupos[chave] = {
          titulo: mesAno,
          items: []
        };
      }
      grupos[chave].items.push(item);
    });
    
    return Object.values(grupos);
  };

  const formatarData = (dataStr) => {
    const data = new Date(dataStr);
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
    const diaSemana = diasSemana[data.getDay()];
    const dia = data.getDate();
    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();
    
    return `${diaSemana}, ${dia} de ${mes} de ${ano}`;
  };

  const formatarDataSimples = (dataStr) => {
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR');
  };

  const formatarHorario = (inicio, fim) => {
    return `${inicio} - ${fim}`;
  };

  const renderizarEstrelas = (avaliacao) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((estrela) => (
          <Star
            key={estrela}
            size={20}
            className={`${
              avaliacao && estrela <= avaliacao
                ? 'text-yellow-400 fill-current'
                : 'text-gray-400'
            }`}
          />
        ))}
      </div>
    );
  };

  const avaliarServico = (historicoId, nota) => {
    // Implementar funcionalidade de avaliação
    console.log('Avaliar:', historicoId, nota);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6">Histórico</h1>

      {/* Agendamentos em Aberto */}
      {agendamentosAbertos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-300">Agendamento em aberto</h2>
          
          {agendamentosAbertos.map((agendamento) => (
            <div key={agendamento.id} className="bg-gray-800 rounded-2xl p-4 mb-4 border border-gray-700">
              {/* Cabeçalho do Card */}
              <div className="mb-4">
                <h3 className="text-white font-medium text-lg mb-2">
                  {agendamento.unidades?.nome}
                </h3>
                
                <div className="flex items-center justify-between text-gray-300">
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2" />
                    <span className="text-sm">
                      {formatarHorario(agendamento.horario_inicio, agendamento.horario_fim)}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2" />
                    <span className="text-sm">
                      {formatarDataSimples(agendamento.data_agendamento)}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-gray-700 mb-4" />

              {/* Detalhes */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                    {agendamento.profissionais?.foto_url ? (
                      <img 
                        src={agendamento.profissionais.foto_url} 
                        alt={agendamento.profissionais.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Colaborador</p>
                    <p className="text-white font-medium">{agendamento.profissionais?.nome}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-400">Serviços</p>
                  <p className="text-white font-medium">{agendamento.servicos?.nome}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Histórico Passado */}
      {historicoPassado.map((grupo) => (
        <div key={grupo.titulo} className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-300 capitalize">
            {grupo.titulo}
          </h2>
          
          {grupo.items.map((item) => (
            <div key={item.id} className="bg-gray-800 rounded-2xl p-4 mb-4 border border-gray-700">
              {/* Data e Horário */}
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <Calendar size={16} className="mr-2 text-gray-400" />
                  <span className="text-gray-300 text-sm">
                    {formatarData(item.data_agendamento)}
                  </span>
                </div>
                
                <div className="flex items-center mb-2">
                  <Clock size={16} className="mr-2 text-gray-400" />
                  <span className="text-gray-300 text-sm">
                    {formatarHorario(item.horario_inicio, item.horario_fim)}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2 text-gray-400" />
                  <span className="text-white font-medium">
                    {item.unidades?.nome}
                  </span>
                </div>
              </div>

              <hr className="border-gray-700 mb-4" />

              {/* Detalhes e Avaliação */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Profissional</p>
                    <p className="text-white">{item.profissionais?.nome}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Serviços</p>
                    <p className="text-white">{item.servicos?.nome}</p>
                  </div>
                </div>

                {/* Avaliação */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                  <span className="text-gray-300">Avaliar</span>
                  {renderizarEstrelas(item.avaliacao)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Mensagem quando não há dados */}
      {agendamentosAbertos.length === 0 && historicoPassado.length === 0 && (
        <div className="text-center text-gray-400 mt-12">
          <Scissors size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhum agendamento encontrado</p>
        </div>
      )}
    </div>
  );
};

export default Historico;
