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
  Coffee,
  FileSpreadsheet, // Ícone Excel
  ShoppingBag,     // Ícone Consumos
  DollarSign,      // Ícone Dinheiro
  Image as ImageIcon // Ícone Imagem
} from "lucide-react";
import { toast } from 'sonner';
import * as XLSX from 'xlsx'; // Biblioteca Excel
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts'; // Biblioteca Gráficos

export default function AdminPage() {
  // ==================================================================================
  // 1. ESTADOS GERAIS DA APLICAÇÃO
  // ==================================================================================
  
  // Controle de Navegação e Loading
  const [view, setView] = useState("dashboard"); // 'dashboard', 'relatorios', 'consumos'
  const [loading, setLoading] = useState(true);

  // Dados do Admin Logado
  const [adminUser, setAdminUser] = useState({
      id: null,
      nome: "Carregando...",
      email: "...",
      cargo: "Gestor"
  });

  // Dados Principais
  const [usuarios, setUsuarios] = useState([]);
  const [pontosGerais, setPontosGerais] = useState([]);
  const [folgasGerais, setFolgasGerais] = useState([]); 
  const [todasMensagens, setTodasMensagens] = useState([]); 
  
  // Dados Específicos
  const [dadosGrafico, setDadosGrafico] = useState([]); 
  const [notificacoes, setNotificacoes] = useState([]); 
  const [listaConsumos, setListaConsumos] = useState([]); // Dados de Consumo

  // Estados de Seleção e Filtros
  const [termoBusca, setTermoBusca] = useState("");
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null); 
  const [relatorioDetalhado, setRelatorioDetalhado] = useState(null); 
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const [colaboradorConsumo, setColaboradorConsumo] = useState(""); // ID para aba consumos

  // --- MODAIS ---
  const [modalNovoUsuario, setModalNovoUsuario] = useState(false);
  const [modalEditarUsuario, setModalEditarUsuario] = useState(false);
  const [modalPerfilAdmin, setModalPerfilAdmin] = useState(false); 
  const [modalNovoConsumo, setModalNovoConsumo] = useState(false); // Modal Consumo

  // --- FORMULÁRIOS ---
  const [novoUser, setNovoUser] = useState({ 
      nome: "", 
      email: "", 
      cargo: "" 
  });
  
  const [usuarioParaEditar, setUsuarioParaEditar] = useState({});
  const [adminParaEditar, setAdminParaEditar] = useState({}); 
  
  const [novoConsumo, setNovoConsumo] = useState({ 
      nomeItem: "", 
      valor: "", 
      imagemUrl: "" 
  });
  const [consumoEditando, setConsumoEditando] = useState(null);

  // --- FILTROS DE DATA ---
  const [mesFicha, setMesFicha] = useState(new Date().getMonth());
  const [anoFicha, setAnoFicha] = useState(2026);
  const [mesRelatorio, setMesRelatorio] = useState(new Date().getMonth());
  const [anoRelatorio, setAnoRelatorio] = useState(2026);
  const [dadosRelatorio, setDadosRelatorio] = useState([]);
  // ==================================================================================
  // 2. CARREGAMENTO INICIAL DE DADOS
  // ==================================================================================
  
  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
        setLoading(true);

        // 1. Buscas paralelas iniciais
        const [resUsers, resMsgs, resNotif] = await Promise.all([
            fetch('/api/usuarios'),
            fetch('/api/mensagens'),
            fetch('/api/notificacoes')
        ]);
        
        const dataUsers = await resUsers.json();
        
        // --- Identificar Admin ---
        const adminEncontrado = dataUsers.find(u => u.tipo === 'admin');
        if (adminEncontrado) {
            setAdminUser(adminEncontrado);
        } else {
            // Fallback visual caso não ache nenhum admin no banco
            setAdminUser({ 
                nome: "Admin Master", 
                email: "admin@sistema.com", 
                cargo: "Gestor", 
                id: null 
            });
        }

        let todosPontos = [];
        let todasFolgas = [];

        // 2. Buscar pontos e folgas detalhados
        for (let user of dataUsers) {
            try {
              // Pontos
              const resPonto = await fetch(`/api/ponto?userId=${user.id}`);
              const dataPonto = await resPonto.json();
              todosPontos = [...todosPontos, ...dataPonto];

              // Folgas
              const resFolga = await fetch(`/api/folgas?userId=${user.id}`);
              const dataFolga = await resFolga.json(); 
              
              dataFolga.forEach(dataString => {
                  todasFolgas.push({ usuarioId: user.id, dataIso: dataString });
              });

            } catch(e) { 
                console.log(`Erro ao carregar dados do usuário ${user.id}`); 
            }
        }

        const dataMsg = await resMsgs.json();
        const dataNotif = await resNotif.json();
        
        // 3. Atualiza estados globais
        setUsuarios(dataUsers);
        setPontosGerais(todosPontos);
        setFolgasGerais(todasFolgas);
        setTodasMensagens(dataMsg);
        setNotificacoes(Array.isArray(dataNotif) ? dataNotif : []);

        // 4. Processamentos Adicionais
        processarGrafico(todosPontos);
        await carregarConsumos(); // Carrega a cantina/loja

        setLoading(false);

    } catch (error) {
        console.error(error);
        toast.error("Erro crítico ao carregar dados.");
        setLoading(false);
    }
  }

  // --- BUSCAR CONSUMOS (API) ---
  async function carregarConsumos() {
      try {
          const res = await fetch('/api/consumos');
          const data = await res.json();
          setListaConsumos(data);
      } catch (e) {
          console.error("Erro ao buscar consumos");
      }
  }

  // --- GERAR GRÁFICO (Últimos 7 dias) ---
  function processarGrafico(pontos) {
      const hoje = new Date();
      const dados = [];
      
      for (let i = 6; i >= 0; i--) {
          const d = new Date(hoje);
          d.setDate(hoje.getDate() - i);
          const dataStr = d.toLocaleDateString('pt-BR');
          const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'short' });

          const pontosDoDia = pontos.filter(p => new Date(p.data).toLocaleDateString('pt-BR') === dataStr);
          
          let minutosTrabalhadosDia = 0;
          
          // Agrupa por usuário
          const usuariosIds = [...new Set(pontosDoDia.map(p => p.usuarioId))];
          
          usuariosIds.forEach(uid => {
             const ptsUser = pontosDoDia.filter(p => p.usuarioId === uid);
             const ent = ptsUser.find(p => p.tipo === 'Entrada');
             const sai = ptsUser.filter(p => p.tipo === 'Saída').pop();
             if(ent && sai) {
                 let dtE = new Date(ent.data);
                 let dtS = new Date(sai.data);
                 if(dtS < dtE) dtS.setDate(dtS.getDate() + 1);
                 minutosTrabalhadosDia += (dtS - dtE) / 60000;
             }
          });

          dados.push({
              name: diaSemana, 
              horas: Math.round(minutosTrabalhadosDia / 60), 
              dataCompleta: dataStr
          });
      }
      setDadosGrafico(dados);
  }
  // ==================================================================================
  // 3. LÓGICA DE RELATÓRIOS (Recálculo Automático)
  // ==================================================================================
  
  useEffect(() => {
    if (pontosGerais.length > 0 && usuarios.length > 0) {
        gerarRelatorioMensal();
    }
  }, [mesRelatorio, anoRelatorio, pontosGerais, usuarios, folgasGerais]);

  function gerarRelatorioMensal() {
      const relatorio = usuarios.map(user => {
          const ultimoDia = new Date(anoRelatorio, mesRelatorio + 1, 0).getDate();
          
          let diasTrabalhadosEsperados = 0; 
          let diasFolgaCount = 0;           
          let minutosTrabalhados = 0;
          let diasFaltosos = [];            
          const hoje = new Date(); 

          for (let i = 1; i <= ultimoDia; i++) {
              const dataAtual = new Date(anoRelatorio, mesRelatorio, i);
              const dataStr = dataAtual.toLocaleDateString('pt-BR');
              const dataIso = dataAtual.toISOString().split('T')[0];
              
              // Verifica se é folga
              const ehFolga = folgasGerais.some(f => f.usuarioId === user.id && f.dataIso === dataIso);

              if (ehFolga) {
                  diasFolgaCount++;
                  continue; 
              }

              diasTrabalhadosEsperados++;

              const pontosDia = pontosGerais.filter(p => p.usuarioId === user.id && new Date(p.data).toLocaleDateString('pt-BR') === dataStr);
              const entrada = pontosDia.find(p => p.tipo === 'Entrada');
              const tevePonto = pontosDia.length > 0;
              
              const dataAtualSemHora = new Date(dataAtual.toDateString());
              const hojeSemHora = new Date(hoje.toDateString());

              if (!tevePonto && dataAtualSemHora < hojeSemHora) { 
                  diasFaltosos.push(`${i}/${mesRelatorio + 1}`);
              }

              if (entrada) {
                  const ultimaSaida = pontosDia.filter(p => p.tipo === 'Saída').pop();
                  if (ultimaSaida) {
                      let dtEntrada = new Date(entrada.data);
                      let dtSaida = new Date(ultimaSaida.data);
                      
                      if (dtSaida < dtEntrada) {
                          dtSaida.setDate(dtSaida.getDate() + 1);
                      }

                      minutosTrabalhados += Math.floor((dtSaida - dtEntrada) / 60000); 
                  }
              }
          }

          const metaMinutos = diasTrabalhadosEsperados * 480; // 8h
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
  // ==================================================================================
  // 4. AÇÕES: CONSUMOS (CANTINA) E GERAIS
  // ==================================================================================
  
  async function handleSalvarConsumo() {
      if (!colaboradorConsumo) return toast.warning("Selecione um funcionário.");
      if (!novoConsumo.nomeItem || !novoConsumo.valor) return toast.warning("Preencha nome e valor.");

      const payload = {
          nomeItem: novoConsumo.nomeItem,
          valor: novoConsumo.valor,
          imagemUrl: novoConsumo.imagemUrl,
          usuarioId: colaboradorConsumo
      };

      try {
          let res;
          if (consumoEditando) {
              res = await fetch('/api/consumos', { 
                  method: 'PUT', 
                  body: JSON.stringify({ ...payload, id: consumoEditando.id }) 
              });
          } else {
              res = await fetch('/api/consumos', { 
                  method: 'POST', 
                  body: JSON.stringify(payload) 
              });
          }

          const data = await res.json();
          if (data.success) {
              toast.success(consumoEditando ? "Item atualizado!" : "Item adicionado!");
              setModalNovoConsumo(false);
              setNovoConsumo({ nomeItem: "", valor: "", imagemUrl: "" });
              setConsumoEditando(null);
              carregarConsumos(); 
          } else {
              toast.error("Erro ao salvar item.");
          }
      } catch (e) { toast.error("Erro de conexão."); }
  }

  async function handleExcluirConsumo(id) {
      if (confirm("Tem certeza que deseja remover este item?")) {
          try {
              const res = await fetch(`/api/consumos?id=${id}`, { method: 'DELETE' });
              if (res.ok) {
                  toast.success("Item removido.");
                  carregarConsumos();
              } else { toast.error("Erro ao remover."); }
          } catch (e) { toast.error("Erro de conexão."); }
      }
  }

  function abrirModalEdicaoConsumo(item) {
      setConsumoEditando(item);
      setNovoConsumo({
          nomeItem: item.nomeItem,
          valor: item.valor,
          imagemUrl: item.imagemUrl || ""
      });
      setModalNovoConsumo(true);
  }

  const totalConsumo = listaConsumos
      .filter(c => c.usuarioId === parseInt(colaboradorConsumo))
      .reduce((acc, curr) => acc + curr.valor, 0);


  // -- EXPORTAR EXCEL --
  function handleExportarExcel() {
      const dadosExcel = [];
      
      usuarios.forEach(user => {
          const diasDoUsuario = gerarDiasDoMesParaRelatorio(
              mesRelatorio,
              anoRelatorio,
              pontosGerais.filter(p => p.usuarioId === user.id),
              folgasGerais.filter(f => f.usuarioId === user.id)
          );

          diasDoUsuario.forEach(dia => {
              dadosExcel.push({
                  "Colaborador": user.nome,
                  "Cargo": user.cargo,
                  "Data": dia.dataFormatada,
                  "Dia da Semana": dia.diaSemana,
                  "Entrada": dia.entrada,
                  "Saída": dia.saida,
                  "Horas Trabalhadas": dia.horasTrabalhadas,
                  "Saldo do Dia": dia.saldo,
                  "Status": dia.status
              });
          });
      });

      const worksheet = XLSX.utils.json_to_sheet(dadosExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório Ponto");
      XLSX.writeFile(workbook, `Relatorio_Geral_${mesRelatorio + 1}_${anoRelatorio}.xlsx`);
      toast.success("Download iniciado!");
  }
  // -- ADMIN EDIT --
  function abrirEdicaoAdmin() {
      setAdminParaEditar({ ...adminUser });
      setModalPerfilAdmin(true);
  }

  async function salvarPerfilAdmin() {
      if (!adminUser.id) return toast.error("ID não encontrado.");
      try {
          const res = await fetch('/api/usuarios', {
              method: 'PUT',
              body: JSON.stringify({
                  id: adminUser.id,
                  nome: adminParaEditar.nome,
                  email: adminParaEditar.email,
                  cargo: adminParaEditar.cargo,
                  acao: 'editar'
              })
          });
          const data = await res.json();
          if (data.success) {
              setAdminUser(data.usuario); 
              setModalPerfilAdmin(false);
              toast.success("Perfil atualizado!");
          } else { toast.error(data.message); }
      } catch (e) { toast.error("Erro de conexão."); }
  }

  // -- EMAIL --
  async function handleEnviarEmailRelatorio(colaborador) {
      const toastId = toast.loading("Enviando relatório...");
      try {
          const diasRelatorio = gerarDiasDoMesParaRelatorio(
              mesRelatorio, 
              anoRelatorio, 
              pontosGerais.filter(p => p.usuarioId === colaborador.id),
              folgasGerais.filter(f => f.usuarioId === colaborador.id)
          );

          const linhasTabela = diasRelatorio.map(dia => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${dia.dataFormatada}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${dia.entrada}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${dia.saida}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${dia.horasTrabalhadas}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: ${dia.saldoPositivo || dia.saldo === '00:00' ? 'green' : 'red'}; font-weight: bold;">${dia.saldo}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${dia.status}</td>
            </tr>
          `).join('');

          const htmlBody = `
            <div style="font-family: Arial, sans-serif;">
                <h2>Relatório: ${colaborador.nome}</h2>
                <p><strong>Referência:</strong> ${mesRelatorio + 1}/${anoRelatorio}</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead style="background-color: #f3f4f6;">
                        <tr>
                            <th style="border: 1px solid #ddd; padding: 8px;">Data</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Ent</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Sai</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Total</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Saldo</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Status</th>
                        </tr>
                    </thead>
                    <tbody>${linhasTabela}</tbody>
                </table>
                <p><strong>Saldo Final:</strong> ${formatarSaldo(colaborador.saldoMinutos)}</p>
            </div>
          `;

          const res = await fetch('/api/email/enviar-relatorio', {
              method: 'POST',
              body: JSON.stringify({
                  destinatario: adminUser.email,
                  assunto: `Ponto: ${colaborador.nome} - ${mesRelatorio+1}/${anoRelatorio}`,
                  htmlBody: htmlBody
              })
          });

          const data = await res.json();
          if (data.success) {
              toast.success(`Enviado para ${adminUser.email}`, { id: toastId });
          } else { throw new Error("Falha no envio"); }

      } catch (e) { toast.error("Erro ao enviar email.", { id: toastId }); }
  }

  // -- USUÁRIOS CRUD --
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

  function abrirEdicao(user) {
      setUsuarioParaEditar({ ...user });
      setModalEditarUsuario(true);
  }

  async function handleSalvarEdicao() {
      try {
          const res = await fetch('/api/usuarios', { 
              method: 'PUT', 
              body: JSON.stringify({ ...usuarioParaEditar, acao: 'editar' }) 
          });
          const data = await res.json();
          if (data.success) {
              setUsuarios(prev => prev.map(u => u.id === usuarioParaEditar.id ? data.usuario : u));
              toast.success("Dados atualizados!");
              setModalEditarUsuario(false);
          } else { toast.error(data.message); }
      } catch (e) { toast.error("Erro ao salvar alterações."); }
  }

  async function toggleStatusUsuario(user) {
      const novoStatus = user.status === 'ativo' ? 'inativo' : 'ativo';
      if (confirm(`Alterar status para ${novoStatus}?`)) {
          const res = await fetch('/api/usuarios', { method: 'PUT', body: JSON.stringify({ id: user.id, status: novoStatus }) });
          const data = await res.json();
          if (data.success) {
              setUsuarios(prev => prev.map(u => u.id === user.id ? {...u, status: novoStatus} : u));
              if (usuarioSelecionado?.id === user.id) {
                  setUsuarioSelecionado({...user, status: novoStatus});
              }
              toast.success("Status alterado.");
          } else { toast.error("Erro ao salvar status."); }
      }
  }

  async function handleExcluirUsuario(user) {
    if (confirm(`ATENÇÃO: Tem certeza que deseja EXCLUIR ${user.nome}?`)) {
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
  // Helpers
  function getStatusUsuario(userId) {
      const hojeStr = new Date().toLocaleDateString('pt-BR');
      const pontosHoje = pontosGerais
        .filter(p => p.usuarioId === userId && new Date(p.data).toLocaleDateString('pt-BR') === hojeStr)
        .sort((a,b) => new Date(a.data) - new Date(b.data));

      if (pontosHoje.length === 0) return "offline";
      return ['Entrada', 'Volta Intervalo'].includes(pontosHoje[pontosHoje.length - 1].tipo) ? "online" : "pausa"; 
  }

  function getMensagemDia(dataIso) {
      const uid = usuarioSelecionado?.id || relatorioDetalhado?.id;
      return todasMensagens.find(m => m.usuarioId == uid && m.dataIso === dataIso)?.texto;
  }

  const usuariosFiltrados = usuarios.filter(u => u.nome.toLowerCase().includes(termoBusca.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex text-gray-800">
      
      {/* SIDEBAR */}
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
            {/* NOVO ITEM DO MENU: CONSUMOS */}
            <BotaoMenu 
                icon={<ShoppingBag size={20}/>} 
                text="Consumos" 
                active={view === 'consumos'} 
                onClick={() => { setView('consumos'); setUsuarioSelecionado(null); setRelatorioDetalhado(null); }} 
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

      {/* CONTEÚDO PRINCIPAL */}
      <main className="ml-64 flex-1 p-8 print:ml-0 print:p-0 print:w-full">
        
        {/* HEADER SUPERIOR */}
        <header className="flex justify-between items-center mb-8 relative print:hidden">
            <div>
                <h2 className="text-2xl font-bold text-[#071d41]">
                    {view === 'consumos' ? 'Cantina / Consumos' : view === 'relatorios' ? 'Relatórios' : 'Painel de Controle'}
                </h2>
                <p className="text-gray-500 text-sm">Gestão completa do sistema.</p>
            </div>
            
            <div className="flex items-center gap-4">
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

                <div className="flex items-center gap-3 pl-4 border-l">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-[#071d41]">{adminUser.nome}</p>
                        <p className="text-xs text-gray-500">{adminUser.cargo}</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-md relative group">
                        {adminUser.nome ? adminUser.nome.substring(0, 2).toUpperCase() : "AD"}
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
                {/* 1. DASHBOARD COM GRÁFICO (NOVO) */}
                {view === 'dashboard' && !usuarioSelecionado && (
                    <div className="space-y-6 animate-fade-in print:hidden">
                        
                        {/* CARDS KPI */}
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

                        {/* GRÁFICO DE PRODUTIVIDADE (Recharts) */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                             <h3 className="font-bold text-[#071d41] mb-4 text-sm uppercase tracking-wide">Produtividade da Equipe (Últimos 7 dias)</h3>
                             <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dadosGrafico}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                        <Bar dataKey="horas" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} name="Horas Trabalhadas" />
                                    </BarChart>
                                </ResponsiveContainer>
                             </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h3 className="font-bold text-[#071d41]">Colaboradores</h3>
                                <div className="flex gap-2">
                                    <input placeholder="Buscar..." className="border p-2 rounded text-sm" value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} />
                                    <button onClick={() => setModalNovoUsuario(true)} className="bg-[#1351b4] text-white px-4 py-2 rounded text-sm flex gap-2"><UserPlus size={16}/> Novo</button>
                                </div>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100"><tr><th className="p-4">Nome</th><th className="p-4">Cargo</th><th className="p-4 text-center">Status</th><th className="p-4 text-center">Ações</th></tr></thead>
                                <tbody>
                                    {usuariosFiltrados.map(user => (
                                        <tr key={user.id} className="border-t hover:bg-gray-50">
                                            <td className="p-4 font-bold">{user.nome}<br/><span className="text-xs font-normal text-gray-400">{user.email}</span></td>
                                            <td className="p-4">{user.cargo}</td>
                                            <td className="p-4 text-center"><span className={`px-2 py-1 rounded text-xs border ${user.status==='ativo'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{user.status}</span></td>
                                            <td className="p-4 flex justify-center gap-2">
                                                <button onClick={() => setUsuarioSelecionado(user)} className="bg-blue-100 text-blue-600 p-2 rounded"><Eye size={18}/></button>
                                                <button onClick={() => abrirEdicao(user)} className="bg-orange-100 text-orange-600 p-2 rounded"><Edit3 size={18}/></button>
                                                <button onClick={() => handleExcluirUsuario(user)} className="bg-red-100 text-red-600 p-2 rounded"><Trash2 size={18}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 2. RELATÓRIOS (LISTA) */}
                {view === 'relatorios' && !usuarioSelecionado && !relatorioDetalhado && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Cabeçalho de Impressão */}
                        <div className="hidden print:block text-center mb-6">
                            <h1 className="text-2xl font-bold">Relatório Geral de Ponto</h1>
                            <p className="text-sm">Período: {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][mesRelatorio]} / {anoRelatorio}</p>
                        </div>

                        <div className="bg-white p-6 rounded shadow-sm border flex justify-between items-center print:shadow-none print:border-none print:p-0">
                            <h3 className="font-bold text-[#071d41] print:hidden">Relatório Mensal</h3>
                            <div className="flex gap-2 print:hidden">
                                <select value={mesRelatorio} onChange={e => setMesRelatorio(Number(e.target.value))} className="border p-2 rounded text-sm">{["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"].map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
                                <select value={anoRelatorio} onChange={e => setAnoRelatorio(Number(e.target.value))} className="border p-2 rounded text-sm">{[2025,2026,2027].map(a=><option key={a} value={a}>{a}</option>)}</select>
                                <button onClick={handleExportarExcel} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold flex gap-2"><FileSpreadsheet size={16}/> Excel</button>
                                <button onClick={() => window.print()} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold flex gap-2"><Printer size={16}/> PDF</button>
                            </div>
                        </div>

                        <div className="bg-white rounded shadow-sm border overflow-hidden print:border-0">
                            <table className="w-full text-left text-sm print:text-xs">
                                <thead className="bg-gray-100 print:bg-gray-200"><tr><th className="p-3">Nome</th><th className="p-3 text-center">Horas</th><th className="p-3 text-center">Saldo</th><th className="p-3 text-center">Obs</th><th className="p-3 text-center print:hidden">Ação</th></tr></thead>
                                <tbody>
                                    {dadosRelatorio.map(rel => (
                                        <tr key={rel.id} className="border-t hover:bg-gray-50 print:break-inside-avoid">
                                            <td className="p-3 font-bold">{rel.nome}</td>
                                            <td className="p-3 text-center font-mono">{rel.totalHoras}</td>
                                            <td className="p-3 text-center font-bold"><span className={`px-2 py-1 rounded ${rel.saldoMinutos >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{formatarSaldo(rel.saldoMinutos)}</span></td>
                                            <td className="p-3 text-center">{rel.diasFolga > 0 ? `${rel.diasFolga} Folgas` : (rel.faltas.length > 0 ? `${rel.faltas.length} Faltas` : "100%")}</td>
                                            <td className="p-3 text-center print:hidden"><button onClick={() => setRelatorioDetalhado(rel)} className="bg-[#1351b4] text-white px-3 py-1 rounded text-xs"><FileText size={14}/> Abrir</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. CONSUMOS (NOVA ABA) */}
                {view === 'consumos' && (
                    <div className="space-y-6 animate-fade-in print:hidden">
                        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                             <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                <h3 className="font-bold text-[#071d41] flex items-center gap-2 text-lg"><ShoppingBag size={24} className="text-[#1351b4]"/> Controle de Consumo (15 Dias)</h3>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <select 
                                        className="border p-2 rounded text-sm w-full md:w-64" 
                                        onChange={(e) => setColaboradorConsumo(e.target.value)}
                                        value={colaboradorConsumo || ""}
                                    >
                                        <option value="">Selecione um Funcionário...</option>
                                        {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                                    </select>
                                    <button 
                                        onClick={() => {
                                            if(!colaboradorConsumo) return toast.warning("Selecione um funcionário!");
                                            setConsumoEditando(null);
                                            setNovoConsumo({ nomeItem: "", valor: "", imagemUrl: "" });
                                            setModalNovoConsumo(true);
                                        }} 
                                        className="bg-[#1351b4] text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-blue-800"
                                    >
                                        <PlusCircle size={16}/> Adicionar Item
                                    </button>
                                </div>
                             </div>

                             {colaboradorConsumo ? (
                                <>
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center mb-6">
                                        <div>
                                            <p className="text-xs font-bold text-blue-500 uppercase">Total a Pagar</p>
                                            <p className="text-2xl font-black text-[#071d41]">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                                    listaConsumos.filter(c => c.usuarioId === parseInt(colaboradorConsumo)).reduce((a, b) => a + b.valor, 0)
                                                )}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-400 max-w-xs text-right hidden md:block">
                                            Itens mais antigos que 15 dias são removidos automaticamente.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {listaConsumos.filter(c => c.usuarioId === parseInt(colaboradorConsumo)).map(item => (
                                            <div key={item.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition flex gap-4">
                                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {item.imagemUrl ? <img src={item.imagemUrl} alt="Item" className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-gray-300" />}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-800">{item.nomeItem}</h4>
                                                    <p className="text-sm text-green-600 font-bold">R$ {item.valor.toFixed(2).replace('.', ',')}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(item.data).toLocaleDateString('pt-BR')}</p>
                                                </div>
                                                <div className="flex flex-col justify-between">
                                                    <button onClick={() => abrirModalEdicaoConsumo(item)} className="text-blue-400 hover:text-blue-600"><Edit3 size={16}/></button>
                                                    <button onClick={() => handleExcluirConsumo(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                             ) : (
                                 <div className="text-center p-10 text-gray-400 bg-gray-50 rounded border-2 border-dashed">Selecione um funcionário acima.</div>
                             )}
                        </div>
                    </div>
                )}

                {/* 4. FOLHA DE PONTO DETALHADA */}
                {relatorioDetalhado && (
                    <div className="bg-white p-8 max-w-4xl mx-auto shadow-lg print:shadow-none print:w-full animate-fade-in">
                        <div className="flex justify-between border-b-2 border-black pb-4 mb-6">
                            <div><h1 className="text-2xl font-black uppercase">Pinguim Manoa</h1><p>Folha de Ponto Individual</p></div>
                            <div className="text-right"><p className="font-bold">Mês: {mesRelatorio+1}/{anoRelatorio}</p></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm bg-gray-50 p-4 border print:bg-white print:border-black">
                            <p><strong>Nome:</strong> {relatorioDetalhado.nome}</p>
                            <p><strong>Cargo:</strong> {relatorioDetalhado.cargo}</p>
                            <p><strong>Saldo:</strong> {formatarSaldo(relatorioDetalhado.saldoMinutos)}</p>
                        </div>
                        <table className="w-full text-xs border-collapse border border-black mb-8">
                            <thead className="bg-gray-200 font-bold uppercase print:bg-gray-100">
                                <tr><th className="border border-black p-1 text-left">Data</th><th className="border border-black p-1 text-center">Entrada</th><th className="border border-black p-1 text-center">Saída</th><th className="border border-black p-1 text-center">Saldo</th><th className="border border-black p-1 text-center">Situação</th></tr>
                            </thead>
                            <tbody>
                                {gerarDiasDoMesParaRelatorio(mesRelatorio, anoRelatorio, pontosGerais.filter(p=>p.usuarioId === relatorioDetalhado.id), folgasGerais.filter(f=>f.usuarioId === relatorioDetalhado.id)).map((dia, idx) => (
                                    <tr key={idx} className="print:break-inside-avoid">
                                        <td className="border border-black p-1">{dia.dataFormatada}</td>
                                        <td className="border border-black p-1 text-center">{dia.entrada}</td>
                                        <td className="border border-black p-1 text-center">{dia.saida}</td>
                                        <td className={`border border-black p-1 text-center font-bold ${dia.saldo==='00:00'||dia.saldoPositivo?'text-green-700':'text-red-600'}`}>{dia.saldo}</td>
                                        <td className="border border-black p-1 text-center">{dia.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mt-16 grid grid-cols-2 gap-20 print:gap-10 page-break-inside-avoid">
                            <div className="text-center"><div className="border-t border-black pt-2"></div><p className="text-sm font-bold">Empregador</p></div>
                            <div className="text-center"><div className="border-t border-black pt-2"></div><p className="text-sm font-bold">Colaborador</p></div>
                        </div>
                        <div className="mt-8 flex justify-center gap-4 print:hidden">
                            <button onClick={()=>setRelatorioDetalhado(null)} className="px-4 py-2 border rounded hover:bg-gray-100 flex gap-2"><ArrowLeft size={16}/> Voltar</button>
                            <button onClick={()=>handleEnviarEmailRelatorio(relatorioDetalhado)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex gap-2 shadow"><Mail size={16}/> Enviar Email</button>
                            <button onClick={()=>window.print()} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex gap-2 shadow"><Printer size={16}/> Imprimir</button>
                        </div>
                    </div>
                )}

                {/* 5. EDIÇÃO HISTÓRICO */}
                {usuarioSelecionado && (
                    <div className="space-y-6 print:hidden">
                        <div className="flex justify-between items-center">
                            <button onClick={()=>setUsuarioSelecionado(null)} className="flex items-center text-sm font-bold text-gray-500 hover:text-blue-600"><ChevronDown className="rotate-90 mr-1"/> Voltar</button>
                            <div className="flex gap-2">
                                <button onClick={()=>toggleStatusUsuario(usuarioSelecionado)} className={`px-4 py-2 rounded text-sm font-bold ${usuarioSelecionado.status==='ativo'?'bg-red-100 text-red-700':'bg-green-100 text-green-700'}`}>{usuarioSelecionado.status==='ativo'?'Bloquear':'Desbloquear'}</button>
                            </div>
                        </div>
                        <div className="bg-white rounded shadow-sm border overflow-hidden">
                            <div className="p-4 bg-gray-50 font-bold border-b text-[#071d41]">Histórico Detalhado</div>
                            <div className="divide-y">
                                {gerarDiasDoMesSelecionado(mesFicha, anoFicha, pontosGerais.filter(p=>p.usuarioId === usuarioSelecionado.id)).map((dia, idx) => (
                                    <ItemDiaAdmin 
                                        key={idx} 
                                        dia={dia} 
                                        pontosReais={pontosGerais.filter(p => p.usuarioId === usuarioSelecionado.id && new Date(p.data).toLocaleDateString('pt-BR') === dia.dataFormatada)}
                                        mensagem={getMensagemDia(dia.dataIso)} 
                                        usuarioId={usuarioSelecionado.id} 
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

      {/* MODAIS (ADMIN, NOVO, EDITAR) */}
      {modalPerfilAdmin && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
              <div className="bg-white p-6 rounded shadow w-full max-w-sm">
                  <h3 className="font-bold text-lg mb-4">Editar Admin</h3>
                  <input className="w-full border p-2 mb-2 rounded" placeholder="Nome" value={adminParaEditar.nome} onChange={e=>setAdminParaEditar({...adminParaEditar, nome:e.target.value})} />
                  <input className="w-full border p-2 mb-2 rounded" placeholder="Email" value={adminParaEditar.email} onChange={e=>setAdminParaEditar({...adminParaEditar, email:e.target.value})} />
                  <input className="w-full border p-2 mb-2 rounded" placeholder="Cargo" value={adminParaEditar.cargo} onChange={e=>setAdminParaEditar({...adminParaEditar, cargo:e.target.value})} />
                  <div className="flex gap-2 justify-end mt-2"><button onClick={()=>setModalPerfilAdmin(false)} className="text-gray-500 px-4">Cancelar</button><button onClick={salvarPerfilAdmin} className="bg-blue-600 text-white px-4 py-2 rounded">Salvar</button></div>
              </div>
          </div>
      )}
      {modalNovoUsuario && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
              <div className="bg-white p-6 rounded shadow w-full max-w-sm">
                  <h3 className="font-bold text-lg mb-4">Novo Colaborador</h3>
                  <input className="w-full border p-2 mb-2 rounded" placeholder="Nome" value={novoUser.nome} onChange={e=>setNovoUser({...novoUser, nome:e.target.value})}/>
                  <input className="w-full border p-2 mb-2 rounded" placeholder="Email" value={novoUser.email} onChange={e=>setNovoUser({...novoUser, email:e.target.value})}/>
                  <input className="w-full border p-2 mb-2 rounded" placeholder="Cargo" value={novoUser.cargo} onChange={e=>setNovoUser({...novoUser, cargo:e.target.value})}/>
                  <button onClick={handleNovoUsuario} className="w-full bg-[#1351b4] text-white py-2 rounded mt-2">Cadastrar</button>
                  <button onClick={()=>setModalNovoUsuario(false)} className="w-full text-gray-500 py-2 mt-1">Cancelar</button>
              </div>
          </div>
      )}
      {modalEditarUsuario && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
              <div className="bg-white p-6 rounded shadow w-full max-w-sm border-t-4 border-orange-500">
                  <h3 className="font-bold text-lg mb-4">Editar Usuário</h3>
                  <input className="w-full border p-2 mb-2 rounded" value={usuarioParaEditar.nome} onChange={e=>setUsuarioParaEditar({...usuarioParaEditar, nome:e.target.value})}/>
                  <input className="w-full border p-2 mb-2 rounded" value={usuarioParaEditar.email} onChange={e=>setUsuarioParaEditar({...usuarioParaEditar, email:e.target.value})}/>
                  <input className="w-full border p-2 mb-2 rounded" value={usuarioParaEditar.cargo} onChange={e=>setUsuarioParaEditar({...usuarioParaEditar, cargo:e.target.value})}/>
                  <button onClick={handleSalvarEdicao} className="w-full bg-orange-500 text-white py-2 rounded mt-2">Salvar</button>
                  <button onClick={()=>setModalEditarUsuario(false)} className="w-full text-gray-500 py-2 mt-1">Cancelar</button>
              </div>
          </div>
      )}
      {modalNovoConsumo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
              <div className="bg-white p-6 rounded shadow w-full max-w-sm animate-scale-in">
                  <h3 className="font-bold text-lg mb-4">{consumoEditando ? "Editar Item" : "Novo Item"}</h3>
                  <div className="space-y-4">
                      <input placeholder="Nome do Item" className="w-full border p-2 rounded" value={novoConsumo.nomeItem} onChange={e=>setNovoConsumo({...novoConsumo, nomeItem:e.target.value})} />
                      <div className="relative"><DollarSign size={16} className="absolute left-2 top-3 text-gray-400"/><input type="number" step="0.01" placeholder="0.00" className="w-full border p-2 pl-8 rounded" value={novoConsumo.valor} onChange={e=>setNovoConsumo({...novoConsumo, valor:e.target.value})} /></div>
                      <input placeholder="URL da Imagem (Opcional)" className="w-full border p-2 rounded" value={novoConsumo.imagemUrl} onChange={e=>setNovoConsumo({...novoConsumo, imagemUrl:e.target.value})} />
                      <button onClick={handleSalvarConsumo} className="w-full bg-[#1351b4] text-white py-2 rounded">Salvar</button>
                      <button onClick={()=>setModalNovoConsumo(false)} className="w-full text-gray-500 py-2">Cancelar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

// ==================== HELPERS ====================

function ItemDiaAdmin({ dia, pontosReais, mensagem, usuarioId, isFolga, onUpdate }) {
    const [aberto, setAberto] = useState(false);
    const [novoPonto, setNovoPonto] = useState({ hora: "08:00", tipo: "Entrada" });
    const [adicionando, setAdicionando] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [editValues, setEditValues] = useState({ hora: "", tipo: "" });

    async function handleExcluir(id) { if(confirm("Apagar?")) { await fetch(`/api/ponto?id=${id}`, { method: 'DELETE' }); onUpdate(); } }
    async function salvarNovoPonto() {
        const [ano, mes, diaMes] = dia.dataIso.split('-');
        const dataFinal = new Date(ano, mes - 1, diaMes);
        const [h, m] = novoPonto.hora.split(':');
        dataFinal.setHours(parseInt(h), parseInt(m));
        await fetch('/api/ponto', { method: 'POST', body: JSON.stringify({ modoAdmin: true, usuarioId, tipo: novoPonto.tipo, dataManual: dataFinal.toISOString() }) });
        setAdicionando(false); onUpdate();
    }
    async function salvarEdicao(idOriginal, dataOriginal) {
        const dataBase = new Date(dataOriginal);
        const [h, m] = editValues.hora.split(':');
        dataBase.setHours(parseInt(h), parseInt(m));
        await fetch('/api/ponto', { method: 'PUT', body: JSON.stringify({ id: idOriginal, novaData: dataBase.toISOString(), novoTipo: editValues.tipo }) });
        setEditandoId(null); onUpdate();
    }
    async function toggleFolga() {
        await fetch('/api/folgas', { method: 'POST', body: JSON.stringify({ usuarioId, dataIso: dia.dataIso }) });
        onUpdate();
    }
    const isPos = dia.saldoPositivo || dia.saldo === '00:00';
    
    return (
        <div className="border-b border-gray-100 last:border-0">
            <div className={`flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer ${isFolga ? 'bg-blue-50/70' : aberto ? 'bg-blue-50/30' : ''}`} onClick={()=>setAberto(!aberto)}>
                <div>
                    <span className="font-bold text-sm text-[#071d41]">{dia.dataFormatada}</span>
                    <div className="flex gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${dia.status === 'PRESENÇA' ? 'bg-green-100 text-green-700' : (dia.status === 'FOLGA' ? 'bg-blue-100 text-blue-700' : 'bg-red-50 text-red-500')}`}>{dia.status}</span>
                        {dia.status !== 'FOLGA' && dia.saldo && <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${isPos ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>Saldo: {dia.saldo}</span>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {mensagem && <MessageCircle size={16} className="text-blue-500"/>}
                    {aberto ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
                </div>
            </div>
            {aberto && (
                <div className="bg-gray-50 p-4 pl-8 border-t border-gray-100 text-sm">
                    <div className="flex gap-2 mb-4">
                        <button onClick={()=>setAdicionando(!adicionando)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold hover:bg-green-200 flex items-center gap-1"><PlusCircle size={14}/> Ponto</button>
                        <button onClick={toggleFolga} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${isFolga ? 'bg-gray-200' : 'bg-blue-100 text-blue-700'}`}>{isFolga ? <><X size={14}/> Remover Folga</> : <><Coffee size={14}/> Definir Folga</>}</button>
                    </div>
                    {adicionando && <div className="bg-white p-3 rounded border mb-3 flex gap-2 items-center"><select value={novoPonto.tipo} onChange={e=>setNovoPonto({...novoPonto, tipo:e.target.value})} className="border rounded p-1"><option>Entrada</option><option>Saída</option></select><input type="time" value={novoPonto.hora} onChange={e=>setNovoPonto({...novoPonto, hora:e.target.value})} className="border rounded p-1"/><button onClick={salvarNovoPonto} className="bg-green-600 text-white p-1 rounded"><Save size={16}/></button></div>}
                    {mensagem && <div className="mb-2 p-2 bg-blue-50 text-blue-800 rounded border border-blue-100 italic">Justificativa: "{mensagem}"</div>}
                    {pontosReais && pontosReais.length > 0 ? pontosReais.map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-white p-2 border rounded mb-1">
                            {editandoId === p.id ? (
                                <div className="flex gap-2 items-center"><select value={editValues.tipo} onChange={e=>setEditValues({...editValues, tipo:e.target.value})} className="border rounded p-1"><option>Entrada</option><option>Saída</option></select><input type="time" value={editValues.hora} onChange={e=>setEditValues({...editValues, hora:e.target.value})} className="border rounded p-1"/><button onClick={()=>salvarEdicao(p.id, p.data)}><Save size={16}/></button></div>
                            ) : (
                                <div className="flex gap-2 w-full justify-between items-center">
                                    <div className="flex gap-2 items-center"><span className={`font-bold ${p.tipo==='Entrada'?'text-green-600':'text-red-600'}`}>{p.tipo}</span><span className="font-mono">{new Date(p.data).toLocaleTimeString('pt-BR').slice(0,5)}</span>{p.ip?.includes("Manual") && <span className="text-[10px] bg-yellow-100 px-1 rounded">Manual</span>}</div>
                                    <div className="flex gap-2"><button onClick={()=>{setEditValues({ hora: new Date(p.data).toLocaleTimeString('pt-BR').slice(0,5), tipo: p.tipo }); setEditandoId(p.id);}}><Edit3 size={16}/></button><button onClick={()=>handleExcluir(p.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></div>
                                </div>
                            )}
                        </div>
                    )) : <p className="text-gray-400 italic">Sem registros de ponto.</p>}
                </div>
            )}
        </div>
    )
}

function BotaoMenu({ icon, text, active, onClick }) { return <div onClick={onClick} className={`flex items-center gap-3 p-3 rounded cursor-pointer transition select-none ${active ? 'bg-[#1351b4] text-white font-bold' : 'text-gray-300 hover:text-white'}`}>{icon}<span className="text-sm">{text}</span></div> }
function CardResumo({ titulo, valor, icon, cor }) { return <div className={`bg-white p-6 rounded shadow-sm border border-gray-200 flex items-center justify-between ${cor}`}><div><p className="text-gray-500 text-xs font-bold uppercase">{titulo}</p><p className="text-3xl font-bold text-[#071d41]">{valor}</p></div><div className="bg-gray-50 p-3 rounded-full">{icon}</div></div> }
function BadgeStatus({ status }) { return status === 'online' ? <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">ONLINE</span> : <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">OFF</span> }
function formatarSaldo(m) { const h = Math.floor(Math.abs(m)/60); const min = Math.abs(m)%60; return `${m>=0?'+':'-'}${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`; }
function gerarDiasDoMesSelecionado(mes, ano, pontos) {
    const dias = []; const ultimo = new Date(ano, mes + 1, 0).getDate();
    for (let i = 1; i <= ultimo; i++) {
        const d = new Date(ano, mes, i); const str = d.toLocaleDateString('pt-BR'); const iso = d.toISOString().split('T')[0];
        dias.push({ dataIso: iso, dataFormatada: str, diaSemana: d.toLocaleDateString('pt-BR',{weekday:'long'}), pontos: [] });
    } return dias.reverse();
}

// CORREÇÃO DO CÁLCULO DE HORAS (00:00 = VERDE)
function gerarDiasDoMesParaRelatorio(mes, ano, pontos, folgas) {
    const dias = []; const ultimo = new Date(ano, mes + 1, 0).getDate();
    for (let i = 1; i <= ultimo; i++) {
        const d = new Date(ano, mes, i); const str = d.toLocaleDateString('pt-BR'); const iso = d.toISOString().split('T')[0];
        const isFolga = folgas.some(f => f.dataIso === iso);
        const pts = pontos.filter(p => new Date(p.data).toLocaleDateString('pt-BR') === str);
        const ent = pts.find(p => p.tipo === 'Entrada'); const sai = pts.filter(p => p.tipo === 'Saída').pop();

        let entS="--:--", saiS="--:--", horas="00:00", saldo="00:00", status="AUSÊNCIA", pos=false;

        if (isFolga) { status="FOLGA"; saldo="00:00"; pos=true; }
        else if (ent) {
            entS = new Date(ent.data).toLocaleTimeString('pt-BR').slice(0,5); status="PRESENÇA";
            if (sai) {
                saiS = new Date(sai.data).toLocaleTimeString('pt-BR').slice(0,5);
                let dtE = new Date(ent.data), dtS = new Date(sai.data);
                if(dtS < dtE) dtS.setDate(dtS.getDate() + 1);
                const diff = dtS - dtE;
                const hT = Math.floor(diff/3600000), mT = Math.floor((diff%3600000)/60000);
                horas = `${String(hT).padStart(2,'0')}:${String(mT).padStart(2,'0')}`;
                
                const saldoMs = diff - (8*3600000);
                if (Math.abs(saldoMs) < 60000) { saldo="00:00"; pos=true; }
                else {
                    pos = saldoMs >= 0;
                    const hS = Math.floor(Math.abs(saldoMs)/3600000), mS = Math.floor((Math.abs(saldoMs)%3600000)/60000);
                    saldo = `${pos?'+':'-'}${String(hS).padStart(2,'0')}:${String(mS).padStart(2,'0')}`;
                }
            } else { saldo = "-08:00"; pos = false; }
        } else {
            if(d < new Date()) { saldo="-08:00"; pos=false; status="AUSÊNCIA"; } else { saldo=""; status=""; }
        }
        dias.push({ dataIso: iso, dataFormatada: str, diaNum: String(i).padStart(2,'0'), diaSemana: d.toLocaleDateString('pt-BR',{weekday:'long'}), entrada: entS, saida: saiS, horasTrabalhadas: horas, saldo, saldoPositivo: pos, status });
    }
    return dias;
}
function getMsg(iso) { return todasMensagens.find(m => m.dataIso === iso)?.texto; }