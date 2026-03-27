"use client";

import { 
  CalendarDays, 
  User, 
  Clock,
  History,
  Home,
  Plus,
  X,
  CreditCard,
  AlertCircle,
  FileEdit,
  MessageSquareWarning
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";


export default function CoordenadorPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  
  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'abertos' | 'revisar' | 'historico'>('abertos');

  // Form State
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dias, setDias] = useState<number>(15);
  const [decimo, setDecimo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!userData) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('ferias')
      .select('*')
      .eq('coordenador', userData.nome)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userData) {
      fetchData();
    }
  }, [userData]);

  useEffect(() => {
    const data = localStorage.getItem("userData");
    if (data) {
      setUserData(JSON.parse(data));
    } else {
      setLoading(false);
    }
  }, []);

  const handleOpenModal = () => {
    setEditingId(null);
    setNome("");
    setMatricula("");
    setDataInicio("");
    setDias(15);
    setDecimo(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleRecusarAjuste = async (id: string) => {
    if (window.confirm("O agendamento retornará para a tela do colaborador com as datas originais e uma mensagem recusando o ajuste. Confirmar?")) {
      const { error } = await supabase
        .from('ferias')
        .update({ 
          status: 'pendente_colaborador',
          observacao_coordenador: 'Ajuste não disponível. Favor procurar o coordenador pessoalmente.'
        })
        .eq('id', id);
        
      if (!error) {
        fetchData();
      } else {
        alert("Erro no banco: rode a migration4.sql! Erro detalhado: " + error.message);
      }
    }
  };

  const handleEdit = (req: any) => {
    setEditingId(req.id);
    setNome(req.nome_colaborador);
    setMatricula(req.matricula);
    if(req.data_inicio) {
      setDataInicio(req.data_inicio.split('T')[0]);
    }
    setDias(calculateDays(req.data_inicio, req.data_fim));
    setDecimo(req.adiantamento_decimo || false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const startObj = new Date(dataInicio + 'T12:00:00Z');
    const endObj = new Date(startObj);
    endObj.setDate(endObj.getDate() + (dias - 1));
    
    const payload = {
      nome_colaborador: nome,
      matricula: matricula,
      data_inicio: startObj.toISOString().split('T')[0],
      data_fim: endObj.toISOString().split('T')[0],
      status: "pendente_colaborador", 
      coordenador: userData?.nome || "Coordenador", 
      adiantamento_decimo: decimo
    };

    let error = null;

    if (editingId) {
      const { error: updateError } = await supabase.from('ferias').update(payload).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('ferias').insert([payload]);
      error = insertError;
    }
    
    setIsSubmitting(false);
    if (!error) {
      handleCloseModal();
      fetchData();
    } else {
      alert("Erro ao salvar! Detalhes: " + error.message);
    }
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  // Contadores
  const countAbertos = requests.filter(r => r.status === 'pendente_colaborador').length;
  const countRevisar = requests.filter(r => r.status === 'ajuste_pendente').length;
  const countHistorico = requests.filter(r => !['pendente_colaborador', 'ajuste_pendente'].includes(r.status)).length;

  const filteredRequests = requests.filter(req => {
    if (activeTab === 'abertos') return req.status === 'pendente_colaborador';
    if (activeTab === 'revisar') return req.status === 'ajuste_pendente';
    if (activeTab === 'historico') return !['pendente_colaborador', 'ajuste_pendente'].includes(req.status);
    return true;
  });

  return (
    <ProtectedRoute allowedProfiles={['Coordenador']}>
      <Header />
      <div className="min-h-screen bg-zinc-50/50 p-4 md:p-8 font-sans text-zinc-900">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center text-sm font-medium text-zinc-500 mb-2">
          <Link href="/" className="flex items-center hover:text-blue-600 transition-colors">
            <Home size={16} className="mr-2" /> Início
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-900">Coordenador</span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Gestão de Férias - Equipe</h1>
            <p className="text-zinc-500 mt-1">Abra e revise processos de Férias para seus colaboradores diretos.</p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <button 
              onClick={handleOpenModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm group"
            >
              <Plus size={18} className="transition-transform group-hover:rotate-90 duration-300" />
              Novo Agendamento
            </button>
            <button 
              onClick={fetchData}
              className="flex items-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm"
            >
              <History size={18} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Board & Tabs */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden flex flex-col">
          
          {/* Status Tabs */}
          <div className="flex p-6 pb-0 border-b border-zinc-100 gap-2 overflow-x-auto hide-scrollbar">
            <button 
              onClick={() => setActiveTab('abertos')}
              className={`flex items-center gap-2 pb-4 px-4 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'abertos' ? 'border-blue-600 text-blue-700' : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Em Aberto 
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === 'abertos' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-500'}`}>
                {countAbertos}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('revisar')}
              className={`flex items-center gap-2 pb-4 px-4 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'revisar' ? 'border-amber-500 text-amber-700' : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Aguardando Ajuste
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === 'revisar' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-500'}`}>
                {countRevisar}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('historico')}
              className={`flex items-center gap-2 pb-4 px-4 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'historico' ? 'border-zinc-800 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Histórico
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === 'historico' ? 'bg-zinc-200 text-zinc-800' : 'bg-zinc-100 text-zinc-500'}`}>
                {countHistorico}
              </span>
            </button>
          </div>
        
          <div className="p-6 space-y-4 min-h-[300px] bg-zinc-50/30">
            {loading ? (
               <div className="text-center py-12 text-zinc-500">Carregando dados...</div>
            ) : filteredRequests.length === 0 ? (
               <div className="bg-white p-8 rounded-2xl border border-zinc-200/80 text-center shadow-sm">
                 <div className="flex justify-center mb-4 text-zinc-300"><History size={48} /></div>
                 <h3 className="text-lg font-semibold text-zinc-900 mb-2">Sem registros</h3>
                 <p className="text-zinc-500">Nenhum processo de férias pendente nesta categoria.</p>
               </div>
            ) : filteredRequests.map((req) => (
              <div key={req.id} className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm hover:shadow-md hover:border-blue-500/20 transition-all flex flex-col lg:flex-row justify-between gap-6">
                
                {/* Employee Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="bg-blue-50 p-3 rounded-full text-blue-600 mt-1 shrink-0">
                    <User size={24} />
                  </div>
                  <div className="w-full">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                      <h3 className="text-lg font-semibold text-zinc-900">{req.nome_colaborador}</h3>
                      <span className="text-sm text-zinc-500">Matrícula: {req.matricula}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm mt-4 lg:mt-0">
                      <div className="flex items-center gap-2 text-zinc-600 bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-100">
                        <CalendarDays size={16} className="text-zinc-400" />
                        <span className="font-medium text-zinc-800">
                           {req.data_inicio ? new Date(req.data_inicio + 'T12:00:00Z').toLocaleDateString('pt-BR') : 'N/A'}
                        </span> 
                        <span className="text-zinc-400">até</span> 
                        <span className="font-medium text-zinc-800">
                           {req.data_fim ? new Date(req.data_fim + 'T12:00:00Z').toLocaleDateString('pt-BR') : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-zinc-600 bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-100">
                        <Clock size={16} className="text-zinc-400" />
                        <span><strong className="text-zinc-800 tabular-nums">{req.data_inicio && req.data_fim ? calculateDays(req.data_inicio, req.data_fim) : '?'}</strong> dias</span>
                      </div>

                      {req.adiantamento_decimo && (
                        <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-200 font-medium">
                          <CreditCard size={16} className="text-indigo-500" />
                          Adiantamento 13º
                        </div>
                      )}
                    </div>

                    {/* Exibição da Observação para Ajustes */}
                    {req.status === 'ajuste_pendente' && req.observacao_colaborador && (
                      <div className="mt-4 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl">
                        <div className="flex items-center gap-2 text-amber-800 font-bold mb-1">
                          <MessageSquareWarning size={16} />
                          Motivo do Ajuste / Recusa:
                        </div>
                        <p className="text-amber-900/80 italic">"{req.observacao_colaborador}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions / Badges */}
                <div className="flex items-center justify-start lg:justify-end min-w-[200px] border-t lg:border-t-0 border-zinc-100 pt-4 lg:pt-0">
                  {req.status === 'ajuste_pendente' ? (
                     <div className="flex flex-col gap-2 w-full">
                       <button 
                         onClick={() => handleEdit(req)}
                         className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-xl font-bold w-full transition-all shadow-sm hover:-translate-y-0.5"
                       >
                         <FileEdit size={18} />
                         Revisar Agendamento
                       </button>
                       <button 
                         onClick={() => handleRecusarAjuste(req.id)}
                         className="flex items-center justify-center gap-2 bg-transparent border-2 border-red-500 hover:bg-red-50 text-red-600 px-5 py-2.5 rounded-xl font-bold w-full transition-all"
                       >
                         <X size={18} />
                         Recusar Ajuste
                       </button>
                     </div>
                  ) : (
                     <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border ${
                        req.status === 'pendente_colaborador' ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' :
                        req.status === 'confirmado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' :
                        req.status === 'rejeitado' ? 'bg-red-50 text-red-700 border-red-200 shadow-sm' :
                        'bg-zinc-50 text-zinc-700 border-zinc-200 shadow-sm'
                     }`}>
                        {req.status === 'pendente_colaborador' ? 'Aguardando Assinatura' : req.status}
                     </span>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal de Agendamento/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200/50">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-xl font-bold text-zinc-900">
                {editingId ? "Revisar Agendamento" : "Novo Agendamento"}
              </h2>
              <button 
                onClick={handleCloseModal} 
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-2 rounded-xl hover:bg-zinc-200/50 hover:shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Nome do Colaborador</label>
                <input 
                  type="text" 
                  required
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ex: Ana Silva"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Matrícula</label>
                <input 
                  type="text" 
                  required
                  value={matricula}
                  onChange={e => setMatricula(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ex: 1005"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Data de Início</label>
                  <input 
                    type="date" 
                    required
                    value={dataInicio}
                    onChange={e => setDataInicio(e.target.value)}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-zinc-700"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Total de Dias</label>
                  <input 
                    type="number" 
                    min="1"
                    max="30"
                    required
                    value={dias}
                    onChange={e => setDias(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition-colors p-4 rounded-xl border border-zinc-200">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="peer sr-only"
                      checked={decimo}
                      onChange={e => setDecimo(e.target.checked)}
                    />
                    <div className="block bg-zinc-300 w-12 h-7 rounded-full peer-checked:bg-blue-600 transition-colors shadow-sm"></div>
                    <div className="absolute left-[3px] top-[3px] bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                  </div>
                  <span className="text-sm font-semibold text-zinc-700 select-none">
                    Solicitar Adiantamento de 13º?
                  </span>
                </label>
              </div>

              {/* Informação sobre os status de edição */}
              {editingId && (
                <div className="bg-amber-50 text-amber-800 text-xs font-medium p-3 rounded-lg border border-amber-200/50 flex gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <p>Ao salvar as alterações, este agendamento será reenviado para a caixa do Colaborador para uma nova assinatura.</p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition-colors shadow-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Salvando..." : editingId ? "Reenviar Agendamento" : "Abrir Processo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </ProtectedRoute>
  );
}
