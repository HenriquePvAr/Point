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
  LogOut,
  PlusCircle,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState("");
  
  // Controle de Modais
  const [modalRenovar, setModalRenovar] = useState(null);
  const [modalNovo, setModalNovo] = useState(false);
  
  // Estados de Formulário
  const [mesesParaAdicionar, setMesesParaAdicionar] = useState(1);
  const [novoForm, setNovoForm] = useState({
    nomeEmpresa: "",
    cnpj: "",
    nomeAdmin: "",
    email: "",
    senha: ""
  });

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

  async function handleCriarEmpresa(e) {
    e.preventDefault();
    const toastId = toast.loading("Criando empresa...");
    try {
      const res = await fetch("/api/super-admin/empresas/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Empresa e Admin criados com sucesso!", { id: toastId });
        setModalNovo(false);
        setNovoForm({ nomeEmpresa: "", cnpj: "", nomeAdmin: "", email: "", senha: "" });
        carregarEmpresas();
      } else {
        toast.error(data.message || "Erro ao criar empresa.", { id: toastId });
      }
    } catch (error) {
      toast.error("Erro de conexão.", { id: toastId });
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
        carregarEmpresas();
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
        toast.success(`Renovado para ${modalRenovar.nome}!`);
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

  const empresasFiltradas = empresas.filter(e => 
    e.nome.toLowerCase().includes(termoBusca.toLowerCase()) || 
    (e.cnpj && e.cnpj.includes(termoBusca))
  );

  if (loading) return <div className="h-screen flex items-center justify-center text-[#1351b4] font-bold italic">Carregando Ecossistema Point...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20">
      {/* HEADER */}
      <header className="bg-[#071d41] text-white p-6 shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Building2 className="text-blue-400" />
              PAINEL MASTER
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setModalNovo(true)}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition shadow-lg"
            >
              <PlusCircle size={16} /> NOVA EMPRESA
            </button>
            <button onClick={handleLogout} className="text-xs border border-white/30 px-3 py-1.5 rounded hover:bg-white/10 flex items-center gap-2 transition">
              <LogOut size={14} /> SAIR
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* STATS RÁPIDOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-blue-500 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-full text-blue-600"><Building2 /></div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Empresas</p>
              <p className="text-2xl font-black text-gray-800">{empresas.length}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-green-500 flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-full text-green-600"><CheckCircle /></div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ativas</p>
              <p className="text-2xl font-black text-gray-800">{empresas.filter(e => e.ativo).length}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-500 flex items-center gap-4">
            <div className="bg-red-50 p-3 rounded-full text-red-600"><XCircle /></div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Bloqueadas</p>
              <p className="text-2xl font-black text-gray-800">{empresas.filter(e => !e.ativo).length}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-[#071d41]">Gestão de Clientes</h2>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Nome ou CNPJ..."
              className="w-full pl-10 p-2 bg-white border rounded shadow-sm text-sm outline-none focus:border-blue-500"
              value={termoBusca}
              onChange={e => setTermoBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {empresasFiltradas.map((emp) => {
            const diasRestantes = emp.pagoAte ? Math.ceil((new Date(emp.pagoAte) - new Date()) / 86400000) : 0;
            const vencido = diasRestantes < 0;

            return (
              <div key={emp.id} className="bg-white border rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-gray-800">{emp.nome}</h3>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${emp.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {emp.ativo ? "ATIVO" : "BLOQUEADO"}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono">ID: {emp.id} | CNPJ: {emp.cnpj || '---'}</p>
                  
                  <div className="flex flex-wrap gap-4 mt-3 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      <Users size={12} className="text-blue-500" /> <b>{emp.totalUsuarios}</b> users
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${vencido ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                      <Calendar size={12} />
                      {emp.pagoAte ? <b>Vence {new Date(emp.pagoAte).toLocaleDateString()} ({diasRestantes}d)</b> : "Sem assinatura"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:pl-6 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0">
                  <button 
                    onClick={() => toggleStatus(emp)}
                    className={`w-10 h-10 rounded flex items-center justify-center transition ${emp.ativo ? "text-red-500 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}
                    title={emp.ativo ? "Bloquear Empresa" : "Desbloquear Empresa"}
                  >
                    {emp.ativo ? <Lock size={20} /> : <Unlock size={20} />}
                  </button>

                  <button 
                    onClick={() => setModalRenovar(emp)}
                    className="h-10 px-4 rounded text-blue-600 font-bold text-xs hover:bg-blue-50 flex items-center gap-2 border border-blue-100"
                  >
                    <Clock size={16} /> RENOVAR
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* MODAL: NOVA EMPRESA */}
      {modalNovo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-[#071d41]">CADASTRAR EMPRESA</h3>
              <button onClick={() => setModalNovo(false)} className="text-gray-400 hover:text-red-500"><X /></button>
            </div>

            <form onSubmit={handleCriarEmpresa} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">DADOS DA EMPRESA</label>
                <input required placeholder="Nome Fantasia" className="w-full p-2.5 border rounded text-sm focus:border-blue-500 outline-none" 
                  value={novoForm.nomeEmpresa} onChange={e => setNovoForm({...novoForm, nomeEmpresa: e.target.value})} />
                <input placeholder="CNPJ (opcional)" className="w-full p-2.5 border rounded text-sm mt-2 focus:border-blue-500 outline-none" 
                  value={novoForm.cnpj} onChange={e => setNovoForm({...novoForm, cnpj: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Dono / Administrador</label>
                <input required placeholder="Nome do Admin" className="w-full p-2.5 border rounded text-sm focus:border-blue-500 outline-none" 
                  value={novoForm.nomeAdmin} onChange={e => setNovoForm({...novoForm, nomeAdmin: e.target.value})} />
                <input required type="email" placeholder="E-mail de acesso" className="w-full p-2.5 border rounded text-sm mt-2 focus:border-blue-500 outline-none" 
                  value={novoForm.email} onChange={e => setNovoForm({...novoForm, email: e.target.value})} />
                <input required type="password" placeholder="Senha inicial" className="w-full p-2.5 border rounded text-sm mt-2 focus:border-blue-500 outline-none" 
                  value={novoForm.senha} onChange={e => setNovoForm({...novoForm, senha: e.target.value})} />
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setModalNovo(false)} className="flex-1 py-3 text-sm font-bold text-gray-500 border rounded hover:bg-gray-50">CANCELAR</button>
                <button type="submit" className="flex-1 py-3 text-sm font-bold bg-blue-600 text-white rounded hover:bg-blue-700 shadow-md">CRIAR ACESSO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RENOVAR */}
      {modalRenovar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-xs p-6">
            <h3 className="text-lg font-bold text-blue-600 mb-4">Adicionar Tempo</h3>
            <p className="text-xs text-gray-500 mb-4">Empresa: <b>{modalRenovar.nome}</b></p>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[1, 6, 12].map(m => (
                <button key={m} onClick={() => setMesesParaAdicionar(m)} className={`py-2 rounded border text-xs font-bold transition ${mesesParaAdicionar === m ? "bg-blue-600 text-white" : "bg-gray-50 hover:bg-gray-100"}`}>
                  {m}M
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModalRenovar(null)} className="flex-1 py-2 text-xs font-bold text-gray-400">Voltar</button>
              <button onClick={handleRenovar} className="flex-1 py-2 bg-green-600 text-white rounded text-xs font-bold">CONFIRMAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}