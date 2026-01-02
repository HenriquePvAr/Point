"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { 
  Clock, LogIn, LogOut, Menu, Home, ChevronRight, CheckSquare, 
  FileText, Moon, Sun, Coffee, ArrowLeftCircle, Calendar, 
  ChevronDown, ChevronUp, PlusCircle, Eye, MessageCircle, Send, X, Edit3, Lock, Save 
} from "lucide-react";

export default function Page() {
  const router = useRouter(); 

  // --- ESTADOS DE USUÁRIO E LOGIN ---
  const [user, setUser] = useState(null);
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  
  // --- ESTADOS DE TROCA DE SENHA (PRIMEIRO ACESSO) ---
  const [modalNovaSenha, setModalNovaSenha] = useState(false);
  const [novaSenhaInput, setNovaSenhaInput] = useState("");
  const [confirmarSenhaInput, setConfirmarSenhaInput] = useState("");

  // --- NAVEGAÇÃO E DADOS ---
  const [view, setView] = useState("registro"); // 'registro' ou 'ficha'
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [historico, setHistorico] = useState([]);
  const [status, setStatus] = useState(null);
  
  // --- FILTROS FICHA DE FREQUÊNCIA ---
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(2026);
  const [mensagens, setMensagens] = useState({}); // Mensagens locais para teste

  // --- SELEÇÃO E TEMA ---
  const [tipoSelecionado, setTipoSelecionado] = useState(null); 
  const [temaEscuro, setTemaEscuro] = useState(false);
  const [tempoTrabalhado, setTempoTrabalhado] = useState("00:00:00");
  const [ultimoRegistroHoje, setUltimoRegistroHoje] = useState(null);

  // ==========================================================
  // 1. LÓGICA DO CRONÔMETRO E MÁQUINA DE ESTADOS
  // ==========================================================
  useEffect(() => {
    const timer = setInterval(() => {
      const agora = new Date();
      setHoraAtual(agora);
      
      const hojeStr = agora.toLocaleDateString('pt-BR');
      // Filtra e ordena cronologicamente para calcular estados
      const registrosHoje = historico.filter(h => 
        new Date(h.data).toLocaleDateString('pt-BR') === hojeStr
      ).sort((a, b) => new Date(a.data) - new Date(b.data)); 

      // Define último registro para bloquear botões
      if (registrosHoje.length > 0) {
          setUltimoRegistroHoje(registrosHoje[registrosHoje.length - 1].tipo);
      } else {
          setUltimoRegistroHoje(null);
      }

      // Cálculo de Horas Trabalhadas em Tempo Real
      const primeiraEntrada = registrosHoje.find(h => h.tipo === 'Entrada');
      const ultimaSaida = registrosHoje.find(h => h.tipo === 'Saída');

      let msTrabalhados = 0;
      if (primeiraEntrada) {
        const horaEntrada = new Date(primeiraEntrada.data);
        if (ultimaSaida) {
            // Se já saiu, o tempo para de contar
            msTrabalhados = new Date(ultimaSaida.data) - horaEntrada;
        } else {
            // Se ainda está trabalhando, conta até agora
            msTrabalhados = agora - horaEntrada;
        }
        
        // Formatação
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
  // 2. FUNÇÕES DE LOGIN E SENHA
  // ==========================================================
  async function handleLogin() {
    try {
      const res = await fetch("/api/auth", {
        method: "POST", body: JSON.stringify({ cpf, senha }),
      });
      const data = await res.json();

      if (data.success) { 
          // 1. Redireciona ADMIN
          if (data.user.tipo === 'admin') {
              router.push('/admin');
              return;
          }

          // 2. Verifica PRIMEIRO ACESSO (Senha 'pinguim')
          if (data.user.primeiroAcesso) {
              setUser(data.user); 
              setModalNovaSenha(true); 
              return;
          }

          // 3. Login Normal
          const usuarioCompleto = { ...data.user };
          setUser(usuarioCompleto); 
          carregarHistorico(data.user.id); 
      } else { alert(data.message); }
    } catch (e) { alert("Erro de conexão"); }
  }

  async function handleTrocarSenha() {
      if (novaSenhaInput.length < 3) return alert("A senha deve ter pelo menos 3 caracteres.");
      if (novaSenhaInput !== confirmarSenhaInput) return alert("As senhas não coincidem.");

      try {
          const res = await fetch("/api/auth/nova-senha", {
              method: "POST",
              body: JSON.stringify({ usuarioId: user.id, novaSenha: novaSenhaInput })
          });
          const data = await res.json();
          if (data.success) {
              alert("Senha alterada com sucesso! Entre novamente.");
              setModalNovaSenha(false);
              setUser(null); // Logout forçado
              setSenha("");
              setNovaSenhaInput("");
              setConfirmarSenhaInput("");
          } else {
              alert(data.message);
          }
      } catch (e) { alert("Erro ao trocar senha."); }
  }

  // ==========================================================
  // 3. AÇÕES DO SISTEMA (PONTO E MENSAGENS)
  // ==========================================================
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
        setStatus({ tipo: "sucesso", texto: "Registrado com sucesso!" });
        carregarHistorico(user.id);
        setTipoSelecionado(null);
      } else {
        setStatus({ tipo: "erro", texto: data.message });
      }
    } catch (e) { setStatus({ tipo: "erro", texto: "Erro de conexão." }); }
    setTimeout(() => setStatus(null), 3000);
  }

  async function carregarHistorico(id) {
    const res = await fetch(`/api/ponto?userId=${id}`);
    const data = await res.json();
    setHistorico(data);
  }

  function salvarMensagem(dataIso, texto) {
    setMensagens(prev => ({...prev, [dataIso]: texto}));
  }

  // Verifica qual botão deve estar habilitado
  function verificarPermissao(tipoBotao) {
      if (ultimoRegistroHoje === 'Saída') return false; 
      if (tipoBotao === 'Entrada') return ultimoRegistroHoje === null;
      if (tipoBotao === 'Ida Intervalo') return ultimoRegistroHoje === 'Entrada' || ultimoRegistroHoje === 'Volta Intervalo';
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
  // 4. RENDERIZAÇÃO: TELA DE LOGIN & MODAL SENHA
  // ==========================================================
  if (!user || modalNovaSenha) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-sans ${cores.bg}`}>
        
        {/* MODAL DE PRIMEIRO ACESSO */}
        {modalNovaSenha && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md animate-scale-in">
                    <div className="text-center mb-6">
                        <Lock size={48} className="mx-auto text-[#1351b4] mb-4"/>
                        <h2 className="text-2xl font-bold text-[#071d41]">Defina sua Senha</h2>
                        <p className="text-gray-500 mt-2">Este é seu primeiro acesso. Por favor, defina uma nova senha.</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase">Nova Senha</label>
                            <input type="password" className="w-full border p-3 rounded text-lg focus:ring-2 focus:ring-blue-500 outline-none" value={novaSenhaInput} onChange={e => setNovaSenhaInput(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase">Confirmar Senha</label>
                            <input type="password" className="w-full border p-3 rounded text-lg focus:ring-2 focus:ring-blue-500 outline-none" value={confirmarSenhaInput} onChange={e => setConfirmarSenhaInput(e.target.value)} />
                        </div>
                        <button onClick={handleTrocarSenha} className="w-full bg-[#1351b4] text-white font-bold py-4 rounded hover:bg-blue-800 flex items-center justify-center gap-2 mt-2 transition">
                            <Save size={20}/> SALVAR NOVA SENHA
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* LOGIN FORM */}
        {!modalNovaSenha && (
            <div className={`${cores.card} p-8 rounded shadow-md w-full max-w-sm border-t-4 border-[#1351b4]`}>
                <h1 className="text-2xl font-bold text-[#1351b4] mb-6 flex items-center gap-2">
                    <span className="font-black text-3xl">Point</span> Acesso
                </h1>
                <input className={`w-full p-3 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-[#1351b4] ${cores.input}`} placeholder="CPF ou Usuário" value={cpf} onChange={e => setCpf(e.target.value)} />
                <input className={`w-full p-3 mb-6 border rounded focus:outline-none focus:ring-2 focus:ring-[#1351b4] ${cores.input}`} type="password" placeholder="Senha" value={senha} onChange={e => setSenha(e.target.value)} />
                <button onClick={handleLogin} className="w-full bg-[#1351b4] text-white font-bold py-3 rounded-full hover:bg-[#0c3b85] transition">ENTRAR</button>
                <div className="mt-4 text-center text-xs text-gray-500">
                    <p>Padrão: <b>07253084276</b> | <b>123</b></p>
                    <p>Admin: <b>admin</b> | <b>123</b></p>
                </div>
            </div>
        )}
      </div>
    );
  }

  // ==========================================================
  // 5. RENDERIZAÇÃO: DASHBOARD DO COLABORADOR
  // ==========================================================
  return (
    <div className={`min-h-screen font-sans ${cores.bg} ${cores.text} transition-colors duration-300`}>
      {/* HEADER */}
      <header className={`${cores.header} text-white h-16 flex items-center px-4 md:px-8 justify-between shadow-md`}>
        <div className="flex items-center gap-4">
          <span className="font-black text-3xl tracking-tight flex items-end">Point</span>
          <div className="h-6 w-px bg-white/30 hidden md:block"></div>
          <span className="text-sm font-light hidden md:block">Pinguim Manoa</span>
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

      {/* SUB-HEADER */}
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

        {/* ÁREA PRINCIPAL */}
        <div className="flex-1">
            <div className={`flex items-center text-xs ${cores.textSec} mb-4`}>
                <Home className="w-3 h-3 mr-1" /><span>Início</span><ChevronRight className="w-3 h-3 mx-1" /><span className={temaEscuro ? 'text-gray-300' : 'text-gray-700'}>{view === 'registro' ? 'Registro de Ponto' : 'Ficha de Frequência'}</span>
            </div>

            {/* ---> VIEW: REGISTRO DE PONTO <--- */}
            {view === 'registro' && (
                <div className="space-y-6">
                    <div className={`${cores.card} rounded shadow-sm border ${cores.border} p-8 flex flex-col items-center justify-center min-h-[400px]`}>
                        {/* Relógio */}
                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center gap-2 text-[#1351b4] font-bold mb-1"><Clock className="w-5 h-5" /> Hora atual</div>
                            <div className={`text-6xl font-bold tracking-tight ${temaEscuro ? 'text-white' : 'text-gray-700'}`}>{horaAtual.toLocaleTimeString('pt-BR')}</div>
                            <div className={`${cores.textSec} mt-2 text-sm capitalize`}>{horaAtual.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
                        </div>

                        {/* Tempo Trabalhado */}
                        <div className={`${temaEscuro ? 'bg-[#333] border-gray-600' : 'bg-[#f2f2f2] border-gray-200'} w-full max-w-md p-4 rounded mb-10 flex items-center justify-center gap-4 border`}>
                            <div className={`h-10 w-6 border-2 ${temaEscuro ? 'border-gray-500' : 'border-gray-400'} rounded-sm`}></div> 
                            <div className="text-center">
                                <p className="text-[#1351b4] text-sm font-semibold">Horas Trabalhadas</p>
                                <p className={`text-xl font-bold ${temaEscuro ? 'text-white' : 'text-gray-700'} font-mono`}>{tempoTrabalhado}</p>
                            </div>
                        </div>

                        {/* Botões */}
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
                            {status && <div className={`mt-6 p-3 rounded text-sm font-bold ${status.tipo === 'erro' ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>{status.texto}</div>}
                        </div>
                    </div>

                    {/* Registros de Hoje */}
                    <div className={`${cores.card} p-6 rounded shadow-sm border ${cores.border}`}>
                        <h3 className="text-[#1351b4] font-bold border-b pb-2 mb-4">Registros de Hoje</h3>
                        <ul className="space-y-2">
                            {historico.filter(h => new Date(h.data).toLocaleDateString('pt-BR') === new Date().toLocaleDateString('pt-BR'))
                            .map((h, i) => (
                                <li key={i} className={`flex justify-between text-sm p-2 hover:opacity-80 border-b ${cores.border}`}>
                                     <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${h.tipo === 'Entrada' ? 'bg-yellow-500' : h.tipo === 'Saída' ? 'bg-gray-500' : 'bg-blue-400'}`}></span>
                                        <span className={`font-semibold ${cores.text}`}>{h.tipo}</span>
                                     </div>
                                     <span className={cores.textSec}>{new Date(h.data).toLocaleTimeString('pt-BR')}</span>
                                </li>
                            ))}
                            {historico.filter(h => new Date(h.data).toLocaleDateString('pt-BR') === new Date().toLocaleDateString('pt-BR')).length === 0 && 
                                <li className={`${cores.textSec} italic text-sm`}>Nenhum registro hoje.</li>
                            }
                        </ul>
                    </div>
                </div>
            )}

            {/* ---> VIEW: FICHA DE FREQUÊNCIA <--- */}
            {view === 'ficha' && (
                <div className="animate-fade-in">
                    <div className={`${cores.card} rounded shadow-sm border ${cores.border} p-6 mb-6`}>
                         <h3 className={`font-bold text-sm text-[#1351b4] uppercase mb-4 border-b ${cores.border} pb-2`}>Dados do Colaborador</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><p className="text-xs text-gray-500 uppercase font-bold">Nome</p><p className={`text-lg font-bold ${cores.text}`}>{user.nome.toUpperCase()}</p></div>
                            <div><p className="text-xs text-gray-500 uppercase font-bold">CPF</p><p className={`text-sm ${cores.text}`}>{user.cpf}</p></div>
                         </div>
                         <div className="flex flex-wrap items-end gap-4 mt-6 border-t border-gray-100 pt-4">
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
                             <Calendar className="text-[#1351b4] w-5 h-5 mb-2 ml-2" />
                         </div>
                         <div className="bg-[#f2ca4b] text-white text-xs font-bold px-3 py-1 rounded-full w-fit mt-3">Não Homologada</div>
                    </div>
                    <div className={`${cores.card} rounded shadow-sm border ${cores.border} overflow-hidden`}>
                       {gerarDiasDoMesSelecionado(mesSelecionado, anoSelecionado, historico).map((dia, idx) => (
                           <ItemDia key={idx} dia={dia} cores={cores} temaEscuro={temaEscuro} mensagemSalva={mensagens[dia.dataIso]} onSalvarMensagem={salvarMensagem}/>
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
// 6. COMPONENTES AUXILIARES
// ==========================================================

function ItemDia({ dia, cores, temaEscuro, mensagemSalva, onSalvarMensagem }) {
    const [aberto, setAberto] = useState(false);
    const [modoEdicaoMsg, setModoEdicaoMsg] = useState(false);
    const [textoMsg, setTextoMsg] = useState("");

    useEffect(() => { if (mensagemSalva) setTextoMsg(mensagemSalva); }, [mensagemSalva]);

    let saldoStr = "00:00";
    let saldoPositivo = true;
    const primeiraEntrada = dia.pontos.find(p => p.tipo === 'Entrada');
    const ultimaSaida = dia.pontos.filter(p => p.tipo === 'Saída').pop();

    if (primeiraEntrada && ultimaSaida) {
        const diff = new Date(ultimaSaida.data) - new Date(primeiraEntrada.data);
        const meta = 8 * 60 * 60 * 1000;
        const saldoMs = diff - meta;
        saldoPositivo = saldoMs >= 0;
        const absSaldo = Math.abs(saldoMs);
        const h = Math.floor(absSaldo / 3600000);
        const m = Math.floor((absSaldo % 3600000) / 60000);
        saldoStr = `${saldoPositivo ? '' : '-'}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    }

    const badgeTexto = primeiraEntrada ? "* REGISTRADO" : "* AUSENTE";
    const handleSalvar = () => { onSalvarMensagem(dia.dataIso, textoMsg); setModoEdicaoMsg(false); };

    return (
        <div className={`border-b ${cores.border}`}>
            <div onClick={() => setAberto(!aberto)} className={`flex items-center justify-between p-4 cursor-pointer hover:bg-opacity-50 ${temaEscuro ? 'hover:bg-gray-800' : 'hover:bg-blue-50'}`}>
                <div className="flex flex-col"><span className={`font-bold text-sm ${cores.text}`}>{dia.dataFormatada}</span><span className="text-xs border rounded-full px-2 py-0.5 mt-1 w-fit border-gray-300 text-gray-500">{badgeTexto}</span></div>
                <div className="flex items-center gap-3">
                    {mensagemSalva && <MessageCircle fill="#3b82f6" className="text-blue-500 w-5 h-5" />}
                    {primeiraEntrada && (<div className={`flex items-center gap-1 text-xs font-bold text-white px-3 py-1 rounded-full ${saldoPositivo ? 'bg-green-500' : 'bg-red-400'}`}><Clock size={12} /> Saldo {saldoStr}</div>)}
                    {aberto ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>
            </div>
            {aberto && (
                <div className={`p-6 ${temaEscuro ? 'bg-[#252525]' : 'bg-[#fafafa]'} border-t ${cores.border}`}>
                    {modoEdicaoMsg ? (
                        <div className="max-w-md mx-auto bg-white p-4 rounded shadow border border-gray-200">
                             <div className="text-center mb-4"><div className="text-[#1351b4] font-bold flex items-center justify-center gap-2 mb-2"><Clock size={16} /> Data</div><p className="text-gray-600 font-bold">{dia.dataIso.split('-').reverse().join('/')} - {dia.diaSemana}</p></div>
                             <label className="text-xs font-bold text-gray-700 mb-1 block">Informe a sua Mensagem para o Chefe *</label>
                             <textarea className="w-full border p-2 rounded text-sm text-gray-700 bg-gray-50 mb-4 h-24 resize-none focus:outline-blue-500" placeholder="Ex: Boa tarde, não consegui bater ponto pois..." value={textoMsg} onChange={(e) => setTextoMsg(e.target.value)} />
                             <div className="flex justify-between gap-2"><button onClick={() => setModoEdicaoMsg(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded text-xs font-bold hover:bg-gray-100 flex items-center justify-center gap-1"><X size={14}/> Cancelar</button><button onClick={handleSalvar} className="flex-1 bg-[#1351b4] text-white py-2 rounded text-xs font-bold hover:bg-blue-800 flex items-center justify-center gap-1"><Send size={14}/> Enviar</button></div>
                        </div>
                    ) : (
                        <>
                            {mensagemSalva && <div className="max-w-md mx-auto mb-4 bg-blue-50 border border-blue-200 p-3 rounded flex items-start gap-3 cursor-pointer hover:bg-blue-100 transition" onClick={() => setModoEdicaoMsg(true)}><MessageCircle className="text-blue-500 w-5 h-5 mt-1" /><div><p className="text-xs text-blue-700 font-bold mb-1">Mensagem Registrada:</p><p className="text-sm text-blue-900 italic">"{mensagemSalva}"</p><p className="text-[10px] text-blue-400 mt-1 underline">Clique para editar</p></div></div>}
                            <div className="flex justify-center mb-6"><button onClick={() => setModoEdicaoMsg(true)} className="text-[#1351b4] text-sm font-bold flex items-center gap-1 hover:underline">{mensagemSalva ? "Editar Mensagem" : "Inserir Mensagem"} {mensagemSalva ? <Edit3 size={16} /> : <PlusCircle size={16} fill="#1351b4" className="text-white" />}</button></div>
                            <div className={`max-w-md mx-auto rounded p-4 mb-4 ${temaEscuro ? 'bg-[#333]' : 'bg-[#ececec]'}`}><div className="flex justify-between items-center text-lg font-mono font-bold text-gray-500"><span>{primeiraEntrada ? new Date(primeiraEntrada.data).toLocaleTimeString('pt-BR').slice(0,5) : '--:--'}</span><span className="text-gray-300">|</span><span>{ultimaSaida ? new Date(ultimaSaida.data).toLocaleTimeString('pt-BR').slice(0,5) : '--:--'}</span></div><div className="border-t border-gray-300 mt-2 pt-2 text-center"><button className="text-[#1351b4] text-xs font-bold flex items-center justify-center gap-1">Detalhar Registro <Eye size={14} /></button></div></div>
                            <div className={`max-w-md mx-auto rounded p-4 mb-4 text-center ${temaEscuro ? 'bg-[#333]' : 'bg-[#ececec]'}`}><p className="text-[#1351b4] font-bold text-sm mb-1">Saldo do Dia</p><p className={`text-xl font-bold ${saldoPositivo ? 'text-green-600' : 'text-red-600'}`}>{saldoStr}</p></div>
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
    let bgClass = !habilitado ? (temaEscuro ? "bg-gray-800 text-gray-500" : "bg-gray-200 text-gray-400") : temaEscuro ? (ativo ? "bg-[#383838] text-white" : "bg-[#2c2c2c] text-white hover:bg-[#383838]") : (ativo ? `${corPadrao} text-white` : `${corPadrao} hover:opacity-90` + (textoEscuro ? " text-gray-700" : " text-white"));
    return <div onClick={habilitado ? onClick : undefined} className={`${baseClass} ${activeClass} ${bgClass}`}><div className={`${temaEscuro ? 'bg-white/10' : 'bg-white/30'} p-2 rounded-full mb-2`}>{!habilitado ? <Lock className="w-6 h-6" /> : icone}</div><span className="font-bold text-xs uppercase text-center leading-tight">{titulo}</span></div>
}

function gerarDiasDoMesSelecionado(mes, ano, historico) {
    const dias = [];
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    for (let i = 1; i <= ultimoDia; i++) {
        const d = new Date(ano, mes, i);
        const dataStr = d.toLocaleDateString('pt-BR');
        const dataIso = d.toISOString().split('T')[0];
        const pontosDoDia = historico.filter(h => new Date(h.data).toLocaleDateString('pt-BR') === dataStr);
        const diaNum = String(i).padStart(2, '0');
        const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'long' });
        dias.push({ dataIso, dataFormatada: `Dia ${diaNum} - ${diaSemana}`, diaSemana: diaSemana, pontos: pontosDoDia });
    }
    return dias; 
}