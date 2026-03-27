"use client";

import { 
  Calendar, 
  Clock, 
  CalendarCheck, 
  Map, 
  Home,
  PartyPopper,
  CheckCircle2,
  AlertCircle,
  FileSignature,
  Edit3
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";


export default function ColaboradorPage() {
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  
  // States for decision
  const [isRejecting, setIsRejecting] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!userData) return;
    setLoading(true);
    
    // Busca a última solicitação para a matrícula do usuário logado
    const { data, error } = await supabase
      .from('ferias')
      .select('*')
      .eq('matricula', userData.matricula)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (!error && data && data.length > 0) {
      setRequest(data[0]);
    } else {
      setRequest(null);
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

  const handleAssinar = async () => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('ferias')
      .update({ status: 'confirmado' })
      .eq('id', request.id);
      
    setIsSubmitting(false);
    if (!error) {
      alert("Assinatura digital realizada com sucesso!");
      fetchData();
    } else {
      alert("Erro ao assinar: " + error.message);
    }
  };

  const handleSolicitarAlteracao = async () => {
    if (!observacao.trim()) {
      alert("Por favor, preencha o motivo da alteração.");
      return;
    }
    
    setIsSubmitting(true);
    const { error } = await supabase
      .from('ferias')
      .update({ 
        status: 'ajuste_pendente',
        observacao_colaborador: observacao 
      })
      .eq('id', request.id);
      
    setIsSubmitting(false);
    if (!error) {
      alert("Solicitação de alteração enviada ao coordenador!");
      setIsRejecting(false);
      fetchData();
    } else {
      alert("Erro ao solicitar alteração. O migration3 rodou? Detalhes: " + error.message);
    }
  };

  let daysRemaining = null;
  if (request && !['rejeitado', 'ajuste_pendente'].includes(request.status)) {
    const s = new Date(request.data_inicio + 'T12:00:00Z');
    const now = new Date();
    const diff = s.getTime() - now.getTime();
    daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1; 
  };

  return (
    <ProtectedRoute allowedProfiles={['Colaborador']}>
      <Header />
      <div className="min-h-screen bg-zinc-50/50 p-4 md:p-8 font-sans text-zinc-900">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center text-sm font-medium text-zinc-500 mb-2">
          <Link href="/" className="flex items-center hover:text-blue-600 transition-colors">
            <Home size={16} className="mr-2" /> Início
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-900">Meu Portal</span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Bem-vindo(a), {userData ? userData.nome : "Colaborador"}!
            </h1>
            <p className="text-zinc-500 mt-1">Acompanhe seu saldo e confirme suas Férias.</p>
          </div>
        </div>

        {/* Upcoming Vacation Banner */}
        {loading ? (
             <div className="bg-zinc-100 animate-pulse h-24 rounded-2xl w-full"></div>
        ) : request && !['rejeitado', 'ajuste_pendente'].includes(request.status) && daysRemaining !== null ? (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shadow-inner mt-1 md:mt-0">
                <PartyPopper size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                  {daysRemaining > 0 
                    ? `Faltam ${daysRemaining} dias para o seu descanso!` 
                    : "Suas férias já começaram!"}
                </h2>
                <p className="text-blue-100 mt-1 font-medium">
                  Suas férias estão programadas de {new Date(request.data_inicio + 'T12:00:00Z').toLocaleDateString('pt-BR')} a {new Date(request.data_fim + 'T12:00:00Z').toLocaleDateString('pt-BR')}.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-800 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-center">
             <h2 className="text-xl font-bold tracking-tight">Nenhum agendamento de férias encontrado para você no momento.</h2>
             <p className="text-zinc-400 mt-1 font-medium">Seu coordenador precisa iniciar o processo para que ele apareça aqui.</p>
          </div>
        )}

        {/* Decision Card for "pendente_colaborador" */}
        {request && request.status === 'pendente_colaborador' && !isRejecting && (
          <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl border border-indigo-100 shadow-md p-6 sm:p-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start gap-4">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-sm mt-1">
                <FileSignature size={28} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold text-indigo-950 mb-2">Conferência de Agendamento</h2>
                <div className="bg-white p-5 rounded-2xl border border-indigo-50 mb-6 shadow-sm">
                  <p className="text-zinc-600 text-lg">
                    Seu coordenador agendou suas férias para <strong className="text-zinc-900">{new Date(request.data_inicio + 'T12:00:00Z').toLocaleDateString('pt-BR')}</strong> por <strong className="text-zinc-900">{calculateDays(request.data_inicio, request.data_fim)} dias</strong>.
                  </p>
                  <p className="text-zinc-600 text-lg mt-2">
                    Adiantamento de 13º: <strong className={request.adiantamento_decimo ? "text-indigo-600" : "text-zinc-500"}>{request.adiantamento_decimo ? "Sim" : "Não"}</strong>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleAssinar}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-bold text-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    <CheckCircle2 size={24} />
                    {isSubmitting ? "Assinando..." : "Concordar e Assinar"}
                  </button>
                  <button 
                    onClick={() => setIsRejecting(true)}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-4 rounded-2xl font-bold text-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <Edit3 size={24} />
                    Solicitar Alteração
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Form */}
        {request && request.status === 'pendente_colaborador' && isRejecting && (
           <div className="bg-amber-50 rounded-3xl border border-amber-200 shadow-md p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
             <h2 className="text-xl font-bold text-amber-900 mb-2 flex items-center gap-2">
               <AlertCircle size={24} />
               Sugerir Nova Data / Motivo
             </h2>
             <p className="text-amber-700 mb-4">Escreva abaixo qual a nova data desejada ou o motivo pelo qual o agendamento atual não pode ser assinado. Isto voltará para o coordenador.</p>
             
             <textarea 
               autoFocus
               value={observacao}
               onChange={e => setObservacao(e.target.value)}
               className="w-full h-32 p-4 rounded-xl border border-amber-300 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none mb-4"
               placeholder="Ex: Gostaria de alterar do dia 15 para o dia 20..."
             />

             <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button 
                  onClick={() => setIsRejecting(false)}
                  className="px-6 py-3 bg-white border border-amber-300 text-amber-800 rounded-xl font-bold hover:bg-amber-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSolicitarAlteracao}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? "Enviando..." : "Enviar Solicitação"}
                </button>
             </div>
           </div>
        )}

        {/* Timeline */}
        {loading ? (
             <div className="text-center py-10 text-zinc-500">Carregando histórico...</div>
        ) : request && (
          <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6 sm:p-10">
            <h2 className="text-xl font-bold text-zinc-900 mb-10">Histórico do Processo</h2>
            
            <div className="relative border-l-2 border-zinc-100/80 ml-4 space-y-10 pl-8 pb-4">
              
              {/* Step 1: Coordinator created it */}
              <div className="relative">
                <div className="absolute -left-[45px] bg-emerald-100 border-[6px] border-white p-1 rounded-full text-emerald-600 shadow-sm">
                  <CheckCircle2 size={16} className="fill-emerald-600 text-white" />
                </div>
                <div className="pt-1">
                  <h3 className="font-bold text-zinc-900 text-lg">Processo Aberto pelo Coordenador</h3>
                  <p className="text-zinc-500 mt-1 font-medium">O coordenador {request.coordenador} gerou o documento de agendamento de férias.</p>
                  <div className="flex items-center gap-2 text-sm text-zinc-400 mt-2 font-semibold bg-zinc-50 px-3 py-1.5 rounded-lg inline-flex">
                    <Calendar size={16} /> {new Date(request.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* Status Variations for Step 2 */}
              {request.status === 'pendente_colaborador' && (
                <div className="relative">
                  <div className="absolute -left-[45px] bg-indigo-100 border-[6px] border-white p-1 rounded-full text-indigo-600 shadow-sm animate-pulse">
                    <FileSignature size={16} className="text-indigo-600" />
                  </div>
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 mt-1 shadow-sm flex flex-col gap-4">
                    <div>
                      <h3 className="font-bold text-indigo-900 text-lg">Aguardando Sua Assinatura</h3>
                      <p className="text-indigo-800/80 mt-1 font-medium text-base">O documento está pronto e aguarda seu 'De Acordo' digital no painel acima.</p>
                    </div>
                    {request.observacao_coordenador && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                        <div className="flex items-center gap-2 text-red-800 font-bold mb-1">
                          <AlertCircle size={16} />
                          Retorno da Coordenação:
                        </div>
                        <p className="text-red-900/80 font-medium italic">"{request.observacao_coordenador}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {request.status === 'ajuste_pendente' && (
                <div className="relative">
                  <div className="absolute -left-[45px] bg-amber-100 border-[6px] border-white p-1 rounded-full text-amber-600 shadow-sm">
                    <AlertCircle size={16} className="fill-amber-600 text-white" />
                  </div>
                  <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 mt-1 shadow-sm">
                    <h3 className="font-bold text-amber-900 text-lg">Devolvido para Ajuste</h3>
                    <p className="text-amber-800/80 mt-1 font-medium text-base">Você solicitou uma alteração com a seguinte observação:</p>
                    <div className="mt-3 p-3 bg-white/60 rounded-lg text-amber-900 font-medium italic border border-amber-200/50">
                      "{request.observacao_colaborador}"
                    </div>
                  </div>
                </div>
              )}

              {['confirmado', 'aprovado'].includes(request.status) && (
                <>
                  <div className="relative">
                    <div className="absolute -left-[45px] bg-emerald-100 border-[6px] border-white p-1 rounded-full text-emerald-600 shadow-sm">
                      <CheckCircle2 size={16} className="fill-emerald-600 text-white" />
                    </div>
                    <div className="pt-1">
                      <h3 className="font-bold text-zinc-900 text-lg">Assinatura Digital Realizada</h3>
                      <p className="text-zinc-500 mt-1 font-medium">Você aceitou as datas propostas e assinou digitalmente o documento.</p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[45px] bg-blue-100 border-[6px] border-white p-1 rounded-full text-blue-600 shadow-sm">
                      <CheckCircle2 size={16} className="fill-blue-600 text-white" />
                    </div>
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mt-1 shadow-sm">
                      <h3 className="font-bold text-blue-900 text-lg">Processo Finalizado (RH)</h3>
                      <p className="text-blue-800/80 mt-1 font-medium text-base">Suas férias estão averbadas no sistema. Boas férias!</p>
                    </div>
                  </div>
                </>
              )}

              {/* Status Variations for Step 3 - Optional */}
            </div>
          </div>
        )}

      </div>
      </div>
    </ProtectedRoute>
  );
}
