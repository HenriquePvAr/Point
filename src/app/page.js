"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { 
  Clock, LogIn, LogOut, Menu, Home, ChevronRight, CheckSquare, 
  FileText, Moon, Sun, Coffee, ArrowLeftCircle, Calendar, 
  ChevronDown, ChevronUp, PlusCircle, Eye, EyeOff, MessageCircle, Send, X, Edit3, Lock, Save, Mail
} from "lucide-react";
import { toast } from 'sonner';

export default function Page() {
  const router = useRouter(); 
  
  // ==========================================================
  // 1. ESTADOS DE AUTENTICAÇÃO E USUÁRIO
  // ==========================================================
  const [user, setUser] = useState(null);
  
  // Login
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false); // Olho do Login
  
  // Primeiro Acesso (Troca de Senha Obrigatória)
  const [modalNovaSenha, setModalNovaSenha] = useState(false);
  const [novaSenhaInput, setNovaSenhaInput] = useState("");
  const [confirmarSenhaInput, setConfirmarSenhaInput] = useState("");
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false); // Olho do Primeiro Acesso

  // Recuperação de Senha ("Esqueci minha senha")
  const [viewRecuperar, setViewRecuperar] = useState(false);
  const [passoRecuperar, setPassoRecuperar] = useState(1); // 1: Email, 2: Código
  const [emailRecuperar, setEmailRecuperar] = useState("");
  const [codigoRecuperar, setCodigoRecuperar] = useState("");
  const [novaSenhaRecuperar, setNovaSenhaRecuperar] = useState("");
  const [mostrarSenhaRec, setMostrarSenhaRec] = useState(false); // Olho da Recuperação

  // ==========================================================
  // 2. ESTADOS DO SISTEMA (PONTO E INTERFACE)
  // ==========================================================
  const [view, setView] = useState("registro"); // 'registro' ou 'ficha'
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [historico, setHistorico] = useState([]);
  const [status, setStatus] = useState(null); // Feedback visual de loading
  
  // Filtros da Ficha de Frequência
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(2026);
  
  // Mensagens / Justificativas
  const [mensagens, setMensagens] = useState({}); 

  // Controles de Ponto
  const [tipoSelecionado, setTipoSelecionado] = useState(null); 
  const [temaEscuro, setTemaEscuro] = useState(false);
  const [tempoTrabalhado, setTempoTrabalhado] = useState("00:00:00");
  const [ultimoRegistroHoje, setUltimoRegistroHoje] = useState(null);

  // ==========================================================
  // 3. EFEITOS (CRONÔMETRO E CÁLCULOS EM TEMPO REAL)
  // ==========================================================
  useEffect(() => {
    const timer = setInterval(() => {
      const agora = new Date();
      setHoraAtual(agora);
      
      const hojeStr = agora.toLocaleDateString('pt-BR');
      // Filtra registros de hoje e ordena
      const registrosHoje = historico.filter(h => 
        new Date(h.data).toLocaleDateString('pt-BR') === hojeStr
      ).sort((a, b) => new Date(a.data) - new Date(b.data)); 

      // Define qual foi a última batida (para bloquear botões errados)
      if (registrosHoje.length > 0) {
          setUltimoRegistroHoje(registrosHoje[registrosHoje.length - 1].tipo);
      } else {
          setUltimoRegistroHoje(null);
      }

      // Cálculo de Horas Trabalhadas em Tempo Real
      const primeiraEntrada = registrosHoje.find(h => h.tipo === 'Entrada');
      const ultimaSaida = registrosHoje.find(h => h.tipo === 'Saída'); // Se já saiu, para de contar

      let msTrabalhados = 0;
      if (primeiraEntrada) {
        const horaEntrada = new Date(primeiraEntrada.data);
        if (ultimaSaida) {
            // Se já encerrou o dia, calcula fixo
            msTrabalhados = new Date(ultimaSaida.data) - horaEntrada;
        } else {
            // Se ainda está trabalhando, calcula até agora
            msTrabalhados = agora - horaEntrada;
        }
        
        // Formata HH:MM:SS
        const totalSeg = Math.floor(msTrabalhados / 1000);
        const h = Math.floor(totalSeg / 3600);
        const m = Math.floor((totalSeg % 3600) / 60);
        const s = totalSeg % 60;
        setTempoTrabalhado(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      } else {
        setTempoTrabalhado("00:00:00");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [historico]);

  // ==========================================================
  // 4. FUNÇÕES DE AUTENTICAÇÃO (API)
  // ==========================================================
  
  // LOGIN
  async function handleLogin() {
    try {
      const res = await fetch("/api/auth", {
        method: "POST", body: JSON.stringify({ cpf, senha }),
      });
      const data = await res.json();

      if (data.success) { 
          if (data.user.tipo === 'admin') {
              router.push('/admin');
              return;
          }
          if (data.user.primeiroAcesso) {
              setUser(data.user); 
              setModalNovaSenha(true); 
              return;
          }
          setUser(data.user); 
          // Carrega Histórico e Mensagens assim que logar
          carregarDadosUsuario(data.user.id); 
      } else { 
          // Exibe erro (senha errada ou usuário bloqueado/inativo)
          toast.error(data.message); 
      }
    } catch (e) { toast.error("Erro de conexão com o servidor."); }
  }

  // TROCAR SENHA (PRIMEIRO ACESSO)
  async function handleTrocarSenha() {
      if (novaSenhaInput.length < 3) return toast.warning("A senha deve ter pelo menos 3 caracteres.");
      if (novaSenhaInput !== confirmarSenhaInput) return toast.error("As senhas não coincidem.");

      try {
          const res = await fetch("/api/auth/nova-senha", {
              method: "POST",
              body: JSON.stringify({ usuarioId: user.id, novaSenha: novaSenhaInput })
          });
          const data = await res.json();
          if (data.success) {
              toast.success("Senha definida com sucesso! Faça login.");
              setModalNovaSenha(false);
              setUser(null);
              setSenha("");
              setMostrarNovaSenha(false);
          } else { toast.error(data.message); }
      } catch (e) { toast.error("Erro ao trocar senha."); }
  }

  // RECUPERAÇÃO DE SENHA - PASSO 1 (ENVIAR CÓDIGO)
  async function enviarCodigoRecuperacao() {
      if(!emailRecuperar) return toast.warning("Digite seu e-mail cadastrado.");
      try {
          const res = await fetch("/api/auth/recuperar", { method: "POST", body: JSON.stringify({ email: emailRecuperar }) });
          const data = await res.json();
          
          if(data.success) {
              toast.success("Código enviado! Verifique seu e-mail.");
              setPassoRecuperar(2);
          } else { toast.error(data.message); }
      } catch(e) { toast.error("Erro no servidor."); }
  }

  // RECUPERAÇÃO DE SENHA - PASSO 2 (REDEFINIR)
  async function redefinirSenhaRecuperacao() {
      if(!codigoRecuperar || !novaSenhaRecuperar) return toast.warning("Preencha o código e a nova senha.");
      try {
          const res = await fetch("/api/auth/recuperar", { 
              method: "POST", 
              body: JSON.stringify({ email: emailRecuperar, codigo: codigoRecuperar, novaSenha: novaSenhaRecuperar }) 
          });
          const data = await res.json();
          if(data.success) {
              toast.success("Senha redefinida! Faça login agora.");
              setViewRecuperar(false);
              setPassoRecuperar(1);
              setSenha("");
              setCpf("");
          } else { toast.error(data.message); }
      } catch(e) { toast.error("Erro ao redefinir."); }
  }

  // ==========================================================
  // 5. FUNÇÕES DE DADOS (PONTO E MENSAGENS)
  // ==========================================================
  
  // REGISTRAR PONTO
  async function confirmarRegistro() {
    if (!tipoSelecionado) return;
    setStatus({ tipo: "loading", texto: "Registrando..." });
    try {
      const res = await fetch("/api/ponto", {
        method: "POST",
        body: JSON.stringify({ usuarioId: user.id, nome: user.nome, tipo: tipoSelecionado }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${tipoSelecionado} registrado com sucesso!`);
        carregarDadosUsuario(user.id);
        setTipoSelecionado(null);
      } else {
        toast.error(data.message);
      }
    } catch (e) { toast.error("Erro de conexão."); }
    setTimeout(() => setStatus(null), 1500);
  }

  // CARREGAR TUDO (Histórico e Justificativas)
  async function carregarDadosUsuario(id) {
    try {
        // 1. Carrega Pontos
        const resPonto = await fetch(`/api/ponto?userId=${id}`);
        setHistorico(await resPonto.json());

        // 2. Carrega Mensagens (Justificativas)
        const resMsg = await fetch(`/api/mensagens?userId=${id}`);
        const dataMsg = await resMsg.json();
        
        // Transforma array do banco em objeto fácil de ler: { '2026-01-01': 'Texto...' }
        const msgObj = {};
        if (Array.isArray(dataMsg)) {
            dataMsg.forEach(m => {
                msgObj[m.dataIso] = m.texto;
            });
        }
        setMensagens(msgObj);

    } catch(e) { 
        console.error("Erro ao carregar dados:", e);
        toast.error("Erro ao sincronizar dados.");
    }
  }

  // SALVAR JUSTIFICATIVA
  async function salvarMensagem(dataIso, texto) {
    try {
        const res = await fetch('/api/mensagens', {
            method: 'POST',
            body: JSON.stringify({ usuarioId: user.id, dataIso, texto })
        });
        const data = await res.json();

        if (data.success) {
            // Atualiza estado local para feedback imediato
            setMensagens(prev => ({...prev, [dataIso]: texto}));
            toast.success("Justificativa salva com sucesso!");
        } else {
            toast.error("Erro ao salvar.");
        }
    } catch (e) { toast.error("Erro de conexão."); }
  }

  // Regras para habilitar botões (Entrada > Intervalo > Volta > Saída)
  function verificarPermissao(tipoBotao) {
      if (ultimoRegistroHoje === 'Saída') return false; // Dia encerrado
      if (tipoBotao === 'Entrada') return ultimoRegistroHoje === null;
      if (tipoBotao === 'Ida Intervalo') return ultimoRegistroHoje === 'Entrada' || ultimoRegistroHoje === 'Volta Intervalo'; // Permite múltiplos intervalos se necessário, mas logicamente segue a entrada
      if (tipoBotao === 'Volta Intervalo') return ultimoRegistroHoje === 'Ida Intervalo';
      if (tipoBotao === 'Saída') return ultimoRegistroHoje === 'Entrada' || ultimoRegistroHoje === 'Volta Intervalo';
      return false;
  }

  // Tema de Cores
  const cores = temaEscuro ? {
    bg: "bg-[#121212]", header: "bg-[#000000]", card: "bg-[#1e1e1e]", text: "text-gray-100", textSec: "text-gray-400", border: "border-gray-700", subHeader: "bg-[#333]", input: "bg-[#2c2c2c] text-white border-gray-600", sideActive: "bg-[#333] text-blue-400 border-l-blue-400"
  } : {
    bg: "bg-[#f5f5f5]", header: "bg-[#071d41]", card: "bg-white", text: "text-gray-800", textSec: "text-gray-500", border: "border-gray-200", subHeader: "bg-[#1351b4]", input: "bg-white text-black border-gray-300", sideActive: "bg-blue-50 text-[#1351b4] border-l-[#1351b4]"
  };

  // ==========================================================
  // 6. RENDERIZAÇÃO: TELAS DE LOGIN
  // ==========================================================
  if (!user || modalNovaSenha) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-sans ${cores.bg}`}>
        
        {/* MODAL DE PRIMEIRO ACESSO */}
        {modalNovaSenha && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md animate-scale-in">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock size={32} className="text-[#1351b4]"/>
                        </div>
                        <h2 className="text-2xl font-bold text-[#071d41]">Defina sua Senha</h2>
                        <p className="text-gray-500 mt-2 text-sm">Primeiro acesso detectado. Por segurança, crie uma nova senha.</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="relative">
                            <input 
                                type={mostrarNovaSenha ? "text" : "password"} 
                                placeholder="Nova Senha" 
                                className="w-full border p-3 rounded text-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10" 
                                value={novaSenhaInput} 
                                onChange={e => setNovaSenhaInput(e.target.value)} 
                            />
                            <button onClick={()=>setMostrarNovaSenha(!mostrarNovaSenha)} className="absolute right-3 top-3.5 text-gray-400 hover:text-blue-600">
                                {mostrarNovaSenha ? <EyeOff size={20}/> : <Eye size={20}/>}
                            </button>
                        </div>
                        <input type="password" placeholder="Confirmar Senha" className="w-full border p-3 rounded text-lg focus:ring-2 focus:ring-blue-500 outline-none" value={confirmarSenhaInput} onChange={e => setConfirmarSenhaInput(e.target.value)} />
                        
                        <button onClick={handleTrocarSenha} className="w-full bg-[#1351b4] text-white font-bold py-4 rounded hover:bg-blue-800 flex items-center justify-center gap-2 mt-2 transition shadow-lg">
                            <Save size={20}/> SALVAR NOVA SENHA
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* LOGIN E RECUPERAÇÃO */}
        {!modalNovaSenha && (
            <div className={`${cores.card} p-8 rounded shadow-md w-full max-w-sm border-t-4 border-[#1351b4]`}>
                
                {!viewRecuperar ? (
                    // --- TELA DE LOGIN ---
                    <>
                        <h1 className="text-2xl font-bold text-[#1351b4] mb-6 flex items-center gap-2">
                            <span className="font-black text-3xl">Point</span> Acesso
                        </h1>
                        
                        <input 
                            className={`w-full p-3 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-[#1351b4] ${cores.input}`} 
                            placeholder="CPF (apenas números)" 
                            value={cpf} 
                            onChange={e => setCpf(e.target.value)} 
                        />
                        
                        <div className="relative mb-6">
                            <input 
                                className={`w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#1351b4] ${cores.input} pr-10`} 
                                type={mostrarSenha ? "text" : "password"} 
                                placeholder="Senha" 
                                value={senha} 
                                onChange={e => setSenha(e.target.value)} 
                            />
                            <button onClick={()=>setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-3 text-gray-400 hover:text-[#1351b4] transition">
                                {mostrarSenha ? <EyeOff size={20}/> : <Eye size={20}/>}
                            </button>
                        </div>
                        
                        <div className="flex justify-end mb-6">
                             <button onClick={() => setViewRecuperar(true)} className="text-xs text-gray-500 hover:text-[#1351b4] hover:underline">Esqueci minha senha</button>
                        </div>

                        <button onClick={handleLogin} className="w-full bg-[#1351b4] text-white font-bold py-3 rounded-full hover:bg-[#0c3b85] transition shadow-md">
                            ENTRAR
                        </button>
                    </>
                ) : (
                    // --- TELA DE RECUPERAR SENHA ---
                    <>
                         <h1 className="text-xl font-bold text-[#071d41] mb-2 flex items-center gap-2"><Lock size={20}/> Recuperar Senha</h1>
                         <p className="text-xs text-gray-500 mb-6">Siga os passos para redefinir sua senha.</p>
                         
                         {passoRecuperar === 1 ? (
                             <>
                                <label className="text-xs font-bold text-gray-600 mb-1 block">Informe seu E-mail cadastrado</label>
                                <div className="relative mb-4">
                                    <Mail className="absolute left-3 top-3 text-gray-400" size={18}/>
                                    <input className="w-full pl-10 p-3 border rounded outline-none focus:border-blue-500" placeholder="ex: henrique@email.com" value={emailRecuperar} onChange={e => setEmailRecuperar(e.target.value)} />
                                </div>
                                <button onClick={enviarCodigoRecuperacao} className="w-full bg-[#1351b4] text-white font-bold py-3 rounded hover:bg-[#0c3b85] transition shadow-md">Enviar Código</button>
                             </>
                         ) : (
                             <>
                                <div className="bg-blue-50 p-3 rounded mb-4 text-xs text-blue-800 border border-blue-100 flex items-start gap-2">
                                    <Mail size={16} className="mt-0.5"/>
                                    <span>Código enviado para <b>{emailRecuperar}</b></span>
                                </div>
                                
                                <input className="w-full p-3 mb-3 border rounded outline-none" placeholder="Código (Ex: 1234)" value={codigoRecuperar} onChange={e => setCodigoRecuperar(e.target.value)} />
                                
                                <div className="relative mb-4">
                                    <input 
                                        className="w-full p-3 border rounded outline-none pr-10" 
                                        type={mostrarSenhaRec ? "text" : "password"} 
                                        placeholder="Nova Senha" 
                                        value={novaSenhaRecuperar} 
                                        onChange={e => setNovaSenhaRecuperar(e.target.value)} 
                                    />
                                    <button onClick={()=>setMostrarSenhaRec(!mostrarSenhaRec)} className="absolute right-3 top-3 text-gray-400 hover:text-green-600">
                                        {mostrarSenhaRec ? <EyeOff size={20}/> : <Eye size={20}/>}
                                    </button>
                                </div>

                                <button onClick={redefinirSenhaRecuperacao} className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 transition shadow-md">Redefinir Senha</button>
                             </>
                         )}

                         <button onClick={() => { setViewRecuperar(false); setPassoRecuperar(1); }} className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 border-t pt-4">Cancelar e Voltar</button>
                    </>
                )}
            </div>
        )}
      </div>
    );
  }

  // ==========================================================
  // 7. RENDERIZAÇÃO: DASHBOARD DO COLABORADOR
  // ==========================================================
  return (
    <div className={`min-h-screen font-sans ${cores.bg} ${cores.text} transition-colors duration-300`}>
      {/* HEADER */}
      <header className={`${cores.header} text-white h-16 flex items-center px-4 md:px-8 justify-between shadow-md`}>
        <div className="flex items-center gap-4">
          <span className="font-black text-3xl tracking-tight flex items-end">Point</span>
          <div className="h-6 w-px bg-white/30 hidden md:block"></div>
          <span className="text-sm font-light hidden md:block">Bem-vindo, {user.nome.split(' ')[0]}</span>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => setUser(null)} className="text-xs border border-white/50 px-3 py-1 rounded hover:bg-white/10 transition">SAIR</button>
           <div onClick={() => setTemaEscuro(!temaEscuro)} className="flex items-center gap-1 text-xs cursor-pointer select-none hover:opacity-80">
              <div className={`${temaEscuro ? 'bg-yellow-400 text-black' : 'bg-white text-[#071d41]'} rounded-full p-1 transition-all`}>
                {temaEscuro ? <Sun size={14} /> : <Moon size={14} />}
              </div> 
              {temaEscuro ? "Claro" : "Escuro"}
           </div>
        </div>
      </header>

      {/* SUB-HEADER (BREADCRUMB) */}
      <div className={`${cores.subHeader} h-12 flex items-center px-4 md:px-8 text-white shadow-inner transition-colors`}>
        <Menu className="w-5 h-5 mr-3 cursor-pointer hover:opacity-80" />
        <h2 className="font-semibold text-sm md:text-base">{view === 'registro' ? 'Registro de Ponto' : 'Ficha de Frequência'}</h2>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-6">
        {/* SIDEBAR */}
        <aside className={`hidden md:block w-64 ${cores.card} rounded shadow-sm border ${cores.border} h-fit`}>
            <div className={`p-4 border-b ${cores.border} font-bold text-[#1351b4] flex items-center gap-2`}><Menu className="w-4 h-4" /> MENU</div>
            <nav>
                <div onClick={() => setView('registro')} className={`p-3 px-4 flex items-center gap-3 text-sm cursor-pointer border-b ${cores.border} ${view === 'registro' ? cores.sideActive + " border-l-4 font-bold" : "hover:opacity-70 " + cores.textSec}`}><CheckSquare size={16}/> Registro de Ponto</div>
                <div onClick={() => setView('ficha')} className={`p-3 px-4 flex items-center gap-3 text-sm cursor-pointer border-b ${cores.border} ${view === 'ficha' ? cores.sideActive + " border-l-4 font-bold" : "hover:opacity-70 " + cores.textSec}`}><FileText size={16}/> Ficha de Frequência</div>
            </nav>
        </aside>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="flex-1">
            <div className={`flex items-center text-xs ${cores.textSec} mb-4`}>
                <Home className="w-3 h-3 mr-1" /><span>Início</span><ChevronRight className="w-3 h-3 mx-1" /><span className={temaEscuro ? 'text-gray-300' : 'text-gray-700'}>{view === 'registro' ? 'Registro de Ponto' : 'Ficha de Frequência'}</span>
            </div>

            {/* ---> VIEW: REGISTRO DE PONTO <--- */}
            {view === 'registro' && (
                <div className="space-y-6">
                    <div className={`${cores.card} rounded shadow-sm border ${cores.border} p-8 flex flex-col items-center justify-center min-h-[400px]`}>
                        {/* Relógio Digital */}
                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center gap-2 text-[#1351b4] font-bold mb-1"><Clock className="w-5 h-5" /> Hora atual</div>
                            <div className={`text-6xl font-bold tracking-tight ${temaEscuro ? 'text-white' : 'text-gray-700'}`}>{horaAtual.toLocaleTimeString('pt-BR')}</div>
                            <div className={`${cores.textSec} mt-2 text-sm capitalize`}>{horaAtual.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
                        </div>

                        {/* Tempo Trabalhado */}
                        <div className={`${temaEscuro ? 'bg-[#333] border-gray-600' : 'bg-[#f2f2f2] border-gray-200'} w-full max-w-md p-4 rounded mb-10 flex items-center justify-center gap-4 border`}>
                            <div className={`h-10 w-6 border-2 ${temaEscuro ? 'border-gray-500' : 'border-gray-400'} rounded-sm`}></div> 
                            <div className="text-center">
                                <p className="text-[#1351b4] text-sm font-semibold">Horas Trabalhadas (Hoje)</p>
                                <p className={`text-xl font-bold ${temaEscuro ? 'text-white' : 'text-gray-700'} font-mono`}>{tempoTrabalhado}</p>
                            </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="text-center w-full max-w-2xl">
                            <p className="text-[#1351b4] font-bold mb-4">Selecione o tipo de registro</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-center mb-8">
                                <BotaoSelecao titulo="Entrada" icone={<LogIn className="w-6 h-6" />} ativo={tipoSelecionado === 'Entrada'} habilitado={verificarPermissao('Entrada')} onClick={() => verificarPermissao('Entrada') && setTipoSelecionado('Entrada')} temaEscuro={temaEscuro} corPadrao="bg-[#f2ca4b]" />
                                <BotaoSelecao titulo="Ida Intervalo" icone={<Coffee className="w-6 h-6" />} ativo={tipoSelecionado === 'Ida Intervalo'} habilitado={verificarPermissao('Ida Intervalo')} onClick={() => verificarPermissao('Ida Intervalo') && setTipoSelecionado('Ida Intervalo')} temaEscuro={temaEscuro} corPadrao="bg-blue-400" />
                                <BotaoSelecao titulo="Volta Intervalo" icone={<ArrowLeftCircle className="w-6 h-6" />} ativo={tipoSelecionado === 'Volta Intervalo'} habilitado={verificarPermissao('Volta Intervalo')} onClick={() => verificarPermissao('Volta Intervalo') && setTipoSelecionado('Volta Intervalo')} temaEscuro={temaEscuro} corPadrao="bg-blue-500" />
                                <BotaoSelecao titulo="Saída" icone={<LogOut className="w-6 h-6" />} ativo={tipoSelecionado === 'Saída'} habilitado={verificarPermissao('Saída')} onClick={() => verificarPermissao('Saída') && setTipoSelecionado('Saída')} temaEscuro={temaEscuro} corPadrao="bg-[#e6e6e6]" textoEscuro={!temaEscuro} />
                            </div>
                            <button onClick={confirmarRegistro} disabled={!tipoSelecionado} className={`font-bold py-3 px-12 rounded-full shadow-lg transition text-sm w-full md:w-auto ${!tipoSelecionado ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-[#1351b4] hover:bg-[#0c3b85] text-white'}`}>
                                {tipoSelecionado ? `CONFIRMAR ${tipoSelecionado.toUpperCase()}` : 'SELECIONE UMA OPÇÃO'}
                            </button>
                        </div>
                    </div>

                    {/* Lista de Registros de Hoje */}
                    <div className={`${cores.card} p-6 rounded shadow-sm border ${cores.border}`}>
                        <h3 className="text-[#1351b4] font-bold border-b pb-2 mb-4 flex items-center gap-2"><Clock size={16}/> Registros de Hoje</h3>
                        <ul className="space-y-2">
                            {historico.filter(h => new Date(h.data).toLocaleDateString('pt-BR') === new Date().toLocaleDateString('pt-BR'))
                            .map((h, i) => (
                                <li key={i} className={`flex justify-between text-sm p-3 hover:opacity-80 border-b ${cores.border} last:border-0`}>
                                     <div className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${h.tipo === 'Entrada' ? 'bg-yellow-500' : h.tipo === 'Saída' ? 'bg-gray-500' : 'bg-blue-400'}`}></span>
                                        <span className={`font-semibold ${cores.text}`}>{h.tipo}</span>
                                     </div>
                                     <span className={`${cores.textSec} font-mono`}>{new Date(h.data).toLocaleTimeString('pt-BR')}</span>
                                </li>
                            ))}
                            {historico.filter(h => new Date(h.data).toLocaleDateString('pt-BR') === new Date().toLocaleDateString('pt-BR')).length === 0 && 
                                <li className={`${cores.textSec} italic text-sm p-2`}>Nenhum registro efetuado hoje.</li>
                            }
                        </ul>
                    </div>
                </div>
            )}

            {/* ---> VIEW: FICHA DE FREQUÊNCIA <--- */}
            {view === 'ficha' && (
                <div className="animate-fade-in">
                    <div className={`${cores.card} rounded shadow-sm border ${cores.border} p-6 mb-6`}>
                         <h3 className={`font-bold text-sm text-[#1351b4] uppercase mb-4 border-b ${cores.border} pb-2`}>Filtrar Período</h3>
                         <div className="flex flex-wrap items-end gap-4">
                             <div className="flex flex-col">
                                <label className="text-xs text-gray-500 font-bold mb-1">Mês</label>
                                <select value={mesSelecionado} onChange={(e) => setMesSelecionado(Number(e.target.value))} className={`p-2 rounded border text-sm font-bold ${cores.input} min-w-[120px]`}>
                                    {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (<option key={i} value={i}>{m}</option>))}
                                </select>
                             </div>
                             <div className="flex flex-col">
                                <label className="text-xs text-gray-500 font-bold mb-1">Ano</label>
                                <select value={anoSelecionado} onChange={(e) => setAnoSelecionado(Number(e.target.value))} className={`p-2 rounded border text-sm font-bold ${cores.input} min-w-[100px]`}>
                                    {Array.from({length: 15}, (_, i) => 2026 + i).map(ano => (<option key={ano} value={ano}>{ano}</option>))}
                                </select>
                             </div>
                             <div className="flex items-center text-[#1351b4] gap-1 ml-auto">
                                <Calendar className="w-4 h-4" /> <span className="text-xs font-bold">Visualizando Histórico</span>
                             </div>
                         </div>
                    </div>
                    
                    {/* Lista Gerada */}
                    <div className={`${cores.card} rounded shadow-sm border ${cores.border} overflow-hidden`}>
                       {gerarDiasDoMesSelecionado(mesSelecionado, anoSelecionado, historico).map((dia, idx) => (
                           <ItemDia 
                                key={idx} 
                                dia={dia} 
                                cores={cores} 
                                temaEscuro={temaEscuro} 
                                // Passa a mensagem correta para o dia
                                mensagemSalva={mensagens[dia.dataIso]} 
                                onSalvarMensagem={salvarMensagem}
                           />
                       ))}
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}

// ==========================================================
// 8. COMPONENTES AUXILIARES
// ==========================================================

function ItemDia({ dia, cores, temaEscuro, mensagemSalva, onSalvarMensagem }) {
    const [aberto, setAberto] = useState(false);
    const [modoEdicaoMsg, setModoEdicaoMsg] = useState(false);
    const [textoMsg, setTextoMsg] = useState("");

    // Se já existir mensagem no banco, carrega ela no input
    useEffect(() => { 
        if (mensagemSalva) setTextoMsg(mensagemSalva); 
    }, [mensagemSalva]);

    // Cálculo de Saldo Diário
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

    const badgeTexto = primeiraEntrada ? "* PRESENÇA REGISTRADA" : "* AUSENTE / FOLGA";
    
    const handleSalvar = () => { 
        if (textoMsg.trim()) {
            onSalvarMensagem(dia.dataIso, textoMsg); 
            setModoEdicaoMsg(false);
        } else {
            toast.warning("Escreva algo para salvar.");
        }
    };

    return (
        <div className={`border-b ${cores.border}`}>
            <div 
                onClick={() => setAberto(!aberto)} 
                className={`flex items-center justify-between p-4 cursor-pointer hover:bg-opacity-50 transition ${temaEscuro ? 'hover:bg-gray-800' : 'hover:bg-blue-50'}`}
            >
                <div className="flex flex-col">
                    <span className={`font-bold text-sm ${cores.text}`}>{dia.dataFormatada}</span>
                    <span className="text-[10px] border rounded-full px-2 py-0.5 mt-1 w-fit border-gray-300 text-gray-500 font-medium">{badgeTexto}</span>
                </div>
                <div className="flex items-center gap-3">
                    {mensagemSalva && <MessageCircle fill="#3b82f6" className="text-blue-500 w-5 h-5" />}
                    
                    {primeiraEntrada && (
                        <div className={`flex items-center gap-1 text-xs font-bold text-white px-3 py-1 rounded-full ${saldoPositivo ? 'bg-green-500' : 'bg-red-400'}`}>
                            <Clock size={12} /> Saldo {saldoStr}
                        </div>
                    )}
                    
                    {aberto ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>
            </div>

            {aberto && (
                <div className={`p-6 ${temaEscuro ? 'bg-[#252525]' : 'bg-[#fafafa]'} border-t ${cores.border} animate-fade-in`}>
                    
                    {/* Área de Edição de Mensagem */}
                    {modoEdicaoMsg ? (
                        <div className="max-w-md mx-auto bg-white p-4 rounded shadow border border-gray-200">
                             <div className="text-center mb-4">
                                <div className="text-[#1351b4] font-bold flex items-center justify-center gap-2 mb-2">
                                    <Clock size={16} /> Data Selecionada
                                </div>
                                <p className="text-gray-600 font-bold text-sm">{dia.dataFormatada}</p>
                             </div>
                             
                             <label className="text-xs font-bold text-gray-700 mb-1 block">Justificativa / Observação</label>
                             <textarea 
                                className="w-full border p-2 rounded text-sm text-gray-700 bg-gray-50 mb-4 h-24 resize-none focus:outline-blue-500 focus:bg-white transition" 
                                placeholder="Ex: Esqueci de registrar a volta do almoço..." 
                                value={textoMsg} 
                                onChange={(e) => setTextoMsg(e.target.value)} 
                             />
                             
                             <div className="flex justify-between gap-2">
                                <button onClick={() => setModoEdicaoMsg(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded text-xs font-bold hover:bg-gray-100 flex items-center justify-center gap-1">
                                    <X size={14}/> Cancelar
                                </button>
                                <button onClick={handleSalvar} className="flex-1 bg-[#1351b4] text-white py-2 rounded text-xs font-bold hover:bg-blue-800 flex items-center justify-center gap-1">
                                    <Send size={14}/> Salvar Justificativa
                                </button>
                             </div>
                        </div>
                    ) : (
                        <>
                            {mensagemSalva && (
                                <div className="max-w-md mx-auto mb-4 bg-blue-50 border border-blue-200 p-3 rounded flex items-start gap-3 cursor-pointer hover:bg-blue-100 transition" onClick={() => setModoEdicaoMsg(true)}>
                                    <MessageCircle className="text-blue-500 w-5 h-5 mt-1" />
                                    <div>
                                        <p className="text-xs text-blue-700 font-bold mb-1">Mensagem Registrada:</p>
                                        <p className="text-sm text-blue-900 italic">"{mensagemSalva}"</p>
                                        <p className="text-[10px] text-blue-400 mt-1 underline">Clique para editar</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-center mb-6">
                                <button onClick={() => setModoEdicaoMsg(true)} className="text-[#1351b4] text-sm font-bold flex items-center gap-1 hover:underline transition">
                                    {mensagemSalva ? "Editar Mensagem" : "Inserir Justificativa"} 
                                    {mensagemSalva ? <Edit3 size={16} /> : <PlusCircle size={16} fill="#1351b4" className="text-white" />}
                                </button>
                            </div>

                            {/* Resumo do Dia */}
                            <div className={`max-w-md mx-auto rounded p-4 mb-4 ${temaEscuro ? 'bg-[#333]' : 'bg-[#ececec]'}`}>
                                <div className="flex justify-between items-center text-lg font-mono font-bold text-gray-500">
                                    <div className="text-center">
                                        <span className="text-xs block font-sans font-normal mb-1">Entrada</span>
                                        <span className={primeiraEntrada ? "text-green-600" : ""}>{primeiraEntrada ? new Date(primeiraEntrada.data).toLocaleTimeString('pt-BR').slice(0,5) : '--:--'}</span>
                                    </div>
                                    <span className="text-gray-300">|</span>
                                    <div className="text-center">
                                        <span className="text-xs block font-sans font-normal mb-1">Saída</span>
                                        <span className={ultimaSaida ? "text-red-600" : ""}>{ultimaSaida ? new Date(ultimaSaida.data).toLocaleTimeString('pt-BR').slice(0,5) : '--:--'}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function BotaoSelecao({ titulo, icone, ativo, habilitado, onClick, temaEscuro, corPadrao, textoEscuro }) {
    const disabledClass = !habilitado ? "opacity-30 cursor-not-allowed bg-gray-300" : "cursor-pointer";
    const baseClass = `group w-full md:w-32 h-24 md:h-28 rounded flex flex-col items-center justify-center shadow-sm transition-all border-2 ${disabledClass}`;
    const activeClass = (ativo && habilitado) ? "border-[#1351b4] ring-2 ring-blue-300 scale-105" : "border-transparent";
    
    let bgClass = "";
    if (!habilitado) {
        bgClass = temaEscuro ? "bg-gray-800 text-gray-500" : "bg-gray-200 text-gray-400";
    } else {
        if (temaEscuro) {
            bgClass = "bg-[#2c2c2c] text-white hover:bg-[#383838]";
            if (ativo) bgClass = "bg-[#383838] text-white";
        } else {
            bgClass = `${corPadrao} hover:opacity-90`;
            bgClass += textoEscuro ? " text-gray-700" : " text-white";
        }
    }

    return (
        <div onClick={habilitado ? onClick : undefined} className={`${baseClass} ${activeClass} ${bgClass}`}>
            <div className={`${temaEscuro ? 'bg-white/10' : 'bg-white/30'} p-2 rounded-full mb-2 transition-transform group-hover:scale-110`}>
                {!habilitado ? <Lock className="w-6 h-6" /> : icone}
            </div>
            <span className="font-bold text-xs uppercase text-center leading-tight">{titulo}</span>
        </div>
    );
}

// Helper para gerar o array de dias do mês
function gerarDiasDoMesSelecionado(mes, ano, historico) {
    const dias = [];
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    for (let i = 1; i <= ultimoDia; i++) {
        const d = new Date(ano, mes, i);
        const dataStr = d.toLocaleDateString('pt-BR');
        const dataIso = d.toISOString().split('T')[0];
        // Filtra pontos daquele dia específico
        const pontosDoDia = historico.filter(h => new Date(h.data).toLocaleDateString('pt-BR') === dataStr);
        
        const diaNum = String(i).padStart(2, '0');
        const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'long' });
        
        dias.push({ 
            dataIso, 
            dataFormatada: `Dia ${diaNum} - ${diaSemana}`, 
            diaSemana: diaSemana, 
            pontos: pontosDoDia 
        });
    }
    // Retorna reverso (Dia 1 primeiro ou último? Aqui está normal: 1..30)
    // Se quiser o dia 30 primeiro, use .reverse() no final.
    return dias; 
}