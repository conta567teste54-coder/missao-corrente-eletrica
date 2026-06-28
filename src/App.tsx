import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameCanvas } from './components/GameCanvas';
import { ChallengeModal } from './components/ChallengeModal';
import { BossActionGame } from './components/BossActionGame';
import { NPC, Question, LeaderboardEntry } from './types';
import { playGameSound, setSoundEnabled, isSoundEnabled } from './utils/audio';
import { 
  Zap, 
  Compass, 
  HelpCircle, 
  Award, 
  Play, 
  Volume2, 
  VolumeX, 
  Share2, 
  RefreshCw, 
  BookOpen, 
  ShieldAlert,
  Dna,
  Cpu,
  Trash2,
  RotateCcw
} from 'lucide-react';

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function App() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'BATTLE' | 'LABORATORY' | 'VICTORY'>('START');
  const [currentFase, setCurrentFase] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [selectedNpc, setSelectedNpc] = useState<NPC | null>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  
  // Nickname, Time and Leaderboard States
  const [nickname, setNickname] = useState<string>('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [hasSavedRun, setHasSavedRun] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Load Leaderboard initially from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('missao_corrente_leaderboard');
      if (stored) {
        setLeaderboard(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Erro ao carregar o ranking:', e);
    }
  }, []);

  // Timer runner
  useEffect(() => {
    let timerInterval: any = null;
    const isGameActive = gameState === 'PLAYING' || gameState === 'BATTLE';
    
    if (isGameActive && startTime !== null) {
      timerInterval = setInterval(() => {
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }, 500);
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    }
    
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [gameState, startTime]);
  
  // Custom Einstein attire selection (cyber-physical element for extra polish!)
  const [cyberSuit, setCyberSuit] = useState<string>('CLASSIC');

  // PWA (Progressive Web App) Desktop States & Handlers
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaInstallModal, setShowPwaInstallModal] = useState<boolean>(false);
  const [isInIframe, setIsInIframe] = useState<boolean>(true);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('beforeinstallprompt disparado com sucesso para PWA Desktop!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA install prompt outcome: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      // Prompt not active (usually because of iframe sandbox restrictions).
      // Show gorgeous educational desktop install instructions modal!
      setShowPwaInstallModal(true);
    }
  };

  // Boss Battle and Laboratory additional states!
  const [bossHp, setBossHp] = useState<number>(100);
  const [bossStep, setBossStep] = useState<'INTRO' | 'QUESTION' | 'ACTION_COMBAT' | 'DEFEATED'>('INTRO');
  const [selectedBossOption, setSelectedBossOption] = useState<number | null>(null);
  const [bossFeedback, setBossFeedback] = useState<{ isCorrect: boolean; show: boolean } | null>(null);

  // Boss questions structure (Concepções Alternativas)
  const bossQuestions: Question[] = [
    {
      texto: "Muitos acreditam que a corrente elétrica flui instantaneamente do gerador para os aparelhos porque os elétrons viajam à velocidade da luz dentro do fio. Como funciona na realidade?",
      opcoes: [
        "Sim, os elétrons correm quase na velocidade da luz para acender as lâmpadas.",
        "Na verdade, os elétrons movem-se bem devagar (milímetros por segundo), mas o campo elétrico se propaga quase à velocidade da luz, empurrando-os juntos.",
        "Os elétrons não se movem de todo; eles apenas vibram parados gerando atrito estático no cobre.",
        "A corrente se propaga pelo ar no exterior do isolante plástico protetor e os elétrons servem apenas de isolamento."
      ],
      correta: 1,
      explicacao: "A velocidade dos elétrons individuais (velocidade de deriva) é de frações de milímetro por segundo! Porém, o campo eletromagnético é estabelecido quase à velocidade da luz por todo o fio assim que o circuito fecha, acionando todos os elétrons dispersos no condutor instantaneamente!"
    },
    {
      texto: "Quando ligamos uma lâmpada comum de filamento num circuito fechado doméstico, qual das opções retrata e explica corretamente o consumo dos elétrons?",
      opcoes: [
        "A lâmpada dissolve fisicamente os elétrons para convertê-los em fótons de luz do espectro visível.",
        "Os elétrons entram na lâmpada e perdem a sua carga elétrica negativa, saindo descarregados eletricamente.",
        "A quantidade exata de elétrons que entra pelo filamento sai dele. O brilho ocorre devido às colisões dos elétrons que colidem com a rede atômica e geram calor e luz.",
        "Os elétrons são divididos ao meio dentro da resistência para duplicar a corrente de retorno."
      ],
      correta: 2,
      explicacao: "A lâmpada NÃO consome ou gasta elétrons! A mesma corrente que entra na lâmpada sai igual do outro lado. Os elétrons apenas transferem energia cinética em colisões com a estrutura atômica do filamento, liberando calor e energia radiante (efeito Joule), mas mantendo o número líquido de elétrons intacto."
    }
  ];

  // Ground physical NPCs coordinates and questions (matched from original HTML)
  const [npcs, setNpcs] = useState<NPC[]>([
    {
      id: 1,
      nome: "Elétron Guardião da Carga",
      x: 1050,
      y: 0,
      alturaFlutuacao: 0,
      raioColisao: 85,
      interagido: false,
      pergunta: {
        texto: "Muitas pessoas pensam que a corrente elétrica é totalmente consumida ao longo do circuito, como se fosse água a esvaziar de um balde. O que acontece na realidade?",
        opcoes: [
          "A corrente elétrica é consumida e por isso volta mais fraca para o polo negativo do circuito.",
          "A corrente elétrica diminui apenas quando passa por lâmpadas ou resistores de alto valor.",
          "A corrente elétrica não é consumida; os elétrons livres apenas transferem energia e o seu número mantém-se igual em todo o fio.",
          "Os elétrons transformam-se integralmente em luz e calor, desaparecendo fisicamente do fio."
        ],
        correta: 2,
        explicacao: "A corrente elétrica NÃO se gasta! Ela representa a taxa de fluxo de elétrons livres no condutor. O que é consumido é a energia elétrica útil fornecida pelo gerador (tensão), enquanto o número líquido de elétrons que percorre o circuito mantém-se rigorosamente constante."
      }
    },
    {
      id: 2,
      nome: "Elétron Engenheiro Químico",
      x: 2350,
      y: 0,
      alturaFlutuacao: 0,
      raioColisao: 85,
      interagido: false,
      pergunta: {
        texto: "De onde vêm os elétrons livres que formam a corrente elétrica num pequeno fio de cobre conectado a uma pilha comum?",
        opcoes: [
          "A pilha cria e injeta novos elétrons inéditos no fio à medida que sofre desgaste químico.",
          "Os elétrons já estavam presentes livremente na estrutura atômica do próprio fio de cobre; a pilha apenas os empurra.",
          "O ar circundante é absorvido pelo isolamento do fio e convertido em elétrons de condução.",
          "Eles são gerados espontaneamente pela fricção e pelo calor criados na resistência do circuito."
        ],
        correta: 1,
        explicacao: "Os condutores metálicos (como o cobre) já possuem um oceano de elétrons livres em sua estrutura atômica por natureza. A pilha ou bateria não 'cria' elétrons, ela funciona como uma bomba eletromotriz que exerce força (tensão) para ordenar e induzir movimento aos elétrons preexistentes."
      }
    }
  ]);

  const handleStartGame = () => {
    // Enable and start audio play
    setSoundEnabled(audioEnabled);
    playGameSound('sucesso');
    setGameState('PLAYING');
    setCurrentFase(1);
    setScore(0);
    // Reset NPCs
    setNpcs(prev => prev.map(npc => ({ ...npc, interagido: false })));
    
    // Start speedrun timer
    setStartTime(Date.now());
    setElapsedTime(0);
    setHasSavedRun(false);
  };

  const saveRunToLeaderboard = (name: string, timeSec: number, finalScore: number) => {
    try {
      const stored = localStorage.getItem('missao_corrente_leaderboard');
      let currentLeaderboard: LeaderboardEntry[] = stored ? JSON.parse(stored) : [];
      
      const newEntry: LeaderboardEntry = {
        id: Math.random().toString(36).substring(2, 9),
        nickname: name.trim() || 'Cientista Anônimo',
        timeInSeconds: timeSec,
        score: finalScore,
        date: new Date().toLocaleDateString('pt-BR'),
      };
      
      currentLeaderboard.push(newEntry);
      
      // Sort: Fastest time first. If equal, higher score first.
      currentLeaderboard.sort((a, b) => {
        if (a.timeInSeconds !== b.timeInSeconds) {
          return a.timeInSeconds - b.timeInSeconds;
        }
        return b.score - a.score;
      });
      
      // Keep top 10
      currentLeaderboard = currentLeaderboard.slice(0, 10);
      
      localStorage.setItem('missao_corrente_leaderboard', JSON.stringify(currentLeaderboard));
      setLeaderboard(currentLeaderboard);
    } catch (e) {
      console.error('Erro ao salvar no ranking:', e);
    }
  };

  const handleClearLeaderboard = () => {
    try {
      localStorage.removeItem('missao_corrente_leaderboard');
      setLeaderboard([]);
    } catch (e) {
      console.error('Erro ao apagar ranking:', e);
    }
  };

  const handleRestoreLeaderboard = () => {
    try {
      const defaultEntries: LeaderboardEntry[] = [
        { id: 'curie', nickname: 'Marie Curie 🧪', timeInSeconds: 95, score: 950, date: new Date().toLocaleDateString('pt-BR') },
        { id: 'planck', nickname: 'Max Planck 🧠', timeInSeconds: 115, score: 880, date: new Date().toLocaleDateString('pt-BR') },
        { id: 'newton', nickname: 'Isaac Newton 🍎', timeInSeconds: 135, score: 810, date: new Date().toLocaleDateString('pt-BR') },
        { id: 'copernicus', nickname: 'N. Copérnico ☀️', timeInSeconds: 160, score: 750, date: new Date().toLocaleDateString('pt-BR') },
        { id: 'galileo', nickname: 'Galileu Galilei 🔭', timeInSeconds: 190, score: 680, date: new Date().toLocaleDateString('pt-BR') },
      ];
      localStorage.setItem('missao_corrente_leaderboard', JSON.stringify(defaultEntries));
      setLeaderboard(defaultEntries);
    } catch (e) {
      console.error('Erro ao restaurar ranking:', e);
    }
  };

  const handleToggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    setSoundEnabled(nextState);
    if (nextState) {
      setTimeout(() => playGameSound('clique'), 50);
    }
  };

  const handleNpcInteract = (npc: NPC) => {
    setSelectedNpc(npc);
  };

  const handleChallengeSuccess = (scoreBonus: number) => {
    setScore(prev => prev + scoreBonus);
    if (selectedNpc) {
      setNpcs(prev => 
        prev.map(n => n.id === selectedNpc.id ? { ...n, interagido: true } : n)
      );
    }
  };

  // Suction or level transitions completes
  const handlePhaseTransitionComplete = () => {
    if (currentFase === 1) {
      playGameSound('sucesso');
      setCurrentFase(2);
    } else {
      // Completed Phase 2: Save to leaderboard right here in case they skip or view victory summary
      if (!hasSavedRun) {
        saveRunToLeaderboard(nickname, elapsedTime, score);
        setHasSavedRun(true);
      }
      playGameSound('sucesso');
      setGameState('VICTORY');
    }
  };

  const handleBossBattleTrigger = () => {
    setBossHp(100);
    setBossStep('INTRO');
    setSelectedBossOption(null);
    setBossFeedback(null);
    setGameState('BATTLE');
  };

  const handleAnswerBossQuestion = (optionIndex: number) => {
    setSelectedBossOption(optionIndex);
    // Use the first conceptual question
    const isCorrect = optionIndex === bossQuestions[0].correta;
    
    if (isCorrect) {
      playGameSound('acerto');
      setScore(prev => prev + 150); // Extra points!
      setBossFeedback({ isCorrect: true, show: true });
      // Minor damage to the boss as requested ("vida do chefao vai baixar um pouquinho", to 80%)
      setBossHp(80);
    } else {
      playGameSound('erro');
      setBossFeedback({ isCorrect: false, show: true });
    }
  };

  const handleNextBossStep = () => {
    setBossFeedback(null);
    setSelectedBossOption(null);
    if (bossStep === 'INTRO') {
      setBossStep('QUESTION');
    } else if (bossStep === 'QUESTION') {
      if (bossHp === 80) {
        // If answered correctly, transition to Action Combat!
        setBossStep('ACTION_COMBAT');
        playGameSound('sucesso');
      } else {
        // If wrong, they stay in QUESTION step to try again
        setBossStep('QUESTION');
      }
    }
  };

  const handleGoToLaboratory = () => {
    playGameSound('sucesso');
    setGameState('LABORATORY');
    
    // Save to leaderboard on complete!
    if (!hasSavedRun) {
      saveRunToLeaderboard(nickname, elapsedTime, score);
      setHasSavedRun(true);
    }
  };

  const restartAll = () => {
    setGameState('START');
    setCurrentFase(1);
    setScore(0);
    setBossHp(100);
    setBossStep('INTRO');
    setSelectedBossOption(null);
    setBossFeedback(null);
    setStartTime(null);
    setElapsedTime(0);
    setHasSavedRun(false);
  };

  const restartWithNewNickname = () => {
    setNickname('');
    restartAll();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1E1B4B] text-white font-sans antialiased select-none">
      
      {/* Background Star Ambient decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#4338ca_1.5px,transparent_1.5px)] [background-size:20px_20px]" />

      <AnimatePresence mode="wait">
        
        {/* 1. START SCREEN LAYOUT */}
        {gameState === 'START' && (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto bg-gradient-to-b from-[#1b193f] via-[#1E1B4B] to-[#121030]"
          >
            {/* Upper sound toggle indicator */}
            <div className="absolute top-6 right-6 flex items-center gap-3">
              <button
                onClick={handleToggleAudio}
                className="p-3 rounded-xl bg-[#312E81]/80 border border-[#4338CA] hover:border-pink-500 text-indigo-200 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-indigo-950/50 cursor-pointer"
                title={audioEnabled ? "Desativar Sons" : "Ativar Sons"}
              >
                {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-pink-400 animate-pulse" />}
              </button>
            </div>

            <div className="w-full max-w-4xl flex flex-col items-center text-center space-y-6 py-5">
              
              {/* Animated Game Logo Banner */}
              <motion.div
                initial={{ scale: 0.93, y: -20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="relative space-y-2 pointer-events-none"
              >
                {/* Neon Aura Backing */}
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-pink-500/10 blur-[80px] w-80 h-32 rounded-full" />

                <div className="flex items-center justify-center gap-2 text-pink-400 font-mono text-xs tracking-[0.25em] uppercase font-bold">
                  <Zap className="w-4 h-4 text-pink-400 fill-pink-500 animate-pulse" />
                  Divulgação Científica Interativa
                </div>
                
                <h1 className="text-4xl sm:text-6xl font-black font-sans text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-yellow-400 to-cyan-400 tracking-tight leading-none drop-shadow-[0_4px_15px_rgba(0,0,0,0.55)]">
                  MISSÃO CORRENTE ELÉTRICA
                </h1>
                
                <p className="text-sm tracking-widest font-mono text-yellow-300 uppercase font-semibold">
                  A Transição Dimensional Cinematográfica do Dr. Einstein
                </p>
              </motion.div>

              {/* Sci-Fi Story Introduction summary screen */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-5 gap-6 text-left"
              >
                {/* Einstein Character customizable avatar card */}
                <div className="md:col-span-2 bg-[#312E81]/50 border border-[#4338CA] rounded-3xl p-5 flex flex-col items-center justify-between gap-4 relative overflow-hidden backdrop-blur-md">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-yellow-500" />
                  
                  <div className="text-center">
                    <p className="text-[10px] font-mono text-indigo-300 tracking-wider">VEÍCULO DE EXPLORAÇÃO</p>
                    <h3 className="text-md font-extrabold text-[#f1f5f9] mt-1">Nanoskala Suit</h3>
                  </div>

                  {/* Character Illustration Vector Container */}
                  <div className="w-24 h-24 rounded-full bg-[#1A1844] border-2 border-[#4338CA] shadow-[0_0_20px_rgba(67,56,202,0.3)] flex items-center justify-center relative overflow-hidden">
                    <span className="absolute bg-pink-500/10 blur-md w-16 h-16 rounded-full" />
                    <div className="text-4.5xl filter saturate-150 transform hover:scale-110 transition-transform">👴⚡️</div>
                  </div>

                  <div className="w-full space-y-1 text-center">
                    <span className="text-[10px] font-mono text-indigo-300 block">Personalização visual</span>
                    <div className="flex justify-center gap-1.5 mt-1 bg-indigo-950/60 p-1 rounded-lg border border-[#4338CA]/30">
                      <button
                        onClick={() => setCyberSuit('CLASSIC')}
                        className={`px-2.5 py-1 text-[10px] font-mono rounded font-bold transition-all cursor-pointer ${cyberSuit === 'CLASSIC' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20' : 'bg-transparent text-indigo-300 hover:text-white'}`}
                      >
                        Clássico
                      </button>
                      <button
                        onClick={() => setCyberSuit('CYBER_NEON')}
                        className={`px-2.5 py-1 text-[10px] font-mono rounded font-bold transition-all cursor-pointer ${cyberSuit === 'CYBER_NEON' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-transparent text-indigo-300 hover:text-white'}`}
                      >
                        Cyber
                      </button>
                    </div>
                  </div>
                </div>

                {/* Adventure Lore description card */}
                <div className="md:col-span-3 bg-[#312E81]/30 border border-[#4338CA]/60 rounded-3xl p-6 flex flex-col justify-between space-y-4 backdrop-blur-sm shadow-xl">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold font-mono text-cyan-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      Sinopse de Pesquisa
                    </h3>
                    <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
                      Albert Einstein encolheu-se a escalas subatômicas para elucidar o maior mistério dos fios! Viaje pela <b>Vila dos Elétrons</b>, interaja com cargas elementares, desvende quizzes científicos e seja transportado pela misteriosa cabine telefônica diretamente para <b>dentro do circuito condutor ativo</b>!
                    </p>
                  </div>

                  {/* Physics control guides */}
                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-[#4338CA]/40">
                    <div className="space-y-1.5">
                      <p className="font-mono text-[10px] text-indigo-400 uppercase">Teclado Desktop</p>
                      <p className="text-indigo-200">
                        <kbd className="px-1.5 py-0.5 rounded bg-indigo-950 border border-[#4338CA] mr-1 font-mono text-[10px] text-pink-400">A</kbd>
                        <kbd className="px-1.5 py-0.5 rounded bg-indigo-950 border border-[#4338CA] mr-1 font-mono text-[10px] text-pink-400">D</kbd> - Andar
                      </p>
                      <p className="text-indigo-200">
                        <kbd className="px-1.5 py-0.5 rounded bg-indigo-950 border border-[#4338CA] mr-1 font-mono text-[10px] text-pink-400">W</kbd> - Saltar
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="font-mono text-[10px] text-indigo-400 uppercase">Interação / Assobio</p>
                      <p className="text-indigo-200">
                        <kbd className="px-1.5 py-0.5 rounded bg-indigo-950 border border-[#4338CA] mr-1 font-mono text-[10px] text-yellow-400">E</kbd> - Ação / Assobio
                      </p>
                      <p className="text-indigo-200">Botoeira Virtual na Tela</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Mini Tutorial Section */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.18 }}
                className="w-full max-w-3xl bg-[#1E1B4B]/80 border border-[#4338CA]/60 rounded-3xl p-5 backdrop-blur-md shadow-2xl text-left"
              >
                <h3 className="text-xs font-semibold font-mono text-pink-400 flex items-center gap-1.5 uppercase tracking-wide border-b border-[#4338CA]/30 pb-2 mb-3">
                  <Award className="w-4 h-4 text-pink-400" />
                  Como Jogar (Tutorial Rápido)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-indigo-100">
                  <div className="bg-[#161233]/60 border border-[#4338CA]/30 p-3.5 rounded-2xl flex items-start gap-2.5">
                    <span className="text-xl">⚡️</span>
                    <div>
                      <h4 className="font-extrabold text-white mb-0.5">1. Explore e Responda</h4>
                      <p className="leading-relaxed">Converse com os elétrons livres azuis pressionando <kbd className="px-1 py-0.2 bg-slate-800 border border-indigo-500 rounded font-mono text-yellow-300">E</kbd> (ou botão Ação) para resolver quizzes científicos!</p>
                    </div>
                  </div>
                  
                  <div className="bg-[#161233]/60 border border-[#4338CA]/30 p-3.5 rounded-2xl flex items-start gap-2.5">
                    <span className="text-xl">👾</span>
                    <div>
                      <h4 className="font-extrabold text-white mb-0.5">2. Combata Capangas</h4>
                      <p className="leading-relaxed">Toque nos capangas vermelhos e voltará ao início! Pressione <kbd className="px-1 py-0.2 bg-slate-800 border border-indigo-500 rounded font-mono text-yellow-300">E</kbd> para <b>assobiar</b> e tontá-los, depois pule neles para eliminá-los!</p>
                    </div>
                  </div>
                  
                  <div className="bg-[#161233]/60 border border-[#4338CA]/30 p-3.5 rounded-2xl flex items-start gap-2.5">
                    <span className="text-xl">🚪</span>
                    <div>
                      <h4 className="font-extrabold text-white mb-0.5">3. Salte e Vença</h4>
                      <p className="leading-relaxed">Use as plataformas de neon rosa para saltar sobre capangas e vãos. Complete os quizzes para carregar a Cabine Telefônica rumo ao chefe!</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Start Trigger with Nickname Registration */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.22 }}
                className="w-full max-w-md mx-auto bg-[#312E81]/40 border border-[#4338CA]/60 p-5 rounded-2xl backdrop-blur-md space-y-4 shadow-xl"
              >
                <div className="space-y-1 text-center">
                  <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold flex items-center justify-center gap-1">
                    ⏱️ REGISTRO DE CORREDOR DO TEMPO
                  </span>
                  <p className="text-[11px] text-indigo-200">
                    Insira seu nickname para ativar o cronômetro e salvar seu tempo:
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    maxLength={15}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 15))}
                    placeholder="Apelido (Ex: EinsteinX)"
                    className="w-full text-center px-4 py-3 rounded-xl bg-slate-950/80 border border-indigo-500/50 text-yellow-300 font-mono text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent placeholder-indigo-500/40"
                  />
                  {nickname.trim().length >= 2 && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-mono text-[9px] font-bold animate-pulse">
                      REGISTRADO!
                    </span>
                  )}
                </div>

                <button
                  onClick={handleStartGame}
                  disabled={nickname.trim().length < 2}
                  className={`group relative w-full py-4 rounded-xl font-extrabold text-white uppercase text-xs tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 mx-auto cursor-pointer shadow-lg ${
                    nickname.trim().length >= 2 
                      ? 'bg-pink-500 hover:bg-pink-400 hover:scale-[1.02] shadow-pink-500/30' 
                      : 'bg-indigo-950/40 border border-indigo-500/20 text-indigo-400/60 cursor-not-allowed shadow-none'
                  }`}
                >
                  Iniciar Simulação Cinematográfica
                  <Play className="w-4 h-4 fill-current" />
                  {nickname.trim().length >= 2 && (
                    <span className="absolute inset-x-0 bottom-[-2px] h-[3px] bg-yellow-400 rounded-b-xl blur-xs" />
                  )}
                </button>
                {nickname.trim().length < 2 && (
                  <p className="text-center text-[10px] text-pink-400 font-mono">
                    * Digite pelo menos 2 caracteres para habilitar o botão
                  </p>
                )}

                {/* Desktop PWA Installation Panel */}
                <div className="pt-3 border-t border-[#4338CA]/30 flex flex-col gap-2">
                  {isInIframe ? (
                    <>
                      <button
                        onClick={() => window.open(window.location.origin || window.location.href, '_blank')}
                        className="w-full py-2.5 rounded-xl font-bold bg-[#1e1b4b]/95 hover:bg-cyan-950/40 border-2 border-cyan-400 hover:border-cyan-300 text-cyan-300 text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-cyan-950/50 animate-pulse"
                      >
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        Abrir em Nova Aba para Instalar ↗
                      </button>
                      <p className="text-center text-[9px] text-indigo-300 font-mono leading-tight">
                        A instalação de aplicativos Desktop (PWA) requer abrir o jogo fora do frame do AI Studio.
                      </p>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleInstallPWA}
                        className="w-full py-3 rounded-xl font-extrabold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 border-2 border-cyan-300 text-white text-[11px] font-mono uppercase tracking-widest flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-[0.98] shadow-lg shadow-cyan-500/20 animate-bounce"
                      >
                        <Cpu className="w-4 h-4 text-yellow-300" />
                        📥 INSTALAR JOGO NO PC (PWA) 💻
                      </button>
                      <div className="bg-[#1a1844]/60 p-2.5 rounded-xl border border-indigo-500/20 text-left space-y-1">
                        <p className="text-[10px] text-yellow-400 font-mono font-bold uppercase tracking-wide">
                          ⚠️ Se o instalador não abrir:
                        </p>
                        <p className="text-[9px] text-indigo-200 font-mono leading-relaxed">
                          Clique no ícone de instalação (<b>📥</b> ou <b>⊞</b>) ao lado da estrela de favoritos na barra de endereços do seu navegador, ou vá em <b>Menu (⋮) → "Salvar e Compartilhar" → "Instalar..."</b>.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* 2. GAMEPLAY LAYOUT ON TOP */}
        {gameState === 'PLAYING' && (
          <motion.div
            key="gameplay-area"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Overlay Top HUD superior panels */}
            <div className="absolute top-5 left-5 right-5 z-20 flex justify-between items-start pointer-events-none select-none">
              
              {/* Left Column info (Fase names) */}
              <div className="bg-[#312E81] rounded-2xl p-4 border-l-4 border-pink-500 border border-[#4338CA] shadow-xl flex flex-col space-y-1 max-w-[280px] pointer-events-auto">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                  </span>
                  <span className="text-[10px] font-mono tracking-wider text-pink-400 uppercase font-bold">Fase Atual</span>
                </div>
                
                <h2 className="text-md sm:text-lg font-black tracking-tight text-slate-100 uppercase mt-0.5 leading-tight">
                  {currentFase === 1 ? 'Vila dos Elétrons' : 'Fluxo do Condutor'}
                </h2>
                
                <p className="text-[10.5px] text-indigo-200 font-medium pt-1">
                  {currentFase === 1 
                    ? 'Explore, responda elétrons e entre na Cabine Telefônica!' 
                    : 'Salte sobre fios de cobre, resistores e lâmpadas gigantes!'}
                </p>
              </div>

              {/* Right Column indicators (Score, controller) */}
              <div className="flex flex-col items-end gap-2.5 pointer-events-auto">
                <div className="flex items-center gap-3">
                  {/* Sound controller */}
                  <button
                    onClick={handleToggleAudio}
                    className="p-3.5 rounded-2xl bg-[#312E81] border border-[#4338CA] hover:border-pink-500 text-indigo-200 hover:text-white transition-all shadow-xl cursor-pointer"
                  >
                    {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-pink-400" />}
                  </button>

                  {/* Speedrun timer panel */}
                  <div className="bg-[#312E81] rounded-2xl px-4 py-2 border border-[#4338CA] shadow-xl text-center flex flex-col justify-center min-w-[100px]">
                    <span className="text-[9px] font-bold font-mono tracking-wider text-cyan-400 uppercase">Tempo</span>
                    <span className="text-lg sm:text-xl font-mono font-black text-cyan-300 tracking-wider animate-pulse">
                      {formatTime(elapsedTime)}
                    </span>
                  </div>

                  {/* Scoreboard panel */}
                  <div className="bg-[#312E81] rounded-2xl px-4 py-2 border border-[#4338CA] shadow-xl text-right flex flex-col justify-center min-w-[110px]">
                    <span className="text-[9px] font-bold font-mono tracking-wider text-indigo-300 uppercase">Score ({nickname})</span>
                    <span className="text-lg sm:text-xl font-mono font-black text-yellow-400 tracking-wider">
                      {score.toString().padStart(4, '0')}
                    </span>
                  </div>
                </div>

                {/* Progress bar visual indicator */}
                <div className="bg-[#312E81]/50 p-2.5 rounded-xl text-[10px] font-mono text-indigo-200 tracking-wider border border-[#4338CA]/60 flex items-center gap-2 shadow-lg">
                  <span>Progresso:</span>
                  <div className="w-20 h-1.5 bg-indigo-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-500 to-yellow-500 transition-all duration-500"
                      style={{ width: currentFase === 1 ? '50%' : '100%' }}
                    />
                  </div>
                  <span className="font-extrabold text-pink-400">{currentFase}/2</span>
                </div>
              </div>
            </div>

            {/* Central Canvas Runner Container */}
            <div className="w-full h-full relative z-10">
              <GameCanvas
                currentFase={currentFase}
                score={score}
                npcs={npcs}
                onNpcsUpdate={setNpcs}
                onNpcInteract={handleNpcInteract}
                onPhaseTransitionComplete={handlePhaseTransitionComplete}
                onPointsEarned={(pts) => setScore(prev => prev + pts)}
                isDialogOpen={selectedNpc !== null}
                onBossBattleTrigger={handleBossBattleTrigger}
              />
            </div>

            {/* Active NPC Challenge Question overlays */}
            {selectedNpc && (
              <ChallengeModal
                npc={selectedNpc}
                onSuccess={handleChallengeSuccess}
                onClose={() => {
                  setSelectedNpc(null);
                  // The GameCanvas physics loops will naturally unblock
                }}
              />
            )}
          </motion.div>
        )}

        {/* 3. BOSS BATTLE SCREEN LAYOUT */}
        {gameState === 'BATTLE' && (
          <motion.div
            key="battle-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-between p-3 sm:p-4 overflow-y-auto bg-gradient-to-b from-[#1b193f] via-[#121030] to-[#0a0518] relative"
          >
            {/* Ambient Flash lightning effects behind */}
            <div className={`absolute inset-0 bg-pink-500/5 transition-opacity duration-300 pointer-events-none ${(bossStep === 'QUESTION' || bossStep === 'ACTION_COMBAT') && bossHp > 0 ? 'animate-pulse' : 'opacity-0'}`} />
            
            {/* Banner HUD Superior */}
            <div className="w-full max-w-5xl flex justify-between items-center bg-[#312E81]/30 border border-[#4338CA]/40 rounded-2xl p-3 backdrop-blur-md z-10 gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-pink-500 animate-pulse" />
                <span className="font-mono text-[10px] sm:text-xs text-pink-400 font-bold uppercase tracking-wider">CONFRONTO ATÔMICO</span>
              </div>
              <div className="font-mono text-right text-[10px] sm:text-xs flex items-center gap-3 sm:gap-4">
                <div>
                  <span className="text-cyan-300">TEMPO: </span>
                  <span className="text-cyan-400 font-bold">{formatTime(elapsedTime)}</span>
                </div>
                <div>
                  <span className="text-indigo-300">SCORE ({nickname}): </span>
                  <span className="text-yellow-400 font-black">{score} PTS</span>
                </div>
              </div>
            </div>

            {bossStep === 'ACTION_COMBAT' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-5xl flex-grow flex flex-col justify-center py-4 z-10"
              >
                {/* Active Dynamic Retro Combat Mode */}
                <div className="flex justify-between items-center px-4 mb-2">
                  <span className="text-xs font-mono text-yellow-400 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping" />
                    FASE DE COMBATE REAL EM ANDAMENTO!
                  </span>
                  <span className="text-xs font-mono text-pink-400 font-bold bg-[#312E81]/40 px-3 py-1 rounded border border-[#4338CA]/30">
                    HP DO CHEFÃO: {bossHp}%
                  </span>
                </div>
                
                {/* HP Bar */}
                <div className="w-full h-3 bg-indigo-950 rounded-full mb-4 overflow-hidden border border-[#4338CA]/40 p-0.5 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 via-pink-400 to-pink-600 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(244,63,94,0.6)]" 
                    style={{ width: `${bossHp}%` }}
                  />
                </div>

                <BossActionGame
                  bossHp={bossHp}
                  onBossHpUpdate={setBossHp}
                  onDefeated={() => {
                    setBossStep('DEFEATED');
                  }}
                  cyberSuit={cyberSuit}
                />
              </motion.div>
            ) : (
              <>
                {/* Battle Arena */}
                <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 my-auto py-2 z-10">
                  
                  {/* Left Fighter: Einstein with Positive Proton Rod */}
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="bg-[#312E81]/40 border border-[#4338CA]/60 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center relative overflow-hidden text-center min-h-[160px] sm:min-h-[190px] h-[190px] sm:h-[220px] hover:border-pink-500/40 transition-colors"
                  >
                    {/* Visual glow aura represent Positive Rod */}
                    <span className="absolute bg-[#f43f5e]/10 blur-[60px] w-48 h-48 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                    
                    <h3 className="text-xs font-mono tracking-widest text-cyan-400 uppercase font-bold">DR. EINSTEIN</h3>
                    <p className="text-[9px] uppercase font-mono text-indigo-300 mt-0.5">Status: Conectado ao Campo</p>

                    {/* Avatar Display illustration */}
                    <div className="my-2.5 relative flex items-center justify-center">
                      <div className="text-4xl sm:text-5xl select-none filter drop-shadow-[0_0_15px_rgba(244,63,94,0.3)] leading-none animate-bounce">👴⚡️</div>
                      
                      {/* The Proton Rod (Bastão de Cargas Positivas) */}
                      <motion.div
                        animate={{ rotate: [0, 15, 0], scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute bottom-1 right-2 bg-gradient-to-r from-pink-500 to-yellow-500 w-14 h-3 rounded-full border border-white shadow-[0_0_15px_rgba(244,63,94,0.8)] flex items-center justify-around px-1.5 text-[7px] font-bold text-white uppercase tracking-tighter"
                      >
                        <span>+</span>
                        <span>+</span>
                        <span>BASTÃO</span>
                      </motion.div>
                    </div>

                    <div className="bg-indigo-950/80 rounded-xl px-3 py-1.5 border border-[#4338CA]/40 max-w-xs text-[10px] sm:text-[11px] text-indigo-100 italic leading-tight">
                      "Eletronildo pensa que a corrente morre nos aparelhos! Vamos provar o oposto com nosso Bastão de Cargas Positivas!"
                    </div>
                  </motion.div>

                  {/* Right Fighter: Chefão Eletronildo */}
                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="bg-[#312E81]/40 border border-[#4338CA]/60 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center relative overflow-hidden text-center min-h-[160px] sm:min-h-[190px] h-[190px] sm:h-[220px] hover:border-pink-500/45 transition-colors"
                  >
                    {/* Red warning alert backing */}
                    <span className="absolute bg-[#f43f5e]/5 blur-[50px] w-64 h-64 rounded-full" />
                    
                    <div className="w-full flex justify-between items-center px-1">
                      <h3 className="text-xs font-mono tracking-widest text-pink-400 uppercase font-bold">CHEFÃO ELETRONILDO</h3>
                      <span className="text-[9px] font-mono font-bold text-yellow-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-[#4338CA]/40">HP: {bossHp}%</span>
                    </div>

                    {/* HP Bar */}
                    <div className="w-full h-2.5 bg-indigo-950 rounded-full mt-1.5 overflow-hidden border border-[#4338CA]/40 p-0.5 shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-500 via-pink-400 to-pink-600 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]" 
                        style={{ width: `${bossHp}%` }}
                      />
                    </div>

                    {/* Animated boss render */}
                    <div className="my-2.5 relative flex items-center justify-center">
                      <div className={`text-4.5xl sm:text-5.5xl filter saturate-150 leading-none select-none drop-shadow-[0_0_20px_rgba(239,68,68,0.45)] ${bossHp === 0 ? 'opacity-30 blur-xs grayscale scale-75 rotate-45 transition-all duration-700' : 'animate-pulse'}`}>
                        {bossHp > 80 ? '🦠😈⚡' : bossHp > 0 ? '🦠🥵💥' : '🦠💤😵‍💫'}
                      </div>
                    </div>

                    <div className="bg-indigo-950/80 rounded-xl px-3 py-1.5 border border-[#4338CA]/40 max-w-xs text-[10px] sm:text-[11px] text-pink-100 italic leading-tight">
                      {bossHp > 80 
                        ? '"Mwhahaha! O atrito comigo nas lâmpadas me cansa? Mentira! Eu sou consumido e destruído nos canais de cobre!"'
                        : bossHp > 0
                        ? '"Arghhh! Essa atração de prótons contra os meus mitos está dissolvendo a minha blindagem... Parem!"'
                        : '"Não... Minhas teorias falsas sobre o sumiço dos elétrons foram vaporizadas... Eu... me rendo..."'}
                    </div>
                  </motion.div>

                </div>

                {/* Dialogue Input Box / Challenge Quiz */}
                <div className="w-full max-w-5xl bg-[#1e1b4b]/80 border border-[#4338CA] rounded-2xl p-4 sm:p-5 backdrop-blur-md space-y-3 shadow-2xl relative z-10 mb-2">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-yellow-400 to-cyan-400" />
                  
                  {/* INTRO STEP */}
                  {bossStep === 'INTRO' && (
                    <div className="space-y-3 text-center py-2">
                      <h3 className="text-base font-bold text-[#f1f5f9]">Você encontrou o Chefão Eletronildo impedindo sua saída do circuito!</h3>
                      <p className="text-xs text-indigo-200 max-w-2xl mx-auto leading-relaxed">
                        Eletronildo se alimenta das concepções alternativas falsas sobre a corrente elétrica! Enquanto as pessoas acreditarem que os elétrons livres são inteiramente consumidos e destruídos nas lâmpadas, ele reterá o fluxo de energia e prenderá o Dr. Einstein.
                      </p>
                      <div className="pt-1">
                        <button
                          onClick={handleNextBossStep}
                          className="px-6 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 font-extrabold text-[#ffffff] uppercase tracking-wider text-[11px] transition-transform cursor-pointer shadow-md shadow-pink-500/20 active:scale-95 animate-pulse"
                        >
                          Empunhar o Bastão de Prótons (+) e Luta!
                        </button>
                      </div>
                    </div>
                  )}

                  {/* QUESTIONS STEPS: QUESTION */}
                  {bossStep === 'QUESTION' && (
                    <div className="space-y-3 text-left">
                      <div className="flex items-center justify-between text-[10px] font-mono border-b border-[#4338CA]/30 pb-1.5">
                        <span className="text-indigo-300 uppercase font-black">
                          DESAFIO CONCEITUAL DO CHEFÃO
                        </span>
                        <span className="text-yellow-400 font-bold">RELAÇÃO: CORRENTE ELÉTRICA</span>
                      </div>

                      {/* Ask Question text */}
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-100 flex items-start gap-1.5 leading-snug">
                          <HelpCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                          {bossQuestions[0].texto}
                        </h4>
                      </div>

                      {/* Options items */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-0.5">
                        {bossQuestions[0].opcoes.map((opcao, idx) => {
                          const isSelected = selectedBossOption === idx;
                          let optionBg = 'bg-[#1a1844]/50 border-[#4338CA]/40 hover:border-pink-500';
                          if (isSelected) {
                            optionBg = 'bg-pink-500 border-pink-500 text-white';
                          }
                          
                          return (
                            <button
                              key={idx}
                              disabled={selectedBossOption !== null}
                              onClick={() => handleAnswerBossQuestion(idx)}
                              className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all text-xs leading-normal flex items-center gap-2.5 cursor-pointer ${optionBg} active:scale-99`}
                            >
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold font-mono text-[9px] shrink-0 ${isSelected ? 'bg-white text-pink-500' : 'bg-[#312E81] text-pink-400'}`}>
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span>{opcao}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Question Feedback Explanation */}
                      {bossFeedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3.5 sm:p-4 rounded-xl border text-[11px] leading-relaxed space-y-2 ${
                            bossFeedback.isCorrect 
                              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-100' 
                              : 'bg-[#581c24]/30 border-pink-800 text-pink-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${bossFeedback.isCorrect ? 'bg-emerald-400 animate-pulse' : 'bg-pink-500'}`} />
                            <span className="font-extrabold font-mono tracking-wider uppercase text-[10px]">
                              {bossFeedback.isCorrect ? 'RESPOSTA EXCELENTE!' : 'CONCEPÇÃO INCORRETA!'}
                            </span>
                          </div>
                          
                          <p>
                            <b>{bossFeedback.isCorrect ? 'Fato Científico de Impacto: ' : 'Conselho Científico de Einstein: '}</b>
                            {bossQuestions[0].explicacao}
                          </p>

                          <div className="pt-0.5 text-right">
                            <button
                              onClick={handleNextBossStep}
                              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer active:scale-95 transition-all ${
                                bossFeedback.isCorrect ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 'bg-pink-800 hover:bg-pink-700 text-white'
                              }`}
                            >
                              {bossFeedback.isCorrect ? 'Iniciar Combate Físico ⚔️' : 'Tentar Novamente'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* DEFEATED STEP */}
                  {bossStep === 'DEFEATED' && (
                    <div className="space-y-2.5 text-center py-2">
                      <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400 uppercase tracking-tight">O Chefão Eletronildo foi Derrotado!</h3>
                      <p className="text-xs text-indigo-100 max-w-2xl mx-auto leading-relaxed">
                        Você provou que a corrente não morre e os elétrons mantêm-se constantes! Conectando as evidências científicas de que a matéria contém suas próprias cargas, você atacou de perto com seu <b>Bastão de Cargas Positivas (+)</b> e o Eletronildo foi totalmente neutralizado!
                      </p>
                      
                      {/* Visual effect particles representation */}
                      <div className="flex justify-center gap-2 text-[#00e5ff] font-mono text-[10px] font-bold py-0.5">
                        <span className="animate-pulse text-pink-400">[ Prótons (+) atraíram e acalmaram os Elétrons (-) ]</span> 
                      </div>

                      <div className="pt-1">
                        <button
                          onClick={handleGoToLaboratory}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-yellow-500 hover:scale-103 font-black text-white uppercase tracking-wider text-[11px] transition-transform cursor-pointer shadow-md shadow-pink-500/20"
                        >
                          Retornar à Vila e Entrar no Laboratório 🧪
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}

          </motion.div>
        )}

        {/* 4. LABORATORY RECONSTRUCTION DIALOGUE SCREEN */}
        {gameState === 'LABORATORY' && (
          <motion.div
            key="laboratory-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-[#1b193f] via-[#1E1B4B] to-[#121030]"
          >
            <div className="w-full max-w-3xl bg-[#312E81]/85 border-2 border-[#4338CA] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden space-y-6 backdrop-blur-md">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#00e5ff] to-pink-500" />

              <div className="text-center space-y-2">
                <span className="text-[10px] font-mono tracking-[0.2em] text-pink-400 uppercase font-extrabold block">MISSAO ATÔMICA CONCLUÍDA</span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Laboratório do Dr. Einstein</h2>
              </div>

              {/* Apparatus vector decoration */}
              <div className="relative border border-dashed border-[#4338CA] bg-[#1a1844]/60 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-inner">
                <div className="text-6.5xl flex items-center justify-center p-4 bg-[#312E81] border border-[#4338CA] rounded-2xl shadow-md w-28 h-28 leading-none select-none">
                  🧪👴💡
                </div>
                
                <div className="space-y-2 text-left">
                  <h4 className="text-sm font-bold font-sans text-yellow-300">Calibração Molecular Completa</h4>
                  <p className="text-xs text-indigo-100 leading-relaxed">
                    Albert Einstein retornou com segurança para o laboratório dele na vila dos elétrons! Graças à precisão de seus conhecimentos conceituais e ao disparo de cargas positivas, refutou-se a falsa ideia de que a corrente é consumida.
                  </p>
                  <p className="text-xs text-[#00e5ff] font-mono italic">
                    "Fantástico! Ao provar que os elétrons apenas circulam e transferem energia elétrica sem se gastar, estabilizamos os dínamos moleculares do gerador. A vila e o laboratório estão salvos!"
                  </p>
                </div>
              </div>

              {/* Action trigger button */}
              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    playGameSound('sucesso');
                    setGameState('VICTORY');
                  }}
                  className="px-8 py-3.5 rounded-xl bg-pink-500 hover:bg-pink-400 font-extrabold text-white uppercase text-xs tracking-widest transition-transform hover:scale-102 cursor-pointer shadow-lg shadow-pink-500/25 inline-flex items-center gap-2"
                >
                  Ver Conclusão Científica e Score
                  <Award className="w-4.5 h-4.5" />
                </button>
              </div>

            </div>
          </motion.div>
        )}

        {/* 5. VICTORY RECAP SUMMARY SCREEN */}
        {gameState === 'VICTORY' && (
          <motion.div
            key="victory-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-[#18153e] via-[#1E1B4B] to-[#120f30] overflow-y-auto"
          >
            <div className="w-full max-w-3xl bg-[#312E81] border-2 border-[#4338CA] rounded-3xl p-5 sm:p-8 shadow-2xl shadow-indigo-900/50 relative overflow-hidden space-y-6 backdrop-blur-md my-4">
              
              {/* Vibrant glowing top line */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 via-yellow-500 to-cyan-500 animate-pulse" />

              <div className="text-center space-y-1">
                <div className="inline-flex p-2.5 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-2xl mb-1 items-center justify-center animate-bounce">
                  <Award className="w-8 h-8" />
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white uppercase leading-none">
                  Missão Concluída!
                </h1>
                <p className="text-xs font-mono text-yellow-400 uppercase tracking-widest font-bold">
                  Sincronização Física Atômica Bem Sucedida
                </p>
              </div>

              {/* Stats overview boxes */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#1E1B4B]/80 p-3 rounded-2xl border border-[#4338CA] text-center flex flex-col justify-center shadow-lg">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-indigo-300">Score Final</span>
                  <span className="text-lg sm:text-xl font-mono font-black text-yellow-400 tracking-wider mt-0.5">{score} pts</span>
                </div>
                <div className="bg-[#1E1B4B]/80 p-3 rounded-2xl border border-[#4338CA] text-center flex flex-col justify-center shadow-lg">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-cyan-300">Tempo Total</span>
                  <span className="text-lg sm:text-xl font-mono font-black text-cyan-300 tracking-wider mt-0.5">{formatTime(elapsedTime)}</span>
                </div>
                <div className="bg-[#1E1B4B]/80 p-3 rounded-2xl border border-[#4338CA] text-center flex flex-col justify-center shadow-lg">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-indigo-300">Cargas</span>
                  <span className="text-lg sm:text-xl font-black text-pink-400 mt-0.5">
                    {npcs.filter(n => n.interagido).length} / {npcs.length}
                  </span>
                </div>
              </div>

              {/* Leaderboard Section */}
              <div className="bg-[#1E1B4B]/80 border border-[#4338CA]/60 rounded-2xl p-4 space-y-2.5 shadow-xl">
                <div className="flex flex-col sm:flex-row items-center justify-between border-b border-[#4338CA]/30 pb-2 gap-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    🏆 TOP 10 CORREDORES DO TEMPO (SPEEDRUN)
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRestoreLeaderboard}
                      className="flex items-center gap-1 text-[9px] font-mono uppercase bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 px-2 py-0.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                      title="Restaurar Recordes de Físicos Famosos"
                    >
                      <RotateCcw className="w-2.5 h-2.5 text-cyan-400" />
                      Restaurar
                    </button>
                    <button
                      onClick={handleClearLeaderboard}
                      className="flex items-center gap-1 text-[9px] font-mono uppercase bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/30 hover:border-pink-400 text-pink-300 px-2 py-0.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                      title="Limpar todos os recordes salvos"
                    >
                      <Trash2 className="w-2.5 h-2.5 text-pink-400" />
                      Apagar
                    </button>
                  </div>
                </div>
                
                {leaderboard.length === 0 ? (
                  <p className="text-center text-[10px] text-indigo-300 italic py-2 font-mono">
                    Nenhum recorde registrado ainda. Seja o primeiro!
                  </p>
                ) : (
                  <div className="overflow-x-auto max-h-[160px] overflow-y-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-[#4338CA]/40 text-indigo-400 text-[10px] uppercase">
                          <th className="py-1 px-3">Pos</th>
                          <th className="py-1 px-3">Cientista</th>
                          <th className="py-1 px-3 text-center">Tempo</th>
                          <th className="py-1 px-3 text-right">Score</th>
                          <th className="py-1 px-3 text-right hidden sm:table-cell">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry, index) => {
                          const isCurrentRun = entry.nickname === nickname && entry.timeInSeconds === elapsedTime;
                          return (
                            <tr 
                              key={entry.id} 
                              className={`border-b border-indigo-950/40 hover:bg-[#312E81]/30 transition-colors ${
                                isCurrentRun ? 'bg-indigo-600/40 font-bold border-l-4 border-l-pink-500' : ''
                              }`}
                            >
                              <td className="py-1.5 px-3">
                                {index === 0 && '🥇'}
                                {index === 1 && '🥈'}
                                {index === 2 && '🥉'}
                                {index > 2 && `${index + 1}º`}
                              </td>
                              <td className={`py-1.5 px-3 truncate max-w-[120px] ${isCurrentRun ? 'text-pink-400' : 'text-slate-200'}`}>
                                {entry.nickname}
                              </td>
                              <td className="py-1.5 px-3 text-center text-cyan-400 font-bold">
                                {formatTime(entry.timeInSeconds)}
                              </td>
                              <td className="py-1.5 px-3 text-right text-yellow-400 font-bold">
                                {entry.score}
                              </td>
                              <td className="py-1.5 px-3 text-right text-indigo-300 hidden sm:table-cell text-[10px]">
                                {entry.date}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Scientific physics recap summary checklist */}
              <div className="bg-indigo-950/50 p-4 rounded-2xl border border-[#4338CA]/70 text-left space-y-3 shadow-inner">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> Recapitulação Teórica: O que aprendemos?
                </h3>
                
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-indigo-100 leading-relaxed list-inside">
                  <li className="flex items-start gap-2 bg-[#312E81]/30 p-2 rounded-lg border border-[#4338CA]/30">
                    <span className="text-pink-400 font-bold font-mono">✓</span>
                    <span><b>Conservação da Carga:</b> Os elétrons não se gastam nas lâmpadas; eles apenas transportam energia e recirculam.</span>
                  </li>
                  <li className="flex items-start gap-2 bg-[#312E81]/30 p-2 rounded-lg border border-[#4338CA]/30">
                    <span className="text-[#00e5ff] font-bold font-mono">✓</span>
                    <span><b>Origem Eletrônica:</b> Os fios de cobre já possuem elétrons livres; as baterias apenas agem como empuxo ordenador.</span>
                  </li>
                </ul>
              </div>

              {/* Restart button actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
                <button
                  onClick={restartAll}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#312E81] hover:bg-[#4338CA]/80 border border-indigo-500/50 text-indigo-100 font-bold px-5 py-3 rounded-xl uppercase text-[11px] tracking-wider transition-all hover:scale-[1.03] cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-pink-400" />
                  Jogar Novamente ({nickname})
                </button>
                <button
                  onClick={restartWithNewNickname}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-400 hover:to-yellow-400 text-white font-black px-6 py-3 rounded-xl uppercase text-[11px] tracking-wider transition-all hover:scale-[1.03] shadow-[0_4px_20px_rgba(244,63,94,0.3)] cursor-pointer"
                >
                  <Award className="w-4 h-4 text-white animate-pulse" />
                  Jogar com Novo Nickname
                </button>
              </div>

            </div>
          </motion.div>
        )}

        {/* PWA Installation Desktop Guidance Modal */}
        {showPwaInstallModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#151233]/95 border-2 border-cyan-400 rounded-3xl p-6 relative overflow-hidden shadow-2xl space-y-5 text-left"
            >
              {/* Glow accent */}
              <span className="absolute bg-cyan-400/10 blur-[60px] w-48 h-48 rounded-full -left-10 -top-10" />
              
              <div className="flex items-center justify-between border-b border-[#4338CA]/40 pb-3 relative z-10">
                <h3 className="text-xs font-mono font-extrabold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  PWA Desktop • Instalação
                </h3>
                <button
                  onClick={() => setShowPwaInstallModal(false)}
                  className="text-indigo-400 hover:text-white font-bold font-mono text-xs p-1 px-2 rounded-lg bg-indigo-950/50 hover:bg-pink-500/20 hover:text-pink-400 border border-indigo-500/30 transition-all cursor-pointer"
                >
                  X FECHAR
                </button>
              </div>

              <div className="flex items-center gap-4 bg-indigo-950/40 p-3.5 rounded-2xl border border-[#4338CA]/30 relative z-10">
                <img
                  src="/pwa-icon.jpg"
                  alt="Missão Corrente Elétrica Icon"
                  className="w-16 h-16 rounded-xl border-2 border-cyan-400/80 shadow-md shadow-cyan-950"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-1 text-left">
                  <h4 className="text-xs font-bold font-mono text-yellow-300 uppercase">Missão Corrente Elétrica</h4>
                  <p className="text-[10px] text-indigo-200 leading-snug">
                    Transforme este jogo educativo em um aplicativo de computador leve que abre em sua própria janela, sem barras de navegador!
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 text-left text-xs text-indigo-100 relative z-10">
                <p className="font-semibold text-cyan-300 font-mono text-[11px] uppercase tracking-wide">
                  Como Instalar no Computador (Chrome / Edge / Opera):
                </p>

                <div className="space-y-2.5 font-mono text-[10px]">
                  <div className="flex items-start gap-2 bg-[#1A1844]/60 p-2.5 rounded-xl border border-indigo-500/20">
                    <span className="text-cyan-400 font-black">01.</span>
                    <div className="space-y-1">
                      <p className="text-white font-extrabold">Abra fora do Iframe:</p>
                      <p className="text-indigo-200 text-[9px] leading-relaxed">
                        PWAs requerem execução direta do domínio. Abra o jogo em uma aba limpa:
                      </p>
                      <a
                        href={window.location.origin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-lg text-[9px] uppercase mt-1 transition-all hover:scale-[1.02]"
                      >
                        Abrir em Nova Aba ↗
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-[#1A1844]/60 p-2.5 rounded-xl border border-indigo-500/20">
                    <span className="text-cyan-400 font-black">02.</span>
                    <div>
                      <p className="text-white font-extrabold">Instalação Direta:</p>
                      <p className="text-indigo-200 text-[9px] leading-relaxed">
                        Na aba externa, clique no ícone de <b>Instalação (📥 ou aplicativo disponível)</b> no lado direito da barra de endereços do seu navegador.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-[#1A1844]/60 p-2.5 rounded-xl border border-indigo-500/20">
                    <span className="text-cyan-400 font-black">03.</span>
                    <div>
                      <p className="text-white font-extrabold">Menu de Configurações:</p>
                      <p className="text-indigo-200 text-[9px] leading-relaxed">
                        Se não aparecer o ícone, clique em <b>"Menu (⋮)" → "Salvar e Compartilhar" → "Instalar página como aplicativo..."</b>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 relative z-10">
                <button
                  onClick={() => setShowPwaInstallModal(false)}
                  className="w-full py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white uppercase text-[10px] tracking-wider transition-all hover:scale-[1.01] font-mono cursor-pointer shadow-md shadow-indigo-950"
                >
                  Entendi, vamos jogar!
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
}
