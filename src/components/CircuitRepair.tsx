import React, { useRef, useEffect, useState } from 'react';
import { playGameSound } from '../utils/audio';

interface CircuitRepairProps {
  onSuccess: () => void;
}

export function CircuitRepair({ onSuccess }: CircuitRepairProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [circuitoConsertado, setCircuitoConsertado] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Drag state
  const conector = useRef({
    x: 250,
    y: 110,
    largura: 65,
    altura: 20,
    cor: '#eab308', // pure gold / copper color
    arrastando: false,
    offsetX: 0,
    offsetY: 0
  });

  const poloEsquerdo = { x: 130, y: 55, raio: 9 };
  const poloDireito = { x: 370, y: 55, raio: 9 };
  const zonaAlvo = { x: 250, y: 55, tolerancia: 18 };

  // For electron flow animation when connected
  const [sparkleTicks, setSparkleTicks] = useState(0);

  useEffect(() => {
    let animationId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pulse loop for glowing effects
    const tick = () => {
      setSparkleTicks(prev => (prev + 1) % 360);
      desenharMiniJogo(ctx, canvas);
      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [circuitoConsertado]);

  const desenharMiniJogo = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Deep technological space background
    ctx.fillStyle = '#1E1B4B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid effect background
    ctx.strokeStyle = 'rgba(67, 56, 202, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // 1. Draw connection wires (Conducting pathways) behind Battery/Bulb
    ctx.strokeStyle = '#121030'; // Uncharged dark wires
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    // From battery positive to target left terminal
    ctx.moveTo(100, 50);
    ctx.lineTo(poloEsquerdo.x, poloEsquerdo.y);

    // From right terminal to lamp
    ctx.moveTo(poloDireito.x, poloDireito.y);
    ctx.lineTo(410, 55);

    // Return current from lamp back to battery negative (coming from the left behind/into the generator)
    ctx.moveTo(420, 60);
    ctx.lineTo(420, 110);
    ctx.lineTo(15, 110);
    ctx.lineTo(15, 50);
    ctx.lineTo(25, 50);
    ctx.stroke();

    // Inside-wire current flow if repaired
    if (circuitoConsertado) {
      ctx.strokeStyle = '#f43f5e'; // Pink flow
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 12]);
      ctx.lineDashOffset = -sparkleTicks * 1.5;

      ctx.beginPath();
      ctx.moveTo(100, 50);
      ctx.lineTo(poloEsquerdo.x, poloEsquerdo.y);
      ctx.lineTo(poloDireito.x, poloDireito.y);
      ctx.lineTo(410, 55);
      ctx.moveTo(420, 60);
      ctx.lineTo(420, 110);
      ctx.lineTo(15, 110);
      ctx.lineTo(15, 50);
      ctx.lineTo(25, 50);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash
    }

    // 2. Draw Battery (Gerador)
    ctx.fillStyle = '#312E81'; // Deep indigo battery base
    ctx.fillRect(20, 25, 70, 50);

    // Terminal ring
    ctx.fillStyle = '#f43f5e'; // Pink positive cap
    ctx.fillRect(90, 40, 10, 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('+', 75, 55);
    ctx.fillText('-', 35, 55);
    ctx.font = '9px monospace';
    ctx.fillText('GERADOR', 55, 15);

    // 3. Draw Lightbulb (Consumidor)
    ctx.fillStyle = '#4338CA';
    ctx.fillRect(410, 48, 20, 16); // Lamp screw base
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(414, 64, 12, 4);

    // Draw glass bulb
    let gradVidro = ctx.createRadialGradient(420, 32, 2, 420, 32, 20);
    if (circuitoConsertado) {
      // Glow when connected
      gradVidro.addColorStop(0, '#fef08a');
      gradVidro.addColorStop(0.3, '#facc15');
      gradVidro.addColorStop(1, '#eab308');

      // Bulbs light rays
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.5)';
      ctx.lineWidth = 3;
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        ctx.beginPath();
        const rx1 = 420 + Math.cos(angle) * 25;
        const ry1 = 32 + Math.sin(angle) * 25;
        const rx2 = 420 + Math.cos(angle) * 36;
        const ry2 = 32 + Math.sin(angle) * 36;
        ctx.moveTo(rx1, ry1);
        ctx.lineTo(rx2, ry2);
        ctx.stroke();
      }
    } else {
      // Dark glass when broken
      gradVidro.addColorStop(0, '#312E81');
      gradVidro.addColorStop(1, '#1A1844');
    }
    ctx.fillStyle = gradVidro;
    ctx.beginPath();
    ctx.arc(420, 32, 17, 0, Math.PI * 2);
    ctx.fill();

    // 4. Terminals/Polos
    ctx.fillStyle = circuitoConsertado ? '#10b981' : '#f43f5e';
    ctx.shadowColor = circuitoConsertado ? '#10b981' : '#f43f5e';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(poloEsquerdo.x, poloEsquerdo.y, poloEsquerdo.raio, 0, Math.PI * 2);
    ctx.arc(poloDireito.x, poloDireito.y, poloDireito.raio, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw target visual line indicator (where the copper key should go)
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(poloEsquerdo.x, poloEsquerdo.y);
    ctx.lineTo(poloDireito.x, poloDireito.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Draw Conector (Copper Drag Key)
    const activeConector = conector.current;
    
    // Drop shadow glow for the draggable copper connector
    ctx.save();
    if (activeConector.arrastando) {
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 5;
    }
    
    // Draw the copper metal visual
    const gradientConector = ctx.createLinearGradient(
      activeConector.x - activeConector.largura / 2,
      activeConector.y - activeConector.altura / 2,
      activeConector.x + activeConector.largura / 2,
      activeConector.y + activeConector.altura / 2
    );
    gradientConector.addColorStop(0, '#f59e0b'); // Warm copper gold
    gradientConector.addColorStop(0.5, '#fbbf24'); // Lighter shine
    gradientConector.addColorStop(1, '#b45309'); // Dark bronze

    ctx.fillStyle = gradientConector;
    ctx.strokeStyle = activeConector.arrastando ? '#f43f5e' : '#d97706';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    // Round rect drawing compatibility
    const rx = activeConector.x - activeConector.largura / 2;
    const ry = activeConector.y - activeConector.altura / 2;
    const rw = activeConector.largura;
    const rh = activeConector.altura;
    ctx.roundRect(rx, ry, rw, rh, 5);
    ctx.fill();
    ctx.stroke();

    // Draw visual metal stripes in the center of the connector
    ctx.fillStyle = '#78350f';
    ctx.fillRect(activeConector.x - 12, activeConector.y - 7, 3, 14);
    ctx.fillRect(activeConector.x - 4, activeConector.y - 7, 3, 14);
    ctx.fillRect(activeConector.x + 4, activeConector.y - 7, 3, 14);

    ctx.restore();
  };

  const obterCoordenadas = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if ('touches' in event) {
      if (event.touches.length === 0) return { x: 0, y: 0 };
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    // Scale back to internal resolution [500, 150]
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    return { x, y };
  };

  const handleStart = (evt: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (circuitoConsertado) return;
    const pos = obterCoordenadas(evt);
    const active = conector.current;

    const dx = pos.x - active.x;
    const dy = pos.y - active.y;

    if (Math.abs(dx) < active.largura / 2 && Math.abs(dy) < active.altura / 2) {
      active.arrastando = true;
      active.offsetX = dx;
      active.offsetY = dy;
      playGameSound('clique');
    }
  };

  const handleMove = (evt: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const active = conector.current;
    if (!active.arrastando) return;

    // Prevent scrolling on mobile touch
    if ('touches' in evt) {
      if (evt.cancelable) evt.preventDefault();
    }

    const pos = obterCoordenadas(evt);
    active.x = Math.max(active.largura / 2, Math.min(500 - active.largura / 2, pos.x - active.offsetX));
    active.y = Math.max(active.altura / 2, Math.min(150 - active.altura / 2, pos.y - active.offsetY));

    // Check snapping
    const distFocoX = Math.abs(active.x - zonaAlvo.x);
    const distFocoY = Math.abs(active.y - zonaAlvo.y);

    if (distFocoX < zonaAlvo.tolerancia && distFocoY < zonaAlvo.tolerancia) {
      active.x = zonaAlvo.x;
      active.y = zonaAlvo.y;
      active.arrastando = false;
      setCircuitoConsertado(true);
      playGameSound('acerto');
      onSuccess();
    }
  };

  const handleEnd = () => {
    conector.current.arrastando = false;
  };

  return (
    <div id="circuit-repair-container" className="pt-2">
      <div 
        className={`relative max-w-full overflow-hidden rounded-xl border border-dashed transition-all duration-300 p-2 ${
          circuitoConsertado 
            ? 'bg-emerald-950/20 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
            : 'bg-[#1a1844]/40 border-pink-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between text-xs px-2 pb-2 gap-2">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${circuitoConsertado ? 'bg-emerald-500 animate-pulse' : 'bg-pink-500 animate-ping'}`} />
            <span className={`font-semibold tracking-wider uppercase ${circuitoConsertado ? 'text-emerald-400' : 'text-pink-450'}`}>
              {circuitoConsertado 
                ? 'CIRCUITO FECHADO: Corrente elétrica fluindo livremente!' 
                : 'ALERTA DE ROMPIMENTO: Arraste a barra para fechar a corrente!'}
            </span>
          </div>
          <span className="text-indigo-300 font-mono italic">Arraste a peça de cobre com o mouse/dedo</span>
        </div>
 
        <canvas
          id="canvas-punicao"
          ref={canvasRef}
          width={500}
          height={150}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="mx-auto block aspect-[500/150] w-full max-w-[500px] border border-[#4338CA] rounded-lg cursor-grab active:cursor-grabbing shadow-inner touch-none bg-[#1E1B4B]"
        />
      </div>
    </div>
  );
}
