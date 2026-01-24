"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Shield, Search, Ban, CheckCircle, Clock, LogOut, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function SuperAdminPage() {
  const router = useRouter();

  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");

  // ✅ Logout REAL (Compatível com src/app/api/auth/route.js)
  const logoutEVoltar = useCallback(async (msg) => {
    if (msg) toast.error(msg);

    try {
      // Chama o DELETE que definimos no arquivo api/auth/route.js
      await fetch("/api/auth", { method: "DELETE" });
    } catch (e) {
      console.error("Erro ao fazer logout", e);
    }

    // Limpa dados locais e força redirecionamento
    localStorage.removeItem("point_user");
    localStorage.removeItem("point_users"); // Limpa lista de contas salvas se quiser forçar limpeza total
    router.replace("/");
    router.refresh(); // Força atualização da página para garantir que o middleware/servidor pegue o logout
  }, [router]);

  async function carregarEmpresas() {
    setLoading(true);
    try {
      // Importante: cache: "no-store" garante que não pegue dados velhos
      const res = await fetch("/api/super-admin/empresas", { cache: "no-store" });

      // Se der erro de permissão (401/403), desloga o usuário
      if (res.status === 401 || res.status === 403) {
        await logoutEVoltar("Sessão expirada ou não autorizada.");
        return;
      }

      const data = await res.json();

      if (data?.error) {
        await logoutEVoltar(data.error);
        return;
      }

      setEmpresas(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  // Carrega ao abrir a página
  useEffect(() => {
    carregarEmpresas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function alterarStatus(id, novoStatus) {
    try {
      const res = await fetch("/api/super-admin/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: novoStatus }),
      });

      if (res.status === 401 || res.status === 403) {
        await logoutEVoltar("Acesso restrito ao Super Admin");
        return;
      }

      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        toast.error(data?.error || "Erro ao atualizar.");
        return;
      }

      toast.success(`Status alterado para ${novoStatus}`);
      carregarEmpresas(); // Recarrega a lista
    } catch (e) {
      toast.error("Erro de conexão ao atualizar.");
    }
  }

  async function darDiasGratis(id) {
    const diasStr = prompt("Quantos dias de teste quer adicionar?", "7");
    if (!diasStr) return;

    const dias = parseInt(diasStr, 10);
    if (Number.isNaN(dias) || dias <= 0) {
      toast.warning("Digite um número válido.");
      return;
    }

    try {
      const res = await fetch("/api/super-admin/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, dias }),
      });

      if (res.status === 401 || res.status === 403) {
        await logoutEVoltar("Acesso restrito ao Super Admin");
        return;
      }

      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        toast.error(data?.error || "Erro ao adicionar dias.");
        return;
      }

      toast.success(`Adicionados ${dias} dias com sucesso!`);
      carregarEmpresas();
    } catch (e) {
      toast.error("Erro ao adicionar dias.");
    }
  }

  // Lógica de filtro (busca)
  const empresasFiltradas = empresas.filter((e) => {
    const f = filtro.toLowerCase();
    return (e.nome || "").toLowerCase().includes(f) || (e.email || "").toLowerCase().includes(f);
  });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      <header className="flex justify-between items-center mb-10 border-b border-gray-700 pb-6">
        <div>
          <h1 className="text-3xl font-black text-blue-400 flex items-center gap-3">
            <Shield size={32} /> PAINEL SUPER ADMIN
          </h1>
          <p className="text-gray-400 text-sm mt-1">Gestão global de assinaturas e empresas</p>
        </div>

        <button
          onClick={() => logoutEVoltar("Sessão finalizada.")}
          className="flex items-center gap-2 text-sm bg-red-900/30 hover:bg-red-900/50 text-red-200 px-4 py-2 rounded transition border border-red-900/50"
        >
          <LogOut size={16} /> Sair
        </button>
      </header>

      {/* CARDS KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <CardKpi 
            titulo="Total Empresas" 
            valor={empresas.length} 
            icon={<Search />} 
            cor="bg-blue-900/20 text-blue-400 border-blue-900/30" 
        />
        <CardKpi
          titulo="Ativas (Pagas)"
          valor={empresas.filter((e) => e.statusAssinatura === "ativo").length}
          icon={<DollarSign />}
          cor="bg-green-900/20 text-green-400 border-green-900/30"
        />
        <CardKpi
          titulo="Em Trial"
          valor={empresas.filter((e) => e.statusAssinatura === "trial").length}
          icon={<Clock />}
          cor="bg-yellow-900/20 text-yellow-400 border-yellow-900/30"
        />
        <CardKpi
          titulo="Bloqueadas"
          valor={empresas.filter((e) => e.statusAssinatura === "inativo").length}
          icon={<Ban />}
          cor="bg-red-900/20 text-red-400 border-red-900/30"
        />
      </div>

      {/* LISTA DE EMPRESAS */}
      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl">
        <div className="p-4 border-b border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="font-bold text-lg text-white">Empresas Cadastradas</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input
                placeholder="Buscar por nome ou email..."
                className="bg-gray-900 border border-gray-700 text-sm p-2 pl-10 rounded w-full md:w-64 focus:outline-none focus:border-blue-500 transition text-white"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm animate-pulse">
            Carregando dados do sistema...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                <tr>
                    <th className="p-4">Empresa / Admin</th>
                    <th className="p-4">Status Assinatura</th>
                    <th className="p-4">ID Stripe</th>
                    <th className="p-4 text-center">Ações Rápidas</th>
                </tr>
                </thead>

                <tbody className="divide-y divide-gray-700">
                {empresasFiltradas.map((empresa) => (
                    <tr key={empresa.id} className="hover:bg-gray-700/50 transition duration-150">
                    <td className="p-4">
                        <div className="font-bold text-white text-base">{empresa.nome}</div>
                        <div className="text-gray-400 text-xs mt-0.5">{empresa.email}</div>
                    </td>

                    <td className="p-4">
                        <BadgeStatus status={empresa.statusAssinatura} />
                    </td>

                    <td className="p-4 text-gray-500 font-mono text-xs">
                        {empresa.stripeCustomerId || "Sem ID"}
                    </td>

                    <td className="p-4">
                        <div className="flex justify-center gap-2">
                            {/* BOTÃO LIBERAR */}
                            {empresa.statusAssinatura !== "ativo" && (
                                <button
                                onClick={() => alterarStatus(empresa.id, "ativo")}
                                title="Liberar Acesso (Ativar)"
                                className="p-2 bg-green-900/30 text-green-400 rounded hover:bg-green-900/50 transition border border-green-900/30"
                                >
                                <CheckCircle size={18} />
                                </button>
                            )}
                            
                            {/* BOTÃO BLOQUEAR */}
                            {empresa.statusAssinatura !== "inativo" && (
                                <button
                                onClick={() => alterarStatus(empresa.id, "inativo")}
                                title="Bloquear Acesso"
                                className="p-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition border border-red-900/30"
                                >
                                <Ban size={18} />
                                </button>
                            )}
                            
                            {/* BOTÃO TRIAL */}
                            <button
                                onClick={() => darDiasGratis(empresa.id)}
                                title="Adicionar dias de Trial"
                                className="p-2 bg-blue-900/30 text-blue-400 rounded hover:bg-blue-900/50 transition border border-blue-900/30"
                            >
                                <Calendar size={18} />
                            </button>
                        </div>
                    </td>
                    </tr>
                ))}

                {empresasFiltradas.length === 0 && (
                    <tr>
                    <td className="p-8 text-center text-gray-500 italic" colSpan={4}>
                        Nenhuma empresa encontrada com este filtro.
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Componentes Auxiliares (Visuais)

function CardKpi({ titulo, valor, icon, cor }) {
  return (
    <div className={`p-4 rounded-lg border flex items-center gap-4 shadow-lg ${cor}`}>
      <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm">{icon}</div>
      <div>
        <p className="text-xs uppercase font-bold opacity-70 tracking-wider">{titulo}</p>
        <p className="text-3xl font-black">{valor}</p>
      </div>
    </div>
  );
}

function BadgeStatus({ status }) {
  const cores = {
    ativo: "bg-green-500/10 text-green-400 border-green-500/20",
    inativo: "bg-red-500/10 text-red-400 border-red-500/20",
    trial: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };
  
  // Tratamento para status desconhecido
  const classeCor = cores[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20";

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${classeCor} uppercase tracking-wide`}>
      {status || "Desconhecido"}
    </span>
  );
}