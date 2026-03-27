"use client";

import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter,
  Home,
  CreditCard,
  MessageSquareWarning,
  History,
  Download
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";


export default function AnalistaPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States para filtros e abas
  const [activeTab, setActiveTab] = useState<'pendentes' | 'confirmados' | 'ajustes'>('pendentes');
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); 

  const fetchData = async () => {
    setLoading(true);
    const { data: fetchResult, error } = await supabase.from('ferias').select('*').order('created_at', { ascending: false });
    if (!error && fetchResult) {
      setData(fetchResult);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleExportCSV = () => {
    const confirmadosList = data.filter(r => r.status === 'confirmado' || r.status === 'aprovado');
    
    // Filtro mês se houver
    const exportList = confirmadosList.filter(r => {
      if (selectedMonth === 'all') return true;
      if (!r.data_inicio) return false;
      const rMonth = r.data_inicio.substring(0, 7);
      return rMonth === selectedMonth;
    });

    if (exportList.length === 0) {
      alert("Nenhum registro confirmado para exportar com os filtros atuais.");
      return;
    }

    const headers = ["Nome", "Matrícula", "Data Início", "Dias", "Adiantamento 13º"];
    const rows = exportList.map(r => [
      `"${r.nome_colaborador}"`,
      `"${r.matricula}"`,
      `"${new Date(r.data_inicio + 'T12:00:00Z').toLocaleDateString('pt-BR')}"`,
      `"${calculateDays(r.data_inicio, r.data_fim)}"`,
      `"${r.adiantamento_decimo ? 'Sim' : 'Não'}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ferias_confirmadas_${selectedMonth === 'all' ? 'geral' : selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Gerar opções de meses baseadas nos dados existentes
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    data.forEach(r => {
      if (r.data_inicio) {
        months.add(r.data_inicio.substring(0, 7)); // Formato YYYY-MM
      }
    });
    return Array.from(months).sort().reverse();
  }, [data]);

  // Contadores dinâmicos
  const uniqueColab = new Set(data.map(r => r.matricula)).size; 
  const aguardando = data.filter(r => r.status === 'pendente_colaborador').length;
  const confirmados = data.filter(r => r.status === 'confirmado' || r.status === 'aprovado').length;
  const ajustes = data.filter(r => r.status === 'ajuste_pendente').length;

  // Filtragem dos dados para a tabela
  const filteredData = data.filter(r => {
    // Filtro Tab
    let tabMatch = false;
    if (activeTab === 'pendentes') tabMatch = r.status === 'pendente_colaborador';
    else if (activeTab === 'confirmados') tabMatch = (r.status === 'confirmado' || r.status === 'aprovado');
    else if (activeTab === 'ajustes') tabMatch = r.status === 'ajuste_pendente';
    else tabMatch = true;

    // Filtro Mês
    let monthMatch = true;
    if (selectedMonth !== 'all' && r.data_inicio) {
      monthMatch = r.data_inicio.substring(0, 7) === selectedMonth;
    } else if (selectedMonth !== 'all' && !r.data_inicio) {
      monthMatch = false;
    }

    return tabMatch && monthMatch;
  });

  return (
    <ProtectedRoute allowedProfiles={['Analista']}>
      <Header />
      <div className="min-h-screen bg-zinc-50/50 p-4 md:p-8 font-sans text-zinc-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation / Breadcrumb */}
        <div className="flex items-center text-sm font-medium text-zinc-500 mb-2">
          <Link href="/" className="flex items-center hover:text-blue-600 transition-colors">
            <Home size={16} className="mr-2" /> Início
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-900">RH & Analista</span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Painel de Controle de Férias</h1>
            <p className="text-zinc-500 mt-1">Acompanhe e analise a folha de programação de férias.</p>
          </div>
          
          <div className="flex flex-wrap shadow-sm items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center bg-white border border-zinc-200 rounded-lg p-1.5 px-4">
              <span className="text-sm font-medium text-zinc-500 mr-2">Competência:</span>
              <select 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-transparent text-zinc-800 font-bold focus:outline-none cursor-pointer py-1"
              >
                <option value="all">Todo o período</option>
                {availableMonths.map(m => {
                  const [y, mm] = m.split('-');
                  return <option key={m} value={m}>{mm}/{y}</option>;
                })}
              </select>
            </div>
            
            <button 
              onClick={fetchData}
              className="flex-1 lg:flex-none justify-center items-center flex gap-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-5 py-3 rounded-lg font-medium transition-all shadow-sm"
            >
              <History size={18} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all flex items-center gap-5">
            <div className="bg-blue-50 p-4 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
              <Users size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Colaboradores c/ Registros</p>
              <p className="text-3xl font-bold text-zinc-900 tracking-tight">{uniqueColab}</p>
            </div>
          </div>
          
          <div className="group bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all flex items-center gap-5">
            <div className="bg-indigo-50 p-4 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Aguardando Assinatura</p>
              <p className="text-3xl font-bold text-zinc-900 tracking-tight">{aguardando}</p>
            </div>
          </div>

          <div className="group bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all flex items-center gap-5">
            <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Confirmados p/ Folha</p>
              <p className="text-3xl font-bold text-zinc-900 tracking-tight">{confirmados}</p>
            </div>
          </div>
        </div>

        {/* Management Board */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden flex flex-col">
          
          {/* Header & Tabs */}
          <div className="p-6 pb-0 border-b border-zinc-100 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-zinc-900">Relatório Operacional</h2>
              <div className="flex gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                <div className="relative flex-1 sm:w-64 group">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Buscar colaborador..." 
                    className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  />
                </div>
                <button className="p-2 border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100 rounded-xl text-zinc-600 transition-colors">
                  <Filter size={20} />
                </button>
              </div>
            </div>

            {/* Status Tabs with Export Conditional */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-transparent w-full">
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                <button 
                  onClick={() => setActiveTab('pendentes')}
                  className={`flex items-center gap-2 pb-4 px-4 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'pendentes' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Pendentes (Colaborador)
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === 'pendentes' ? 'bg-indigo-100 text-indigo-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {aguardando}
                  </span>
                </button>
                <button 
                  onClick={() => setActiveTab('confirmados')}
                  className={`flex items-center gap-2 pb-4 px-4 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'confirmados' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Confirmados
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === 'confirmados' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {confirmados}
                  </span>
                </button>
                <button 
                  onClick={() => setActiveTab('ajustes')}
                  className={`flex items-center gap-2 pb-4 px-4 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'ajustes' ? 'border-amber-500 text-amber-700' : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Ajustes / Recusas
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === 'ajustes' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {ajustes}
                  </span>
                </button>
              </div>
              
              {/* Conditional Export Button */}
              {activeTab === 'confirmados' && (
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center shrink-0 justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 mb-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
                >
                  <Download size={16} />
                  Exportar Confirmados (CSV)
                </button>
              )}
            </div>
          </div>
          
          {/* Table content */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50/80 border-b border-zinc-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-widest text-[11px]">Colaborador</th>
                  <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-widest text-[11px]">Período</th>
                  <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-widest text-[11px] text-center">Dias</th>
                  <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-widest text-[11px] text-center">13º Adiantado</th>
                  <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-widest text-[11px]">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                       Buscando os dados operacionais mais recentes...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                       <p className="font-semibold text-lg text-zinc-400 mb-1">Filtro Limpo</p>
                       Não há registros nesta categoria no momento.
                    </td>
                  </tr>
                ) : filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-900 group-hover:text-blue-600 transition-colors cursor-pointer">{row.nome_colaborador}</span>
                        <span className="text-xs text-zinc-500 mt-0.5">Matrícula: {row.matricula}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-zinc-700 font-medium">
                         {row.data_inicio ? new Date(row.data_inicio + 'T12:00:00Z').toLocaleDateString('pt-BR') : '-'}
                       </span> 
                       <span className="text-zinc-400 mx-1">até</span> 
                       <span className="text-zinc-700 font-medium">
                         {row.data_fim ? new Date(row.data_fim + 'T12:00:00Z').toLocaleDateString('pt-BR') : '-'}
                       </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-zinc-700 tabular-nums text-center">
                       {row.data_inicio && row.data_fim ? calculateDays(row.data_inicio, row.data_fim) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.adiantamento_decimo ? (
                        <div className="inline-flex items-center justify-center p-2 bg-indigo-50 text-indigo-600 rounded-xl" title="Adiantamento de 13º solicitado">
                           <CreditCard size={18} />
                           <span className="ml-2 font-semibold text-xs">Sim</span>
                        </div>
                      ) : (
                        <span className="text-zinc-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 text-sm max-w-[250px] truncate">
                      {row.observacao_colaborador ? (
                        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/50" title={row.observacao_colaborador}>
                          <MessageSquareWarning size={16} className="shrink-0" />
                          <span className="truncate">{row.observacao_colaborador}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-300 italic">Nenhuma</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      </div>
    </ProtectedRoute>
  );
}
