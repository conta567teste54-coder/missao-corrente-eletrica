import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Zap, ShieldAlert, Swords, ArrowRight } from 'lucide-react';
import { playGameSound } from '../utils/audio';

interface BossActionGameProps {
  bossHp: number;
  onBossHpUpdate: (hp: number | ((prev: number) => number)) => void;
  onDefeated: () => void;
  cyberSuit?: string;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  isProton?: boolean;
}

export function BossActionGame({
  bossHp,
  onBossHpUpdate,
  onDefeated,
  cyberSuit = 'CLASSIC',
}: BossActionGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keyboard references for smooth action movement inside battle
  const keys = useRef({ left: false, right: false, up: false, attack: false });
  const lastAttackTime = useRef(0);

  // Entities state inside battle loop
  const pX = useRef(150);
  const pY = useRef(250);
  const pVelY = useRef(0);
  const pNoChao = useRef(true);
  const pDir = useRef(1); // 1 = right, -1 = left
  const pSwingTimer = useRef(0); // For strike visual feedback
  const pPassoCiclo = useRef(0); // Animation cycle for legs movement

  // Boss state
  const bX = useRef(550);
  const bY = useRef(180);
  const bTargetY = useRef(180);
  const bFloatTimer = useRef(0);
  const bState = useRef<'HOVER' | 'PREPARE' | 'CHARGE' | 'RETURN'>('HOVER');
  const bStateTimer = useRef(0);
  const bChargeX = useRef(0);

  // Array of dynamic particles and projectiles
  const projectiles = useRef<Projectile[]>([]);
  const particles = useRef<Particle[]>([]);

  // Screen shake visual feedback
  const screenShake = useRef(0);

  // Dimensions
  const canvasWidth = useRef(800);
  const canvasHeight = useRef(400);

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        canvasWidth.current = Math.max(width, 600);
        canvasHeight.current = Math.max(height, 200);
        canvas.width = canvasWidth.current;
        canvas.height = canvasHeight.current;

        // Reposition entities based on dimensions
        if (pY.current > canvasHeight.current - 100) {
          pY.current = canvasHeight.current - 120;
        }
        if (bX.current > canvasWidth.current - 100) {
          bX.current = canvasWidth.current - 150;
        }
      }
    });

    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || key === 'arrowleft') keys.current.left = true;
      if (key === 'd' || key === 'arrowright') keys.current.right = true;
      if (key === 'w' || key === 'arrowup' || e.key === ' ') keys.current.up = true;
      if (key === 'e') {
        keys.current.attack = true;
        dispararProton();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || key === 'arrowleft') keys.current.left = false;
      if (key === 'd' || key === 'arrowright') keys.current.right = false;
      if (key === 'w' || key === 'arrowup' || e.key === ' ') keys.current.up = false;
      if (key === 'e') keys.current.attack = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [bossHp]);

  // Spawn visual protons
  const dispararProton = () => {
    const now = Date.now();
    if (now - lastAttackTime.current < 200) return; // Attack speed limit
    lastAttackTime.current = now;

    pSwingTimer.current = 10; // Trigger physical wand swinging motion
    playGameSound('pulo'); // Fun sci-fi launch sound

    // Create projectile right at Dr. Einstein's wand location
    const wX = pX.current + 35 * pDir.current;
    const wY = pY.current - 18;

    projectiles.current.push({
      x: wX,
      y: wY,
      vx: 12 * pDir.current,
      vy: (Math.random() - 0.5) * 1.5, // Subtle spread
      radius: 8,
      angle: 0,
    });

    // Sparkles at muzzle location
    for (let i = 0; i < 6; i++) {
      particles.current.push({
        x: wX,
        y: wY,
        vx: (Math.random() * 4 + 2) * pDir.current,
        vy: (Math.random() - 0.5) * 4,
        color: i % 2 === 0 ? '#00e5ff' : '#eab308',
        size: Math.random() * 4 + 2,
        life: 0,
        maxLife: 20 + Math.random() * 20,
      });
    }
  };

  // Run internal game engine frame physics and rendering
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gravity = 0.5;
    const jumpPower = -12;
    const speed = 4;
    const floorY = () => canvasHeight.current - 70;

    const updatePhysics = () => {
      // Einstein physical updates
      if (keys.current.left) {
        pX.current = Math.max(40, pX.current - speed);
        pDir.current = -1;
        pPassoCiclo.current += 0.2;
      }
      if (keys.current.right) {
        pX.current = Math.min(canvasWidth.current * 0.65, pX.current + speed);
        pDir.current = 1;
        pPassoCiclo.current += 0.2;
      }

      // Physics logic for jumping
      if (pNoChao.current) {
        if (keys.current.up) {
          pVelY.current = jumpPower;
          pNoChao.current = false;
        }
      } else {
        pVelY.current += gravity;
        pY.current += pVelY.current;
        if (pY.current >= floorY() - 40) {
          pY.current = floorY() - 40;
          pVelY.current = 0;
          pNoChao.current = true;
        }
      }

      if (pSwingTimer.current > 0) {
        pSwingTimer.current--;
      }

      // Screen shaking recovery 
      if (screenShake.current > 0) {
        screenShake.current -= 0.15;
        if (screenShake.current < 0) screenShake.current = 0;
      }

      // Update Boss AI (Chefão Eletronildo)
      bFloatTimer.current += 0.05;
      const hoverBaseY = floorY() - 160;

      if (bossHp > 0) {
        if (bState.current === 'HOVER') {
          // Hover and float smoothly
          bTargetY.current = hoverBaseY + Math.sin(bFloatTimer.current) * 35;
          bY.current += (bTargetY.current - bY.current) * 0.05;
          // Float drift horizontal
          const targetX = canvasWidth.current - 160 + Math.cos(bFloatTimer.current * 0.5) * 40;
          bX.current += (targetX - bX.current) * 0.03;

          bStateTimer.current++;
          if (bStateTimer.current > 180) { // Every 3 seconds prepare charge
            bState.current = 'PREPARE';
            bStateTimer.current = 0;
          }
        } else if (bState.current === 'PREPARE') {
          // Warning state: Vibrating slightly and charging up color
          bStateTimer.current++;
          bX.current += (Math.random() - 0.5) * 4;
          bY.current += (Math.random() - 0.5) * 4;

          if (bStateTimer.current > 45) { // 0.75 seconds to charge
            bState.current = 'CHARGE';
            bStateTimer.current = 0;
            // Charge target points Einstein position
            bChargeX.current = pX.current;
            playGameSound('erro'); // alert noise
          }
        } else if (bState.current === 'CHARGE') {
          // Fast charge zoom!
          const speedCharge = 14;
          bX.current -= speedCharge;
          // Slowly move towards Einstein's y
          bY.current += (pY.current - bY.current) * 0.1;

          // Check hit against Einstein
          const distToPlayer = Math.hypot(bX.current - pX.current, bY.current - pY.current);
          if (distToPlayer < 75) {
            // Smash player! Cause screenshake
            screenShake.current = 7;
            playGameSound('erro');
            // Bounce player slightly as impact
            pVelY.current = -5;
            pNoChao.current = false;
            pX.current = Math.max(40, pX.current - 80);

            // Transition boss back
            bState.current = 'RETURN';
            bStateTimer.current = 0;
          }

          // If missed or charged far left, return
          if (bX.current < 40 || bX.current < bChargeX.current - 50) {
            bState.current = 'RETURN';
            bStateTimer.current = 0;
          }
        } else if (bState.current === 'RETURN') {
          // Return cleanly to home base on the right
          const homeX = canvasWidth.current - 160;
          bX.current += (homeX - bX.current) * 0.06;
          bY.current += (hoverBaseY - bY.current) * 0.06;

          if (Math.abs(bX.current - homeX) < 15) {
            bState.current = 'HOVER';
            bStateTimer.current = 0;
          }
        }
      } else {
        // Fall down or float away if defeated
        bY.current += 1.5;
        bX.current += 0.5;
      }

      // Update Projectiles
      const activeProjs: Projectile[] = [];
      projectiles.current.forEach(proj => {
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.angle += 0.1;

        // Left/Right out of bounds deletion
        let alive = proj.x > 0 && proj.x < canvasWidth.current + 50;

        // Collision detection with Chefão Eletronildo (Giant Red Electron)
        if (bossHp > 0) {
          const distToBoss = Math.hypot(proj.x - bX.current, proj.y - bY.current);
          const hitRadius = 75; // Boss is large!
          if (distToBoss < hitRadius) {
            alive = false; // Destroy proton

            // Sensation hit particles feedback
            for (let i = 0; i < 18; i++) {
              particles.current.push({
                x: proj.x,
                y: proj.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                color: i % 3 === 0 ? '#00e5ff' : i % 3 === 1 ? '#ef4444' : '#eab308',
                size: Math.random() * 6 + 3,
                life: 0,
                maxLife: 30 + Math.random() * 20,
              });
            }

            // Damage update back
            onBossHpUpdate(prev => {
              const next = Math.max(0, prev - 10);
              if (next <= 0) {
                // Defeated! Spawn grand explosion particles
                setTimeout(() => {
                  onDefeated();
                }, 1200);
              }
              return next;
            });

            playGameSound('acerto');
            screenShake.current = 3;
          }
        }

        if (alive) activeProjs.push(proj);
      });
      projectiles.current = activeProjs;

      // Update Particles
      const activeParts: Particle[] = [];
      particles.current.forEach(part => {
        part.x += part.vx;
        part.y += part.vy;
        part.vx *= 0.95; // Drag friction
        part.vy *= 0.95;
        part.life++;

        if (part.life < part.maxLife) {
          activeParts.push(part);
        }
      });
      particles.current = activeParts;
    };

    const renderFrame = () => {
      ctx.save();

      // Clear with background color and screen shake displacement
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvasWidth.current, canvasHeight.current);

      if (screenShake.current > 0) {
        const dx = (Math.random() - 0.5) * screenShake.current;
        const dy = (Math.random() - 0.5) * screenShake.current;
        ctx.translate(dx, dy);
      }

      // Draw starry galaxy ambient backing
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let i = 0; i < 30; i++) {
        const sx = (Math.sin(i * 99) * 0.5 + 0.5) * canvasWidth.current;
        const sy = (Math.cos(i * 142) * 0.5 + 0.5) * canvasHeight.current;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Draw neon copper wire platforms (Ground)
      const fY = floorY();
      ctx.strokeStyle = '#ea580c'; // electrical copper styling
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(0, fY);
      ctx.lineTo(canvasWidth.current, fY);
      ctx.stroke();

      ctx.strokeStyle = '#eab308'; // inner hot electrical gold
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, fY);
      ctx.lineTo(canvasWidth.current, fY);
      ctx.stroke();

      // Draw Dr. Einstein (Player Hero)
      const pX_pos = pX.current;
      const pY_pos = pY.current;

      ctx.save();
      // Translate to the foot anchor on the ground
      ctx.translate(pX_pos, pY_pos + 40);
      
      if (pDir.current === -1) {
        ctx.scale(-1, 1);
      }

      // Anim values
      const osc = Math.sin(pPassoCiclo.current);
      const jumpOsc = !pNoChao.current ? pVelY.current * 0.05 : 0;

      const yHip = -30;
      const yShoulders = -68;
      const yHead = -88;

      // Draw leg helper
      const drawLeg = (isInverted: boolean, color: string, offsetX: number) => {
        let angleHip = 0;
        let angleKnee = 0;

        const estaAndando = keys.current.left || keys.current.right;
        if (estaAndando) {
          const step = isInverted ? -osc : osc;
          angleHip = -step * 0.52;
          angleKnee = step > 0 ? step * 0.48 : 0.08;
        } else {
          angleHip = isInverted ? -0.1 : 0.1;
          angleKnee = isInverted ? 0.05 : 0.12;
        }

        if (!pNoChao.current) {
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

        const estaAndando = keys.current.left || keys.current.right;
        if (estaAndando) {
          const step = isInverted ? -osc : osc;
          angleShoulder = step * 0.4;
          angleElbow = step < 0 ? -step * 0.42 : 0.22;
        } else if (!pNoChao.current) {
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

      const windX = 0; // standard wind
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

      // Suits configuration (classic grey, cyber or gold)
      let suitColor = '#f8fafc'; // White beautiful jacket
      let lapelColor = '#cbd5e1';
      let buttonColor = '#334155';

      if (cyberSuit === 'CYBER') {
        suitColor = '#06b6d4';
        lapelColor = '#22d3ee';
      } else if (cyberSuit === 'GOLD') {
        suitColor = '#eab308';
        lapelColor = '#facc15';
      }

      // Suit jacket
      ctx.fillStyle = suitColor;
      ctx.beginPath();
      ctx.moveTo(-13, yHip + 2);
      ctx.lineTo(-12, yShoulders);
      ctx.lineTo(12, yShoulders);
      ctx.lineTo(13, yHip + 2);
      ctx.closePath();
      ctx.fill();

      // Lower jacket line
      ctx.fillStyle = lapelColor;
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
      ctx.fillStyle = buttonColor;
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
      drawArm(false, suitColor);

      // The Bastão de Prótons (Proton Rod)
      ctx.save();
      // Rotation animation during swing input
      const swingAngle = pSwingTimer.current > 0 ? (pSwingTimer.current / 10) * Math.PI * 0.45 : 0;
      ctx.translate(14, yShoulders + 10);
      ctx.rotate(-Math.PI * 0.15 + swingAngle);

      // Rod handle
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-3, -25, 6, 30);
      
      // Rod golden core head (+) with glowing spark aura
      const auraPulse = Math.sin(Date.now() / 80) * 4 + 14;
      const gradHead = ctx.createRadialGradient(0, -28, 2, 0, -28, auraPulse);
      gradHead.addColorStop(0, '#eab308');
      gradHead.addColorStop(0.4, '#00e5ff');
      gradHead.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = gradHead;
      ctx.beginPath();
      ctx.arc(0, -28, auraPulse, 0, Math.PI * 2);
      ctx.fill();

      // Solid inner golden star base 
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -28, 6, 0, Math.PI * 2);
      ctx.fill();

      // Positive Plus Label (+) inside Einstein's wand
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', 0, -28);

      ctx.restore(); // Rod
      ctx.restore(); // Einstein

      // Draw CHEFÃO ELETRONILDO (The Giant Red Electron)
      const bX_pos = bX.current;
      const bY_pos = bY.current;

      ctx.save();
      ctx.translate(bX_pos, bY_pos);

      // Color interpolation ratio based on boss HP
      // 0 = Full health (Red, Angry), 1 = Defeated (Light Blue/Cyan, Tamed)
      const ratio = Math.max(0, Math.min(1, (100 - bossHp) / 100));

      const mixColor = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number, f: number) => {
        const r = Math.round(r1 + (r2 - r1) * f);
        const g = Math.round(g1 + (g2 - g1) * f);
        const b = Math.round(b1 + (b2 - b1) * f);
        return `rgb(${r}, ${g}, ${b})`;
      };

      const mixColorAlpha = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number, f: number, alpha: number) => {
        const r = Math.round(r1 + (r2 - r1) * f);
        const g = Math.round(g1 + (g2 - g1) * f);
        const b = Math.round(b1 + (b2 - b1) * f);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      // Glow backing representation intense negative electricity
      const shieldGlow = Math.abs(Math.sin(Date.now() / 150)) * 25 + 50;
      const gradGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, shieldGlow);
      
      // Undamaged red/yellow glow vs Tamed light-blue/cyan glow
      let rGlow = 239, gGlow = 68, bGlow = 68;
      if (bState.current === 'PREPARE') {
        rGlow = 234; gGlow = 179; bGlow = 8;
      }
      // Target: Light Blue/Cyan (6, 182, 212)
      const colorGlowStart = mixColorAlpha(rGlow, gGlow, bGlow, 6, 182, 212, ratio, 0.45);
      const colorGlowMid = mixColorAlpha(rGlow === 234 ? 244 : 239, gGlow === 179 ? 63 : 68, bGlow === 8 ? 94 : 68, 6, 182, 212, ratio, 0.1);

      gradGlow.addColorStop(0, colorGlowStart);
      gradGlow.addColorStop(0.7, colorGlowMid);
      gradGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradGlow;
      ctx.beginPath();
      ctx.arc(0, 0, shieldGlow, 0, Math.PI * 2);
      ctx.fill();

      // Outer Metallic Shell structure ("Eletron Gigante e Vermelho" -> "Tamed Electron Ciano")
      const outerShellColor = mixColor(239, 68, 68, 6, 182, 212, ratio); // Red to Cyan
      ctx.fillStyle = outerShellColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner high gradient core reflecting lightning
      const gradCore = ctx.createLinearGradient(-35, -35, 35, 35);
      const innerCoreStart = mixColor(252, 165, 165, 207, 250, 254, ratio); // Light pink to light cyan
      const innerCoreMid = mixColor(220, 38, 38, 6, 182, 212, ratio); // Red to cian
      const innerCoreEnd = mixColor(127, 29, 29, 21, 94, 117, ratio); // Dark red to dark cian
      gradCore.addColorStop(0, innerCoreStart);
      gradCore.addColorStop(0.5, innerCoreMid);
      gradCore.addColorStop(1, innerCoreEnd);
      ctx.fillStyle = gradCore;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.fill();

      // Draw negative orbital symbols (-) rotating
      // They disappear one by one as the boss takes damage (Math.ceil(bossHp / 10))
      const numParticles = Math.ceil(bossHp / 10);
      ctx.lineWidth = 2.5;
      const strokeColorOrbit = mixColor(252, 165, 165, 207, 250, 254, ratio);
      ctx.strokeStyle = strokeColorOrbit;
      const rotSymbol = Date.now() / 600;
      
      for (let s = 0; s < numParticles; s++) {
        const sa = rotSymbol + (s * Math.PI * 2) / numParticles;
        // Keep them beautifully orbiting around
        const sx = Math.cos(sa) * 75;
        const sy = Math.sin(sa) * 25;
        
        const particleFillColor = mixColor(239, 68, 68, 6, 182, 212, ratio);
        ctx.fillStyle = particleFillColor;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw minus (-) inside orbital
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - 4, sy - 1, 8, 2);
      }

      // Draw giant electron eyes and angry eyebrows expressing challenge
      ctx.fillStyle = '#ffffff';
      // Left eye
      ctx.beginPath();
      ctx.ellipse(-16, -10, 8, 12, Math.PI * 0.1, 0, Math.PI * 2);
      ctx.fill();
      // Right eye
      ctx.beginPath();
      ctx.ellipse(16, -10, 8, 12, -Math.PI * 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Angry pupils
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-14, -8, 4, 0, Math.PI * 2);
      ctx.arc(14, -8, 4, 0, Math.PI * 2);
      ctx.fill();

      // Angry brows
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      // Left brow
      ctx.beginPath();
      ctx.moveTo(-24, -22);
      ctx.lineTo(-6, -14);
      ctx.stroke();
      // Right brow
      ctx.beginPath();
      ctx.moveTo(24, -22);
      ctx.lineTo(6, -14);
      ctx.stroke();

      // Wicked smile mouth showing negative electricity
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 10, 14, 0, Math.PI, false);
      ctx.stroke();

      // Massive (-) Electric Negative Mark sign clearly visible on forehead
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-15, -34, 30, 8); // White thick line represents minus

      ctx.restore(); // Boss

      // Draw Projectiles (+ protons glowing blue/indigo stars)
      projectiles.current.forEach(proj => {
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(proj.angle);

        // Core glow aura
        const glowOuter = Math.sin(Date.now() / 40) * 4 + 16;
        const radGlow = ctx.createRadialGradient(0, 0, 1, 0, 0, glowOuter);
        radGlow.addColorStop(0, '#00e5ff');
        radGlow.addColorStop(0.6, 'rgba(0, 229, 255, 0.45)');
        radGlow.addColorStop(1, 'rgba(0, 229, 255, 0)');
        ctx.fillStyle = radGlow;
        ctx.beginPath();
        ctx.arc(0, 0, glowOuter, 0, Math.PI * 2);
        ctx.fill();

        // White core body
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0052ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Plus (+) sign on projectile
        ctx.fillStyle = '#0052ff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', 0, 0.5);

        ctx.restore();
      });

      // Draw particles Sparkles
      particles.current.forEach(part => {
        ctx.save();
        ctx.globalAlpha = 1 - part.life / part.maxLife;
        ctx.fillStyle = part.color;
        ctx.fillRect(part.x - part.size / 2, part.y - part.size / 2, part.size, part.size);
        ctx.restore();
      });

      // Draw active instructions onscreen inside canvas
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(20, 20, 310, 32);
      ctx.strokeStyle = 'rgba(67, 56, 202, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(20, 20, 310, 32);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('⚡ DR. EINSTEIN ESTÁ ARMADO! ALVO: CHOCAR PRÓTONS (+)', 32, 40);

      ctx.restore();
    };

    const gameLoop = () => {
      updatePhysics();
      renderFrame();
      animId = requestAnimationFrame(gameLoop);
    };

    gameLoop();
    return () => cancelAnimationFrame(animId);
  }, [bossHp, cyberSuit]);

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Interactive Arena Wrapper */}
      <div 
        ref={containerRef} 
        className="w-full h-[220px] sm:h-[250px] md:h-[280px] border-2 border-[#4338CA]/70 bg-slate-950 rounded-2xl overflow-hidden shadow-2xl relative"
      >
        <canvas 
          ref={canvasRef} 
          className="block w-full h-full outline-none select-none touch-none" 
        />

        {/* Warning Indicator Overlay when boss preparing charge */}
        {bState.current === 'PREPARE' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500/10 border border-yellow-400 text-yellow-300 font-mono text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest animate-pulse flex items-center gap-1.5 shadow-md backdrop-blur-md pointer-events-none">
            <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
            Cuidado! Chefão Eletronildo preparando investida (-)!
          </div>
        )}

        {/* Victory/Defeat visual banner */}
        {bossHp === 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md text-center p-6 sm:p-8 animate-fade-in pointer-events-none">
            <span className="text-3xl leading-none">💥😵‍💫🦠</span>
            <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 uppercase tracking-tight mt-2 animate-bounce">
              ELETRONILDO NEUTRALIZADO!
            </h2>
            <p className="text-xs text-emerald-200 mt-1.5 max-w-sm">
              As cargas positivas do seu bastão neutralizaram o excesso eletrônico do vírus caótico! O caminho agora está aberto.
            </p>
          </div>
        )}
      </div>

      {/* Retro Combat Controller panel */}
      <div className="w-full max-w-xl bg-slate-900/90 border border-indigo-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl select-none">
        <div className="space-y-1 text-center md:text-left">
          <h4 className="text-xs font-bold font-mono text-indigo-300 uppercase flex items-center justify-center md:justify-start gap-1">
            <Swords className="w-3.5 h-3.5 text-pink-400" />
            VILA DOS ELETRONS CONTROLE
          </h4>
          <p className="text-[10px] text-slate-400">
            Use as teclas <b>Arrow</b> ou <b>A / D / W</b> para mover e pular. 
            Aperte a letra <b className="text-pink-400 uppercase">E</b> para atirar prótons (+)!
          </p>
        </div>

        {/* Large virtual buttons for comfortable action clicks inside the mobile frame */}
        <div className="flex gap-2.5 shrink-0">
          {/* Virtual manual joystick jump move */}
          <button
            onMouseDown={() => {
              keys.current.attack = true;
              dispararProton();
            }}
            onMouseUp={() => { keys.current.attack = false; }}
            onTouchStart={() => {
              keys.current.attack = true;
              dispararProton();
            }}
            onTouchEnd={() => { keys.current.attack = false; }}
            className="px-6 py-3 h-14 rounded-xl border border-pink-500 bg-pink-600/20 text-pink-400 hover:bg-pink-500 hover:text-white transition-all text-xs font-mono font-black uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer touch-none shadow-lg shadow-pink-500/10"
          >
            Atirar Prótons
            <span className="bg-pink-500/40 text-white rounded-md text-[9px] px-1.5 py-0.5">E</span>
          </button>
        </div>
      </div>
    </div>
  );
}
