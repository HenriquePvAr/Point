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
  PlusCircle, 
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
  Trash2,
  Printer,
  ArrowLeft,
  Mail,
  Coffee 
} from "lucide-react";
import { toast } from 'sonner';

export default function AdminPage() {
  // ==========================================================
  // 1. ESTADOS GERAIS DA APLICAÇÃO
  // ==========================================================
  
  // Controle de Navegação e Loading
  const [view, setView] = useState("dashboard"); // Opções: 'dashboard', 'relatorios'
  const [loading, setLoading] = useState(true);

  // Dados do Admin Logado (Carregado do Banco)
  const [adminUser, setAdminUser] = useState({
      id: null,
      nome: "Carregando...",
      email: "...",
      cargo: "Gestor"
  });

  // Dados Principais (Banco de Dados Local)
  const [usuarios, setUsuarios] = useState([]);
  const [pontosGerais, setPontosGerais] = useState([]);
  const [folgasGerais, setFolgasGerais] = useState([]); // Armazena as folgas de todos
  const [todasMensagens, setTodasMensagens] = useState([]); // Armazena as justificativas
  
  // Notificações e Atividades Recentes
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]); 

  // Busca e Seleção de Usuário
  const [termoBusca, setTermoBusca] = useState("");
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null); // Se preenchido, mostra a ficha individual
  const [relatorioDetalhado, setRelatorioDetalhado] = useState(null); // Folha de Ponto (Relatórios)

  // Modais (Pop-ups)
  const [modalNovoUsuario, setModalNovoUsuario] = useState(false);
  const [modalEditarUsuario, setModalEditarUsuario] = useState(false);
  const [modalPerfilAdmin, setModalPerfilAdmin] = useState(false); // Modal do Admin

  // Formulários
  const [novoUser, setNovoUser] = useState({ nome: "", email: "", cargo: "" });
  const [usuarioParaEditar, setUsuarioParaEditar] = useState({});
  const [adminParaEditar, setAdminParaEditar] = useState({}); // Form do Admin

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

        // 1. Buscar lista de usuários, mensagens e notificações
        const [resUsers, resMsgs, resNotif] = await Promise.all([
            fetch('/api/usuarios'),
            fetch('/api/mensagens'),
            fetch('/api/notificacoes')
        ]);
        
        const dataUsers = await resUsers.json();
        
        // --- LÓGICA PARA IDENTIFICAR O ADMIN ---
        // Pega o primeiro usuário do tipo 'admin' para preencher o perfil no topo
        const adminEncontrado = dataUsers.find(u => u.tipo === 'admin');
        if (adminEncontrado) {
            setAdminUser(adminEncontrado);
        } else {
            // Fallback visual caso não ache
            setAdminUser({ nome: "Admin Master", email: "admin@sistema.com", cargo: "Gestor", id: null });
        }

        let todosPontos = [];
        let todasFolgas = [];

        // 2. Buscar pontos e folgas de todos os usuários
        for (let user of dataUsers) {
            try {
              // Buscar Pontos
              const resPonto = await fetch(`/api/ponto?userId=${user.id}`);
              const dataPonto = await resPonto.json();
              todosPontos = [...todosPontos, ...dataPonto];

              // Buscar Folgas
              const resFolga = await fetch(`/api/folgas?userId=${user.id}`);
              const dataFolga = await resFolga.json(); // Array de strings ["2026-01-20"]
              
              // Mapeia para um formato fácil de buscar
              dataFolga.forEach(dataString => {
                  todasFolgas.push({ usuarioId: user.id, dataIso: dataString });
              });

            } catch(e) { 
                console.log(`Aviso: Erro ao carregar dados do usuário ${user.id}`); 
            }
        }

        const dataMsg = await resMsgs.json();
        const dataNotif = await resNotif.json();
        
        // Atualiza todos os estados
        setUsuarios(dataUsers);
        setPontosGerais(todosPontos);
        setFolgasGerais(todasFolgas);
        setTodasMensagens(dataMsg);
        setNotificacoes(Array.isArray(dataNotif) ? dataNotif : []);

        setLoading(false);
    } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar dados do sistema.");
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
  }, [mesRelatorio, anoRelatorio, pontosGerais, usuarios, folgasGerais]);

  function gerarRelatorioMensal() {
      const relatorio = usuarios.map(user => {
          const ultimoDia = new Date(anoRelatorio, mesRelatorio + 1, 0).getDate();
          
          let diasTrabalhadosEsperados = 0; // Dias que deveriam ter trabalho
          let diasFolgaCount = 0;           // Dias marcados como folga
          let minutosTrabalhados = 0;
          let diasFaltosos = []; // Apenas visual para contagem simples
          const hoje = new Date(); 

          for (let i = 1; i <= ultimoDia; i++) {
              const dataAtual = new Date(anoRelatorio, mesRelatorio, i);
              const dataStr = dataAtual.toLocaleDateString('pt-BR');
              const dataIso = dataAtual.toISOString().split('T')[0];
              
              // Verifica se é folga
              const ehFolga = folgasGerais.some(f => f.usuarioId === user.id && f.dataIso === dataIso);

              if (ehFolga) {
                  diasFolgaCount++;
                  // Se é folga, não incrementa a meta de horas (saldo deve ser 00:00)
                  continue; 
              }

              // Se não é folga, conta como dia útil esperado
              diasTrabalhadosEsperados++;

              // Verifica Ponto
              const pontosDia = pontosGerais.filter(p => p.usuarioId === user.id && new Date(p.data).toLocaleDateString('pt-BR') === dataStr);
              const entrada = pontosDia.find(p => p.tipo === 'Entrada');
              const tevePonto = pontosDia.length > 0;
              
              // Lógica de Falta (Passado, sem ponto e não é folga)
              const dataAtualSemHora = new Date(dataAtual.toDateString());
              const hojeSemHora = new Date(hoje.toDateString());

              if (!tevePonto && dataAtualSemHora < hojeSemHora) { 
                  diasFaltosos.push(`${i}/${mesRelatorio + 1}`);
              }

              // Calcula horas trabalhadas no dia
              if (entrada) {
                  const ultimaSaida = pontosDia.filter(p => p.tipo === 'Saída').pop();
                  if (ultimaSaida) {
                      let dtEntrada = new Date(entrada.data);
                      let dtSaida = new Date(ultimaSaida.data);
                      // Correção Madrugada
                      if (dtSaida < dtEntrada) dtSaida.setDate(dtSaida.getDate() + 1);

                      minutosTrabalhados += Math.floor((dtSaida - dtEntrada) / 60000); 
                  }
              }
          }

          // Meta = Dias Úteis (Não Folga) * 8 horas
          const metaMinutos = diasTrabalhadosEsperados * 480; 
          const saldoMinutos = minutosTrabalhados - metaMinutos;

          const horasTotal = Math.floor(minutosTrabalhados / 60);
          const minsTotal = minutosTrabalhados % 60;
          
          return {
              id: user.id,
              nome: user.nome,
              email: user.email,
              cargo: user.cargo,
              totalHoras: `${String(horasTotal).padStart(2,'0')}:${String(minsTotal).padStart(2,'0')}`,
              saldoMinutos: saldoMinutos,
              diasFolga: diasFolgaCount,
              faltas: diasFaltosos
          };
      });
      setDadosRelatorio(relatorio);
  }

  // ==========================================================
  // 4. AÇÕES E EMAIL
  // ==========================================================

  // -- Edição do Admin (ABRIR) --
  function abrirEdicaoAdmin() {
      setAdminParaEditar({ ...adminUser });
      setModalPerfilAdmin(true);
  }

  // -- Edição do Admin (SALVAR NO BANCO) --
  async function salvarPerfilAdmin() {
      if (!adminUser.id) return toast.error("ID do admin não encontrado.");

      try {
          const res = await fetch('/api/usuarios', {
              method: 'PUT',
              body: JSON.stringify({
                  id: adminUser.id,
                  nome: adminParaEditar.nome,
                  email: adminParaEditar.email,
                  cargo: adminParaEditar.cargo,
                  acao: 'editar' // Importante para o backend saber que é edição de perfil
              })
          });

          const data = await res.json();

          if (data.success) {
              setAdminUser(adminParaEditar); // Atualiza visual
              setModalPerfilAdmin(false);
              toast.success("Perfil atualizado com sucesso!");
              carregarDados(); // Recarrega para garantir
          } else {
              toast.error(data.message || "Erro ao atualizar.");
          }
      } catch (e) {
          toast.error("Erro de conexão.");
      }
  }

  // -- Envio de Email do Relatório (AGORA VIA API REAL) --
  async function handleEnviarEmailRelatorio(colaborador) {
      const toastId = toast.loading(`Gerando relatório de ${colaborador.nome}...`);
      
      try {
          // 1. Gera os dados completos do mês (incluindo status de folga)
          const diasRelatorio = gerarDiasDoMesParaRelatorio(
              mesRelatorio, 
              anoRelatorio, 
              pontosGerais.filter(p => p.usuarioId === colaborador.id),
              folgasGerais.filter(f => f.usuarioId === colaborador.id)
          );

          // 2. Monta o HTML da tabela para o e-mail
          const linhasTabela = diasRelatorio.map(dia => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${dia.dataFormatada} (${dia.diaSemana})</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${dia.entrada}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${dia.saida}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${dia.horasTrabalhadas}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: ${dia.saldoPositivo || dia.saldo === '00:00' ? 'green' : 'red'}; font-weight: bold;">${dia.saldo}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><strong>${dia.status}</strong></td>
            </tr>
          `).join('');

          const htmlBody = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #071d41;">Relatório de Ponto - ${colaborador.nome}</h2>
                <p><strong>Cargo:</strong> ${colaborador.cargo || 'N/A'}</p>
                <p><strong>Período:</strong> ${mesRelatorio + 1}/${anoRelatorio}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead style="background-color: #f3f4f6;">
                        <tr>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Data</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Entrada</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Saída</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">H. Trab</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Saldo</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${linhasTabela}
                    </tbody>
                </table>
                
                <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
                    <p style="margin: 5px 0;"><strong>Saldo Total do Mês:</strong> <span style="color: ${colaborador.saldoMinutos >= 0 ? 'green' : 'red'}; font-size: 14px;">${formatarSaldo(colaborador.saldoMinutos)}</span></p>
                    <p style="margin: 5px 0;"><strong>Dias de Folga:</strong> ${colaborador.diasFolga}</p>
                </div>
                
                <p style="font-size: 11px; color: #999; margin-top: 30px;">Gerado automaticamente pelo Sistema Pinguim Manoa.</p>
            </div>
          `;

          // 3. Chama a API Real
          const res = await fetch('/api/email/enviar-relatorio', {
              method: 'POST',
              body: JSON.stringify({
                  destinatario: adminUser.email,
                  assunto: `Folha de Ponto: ${colaborador.nome} - Ref: ${mesRelatorio+1}/${anoRelatorio}`,
                  htmlBody: htmlBody
              })
          });

          const data = await res.json();
          if (data.success) {
              toast.success(`Enviado com sucesso para ${adminUser.email}!`, { id: toastId });
          } else {
              throw new Error("Falha no envio. Verifique o servidor.");
          }

      } catch (e) {
          console.error(e);
          toast.error("Erro ao enviar email.", { id: toastId });
      }
  }

  // --- Criar Novo Usuário ---
  async function handleNovoUsuario() {
      if(!novoUser.nome || !novoUser.email) return toast.warning("Preencha os campos obrigatórios.");
      try {
        const res = await fetch("/api/usuarios", { method: "POST", body: JSON.stringify(novoUser) });
        const data = await res.json();
        if (data.success) {
            setUsuarios([...usuarios, data.usuario]);
            setModalNovoUsuario(false);
            setNovoUser({ nome: "", email: "", cargo: "" });
            toast.success("Colaborador criado com sucesso!");
            carregarDados(); 
        } else { toast.error(data.message); }
      } catch (error) { toast.error("Erro ao conectar com o servidor."); }
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
              body: JSON.stringify({ ...usuarioParaEditar, acao: 'editar' }) 
          });
          const data = await res.json();
          if (data.success) {
              toast.success("Dados do colaborador atualizados!");
              setModalEditarUsuario(false);
              carregarDados(); 
          } else { toast.error(data.message); }
      } catch (e) { toast.error("Erro ao salvar alterações."); }
  }

  // --- Bloquear / Desbloquear Usuário ---
  async function toggleStatusUsuario(user) {
      const novoStatus = user.status === 'ativo' ? 'inativo' : 'ativo';
      if (confirm(`Tem certeza que deseja ${novoStatus === 'ativo' ? 'ativar' : 'bloquear'} o acesso de ${user.nome}?`)) {
          try {
              const res = await fetch('/api/usuarios', { method: 'PUT', body: JSON.stringify({ id: user.id, status: novoStatus }) });
              const data = await res.json();
              if (data.success) {
                  const atualizados = usuarios.map(u => u.id === user.id ? {...u, status: novoStatus} : u);
                  setUsuarios(atualizados);
                  if (usuarioSelecionado?.id === user.id) setUsuarioSelecionado({...user, status: novoStatus});
                  toast.success(`Status alterado para ${novoStatus}!`);
              } else { toast.error("Erro ao salvar status."); }
          } catch (e) { toast.error("Erro de conexão."); }
      }
  }

  // --- EXCLUIR USUÁRIO ---
  async function handleExcluirUsuario(user) {
    if (confirm(`ATENÇÃO: Tem certeza que deseja EXCLUIR ${user.nome}?\n\nIsso apagará todo o histórico de pontos e mensagens deste colaborador.`)) {
        try {
            const res = await fetch(`/api/usuarios?id=${user.id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Usuário excluído com sucesso.");
                setUsuarios(usuarios.filter(u => u.id !== user.id)); 
                carregarDados(); 
            } else { toast.error("Erro ao excluir usuário."); }
        } catch (e) { toast.error("Erro de conexão."); }
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
      return ['Entrada', 'Volta Intervalo'].includes(ultimoPonto.tipo) ? "online" : "pausa"; 
  }

  // Helper para encontrar mensagem/justificativa de um dia específico
  function getMensagemDia(dataIso) {
      if (!usuarioSelecionado && !relatorioDetalhado) return null;
      const uid = usuarioSelecionado ? usuarioSelecionado.id : relatorioDetalhado.id;
      const msg = todasMensagens.find(m => m.usuarioId == uid && m.dataIso === dataIso);
      return msg ? msg.texto : null;
  }

  const usuariosFiltrados = usuarios.filter(u => 
    u.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(termoBusca.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex text-gray-800">
      
      {/* ======================= SIDEBAR (MENU LATERAL) ======================= */}
      <aside className="w-64 bg-[#071d41] text-white flex flex-col fixed h-full z-10 shadow-xl print:hidden">
        <div className="p-6 border-b border-blue-900">
            <h1 className="text-2xl font-black tracking-tight">Pinguim<br/><span className="text-blue-300">Admin</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <BotaoMenu 
                icon={<LayoutDashboard size={20}/>} 
                text="Visão Geral" 
                active={view === 'dashboard' && !usuarioSelecionado} 
                onClick={() => { setView('dashboard'); setUsuarioSelecionado(null); setRelatorioDetalhado(null); }} 
            />
            <BotaoMenu 
                icon={<FileText size={20}/>} 
                text="Relatórios" 
                active={view === 'relatorios'} 
                onClick={() => { setView('relatorios'); setUsuarioSelecionado(null); setRelatorioDetalhado(null); }} 
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
      <main className="ml-64 flex-1 p-8 print:ml-0 print:p-0 print:w-full">
        
        {/* HEADER SUPERIOR */}
        <header className="flex justify-between items-center mb-8 relative print:hidden">
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
                        {notificacoes.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
                    </button>
                    
                    {mostrarNotificacoes && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-scale-in overflow-hidden">
                            <div className="p-3 border-b border-gray-100 font-bold text-[#071d41] text-sm flex justify-between items-center bg-gray-50">
                                Atividades Recentes
                                <span onClick={() => setMostrarNotificacoes(false)} className="cursor-pointer text-gray-400 hover:text-red-500"><X size={16}/></span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {notificacoes.map((notif, i) => (
                                    <div key={i} className="p-3 border-b border-gray-50 hover:bg-blue-50 text-sm transition">
                                        {/* Exibe o nome que veio da nova API */}
                                        <p className="font-bold text-[#1351b4]">
                                            {notif.usuario ? notif.usuario.nome : "Usuário Desconhecido"}
                                        </p>
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span className="font-medium bg-gray-100 px-1 rounded">{notif.tipo}</span>
                                            <span>{new Date(notif.criadoEm).toLocaleTimeString('pt-BR')}</span>
                                        </div>
                                    </div>
                                ))}
                                {notificacoes.length === 0 && <p className="p-4 text-center text-gray-400 text-sm">Nenhuma atividade recente.</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* PERFIL DO ADMIN (AGORA EDITÁVEL) */}
                <div className="flex items-center gap-3 pl-4 border-l">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-[#071d41]">{adminUser.nome}</p>
                        <p className="text-xs text-gray-500">{adminUser.cargo}</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-md relative group">
                        {adminUser.nome ? adminUser.nome.substring(0, 2).toUpperCase() : "AD"}
                        
                        {/* Botão de Editar Perfil Admin */}
                        <button 
                            onClick={abrirEdicaoAdmin}
                            className="absolute -bottom-1 -right-1 bg-white text-blue-600 rounded-full p-1 border border-gray-200 shadow-sm hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Editar Meus Dados"
                        >
                            <Edit3 size={10} />
                        </button>
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
                    <div className="space-y-6 animate-fade-in print:hidden">
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
                                            placeholder="Buscar nome ou email..." 
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
                                                            {/* CPF REMOVIDO, AGORA MOSTRA APENAS EMAIL */}
                                                            {user.email ? <span>{user.email}</span> : <span>Sem e-mail</span>}
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
                                                            {/* BOTÃO DE EXCLUIR (LIXEIRA) ADICIONADO */}
                                                            <button 
                                                                onClick={() => handleExcluirUsuario(user)} 
                                                                className="bg-red-100 text-red-600 p-2 rounded hover:bg-red-200 transition"
                                                                title="Excluir Colaborador"
                                                            >
                                                                <Trash2 size={18} />
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
                {view === 'relatorios' && !usuarioSelecionado && !relatorioDetalhado && (
                    <div className="space-y-6 animate-fade-in print:hidden">
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
                                            <th className="p-3 border text-center">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dadosRelatorio.map(rel => (
                                            <tr key={rel.id} className="hover:bg-gray-50 transition">
                                                <td className="p-3 border font-bold text-[#071d41]">
                                                    {rel.nome}<br/>
                                                    {/* MOSTRANDO EMAIL AO INVÉS DE CPF */}
                                                    <span className="text-[10px] text-gray-400 font-normal">{rel.email}</span>
                                                </td>
                                                <td className="p-3 border text-center font-mono text-gray-700 font-medium">{rel.totalHoras}</td>
                                                <td className="p-3 border text-center font-bold">
                                                    <span className={`px-2 py-1 rounded ${rel.saldoMinutos >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                        {formatarSaldo(rel.saldoMinutos)}
                                                    </span>
                                                </td>
                                                <td className="p-3 border text-center">
                                                    {rel.diasFolga > 0 ? (
                                                        <span className="bg-blue-100 text-blue-700 px-2 rounded text-xs font-bold">
                                                            {rel.diasFolga} Dias Folga
                                                        </span>
                                                    ) : (
                                                        rel.faltas.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1 justify-center">
                                                                {rel.faltas.slice(0, 5).map((f, i) => (
                                                                    <span key={i} className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200">
                                                                        {f}
                                                                    </span>
                                                                ))}
                                                                {rel.faltas.length > 5 && <span className="text-xs text-gray-500">+{rel.faltas.length - 5}</span>}
                                                            </div>
                                                        ) : <span className="text-green-500 font-bold text-xs flex items-center justify-center gap-1"><CheckCircle size={12}/> 100% Presente</span>
                                                    )}
                                                </td>
                                                <td className="p-3 border text-center">
                                                    {/* BOTÃO PARA ABRIR A FOLHA DETALHADA */}
                                                    <button onClick={() => setRelatorioDetalhado(rel)} className="bg-[#1351b4] text-white px-3 py-1 rounded text-xs hover:bg-blue-800 flex items-center gap-1 mx-auto transition shadow-sm">
                                                        <FileText size={14}/> Abrir Folha
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {dadosRelatorio.length === 0 && (
                                            <tr><td colSpan="5" className="p-10 text-center text-gray-400">Nenhum dado encontrado para o período selecionado.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-100 text-xs text-blue-800 flex items-start gap-2">
                                <AlertCircle size={16} className="mt-0.5"/>
                                <p><strong>Nota do Sistema:</strong> Dias marcados como Folga não descontam horas do saldo. Dias sem ponto e sem folga descontam 8 horas.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* =================================================
                   3. FOLHA DE PONTO DETALHADA (PARA IMPRESSÃO)
                   =================================================
                */}
                {relatorioDetalhado && (
                    <div className="bg-white p-8 max-w-4xl mx-auto shadow-lg print:shadow-none print:w-full animate-fade-in">
                        {/* Header da Folha */}
                        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">Pinguim Manoa</h1>
                                <p className="text-sm text-gray-500 font-bold">Folha de Ponto Individual</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">Período: {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][mesRelatorio]} / {anoRelatorio}</p>
                                <p className="text-xs text-gray-400">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
                            </div>
                        </div>

                        {/* Dados do Colaborador */}
                        <div className="mb-6 bg-gray-50 p-4 rounded border border-gray-200 print:bg-transparent print:border-gray-300">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="font-bold text-gray-600">Colaborador:</span> <span className="text-gray-900 uppercase ml-2">{relatorioDetalhado.nome}</span></div>
                                <div><span className="font-bold text-gray-600">Cargo:</span> <span className="text-gray-900 uppercase ml-2">{relatorioDetalhado.cargo || "Não informado"}</span></div>
                                <div><span className="font-bold text-gray-600">Email:</span> <span className="text-gray-900 ml-2">{relatorioDetalhado.email}</span></div>
                                <div><span className="font-bold text-gray-600">Saldo do Mês:</span> <span className={`font-bold ml-2 ${relatorioDetalhado.saldoMinutos >= 0 ? "text-green-700" : "text-red-700"}`}>{formatarSaldo(relatorioDetalhado.saldoMinutos)}</span></div>
                            </div>
                        </div>

                        {/* Tabela de Dias */}
                        <table className="w-full text-xs md:text-sm border-collapse border border-gray-300 mb-8">
                            <thead className="bg-gray-100 print:bg-gray-200 text-gray-800 font-bold uppercase">
                                <tr>
                                    <th className="border border-gray-300 p-2 text-left">Data</th>
                                    <th className="border border-gray-300 p-2 text-center">Entrada</th>
                                    <th className="border border-gray-300 p-2 text-center">Saída</th>
                                    <th className="border border-gray-300 p-2 text-center">H. Trab</th>
                                    <th className="border border-gray-300 p-2 text-center">Saldo</th>
                                    <th className="border border-gray-300 p-2 text-center">Situação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gerarDiasDoMesParaRelatorio(mesRelatorio, anoRelatorio, pontosGerais.filter(p => p.usuarioId === relatorioDetalhado.id), folgasGerais.filter(f => f.usuarioId === relatorioDetalhado.id)).map((dia, idx) => (
                                    <tr key={idx} className="print:break-inside-avoid">
                                        <td className="border border-gray-300 p-2 font-medium">{dia.diaNum} - {dia.diaSemana}</td>
                                        <td className="border border-gray-300 p-2 text-center">{dia.entrada}</td>
                                        <td className="border border-gray-300 p-2 text-center">{dia.saida}</td>
                                        <td className="border border-gray-300 p-2 text-center font-mono">{dia.horasTrabalhadas}</td>
                                        <td className={`border border-gray-300 p-2 text-center font-bold ${dia.saldoPositivo ? 'text-green-700' : 'text-red-600'}`}>{dia.saldo}</td>
                                        <td className="border border-gray-300 p-2 text-center text-[10px] uppercase font-bold text-gray-500">{dia.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Assinaturas */}
                        <div className="mt-16 grid grid-cols-2 gap-20 print:gap-10 page-break-inside-avoid">
                            <div className="text-center">
                                <div className="border-t border-black pt-2"></div>
                                <p className="text-sm font-bold uppercase">Pinguim Manoa</p>
                                <p className="text-xs text-gray-500">Empregador</p>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-black pt-2"></div>
                                <p className="text-sm font-bold uppercase">{relatorioDetalhado.nome}</p>
                                <p className="text-xs text-gray-500">Colaborador</p>
                            </div>
                        </div>

                        {/* Botões de Controle (Somem na impressão) */}
                        <div className="mt-8 flex flex-col md:flex-row justify-center gap-4 print:hidden">
                            <button onClick={() => setRelatorioDetalhado(null)} className="px-6 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-2 transition">
                                <ArrowLeft size={18}/> Voltar
                            </button>
                            
                            {/* BOTÃO DE ENVIAR EMAIL */}
                            <button onClick={() => handleEnviarEmailRelatorio(relatorioDetalhado)} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg transition">
                                <Mail size={18}/> Enviar por E-mail
                            </button>

                            {/* BOTÃO DE IMPRIMIR */}
                            <button onClick={() => window.print()} className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg transition">
                                <Printer size={18}/> Imprimir Folha
                            </button>
                        </div>
                    </div>
                )}

                {/* 4. EDIÇÃO HISTÓRICO (DASHBOARD) */}
                {usuarioSelecionado && (
                    <div className="animate-fade-in space-y-6 print:hidden">
                        <div className="flex justify-between items-center">
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
                                    </div>
                                    {/* CPF REMOVIDO, APENAS EMAIL */}
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
                             <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                                <span className="font-bold text-[#071d41] flex items-center gap-2"><Calendar size={18}/> Histórico Detalhado</span>
                                <span className="text-xs text-gray-400">Clique para editar ou marcar folga</span>
                             </div>
                             
                             <div className="divide-y divide-gray-100">
                                {gerarDiasDoMesSelecionado(mesFicha, anoFicha, pontosGerais.filter(p => p.usuarioId === usuarioSelecionado.id)).map((dia, idx) => (
                                    <ItemDiaAdmin 
                                        key={idx} 
                                        dia={dia} 
                                        pontosReais={pontosGerais.filter(p => p.usuarioId === usuarioSelecionado.id && new Date(p.data).toLocaleDateString('pt-BR') === dia.dataFormatada)}
                                        mensagem={getMensagemDia(dia.dataIso)} 
                                        usuarioId={usuarioSelecionado.id} 
                                        // Passa o status de folga para o componente visual
                                        isFolga={folgasGerais.some(f => f.usuarioId === usuarioSelecionado.id && f.dataIso === dia.dataIso)}
                                        onUpdate={carregarDados}
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

      {/* MODAL PERFIL DO ADMIN */}
      {modalPerfilAdmin && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm print:hidden">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm animate-scale-in border-t-4 border-blue-500">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-[#071d41] flex items-center gap-2">
                          <Edit3 size={18} className="text-blue-500"/> Dados do Admin
                      </h3>
                      <button onClick={() => setModalPerfilAdmin(false)} className="text-gray-400 hover:text-red-500"><X/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Nome de Exibição</label>
                          <input className="w-full border p-2.5 rounded outline-none focus:border-blue-500" value={adminParaEditar.nome} onChange={e => setAdminParaEditar({...adminParaEditar, nome: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">E-mail para Relatórios</label>
                          <input className="w-full border p-2.5 rounded outline-none focus:border-blue-500" value={adminParaEditar.email} onChange={e => setAdminParaEditar({...adminParaEditar, email: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Cargo / Função</label>
                          <input className="w-full border p-2.5 rounded outline-none focus:border-blue-500" value={adminParaEditar.cargo} onChange={e => setAdminParaEditar({...adminParaEditar, cargo: e.target.value})} />
                      </div>
                      <button onClick={salvarPerfilAdmin} className="w-full bg-blue-600 text-white font-bold py-3 rounded mt-2 hover:bg-blue-700 shadow-md transition">
                          ATUALIZAR PERFIL
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL NOVO USUÁRIO (SEM CPF) */}
      {modalNovoUsuario && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm print:hidden">
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
                      {/* CAMPO CPF REMOVIDO */}
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">E-mail (Login)</label>
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

      {/* MODAL EDITAR USUÁRIO (SEM CPF) */}
      {modalEditarUsuario && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm print:hidden">
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
                      {/* CAMPO CPF REMOVIDO */}
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
// FUNÇÕES AUXILIARES E COMPONENTES
// ==========================================================

// Helper Específico para a Folha de Ponto Impressa (Lógica Completa)
function gerarDiasDoMesParaRelatorio(mes, ano, pontos, folgas) {
    const dias = [];
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    
    for (let i = 1; i <= ultimoDia; i++) {
        const data = new Date(ano, mes, i);
        const dataStr = data.toLocaleDateString('pt-BR');
        const dataIso = data.toISOString().split('T')[0];
        const diaSemana = data.toLocaleDateString('pt-BR', {weekday: 'short'}).replace('.', '').toUpperCase();
        
        // Verifica se é folga
        const isFolga = folgas.some(f => f.dataIso === dataIso);

        const pontosDia = pontos.filter(p => new Date(p.data).toLocaleDateString('pt-BR') === dataStr);
        const entrada = pontosDia.find(p => p.tipo === 'Entrada');
        const saida = pontosDia.filter(p => p.tipo === 'Saída').pop();

        let entradaStr = "--:--";
        let saidaStr = "--:--";
        let horasTrabalhadas = "00:00";
        let saldo = "00:00";
        let status = "AUSÊNCIA / FOLGA";
        let saldoPositivo = true;

        if (isFolga) {
            status = "FOLGA";
            saldo = "00:00"; // Saldo zerado na folga
        } else if (entrada) {
            entradaStr = new Date(entrada.data).toLocaleTimeString('pt-BR').slice(0,5);
            status = "PRESENÇA";
            
            if (saida) {
                saidaStr = new Date(saida.data).toLocaleTimeString('pt-BR').slice(0,5);
                let dtEntrada = new Date(entrada.data);
                let dtSaida = new Date(saida.data);
                if (dtSaida < dtEntrada) dtSaida.setDate(dtSaida.getDate() + 1);

                const diff = dtSaida - dtEntrada;
                const hTrab = Math.floor(diff / 3600000);
                const mTrab = Math.floor((diff % 3600000) / 60000);
                horasTrabalhadas = `${String(hTrab).padStart(2,'0')}:${String(mTrab).padStart(2,'0')}`;

                const meta = 8 * 3600000;
                const saldoMs = diff - meta;
                saldoPositivo = saldoMs >= 0;
                const hSaldo = Math.floor(Math.abs(saldoMs) / 3600000);
                const mSaldo = Math.floor((Math.abs(saldoMs) % 3600000) / 60000);
                saldo = `${saldoPositivo ? '+' : '-'}${String(hSaldo).padStart(2,'0')}:${String(mSaldo).padStart(2,'0')}`;
            } else {
                saldo = "-08:00"; // Falta saída
                saldoPositivo = false;
            }
        } else {
            // Nem folga nem ponto = Falta
            saldo = "-08:00";
            saldoPositivo = false;
            status = "AUSÊNCIA";
        }

        dias.push({
            dataIso,
            dataFormatada: dataStr,
            diaNum: String(i).padStart(2,'0'),
            diaSemana,
            entrada: entradaStr,
            saida: saidaStr,
            horasTrabalhadas,
            saldo,
            saldoPositivo,
            status
        });
    }
    return dias;
}

// --- COMPONENTE DE LINHA DO DIA (AGORA COM PODERES DE EDIÇÃO) ---
function ItemDiaAdmin({ dia, pontosReais, mensagem, usuarioId, isFolga, onUpdate }) {
    const [aberto, setAberto] = useState(false);
    
    // Estados para Edição/Criação
    const [editandoId, setEditandoId] = useState(null);
    const [editValues, setEditValues] = useState({ hora: "", tipo: "" });
    const [adicionando, setAdicionando] = useState(false);
    const [novoPonto, setNovoPonto] = useState({ hora: "08:00", tipo: "Entrada" });

    // === CÁLCULO DE SALDO (Com Correção de Madrugada e Folga) ===
    let saldoStr = "00:00";
    let saldoPositivo = true;
    let statusDia = "AUSÊNCIA";
    
    // Se for marcado como folga
    if (isFolga) {
        statusDia = "FOLGA";
    } else {
        const primeiraEntrada = dia.pontos.find(p => p.tipo === 'Entrada');
        const ultimaSaida = dia.pontos.filter(p => p.tipo === 'Saída').pop();

        if (primeiraEntrada) {
            statusDia = "PRESENÇA";
            if (ultimaSaida) {
                let dtEntrada = new Date(primeiraEntrada.data);
                let dtSaida = new Date(ultimaSaida.data);

                if (dtSaida < dtEntrada) {
                    dtSaida.setDate(dtSaida.getDate() + 1);
                }

                const diff = dtSaida - dtEntrada;
                const meta = 8 * 60 * 60 * 1000; 
                const saldoMs = diff - meta;
                saldoPositivo = saldoMs >= 0;
                const absSaldo = Math.abs(saldoMs);
                const h = Math.floor(absSaldo / 3600000);
                const m = Math.floor((absSaldo % 3600000) / 60000);
                saldoStr = `${saldoPositivo ? '' : '-'}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
            } else {
                saldoStr = "-08:00";
                saldoPositivo = false;
            }
        } else {
             // Nem folga nem entrada
             saldoStr = "-08:00";
             saldoPositivo = false;
        }
    }

    // --- AÇÕES DO ADMIN ---

    // 1. Excluir Ponto
    async function handleExcluir(id) {
        if (!confirm("Tem certeza que deseja apagar este registro?")) return;
        try {
            const res = await fetch(`/api/ponto?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Registro apagado.");
                onUpdate(); // Atualiza a tela
            }
        } catch (e) { toast.error("Erro ao excluir."); }
    }

    // 2. Iniciar Edição (Abre os inputs na linha)
    function iniciarEdicao(ponto) {
        const dataObj = new Date(ponto.data);
        const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        setEditValues({ hora: horaFormatada, tipo: ponto.tipo });
        setEditandoId(ponto.id);
    }

    // 3. Salvar Edição
    async function salvarEdicao(idOriginal, dataOriginal) {
        try {
            const dataBase = new Date(dataOriginal);
            const [h, m] = editValues.hora.split(':');
            dataBase.setHours(parseInt(h), parseInt(m));

            const res = await fetch('/api/ponto', {
                method: 'PUT',
                body: JSON.stringify({ 
                    id: idOriginal, 
                    novaData: dataBase.toISOString(), 
                    novoTipo: editValues.tipo 
                })
            });
            
            if (res.ok) {
                toast.success("Ponto atualizado!");
                setEditandoId(null);
                onUpdate();
            }
        } catch (e) { toast.error("Erro ao salvar."); }
    }

    // 4. Salvar Novo Ponto Manual (Essa é a mágica do Admin)
    async function salvarNovoPonto() {
        try {
            // Pega a data do dia que estamos vendo (YYYY-MM-DD)
            const [ano, mes, diaMes] = dia.dataIso.split('-');
            const dataFinal = new Date(ano, mes - 1, diaMes);
            const [h, m] = novoPonto.hora.split(':');
            dataFinal.setHours(parseInt(h), parseInt(m));

            const res = await fetch('/api/ponto', {
                method: 'POST',
                body: JSON.stringify({
                    modoAdmin: true, // <--- O SEGREDO: Essa flag libera sem GPS
                    usuarioId: usuarioId,
                    tipo: novoPonto.tipo,
                    dataManual: dataFinal.toISOString()
                })
            });

            if (res.ok) {
                toast.success("Ponto adicionado!");
                setAdicionando(false);
                onUpdate();
            }
        } catch (e) { toast.error("Erro ao criar ponto."); }
    }

    // 5. Alternar Folga
    async function toggleFolga() {
        try {
            await fetch('/api/folgas', {
                method: 'POST',
                body: JSON.stringify({ usuarioId, dataIso: dia.dataIso })
            });
            onUpdate(); // Atualiza para recalcular
            toast.success(isFolga ? "Folga removida!" : "Folga definida!");
        } catch(e) { toast.error("Erro ao definir folga."); }
    }

    return (
        <div className="border-b border-gray-100 last:border-0">
            <div 
                className={`flex items-center justify-between p-4 hover:bg-gray-50 transition cursor-pointer ${isFolga ? 'bg-blue-50/70' : aberto ? 'bg-blue-50/30' : ''}`}
                onClick={() => setAberto(!aberto)}
            >
                <div className="flex flex-col flex-1">
                    <span className="font-bold text-sm text-[#071d41]">{dia.dataFormatada}</span>
                    
                    {/* VISUAL STATUS DO DIA */}
                    <div className="flex gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase 
                            ${statusDia === 'PRESENÇA' ? 'bg-green-100 text-green-700 border-green-200' : 
                              statusDia === 'FOLGA' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                              'bg-red-50 text-red-500 border-red-200'}`}>
                            {statusDia}
                        </span>
                        
                        {/* Mostra saldo se não for folga ou se tiver ponto mesmo na folga */}
                        {statusDia !== 'FOLGA' && (
                            <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${saldoPositivo ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                Saldo: {saldoStr}
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* BALÃO DE MENSAGEM */}
                    {mensagem && (
                         <div className="bg-blue-100 text-blue-600 p-1.5 rounded-full" title="Possui Justificativa">
                             <MessageCircle size={14} />
                         </div>
                    )}
                    <div className="cursor-pointer text-gray-400 hover:text-blue-600">
                        {aberto ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </div>
            </div>
            
            {aberto && (
                <div className="bg-gray-50 p-4 pl-4 md:pl-8 animate-fade-in border-t border-gray-100 shadow-inner text-sm">
                    
                    {/* BARRA DE AÇÕES DO DIA */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button 
                            onClick={() => setAdicionando(!adicionando)} 
                            className="bg-green-100 text-green-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-green-200 flex items-center gap-1 shadow-sm transition"
                        >
                            <PlusCircle size={14}/> {adicionando ? 'Cancelar Adição' : 'Adicionar Ponto'}
                        </button>
                        
                        {/* BOTÃO DE FOLGA INTELIGENTE */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); toggleFolga(); }}
                            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow-sm transition 
                                ${isFolga ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                        >
                            {isFolga ? <><X size={14}/> Remover Folga</> : <><Coffee size={14}/> Definir Folga</>}
                        </button>
                    </div>

                    {/* FORMULÁRIO DE NOVO PONTO */}
                    {adicionando && (
                        <div className="bg-white border-l-4 border-green-500 p-3 rounded shadow-sm mb-4 flex flex-wrap items-center gap-2 animate-scale-in">
                            <span className="text-xs font-bold text-green-700 uppercase mr-2">Novo:</span>
                            <select 
                                value={novoPonto.tipo} 
                                onChange={e => setNovoPonto({...novoPonto, tipo: e.target.value})}
                                className="border rounded p-1 text-sm outline-none focus:border-green-500"
                            >
                                <option>Entrada</option>
                                <option>Ida Intervalo</option>
                                <option>Volta Intervalo</option>
                                <option>Saída</option>
                            </select>
                            <input 
                                type="time" 
                                value={novoPonto.hora} 
                                onChange={e => setNovoPonto({...novoPonto, hora: e.target.value})}
                                className="border rounded p-1 text-sm outline-none focus:border-green-500"
                            />
                            <div className="flex gap-1 ml-auto">
                                <button onClick={salvarNovoPonto} className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700 shadow"><Save size={16}/></button>
                            </div>
                        </div>
                    )}

                    {mensagem && (
                        <div className="mb-4 bg-white border border-blue-200 p-3 rounded-lg shadow-sm flex gap-3">
                            <MessageCircle size={18} className="text-blue-500 mt-0.5"/>
                            <div>
                                <p className="text-xs font-bold text-blue-800 uppercase">Justificativa do Colaborador</p>
                                <p className="text-sm text-gray-700 italic">"{mensagem}"</p>
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        {/* AQUI USAMOS pontosReais PARA LISTAR OS PONTOS EXATOS DO DIA */}
                        {pontosReais && pontosReais.length > 0 ? pontosReais.map((p) => (
                            <div key={p.id} className="flex items-center justify-between text-sm bg-white p-2 px-3 rounded border border-gray-200 shadow-sm hover:shadow-md transition">
                                
                                {editandoId === p.id ? (
                                    // === MODO EDIÇÃO (Inputs aparecem) ===
                                    <div className="flex items-center gap-2 w-full animate-fade-in">
                                        <select 
                                            value={editValues.tipo} 
                                            onChange={e => setEditValues({...editValues, tipo: e.target.value})}
                                            className="border rounded p-1 text-xs font-bold"
                                        >
                                            <option>Entrada</option>
                                            <option>Ida Intervalo</option>
                                            <option>Volta Intervalo</option>
                                            <option>Saída</option>
                                        </select>
                                        <input 
                                            type="time" 
                                            value={editValues.hora}
                                            onChange={e => setEditValues({...editValues, hora: e.target.value})}
                                            className="border rounded p-1 text-xs"
                                        />
                                        <div className="flex gap-1 ml-auto">
                                            <button onClick={() => salvarEdicao(p.id, p.data)} className="bg-green-100 text-green-700 p-1 rounded hover:bg-green-200"><Save size={16}/></button>
                                            <button onClick={() => setEditandoId(null)} className="bg-red-100 text-red-700 p-1 rounded hover:bg-red-200"><X size={16}/></button>
                                        </div>
                                    </div>
                                ) : (
                                    // === MODO VISUALIZAÇÃO ===
                                    <>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${p.tipo === 'Entrada' ? 'bg-green-500' : p.tipo === 'Saída' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                            <span className={`font-bold w-24 ${p.tipo === 'Entrada' ? 'text-green-700' : p.tipo === 'Saída' ? 'text-red-700' : 'text-blue-700'}`}>
                                                {p.tipo}
                                            </span>
                                            <span className="font-mono text-gray-700 font-bold text-base">
                                                {new Date(p.data).toLocaleTimeString('pt-BR').slice(0,5)}
                                            </span>
                                            {/* Badge se for manual */}
                                            {p.ip && p.ip.includes("Manual") && (
                                                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 rounded border border-yellow-200 font-bold hidden md:inline-block">MANUAL</span>
                                            )}
                                        </div>
                                        <div className="flex gap-2 opacity-50 hover:opacity-100 transition">
                                            <button 
                                                onClick={() => iniciarEdicao(p)} 
                                                className="text-blue-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded" 
                                                title="Editar horário"
                                            >
                                                <Edit3 size={16}/>
                                            </button>
                                            <button 
                                                onClick={() => handleExcluir(p.id)} 
                                                className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded" 
                                                title="Excluir registro"
                                            >
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )) : <p className="text-sm text-gray-400 italic py-2">Sem registros neste dia.</p>}
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
        // Note: pontos aqui é o array filtrado já para o usuário, mas precisamos filtrar por dia também
        // A filtragem real acontece dentro do map no componente pai ou aqui.
        // Como o ItemDiaAdmin espera 'dia.pontos' (que não estamos usando mais lá dentro, pois passamos pontosReais), 
        // vamos manter a estrutura básica de data.
        
        dias.push({ 
            dataIso, 
            dataFormatada: dataStr, 
            diaSemana: d.toLocaleDateString('pt-BR', {weekday: 'long'}), 
            pontos: [] // Placeholder, o ItemDiaAdmin recebe pontosReais agora para ser mais preciso
        });
    }
    return dias.reverse(); // Mostra do dia 31 pro dia 1
}