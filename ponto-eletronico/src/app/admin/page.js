"use client";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, FileText, Search, Bell, LogOut, 
  Calendar, Clock, CheckCircle, UserX, Eye, 
  UserPlus, MessageCircle, ChevronDown, ChevronUp, Lock, Unlock, X, Download, AlertCircle
} from "lucide-react";

export default function AdminPage() {
  // --- ESTADOS DE NAVEGAÇÃO ---
  const [view, setView] = useState("dashboard"); // 'dashboard', 'relatorios'
  
  // --- DADOS ---
  const [usuarios, setUsuarios] = useState([]);
  const [pontosGerais, setPontosGerais] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- BUSCA E SELEÇÃO ---
  const [termoBusca, setTermoBusca] = useState("");
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  // --- MODAL NOVO USUÁRIO ---
  const [modalNovoUsuario, setModalNovoUsuario] = useState(false);
  const [novoUser, setNovoUser] = useState({ nome: "", cpf: "", cargo: "" });

  // --- FILTROS FICHA INDIVIDUAL (ESPELHO) ---
  const [mesFicha, setMesFicha] = useState(new Date().getMonth());
  const [anoFicha, setAnoFicha] = useState(2026);

  // --- FILTROS RELATÓRIO GERAL ---
  const [mesRelatorio, setMesRelatorio] = useState(new Date().getMonth());
  const [anoRelatorio, setAnoRelatorio] = useState(2026);
  const [dadosRelatorio, setDadosRelatorio] = useState([]);

  // --- MENSAGENS MOCKADAS (Simulação) ---
  const [mensagensMock, setMensagensMock] = useState({
      "2026-01-05": "Esqueci de bater o ponto na volta do almoço, desculpe.",
      "2026-01-10": "Atestado médico anexado."
  });

  // --- 1. CARREGAMENTO INICIAL DOS DADOS ---
  useEffect(() => {
    async function carregarDados() {
      try {
        // Busca Usuários da API (incluindo os novos criados)
        const resUsers = await fetch('/api/usuarios');
        const dataUsers = await resUsers.json();
        
        // Busca Pontos de TODOS os usuários
        let todosPontos = [];
        // Nota: Em produção, o ideal seria uma rota /api/pontos/todos
        // Aqui fazemos um loop para simular
        for (let user of dataUsers) {
            try {
              const resPonto = await fetch(`/api/ponto?userId=${user.id}`);
              const dataPonto = await resPonto.json();
              todosPontos = [...todosPontos, ...dataPonto];
            } catch(e) { 
                console.log(`Sem pontos para user ${user.id}`); 
            }
        }

        setUsuarios(dataUsers);
        setPontosGerais(todosPontos);
        setLoading(false);
      } catch (error) {
          console.error("Erro ao carregar dados:", error);
          setLoading(false);
      }
    }
    carregarDados();
  }, []);

  // --- 2. GERAÇÃO DO RELATÓRIO MENSAL ---
  useEffect(() => {
    if (pontosGerais.length > 0 && usuarios.length > 0) {
        gerarRelatorioMensal();
    }
  }, [mesRelatorio, anoRelatorio, pontosGerais, usuarios, view]);

  function gerarRelatorioMensal() {
      const relatorio = usuarios.map(user => {
          // Filtra pontos do mês/ano selecionado para este usuário
          const pontosDoMes = pontosGerais.filter(p => {
              const d = new Date(p.data);
              return p.usuarioId === user.id && d.getMonth() === mesRelatorio && d.getFullYear() === anoRelatorio;
          });

          // Pega o último dia do mês (28, 30 ou 31)
          const ultimoDia = new Date(anoRelatorio, mesRelatorio + 1, 0).getDate();
          
          let diasContados = 0;
          let diasFaltosos = [];
          let minutosTrabalhados = 0;
          const hoje = new Date(); 

          // Loop de 1 até o fim do mês (SEGUNDA A SEGUNDA)
          for (let i = 1; i <= ultimoDia; i++) {
              const dataAtual = new Date(anoRelatorio, mesRelatorio, i);
              const dataStr = dataAtual.toLocaleDateString('pt-BR');
              
              diasContados++;

              // Verifica se teve ponto neste dia
              const tevePonto = pontosDoMes.some(p => new Date(p.data).toLocaleDateString('pt-BR') === dataStr);
              
              // Verifica Falta: Se não teve ponto e o dia já passou
              const dataAtualSemHora = new Date(dataAtual.toDateString());
              const hojeSemHora = new Date(hoje.toDateString());

              if (!tevePonto && dataAtualSemHora < hojeSemHora) { 
                  diasFaltosos.push(`${i}/${mesRelatorio + 1}`);
              }

              // Calcula horas trabalhadas do dia
              const pontosDia = pontosDoMes.filter(p => new Date(p.data).toLocaleDateString('pt-BR') === dataStr);
              const entrada = pontosDia.find(p => p.tipo === 'Entrada');
              
              if (entrada) {
                  const ultimaSaida = pontosDia.filter(p => p.tipo === 'Saída').pop();
                  if (ultimaSaida) {
                      const diff = new Date(ultimaSaida.data) - new Date(entrada.data);
                      minutosTrabalhados += Math.floor(diff / 60000);
                  }
              }
          }

          // Saldo: Meta é 8h por dia (480 min) * Dias do Mês
          const metaMinutos = diasContados * 480; 
          const saldoMinutos = minutosTrabalhados - metaMinutos;

          // Formatação HH:MM
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

  // --- 3. HELPER: STATUS DO USUÁRIO (ONLINE/OFFLINE) ---
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

  // --- 4. AÇÃO: CRIAR NOVO USUÁRIO (VIA API) ---
  async function handleNovoUsuario() {
      if(!novoUser.nome || !novoUser.cpf) return alert("Preencha todos os dados");
      
      try {
        const res = await fetch("/api/usuarios", {
            method: "POST",
            body: JSON.stringify(novoUser)
        });
        const data = await res.json();

        if (data.success) {
            setUsuarios([...usuarios, data.usuario]);
            setModalNovoUsuario(false);
            setNovoUser({ nome: "", cpf: "", cargo: "" });
            alert("Colaborador cadastrado! Senha temporária: 'pinguim'");
        } else {
            alert(data.message);
        }
      } catch (error) {
          alert("Erro ao conectar com servidor.");
      }
  }

  // --- 5. AÇÃO: ALTERAR STATUS (ATIVO/INATIVO) ---
  function toggleStatusUsuario(user) {
      const novoStatus = user.status === 'ativo' ? 'inativo' : 'ativo';
      if (confirm(`Deseja alterar o status de ${user.nome} para ${novoStatus.toUpperCase()}?`)) {
          // Atualiza localmente (Num sistema real, faria um PUT na API)
          const atualizados = usuarios.map(u => u.id === user.id ? {...u, status: novoStatus} : u);
          setUsuarios(atualizados);
          
          // Se estiver com ele aberto, atualiza o estado selecionado
          if (usuarioSelecionado && usuarioSelecionado.id === user.id) {
              setUsuarioSelecionado({...user, status: novoStatus});
          }
      }
  }

  // --- 6. LÓGICA DE FILTRO (BUSCA) ---
  const usuariosFiltrados = usuarios.filter(u => 
    u.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    u.cpf.includes(termoBusca)
  );

  // --- RENDERIZAÇÃO DA TELA ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex text-gray-800">
      
      {/* SIDEBAR FIXA */}
      <aside className="w-64 bg-[#071d41] text-white flex flex-col fixed h-full z-10">
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
                onClick={() => window.location.href = '/'} // Logout simples
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white w-full p-2 rounded hover:bg-white/10 transition"
            >
                <LogOut size={16} /> Sair do Admin
            </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="ml-64 flex-1 p-8">
        
        {/* HEADER SUPERIOR */}
        <header className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-2xl font-bold text-[#071d41]">
                    {usuarioSelecionado ? `Gestão: ${usuarioSelecionado.nome}` : view === 'relatorios' ? 'Relatórios Mensais' : 'Painel de Controle'}
                </h2>
                <p className="text-gray-500 text-sm">Bem-vindo ao sistema de gestão Pinguim Manoa.</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-full shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <Bell size={20} className="text-gray-500" />
                </div>
                <div className="flex items-center gap-3 pl-4 border-l">
                    <div className="text-right">
                        <p className="text-sm font-bold text-[#071d41]">Admin Master</p>
                        <p className="text-xs text-gray-500">RH</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-[#1351b4] font-bold">AD</div>
                </div>
            </div>
        </header>

        {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400 font-bold animate-pulse">Carregando dados...</div>
        ) : (
            <>
                {/* ================================================= */}
                {/* VISÃO 1: DASHBOARD (LISTA DE FUNCIONÁRIOS) */}
                {/* ================================================= */}
                {view === 'dashboard' && !usuarioSelecionado && (
                    <div className="space-y-6 animate-fade-in">
                        {/* CARDS KPI */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <CardResumo 
                                titulo="Total Ativos" 
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
                                titulo="Inativos/Desligados" 
                                valor={usuarios.filter(u => u.status === 'inativo').length} 
                                icon={<UserX className="text-red-500" />} 
                                cor="border-l-4 border-red-500" 
                            />
                        </div>

                        {/* TABELA DE COLABORADORES */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-[#071d41]">Colaboradores</h3>
                                <div className="flex gap-2">
                                    {/* BARRA DE PESQUISA */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Buscar nome ou CPF..." 
                                            className="pl-9 pr-4 py-2 border rounded-full text-sm focus:outline-blue-500 w-64 bg-gray-50" 
                                            value={termoBusca}
                                            onChange={(e) => setTermoBusca(e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        onClick={() => setModalNovoUsuario(true)} 
                                        className="bg-[#1351b4] hover:bg-blue-800 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition"
                                    >
                                        <UserPlus size={16} /> Adicionar
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
                                                <td colSpan="5" className="p-8 text-center text-gray-400 italic">Nenhum colaborador encontrado.</td>
                                            </tr>
                                        )}
                                        {usuariosFiltrados.map(user => {
                                            const statusHoje = getStatusUsuario(user.id);
                                            return (
                                                <tr key={user.id} className={`hover:bg-blue-50 transition ${user.status === 'inativo' ? 'opacity-60 bg-gray-50' : ''}`}>
                                                    <td className="p-4">
                                                        <div className="font-bold text-[#071d41]">{user.nome}</div>
                                                        <div className="text-xs text-gray-400">{user.cpf}</div>
                                                    </td>
                                                    <td className="p-4 text-gray-600">{user.cargo}</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {user.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center"><BadgeStatus status={statusHoje} /></td>
                                                    <td className="p-4 text-center">
                                                        <button 
                                                            onClick={() => setUsuarioSelecionado(user)} 
                                                            className="text-[#1351b4] font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
                                                        >
                                                            <Eye size={16} /> Ver Ficha
                                                        </button>
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

                {/* ================================================= */}
                {/* VISÃO 2: RELATÓRIOS (GERAL) */}
                {/* ================================================= */}
                {view === 'relatorios' && !usuarioSelecionado && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-[#071d41] flex items-center gap-2">
                                    <FileText size={20}/> Relatório Geral de Ponto
                                </h3>
                                <div className="flex gap-2">
                                     <select value={mesRelatorio} onChange={e => setMesRelatorio(Number(e.target.value))} className="border p-2 rounded text-sm bg-gray-50">
                                         {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m,i) => <option key={i} value={i}>{m}</option>)}
                                     </select>
                                     <select value={anoRelatorio} onChange={e => setAnoRelatorio(Number(e.target.value))} className="border p-2 rounded text-sm bg-gray-50">
                                         {Array.from({length: 15}, (_,i) => 2026 + i).map(a => <option key={a} value={a}>{a}</option>)}
                                     </select>
                                     <button className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-green-700">
                                         <Download size={16}/> Exportar PDF
                                     </button>
                                </div>
                            </div>

                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="p-3 border">Colaborador</th>
                                        <th className="p-3 border text-center">Horas Feitas</th>
                                        <th className="p-3 border text-center">Saldo</th>
                                        <th className="p-3 border text-center">Dias c/ Falta</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dadosRelatorio.map(rel => (
                                        <tr key={rel.id} className="hover:bg-gray-50">
                                            <td className="p-3 border font-bold text-[#071d41]">
                                                {rel.nome}<br/>
                                                <span className="text-[10px] text-gray-400 font-normal">{rel.cpf}</span>
                                            </td>
                                            <td className="p-3 border text-center font-mono text-gray-700">{rel.totalHoras}</td>
                                            <td className="p-3 border text-center font-bold">
                                                <span className={rel.saldoMinutos >= 0 ? "text-green-600" : "text-red-600"}>
                                                    {formatarSaldo(rel.saldoMinutos)}
                                                </span>
                                            </td>
                                            <td className="p-3 border text-center">
                                                {rel.faltas.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1 justify-center">
                                                        {rel.faltas.map((f, i) => (
                                                            <span key={i} className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                                                {f}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : <span className="text-green-500 font-bold text-xs">Presente</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className="text-xs text-gray-400 mt-4">* Calculado considerando operação contínua (Segunda a Segunda, 8h/dia).</p>
                        </div>
                    </div>
                )}

                {/* ================================================= */}
                {/* VISÃO 3: FICHA DO COLABORADOR (DETALHES) */}
                {/* ================================================= */}
                {usuarioSelecionado && (
                    <div className="animate-fade-in space-y-6">
                        <div className="flex items-center justify-between">
                            <button onClick={() => setUsuarioSelecionado(null)} className="text-sm text-gray-500 hover:text-[#1351b4] flex items-center gap-1">← Voltar para Lista</button>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => toggleStatusUsuario(usuarioSelecionado)}
                                    className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition ${usuarioSelecionado.status === 'ativo' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                >
                                    {usuarioSelecionado.status === 'ativo' ? <><Lock size={16}/> Desativar Acesso</> : <><Unlock size={16}/> Reativar Acesso</>}
                                </button>
                            </div>
                        </div>

                        {/* INFO HEADER USUÁRIO */}
                        <div className="bg-white p-6 rounded shadow-sm border border-gray-200 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-[#071d41]">{usuarioSelecionado.nome}</h2>
                                <p className="text-gray-500 text-sm">{usuarioSelecionado.cargo} | CPF: {usuarioSelecionado.cpf}</p>
                            </div>
                            <div className="text-right">
                                <div className="flex gap-2 mb-2 justify-end">
                                     <select value={mesFicha} onChange={e => setMesFicha(Number(e.target.value))} className="border p-1 rounded text-xs">
                                         {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m,i) => <option key={i} value={i}>{m}</option>)}
                                     </select>
                                     <select value={anoFicha} onChange={e => setAnoFicha(Number(e.target.value))} className="border p-1 rounded text-xs">
                                         {Array.from({length: 15}, (_,i) => 2026 + i).map(a => <option key={a} value={a}>{a}</option>)}
                                     </select>
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Espelho de Ponto</p>
                            </div>
                        </div>

                        {/* ACORDEÃO DE HISTÓRICO */}
                        <div className="bg-white rounded shadow-sm border border-gray-200">
                             <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <span className="font-bold text-[#071d41]">Histórico Detalhado</span>
                                <Calendar className="text-gray-400" size={18}/>
                             </div>
                             
                             <div className="divide-y divide-gray-100">
                                {gerarDiasDoMesSelecionado(mesFicha, anoFicha, pontosGerais.filter(p => p.usuarioId === usuarioSelecionado.id)).map((dia, idx) => (
                                    <ItemDiaAdmin 
                                        key={idx} 
                                        dia={dia} 
                                        mensagem={mensagensMock[dia.dataIso]} 
                                    />
                                ))}
                             </div>
                        </div>
                    </div>
                )}
            </>
        )}

      </main>

      {/* MODAL NOVO USUÁRIO */}
      {modalNovoUsuario && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl w-96 animate-scale-in">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-[#071d41]">Novo Colaborador</h3>
                      <button onClick={() => setModalNovoUsuario(false)}><X className="text-gray-400 hover:text-red-500"/></button>
                  </div>
                  <div className="space-y-3">
                      <div><label className="text-xs font-bold text-gray-500">Nome Completo</label><input className="w-full border p-2 rounded" value={novoUser.nome} onChange={e => setNovoUser({...novoUser, nome: e.target.value})} /></div>
                      <div><label className="text-xs font-bold text-gray-500">CPF</label><input className="w-full border p-2 rounded" value={novoUser.cpf} onChange={e => setNovoUser({...novoUser, cpf: e.target.value})} /></div>
                      <div><label className="text-xs font-bold text-gray-500">Cargo</label><input className="w-full border p-2 rounded" value={novoUser.cargo} onChange={e => setNovoUser({...novoUser, cargo: e.target.value})} /></div>
                      
                      <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 flex items-start gap-2 mt-2">
                        <AlertCircle size={14} className="mt-0.5"/>
                        <p>O usuário será criado com a senha temporária <strong>pinguim</strong> e deverá trocá-la no primeiro acesso.</p>
                      </div>

                      <button onClick={handleNovoUsuario} className="w-full bg-[#1351b4] text-white font-bold py-3 rounded mt-2 hover:bg-blue-800">CADASTRAR</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}

// === COMPONENTES AUXILIARES ===

function ItemDiaAdmin({ dia, mensagem }) {
    const [aberto, setAberto] = useState(false);
    
    // Cálculo do Saldo Diário
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

    return (
        <div>
            <div 
                onClick={() => setAberto(!aberto)} 
                className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 ${aberto ? 'bg-blue-50/50' : ''}`}
            >
                <div className="flex flex-col">
                    <span className="font-bold text-sm text-[#071d41]">{dia.dataFormatada}</span>
                    <span className="text-xs text-gray-400">{dia.diaSemana}</span>
                </div>
                <div className="flex items-center gap-4">
                    {mensagem && <div className="flex items-center gap-1 text-xs text-blue-600 font-bold bg-blue-100 px-2 py-1 rounded"><MessageCircle size={14} /> MSG</div>}
                    <div className="text-right text-xs font-mono text-gray-600 hidden md:block">{primeiraEntrada ? new Date(primeiraEntrada.data).toLocaleTimeString('pt-BR').slice(0,5) : '--:--'} - {ultimaSaida ? new Date(ultimaSaida.data).toLocaleTimeString('pt-BR').slice(0,5) : ' --:--'}</div>
                    {primeiraEntrada && <div className={`w-20 text-center text-xs font-bold text-white px-2 py-1 rounded-full ${saldoPositivo ? 'bg-green-500' : 'bg-red-400'}`}>{saldoStr}</div>}
                    {aberto ? <ChevronUp size={18} className="text-gray-300" /> : <ChevronDown size={18} className="text-gray-300" />}
                </div>
            </div>
            {aberto && (
                <div className="bg-gray-50 p-4 border-t border-gray-100 pl-8">
                    {mensagem && <div className="mb-3 bg-white border border-blue-200 p-3 rounded-lg shadow-sm"><p className="text-xs font-bold text-blue-800 flex items-center gap-2 mb-1"><MessageCircle size={14}/> Justificativa:</p><p className="text-sm text-gray-700 italic">"{mensagem}"</p></div>}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Registros do Dia</p>
                            {dia.pontos.length > 0 ? dia.pontos.map((p, i) => (<div key={i} className="flex justify-between text-sm border-b border-gray-200 py-1"><span className={p.tipo === 'Entrada' ? 'text-green-600 font-bold' : p.tipo === 'Saída' ? 'text-red-600 font-bold' : 'text-blue-600'}>{p.tipo}</span><span className="font-mono text-gray-600">{new Date(p.data).toLocaleTimeString('pt-BR')}</span></div>)) : <p className="text-sm text-gray-400 italic">Sem registros.</p>}
                        </div>
                        <div className="text-center border-l border-gray-200 flex flex-col justify-center"><p className="text-xs font-bold text-gray-400 uppercase">Saldo Total</p><p className={`text-2xl font-bold ${saldoPositivo ? 'text-green-600' : 'text-red-600'}`}>{saldoStr}</p></div>
                    </div>
                </div>
            )}
        </div>
    )
}

function BotaoMenu({ icon, text, active, onClick }) {
    return <div onClick={onClick} className={`flex items-center gap-3 p-3 rounded cursor-pointer transition ${active ? 'bg-[#1351b4] text-white font-bold shadow-md' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>{icon}<span className="text-sm">{text}</span></div>
}

function CardResumo({ titulo, valor, icon, cor }) {
    return <div className={`bg-white p-6 rounded shadow-sm border border-gray-200 flex items-center justify-between ${cor}`}><div><p className="text-gray-500 text-xs font-bold uppercase mb-1">{titulo}</p><p className="text-3xl font-bold text-[#071d41]">{valor}</p></div><div className="bg-gray-50 p-3 rounded-full">{icon}</div></div>
}

function BadgeStatus({ status }) {
    if (status === 'online') return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> ONLINE</span>
    if (status === 'pausa') return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700"><div className="w-2 h-2 bg-orange-500 rounded-full"></div> PAUSA</span>
    return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500"><div className="w-2 h-2 bg-gray-400 rounded-full"></div> OFF</span>
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
        dias.push({ dataIso, dataFormatada: dataStr, diaSemana: d.toLocaleDateString('pt-BR', {weekday: 'long'}), pontos: pontosDoDia });
    }
    return dias.reverse();
}