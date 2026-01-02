"use client";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  Bell, 
  LogOut, 
  Calendar, 
  Clock, 
  CheckCircle, 
  UserX, 
  Eye, 
  UserPlus, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Unlock, 
  X, 
  Download, 
  AlertCircle, 
  Edit3, 
  Save, 
  Trash2
} from "lucide-react";
import { toast } from 'sonner';

export default function AdminPage() {
  // ==========================================================
  // 1. ESTADOS GERAIS DA APLICAÇÃO
  // ==========================================================
  
  // Controle de Navegação e Loading
  const [view, setView] = useState("dashboard"); // Opções: 'dashboard', 'relatorios'
  const [loading, setLoading] = useState(true);

  // Dados Principais (Banco de Dados Local)
  const [usuarios, setUsuarios] = useState([]);
  const [pontosGerais, setPontosGerais] = useState([]);
  const [todasMensagens, setTodasMensagens] = useState([]); // Armazena as justificativas do servidor
  
  // Notificações e Atividades Recentes
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const [ultimosRegistros, setUltimosRegistros] = useState([]);

  // Busca e Seleção de Usuário
  const [termoBusca, setTermoBusca] = useState("");
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null); // Se preenchido, mostra a ficha individual

  // Modais (Pop-ups)
  const [modalNovoUsuario, setModalNovoUsuario] = useState(false);
  const [modalEditarUsuario, setModalEditarUsuario] = useState(false);

  // Formulários
  const [novoUser, setNovoUser] = useState({ nome: "", cpf: "", email: "", cargo: "" });
  const [usuarioParaEditar, setUsuarioParaEditar] = useState({});

  // Filtros de Data (Ficha Individual)
  const [mesFicha, setMesFicha] = useState(new Date().getMonth());
  const [anoFicha, setAnoFicha] = useState(2026);

  // Filtros de Data (Relatório Geral)
  const [mesRelatorio, setMesRelatorio] = useState(new Date().getMonth());
  const [anoRelatorio, setAnoRelatorio] = useState(2026);
  const [dadosRelatorio, setDadosRelatorio] = useState([]);

  // ==========================================================
  // 2. CARREGAMENTO INICIAL DE DADOS (FETCH API)
  // ==========================================================
  
  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
        setLoading(true);

        // 1. Buscar lista de usuários
        const resUsers = await fetch('/api/usuarios');
        const dataUsers = await resUsers.json();
        
        // 2. Buscar pontos de todos os usuários
        // (Em um sistema real, isso seria uma única query otimizada no banco)
        let todosPontos = [];
        for (let user of dataUsers) {
            try {
              const resPonto = await fetch(`/api/ponto?userId=${user.id}`);
              const dataPonto = await resPonto.json();
              todosPontos = [...todosPontos, ...dataPonto];
            } catch(e) { 
                console.log(`Aviso: Sem pontos para o usuário ${user.id}`); 
            }
        }

        // 3. Buscar todas as mensagens/justificativas
        const resMsgs = await fetch('/api/mensagens');
        const dataMsg = await resMsgs.json();
        
        // Atualiza todos os estados
        setUsuarios(dataUsers);
        setPontosGerais(todosPontos);
        setTodasMensagens(dataMsg);

        // 4. Preparar dados para o "Sininho" (Notificações)
        // Ordena por data (mais recente primeiro) e pega os 5 primeiros
        const registrosOrdenados = [...todosPontos].sort((a,b) => new Date(b.data) - new Date(a.data));
        setUltimosRegistros(registrosOrdenados.slice(0, 5));

        setLoading(false);
    } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar dados do sistema. Tente recarregar a página.");
        setLoading(false);
    }
  }

  // ==========================================================
  // 3. LÓGICA DE RELATÓRIOS E CÁLCULOS
  // ==========================================================
  
  useEffect(() => {
    if (pontosGerais.length > 0 && usuarios.length > 0) {
        gerarRelatorioMensal();
    }
  }, [mesRelatorio, anoRelatorio, pontosGerais, usuarios, view]);

  function gerarRelatorioMensal() {
      const relatorio = usuarios.map(user => {
          // Filtra apenas os pontos do mês e ano selecionados para este usuário
          const pontosDoMes = pontosGerais.filter(p => {
              const d = new Date(p.data);
              return p.usuarioId === user.id && d.getMonth() === mesRelatorio && d.getFullYear() === anoRelatorio;
          });

          // Descobre quantos dias tem o mês selecionado
          const ultimoDia = new Date(anoRelatorio, mesRelatorio + 1, 0).getDate();
          
          let diasContados = 0;
          let diasFaltosos = [];
          let minutosTrabalhados = 0;
          const hoje = new Date(); 

          // Loop dia a dia do mês (1 até 30/31)
          for (let i = 1; i <= ultimoDia; i++) {
              const dataAtual = new Date(anoRelatorio, mesRelatorio, i);
              const dataStr = dataAtual.toLocaleDateString('pt-BR');
              
              diasContados++; // Consideramos dias corridos para cálculo simples (meta 8h/dia)

              // Verifica se houve algum registro neste dia
              const tevePonto = pontosDoMes.some(p => new Date(p.data).toLocaleDateString('pt-BR') === dataStr);
              
              // Lógica de Falta: Se não teve ponto E o dia já passou
              const dataAtualSemHora = new Date(dataAtual.toDateString());
              const hojeSemHora = new Date(hoje.toDateString());

              if (!tevePonto && dataAtualSemHora < hojeSemHora) { 
                  diasFaltosos.push(`${i}/${mesRelatorio + 1}`);
              }

              // Calcula horas trabalhadas no dia (Diferença Entrada -> Saída)
              const pontosDia = pontosDoMes.filter(p => new Date(p.data).toLocaleDateString('pt-BR') === dataStr);
              const entrada = pontosDia.find(p => p.tipo === 'Entrada');
              
              if (entrada) {
                  const ultimaSaida = pontosDia.filter(p => p.tipo === 'Saída').pop();
                  if (ultimaSaida) {
                      const diff = new Date(ultimaSaida.data) - new Date(entrada.data);
                      minutosTrabalhados += Math.floor(diff / 60000); // converte ms para minutos
                  }
              }
          }

          // Saldo: Meta é 8h (480 min) * Dias do Mês
          const metaMinutos = diasContados * 480; 
          const saldoMinutos = minutosTrabalhados - metaMinutos;

          // Formatação para exibição (HH:MM)
          const horasTotal = Math.floor(minutosTrabalhados / 60);
          const minsTotal = minutosTrabalhados % 60;
          
          return {
              id: user.id,
              nome: user.nome,
              cpf: user.cpf,
              totalHoras: `${String(horasTotal).padStart(2,'0')}:${String(minsTotal).padStart(2,'0')}`,
              saldoMinutos: saldoMinutos,
              faltas: diasFaltosos
          };
      });
      setDadosRelatorio(relatorio);
  }

  // ==========================================================
  // 4. FUNÇÕES DE AÇÃO (CRIAR, EDITAR, BLOQUEAR)
  // ==========================================================

  // --- Criar Novo Usuário ---
  async function handleNovoUsuario() {
      if(!novoUser.nome || !novoUser.cpf) return toast.warning("Nome e CPF são campos obrigatórios.");
      
      try {
        const res = await fetch("/api/usuarios", {
            method: "POST",
            body: JSON.stringify(novoUser)
        });
        const data = await res.json();

        if (data.success) {
            setUsuarios([...usuarios, data.usuario]);
            setModalNovoUsuario(false);
            setNovoUser({ nome: "", cpf: "", email: "", cargo: "" });
            toast.success("Colaborador criado com sucesso!");
            carregarDados(); // Atualiza tudo para garantir
        } else {
            toast.error(data.message);
        }
      } catch (error) {
          toast.error("Erro ao conectar com o servidor.");
      }
  }

  // --- Abrir Modal de Edição ---
  function abrirEdicao(user) {
      setUsuarioParaEditar({ ...user });
      setModalEditarUsuario(true);
  }

  // --- Salvar Edição ---
  async function handleSalvarEdicao() {
      try {
          const res = await fetch('/api/usuarios', {
              method: 'PUT',
              body: JSON.stringify(usuarioParaEditar)
          });
          const data = await res.json();
          
          if (data.success) {
              toast.success("Dados do colaborador atualizados!");
              setModalEditarUsuario(false);
              carregarDados(); // Recarrega a lista
          } else {
              toast.error(data.message);
          }
      } catch (e) { 
          toast.error("Erro ao salvar alterações."); 
      }
  }

  // --- Bloquear / Desbloquear Usuário ---
  async function toggleStatusUsuario(user) {
      const novoStatus = user.status === 'ativo' ? 'inativo' : 'ativo';
      const acao = novoStatus === 'ativo' ? 'desbloquear' : 'bloquear';
      
      if (confirm(`Tem certeza que deseja ${acao} o acesso de ${user.nome}?`)) {
          try {
              // Chama a API para persistir a mudança
              const res = await fetch('/api/usuarios', {
                  method: 'PUT',
                  body: JSON.stringify({ id: user.id, status: novoStatus })
              });
              const data = await res.json();

              if (data.success) {
                  // Atualiza a lista localmente para feedback instantâneo
                  const atualizados = usuarios.map(u => u.id === user.id ? {...u, status: novoStatus} : u);
                  setUsuarios(atualizados);
                  
                  // Se estiver com ele aberto, atualiza o status também
                  if (usuarioSelecionado && usuarioSelecionado.id === user.id) {
                      setUsuarioSelecionado({...user, status: novoStatus});
                  }
                  
                  toast.success(`Usuário ${novoStatus === 'ativo' ? 'ativado' : 'bloqueado'} com sucesso!`);
              } else {
                  toast.error("Erro ao salvar status no servidor.");
              }
          } catch (e) {
              toast.error("Erro de conexão com o servidor.");
          }
      }
  }

  // Helper para verificar se está online (Baseado no último ponto de hoje)
  function getStatusUsuario(userId) {
      const hojeStr = new Date().toLocaleDateString('pt-BR');
      const pontosHoje = pontosGerais
        .filter(p => p.usuarioId === userId && new Date(p.data).toLocaleDateString('pt-BR') === hojeStr)
        .sort((a,b) => new Date(a.data) - new Date(b.data));

      if (pontosHoje.length === 0) return "offline";
      const ultimoPonto = pontosHoje[pontosHoje.length - 1];
      
      if (['Entrada', 'Volta Intervalo'].includes(ultimoPonto.tipo)) return "online";
      return "pausa"; 
  }

  // Helper para encontrar mensagem/justificativa de um dia específico
  function getMensagemDia(dataIso) {
      if (!usuarioSelecionado) return null;
      // Procura no array de mensagens carregado do banco
      const msg = todasMensagens.find(m => m.usuarioId == usuarioSelecionado.id && m.dataIso === dataIso);
      return msg ? msg.texto : null;
  }

  // Filtro da barra de busca
  const usuariosFiltrados = usuarios.filter(u => 
    u.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    u.cpf.includes(termoBusca)
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex text-gray-800">
      
      {/* ======================= SIDEBAR (MENU LATERAL) ======================= */}
      <aside className="w-64 bg-[#071d41] text-white flex flex-col fixed h-full z-10 shadow-xl">
        <div className="p-6 border-b border-blue-900">
            <h1 className="text-2xl font-black tracking-tight">Pinguim<br/><span className="text-blue-300">Admin</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <BotaoMenu 
                icon={<LayoutDashboard size={20}/>} 
                text="Visão Geral" 
                active={view === 'dashboard' && !usuarioSelecionado} 
                onClick={() => { setView('dashboard'); setUsuarioSelecionado(null); }} 
            />
            <BotaoMenu 
                icon={<FileText size={20}/>} 
                text="Relatórios" 
                active={view === 'relatorios'} 
                onClick={() => { setView('relatorios'); setUsuarioSelecionado(null); }} 
            />
        </nav>
        <div className="p-4 border-t border-blue-900">
            <button 
                onClick={() => window.location.href = '/'} 
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white w-full p-3 rounded hover:bg-white/10 transition"
            >
                <LogOut size={18} /> Sair do Sistema
            </button>
        </div>
      </aside>

      {/* ======================= CONTEÚDO PRINCIPAL ======================= */}
      <main className="ml-64 flex-1 p-8">
        
        {/* HEADER SUPERIOR */}
        <header className="flex justify-between items-center mb-8 relative">
            <div>
                <h2 className="text-2xl font-bold text-[#071d41]">
                    {usuarioSelecionado ? `Gestão: ${usuarioSelecionado.nome}` : view === 'relatorios' ? 'Relatórios Mensais' : 'Painel de Controle'}
                </h2>
                <p className="text-gray-500 text-sm">Administração e monitoramento de ponto.</p>
            </div>
            
            <div className="flex items-center gap-4">
                {/* ÍCONE DE NOTIFICAÇÃO (SINO) */}
                <div className="relative">
                    <button 
                        onClick={() => setMostrarNotificacoes(!mostrarNotificacoes)} 
                        className="bg-white p-2.5 rounded-full shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 relative transition"
                    >
                        <Bell size={20} className="text-gray-500" />
                        {ultimosRegistros.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
                    </button>
                    
                    {mostrarNotificacoes && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-scale-in overflow-hidden">
                            <div className="p-3 border-b border-gray-100 font-bold text-[#071d41] text-sm flex justify-between items-center bg-gray-50">
                                Atividades Recentes
                                <span onClick={() => setMostrarNotificacoes(false)} className="cursor-pointer text-gray-400 hover:text-red-500"><X size={16}/></span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {ultimosRegistros.map((reg, i) => (
                                    <div key={i} className="p-3 border-b border-gray-50 hover:bg-blue-50 text-sm transition">
                                        <p className="font-bold text-[#1351b4]">{reg.nome}</p>
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span className="font-medium bg-gray-100 px-1 rounded">{reg.tipo}</span>
                                            <span>{new Date(reg.data).toLocaleTimeString('pt-BR')}</span>
                                        </div>
                                    </div>
                                ))}
                                {ultimosRegistros.length === 0 && <p className="p-4 text-center text-gray-400 text-sm">Nenhuma atividade recente.</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* PERFIL DO ADMIN */}
                <div className="flex items-center gap-3 pl-4 border-l">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-[#071d41]">Admin Master</p>
                        <p className="text-xs text-gray-500">Gestor de RH</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        AD
                    </div>
                </div>
            </div>
        </header>

        {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 animate-pulse">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p>Carregando dados do sistema...</p>
            </div>
        ) : (
            <>
                {/* =================================================
                   VIEW 1: DASHBOARD (VISÃO GERAL)
                   =================================================
                */}
                {view === 'dashboard' && !usuarioSelecionado && (
                    <div className="space-y-6 animate-fade-in">
                        {/* CARDS KPI (INDICADORES) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <CardResumo 
                                titulo="Colaboradores Ativos" 
                                valor={usuarios.filter(u => u.status === 'ativo').length} 
                                icon={<CheckCircle className="text-blue-500" />} 
                                cor="border-l-4 border-blue-500" 
                            />
                            <CardResumo 
                                titulo="Trabalhando Agora" 
                                valor={usuarios.filter(u => getStatusUsuario(u.id) === 'online').length} 
                                icon={<Clock className="text-green-500" />} 
                                cor="border-l-4 border-green-500" 
                            />
                            <CardResumo 
                                titulo="Inativos / Bloqueados" 
                                valor={usuarios.filter(u => u.status === 'inativo').length} 
                                icon={<UserX className="text-red-500" />} 
                                cor="border-l-4 border-red-500" 
                            />
                        </div>

                        {/* TABELA DE USUÁRIOS */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center bg-gray-50 gap-4">
                                <h3 className="font-bold text-[#071d41] text-lg">Gerenciar Colaboradores</h3>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <div className="relative flex-1 md:flex-none">
                                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Buscar nome ou CPF..." 
                                            className="pl-9 pr-4 py-2 border rounded-full text-sm focus:outline-blue-500 w-full md:w-64 bg-white" 
                                            value={termoBusca}
                                            onChange={(e) => setTermoBusca(e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        onClick={() => setModalNovoUsuario(true)} 
                                        className="bg-[#1351b4] hover:bg-blue-800 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition shadow-sm"
                                    >
                                        <UserPlus size={16} /> <span className="hidden md:inline">Adicionar</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="p-4">Colaborador</th>
                                            <th className="p-4">Cargo</th>
                                            <th className="p-4 text-center">Acesso</th>
                                            <th className="p-4 text-center">Status Hoje</th>
                                            <th className="p-4 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {usuariosFiltrados.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="p-8 text-center text-gray-400 italic">
                                                    Nenhum colaborador encontrado com esse termo.
                                                </td>
                                            </tr>
                                        )}
                                        {usuariosFiltrados.map(user => {
                                            const statusHoje = getStatusUsuario(user.id);
                                            return (
                                                <tr key={user.id} className={`hover:bg-blue-50 transition ${user.status === 'inativo' ? 'opacity-60 bg-gray-50' : ''}`}>
                                                    <td className="p-4">
                                                        <div className="font-bold text-[#071d41] text-base">{user.nome}</div>
                                                        <div className="text-xs text-gray-400 flex flex-col">
                                                            <span>CPF: {user.cpf}</span>
                                                            {user.email && <span>{user.email}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-gray-600 font-medium">{user.cargo}</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${user.status === 'ativo' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                            {user.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center"><BadgeStatus status={statusHoje} /></td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button 
                                                                onClick={() => setUsuarioSelecionado(user)} 
                                                                className="bg-blue-100 text-[#1351b4] p-2 rounded hover:bg-blue-200 transition"
                                                                title="Ver Espelho de Ponto"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            <button 
                                                                onClick={() => abrirEdicao(user)} 
                                                                className="bg-orange-100 text-orange-600 p-2 rounded hover:bg-orange-200 transition"
                                                                title="Editar Dados"
                                                            >
                                                                <Edit3 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* =================================================
                   VIEW 2: RELATÓRIOS (GERAL)
                   =================================================
                */}
                {view === 'relatorios' && !usuarioSelecionado && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                <h3 className="font-bold text-[#071d41] flex items-center gap-2 text-lg">
                                    <FileText size={24} className="text-[#1351b4]"/> Relatório Mensal de Ponto
                                </h3>
                                <div className="flex gap-2">
                                     <select value={mesRelatorio} onChange={e => setMesRelatorio(Number(e.target.value))} className="border p-2 rounded text-sm bg-gray-50 outline-none focus:border-blue-500 cursor-pointer">
                                         {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m,i) => <option key={i} value={i}>{m}</option>)}
                                     </select>
                                     <select value={anoRelatorio} onChange={e => setAnoRelatorio(Number(e.target.value))} className="border p-2 rounded text-sm bg-gray-50 outline-none focus:border-blue-500 cursor-pointer">
                                         {Array.from({length: 5}, (_,i) => 2026 + i).map(a => <option key={a} value={a}>{a}</option>)}
                                     </select>
                                     <button className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition shadow-sm">
                                         <Download size={16}/> Exportar PDF
                                     </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="p-3 border">Colaborador</th>
                                            <th className="p-3 border text-center">Horas Trabalhadas</th>
                                            <th className="p-3 border text-center">Saldo de Horas</th>
                                            <th className="p-3 border text-center">Dias com Falta</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dadosRelatorio.map(rel => (
                                            <tr key={rel.id} className="hover:bg-gray-50 transition">
                                                <td className="p-3 border font-bold text-[#071d41]">
                                                    {rel.nome}<br/>
                                                    <span className="text-[10px] text-gray-400 font-normal">{rel.cpf}</span>
                                                </td>
                                                <td className="p-3 border text-center font-mono text-gray-700 font-medium">{rel.totalHoras}</td>
                                                <td className="p-3 border text-center font-bold">
                                                    <span className={`px-2 py-1 rounded ${rel.saldoMinutos >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                        {formatarSaldo(rel.saldoMinutos)}
                                                    </span>
                                                </td>
                                                <td className="p-3 border text-center">
                                                    {rel.faltas.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1 justify-center">
                                                            {rel.faltas.slice(0, 5).map((f, i) => (
                                                                <span key={i} className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200">
                                                                    {f}
                                                                </span>
                                                            ))}
                                                            {rel.faltas.length > 5 && <span className="text-xs text-gray-500">+{rel.faltas.length - 5}</span>}
                                                        </div>
                                                    ) : <span className="text-green-500 font-bold text-xs flex items-center justify-center gap-1"><CheckCircle size={12}/> 100% Presente</span>}
                                                </td>
                                            </tr>
                                        ))}
                                        {dadosRelatorio.length === 0 && (
                                            <tr><td colSpan="4" className="p-10 text-center text-gray-400">Nenhum dado encontrado para o período selecionado.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-100 text-xs text-blue-800 flex items-start gap-2">
                                <AlertCircle size={16} className="mt-0.5"/>
                                <p><strong>Nota do Sistema:</strong> O cálculo de saldo considera uma jornada padrão de 8 horas diárias, de segunda a segunda. Dias sem registro no passado contam como falta.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* =================================================
                   VIEW 3: FICHA DO COLABORADOR (DETALHES)
                   =================================================
                */}
                {usuarioSelecionado && (
                    <div className="animate-fade-in space-y-6">
                        {/* Header da Ficha */}
                        <div className="flex items-center justify-between">
                            <button onClick={() => setUsuarioSelecionado(null)} className="text-sm text-gray-500 hover:text-[#1351b4] flex items-center gap-1 font-bold transition">
                                <ChevronDown size={16} className="rotate-90"/> Voltar para Lista
                            </button>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => toggleStatusUsuario(usuarioSelecionado)}
                                    className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition shadow-sm ${usuarioSelecionado.status === 'ativo' ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'}`}
                                >
                                    {usuarioSelecionado.status === 'ativo' ? <><Lock size={16}/> Bloquear Acesso</> : <><Unlock size={16}/> Desbloquear Acesso</>}
                                </button>
                            </div>
                        </div>

                        {/* Card Info Usuário */}
                        <div className="bg-white p-6 rounded shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-2xl font-bold">
                                    {usuarioSelecionado.nome.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[#071d41]">{usuarioSelecionado.nome}</h2>
                                    <div className="text-gray-500 text-sm flex gap-2">
                                        <span className="bg-blue-50 text-blue-800 px-2 rounded font-bold">{usuarioSelecionado.cargo}</span>
                                        <span>• CPF: {usuarioSelecionado.cpf}</span>
                                    </div>
                                    <p className="text-gray-400 text-xs mt-1">{usuarioSelecionado.email || "Sem e-mail cadastrado"}</p>
                                </div>
                            </div>
                            
                            <div className="text-right bg-gray-50 p-3 rounded border border-gray-100">
                                <div className="flex gap-2 mb-2 justify-end">
                                     <select value={mesFicha} onChange={e => setMesFicha(Number(e.target.value))} className="border p-1 rounded text-xs outline-none bg-white">
                                         {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m,i) => <option key={i} value={i}>{m}</option>)}
                                     </select>
                                     <select value={anoFicha} onChange={e => setAnoFicha(Number(e.target.value))} className="border p-1 rounded text-xs outline-none bg-white">
                                         {Array.from({length: 5}, (_,i) => 2026 + i).map(a => <option key={a} value={a}>{a}</option>)}
                                     </select>
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Visualizando Espelho</p>
                            </div>
                        </div>

                        {/* Acordeão de Histórico */}
                        <div className="bg-white rounded shadow-sm border border-gray-200">
                             <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <span className="font-bold text-[#071d41] flex items-center gap-2"><Calendar size={18}/> Histórico Detalhado</span>
                                <span className="text-xs text-gray-400">Clique no dia para ver detalhes</span>
                             </div>
                             
                             <div className="divide-y divide-gray-100">
                                {gerarDiasDoMesSelecionado(mesFicha, anoFicha, pontosGerais.filter(p => p.usuarioId === usuarioSelecionado.id)).map((dia, idx) => (
                                    <ItemDiaAdmin 
                                        key={idx} 
                                        dia={dia} 
                                        // AQUI ESTÁ A LÓGICA CRUCIAL:
                                        // Buscamos a mensagem correspondente a este dia e este usuário na lista geral
                                        mensagem={getMensagemDia(dia.dataIso)} 
                                    />
                                ))}
                             </div>
                        </div>
                    </div>
                )}
            </>
        )}

      </main>

      {/* =================================================
         MODAIS (POP-UPS)
         =================================================
      */}

      {/* MODAL NOVO USUÁRIO */}
      {modalNovoUsuario && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm animate-scale-in">
                  <div className="flex justify-between items-center mb-6 border-b pb-2">
                      <h3 className="text-lg font-bold text-[#071d41]">Cadastrar Colaborador</h3>
                      <button onClick={() => setModalNovoUsuario(false)} className="text-gray-400 hover:text-red-500"><X/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
                          <input placeholder="Ex: João Silva" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={novoUser.nome} onChange={e => setNovoUser({...novoUser, nome: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">CPF (Apenas números)</label>
                          <input placeholder="000.000.000-00" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={novoUser.cpf} onChange={e => setNovoUser({...novoUser, cpf: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">E-mail (Para recuperação)</label>
                          <input placeholder="email@exemplo.com" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={novoUser.email} onChange={e => setNovoUser({...novoUser, email: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Cargo</label>
                          <input placeholder="Ex: Vendedor" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={novoUser.cargo} onChange={e => setNovoUser({...novoUser, cargo: e.target.value})} />
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded text-xs text-blue-800 flex items-start gap-2 mt-2">
                        <AlertCircle size={14} className="mt-0.5 min-w-[14px]"/>
                        <p>O usuário será criado com a senha padrão <strong>123</strong> (ou pinguim) e deverá trocá-la no primeiro acesso.</p>
                      </div>

                      <button onClick={handleNovoUsuario} className="w-full bg-[#1351b4] text-white font-bold py-3 rounded mt-2 hover:bg-blue-800 transition shadow-lg">CADASTRAR</button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL EDITAR USUÁRIO */}
      {modalEditarUsuario && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm animate-scale-in border-t-4 border-orange-500">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-[#071d41] flex items-center gap-2"><Edit3 size={20} className="text-orange-500"/> Editar Dados</h3>
                      <button onClick={() => setModalEditarUsuario(false)} className="text-gray-400 hover:text-red-500"><X/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
                          <input className="w-full border p-2.5 rounded focus:ring-2 focus:ring-orange-200 outline-none" value={usuarioParaEditar.nome} onChange={e => setUsuarioParaEditar({...usuarioParaEditar, nome: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">CPF (Bloqueado)</label>
                          <input className="w-full border p-2.5 rounded bg-gray-100 text-gray-500 cursor-not-allowed" readOnly value={usuarioParaEditar.cpf} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">E-mail</label>
                          <input className="w-full border p-2.5 rounded focus:ring-2 focus:ring-orange-200 outline-none" value={usuarioParaEditar.email} onChange={e => setUsuarioParaEditar({...usuarioParaEditar, email: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Cargo</label>
                          <input className="w-full border p-2.5 rounded focus:ring-2 focus:ring-orange-200 outline-none" value={usuarioParaEditar.cargo} onChange={e => setUsuarioParaEditar({...usuarioParaEditar, cargo: e.target.value})} />
                      </div>
                      
                      <button onClick={handleSalvarEdicao} className="w-full bg-orange-500 text-white font-bold py-3 rounded mt-2 hover:bg-orange-600 flex items-center justify-center gap-2 transition shadow-lg">
                          <Save size={18}/> SALVAR ALTERAÇÕES
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}

// ==========================================================
// COMPONENTES AUXILIARES (PARA NÃO POLUIR O CÓDIGO PRINCIPAL)
// ==========================================================

function ItemDiaAdmin({ dia, mensagem }) {
    const [aberto, setAberto] = useState(false);
    
    // Cálculo do Saldo Diário para o Admin ver rápido
    let saldoStr = "00:00";
    let saldoPositivo = true;
    const primeiraEntrada = dia.pontos.find(p => p.tipo === 'Entrada');
    const ultimaSaida = dia.pontos.filter(p => p.tipo === 'Saída').pop();

    if (primeiraEntrada && ultimaSaida) {
        const diff = new Date(ultimaSaida.data) - new Date(primeiraEntrada.data);
        const meta = 8 * 60 * 60 * 1000; // 8 horas em ms
        const saldoMs = diff - meta;
        saldoPositivo = saldoMs >= 0;
        const absSaldo = Math.abs(saldoMs);
        const h = Math.floor(absSaldo / 3600000);
        const m = Math.floor((absSaldo % 3600000) / 60000);
        saldoStr = `${saldoPositivo ? '' : '-'}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    }

    return (
        <div>
            <div 
                onClick={() => setAberto(!aberto)} 
                className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition ${aberto ? 'bg-blue-50/50' : ''}`}
            >
                <div className="flex flex-col">
                    <span className="font-bold text-sm text-[#071d41]">{dia.dataFormatada}</span>
                    <span className="text-xs text-gray-400">{dia.diaSemana}</span>
                </div>
                <div className="flex items-center gap-4">
                    {mensagem && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 font-bold bg-blue-100 px-2 py-1 rounded">
                            <MessageCircle size={14} /> MSG
                        </div>
                    )}
                    <div className="text-right text-xs font-mono text-gray-600 hidden md:block">
                        {primeiraEntrada ? new Date(primeiraEntrada.data).toLocaleTimeString('pt-BR').slice(0,5) : '--:--'} 
                        {' - '} 
                        {ultimaSaida ? new Date(ultimaSaida.data).toLocaleTimeString('pt-BR').slice(0,5) : '--:--'}
                    </div>
                    {primeiraEntrada && (
                        <div className={`w-20 text-center text-xs font-bold text-white px-2 py-1 rounded-full ${saldoPositivo ? 'bg-green-500' : 'bg-red-400'}`}>
                            {saldoStr}
                        </div>
                    )}
                    {aberto ? <ChevronUp size={18} className="text-gray-300" /> : <ChevronDown size={18} className="text-gray-300" />}
                </div>
            </div>
            
            {/* Detalhes expandidos */}
            {aberto && (
                <div className="bg-gray-50 p-4 border-t border-gray-100 pl-8 animate-fade-in">
                    {mensagem && (
                        <div className="mb-4 bg-white border border-blue-200 p-3 rounded-lg shadow-sm">
                            <p className="text-xs font-bold text-blue-800 flex items-center gap-2 mb-1">
                                <MessageCircle size={14}/> Justificativa do Colaborador:
                            </p>
                            <p className="text-sm text-gray-700 italic">"{mensagem}"</p>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Registros do Dia</p>
                            {dia.pontos.length > 0 ? dia.pontos.map((p, i) => (
                                <div key={i} className="flex justify-between text-sm border-b border-gray-200 py-1 last:border-0">
                                    <span className={`font-semibold ${p.tipo === 'Entrada' ? 'text-green-600' : p.tipo === 'Saída' ? 'text-red-600' : 'text-blue-600'}`}>
                                        {p.tipo}
                                    </span>
                                    <span className="font-mono text-gray-600">
                                        {new Date(p.data).toLocaleTimeString('pt-BR')}
                                    </span>
                                </div>
                            )) : <p className="text-sm text-gray-400 italic">Sem registros neste dia.</p>}
                        </div>
                        
                        <div className="text-center md:border-l border-gray-200 flex flex-col justify-center mt-4 md:mt-0">
                            <p className="text-xs font-bold text-gray-400 uppercase">Saldo Total Calculado</p>
                            <p className={`text-3xl font-bold ${saldoPositivo ? 'text-green-600' : 'text-red-600'}`}>
                                {saldoStr}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function BotaoMenu({ icon, text, active, onClick }) {
    return (
        <div 
            onClick={onClick} 
            className={`flex items-center gap-3 p-3 rounded cursor-pointer transition select-none ${active ? 'bg-[#1351b4] text-white font-bold shadow-md' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
        >
            {icon}
            <span className="text-sm">{text}</span>
        </div>
    )
}

function CardResumo({ titulo, valor, icon, cor }) {
    return (
        <div className={`bg-white p-6 rounded shadow-sm border border-gray-200 flex items-center justify-between ${cor}`}>
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase mb-1 tracking-wide">{titulo}</p>
                <p className="text-3xl font-bold text-[#071d41]">{valor}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-full border border-gray-100">
                {icon}
            </div>
        </div>
    )
}

function BadgeStatus({ status }) {
    if (status === 'online') return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span> 
            ONLINE
        </span>
    )
    if (status === 'pausa') return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div> 
            PAUSA
        </span>
    )
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div> 
            OFF
        </span>
    )
}

function formatarSaldo(minutos) {
    const abs = Math.abs(minutos);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    const str = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    return minutos >= 0 ? `+${str}` : `-${str}`;
}

function gerarDiasDoMesSelecionado(mes, ano, pontos) {
    const dias = [];
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    for (let i = 1; i <= ultimoDia; i++) {
        const d = new Date(ano, mes, i);
        const dataStr = d.toLocaleDateString('pt-BR');
        const dataIso = d.toISOString().split('T')[0];
        const pontosDoDia = pontos.filter(h => new Date(h.data).toLocaleDateString('pt-BR') === dataStr);
        dias.push({ 
            dataIso, 
            dataFormatada: dataStr, 
            diaSemana: d.toLocaleDateString('pt-BR', {weekday: 'long'}), 
            pontos: pontosDoDia 
        });
    }
    return dias.reverse(); // Mostra do dia 31 pro dia 1
}