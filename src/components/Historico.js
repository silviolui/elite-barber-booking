import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Star, User, Scissors } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AgendamentoModal from './AgendamentoModal';

const Historico = ({ usuarioId }) => {
  const [agendamentosAbertos, setAgendamentosAbertos] = useState([]);
  const [historicoPassado, setHistoricoPassado] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (usuarioId) {
      carregarDados();
    }
  }, [usuarioId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    console.log('Carregando agendamentos para usuário:', usuarioId);
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('status', 'pending')
      .gte('data_agendamento', new Date().toISOString().split('T')[0])
      .order('data_agendamento', { ascending: true });

    console.log('Agendamentos encontrados:', data, 'Erro:', error);
    if (!error && data) {
      // Carregar dados relacionados separadamente
      const agendamentosComDetalhes = await Promise.all(
        data.map(async (agendamento) => {
          const [profissional, unidade, servico] = await Promise.all([
            supabase.from('profissionais').select('nome, foto_url').eq('id', agendamento.profissional_id).single(),
            supabase.from('unidades').select('nome').eq('id', agendamento.unidade_id).single(),
            agendamento.servico_id ? 
              supabase.from('servicos').select('nome, duracao').eq('id', agendamento.servico_id).single() :
              Promise.resolve({ data: { nome: 'Serviço não especificado', duracao: 30 } })
          ]);
          
          return {
            ...agendamento,
            profissionais: profissional.data,
            unidades: unidade.data,
            servicos: servico.data
          };
        })
      );
      
      setAgendamentosAbertos(agendamentosComDetalhes);
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

  const abrirModal = (agendamento) => {
    setAgendamentoSelecionado(agendamento);
    setShowModal(true);
  };

  const fecharModal = () => {
    setAgendamentoSelecionado(null);
    setShowModal(false);
  };

  const confirmarAgendamento = async (agendamentoId) => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'confirmed' })
        .eq('id', agendamentoId);

      if (!error) {
        // Atualizar a lista local
        setAgendamentosAbertos(prev => 
          prev.map(ag => 
            ag.id === agendamentoId 
              ? { ...ag, status: 'confirmed' }
              : ag
          )
        );
        fecharModal();
        // Recarregar dados para atualizar a tela
        carregarDados();
      }
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
    }
  };

  const desmarcarAgendamento = async (agendamentoId) => {
    try {
      // Primeiro, buscar o agendamento completo
      const { data: agendamento, error: fetchError } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('id', agendamentoId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar agendamento:', fetchError);
        return;
      }

      // Inserir no histórico com status cancelado
      const { error: insertError } = await supabase
        .from('historico')
        .insert({
          agendamento_id: agendamento.id,
          usuario_id: agendamento.usuario_id,
          profissional_id: agendamento.profissional_id,
          unidade_id: agendamento.unidade_id,
          servico_id: agendamento.servico_id,
          data_agendamento: agendamento.data_agendamento,
          horario_inicio: agendamento.horario_inicio,
          horario_fim: agendamento.horario_fim,
          status: 'cancelado',
          valor_total: agendamento.preco_total,
          data_conclusao: new Date().toISOString()
        });

      if (insertError) {
        console.error('Erro ao inserir no histórico:', insertError);
        return;
      }

      // Deletar da tabela agendamentos
      const { error: deleteError } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', agendamentoId);

      if (!deleteError) {
        fecharModal();
        // Recarregar dados para atualizar a tela
        carregarDados();
      } else {
        console.error('Erro ao deletar agendamento:', deleteError);
      }
    } catch (error) {
      console.error('Erro ao desmarcar agendamento:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Histórico</h1>

      {/* Agendamentos em Aberto */}
      {agendamentosAbertos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Agendamento em aberto</h2>
          
          {agendamentosAbertos.map((agendamento) => (
            <div 
              key={agendamento.id} 
              className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => abrirModal(agendamento)}
            >
              {/* Cabeçalho do Card */}
              <div className="mb-4">
                <h3 className="text-gray-900 font-medium text-lg mb-2">
                  {agendamento.unidades?.nome}
                </h3>
                
                <div className="flex items-center justify-between text-gray-600">
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2 text-orange-500" />
                    <span className="text-sm">
                      {formatarHorario(agendamento.horario_inicio, agendamento.horario_fim)}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2 text-orange-500" />
                    <span className="text-sm">
                      {formatarDataSimples(agendamento.data_agendamento)}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200 mb-4" />

              {/* Detalhes */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-3 overflow-hidden">
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
                    <p className="text-sm text-gray-500">Colaborador</p>
                    <p className="text-gray-900 font-medium">{agendamento.profissionais?.nome}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">Serviços</p>
                  <p className="text-gray-900 font-medium">{agendamento.servicos?.nome}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Histórico Passado */}
      {historicoPassado.map((grupo) => (
        <div key={grupo.titulo} className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-700 capitalize">
            {grupo.titulo}
          </h2>
          
          {grupo.items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 shadow-sm">
              {/* Data e Horário */}
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <Calendar size={16} className="mr-2 text-orange-500" />
                  <span className="text-gray-600 text-sm">
                    {formatarData(item.data_agendamento)}
                  </span>
                </div>
                
                <div className="flex items-center mb-2">
                  <Clock size={16} className="mr-2 text-orange-500" />
                  <span className="text-gray-600 text-sm">
                    {formatarHorario(item.horario_inicio, item.horario_fim)}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2 text-orange-500" />
                  <span className="text-gray-900 font-medium">
                    {item.unidades?.nome}
                  </span>
                </div>
              </div>

              <hr className="border-gray-200 mb-4" />

              {/* Detalhes e Avaliação */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Profissional</p>
                    <p className="text-gray-900">{item.profissionais?.nome}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Serviços</p>
                    <p className="text-gray-900">{item.servicos?.nome}</p>
                  </div>
                </div>

                {/* Avaliação */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Avaliar</span>
                  {renderizarEstrelas(item.avaliacao)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Mensagem quando não há dados */}
      {agendamentosAbertos.length === 0 && historicoPassado.length === 0 && (
        <div className="text-center text-gray-500 mt-12">
          <Scissors size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhum agendamento encontrado</p>
        </div>
      )}

      {/* Modal de Agendamento */}
      {showModal && (
        <AgendamentoModal 
          agendamento={agendamentoSelecionado}
          onClose={fecharModal}
          onConfirmar={confirmarAgendamento}
          onDesmarcar={desmarcarAgendamento}
        />
      )}
    </div>
  );
};

export default Historico;
