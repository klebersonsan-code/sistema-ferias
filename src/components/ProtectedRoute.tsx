"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({ 
  children, 
  allowedProfiles 
}: { 
  children: React.ReactNode, 
  allowedProfiles: string[] 
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("userData");
    if (!data) {
      router.push("/");
      return;
    }
    
    try {
      const user = JSON.parse(data);
      if (!allowedProfiles.map(p => p.toLowerCase()).includes(user.perfil?.toLowerCase())) {
        router.push("/");
        return;
      }
      setIsAuthorized(true);
    } catch (e) {
      localStorage.removeItem("userData");
      router.push("/");
    }
  }, [router, allowedProfiles]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-zinc-500 font-medium">Verificando credenciais...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
