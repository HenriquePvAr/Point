"use client";
import { useState, useEffect } from 'react';
import { Shield, Check, X, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperAdmin() {
  const [empresas, setEmpresas] = useState([]);
  const [senha, setSenha] = useState("");
  const [acessoLiberado, setAcessoLiberado] = useState(false);

  // Proteção básica via código (pode melhorar depois com Login real de Super Admin)
  if (!acessoLiberado) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <input 
          type="password" 
          placeholder="Senha Mestra"
          className="p-2 rounded text-black"
          onChange={(e) => {
             if(e.target.value === "admin123") setAcessoLiberado(true); // Mude isso!
          }} 
        />
      </div>
    )
  }

  // Busca dados (você precisará criar a API GET /api/admin/empresas)
  useEffect(() => {
     fetch('/api/admin/empresas').then(r => r.json()).then(setEmpresas);
  }, []);

  async function alterarStatus(id, ativo, diasExtras = 0) {
    const res = await fetch('/api/admin/empresas', {
        method: 'PUT',
        body: JSON.stringify({ id, ativo, diasExtras })
    });
    if(res.ok) {
        toast.success("Atualizado!");
        // recarregar lista...
    }
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Shield className="text-blue-600"/> Painel Super Admin
      </h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4">Empresa</th>
              <th className="p-4">Status</th>
              <th className="p-4">Vencimento</th>
              <th className="p-4">Ações Rápidas</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map(emp => (
              <tr key={emp.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                    <p className="font-bold">{emp.nome}</p>
                    <p className="text-xs text-gray-500">{emp.id}</p>
                </td>
                <td className="p-4">
                    {emp.ativo 
                        ? <span className="text-green-600 font-bold bg-green-100 px-2 py-1 rounded text-xs">ATIVO</span> 
                        : <span className="text-red-600 font-bold bg-red-100 px-2 py-1 rounded text-xs">BLOQUEADO</span>
                    }
                </td>
                <td className="p-4">
                    {emp.validade ? new Date(emp.validade).toLocaleDateString() : "Sem validade"}
                </td>
                <td className="p-4 flex gap-2">
                    {/* Botão Renovar 30 Dias Manualmente */}
                    <button 
                        onClick={() => alterarStatus(emp.id, true, 30)}
                        className="bg-blue-100 text-blue-700 p-2 rounded hover:bg-blue-200 text-xs font-bold flex gap-1"
                        title="Liberar +30 dias grátis/manual"
                    >
                       <Calendar size={14}/> +30 Dias
                    </button>
                    
                    {/* Botão Bloquear */}
                    <button 
                        onClick={() => alterarStatus(emp.id, false)}
                        className="bg-red-100 text-red-700 p-2 rounded hover:bg-red-200 text-xs font-bold"
                        title="Bloquear Acesso"
                    >
                       <X size={14}/> Bloquear
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}