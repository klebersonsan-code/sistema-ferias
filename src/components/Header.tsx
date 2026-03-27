"use client";
import { LogOut, Users, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<{ nome: string; perfil: string } | null>(null);

  useEffect(() => {
    const data = localStorage.getItem("userData");
    if (data) {
      try {
        setUser(JSON.parse(data));
      } catch(e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    router.push("/");
  };

  if (!user) return null;

  return (
    <header className="bg-white border-b border-zinc-200 px-4 md:px-8 py-3 flex justify-between items-center shadow-sm sticky top-0 z-40">
      <div className="flex flex-col">
        <span className="font-bold text-zinc-900">{user.nome}</span>
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{user.perfil}</span>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        {user.perfil?.toLowerCase() === 'analista' && (
          <nav className="hidden md:flex items-center gap-2">
            <Link 
              href="/analista" 
              className="flex items-center gap-2 text-zinc-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl font-bold transition-all border border-transparent hover:border-blue-200/50"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
            <Link 
              href="/analista/usuarios" 
              className="flex items-center gap-2 text-zinc-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl font-bold transition-all border border-transparent hover:border-blue-200/50"
            >
              <Users size={18} />
              Gerenciar Usuários
            </Link>
          </nav>
        )}

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-zinc-600 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl font-bold transition-all border border-transparent hover:border-red-200/50"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </header>
  );
}
