"use client";

import { Users, UserCog, User, X, LogIn, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Se o usuário já estiver logado, redireciona para a home correta
    const data = localStorage.getItem("userData");
    if (data) {
      try {
        const user = JSON.parse(data);
        const p = user.perfil?.toLowerCase();
        if (p === "analista") router.push("/analista");
        else if (p === "coordenador") router.push("/coordenador");
        else if (p === "colaborador") router.push("/colaborador");
      } catch (e) {
        localStorage.removeItem("userData");
      }
    }
  }, [router]);

  const handleOpenModal = (profile: string) => {
    setSelectedProfile(profile);
    setEmail("");
    setMatricula("");
    setSenha("");
    setErrorMsg("");
  };

  const handleCloseModal = () => {
    setSelectedProfile(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    let query = supabase.from('usuarios').select('*').eq('senha', senha);
    
    if (selectedProfile === 'Colaborador') {
      query = query.eq('matricula', matricula);
    } else {
      query = query.eq('email', email);
    }

    const { data, error } = await query;

    if (error) {
      setErrorMsg("Erro ao conectar ao banco de dados.");
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setErrorMsg("Acesso negado: Perfil incompatível ou credenciais incorretas. Caso o erro persista, por favor, procure o RH para atualizar seu cadastro.");
      setLoading(false);
      return;
    }

    const user = data[0];

    if (user.perfil?.toLowerCase() !== selectedProfile?.toLowerCase()) {
      setErrorMsg("Acesso negado: Perfil incompatível ou credenciais incorretas. Caso o erro persista, por favor, procure o RH para atualizar seu cadastro.");
      setLoading(false);
      return;
    }

    // Sucesso
    localStorage.setItem("userData", JSON.stringify({
      id: user.id,
      nome: user.nome,
      perfil: user.perfil,
      matricula: user.matricula
    }));

    const p = user.perfil?.toLowerCase();
    if (p === "analista") router.push("/analista");
    else if (p === "coordenador") router.push("/coordenador");
    else if (p === "colaborador") router.push("/colaborador");
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <main className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 mb-4 tracking-tight">Sistema de Gestão de Férias</h1>
          <p className="text-lg md:text-xl text-zinc-600">Selecione seu perfil de acesso para continuar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => handleOpenModal('Analista')}
            className="flex flex-col items-center bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 transition-all cursor-pointer group w-full text-left"
          >
            <div className="bg-blue-50 p-5 rounded-2xl text-blue-600 mb-5 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <UserCog size={36} />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">Analista (Admin)</h2>
            <p className="text-center text-sm text-zinc-500 font-medium">
              Visão geral do sistema, configurações e controle total sobre as solicitações.
            </p>
          </button>

          <button 
            onClick={() => handleOpenModal('Coordenador')}
            className="flex flex-col items-center bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 hover:shadow-xl hover:border-green-500 hover:-translate-y-1 transition-all cursor-pointer group w-full text-left"
          >
            <div className="bg-green-50 p-5 rounded-2xl text-green-600 mb-5 group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm">
              <Users size={36} />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">Coordenador</h2>
            <p className="text-center text-sm text-zinc-500 font-medium">
              Gerenciamento da equipe direta, aprovação/rejeição de férias dos subordinados.
            </p>
          </button>

          <button 
            onClick={() => handleOpenModal('Colaborador')}
            className="flex flex-col items-center bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 hover:shadow-xl hover:border-purple-500 hover:-translate-y-1 transition-all cursor-pointer group w-full text-left"
          >
            <div className="bg-purple-50 p-5 rounded-2xl text-purple-600 mb-5 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
              <User size={36} />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">Colaborador</h2>
            <p className="text-center text-sm text-zinc-500 font-medium">
              Visualização de saldo de férias, novas solicitações e acompanhamento.
            </p>
          </button>
        </div>
      </main>

      {/* Login Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                <LogIn size={24} className="text-blue-600" />
                Login como {selectedProfile}
              </h2>
              <button 
                onClick={handleCloseModal} 
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-2 rounded-xl hover:bg-zinc-200/80 hover:shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleLogin} className="p-6 md:p-8 space-y-5">
              
              {errorMsg && (
                <div className="bg-red-50 text-red-700 text-sm font-medium p-4 rounded-xl border border-red-200 flex gap-2 items-start shadow-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}

              {selectedProfile === 'Colaborador' ? (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Matrícula</label>
                  <input 
                    type="text" 
                    required
                    value={matricula}
                    onChange={e => setMatricula(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-zinc-900"
                    placeholder="Ex: 1005"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">E-mail Corporativo</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-zinc-900"
                    placeholder="Ex: jose@empresa.com"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Senha</label>
                <input 
                  type="password" 
                  required
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-zinc-900"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {loading ? (
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Entrando...
                    </div>
                  ) : "Acessar Sistema"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
