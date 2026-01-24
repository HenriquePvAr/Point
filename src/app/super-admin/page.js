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
  X,
  Edit3,
  Trash2,
  History,
  Plus,
  Minus
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
  const [modalEditar, setModalEditar] = useState(null);
  const [modalHistorico, setModalHistorico] = useState(null);
  
  // Estados de Formulário
  const [diasParaAjustar, setDiasParaAjustar] = useState(30);
  const [historicoPagos, setHistoricoPagos] = useState([]);
  const [novoForm, setNovoForm] = useState({
    nomeEmpresa: "",
    cnpj: "",
    nomeAdmin: "",
    email: "",
    senha: ""
  });
  const [editForm, setEditForm] = useState({
    id: "",
    nome: "",
    cnpj: ""
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
    const toastId = toast.loading("Criando empresa e acessos...");
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

  async function handleEditarEmpresa(e) {
    e.preventDefault();
    const toastId = toast.loading("Atualizando dados...");
    try {
      const res = await fetch("/api/super-admin/empresas/editar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        toast.success("Dados atualizados com sucesso!", { id: toastId });
        setModalEditar(null);
        carregarEmpresas();
      } else {
        toast.error("Erro ao atualizar dados.", { id: toastId });
      }
    } catch {
      toast.error("Erro de conexão.", { id: toastId });
    }
  }

  async function handleExcluir(id) {
    if (!confirm("AVISO CRÍTICO: Isso excluirá a empresa, todos os funcionários e todos os registros de ponto permanentemente. Confirmar?")) return;
    try {
      const res = await fetch(`/api/super-admin/empresas/excluir?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Empresa removida do ecossistema.");
        carregarEmpresas();
      }
    } catch {
      toast.error("Erro ao excluir empresa.");
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

  async function handleRenovar(tipo) {
    if (!modalRenovar) return;
    const dias = tipo === 'add' ? diasParaAjustar : -diasParaAjustar;
    
    try {
      const res = await fetch("/api/super-admin/renovar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId: modalRenovar.id, dias: dias }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Tempo ajustado para ${modalRenovar.nome}!`);
        setModalRenovar(null);
        carregarEmpresas();
      } else {
        toast.error("Erro ao ajustar tempo.");
      }
    } catch {
      toast.error("Erro ao conectar.");
    }
  }

  async function abrirHistorico(empId) {
    setModalHistorico(empId);
    setHistoricoPagos([]);
    try {
      const res = await fetch(`/api/super-admin/pagamentos/historico?empresaId=${empId}`);
      const data = await res.json();
      setHistoricoPagos(data);
    } catch {
      toast.error("Erro ao carregar histórico.");
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      document.cookie = "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=lax";
      window.location.href = "/";
    } catch (error) {
      window.location.href = "/";
    }
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

        {/* LISTA DE CARDS */}
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

                <div className="flex items-center gap-2 md:pl-6 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 flex-wrap">
                  <button 
                    onClick={() => toggleStatus(emp)}
                    className={`w-10 h-10 rounded flex items-center justify-center transition border ${emp.ativo ? "text-red-500 border-red-100 hover:bg-red-50" : "text-green-600 border-green-100 hover:bg-green-50"}`}
                    title={emp.ativo ? "Bloquear" : "Liberar"}
                  >
                    {emp.ativo ? <Lock size={18} /> : <Unlock size={18} />}
                  </button>

                  <button 
                    onClick={() => { setEditForm({ id: emp.id, nome: emp.nome, cnpj: emp.cnpj || "" }); setModalEditar(true); }}
                    className="w-10 h-10 rounded border border-blue-100 text-blue-500 flex items-center justify-center hover:bg-blue-50"
                    title="Editar Empresa"
                  >
                    <Edit3 size={18} />
                  </button>

                  <button 
                    onClick={() => abrirHistorico(emp.id)}
                    className="w-10 h-10 rounded border border-purple-100 text-purple-500 flex items-center justify-center hover:bg-purple-50"
                    title="Histórico de Pagamentos"
                  >
                    <History size={18} />
                  </button>

                  <button 
                    onClick={() => setModalRenovar(emp)}
                    className="h-10 px-4 rounded text-green-600 font-bold text-xs hover:bg-green-50 flex items-center gap-2 border border-green-100"
                  >
                    <Clock size={16} /> DIAS
                  </button>

                  <button 
                    onClick={() => handleExcluir(emp.id)}
                    className="w-10 h-10 rounded border border-gray-200 text-gray-400 flex items-center justify-center hover:text-red-600 hover:bg-red-50"
                    title="Excluir Empresa"
                  >
                    <Trash2 size={18} />
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
                <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-widest">Dados da Empresa</label>
                <input required placeholder="Nome Fantasia" className="w-full p-2.5 border rounded text-sm focus:border-blue-500 outline-none" 
                  value={novoForm.nomeEmpresa} onChange={e => setNovoForm({...novoForm, nomeEmpresa: e.target.value})} />
                <input placeholder="CNPJ (opcional)" className="w-full p-2.5 border rounded text-sm mt-2 focus:border-blue-500 outline-none" 
                  value={novoForm.cnpj} onChange={e => setNovoForm({...novoForm, cnpj: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-widest">Acesso do Administrador</label>
                <input required placeholder="Nome do Dono" className="w-full p-2.5 border rounded text-sm focus:border-blue-500 outline-none" 
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

      {/* MODAL: EDITAR */}
      {modalEditar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-black text-[#071d41] mb-4">EDITAR EMPRESA</h3>
            <form onSubmit={handleEditarEmpresa} className="space-y-4">
              <input required placeholder="Nome Fantasia" className="w-full p-2.5 border rounded text-sm outline-none focus:border-blue-500" 
                value={editForm.nome} onChange={e => setEditForm({...editForm, nome: e.target.value})} />
              <input placeholder="CNPJ" className="w-full p-2.5 border rounded text-sm outline-none focus:border-blue-500" 
                value={editForm.cnpj} onChange={e => setEditForm({...editForm, cnpj: e.target.value})} />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalEditar(null)} className="flex-1 py-2 text-sm font-bold text-gray-500">Voltar</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded text-sm font-bold">SALVAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RENOVAR (DIAS) */}
      {modalRenovar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-full max-w-xs p-6 shadow-2xl text-center">
            <h3 className="text-lg font-black text-gray-800 mb-1">AJUSTAR TEMPO</h3>
            <p className="text-xs text-gray-400 mb-4">{modalRenovar.nome}</p>
            
            <input 
              type="number" 
              value={diasParaAjustar} 
              onChange={e => setDiasParaAjustar(Number(e.target.value))} 
              className="w-full p-3 border rounded-lg text-center font-black text-xl mb-4 focus:border-blue-500 outline-none" 
            />

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleRenovar('sub')} className="flex items-center justify-center gap-1 py-3 bg-red-50 text-red-600 rounded-lg font-bold border border-red-100 hover:bg-red-100 transition"><Minus size={16}/> RETIRAR</button>
              <button onClick={() => handleRenovar('add')} className="flex items-center justify-center gap-1 py-3 bg-green-600 text-white rounded-lg font-bold shadow-lg hover:bg-green-700 transition"><Plus size={16}/> SOMAR</button>
            </div>
            
            <button onClick={() => setModalRenovar(null)} className="mt-4 text-[10px] text-gray-400 uppercase font-bold tracking-widest">Fechar</button>
          </div>
        </div>
      )}

      {/* MODAL: HISTÓRICO */}
      {modalHistorico && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-[#071d41]">HISTÓRICO DE PAGOS</h3>
              <button onClick={() => setModalHistorico(null)} className="text-gray-400 hover:text-red-500"><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {historicoPagos.length > 0 ? historicoPagos.map((p, i) => (
                <div key={i} className="flex justify-between items-center p-4 border rounded-xl bg-gray-50 border-gray-100">
                  <div>
                    <p className="font-black text-gray-800 text-sm">R$ {p.valor.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(p.data).toLocaleDateString()}</p>
                  </div>
                  <span className="text-[9px] bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-black uppercase tracking-widest">{p.metodo}</span>
                </div>
              )) : (
                <div className="text-center py-10 opacity-30">
                  <DollarSign size={48} className="mx-auto mb-2" />
                  <p className="text-sm font-bold italic">Nenhum registro encontrado.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}