"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, LogIn, LogOut, Menu, Home, ChevronRight, CheckSquare,
  FileText, Moon, Sun, Coffee, ArrowLeftCircle, Calendar,
  ChevronDown, ChevronUp, PlusCircle, Eye, EyeOff, MessageCircle, Send, X, Edit3, Lock, Save, Mail, CheckCircle,
  User, Trash2, Plus, Search, Shield, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter();

  // ==========================================================
  // ✅ PERMISSÕES / ROTAS (SUPER ADMIN x ADMIN)
  // ==========================================================
  // (Opcional) fallback por e-mail caso você ainda não tenha "role" no banco
  const SUPER_ADMIN_EMAIL = "henriquepaiva128@gail.com"; // <-- TROQUE AQUI

  const isSuperAdmin = (u) =>
    u?.role === "SUPER_ADMIN" || u?.tipo === "super_admin" || u?.email === SUPER_ADMIN_EMAIL;

  const isAdmin = (u) =>
    u?.role === "ADMIN" || u?.tipo === "admin";

  // ==========================================================
  // 1. ESTADOS DE AUTENTICAÇÃO E USUÁRIO
  // ==========================================================
  const [user, setUser] = useState(null);
  const [verificandoSessao, setVerificandoSessao] = useState(true); // Loading inicial

  // Login
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembreDeMim, setLembreDeMim] = useState(false); // Checkbox estado

  // Multi-contas (localStorage) + melhorias
  const [contasSalvas, setContasSalvas] = useState([]);
  const [modoSelecaoConta, setModoSelecaoConta] = useState(false);
  const [termoBuscaConta, setTermoBuscaConta] = useState("");
  const [contaParaRemover, setContaParaRemover] = useState(null);
  const [erroLogin, setErroLogin] = useState("");
  const [contaSelecionadaInfo, setContaSelecionadaInfo] = useState(null);

  // Ref para foco no input de senha
  const senhaInputRef = useRef(null);

  // Primeiro Acesso (Troca de Senha)
  const [modalNovaSenha, setModalNovaSenha] = useState(false);
  const [novaSenhaInput, setNovaSenhaInput] = useState("");
  const [confirmarSenhaInput, setConfirmarSenhaInput] = useState("");
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);

  // Recuperação de Senha
  const [viewRecuperar, setViewRecuperar] = useState(false);
  const [passoRecuperar, setPassoRecuperar] = useState(1); // 1: Email, 2: Código
  const [emailRecuperar, setEmailRecuperar] = useState("");
  const [codigoRecuperar, setCodigoRecuperar] = useState("");
  const [novaSenhaRecuperar, setNovaSenhaRecuperar] = useState("");
  const [mostrarSenhaRec, setMostrarSenhaRec] = useState(false);

  // ==========================================================
  // 2. ESTADOS DO SISTEMA (PONTO E INTERFACE)
  // ==========================================================
  const [view, setView] = useState("registro"); // 'registro' ou 'ficha'
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [historico, setHistorico] = useState([]);

  // Armazena os registros do "Turno Atual" (das 03:00 às 03:00)
  const [registrosTurno, setRegistrosTurno] = useState([]);

  const [status, setStatus] = useState(null); // Feedback visual de loading

  // Filtros da Ficha
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

  // Mensagens / Justificativas
  const [mensagens, setMensagens] = useState({});
  const [meusConsumos, setMeusConsumos] = useState([]); // Adicionado para evitar erro

  // Controles de Ponto
  const [tipoSelecionado, setTipoSelecionado] = useState(null);
  const [temaEscuro, setTemaEscuro] = useState(false);
  const [tempoTrabalhado, setTempoTrabalhado] = useState("00:00:00");
  const [ultimoRegistroHoje, setUltimoRegistroHoje] = useState(null);

  // MENU MOBILE
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  const cores = temaEscuro ? {
    bg: "bg-[#121212]", header: "bg-[#000000]", card: "bg-[#1e1e1e]", text: "text-gray-100", textSec: "text-gray-400", border: "border-gray-700", subHeader: "bg-[#333]", input: "bg-[#2c2c2c] text-white border-gray-600", sideActive: "bg-[#333] text-blue-400 border-l-blue-400"
  } : {
    bg: "bg-[#f5f5f5]", header: "bg-[#071d41]", card: "bg-white", text: "text-gray-800", textSec: "text-gray-500", border: "border-gray-200", subHeader: "bg-[#1351b4]", input: "bg-white text-black border-gray-300", sideActive: "bg-blue-50 text-[#1351b4] border-l-[#1351b4]"
  };

  // ==========================================================
  // 2.1 FUNÇÕES AUXILIARES (TEMA + CONTAS)
  // ==========================================================
  const toggleTema = () => {
    const novoTema = !temaEscuro;
    setTemaEscuro(novoTema);
    localStorage.setItem("point_theme", novoTema ? "dark" : "light");
  };

  function getIniciais(nome) {
    if (!nome) return "US";
    const partes = String(nome).trim().split(" ").filter(Boolean);
    if (partes.length === 0) return "US";
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  function normalizarConta(c) {
    return {
      nome: c?.nome || "Usuário",
      email: c?.email || "",
      tipo: c?.tipo || "user",
      role: c?.role || "FUNCIONARIO",
      empresaId: c?.empresaId,
      lastUsed: c?.lastUsed || 0,
    };
  }

  function salvarContaNoDispositivo(userObj, listaAtual) {
    const nova = {
      nome: userObj.nome,
      email: userObj.email,
      tipo: userObj.tipo || "user",
      role: userObj.role || "FUNCIONARIO",
      empresaId: userObj.empresaId,
      lastUsed: Date.now(),
    };
    const base = (listaAtual || []).map(normalizarConta).filter(c => c.email && c.email !== nova.email);
    base.unshift(nova);
    base.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
    localStorage.setItem("point_users", JSON.stringify(base));
    setContasSalvas(base);
    return base;
  }

  function atualizarUltimoUso(emailUser, listaAtual = contasSalvas) {
    const novaLista = (listaAtual || []).map(normalizarConta).map(c =>
      c.email === emailUser ? { ...c, lastUsed: Date.now() } : c
    );
    novaLista.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
    setContasSalvas(novaLista);
    localStorage.setItem("point_users", JSON.stringify(novaLista));
  }

  // ==========================================================
  // 2.2 FUNÇÃO DE CARREGAMENTO DE DADOS (DENTRO DO COMPONENTE)
  // ==========================================================
  async function carregarDadosUsuario(userId, empresaId) {
    try {
      // 1. Busca mensagens (Mural) - AGORA COM FILTRO DE EMPRESA
      const urlMsg = empresaId ? `/api/mensagens?empresaId=${empresaId}` : null;

      let dataMsg = [];
      if (urlMsg) {
        const resMsg = await fetch(urlMsg);
        dataMsg = await resMsg.json();
      }

      const msgObj = {};
      if (Array.isArray(dataMsg)) {
        dataMsg.forEach(m => {
          msgObj[m.dataIso] = m.texto;
        });
      }
      setMensagens(msgObj);

      // 2. Busca histórico de pontos (Continua igual, apenas pelo userId)
      const resPonto = await fetch(`/api/ponto?userId=${userId}`);
      const dataPonto = await resPonto.json();
      setHistorico(Array.isArray(dataPonto) ? dataPonto : []);

      // 3. Busca consumos (Cantina) - AGORA COM FILTRO DE EMPRESA
      if (empresaId) {
        const resConsumo = await fetch(`/api/consumos?userId=${userId}&empresaId=${empresaId}`);
        const dataConsumo = await resConsumo.json();
        setMeusConsumos(Array.isArray(dataConsumo) ? dataConsumo : []);
      }

    } catch (error) {
      console.error("Erro ao buscar dados do usuário", error);
      toast.error("Erro ao sincronizar dados.");
    }
  }

  // ==========================================================
  // 3. EFEITO: CARREGA TEMA, CONTAS SALVAS E VERIFICA SESSÃO
  // ==========================================================
  useEffect(() => {
    // Tema salvo
    const temaSalvo = localStorage.getItem("point_theme");
    if (temaSalvo === "dark") setTemaEscuro(true);

    // Contas salvas
    let salvos = [];
    try {
      salvos = JSON.parse(localStorage.getItem("point_users") || "[]").map(normalizarConta);
    } catch (e) {
      salvos = [];
    }
    salvos.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
    setContasSalvas(salvos);

    async function checarSessao() {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();

        if (data.success && data.user) {
          // Sempre atualiza a lista do PC
          const listaAtualizada = salvarContaNoDispositivo(data.user, salvos);

          // Salva sessão atual
          localStorage.setItem("point_user", JSON.stringify(data.user));

          // ✅ Redirecionamento correto por permissão
          if (isSuperAdmin(data.user)) {
            atualizarUltimoUso(data.user.email, listaAtualizada);
            router.push("/super-admin");
            return;
          }

          if (isAdmin(data.user)) {
            atualizarUltimoUso(data.user.email, listaAtualizada);
            router.push("/admin");
            return;
          }

          setUser(data.user);
          // Carrega dados usando a função definida acima
          carregarDadosUsuario(data.user.id, data.user.empresaId);

          atualizarUltimoUso(data.user.email, listaAtualizada);
          toast.success(`Bem-vindo de volta, ${data.user.nome.split(" ")[0]}!`);
        } else {
          if (salvos.length > 0) setModoSelecaoConta(true);
        }
      } catch (e) {
        if (salvos.length > 0) setModoSelecaoConta(true);
      } finally {
        setVerificandoSessao(false);
      }
    }

    checarSessao();
  }, []);

  // ==========================================================
  // 4. EFEITO: TURNO INTELIGENTE + CRONÔMETRO
  // ==========================================================
  useEffect(() => {
    const atualizarInterface = () => {
      const agora = new Date();
      setHoraAtual(agora);

      // === LÓGICA DE TURNO INTELIGENTE (RESET ÀS 03:00 DA MANHÃ) ===
      const inicioJanela = new Date(agora);

      if (agora.getHours() < 3) {
        inicioJanela.setDate(inicioJanela.getDate() - 1);
      }

      inicioJanela.setHours(3, 0, 0, 0);

      const fimJanela = new Date(inicioJanela);
      fimJanela.setDate(fimJanela.getDate() + 1);

      const registrosDoTurno = historico.filter(h => {
        const d = new Date(h.data);
        return d >= inicioJanela && d < fimJanela;
      }).sort((a, b) => new Date(a.data) - new Date(b.data));

      setRegistrosTurno(registrosDoTurno);

      if (registrosDoTurno.length > 0) {
        setUltimoRegistroHoje(registrosDoTurno[registrosDoTurno.length - 1].tipo);
      } else {
        setUltimoRegistroHoje(null);
      }

      const primeiraEntrada = registrosDoTurno.find(h => h.tipo === 'Entrada');
      const ultimaSaida = registrosDoTurno.find(h => h.tipo === 'Saída');

      let msTrabalhados = 0;
      if (primeiraEntrada) {
        const horaEntrada = new Date(primeiraEntrada.data);
        if (ultimaSaida) {
          let dtSaidaReal = new Date(ultimaSaida.data);
          if (dtSaidaReal < horaEntrada) dtSaidaReal.setDate(dtSaidaReal.getDate() + 1);
          msTrabalhados = dtSaidaReal - horaEntrada;
        } else {
          let agoraReal = new Date(agora);
          if (agoraReal < horaEntrada) agoraReal.setDate(agoraReal.getDate() + 1);
          msTrabalhados = agoraReal - horaEntrada;
        }

        const totalSeg = Math.floor(msTrabalhados / 1000);
        const h = Math.floor(totalSeg / 3600);
        const m = Math.floor((totalSeg % 3600) / 60);
        const s = totalSeg % 60;
        setTempoTrabalhado(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      } else {
        setTempoTrabalhado("00:00:00");
      }
    };

    atualizarInterface();
    const timer = setInterval(atualizarInterface, 1000);
    return () => clearInterval(timer);
  }, [historico]);

  // ==========================================================
  // 5. FUNÇÕES AUXILIARES MULTI-CONTAS
  // ==========================================================
  function selecionarContaSalva(conta) {
    setEmail(conta.email);
    setContaSelecionadaInfo(conta);
    setModoSelecaoConta(false);
    setViewRecuperar(false);
    setPassoRecuperar(1);
    setErroLogin("");
    setSenha("");
    setMostrarSenha(false);

    setTimeout(() => {
      if (senhaInputRef.current) senhaInputRef.current.focus();
    }, 50);
  }

  function removerContaSalva(e, conta) {
    e.stopPropagation();
    setContaParaRemover(conta);
  }

  function limparTodasContasSalvas() {
    const ok = window.confirm("Deseja remover TODAS as contas salvas deste navegador?");
    if (!ok) return;

    localStorage.removeItem("point_users");
    setContasSalvas([]);
    setModoSelecaoConta(false);
    setEmail("");
    setSenha("");
    setContaSelecionadaInfo(null);
    toast.success("Lista de contas removida deste navegador.");
  }

  // ==========================================================
  // 6. FUNÇÕES DE AUTENTICAÇÃO (API)
  // ==========================================================
  async function handleLogin() {
    setErroLogin("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha, lembreDeMim }),
      });
      const data = await res.json();

      if (data.success) {
        // 1. Salva conta no PC e Atualiza 'point_user'
        const novaLista = salvarContaNoDispositivo(data.user, contasSalvas);
        localStorage.setItem("point_user", JSON.stringify(data.user));

        // ✅ Redirecionamento correto por permissão
        if (isSuperAdmin(data.user)) {
          atualizarUltimoUso(data.user.email, novaLista);
          router.push("/super-admin");
          return;
        }

        if (isAdmin(data.user)) {
          atualizarUltimoUso(data.user.email, novaLista);
          router.push("/admin");
          return;
        }

        // 3. Verifica Primeiro Acesso
        if (data.user.primeiroAcesso) {
          setUser(data.user);
          setModalNovaSenha(true);
          return;
        }

        // 4. Login Funcionário: Carrega dados passando a Empresa
        setUser(data.user);
        carregarDadosUsuario(data.user.id, data.user.empresaId);

        atualizarUltimoUso(data.user.email, novaLista);
      } else {
        setErroLogin(data.message || "E-mail ou senha inválidos.");
        setSenha("");
        if (senhaInputRef.current) senhaInputRef.current.focus();
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro de conexão com o servidor.");
    }
  }

  function handleLogout() {
    document.cookie = "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    localStorage.removeItem("point_user");

    setUser(null);
    setSenha("");
    setMostrarSenha(false);
    setErroLogin("");
    setContaSelecionadaInfo(null);

    if (contasSalvas.length > 0) {
      setModoSelecaoConta(true);
    } else {
      setModoSelecaoConta(false);
      setEmail("");
    }
  }

  async function handleTrocarSenha() {
    if (novaSenhaInput.length < 3) return toast.warning("A senha deve ter pelo menos 3 caracteres.");
    if (novaSenhaInput !== confirmarSenhaInput) return toast.error("As senhas não coincidem.");

    try {
      const res = await fetch("/api/auth/nova-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: user.id, novaSenha: novaSenhaInput })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Senha definida com sucesso! Faça login.");
        setModalNovaSenha(false);
        setUser(null);
        setSenha("");
        setMostrarNovaSenha(false);
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error("Erro ao trocar senha.");
    }
  }

  async function enviarCodigoRecuperacao() {
    if (!emailRecuperar) return toast.warning("Digite seu e-mail cadastrado.");
    try {
      const res = await fetch("/api/auth/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailRecuperar })
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Código enviado! Verifique seu e-mail.");
        setPassoRecuperar(2);
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error("Erro no servidor.");
    }
  }

  async function redefinirSenhaRecuperacao() {
    if (!codigoRecuperar || !novaSenhaRecuperar) return toast.warning("Preencha o código e a nova senha.");

    try {
      const res = await fetch("/api/auth/nova-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailRecuperar,
          codigo: codigoRecuperar,
          novaSenha: novaSenhaRecuperar
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Senha redefinida com sucesso! Faça login.");
        setViewRecuperar(false);
        setPassoRecuperar(1);
        setSenha("");
        setCodigoRecuperar("");
        setNovaSenhaRecuperar("");
        setEmail("");
        setContaSelecionadaInfo(null);
        setModoSelecaoConta(contasSalvas.length > 0);
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao tentar salvar a senha.");
    }
  }

  // ==========================================================
  // 7. FUNÇÕES DE DADOS (PONTO E MENSAGENS)
  // ==========================================================
  async function confirmarRegistro() {
    if (!tipoSelecionado) return;

    if (!("geolocation" in navigator)) {
      return toast.error("Seu dispositivo não suporta Geolocalização.");
    }

    setStatus({ tipo: "loading", texto: "Obtendo localização..." });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setStatus({ tipo: "loading", texto: "Registrando..." });
        try {
          const res = await fetch("/api/ponto", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              usuarioId: user.id,
              nome: user.nome,
              tipo: tipoSelecionado,
              latitude: latitude,
              longitude: longitude
            }),
          });
          const data = await res.json();

          if (data.success) {
            toast.success(`${tipoSelecionado} registrado com sucesso!`);
            // Recarrega dados
            carregarDadosUsuario(user.id, user.empresaId);
            setTipoSelecionado(null);
          } else {
            toast.error(data.message);
          }
        } catch (e) {
          toast.error("Erro de conexão.");
        }
        setTimeout(() => setStatus(null), 1000);
      },
      (error) => {
        console.error("Erro GPS:", error);
        setStatus(null);
        if (error.code === 1) toast.warning("Permita a localização no navegador para registrar o ponto.");
        else if (error.code === 2) toast.error("Sinal de GPS indisponível.");
        else toast.error("Tempo limite do GPS esgotado. Tente novamente.");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  async function salvarMensagem(dataIso, texto) {
    try {
      const res = await fetch('/api/mensagens', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: user.id, dataIso, texto })
      });
      const data = await res.json();

      if (data.success) {
        setMensagens(prev => ({ ...prev, [dataIso]: texto }));
        toast.success("Justificativa salva com sucesso!");
      } else {
        toast.error("Erro ao salvar.");
      }
    } catch (e) {
      toast.error("Erro de conexão.");
    }
  }

  function verificarPermissao(tipoBotao) {
    if (ultimoRegistroHoje === 'Saída') return false;
    if (tipoBotao === 'Entrada') return ultimoRegistroHoje === null;
    if (tipoBotao === 'Ida Intervalo') return ultimoRegistroHoje === 'Entrada' || ultimoRegistroHoje === 'Volta Intervalo';
    if (tipoBotao === 'Volta Intervalo') return ultimoRegistroHoje === 'Ida Intervalo';
    if (tipoBotao === 'Saída') return ultimoRegistroHoje === 'Entrada' || ultimoRegistroHoje === 'Volta Intervalo';
    return false;
  }

  // ==========================================================
  // 8. RENDERIZAÇÃO: TELAS DE LOGIN
  // ==========================================================
  if (verificandoSessao) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${cores.bg}`}>
        <Clock className="animate-spin text-[#1351b4] w-12 h-12 mb-4" />
        <p className="text-gray-500 text-sm font-semibold">Verificando acesso...</p>
      </div>
    );
  }

  if (!user || modalNovaSenha) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-sans ${cores.bg} p-4`}>

        {/* MODAL DE CONFIRMAÇÃO DE REMOÇÃO (NOVO) */}
        {contaParaRemover && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
              <div className="flex items-center gap-3 mb-4 text-red-600 font-bold text-lg">
                <AlertTriangle /> Remover Conta?
              </div>
              <p className="text-gray-600 mb-6 text-sm">
                Deseja esquecer a conta <b>{contaParaRemover.nome}</b> deste dispositivo?
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setContaParaRemover(null)} className="px-4 py-2 border rounded text-sm font-bold">
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const novaLista = contasSalvas.filter(c => c.email !== contaParaRemover.email);
                    setContasSalvas(novaLista);
                    localStorage.setItem("point_users", JSON.stringify(novaLista));
                    setContaParaRemover(null);

                    if (contaSelecionadaInfo?.email === contaParaRemover.email) {
                      setContaSelecionadaInfo(null);
                      setEmail("");
                      setSenha("");
                    }
                    if (novaLista.length === 0) {
                      setModoSelecaoConta(false);
                      setEmail("");
                      setContaSelecionadaInfo(null);
                    } else {
                      setModoSelecaoConta(true);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-bold"
                >
                  Sim, Remover
                </button>
              </div>
            </div>
          </div>
        )}

        {modalNovaSenha && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md animate-scale-in">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock size={32} className="text-[#1351b4]" />
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
                  <button onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)} className="absolute right-3 top-3.5 text-gray-400 hover:text-blue-600">
                    {mostrarNovaSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="Confirmar Senha"
                  className="w-full border p-3 rounded text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={confirmarSenhaInput}
                  onChange={e => setConfirmarSenhaInput(e.target.value)}
                />

                <button onClick={handleTrocarSenha} className="w-full bg-[#1351b4] text-white font-bold py-4 rounded hover:bg-blue-800 flex items-center justify-center gap-2 mt-2 transition shadow-lg">
                  <Save size={20} /> SALVAR NOVA SENHA
                </button>
              </div>
            </div>
          </div>
        )}

        {!modalNovaSenha && (
          <div className={`${cores.card} p-8 rounded shadow-md w-full max-w-md border-t-4 border-[#1351b4] relative`}>

            {/* Toggle tema no Login (SALVO) */}
            <button
              onClick={toggleTema}
              className={`absolute top-4 right-4 p-2 rounded-full transition ${temaEscuro ? "bg-white/10 hover:bg-white/20 text-gray-100" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
              title={temaEscuro ? "Tema claro" : "Tema escuro"}
            >
              {temaEscuro ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* ESTADO 1: LISTA DE CONTAS */}
            {modoSelecaoConta && !viewRecuperar ? (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold text-[#1351b4] mb-4 flex items-center gap-2">
                  <span className="font-black text-3xl">Point</span>
                </h1>
                <p className={`${temaEscuro ? "text-gray-400" : "text-gray-500"} text-sm mb-4 font-semibold`}>
                  Escolha uma conta
                </p>

                {/* Busca rápida */}
                {contasSalvas.length > 3 && (
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar conta..."
                      className={`w-full pl-9 p-2 border rounded text-sm outline-none focus:border-blue-500 ${temaEscuro ? "bg-[#2c2c2c] text-white border-gray-700" : "bg-gray-50"}`}
                      value={termoBuscaConta}
                      onChange={(e) => setTermoBuscaConta(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-1">
                  {contasSalvas
                    .filter(c => {
                      const t = termoBuscaConta.toLowerCase();
                      if (!t) return true;
                      return (c.nome || "").toLowerCase().includes(t) || (c.email || "").toLowerCase().includes(t);
                    })
                    .map((conta, idx) => (
                      <div
                        key={idx}
                        onClick={() => selecionarContaSalva(conta)}
                        className={`flex items-center justify-between p-3 border rounded cursor-pointer transition group shadow-sm hover:shadow-md hover:border-blue-300 relative ${
                          temaEscuro ? "bg-[#1f1f1f] border-gray-700 hover:bg-[#2a2a2a]" : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            conta.role === "ADMIN" || conta.tipo === "admin" ? "bg-[#071d41] text-white" : temaEscuro ? "bg-white/10 text-gray-100" : "bg-blue-100 text-blue-700"
                          }`}>
                            {getIniciais(conta.nome)}
                          </div>

                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <p className={`font-bold leading-tight text-sm ${temaEscuro ? "text-gray-100" : "text-gray-800"}`}>
                                {conta.nome}
                              </p>
                              {(conta.role === "ADMIN" || conta.tipo === "admin") && (
                                <span className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded border border-yellow-200 font-bold">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <p className={`text-xs ${temaEscuro ? "text-gray-400" : "text-gray-500"}`}>{conta.email}</p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => removerContaSalva(e, conta)}
                          className={`p-2 rounded-full transition ${
                            temaEscuro ? "text-gray-500 hover:text-red-300 hover:bg-red-500/10" : "text-gray-300 hover:text-red-500 hover:bg-red-50"
                          }`}
                          title="Remover desta lista"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                </div>

                <div
                  onClick={() => {
                    setModoSelecaoConta(false);
                    setEmail("");
                    setSenha("");
                    setContaSelecionadaInfo(null);
                    setErroLogin("");
                  }}
                  className={`flex items-center gap-3 p-3 cursor-pointer rounded transition font-medium border border-dashed ${
                    temaEscuro
                      ? "text-gray-300 hover:text-blue-300 hover:bg-blue-500/10 border-gray-700"
                      : "text-gray-600 hover:text-[#1351b4] hover:bg-blue-50 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  <div className={`${temaEscuro ? "bg-white/10" : "bg-gray-100"} p-1.5 rounded-full`}>
                    <Plus size={18} />
                  </div>
                  <span className="text-sm">Usar outra conta</span>
                </div>

                {contasSalvas.length > 0 && (
                  <button
                    onClick={limparTodasContasSalvas}
                    className={`mt-4 w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded transition border ${
                      temaEscuro
                        ? "border-gray-700 text-gray-300 hover:bg-red-500/10 hover:text-red-300"
                        : "border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600"
                    }`}
                  >
                    <Trash2 size={18} />
                    Limpar todas as contas
                  </button>
                )}
              </div>
            ) : (
              /* ESTADO 2: LOGIN COM SENHA */
              !viewRecuperar ? (
                <div className="animate-fade-in">
                  {contasSalvas.length > 0 && (
                    <button
                      onClick={() => {
                        setModoSelecaoConta(true);
                        setErroLogin("");
                        setContaSelecionadaInfo(null);
                        setSenha("");
                      }}
                      className={`mb-4 text-xs flex items-center gap-1 transition ${
                        temaEscuro ? "text-gray-400 hover:text-blue-300" : "text-gray-500 hover:text-blue-600"
                      }`}
                    >
                      <ArrowLeftCircle size={14} /> Voltar para contas
                    </button>
                  )}

                  <h1 className="text-2xl font-bold text-[#1351b4] mb-2 flex items-center gap-2">
                    <span className="font-black text-3xl">Point</span> Acesso
                  </h1>

                  {/* Card “Entrando como...” */}
                  {(contaSelecionadaInfo || (email && contasSalvas.find(c => c.email === email))) && (
                    <div className={`mb-6 flex items-center gap-3 p-3 rounded-lg border ${
                      temaEscuro ? "bg-blue-500/10 text-blue-200 border-blue-500/20" : "bg-blue-50 text-blue-900 border-blue-100"
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        temaEscuro ? "bg-white/10" : "bg-blue-200 text-blue-800"
                      }`}>
                        {getIniciais(contaSelecionadaInfo?.nome || contasSalvas.find(c => c.email === email)?.nome)}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${temaEscuro ? "text-blue-200" : "text-blue-500"}`}>Entrando como:</p>
                        <p className="text-sm font-bold leading-tight">
                          {contaSelecionadaInfo?.nome || contasSalvas.find(c => c.email === email)?.nome}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Se escolheu conta salva, esconde input de email */}
                  {!contaSelecionadaInfo && (
                    <input
                      className={`w-full p-3 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-[#1351b4] ${cores.input}`}
                      type="email"
                      placeholder="Seu E-mail"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  )}

                  <div className="relative mb-2">
                    <input
                      ref={senhaInputRef}
                      className={`w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#1351b4] ${cores.input} pr-10 ${erroLogin ? "border-red-500 focus:ring-red-200" : ""}`}
                      type={mostrarSenha ? "text" : "password"}
                      placeholder="Senha"
                      value={senha}
                      onChange={e => { setSenha(e.target.value); setErroLogin(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      autoFocus={!!email}
                    />
                    <button onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-3 text-gray-400 hover:text-[#1351b4] transition">
                      {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {erroLogin && (
                    <div className="flex items-center gap-2 text-red-600 text-xs mb-4">
                      <AlertTriangle size={14} /> {erroLogin}
                    </div>
                  )}

                  <div className={`flex items-center gap-1.5 text-[10px] mb-4 p-2 rounded border ${
                    temaEscuro ? "text-gray-300 bg-white/5 border-gray-700" : "text-gray-400 bg-gray-50 border-gray-200"
                  }`}>
                    <Shield size={12} /> A senha não é salva.
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <div
                        onClick={() => setLembreDeMim(!lembreDeMim)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition ${lembreDeMim
                          ? 'bg-[#1351b4] border-[#1351b4]'
                          : temaEscuro
                            ? 'bg-transparent border-gray-600 group-hover:border-blue-400'
                            : 'bg-white border-gray-300 group-hover:border-[#1351b4]'
                        }`}
                      >
                        {lembreDeMim && <CheckCircle size={14} className="text-white" />}
                      </div>
                      <span className={`text-sm font-medium ${temaEscuro ? "text-gray-300" : "text-gray-600"}`}>
                        Lembrar de mim
                      </span>
                    </label>

                    <button
                      onClick={() => setViewRecuperar(true)}
                      className={`text-xs hover:underline transition ${temaEscuro ? "text-gray-400 hover:text-blue-300" : "text-gray-500 hover:text-[#1351b4]"}`}
                    >
                      Esqueci a senha
                    </button>
                  </div>

                  <button
                    onClick={handleLogin}
                    className="w-full bg-[#1351b4] text-white font-bold py-3 rounded-full hover:bg-[#0c3b85] transition shadow-md flex items-center justify-center gap-2"
                  >
                    ENTRAR <ChevronRight size={16} />
                  </button>
                </div>
              ) : (
                /* TELA 3: RECUPERAÇÃO */
                <>
                  <h1 className={`text-xl font-bold mb-2 flex items-center gap-2 ${temaEscuro ? "text-gray-100" : "text-[#071d41]"}`}>
                    <Lock size={20} /> Recuperar Senha
                  </h1>
                  <p className={`${temaEscuro ? "text-gray-400" : "text-gray-500"} text-xs mb-6`}>
                    Siga os passos para redefinir sua senha.
                  </p>

                  {passoRecuperar === 1 ? (
                    <>
                      <label className={`text-xs font-bold mb-1 block ${temaEscuro ? "text-gray-300" : "text-gray-600"}`}>
                        Informe seu E-mail cadastrado
                      </label>
                      <div className="relative mb-4">
                        <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                          className={`w-full pl-10 p-3 border rounded outline-none focus:border-blue-500 ${temaEscuro ? "bg-[#2c2c2c] text-white border-gray-700" : "bg-white text-black border-gray-300"}`}
                          placeholder="ex: henrique@email.com"
                          value={emailRecuperar}
                          onChange={e => setEmailRecuperar(e.target.value)}
                        />
                      </div>
                      <button onClick={enviarCodigoRecuperacao} className="w-full bg-[#1351b4] text-white font-bold py-3 rounded hover:bg-[#0c3b85] transition shadow-md">
                        Enviar Código
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={`p-3 rounded mb-4 text-xs border flex items-start gap-2 ${
                        temaEscuro ? "bg-blue-500/10 text-blue-200 border-blue-500/20" : "bg-blue-50 text-blue-800 border-blue-100"
                      }`}>
                        <Mail size={16} className="mt-0.5" />
                        <span>Código enviado para <b>{emailRecuperar}</b></span>
                      </div>

                      <input
                        className={`w-full p-3 mb-3 border rounded outline-none ${temaEscuro ? "bg-[#2c2c2c] text-white border-gray-700" : "bg-white text-black border-gray-300"}`}
                        placeholder="Código (Ex: 1234)"
                        value={codigoRecuperar}
                        onChange={e => setCodigoRecuperar(e.target.value)}
                      />

                      <div className="relative mb-4">
                        <input
                          className={`w-full p-3 border rounded outline-none pr-10 ${temaEscuro ? "bg-[#2c2c2c] text-white border-gray-700" : "bg-white text-black border-gray-300"}`}
                          type={mostrarSenhaRec ? "text" : "password"}
                          placeholder="Nova Senha"
                          value={novaSenhaRecuperar}
                          onChange={e => setNovaSenhaRecuperar(e.target.value)}
                        />
                        <button onClick={() => setMostrarSenhaRec(!mostrarSenhaRec)} className={`absolute right-3 top-3 transition ${temaEscuro ? "text-gray-400 hover:text-green-300" : "text-gray-400 hover:text-green-600"}`}>
                          {mostrarSenhaRec ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>

                      <button onClick={redefinirSenhaRecuperacao} className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 transition shadow-md">
                        Redefinir Senha
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => { setViewRecuperar(false); setPassoRecuperar(1); }}
                    className={`w-full mt-4 text-sm border-t pt-4 transition ${temaEscuro ? "text-gray-400 hover:text-gray-200 border-gray-700" : "text-gray-400 hover:text-gray-600 border-gray-200"}`}
                  >
                    Cancelar e Voltar
                  </button>
                </>
              )
            )}
          </div>
        )}
      </div>
    );
  }

  // ==========================================================
  // 9. RENDERIZAÇÃO: DASHBOARD DO COLABORADOR
  // ==========================================================
  return (
    <div className={`min-h-screen font-sans ${cores.bg} ${cores.text} transition-colors duration-300`}>
      {/* HEADER */}
      <header className={`${cores.header} text-white h-16 flex items-center px-4 md:px-8 justify-between shadow-md relative z-20`}>
        <div className="flex items-center gap-4">
          <span className="font-black text-3xl tracking-tight flex items-end">Point</span>
          <div className="h-6 w-px bg-white/30 hidden md:block"></div>
          <span className="text-sm font-light hidden md:block">Bem-vindo, {user.nome.split(' ')[0]}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleLogout} className="text-xs border border-white/50 px-3 py-1 rounded hover:bg-white/10 transition">
            SAIR
          </button>

          <div onClick={toggleTema} className="flex items-center gap-1 text-xs cursor-pointer select-none hover:opacity-80">
            <div className={`${temaEscuro ? 'bg-yellow-400 text-black' : 'bg-white text-[#071d41]'} rounded-full p-1 transition-all`}>
              {temaEscuro ? <Sun size={14} /> : <Moon size={14} />}
            </div>
            {temaEscuro ? "Claro" : "Escuro"}
          </div>
        </div>
      </header>

      {/* SUB-HEADER */}
      <div className={`${cores.subHeader} h-12 flex items-center px-4 md:px-8 text-white shadow-inner transition-colors relative z-10`}>
        <Menu
          className="w-5 h-5 mr-3 cursor-pointer hover:opacity-80 md:cursor-default"
          onClick={() => setMenuMobileAberto(!menuMobileAberto)}
        />
        <h2 className="font-semibold text-sm md:text-base">{view === 'registro' ? 'Registro de Ponto' : 'Ficha de Frequência'}</h2>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-6 relative">
        <>
          {menuMobileAberto && (
            <div
              className="fixed inset-0 bg-black/50 z-30 md:hidden animate-fade-in"
              onClick={() => setMenuMobileAberto(false)}
            ></div>
          )}

          <aside className={`
              fixed inset-y-0 left-0 z-40 w-64 ${cores.card} shadow-2xl border-r ${cores.border} transform transition-transform duration-300 ease-in-out
              ${menuMobileAberto ? "translate-x-0" : "-translate-x-full"}
              md:relative md:translate-x-0 md:shadow-sm md:border md:h-fit md:block
          `}>
            <div className={`p-4 border-b ${cores.border} font-bold text-[#1351b4] flex items-center justify-between`}>
              <span className="flex items-center gap-2"><Menu className="w-4 h-4" /> MENU</span>
              <button onClick={() => setMenuMobileAberto(false)} className="md:hidden text-gray-500"><X size={20} /></button>
            </div>
            <nav>
              <div
                onClick={() => { setView('registro'); setMenuMobileAberto(false); }}
                className={`p-3 px-4 flex items-center gap-3 text-sm cursor-pointer border-b ${cores.border} ${view === 'registro' ? cores.sideActive + " border-l-4 font-bold" : "hover:opacity-70 " + cores.textSec}`}
              >
                <CheckSquare size={16} /> Registro de Ponto
              </div>
              <div
                onClick={() => { setView('ficha'); setMenuMobileAberto(false); }}
                className={`p-3 px-4 flex items-center gap-3 text-sm cursor-pointer border-b ${cores.border} ${view === 'ficha' ? cores.sideActive + " border-l-4 font-bold" : "hover:opacity-70 " + cores.textSec}`}
              >
                <FileText size={16} /> Ficha de Frequência
              </div>
            </nav>
          </aside>
        </>

        <div className="flex-1 w-full">
          <div className={`flex items-center text-xs ${cores.textSec} mb-4`}>
            <Home className="w-3 h-3 mr-1" /><span>Início</span><ChevronRight className="w-3 h-3 mx-1" />
            <span className={temaEscuro ? 'text-gray-300' : 'text-gray-700'}>
              {view === 'registro' ? 'Registro de Ponto' : 'Ficha de Frequência'}
            </span>
          </div>

          {view === 'registro' && (
            <div className="space-y-6">
              <div className={`${cores.card} rounded shadow-sm border ${cores.border} p-8 flex flex-col items-center justify-center min-h-[400px]`}>
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-2 text-[#1351b4] font-bold mb-1"><Clock className="w-5 h-5" /> Hora atual</div>
                  <div className={`text-6xl font-bold tracking-tight ${temaEscuro ? 'text-white' : 'text-gray-700'}`}>{horaAtual.toLocaleTimeString('pt-BR')}</div>
                  <div className={`${cores.textSec} mt-2 text-sm capitalize`}>{horaAtual.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
                </div>

                <div className={`${temaEscuro ? 'bg-[#333] border-gray-600' : 'bg-[#f2f2f2] border-gray-200'} w-full max-w-md p-4 rounded mb-10 flex items-center justify-center gap-4 border`}>
                  <div className={`h-10 w-6 border-2 ${temaEscuro ? 'border-gray-500' : 'border-gray-400'} rounded-sm`}></div>
                  <div className="text-center">
                    <p className="text-[#1351b4] text-sm font-semibold">Horas Trabalhadas (Turno)</p>
                    <p className={`text-xl font-bold ${temaEscuro ? 'text-white' : 'text-gray-700'} font-mono`}>{tempoTrabalhado}</p>
                  </div>
                </div>

                <div className="text-center w-full max-w-2xl">
                  <p className="text-[#1351b4] font-bold mb-4">Selecione o tipo de registro</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-center mb-8">
                    <BotaoSelecao titulo="Entrada" icone={<LogIn className="w-6 h-6" />} ativo={tipoSelecionado === 'Entrada'} habilitado={verificarPermissao('Entrada')} onClick={() => verificarPermissao('Entrada') && setTipoSelecionado('Entrada')} temaEscuro={temaEscuro} corPadrao="bg-[#f2ca4b]" />
                    <BotaoSelecao titulo="Ida Intervalo" icone={<Coffee className="w-6 h-6" />} ativo={tipoSelecionado === 'Ida Intervalo'} habilitado={verificarPermissao('Ida Intervalo')} onClick={() => verificarPermissao('Ida Intervalo') && setTipoSelecionado('Ida Intervalo')} temaEscuro={temaEscuro} corPadrao="bg-blue-400" />
                    <BotaoSelecao titulo="Volta Intervalo" icone={<ArrowLeftCircle className="w-6 h-6" />} ativo={tipoSelecionado === 'Volta Intervalo'} habilitado={verificarPermissao('Volta Intervalo')} onClick={() => verificarPermissao('Volta Intervalo') && setTipoSelecionado('Volta Intervalo')} temaEscuro={temaEscuro} corPadrao="bg-blue-500" />
                    <BotaoSelecao titulo="Saída" icone={<LogOut className="w-6 h-6" />} ativo={tipoSelecionado === 'Saída'} habilitado={verificarPermissao('Saída')} onClick={() => verificarPermissao('Saída') && setTipoSelecionado('Saída')} temaEscuro={temaEscuro} corPadrao="bg-[#e6e6e6]" textoEscuro={!temaEscuro} />
                  </div>

                  <button
                    onClick={confirmarRegistro}
                    disabled={!tipoSelecionado || status}
                    className={`font-bold py-3 px-12 rounded-full shadow-lg transition text-sm w-full md:w-auto 
                      ${(!tipoSelecionado || status) ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-[#1351b4] hover:bg-[#0c3b85] text-white'}`}
                  >
                    {status ? "PROCESSANDO..." : (tipoSelecionado ? `CONFIRMAR ${tipoSelecionado.toUpperCase()}` : 'SELECIONE UMA OPÇÃO')}
                  </button>
                </div>
              </div>

              <div className={`${cores.card} p-6 rounded shadow-sm border ${cores.border}`}>
                <h3 className="text-[#1351b4] font-bold border-b pb-2 mb-4 flex items-center gap-2"><Clock size={16} /> Registros do Turno (03h às 03h)</h3>
                <ul className="space-y-2">
                  {registrosTurno.map((h, i) => (
                    <li key={i} className={`flex justify-between text-sm p-3 hover:opacity-80 border-b ${cores.border} last:border-0`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${h.tipo === 'Entrada' ? 'bg-yellow-500' : h.tipo === 'Saída' ? 'bg-gray-500' : 'bg-blue-400'}`}></span>
                        <span className={`font-semibold ${cores.text}`}>{h.tipo}</span>
                      </div>
                      <span className={`${cores.textSec} font-mono`}>{new Date(h.data).toLocaleTimeString('pt-BR')}</span>
                    </li>
                  ))}
                  {registrosTurno.length === 0 &&
                    <li className={`${cores.textSec} italic text-sm p-2`}>Nenhum registro neste turno.</li>
                  }
                </ul>
              </div>
            </div>
          )}

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
                      {Array.from({ length: 15 }, (_, i) => 2026 + i).map(ano => (<option key={ano} value={ano}>{ano}</option>))}
                    </select>
                  </div>
                  <div className="flex items-center text-[#1351b4] gap-1 ml-auto">
                    <Calendar className="w-4 h-4" /> <span className="text-xs font-bold">Visualizando Histórico</span>
                  </div>
                </div>
              </div>

              <div className={`${cores.card} rounded shadow-sm border ${cores.border} overflow-hidden`}>
                {gerarDiasDoMesSelecionado(mesSelecionado, anoSelecionado, historico).map((dia, idx) => (
                  <ItemDia
                    key={idx}
                    dia={dia}
                    cores={cores}
                    temaEscuro={temaEscuro}
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
// 10. COMPONENTES AUXILIARES
// ==========================================================
function ItemDia({ dia, cores, temaEscuro, mensagemSalva, onSalvarMensagem }) {
  const [aberto, setAberto] = useState(false);
  const [modoEdicaoMsg, setModoEdicaoMsg] = useState(false);
  const [textoMsg, setTextoMsg] = useState("");

  useEffect(() => {
    if (mensagemSalva) setTextoMsg(mensagemSalva);
  }, [mensagemSalva]);

  let saldoStr = "00:00";
  let saldoPositivo = true;
  const primeiraEntrada = dia.pontos.find(p => p.tipo === 'Entrada');
  const ultimaSaida = dia.pontos.filter(p => p.tipo === 'Saída').pop();

  if (primeiraEntrada && ultimaSaida) {
    let dtEntrada = new Date(primeiraEntrada.data);
    let dtSaida = new Date(ultimaSaida.data);

    if (dtSaida < dtEntrada) dtSaida.setDate(dtSaida.getDate() + 1);

    const diff = dtSaida - dtEntrada;
    const meta = 8 * 60 * 60 * 1000;
    const saldoMs = diff - meta;

    saldoPositivo = saldoMs >= 0;
    const absSaldo = Math.abs(saldoMs);
    const h = Math.floor(absSaldo / 3600000);
    const m = Math.floor((absSaldo % 3600000) / 60000);
    saldoStr = `${saldoPositivo ? '' : '-'}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  else if (primeiraEntrada && !ultimaSaida) {
    saldoStr = "-08:00";
    saldoPositivo = false;
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
                  <X size={14} /> Cancelar
                </button>
                <button onClick={handleSalvar} className="flex-1 bg-[#1351b4] text-white py-2 rounded text-xs font-bold hover:bg-blue-800 flex items-center justify-center gap-1">
                  <Send size={14} /> Salvar Justificativa
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

              <div className={`max-w-md mx-auto rounded p-4 mb-4 ${temaEscuro ? 'bg-[#333]' : 'bg-[#ececec]'}`}>
                <div className="flex justify-between items-center text-lg font-mono font-bold text-gray-500">
                  <div className="text-center">
                    <span className="text-xs block font-sans font-normal mb-1">Entrada</span>
                    <span className={primeiraEntrada ? "text-green-600" : ""}>{primeiraEntrada ? new Date(primeiraEntrada.data).toLocaleTimeString('pt-BR').slice(0, 5) : '--:--'}</span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <div className="text-center">
                    <span className="text-xs block font-sans font-normal mb-1">Saída</span>
                    <span className={ultimaSaida ? "text-red-600" : ""}>{ultimaSaida ? new Date(ultimaSaida.data).toLocaleTimeString('pt-BR').slice(0, 5) : '--:--'}</span>
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

    dias.push({
      dataIso,
      dataFormatada: `Dia ${diaNum} - ${diaSemana}`,
      diaSemana: diaSemana,
      pontos: pontosDoDia
    });
  }
  return dias.reverse();
}
