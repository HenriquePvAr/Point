"use client";
import { useState, useEffect } from "react";
import { 
  Shield, Search, Ban, CheckCircle, Clock, CreditCard, LogOut, DollarSign, Calendar
} from "lucide-react";
import { toast } from 'sonner';

export default function SuperAdminPage() {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    carregarEmpresas();
  }, []);

  async function carregarEmpresas() {
    try {
      // Vamos criar essa rota API no passo 2
      const res = await fetch("/api/super-admin/empresas");
      const data = await res.json();
      
      if (data.error) {
        toast.error(data.error);
        window.location.href = "/"; // Se não for super admin, expulsa
        return;
      }
      setEmpresas(data);
    } catch (e) {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  async function alterarStatus(id, novoStatus) {
    try {
      const res = await fetch("/api/super-admin/status", {
        method: "PUT",
        body: JSON.stringify({ id, status: novoStatus }),
      });
      if (res.ok) {
        toast.success(`Status alterado para ${novoStatus}`);
        carregarEmpresas();
      }
    } catch (e) { toast.error("Erro ao atualizar."); }
  }

  async function darDiasGratis(id) {
    const dias = prompt("Quantos dias de teste quer adicionar?", "7");
    if (!dias) return;

    try {
      const res = await fetch("/api/super-admin/trial", {
        method: "POST",
        body: JSON.stringify({ id, dias: parseInt(dias) }),
      });
      if (res.ok) {
        toast.success(`Adicionados ${dias} dias!`);
        carregarEmpresas();
      }
    } catch (e) { toast.error("Erro ao adicionar dias."); }
  }

  const empresasFiltradas = empresas.filter(e => 
    e.nome.toLowerCase().includes(filtro.toLowerCase()) || 
    e.email.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      <header className="flex justify-between items-center mb-10 border-b border-gray-700 pb-6">
        <div>
          <h1 className="text-3xl font-black text-blue-400 flex items-center gap-3">
            <Shield size={32}/> PAINEL SUPER ADMIN
          </h1>
          <p className="text-gray-400 text-sm mt-1">Gestão global de assinaturas e empresas</p>
        </div>
        <button onClick={() => window.location.href="/"} className="flex items-center gap-2 text-sm bg-red-900/30 hover:bg-red-900/50 text-red-200 px-4 py-2 rounded transition">
            <LogOut size={16}/> Sair
        </button>
      </header>

      {/* KPI CARDS RAPIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <CardKpi titulo="Total Empresas" valor={empresas.length} icon={<Search/>} cor="bg-blue-900/20 text-blue-400"/>
        <CardKpi titulo="Ativas (Pagas)" valor={empresas.filter(e => e.statusAssinatura === 'ativo').length} icon={<DollarSign/>} cor="bg-green-900/20 text-green-400"/>
        <CardKpi titulo="Em Trial" valor={empresas.filter(e => e.statusAssinatura === 'trial').length} icon={<Clock/>} cor="bg-yellow-900/20 text-yellow-400"/>
        <CardKpi titulo="Bloqueadas" valor={empresas.filter(e => e.statusAssinatura === 'inativo').length} icon={<Ban/>} cor="bg-red-900/20 text-red-400"/>
      </div>

      {/* LISTA DE EMPRESAS */}
      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="font-bold text-lg">Empresas Cadastradas</h2>
            <input 
                placeholder="Buscar por nome ou email..." 
                className="bg-gray-900 border border-gray-700 text-sm p-2 rounded w-64 focus:outline-blue-500"
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
            />
        </div>
        
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
                {empresasFiltradas.map(empresa => (
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
                            {empresa.statusAssinatura !== 'ativo' && (
                                <button onClick={() => alterarStatus(empresa.id, 'ativo')} title="Liberar Acesso" className="p-2 bg-green-900/30 text-green-400 rounded hover:bg-green-900/50"><CheckCircle size={16}/></button>
                            )}
                            {empresa.statusAssinatura !== 'inativo' && (
                                <button onClick={() => alterarStatus(empresa.id, 'inativo')} title="Bloquear" className="p-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50"><Ban size={16}/></button>
                            )}
                            <button onClick={() => darDiasGratis(empresa.id)} title="Dar Trial Extra" className="p-2 bg-blue-900/30 text-blue-400 rounded hover:bg-blue-900/50"><Calendar size={16}/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
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
    )
}

function BadgeStatus({ status }) {
    const cores = {
        ativo: "bg-green-500/20 text-green-400 border-green-500/30",
        inativo: "bg-red-500/20 text-red-400 border-red-500/30",
        trial: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    };
    return (
        <span className={`px-2 py-1 rounded text-xs font-bold border ${cores[status] || cores.inativo} uppercase`}>
            {status}
        </span>
    );
}