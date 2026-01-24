"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CadastroEmpresa() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nomeEmpresa: "", cnpj: "", nomeUsuario: "", email: "", cpf: "", senha: ""
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/cadastro", {
      method: "POST",
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Cadastro realizado! Faça login.");
      router.push("/");
    } else {
      toast.error(data.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-4">
        <h1 className="text-xl font-bold text-[#1351b4]">Cadastrar Minha Empresa</h1>
        
        <input placeholder="Nome da Empresa" className="w-full border p-2 rounded" 
          onChange={e => setForm({...form, nomeEmpresa: e.target.value})} required />
          
        <input placeholder="CNPJ" className="w-full border p-2 rounded" 
          onChange={e => setForm({...form, cnpj: e.target.value})} />

        <hr />

        <input placeholder="Seu Nome (Dono)" className="w-full border p-2 rounded" 
          onChange={e => setForm({...form, nomeUsuario: e.target.value})} required />

        <input placeholder="Seu Email" type="email" className="w-full border p-2 rounded" 
          onChange={e => setForm({...form, email: e.target.value})} required />

        <input placeholder="Sua Senha" type="password" className="w-full border p-2 rounded" 
          onChange={e => setForm({...form, senha: e.target.value})} required />

        <button type="submit" disabled={loading} className="w-full bg-[#1351b4] text-white p-3 rounded font-bold">
          {loading ? "Processando..." : "CRIAR CONTA"}
        </button>
      </form>
    </div>
  );
}