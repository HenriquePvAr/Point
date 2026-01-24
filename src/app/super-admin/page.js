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

  // ✅ Logout REAL (evita loop)
  const logoutEVoltar = useCallback((msg) => {
    if (msg) toast.error(msg);

    // apaga cookie da sessão (mesmo que HttpOnly não apague, isso ajuda quando é cookie normal)
    document.cookie = "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";

    // remove sessão local
    localStorage.removeItem("point_user");

    // manda pra home sem ficar voltando
    router.replace("/");
  }, [router]);

  async function carregarEmpresas() {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/empresas", { cache: "no-store" });

      // Se a API já retorna 401/403, cai aqui
      if (res.status === 401 || res.status === 403) {
        logoutEVoltar("Acesso restrito ao Super Admin");
        return;
      }

      const data = await res.json();

      // Se a API retorna 200 com { error }, tratamos também
      if (data?.error) {
        logoutEVoltar(data.error);
        return;
      }

      setEmpresas(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

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
        logoutEVoltar("Acesso restrito ao Super Admin");
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data?.error || "Erro ao atualizar.");
        return;
      }

      toast.success(`Status alterado para ${novoStatus}`);
      carregarEmpresas();
    } catch (e) {
      toast.error("Erro ao atualizar.");
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
        logoutEVoltar("Acesso restrito ao Super Admin");
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data?.error || "Erro ao adicionar dias.");
        return;
      }

      toast.success(`Adicionados ${dias} dias!`);
      carregarEmpresas();
    } catch (e) {
      toast.error("Erro ao adicionar dias.");
    }
  }

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

        {/* ✅ Sair agora limpa sessão (sem loop) */}
        <button
          onClick={() => logoutEVoltar("Sessão finalizada.")}
          className="flex items-center gap-2 text-sm bg-red-900/30 hover:bg-red-900/50 text-red-200 px-4 py-2 rounded transition"
        >
          <LogOut size={16} /> Sair
        </button>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <CardKpi titulo="Total Empresas" valor={empresas.length} icon={<Search />} cor="bg-blue-900/20 text-blue-400" />
        <CardKpi
          titulo="Ativas (Pagas)"
          valor={empresas.filter((e) => e.statusAssinatura === "ativo").length}
          icon={<DollarSign />}
          cor="bg-green-900/20 text-green-400"
        />
        <CardKpi
          titulo="Em Trial"
          valor={empresas.filter((e) => e.statusAssinatura === "trial").length}
          icon={<Clock />}
          cor="bg-yellow-900/20 text-yellow-400"
        />
        <CardKpi
          titulo="Bloqueadas"
          valor={empresas.filter((e) => e.statusAssinatura === "inativo").length}
          icon={<Ban />}
          cor="bg-red-900/20 text-red-400"
        />
      </div>

      {/* LISTA */}
      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="font-bold text-lg">Empresas Cadastradas</h2>
          <input
            placeholder="Buscar por nome ou email..."
            className="bg-gray-900 border border-gray-700 text-sm p-2 rounded w-64 focus:outline-blue-500"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="p-8 text-gray-400 text-sm">Carregando...</div>
        ) : (
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
                <tr key={empresa.id} className="hover:bg-gray-700/50 transition">
                  <td className="p-4">
                    <div className="font-bold text-white">{empresa.nome}</div>
                    <div className="text-gray-500 text-xs">{empresa.email}</div>
                  </td>

                  <td className="p-4">
                    <BadgeStatus status={empresa.statusAssinatura} />
                  </td>

                  <td className="p-4 text-gray-500 font-mono text-xs">
                    {empresa.stripeCustomerId || "Sem ID"}
                  </td>

                  <td className="p-4 flex justify-center gap-2">
                    {empresa.statusAssinatura !== "ativo" && (
                      <button
                        onClick={() => alterarStatus(empresa.id, "ativo")}
                        title="Liberar Acesso"
                        className="p-2 bg-green-900/30 text-green-400 rounded hover:bg-green-900/50"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {empresa.statusAssinatura !== "inativo" && (
                      <button
                        onClick={() => alterarStatus(empresa.id, "inativo")}
                        title="Bloquear"
                        className="p-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50"
                      >
                        <Ban size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => darDiasGratis(empresa.id)}
                      title="Dar Trial Extra"
                      className="p-2 bg-blue-900/30 text-blue-400 rounded hover:bg-blue-900/50"
                    >
                      <Calendar size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {empresasFiltradas.length === 0 && (
                <tr>
                  <td className="p-6 text-gray-400" colSpan={4}>
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CardKpi({ titulo, valor, icon, cor }) {
  return (
    <div className={`p-4 rounded-lg border border-gray-700 flex items-center gap-4 ${cor}`}>
      <div className="p-3 rounded-full bg-black/20">{icon}</div>
      <div>
        <p className="text-xs uppercase font-bold opacity-70">{titulo}</p>
        <p className="text-2xl font-black">{valor}</p>
      </div>
    </div>
  );
}

function BadgeStatus({ status }) {
  const cores = {
    ativo: "bg-green-500/20 text-green-400 border-green-500/30",
    inativo: "bg-red-500/20 text-red-400 border-red-500/30",
    trial: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-bold border ${cores[status] || cores.inativo} uppercase`}>
      {status}
    </span>
  );
}
