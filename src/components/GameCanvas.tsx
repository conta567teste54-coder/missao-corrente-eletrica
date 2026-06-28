import React, { useEffect, useRef, useState } from 'react';
import { NPC, Cloud, Particle, Platform, Einstein, Capanga } from '../types';
import { playGameSound } from '../utils/audio';

interface GameCanvasProps {
  currentFase: number;
  score: number;
  onNpcInteract: (npc: NPC) => void;
  onPhaseTransitionComplete: () => void;
  onPointsEarned: (points: number) => void;
  npcs: NPC[];
  onNpcsUpdate: (npcs: NPC[]) => void;
  isDialogOpen: boolean;
  onBossBattleTrigger: () => void;
}

export function GameCanvas({
  currentFase,
  score,
  onNpcInteract,
  onPhaseTransitionComplete,
  onPointsEarned,
  npcs,
  onNpcsUpdate,
  isDialogOpen,
  onBossBattleTrigger,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keyboard controls state
  const keysPressed = useRef({
    esquerda: false,
    direita: false,
    cima: false,
    acao: false,
  });

  // Level data & player positions held inside refs to keep high 60fps/120fps physics loops stable
  const playerRef = useRef<Einstein>({
    x: 200,
    y: 0,
    velX: 0,
    velY: 0,
    largura: 50,
    altura: 90,
    noChao: false,
    direcao: 1,
    passoCiclo: 0,
    estaAndando: false,
  });

  const cameraX = useRef(0);
  const gameBloqueado = useRef(false);

  // Cinematic suction state
  const transicaoCinematica = useRef({
    ativa: false,
    progresso: 0, // 0 to 100
    rotacaoEinstein: 0,
    escalaEinstein: 1,
    zoomCamera: 1,
    escurecimento: 0,
  });

  // Abduction state
  const abductionAnimation = useRef({
    progresso: 0,
  });

  // Assets refs & variables
  const yChaoGlobal = useRef(0);
  const canvasWidth = useRef(window.innerWidth);
  const canvasHeight = useRef(window.innerHeight);

  // Phase 1 clouds
  const clouds = useRef<Cloud[]>([
    { x: 120, y: 70, scale: 0.8, vel: 0.12, opacity: 0.4 },
    { x: 500, y: 130, scale: 1.2, vel: 0.08, opacity: 0.6 },
    { x: 950, y: 90, scale: 1.0, vel: 0.15, opacity: 0.5 },
    { x: 1400, y: 150, scale: 0.7, vel: 0.10, opacity: 0.35 },
    { x: 1800, y: 80, scale: 1.1, vel: 0.14, opacity: 0.55 },
  ]);

  // Phase 1 background ambient air particles
  const particlesAr = useRef<Particle[]>([]);

  // Magic telephone booth state
  const telephoneMagico = useRef({
    x: 3000,
    y: 0,
    largura: 60,
    altura: 110,
    particulas: [] as { x: number; y: number; velY: number; alpha: number; cor: string }[],
  });

  // Phase 1 jumping platforms
  const plataformasFase1 = useRef<Platform[]>([
    { x: 500, y: 360, larg: 180, alt: 25, tipo: 'fio_condutor' },
    { x: 750, y: 260, larg: 180, alt: 25, tipo: 'fio_condutor' },
    { x: 1250, y: 360, larg: 180, alt: 25, tipo: 'fio_condutor' },
    { x: 1550, y: 260, larg: 180, alt: 25, tipo: 'fio_condutor' },
    { x: 1850, y: 360, larg: 180, alt: 25, tipo: 'fio_condutor' },
    { x: 2150, y: 260, larg: 180, alt: 25, tipo: 'fio_condutor' },
    { x: 2500, y: 360, larg: 180, alt: 25, tipo: 'fio_condutor' },
  ]);

  // Phase 1 Patrolling Henchmen (Capangas)
  const capangas = useRef<Capanga[]>([
    {
      id: 1,
      x: 600,
      y: 0,
      largura: 50,
      altura: 80,
      velX: 1.5,
      direcao: 1,
      patrulhaMinX: 450,
      patrulhaMaxX: 850,
      estaTonto: false,
      tontoTimer: 0,
      derrotado: false,
    },
    {
      id: 2,
      x: 1300,
      y: 0,
      largura: 50,
      altura: 80,
      velX: 1.2,
      direcao: -1,
      patrulhaMinX: 1100,
      patrulhaMaxX: 1500,
      estaTonto: false,
      tontoTimer: 0,
      derrotado: false,
    },
    {
      id: 3,
      x: 1900,
      y: 0,
      largura: 50,
      altura: 80,
      velX: 1.6,
      direcao: 1,
      patrulhaMinX: 1750,
      patrulhaMaxX: 2100,
      estaTonto: false,
      tontoTimer: 0,
      derrotado: false,
    },
    {
      id: 4,
      x: 2600,
      y: 0,
      largura: 50,
      altura: 80,
      velX: 1.4,
      direcao: -1,
      patrulhaMinX: 2400,
      patrulhaMaxX: 2850,
      estaTonto: false,
      tontoTimer: 0,
      derrotado: false,
    }
  ]);

  // Ripple effects for whistle
  const whistleRipples = useRef<Array<{ x: number; y: number; radius: number; maxRadius: number; alpha: number }>>([]);

  // Seeds for grass and trees
  const sementesGrama = useRef<Array<{ offset: number; altura: number; angulo: number; cor: string }>>([]);

  // Phase 2 flutuate platforms
  const plataformasFase2 = useRef<Platform[]>([]);

  // Mobiles on-screen keys (for easier testing inside iframe!)
  const [mobileKeys, setMobileKeys] = useState({ left: false, right: false, jump: false, action: false });

  const npcsRef = useRef<NPC[]>(npcs);
  const mobileKeysRef = useRef(mobileKeys);

  useEffect(() => {
    npcsRef.current = npcs;
  }, [npcs]);

  useEffect(() => {
    mobileKeysRef.current = mobileKeys;
  }, [mobileKeys]);

  // Generate once sementesGrama and particles
  useEffect(() => {
    // Generate grass blades
    const grass: Array<{ offset: number; altura: number; angulo: number; cor: string }> = [];
    for (let i = 0; i < 350; i++) {
      grass.push({
        offset: Math.random() * 12 - 6,
        altura: Math.random() * 15 + 12,
        angulo: ((Math.random() * 14 - 7) * Math.PI) / 180,
        cor: Math.random() > 0.48 ? '#15803d' : '#22c55e',
      });
    }
    sementesGrama.current = grass;

    // Generate ambient particles
    const air: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      air.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * (window.innerHeight - 150),
        raio: Math.random() * 2 + 0.5,
        velY: -Math.random() * 0.4 - 0.1,
        alpha: Math.random() * 0.5 + 0.1,
        frequencia: Math.random() * 0.05,
      });
    }
    particlesAr.current = air;
  }, []);

  // Set physical platform layouts which require canvas heights
  const updatePlatformsAndFloor = (h: number) => {
    yChaoGlobal.current = h - 80;
    plataformasFase2.current = [
      { x: 0, y: h - 80, larg: 600, alt: 80, tipo: 'fio_condutor' },
      { x: 750, y: h - 180, larg: 200, alt: 45, tipo: 'resistor' },
      { x: 1100, y: h - 285, larg: 240, alt: 50, tipo: 'bateria' },
      { x: 1450, y: h - 150, larg: 350, alt: 40, tipo: 'fio_condutor' },
      { x: 1950, y: h - 250, larg: 180, alt: 45, tipo: 'lâmpada' },
      { x: 2320, y: h - 110, larg: 800, alt: 110, tipo: 'fio_condutor' },
    ];
  };

  // ResizeObserver for canvas container as per Guidelines
  useEffect(() => {
    const parent = containerRef.current;
    if (!parent || !canvasRef.current) return;

    const canvas = canvasRef.current;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        canvasWidth.current = width;
        canvasHeight.current = height;
        canvas.width = width;
        canvas.height = height;

        updatePlatformsAndFloor(height);
        
        // Initial drop if Einstein hasn't loaded
        if (playerRef.current.y === 0) {
          playerRef.current.y = yChaoGlobal.current - playerRef.current.altura;
        }
      }
    });

    resizeObserver.observe(parent);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update physical coordinates when Fase switches
  useEffect(() => {
    if (currentFase === 2) {
      playerRef.current.x = 100;
      playerRef.current.y = 80;
      playerRef.current.velX = 0;
      playerRef.current.velY = 0;
      playerRef.current.noChao = false;
      cameraX.current = 0;
    } else {
      playerRef.current.x = 200;
      playerRef.current.y = yChaoGlobal.current - playerRef.current.altura;
      playerRef.current.velX = 0;
      playerRef.current.velY = 0;
      cameraX.current = 0;
    }
  }, [currentFase]);

  // Read Keyboard Inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameBloqueado.current) return;

      const key = e.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') {
        keysPressed.current.esquerda = true;
      }
      if (key === 'arrowright' || key === 'd') {
        keysPressed.current.direita = true;
      }
      if (key === 'arrowup' || key === 'w' || e.key === ' ') {
        keysPressed.current.cima = true;
      }
      if (key === 'e') {
        keysPressed.current.acao = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') {
        keysPressed.current.esquerda = false;
      }
      if (key === 'arrowright' || key === 'd') {
        keysPressed.current.direita = false;
      }
      if (key === 'arrowup' || key === 'w' || e.key === ' ') {
        keysPressed.current.cima = false;
      }
      if (key === 'e') {
        keysPressed.current.acao = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Synchronize dynamic updates back to modal or parent states (e.g., locking input if dialog is open)
  useEffect(() => {
    if (isDialogOpen) {
      gameBloqueado.current = true;
      keysPressed.current.esquerda = false;
      keysPressed.current.direita = false;
      keysPressed.current.cima = false;
      keysPressed.current.acao = false;
      setMobileKeys({ left: false, right: false, jump: false, action: false });
    } else {
      gameBloqueado.current = false;
      // Guarantee focus context is restored to the simulation
      try {
        canvasRef.current?.focus();
      } catch (e) {
        console.warn("Focus failed", e);
      }
    }
  }, [isDialogOpen]);
  
  // Game Loop physics and renderings
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gravity = 0.55;
    const jumpStrength = -13.5;
    const frictionX = 0.8;
    const accel = 0.7;
    const maxVelX = 5.5;

    const gameLoop = () => {
      // Loop execution
      atualizarFisica();
      renderizarJogo(ctx);

      animationId = requestAnimationFrame(gameLoop);
    };

    const atualizarFisica = () => {
      // Check cinematic transition
      processarSuctionTransition();

      const p = playerRef.current;

      // Handle on-screen buttons
      const isMoveLeft = keysPressed.current.esquerda || mobileKeysRef.current.left;
      const isMoveRight = keysPressed.current.direita || mobileKeysRef.current.right;
      const isJump = keysPressed.current.cima || mobileKeysRef.current.jump;
      const isAction = keysPressed.current.acao || mobileKeysRef.current.action;

      if (gameBloqueado.current) {
        p.estaAndando = false;
        p.velX *= frictionX;
        p.velY += gravity;
        p.y += p.velY;
        restrictLowerFloorOnly();
        return;
      }

      // Left-Right Movement
      p.estaAndando = false;
      if (isMoveLeft) {
        p.velX -= accel;
        if (p.velX < -maxVelX) p.velX = -maxVelX;
        p.direcao = -1;
        p.estaAndando = true;
      }
      if (isMoveRight) {
        p.velX += accel;
        if (p.velX > maxVelX) p.velX = maxVelX;
        p.direcao = 1;
        p.estaAndando = true;
      }

      // Apply friction
      if (!isMoveLeft && !isMoveRight) {
        p.velX *= frictionX;
        if (Math.abs(p.velX) < 0.15) p.velX = 0;
      }

      // Jump
      if (isJump && p.noChao) {
        p.velY = jumpStrength;
        p.noChao = false;
        playGameSound('pulo');
      }

      // Gravity and speed updates
      p.velY += gravity;
      p.x += p.velX;
      p.y += p.velY;

      // Restric Left Limit
      if (p.x < p.largura) {
        p.x = p.largura;
        p.velX = 0;
      }

      // Phase 2 Loop Fall protection / Out of Bounds
      if (currentFase === 2) {
        if (p.y > canvasHeight.current + 150) {
          p.x = 100;
          p.y = 80;
          p.velY = 0;
          p.velX = 0;
        }

        // Check Phase 2 Exit Plaque encounter (instead of immediate win, we battle Chefão Eletronildo!)
        if (p.x >= 2650) {
          p.x = 2650;
          p.velX = 0;
          p.estaAndando = false;
          gameBloqueado.current = true;
          onBossBattleTrigger();
        }
      }

      // Physical collisions
      p.noChao = false;
      if (currentFase === 1) {
        restrictLowerFloorOnly();
        
        // Collide with Phase 1 jumping platforms!
        plataformasFase1.current.forEach((plat) => {
          if (p.x >= plat.x && p.x <= plat.x + plat.larg) {
            // Landing condition
            if (p.velY >= 0 && p.y >= plat.y && p.y - p.velY <= plat.y + 12) {
              p.y = plat.y;
              p.velY = 0;
              p.noChao = true;
            }
          }
        });

        // Update Whistle Ripples
        whistleRipples.current.forEach((rip, idx) => {
          rip.radius += 5.5;
          rip.alpha = Math.max(0, 1 - rip.radius / rip.maxRadius);
          if (rip.alpha <= 0 || rip.radius >= rip.maxRadius) {
            whistleRipples.current.splice(idx, 1);
          }
        });

        // Check if Action key was pressed to Whistle
        if (isAction) {
          const nearNpc = npcsRef.current.some(npc => Math.abs(p.x - npc.x) < npc.raioColisao && !npc.interagido);
          if (!nearNpc) {
            keysPressed.current.acao = false;
            setMobileKeys(prev => ({ ...prev, action: false }));
            
            playGameSound('assobio');
            // Add ripple
            whistleRipples.current.push({
              x: p.x,
              y: p.y - p.altura / 2,
              radius: 10,
              maxRadius: 280,
              alpha: 1.0,
            });

            // Stun nearby capangas
            capangas.current.forEach((cap) => {
              if (!cap.derrotado) {
                const distCap = Math.abs(p.x - cap.x);
                if (distCap < 280) {
                  cap.estaTonto = true;
                  cap.tontoTimer = 180; // 3 seconds at 60fps
                }
              }
            });
          }
        }

        // Update Capangas movement & timers
        capangas.current.forEach((cap) => {
          if (cap.derrotado) return;

          // Timer ticks
          if (cap.estaTonto) {
            cap.tontoTimer--;
            if (cap.tontoTimer <= 0) {
              cap.estaTonto = false;
            }
          } else {
            // Check proximity to Einstein for chasing/aggro behavior
            const distToEinstein = Math.abs(p.x - cap.x);
            const chaseDistance = 380; // Trigger distance in pixels

            if (distToEinstein < chaseDistance) {
              // Chase mode! Run towards Einstein
              if (p.x > cap.x) {
                cap.direcao = 1;
                cap.x += cap.velX * 1.6; // run faster when chasing!
              } else {
                cap.direcao = -1;
                cap.x -= cap.velX * 1.6; // run faster when chasing!
              }
              // clamp to phase 1 boundaries
              cap.x = Math.max(100, Math.min(3100, cap.x));
            } else {
              // Patrolling movement
              cap.x += cap.velX * cap.direcao;
              if (cap.x >= cap.patrulhaMaxX) {
                cap.x = cap.patrulhaMaxX;
                cap.direcao = -1;
              } else if (cap.x <= cap.patrulhaMinX) {
                cap.x = cap.patrulhaMinX;
                cap.direcao = 1;
              }
            }
          }

          // Always snap to ground y coordinate
          cap.y = yChaoGlobal.current;

          // Collision with player
          const dx = Math.abs(p.x - cap.x);
          const dy = p.y - cap.y; // Einstein foot vs Capanga foot
          
          // Collision box check
          if (dx < 35 && p.y >= cap.y - cap.altura && p.y - p.altura <= cap.y) {
            if (cap.estaTonto) {
              // Can we stomp? Player must be landing/jumping on top of them (p.velY >= 0 and player's feet are above capanga's waist/chest)
              const playerFoot = p.y;
              const capHead = cap.y - cap.altura;
              if (p.velY >= 0 && playerFoot <= capHead + 25) {
                // STOMP DERROTADO!
                cap.derrotado = true;
                p.velY = -11.0; // bounce up!
                p.noChao = false;
                playGameSound('pisao');
                onPointsEarned(100); // award 100 points
              }
            } else {
              // Einstein touched a healthy capanga -> DIE!
              playGameSound('erro');
              // Reset player to the start of Phase 1
              p.x = 200;
              p.y = yChaoGlobal.current - p.altura;
              p.velX = 0;
              p.velY = 0;
              cameraX.current = 0;
            }
          }
        });
      } else {
        // Collide with Phase 2 structural vector blocks
        plataformasFase2.current.forEach((plat) => {
          if (p.x >= plat.x && p.x <= plat.x + plat.larg) {
            // Landing condition
            if (p.velY >= 0 && p.y >= plat.y && p.y - p.velY <= plat.y + 12) {
              p.y = plat.y;
              p.velY = 0;
              p.noChao = true;
            }
          }
        });
      }

      // Walk cycle animation update
      if (p.estaAndando && p.noChao) {
        p.passoCiclo += Math.abs(p.velX) * 0.06;
      } else if (!p.noChao) {
        p.passoCiclo = 0;
      } else {
        p.passoCiclo *= 0.72;
      }

      // Smooth Camera tracking centering player at 35% of the viewport width
      const cameraTarget = p.x - canvasWidth.current * 0.35;
      cameraX.current += (Math.max(0, cameraTarget) - cameraX.current) * 0.08;

      // Handle NPC Proximity / Interacion Triggers
      if (currentFase === 1) {
        npcsRef.current.forEach((npc) => {
          const dist = Math.abs(p.x - npc.x);
          if (dist < npc.raioColisao && !npc.interagido) {
            if (isAction) {
              // Trigger modal callback!
              keysPressed.current.acao = false;
              setMobileKeys(prev => ({ ...prev, action: false }));
              gameBloqueado.current = true;
              onNpcInteract(npc);
            }
          }
        });
      }
    };

    const restrictLowerFloorOnly = () => {
      const p = playerRef.current;
      if (p.y >= yChaoGlobal.current) {
        p.y = yChaoGlobal.current;
        p.velY = 0;
        p.noChao = true;
      }
    };

    const processarSuctionTransition = () => {
      const tc = transicaoCinematica.current;
      if (!tc.ativa) {
        // Evaluate if player reached the classic Booth trigger
        const p = playerRef.current;
        const distBooth = Math.abs(p.x - (telephoneMagico.current.x + 30));
        if (distBooth < 36 && p.noChao && currentFase === 1) {
          const isAction = keysPressed.current.acao || mobileKeysRef.current.action;
          if (isAction) {
            const allNpcsInteracted = npcsRef.current.every(n => n.interagido);
            if (allNpcsInteracted) {
              tc.ativa = true;
              gameBloqueado.current = true;
              p.velX = 0;
              p.velY = 0;
              p.estaAndando = false;
              playGameSound('sugado');
              
              keysPressed.current.acao = false;
              setMobileKeys(prev => ({ ...prev, action: false }));
            } else {
              playGameSound('erro');
              keysPressed.current.acao = false;
              setMobileKeys(prev => ({ ...prev, action: false }));
            }
          }
        }
        return;
      }

      // Accumulate progress
      tc.progresso += 0.85;

      if (tc.progresso < 50) {
        tc.zoomCamera += 0.012;
        tc.escurecimento += 0.007;

        // Pull Einstein horizontally and vertically to center of telephone cabin
        playerRef.current.x += (telephoneMagico.current.x + 30 - playerRef.current.x) * 0.12;
        playerRef.current.y += (yChaoGlobal.current - 55 - playerRef.current.y) * 0.12;
      } else if (tc.progresso >= 50 && tc.progresso < 100) {
        tc.rotacaoEinstein += 0.42;
        tc.escalaEinstein = Math.max(0, 1 - (tc.progresso - 50) / 50);
        tc.escurecimento += 0.015;
        playerRef.current.y -= 1.3; // shrink vertically
      } else {
        // Complete suction transition
        tc.ativa = false;
        tc.progresso = 0;
        tc.escalaEinstein = 1;
        tc.rotacaoEinstein = 0;
        tc.zoomCamera = 1;
        tc.escurecimento = 0;

        gameBloqueado.current = false;
        onPhaseTransitionComplete(); // Switches state in React
      }
    };

    const renderizarJogo = (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (currentFase === 1) {
        // FASE 1 RENDER
        desenharCeuFase1(ctx);
        desenharMontanhasFase1(ctx);
        desenharColinasFase1(ctx);
        desenharElementosFase1(ctx);
        desenharPlataformasFase1(ctx);
        desenharWhistleRipples(ctx);
        desenharCapangas(ctx);
        desenharTelefoneMagico(ctx);
        desenharNPCs(ctx);
        desenharRelampagosSuction(ctx);
        desenharEinstein(ctx);
        desenharChaoFase1(ctx);
      } else {
        // FASE 2 RENDER (Inside Electric Current)
        desenharFase2CeuEParticulas(ctx);
        desenharFase2Plataformas(ctx);
        desenharPlacaSaida(ctx);
        desenharEinstein(ctx);
      }

      // Apply transition screen glow overlay
      const tc = transicaoCinematica.current;
      if (tc.ativa) {
        ctx.fillStyle = `rgba(3, 4, 15, ${Math.min(1, tc.escurecimento)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    // Draw Phase 1 platforms
    const desenharPlataformasFase1 = (ctx: CanvasRenderingContext2D) => {
      plataformasFase1.current.forEach((plat) => {
        const xD = plat.x - cameraX.current;
        if (xD + plat.larg < -50 || xD > canvasWidth.current + 50) return;

        ctx.save();
        ctx.translate(xD, plat.y);

        // Draw neon floating slab
        const gradient = ctx.createLinearGradient(0, 0, 0, plat.alt);
        gradient.addColorStop(0, '#f43f5e'); // neon rose
        gradient.addColorStop(0.5, '#ec4899'); // hot pink
        gradient.addColorStop(1, '#9d174d');

        // Glow aura
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12;

        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        // Rounded platform slab
        ctx.beginPath();
        ctx.roundRect(0, 0, plat.larg, plat.alt, 6);
        ctx.fill();
        ctx.stroke();

        // High-tech circuitry line in center of slab
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fde047'; // yellow neon line
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(15, plat.alt / 2);
        ctx.lineTo(plat.larg - 15, plat.alt / 2);
        ctx.stroke();

        ctx.restore();
      });
    };

    // Draw Whistle soundwaves
    const desenharWhistleRipples = (ctx: CanvasRenderingContext2D) => {
      whistleRipples.current.forEach((rip) => {
        ctx.save();
        ctx.strokeStyle = `rgba(253, 224, 71, ${rip.alpha})`; // yellow sound wave
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(rip.x - cameraX.current, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
    };

    // Draw Red Evil Minions
    const desenharCapangas = (ctx: CanvasRenderingContext2D) => {
      capangas.current.forEach((cap) => {
        if (cap.derrotado) return;

        const xD = cap.x - cameraX.current;
        if (xD + cap.largura < -100 || xD > canvasWidth.current + 100) return;

        // Animate hovering of capanga just like interactive NPCs!
        const alturaFlutuacao = Math.sin(Date.now() * 0.0035 + cap.id) * 7.5;
        // They hover above ground y coordinate:
        const yD = yChaoGlobal.current - 55 + alturaFlutuacao;

        ctx.save();
        ctx.translate(xD, yD);
        ctx.scale(cap.direcao, 1);

        // 1. Ground reflection shadow (neon red glow shadow)
        ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
        ctx.beginPath();
        const absoluteFloat = Math.abs(alturaFlutuacao);
        ctx.ellipse(0, yChaoGlobal.current - yD, 22 - absoluteFloat * 0.45, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Neon Aura glow (Vibrant Red)
        const glowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 36);
        glowGrad.addColorStop(0, 'rgba(244, 63, 94, 0.65)'); // neon rose/red
        glowGrad.addColorStop(0.35, 'rgba(244, 63, 94, 0.25)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fill();

        // 3. White nucleus sphere (matching the friendly blue electrons)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();

        // 4. Draw electron rings orbiting around the nucleus (Crimson Red)
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.save();
        ctx.rotate(Date.now() * 0.0022 + cap.id);
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 5. Angry Face inside nucleus
        ctx.fillStyle = '#0a0f1d';
        ctx.beginPath();
        // Angry eyes
        ctx.arc(-3, -2, 1.8, 0, Math.PI * 2);
        ctx.arc(3, -2, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Angry slanting eyebrows (crimson red/dark)
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 1.6;
        // Left slant down-right
        ctx.beginPath();
        ctx.moveTo(-6, -5.2);
        ctx.lineTo(-1.2, -2.5);
        ctx.stroke();
        // Right slant down-left
        ctx.beginPath();
        ctx.moveTo(6, -5.2);
        ctx.lineTo(1.2, -2.5);
        ctx.stroke();

        // Mean/angry frowning mouth (upper-half arc)
        ctx.strokeStyle = '#0a0f1d';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(0, 4, 2.5, Math.PI, 0); // Frown upper arc
        ctx.stroke();

        // 6. Dizzy swirls and yellow orbiting stars if stunned (tonto)
        if (cap.estaTonto) {
          ctx.save();
          ctx.scale(cap.direcao, 1); // undo direction flip so elements draw correctly
          const swirlAngle = (Date.now() * 0.007) % (Math.PI * 2);
          ctx.strokeStyle = '#fde047'; // glowing yellow
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(0, -22, 15, 5, swirlAngle, 0, Math.PI * 2);
          ctx.stroke();

          // Draw tiny white/yellow stars orbiting
          const starCount = 3;
          for (let i = 0; i < starCount; i++) {
            const angle = swirlAngle + (i * Math.PI * 2) / starCount;
            const starX = Math.cos(angle) * 15;
            const starY = -22 + Math.sin(angle) * 5;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(starX, starY, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        ctx.restore();
      });
    };

    // Draw starry sky
    const desenharCeuFase1 = (ctx: CanvasRenderingContext2D) => {
      const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight.current);
      grad.addColorStop(0, '#040b21'); // ultra deep navy space
      grad.addColorStop(0.35, '#0b193d');
      grad.addColorStop(0.7, '#1b3566'); // vibrant blue horizon
      grad.addColorStop(0.88, '#3b6ab5');
      grad.addColorStop(0.97, '#679be2'); // morning atmosphere
      grad.addColorStop(1, '#94c2f2');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth.current, canvasHeight.current);

      // Render floating stars or dust
      particlesAr.current.forEach((pt) => {
        pt.y += pt.velY;
        if (pt.y < 0) pt.y = canvasHeight.current - 100;
        
        ctx.fillStyle = 'rgba(255, 255, 255, ' + pt.alpha + ')';
        ctx.beginPath();
        const flicker = pt.raio * (0.85 + Math.sin(Date.now() * pt.frequencia) * 0.15);
        ctx.arc(pt.x, pt.y, flicker, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render drifting clouds
      clouds.current.forEach((cloud) => {
        cloud.x += cloud.vel;
        if (cloud.x - 170 * cloud.scale > canvasWidth.current) {
          cloud.x = -170 * cloud.scale;
        }

        ctx.save();
        ctx.translate(cloud.x, cloud.y);
        ctx.scale(cloud.scale, cloud.scale);
        ctx.globalAlpha = cloud.opacity;

        // Shadow backing
        ctx.fillStyle = 'rgba(12, 22, 51, 0.45)';
        desenharSilhuetaNuvem(ctx, 0, 5, 42);

        // Clod body
        const gradCloud = ctx.createLinearGradient(0, -30, 0, 30);
        gradCloud.addColorStop(0, '#ffffff');
        gradCloud.addColorStop(1, '#aac8ee');
        ctx.fillStyle = gradCloud;
        desenharSilhuetaNuvem(ctx, 0, 0, 40);

        ctx.restore();
      });
      ctx.globalAlpha = 1.0;
    };

    const desenharSilhuetaNuvem = (ctx: CanvasRenderingContext2D, ox: number, oy: number, r: number) => {
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.arc(ox + r * 0.65, oy - r * 0.35, r * 0.75, 0, Math.PI * 2);
      ctx.arc(ox - r * 0.65, oy - r * 0.3, r * 0.65, 0, Math.PI * 2);
      ctx.arc(ox + r * 1.2, oy + r * 0.1, r * 0.45, 0, Math.PI * 2);
      ctx.arc(ox - r * 1.2, oy + r * 0.1, r * 0.45, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    };

    // Draw majestic stylized backdrop mountains
    const desenharMontanhasFase1 = (ctx: CanvasRenderingContext2D) => {
      const pFactor = 0.05; // parallax factor
      const offset = -(cameraX.current * pFactor);
      
      const peaks = [
        { x: -200, width: 850, height: 350, shadow: '#101c38', light: '#1d2f59' },
        { x: 500, width: 1050, height: 410, shadow: '#122040', light: '#223868' },
        { x: 1350, width: 900, height: 310, shadow: '#101c38', light: '#1d2f59' },
        { x: 2100, width: 1100, height: 380, shadow: '#122040', light: '#223868' },
      ];

      peaks.forEach((peak) => {
        let rx = (peak.x + offset) % (canvasWidth.current * 1.8);
        if (rx < -peak.width) rx += canvasWidth.current * 1.8 + peak.width;

        // Shadow side
        ctx.fillStyle = peak.shadow;
        ctx.beginPath();
        ctx.moveTo(rx, yChaoGlobal.current);
        ctx.lineTo(rx + peak.width / 2, yChaoGlobal.current - peak.height);
        ctx.lineTo(rx + peak.width, yChaoGlobal.current);
        ctx.closePath();
        ctx.fill();

        // High gloss solar reflection highlight (light side)
        ctx.fillStyle = peak.light;
        ctx.beginPath();
        ctx.moveTo(rx + peak.width / 2, yChaoGlobal.current - peak.height);
        ctx.lineTo(rx + peak.width * 0.72, yChaoGlobal.current);
        ctx.lineTo(rx + peak.width, yChaoGlobal.current);
        ctx.closePath();
        ctx.fill();
      });
    };

    // Medium distance hills and fir trees
    const desenharColinasFase1 = (ctx: CanvasRenderingContext2D) => {
      const pFactor = 0.16;
      const offset = -(cameraX.current * pFactor);

      ctx.fillStyle = '#0f2f19'; // Deep forest green
      ctx.beginPath();
      const wave = offset % canvasWidth.current;
      ctx.moveTo(wave - canvasWidth.current, canvasHeight.current);
      ctx.quadraticCurveTo(wave - canvasWidth.current * 0.5, yChaoGlobal.current - 180, wave, yChaoGlobal.current - 60);
      ctx.quadraticCurveTo(wave + canvasWidth.current * 0.5, yChaoGlobal.current - 150, wave + canvasWidth.current, yChaoGlobal.current - 50);
      ctx.quadraticCurveTo(wave + canvasWidth.current * 1.5, yChaoGlobal.current - 180, wave + canvasWidth.current * 2, yChaoGlobal.current - 60);
      ctx.lineTo(wave + canvasWidth.current * 2, canvasHeight.current);
      ctx.closePath();
      ctx.fill();

      // Draw stylized pine shadows along the hills (optimized to only visible on-screen area)
      ctx.fillStyle = '#0b2313';
      const step = 80;
      const startI = Math.floor((-offset - 100) / step) * step;
      const endI = Math.ceil((-offset + canvasWidth.current + 100) / step) * step;
      for (let i = startI; i <= endI; i += step) {
        const px = i + offset;
        const relativeX = i / canvasWidth.current;
        const py = yChaoGlobal.current - 90 + Math.sin(relativeX * Math.PI) * 45;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - 12, py + 35);
        ctx.lineTo(px + 12, py + 35);
        ctx.closePath();
        ctx.fill();
      }
    };

    // Main level background elements (houses, lamps, signs...)
    const desenharElementosFase1 = (ctx: CanvasRenderingContext2D) => {
      const pFactor = 0.45; // parallax factor for props
      const offset = -(cameraX.current * pFactor);

      // Objects with x locations relative to actual Phase 1
      const housesAndProps = [
        { type: 'house', x: 260 },
        { type: 'post', x: 740 },
        { type: 'tree', x: 1050, scale: 1.15 },
        { type: 'neon_sign', x: 1400, text: "VILA DOS ELÉTRONS" },
        { type: 'house', x: 1720 },
        { type: 'tree', x: 2350, scale: 0.95 },
      ];

      housesAndProps.forEach((prop) => {
        const dx = prop.x + offset;
        if (dx < -300 || dx > canvasWidth.current + 300) return;

        if (prop.type === 'house') {
          // Drop layout shadow
          ctx.fillStyle = 'rgba(5, 12, 28, 0.35)';
          ctx.beginPath();
          ctx.ellipse(dx + 90, yChaoGlobal.current, 110, 14, 0, 0, Math.PI * 2);
          ctx.fill();

          // House walls
          const wallGrad = ctx.createLinearGradient(dx, yChaoGlobal.current - 140, dx, yChaoGlobal.current);
          wallGrad.addColorStop(0, '#582b6b'); // techno-purple cottage
          wallGrad.addColorStop(1, '#2c103a');
          ctx.fillStyle = wallGrad;
          ctx.fillRect(dx, yChaoGlobal.current - 140, 180, 140);

          // Horizontal siding lines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1.5;
          for (let y = yChaoGlobal.current - 120; y < yChaoGlobal.current; y += 18) {
            ctx.beginPath();
            ctx.moveTo(dx, y);
            ctx.lineTo(dx + 180, y);
            ctx.stroke();
          }

          // Triangular Roof
          ctx.fillStyle = '#ec4899'; // vivid pink roof
          ctx.beginPath();
          ctx.moveTo(dx - 15, yChaoGlobal.current - 140);
          ctx.lineTo(dx + 90, yChaoGlobal.current - 198);
          ctx.lineTo(dx + 195, yChaoGlobal.current - 140);
          ctx.closePath();
          ctx.fill();

          // Roof shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.beginPath();
          ctx.moveTo(dx, yChaoGlobal.current - 140);
          ctx.lineTo(dx + 180, yChaoGlobal.current - 140);
          ctx.lineTo(dx + 90, yChaoGlobal.current - 110);
          ctx.closePath();
          ctx.fill();

          // Glowing cozy window
          ctx.fillStyle = '#fef08a';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.fillRect(dx + 30, yChaoGlobal.current - 90, 44, 44);
          ctx.shadowBlur = 0;

          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(dx + 30, yChaoGlobal.current - 90, 44, 44);
          ctx.beginPath();
          ctx.moveTo(dx + 52, yChaoGlobal.current - 90);
          ctx.lineTo(dx + 52, yChaoGlobal.current - 46);
          ctx.moveTo(dx + 30, yChaoGlobal.current - 68);
          ctx.lineTo(dx + 74, yChaoGlobal.current - 68);
          ctx.stroke();

          // Glowing blue modern door
          ctx.fillStyle = '#0e7490';
          ctx.fillRect(dx + 110, yChaoGlobal.current - 95, 42, 95);
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2;
          ctx.strokeRect(dx + 113, yChaoGlobal.current - 92, 36, 92);
        }

        if (prop.type === 'tree') {
          ctx.save();
          ctx.translate(dx, yChaoGlobal.current);
          ctx.scale(prop.scale || 1, prop.scale || 1);

          // Shadow
          ctx.fillStyle = 'rgba(5, 12, 28, 0.35)';
          ctx.beginPath();
          ctx.ellipse(35, 0, 50, 9, 0, 0, Math.PI * 2);
          ctx.fill();

          // Trunk
          const trunkGrad = ctx.createLinearGradient(15, -140, 50, 0);
          trunkGrad.addColorStop(0, '#5c4033');
          trunkGrad.addColorStop(1, '#2c1208');
          ctx.fillStyle = trunkGrad;

          ctx.beginPath();
          ctx.moveTo(22, 0);
          ctx.quadraticCurveTo(25, -60, 28, -140);
          ctx.lineTo(42, -140);
          ctx.quadraticCurveTo(45, -60, 48, 0);
          ctx.closePath();
          ctx.fill();

          // Segmented Foliage
          const layers = [
            { x: 35, y: -195, r: 65, color: '#14532d' },
            { x: 18, y: -165, r: 52, color: '#166534' },
            { x: 52, y: -165, r: 52, color: '#15803d' },
            { x: 35, y: -145, r: 42, color: '#22c55e' },
          ];

          layers.forEach((lyr) => {
            ctx.fillStyle = lyr.color;
            ctx.beginPath();
            ctx.arc(lyr.x, lyr.y, lyr.r, 0, Math.PI * 2);
            ctx.fill();
          });

          ctx.restore();
        }

        if (prop.type === 'post') {
          // Utility power lines pole
          ctx.fillStyle = 'rgba(5, 12, 28, 0.35)';
          ctx.beginPath();
          ctx.ellipse(dx, yChaoGlobal.current, 22, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          const poleGrad = ctx.createLinearGradient(dx - 5, yChaoGlobal.current - 190, dx + 5, yChaoGlobal.current);
          poleGrad.addColorStop(0, '#64748b');
          poleGrad.addColorStop(0.5, '#475569');
          poleGrad.addColorStop(1, '#1e293b');
          ctx.fillStyle = poleGrad;
          ctx.fillRect(dx - 5, yChaoGlobal.current - 190, 10, 190);

          // Horizontal wire beam support
          ctx.fillStyle = '#334155';
          ctx.fillRect(dx - 28, yChaoGlobal.current - 170, 56, 7);

          // Glowing blue power core cap
          ctx.fillStyle = '#22d3ee';
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(dx, yChaoGlobal.current - 190, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        if (prop.type === 'neon_sign') {
          ctx.fillStyle = '#475569';
          ctx.fillRect(dx - 3, yChaoGlobal.current - 110, 6, 110);

          ctx.fillStyle = '#060b13';
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 3;
          ctx.fillRect(dx - 90, yChaoGlobal.current - 145, 180, 40);
          ctx.strokeRect(dx - 90, yChaoGlobal.current - 145, 180, 40);

          // Outer visual glowing line
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 6;
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
          ctx.lineWidth = 1;
          ctx.strokeRect(dx - 86, yChaoGlobal.current - 141, 172, 32);
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(prop.text || '', dx, yChaoGlobal.current - 121);
        }
      });
    };

    // Draw interactive NPC floating sphere electrons
    const desenharNPCs = (ctx: CanvasRenderingContext2D) => {
      npcsRef.current.forEach((npc) => {
        const xD = npc.x - cameraX.current;
        npc.alturaFlutuacao = Math.sin(Date.now() * 0.003 + npc.id) * 7.5;
        const yD = yChaoGlobal.current - 60 + npc.alturaFlutuacao;

        if (xD < -100 || xD > canvasWidth.current + 100) return;

        ctx.save();
        ctx.translate(xD, yD);

        // Ground reflection shadow
        ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
        ctx.beginPath();
        const absoluteFloat = Math.abs(npc.alturaFlutuacao);
        ctx.ellipse(0, yChaoGlobal.current - yD, 22 - absoluteFloat * 0.45, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Neon Aura glow
        const glowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 36);
        glowGrad.addColorStop(0, 'rgba(0, 229, 255, 0.65)');
        glowGrad.addColorStop(0.35, 'rgba(0, 229, 255, 0.25)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fill();

        // White nucleus sphere
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();

        // Draw electron rings orbiting around the nucleus
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.save();
        ctx.rotate(Date.now() * 0.0022 + npc.id);
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Smiling face
        ctx.fillStyle = '#0a0f1d';
        ctx.beginPath();
        ctx.arc(-3, -2.5, 2, 0, Math.PI * 2);
        ctx.arc(3, -2.5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0f1d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 1.5, 3, 0, Math.PI);
        ctx.stroke();

        // Show proximity help tag '[E] INTERAGIR'
        const dist = Math.abs(playerRef.current.x - npc.x);
        if (dist < npc.raioColisao && !npc.interagido && !transicaoCinematica.current.ativa) {
          ctx.restore();
          ctx.save();
          ctx.translate(xD, yD - 44);

          ctx.fillStyle = 'rgba(6, 11, 25, 0.9)';
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 1.5;
          ctx.fillRect(-65, -23, 130, 26);
          ctx.strokeRect(-65, -23, 130, 26);

          ctx.fillStyle = 'rgba(6, 11, 25, 0.9)';
          ctx.beginPath();
          ctx.moveTo(-8, 3);
          ctx.lineTo(0, 9);
          ctx.lineTo(8, 3);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#00e5ff';
          ctx.beginPath();
          ctx.moveTo(-8, 3);
          ctx.lineTo(0, 9);
          ctx.lineTo(8, 3);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('PRESSIONE [E] / TOQUE', 0, -8);
        }

        ctx.restore();
      });
    };

    // Draw the aesthetic vacuum phone booth
    const desenharTelefoneMagico = (ctx: CanvasRenderingContext2D) => {
      telephoneMagico.current.y = yChaoGlobal.current - telephoneMagico.current.altura;
      const xD = telephoneMagico.current.x - cameraX.current;
      const yD = telephoneMagico.current.y;

      if (xD < -150 || xD > canvasWidth.current + 150) return;

      ctx.save();
      ctx.translate(xD, yD);

      // 1. Neon Aura pulsing
      const amplitudePulse = 1 + Math.sin(Date.now() * 0.005) * 0.12;
      const lightGrad = ctx.createRadialGradient(30, 55, 3, 30, 55, 55 * amplitudePulse);
      lightGrad.addColorStop(0, 'rgba(0, 242, 254, 0.35)');
      lightGrad.addColorStop(0.5, 'rgba(253, 224, 71, 0.12)');
      lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.arc(30, 55, 55 * amplitudePulse, 0, Math.PI * 2);
      ctx.fill();

      // 2. Cosmic Dark Cabin with glowing frame
      ctx.fillStyle = '#060a15';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(0, 0, 60, 110, 8);
      ctx.fill();
      ctx.stroke();

      // Yellow neon lattice window paneling
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.72)';
      ctx.lineWidth = 1.3;
      ctx.strokeRect(8, 14, 44, 25);
      ctx.strokeRect(8, 44, 44, 25);
      ctx.strokeRect(8, 74, 44, 25);

      // Lit-up top sign header block
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(15, -10, 30, 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('POWER', 30, -3);

      // 3. Floating spark particles
      if (Math.random() < 0.15) {
        telephoneMagico.current.particulas.push({
          x: 30 + (Math.random() * 40 - 20),
          y: 110,
          velY: -Math.random() * 1.5 - 0.4,
          alpha: 1,
          cor: Math.random() > 0.5 ? '#00e5ff' : '#facc15',
        });
      }

      telephoneMagico.current.particulas.forEach((p, idx) => {
        p.y += p.velY;
        p.alpha -= 0.015;
        if (p.alpha <= 0) {
          telephoneMagico.current.particulas.splice(idx, 1);
          return;
        }
        ctx.fillStyle = p.cor;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // 4. Proximity Help message bubble
      const distEinstein = Math.abs(playerRef.current.x - (telephoneMagico.current.x + 30));
      if (distEinstein < 75 && !transicaoCinematica.current.ativa) {
        ctx.restore();
        ctx.save();
        ctx.translate(xD + 30, yD - 35);

        const allNpcsInteracted = npcsRef.current.every(n => n.interagido);

        ctx.fillStyle = 'rgba(6, 11, 25, 0.95)';
        ctx.strokeStyle = allNpcsInteracted ? '#facc15' : '#f43f5e';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-70, -23, 140, 26);
        ctx.strokeRect(-70, -23, 140, 26);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';

        if (allNpcsInteracted) {
          ctx.fillText('ENTRE NA CABINE [E]', 0, -8);
        } else {
          ctx.fillStyle = '#fca5a5';
          ctx.fillText('FALE COM OS ELÉTRONS!', 0, -8);
        }
      }

      ctx.restore();
    };

    // Draw dynamic electric arcs connecting telephone to Einstein during suction
    const desenharRelampagosSuction = (ctx: CanvasRenderingContext2D) => {
      const tc = transicaoCinematica.current;
      if (!tc.ativa) return;

      const xT = telephoneMagico.current.x + 30 - cameraX.current;
      const yT = yChaoGlobal.current - 55;
      const xE = playerRef.current.x - cameraX.current;
      const yE = playerRef.current.y - 45;

      ctx.strokeStyle = '#00f2fe';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(xT, yT);

      const segments = 6;
      for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const px = xT + (xE - xT) * t + (Math.random() * 32 - 16);
        const py = yT + (yE - yT) * t + (Math.random() * 32 - 16);
        ctx.lineTo(px, py);
      }
      ctx.lineTo(xE, yE);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    // Render floor grass
    const desenharChaoFase1 = (ctx: CanvasRenderingContext2D) => {
      ctx.save();

      const tierraGrad = ctx.createLinearGradient(0, yChaoGlobal.current, 0, canvasHeight.current);
      tierraGrad.addColorStop(0, '#120d0b'); // Dark soil
      tierraGrad.addColorStop(1, '#020101');
      ctx.fillStyle = tierraGrad;
      ctx.fillRect(0, yChaoGlobal.current, canvasWidth.current, canvasHeight.current - yChaoGlobal.current);

      // Top green layer
      ctx.fillStyle = '#166534';
      ctx.fillRect(0, yChaoGlobal.current, canvasWidth.current, 8);

      // Render custom sementesGrama
      ctx.lineWidth = 2.2;
      const step = 22;
      const offsetChao = -cameraX.current % step;
      const startIndex = Math.floor(cameraX.current / step);

      for (let i = -24; i < canvasWidth.current + 24; i += step) {
        const indexAbsolute = Math.abs(startIndex + Math.floor((i + 24) / step));
        const sIdx = indexAbsolute % sementesGrama.current.length;
        const sG = sementesGrama.current[sIdx];
        if (!sG) continue;

        const px = i + offsetChao;
        ctx.strokeStyle = sG.cor;

        ctx.beginPath();
        ctx.moveTo(px, yChaoGlobal.current + 1);
        ctx.quadraticCurveTo(
          px + sG.offset * 0.5,
          yChaoGlobal.current - sG.altura * 0.55,
          px + sG.offset,
          yChaoGlobal.current - sG.altura
        );
        ctx.stroke();
      }

      ctx.restore();
    };

    // FASE 2: Renders dynamic electricity tunnel and moving particles
    const desenharFase2CeuEParticulas = (ctx: CanvasRenderingContext2D) => {
      // Cosmic black space with linear gradient aligned to Vibrant Palette
      const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight.current);
      grad.addColorStop(0, '#121030');
      grad.addColorStop(0.5, '#1E1B4B');
      grad.addColorStop(1, '#25215c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth.current, canvasHeight.current);

      // Glowing current vector wires running through background (Pink waves)
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.15)';
      ctx.lineWidth = 1.5;
      const elapsed = Date.now() * 0.001;
      for (let y = 100; y < canvasHeight.current; y += 120) {
        ctx.beginPath();
        for (let x = 0; x < canvasWidth.current; x += 30) {
          const waveY = y + Math.sin(x * 0.005 + elapsed + y) * 25;
          if (x === 0) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }

      // Small glowing electrons traveling at speed (Amber and Pink mixture)
      particlesAr.current.forEach((pt, idx) => {
        // Horizontal vector traveling
        pt.x -= 2.5; 
        if (pt.x < -10) pt.x = canvasWidth.current + 10;

        ctx.fillStyle = idx % 2 === 0 ? 'rgba(244, 63, 94, 0.45)' : 'rgba(253, 224, 71, 0.45)';
        ctx.beginPath();
        const floatY = pt.y + Math.sin(Date.now() * 0.004 + pt.frequencia * 100) * 12;
        ctx.arc(pt.x, floatY, pt.raio * 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // FASE 2: Render giant copper wires, resistors, batteries, lamp posts
    const desenharFase2Plataformas = (ctx: CanvasRenderingContext2D) => {
      plataformasFase2.current.forEach((plat) => {
        const xD = plat.x - cameraX.current;
        if (xD + plat.larg < -100 || xD > canvasWidth.current + 100) return;

        ctx.save();
        ctx.translate(xD, plat.y);

        if (plat.tipo === 'fio_condutor') {
          // Large copper tube
          const copperGrad = ctx.createLinearGradient(0, 0, 0, plat.alt);
          copperGrad.addColorStop(0, '#78350f'); // Dark bronze margins
          copperGrad.addColorStop(0.35, '#ea580c'); // Lighter shiny orange copper
          copperGrad.addColorStop(0.7, '#f97316');
          copperGrad.addColorStop(1, '#431407');
          ctx.fillStyle = copperGrad;
          ctx.fillRect(0, 0, plat.larg, plat.alt);

          // Glowing glowing electrical neon line in center
          ctx.fillStyle = '#06b6d4';
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 10;
          ctx.fillRect(0, plat.alt / 2 - 3, plat.larg, 6);
          ctx.shadowBlur = 0;
        }

        if (plat.tipo === 'resistor') {
          // Ceramic light green body with rounded rectangles
          ctx.fillStyle = '#cbd5e1'; // Grey sand ceramic
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(0, 0, plat.larg, plat.alt, 8);
          ctx.fill();
          ctx.stroke();

          // Resistance colored strips
          ctx.fillStyle = '#dc2626'; // Red stripe
          ctx.fillRect(35, 0, 10, plat.alt);
          ctx.fillStyle = '#ea580c'; // Orange stripe
          ctx.fillRect(70, 0, 10, plat.alt);
          ctx.fillStyle = '#1e293b'; // Black stripe
          ctx.fillRect(105, 0, 10, plat.alt);
          ctx.fillStyle = '#fbbf24'; // Gold safety stripe
          ctx.fillRect(145, 0, 10, plat.alt);
          
          // Terminal copper wire leads
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-15, plat.alt / 2 - 3, 15, 6);
          ctx.fillRect(plat.larg, plat.alt / 2 - 3, 15, 6);
        }

        if (plat.tipo === 'bateria') {
          // High-contrast deep blue and red generator module
          ctx.fillStyle = '#1e3a8a'; // Neg polo
          ctx.fillRect(0, 0, plat.larg / 2, plat.alt);
          ctx.fillStyle = '#b91c1c'; // Pos polo
          ctx.fillRect(plat.larg / 2, 0, plat.larg / 2, plat.alt);

          // Middle yellow neon separator strip
          ctx.fillStyle = '#eab308';
          ctx.fillRect(plat.larg / 2 - 3, 0, 6, plat.alt);

          // Marks and symbols
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('-', 30, plat.alt / 2 + 7);
          ctx.fillText('+', plat.larg - 30, plat.alt / 2 + 7);

          ctx.font = '9px monospace';
          ctx.fillText('GERADOR PILHA', plat.larg / 2, plat.alt - 8);
        }

        if (plat.tipo === 'lâmpada') {
          // Glass lamp bulb module
          ctx.fillStyle = '#475569';
          ctx.fillRect(0, plat.alt - 15, plat.larg, 15);

          const lampGlow = ctx.createLinearGradient(0, 0, 0, plat.alt - 15);
          lampGlow.addColorStop(0, 'rgba(253, 224, 71, 0.85)'); // bright yellow-gold
          lampGlow.addColorStop(1, 'rgba(6, 182, 212, 0.3)');
          ctx.fillStyle = lampGlow;
          ctx.fillRect(0, 0, plat.larg, plat.alt - 15);

          // Outer light socket rings
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(4, 4, plat.larg - 8, plat.alt - 23);
        }

        ctx.restore();
      });
    };

    const desenharPlacaSaida = (ctx: CanvasRenderingContext2D) => {
      const plX = 2650 - cameraX.current;
      const plY = yChaoGlobal.current - 190;
      
      ctx.save();
      
      // Draw posts
      ctx.fillStyle = '#4b5563'; // metal poles
      ctx.fillRect(plX + 25, plY + 110, 6, 80);
      ctx.fillRect(plX + 115, plY + 110, 6, 80);
      
      // Draw Board background
      const gradBoard = ctx.createLinearGradient(plX, plY, plX, plY + 110);
      gradBoard.addColorStop(0, '#111827');
      gradBoard.addColorStop(1, '#1e293b');
      ctx.fillStyle = gradBoard;
      ctx.strokeStyle = '#f43f5e'; // glowing red/pink
      ctx.lineWidth = 4;
      
      ctx.beginPath();
      ctx.roundRect(plX, plY, 150, 110, 12);
      ctx.fill();
      ctx.stroke();
      
      // Glowing green EXIT text
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('← SAÍDA', plX + 75, plY + 35);
      
      // Subtext
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px sans-serif';
      ctx.fillText('RETORNO À VILA', plX + 75, plY + 60);
      
      ctx.fillStyle = '#eab308';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('[ ENTRAR ]', plX + 75, plY + 85);
      
      ctx.restore();
    };

    // Draw the main character vector Al Einstein
    const desenharEinstein = (ctx: CanvasRenderingContext2D) => {
      const p = playerRef.current;
      const tc = transicaoCinematica.current;

      ctx.save();
      const xDraw = p.x - cameraX.current;
      const yDraw = p.y;

      ctx.translate(xDraw, yDraw);

      // Handle transitions
      if (tc.ativa) {
        ctx.rotate(tc.rotacaoEinstein);
        ctx.scale(tc.escalaEinstein * p.direcao, tc.escalaEinstein);
      } else {
        ctx.scale(p.direcao, 1);
      }

      // Anim values
      const osc = Math.sin(p.passoCiclo);
      const jumpOsc = !p.noChao ? p.velY * 0.05 : 0;

      const yHip = -30;
      const yShoulders = -68;
      const yHead = -88;

      // Draw shadow under player (hide during vacuum spin)
      if (!tc.ativa) {
        ctx.save();
        ctx.scale(p.direcao, 1);
        ctx.fillStyle = 'rgba(3, 6, 15, 0.38)';
        ctx.beginPath();
        const distFloor = Math.max(0, yChaoGlobal.current - p.y);
        const scaleShadow = Math.max(0.15, 1 - distFloor / 300);
        ctx.ellipse(0, yChaoGlobal.current - p.y, 25 * scaleShadow, 6 * scaleShadow, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw leg helper
      const drawLeg = (isInverted: boolean, color: string, offsetX: number) => {
        let angleHip = 0;
        let angleKnee = 0;

        if (p.estaAndando) {
          const step = isInverted ? -osc : osc;
          angleHip = -step * 0.52;
          angleKnee = step > 0 ? step * 0.48 : 0.08;
        } else {
          angleHip = isInverted ? -0.1 : 0.1;
          angleKnee = isInverted ? 0.05 : 0.12;
        }

        if (!p.noChao) {
          angleHip = isInverted ? -0.42 + jumpOsc : 0.12 + jumpOsc;
          angleKnee = isInverted ? 0.55 : 0.22;
        }

        ctx.save();
        ctx.translate(offsetX, yHip);
        ctx.rotate(angleHip);

        ctx.strokeStyle = color;
        ctx.lineWidth = 6.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 16);
        ctx.stroke();

        ctx.translate(0, 16);
        ctx.rotate(angleKnee);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 14);
        ctx.stroke();

        // Boot shoe
        ctx.strokeStyle = '#020202';
        ctx.lineWidth = 7.5;
        ctx.beginPath();
        ctx.moveTo(0, 13);
        ctx.lineTo(8, 13);
        ctx.stroke();

        ctx.restore();
      };

      // Draw arm helper
      const drawArm = (isInverted: boolean, color: string) => {
        let angleShoulder = 0;
        let angleElbow = 0.22;

        if (p.estaAndando) {
          const step = isInverted ? -osc : osc;
          angleShoulder = step * 0.4;
          angleElbow = step < 0 ? -step * 0.42 : 0.22;
        } else if (!p.noChao) {
          angleShoulder = -1.1 - jumpOsc;
          angleElbow = 0.45;
        }

        ctx.save();
        ctx.translate(isInverted ? -10 : 10, yShoulders + 6);
        ctx.rotate(angleShoulder);

        ctx.strokeStyle = color;
        ctx.lineWidth = 5.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 15);
        ctx.stroke();

        ctx.translate(0, 15);
        ctx.rotate(angleElbow);

        // Ivory white sleeve cuff
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(0, 2);
        ctx.stroke();

        // Skin hand
        ctx.strokeStyle = '#ffcc80';
        ctx.lineWidth = 4.8;
        ctx.beginPath();
        ctx.moveTo(0, 1);
        ctx.lineTo(0, 8);
        ctx.stroke();

        ctx.restore();
      };

      const windX = -p.velX * 0.65;
      const floatY = Math.sin(Date.now() * 0.012) * 1.5;

      // Einstein volumetric bushy white hair background
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(-15 + windX, yHead - 5 + floatY, 11, 0, Math.PI * 2);
      ctx.arc(-19 + windX, yHead + 5 + floatY, 10, 0, Math.PI * 2);
      ctx.arc(10 + windX, yHead - 8 + floatY, 9, 0, Math.PI * 2);
      ctx.arc(14 + windX, yHead + 4 + floatY, 8.5, 0, Math.PI * 2);
      ctx.arc(windX, yHead - 14 + floatY, 12, 0, Math.PI * 2);
      ctx.arc(-10 + windX, yHead - 12 + floatY, 11, 0, Math.PI * 2);
      ctx.arc(10 + windX, yHead - 12 + floatY, 10, 0, Math.PI * 2);
      ctx.fill();

      // Back leg & arm
      drawLeg(true, '#1e293b', -5);
      drawArm(true, '#94a3b8');

      // White buttoned formal suit jacket
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(-13, yHip + 2);
      ctx.lineTo(-12, yShoulders);
      ctx.lineTo(12, yShoulders);
      ctx.lineTo(13, yHip + 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#94a3b8'; // Lower jacket line
      ctx.fillRect(-12, yHip, 24, 4);

      // Red necktie
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-3.5, yShoulders);
      ctx.lineTo(3.5, yShoulders);
      ctx.lineTo(5, yShoulders + 16);
      ctx.lineTo(0, yShoulders + 23);
      ctx.lineTo(-5, yShoulders + 16);
      ctx.closePath();
      ctx.fill();

      // Dual lapels
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(-10, yShoulders);
      ctx.lineTo(-3, yShoulders + 18);
      ctx.lineTo(-12, yShoulders);
      ctx.moveTo(10, yShoulders);
      ctx.lineTo(3, yShoulders + 18);
      ctx.lineTo(12, yShoulders);
      ctx.closePath();
      ctx.fill();

      // Two dark chest buttons
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(0, yShoulders + 26, 2.5, 0, Math.PI * 2);
      ctx.arc(0, yShoulders + 36, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Front leg
      drawLeg(false, '#334155', 5);

      // Head skin
      ctx.fillStyle = '#ffcc80';
      ctx.fillRect(-5, yShoulders, 10, yShoulders - yHead);
      ctx.beginPath();
      ctx.arc(0, yHead, 11, 0, Math.PI * 2);
      ctx.fill();

      // Big bright inquisitive eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4, yHead - 3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(5, yHead - 3, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // High brows
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(1, yHead - 7);
      ctx.lineTo(7, yHead - 8);
      ctx.stroke();

      // Large curved nose
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(4, yHead + 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Fluffy white mustache
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4, yHead + 6, 5, 0, Math.PI * 2);
      ctx.arc(9, yHead + 7, 3.5, 0, Math.PI * 2);
      ctx.arc(0, yHead + 6, 4, 0, Math.PI * 2);
      ctx.fill();

      // Foreground front locks and hair streaks
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-8 + windX, yHead - 11 + floatY, 5, 0, Math.PI * 2);
      ctx.arc(6 + windX, yHead - 11 + floatY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-5 + windX, yHead - 16 + floatY);
      ctx.lineTo(-8 + windX, yHead - 22 + floatY);
      ctx.moveTo(4 + windX, yHead - 15 + floatY);
      ctx.lineTo(7 + windX, yHead - 21 + floatY);
      ctx.stroke();

      // Front arm
      drawArm(false, '#f8fafc');

      ctx.restore();
    };

    // Run active loop
    gameLoop();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [currentFase]);

  const toggleMobileKey = (direction: 'left' | 'right' | 'jump' | 'action', state: boolean) => {
    setMobileKeys(prev => ({ ...prev, [direction]: state }));
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* HUD overlays */}
      <canvas
        id="jogoCanvas"
        ref={canvasRef}
        className="block w-full h-full select-none outline-none overflow-hidden"
      />

      {/* On-Screen Mobile & Diagnostic joystick for easier controls in iFrame */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-950/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.4)] pointer-events-auto select-none">
        <div className="flex gap-2.5">
          <button
            onMouseDown={() => toggleMobileKey('left', true)}
            onMouseUp={() => toggleMobileKey('left', false)}
            onMouseLeave={() => toggleMobileKey('left', false)}
            onTouchStart={() => toggleMobileKey('left', true)}
            onTouchEnd={() => toggleMobileKey('left', false)}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold font-mono transition-all text-sm select-none touch-none ${
              mobileKeys.left 
                ? 'bg-[#00e5ff] border-[#00e5ff] text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)] scale-95' 
                : 'bg-slate-900/60 border-slate-700/60 text-slate-300'
            }`}
          >
            A
          </button>
          <button
            onMouseDown={() => toggleMobileKey('right', true)}
            onMouseUp={() => toggleMobileKey('right', false)}
            onMouseLeave={() => toggleMobileKey('right', false)}
            onTouchStart={() => toggleMobileKey('right', true)}
            onTouchEnd={() => toggleMobileKey('right', false)}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold font-mono transition-all text-sm select-none touch-none ${
              mobileKeys.right 
                ? 'bg-[#00e5ff] border-[#00e5ff] text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)] scale-95' 
                : 'bg-slate-900/60 border-slate-700/60 text-slate-300'
            }`}
          >
            D
          </button>
        </div>

        <div className="w-px h-8 bg-slate-800" />

        <div className="flex gap-2.5">
          <button
            onMouseDown={() => toggleMobileKey('jump', true)}
            onMouseUp={() => toggleMobileKey('jump', false)}
            onMouseLeave={() => toggleMobileKey('jump', false)}
            onTouchStart={() => toggleMobileKey('jump', true)}
            onTouchEnd={() => toggleMobileKey('jump', false)}
            className={`w-14 h-12 rounded-xl border flex flex-col items-center justify-center font-bold font-mono transition-all select-none touch-none ${
              mobileKeys.jump 
                ? 'bg-purple-500 border-purple-500 text-slate-950 shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-95' 
                : 'bg-slate-900/60 border-slate-700/60 text-slate-300'
            }`}
          >
            <span className="text-[10px] leading-none opacity-80">JUMP</span>
            <span className="text-xs">W</span>
          </button>

          {currentFase === 1 && (
            <button
              onMouseDown={() => toggleMobileKey('action', true)}
              onMouseUp={() => toggleMobileKey('action', false)}
              onMouseLeave={() => toggleMobileKey('action', false)}
              onTouchStart={() => toggleMobileKey('action', true)}
              onTouchEnd={() => toggleMobileKey('action', false)}
              className={`w-14 h-12 rounded-xl border flex flex-col items-center justify-center font-mono font-bold transition-all select-none touch-none ${
                mobileKeys.action 
                  ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-95' 
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-300'
              }`}
            >
              <span className="text-[10px] leading-none opacity-80">FALAR</span>
              <span className="text-xs">E</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
