"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Home, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";

type UserProfile = {
  id: string;
  nome: string;
  email: string;
  matricula: string;
  perfil: string;
};

export default function UsuariosAdminPage() {
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState("Colaborador");
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("usuarios").select("id, nome, email, matricula, perfil").order("nome");
    if (!error && data) {
      setUsuarios(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const newUser = {
      nome: nome,
      email: email,
      matricula: matricula,
      senha: senha,
      perfil: perfil.toLowerCase(),
    };

    const { error } = await supabase.from("usuarios").insert([newUser]);

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      if (error.code === '23505') {
        setErrorMsg("Erro: E-mail ou Matrícula já existem no sistema.");
      } else {
        setErrorMsg("Erro ao cadastrar usuário. Verifique os dados e tente novamente.");
      }
    } else {
      setSuccessMsg(`Usuário ${nome} cadastrado com sucesso!`);
      // Reset form
      setNome("");
      setEmail("");
      setMatricula("");
      setSenha("");
      setPerfil("Colaborador");
      // Refresh list
      fetchUsuarios();
    }
    setSubmitting(false);
  };

  return (
    <ProtectedRoute allowedProfiles={["Analista"]}>
      <Header />
      <div className="min-h-screen bg-zinc-50/50 p-4 md:p-8 font-sans text-zinc-900">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Navigation / Breadcrumb */}
          <div className="flex items-center text-sm font-medium text-zinc-500 mb-2">
            <Link href="/" className="flex items-center hover:text-blue-600 transition-colors">
              <Home size={16} className="mr-2" /> Início
            </Link>
            <span className="mx-2">/</span>
            <Link href="/analista" className="hover:text-blue-600 transition-colors">
              RH & Analista
            </Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-900">Gestão de Usuários</span>
          </div>

          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Link href="/analista" className="p-2 hover:bg-zinc-200 rounded-full transition-colors text-zinc-500 hover:text-zinc-900">
                  <ArrowLeft size={24} />
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Gestão de Usuários</h1>
              </div>
              <p className="text-zinc-500 mt-1 ml-11">Cadastre e gerencie os acessos do Sistema de Férias.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Form Section */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden sticky top-8">
              <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  <UserPlus size={20} />
                </div>
                <h2 className="text-xl font-bold text-zinc-900">Novo Usuário</h2>
              </div>
              
              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                {errorMsg && (
                  <div className="bg-red-50 text-red-700 text-sm font-medium p-3 rounded-lg border border-red-200 flex gap-2 items-start">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p>{errorMsg}</p>
                  </div>
                )}
                {successMsg && (
                  <div className="bg-emerald-50 text-emerald-700 text-sm font-medium p-3 rounded-lg border border-emerald-200 flex gap-2 items-start">
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                    <p>{successMsg}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="Ex: Ana Silva"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="Ex: ana@empresa.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-700">Matrícula</label>
                    <input
                      type="text"
                      required
                      value={matricula}
                      onChange={e => setMatricula(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                      placeholder="Ex: 1005"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-700">Perfil</label>
                    <select
                      value={perfil}
                      onChange={e => setPerfil(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm cursor-pointer"
                    >
                      <option value="Colaborador">Colaborador</option>
                      <option value="Coordenador">Coordenador</option>
                      <option value="Analista">Analista</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Senha Acesso</label>
                  <input
                    type="password"
                    required
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="Digite uma senha inicial"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Cadastrar Usuário
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* List Section */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-200 text-zinc-700 p-2 rounded-lg">
                    <Users size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900">Usuários Cadastrados</h2>
                </div>
                <div className="bg-white border border-zinc-200 px-3 py-1 rounded-full text-xs font-bold text-zinc-600 shadow-sm">
                  {usuarios.length} Registros
                </div>
              </div>

              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-50/80 border-b border-zinc-100">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-widest text-[11px]">Nome / E-mail</th>
                      <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-widest text-[11px]">Matrícula</th>
                      <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-widest text-[11px]">Perfil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                          Buscando usuários cadastrados...
                        </td>
                      </tr>
                    ) : usuarios.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                          Nenhum usuário cadastrado além de você.
                        </td>
                      </tr>
                    ) : usuarios.map(u => (
                      <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-900">{u.nome}</span>
                            <span className="text-xs text-zinc-500 mt-0.5">{u.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-700 font-medium font-mono text-xs">
                          {u.matricula}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.perfil === 'Analista' ? 'bg-blue-100 text-blue-700' :
                            u.perfil === 'Coordenador' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {u.perfil}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </ProtectedRoute>
  );
}
