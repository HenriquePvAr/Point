"use client";
import { useState, useEffect } from "react";
import { 
  Building2, 
  Users, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  DollarSign, 
  Clock, 
  Lock, 
  Unlock,
  Search,
  MoreVertical,
  LogOut
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState("");
  
  // Controle do Modal de Renovação
  const [modalRenovar, setModalRenovar] = useState(null); // ID da empresa ou null
  const [mesesParaAdicionar, setMesesParaAdicionar] = useState(1);

  useEffect(() => {
    carregarEmpresas();
  }, []);

  async function carregarEmpresas() {
    try {
      const res = await fetch("/api/super-admin/empresas");
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmpresas(data);
      }
    } catch (error) {
      toast.error("Erro ao carregar empresas.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(empresa) {
    const novoStatus = !empresa.ativo;
    try {
      const res = await fetch("/api/super-admin/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId: empresa.id, ativo: novoStatus }),
      });
      
      if (res.ok) {
        toast.success(`Empresa ${novoStatus ? "desbloqueada" : "bloqueada"}!`);
        carregarEmpresas(); // Recarrega lista
      } else {
        toast.error("Erro ao atualizar status.");
      }
    } catch {
      toast.error("Erro de conexão.");
    }
  }

  async function handleRenovar() {
    if (!modalRenovar) return;

    try {
      const res = await fetch("/api/super-admin/renovar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId: modalRenovar.id, meses: mesesParaAdicionar }),
      });
      
      const data = await res.json();

      if (data.success) {
        toast.success(`Adicionados ${mesesParaAdicionar} meses para ${modalRenovar.nome}!`);
        setModalRenovar(null);
        carregarEmpresas();
      } else {
        toast.error("Erro ao renovar.");
      }
    } catch {
      toast.error("Erro ao conectar.");
    }
  }

  function handleLogout() {
    document.cookie = "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push("/");
  }

  // Filtragem na tela
  const empresasFiltradas = empresas.filter(e => 
    e.nome.toLowerCase().includes(termoBusca.toLowerCase()) || 
    (e.cnpj && e.cnpj.includes(termoBusca))
  );

  if (loading) return <div className="h-screen flex items-center justify-center text-[#1351b4] font-bold">Carregando Painel Master...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20">
      {/* HEADER */}
      <header className="bg-[#071d41] text-white p-6 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Building2 className="text-blue-400" />
              PAINEL SUPER ADMIN
            </h1>
            <p className="text-xs text-blue-200 opacity-80">Gerenciamento Geral do SaaS</p>
          </div>
          <button onClick={handleLogout} className="text-xs border border-white/30 px-3 py-1.5 rounded hover:bg-white/10 flex items-center gap-2 transition">
            <LogOut size={14} /> SAIR
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* STATS RÁPIDOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full text-[#1351b4]"><Building2 /></div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Total Empresas</p>
              <p className="text-2xl font-black text-gray-800">{empresas.length}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full text-green-600"><CheckCircle /></div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Ativas</p>
              <p className="text-2xl font-black text-gray-800">{empresas.filter(e => e.ativo).length}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-full text-red-600"><XCircle /></div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Bloqueadas</p>
              <p className="text-2xl font-black text-gray-800">{empresas.filter(e => !e.ativo).length}</p>
            </div>
          </div>
        </div>

        {/* BUSCA */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-[#1351b4]">Empresas Cadastradas</h2>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nome ou CNPJ..."
              className="w-full pl-10 p-2 border rounded-full text-sm outline-none focus:border-[#1351b4] transition"
              value={termoBusca}
              onChange={e => setTermoBusca(e.target.value)}
            />
          </div>
        </div>

        {/* LISTA DE EMPRESAS (CARDS) */}
        <div className="grid grid-cols-1 gap-4">
          {empresasFiltradas.map((emp) => {
            const diasRestantes = emp.pagoAte 
              ? Math.ceil((new Date(emp.pagoAte) - new Date()) / (1000 * 60 * 60 * 24))
              : 0;
            const vencido = diasRestantes < 0;

            return (
              <div key={emp.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* INFO EMPRESA */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg text-gray-800">{emp.nome}</h3>
                    {emp.ativo ? (
                      <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-green-200">ATIVO</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-red-200">BLOQUEADO</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-mono mb-2">ID: {emp.id} | CNPJ: {emp.cnpj || 'N/A'}</p>
                  
                  <div className="flex flex-wrap gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2 py-1 rounded">
                      <Users size={14} className="text-[#1351b4]" />
                      <b>{emp.totalUsuarios}</b> usuários
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2 py-1 rounded">
                      <DollarSign size={14} className="text-green-600" />
                      <b>{emp.parcelasPagas}</b> pagamentos feitos
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${vencido ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                      <Calendar size={14} />
                      {emp.pagoAte 
                        ? <span>Vence em: <b>{new Date(emp.pagoAte).toLocaleDateString('pt-BR')}</b> ({diasRestantes} dias)</span>
                        : <span>Sem data de vencimento</span>
                      }
                    </div>
                  </div>
                </div>

                {/* AÇÕES */}
                <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                  
                  {/* Botão Bloquear/Desbloquear */}
                  <button 
                    onClick={() => toggleStatus(emp)}
                    className={`flex flex-col items-center justify-center w-20 py-2 rounded transition text-xs font-bold gap-1 ${
                      emp.ativo 
                      ? "text-red-500 hover:bg-red-50" 
                      : "text-green-600 hover:bg-green-50"
                    }`}
                  >
                    {emp.ativo ? <Lock size={20} /> : <Unlock size={20} />}
                    {emp.ativo ? "Bloquear" : "Liberar"}
                  </button>

                  {/* Botão Adicionar Tempo */}
                  <button 
                    onClick={() => setModalRenovar(emp)}
                    className="flex flex-col items-center justify-center w-24 py-2 rounded text-[#1351b4] hover:bg-blue-50 transition text-xs font-bold gap-1"
                  >
                    <Clock size={20} />
                    Renovar
                  </button>

                </div>
              </div>
            );
          })}

          {empresasFiltradas.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <Building2 size={48} className="mx-auto mb-2 opacity-20" />
              <p>Nenhuma empresa encontrada.</p>
            </div>
          )}
        </div>
      </main>

      {/* MODAL RENOVAR */}
      {modalRenovar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-[#1351b4] mb-1">Adicionar Tempo</h3>
            <p className="text-sm text-gray-600 mb-6">Para a empresa: <b>{modalRenovar.nome}</b></p>

            <div className="mb-6">
              <label className="text-xs font-bold text-gray-500 mb-2 block">Escolha o período:</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 6, 12].map(m => (
                  <button
                    key={m}
                    onClick={() => setMesesParaAdicionar(m)}
                    className={`py-2 rounded border text-sm font-bold transition ${
                      mesesParaAdicionar === m 
                      ? "bg-[#1351b4] text-white border-[#1351b4]" 
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {m} {m === 1 ? "Mês" : "Meses"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setModalRenovar(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded text-gray-600 font-bold hover:bg-gray-50 text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={handleRenovar}
                className="flex-1 py-2.5 bg-green-600 text-white rounded font-bold hover:bg-green-700 text-sm shadow-md"
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}