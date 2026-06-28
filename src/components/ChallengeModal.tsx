import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NPC } from '../types';
import { CircuitRepair } from './CircuitRepair';
import { playGameSound } from '../utils/audio';
import { Cpu, CheckCircle2, AlertTriangle, Play, HelpCircle } from 'lucide-react';

interface ChallengeModalProps {
  npc: NPC | null;
  onSuccess: (scoreBonus: number) => void;
  onClose: () => void;
}

export function ChallengeModal({ npc, onSuccess, onClose }: ChallengeModalProps) {
  if (!npc) return null;

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showRepair, setShowRepair] = useState(false);
  const [repairComplete, setRepairComplete] = useState(false);

  const handleSelectOption = (index: number) => {
    if (selectedOption !== null) return; // Prevent double select
    setSelectedOption(index);
    setShowExplanation(true);

    if (index === npc.pergunta.correta) {
      playGameSound('acerto');
    } else {
      playGameSound('erro');
      // Show failure warning first, then show physical circuit repair
      setTimeout(() => {
        setShowRepair(true);
      }, 500);
    }
  };

  const isCorrect = selectedOption === npc.pergunta.correta;
  const canContinue = isCorrect || repairComplete;

  const handleContinue = () => {
    const scoreBonus = isCorrect ? 150 : 50; // lower score bonus if they errored but repaired
    onSuccess(scoreBonus);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1B4B]/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-[#312E81] border-2 border-[#4338CA] shadow-[0_4px_30px_rgba(67,56,202,0.4)] text-white flex flex-col max-h-[90vh]"
        >
          {/* Header Bar */}
          <div className="relative flex items-center justify-between border-b border-[#4338CA]/60 px-6 py-4 bg-indigo-950/40">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
              </span>
              <h2 className="text-xs tracking-[0.2em] font-mono text-pink-400 uppercase font-bold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-pink-400" />
                Comunicação Holográfica • {npc.nome}
              </h2>
            </div>
            <span className="text-[10px] font-mono text-yellow-400 bg-indigo-950/60 border border-[#4338CA]/50 px-2 py-0.5 rounded">
              Dificuldade: Média
            </span>
          </div>

          {/* Modal Body (Scrollable) */}
          <div className="p-6 overflow-y-auto space-y-6 max-h-[calc(90vh-140px)] select-text">
            {/* Question Text */}
            <div className="space-y-2">
              <p className="text-xs font-mono text-indigo-300 uppercase flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Desafio Conceitual
              </p>
              <h3 className="text-md sm:text-lg font-semibold leading-relaxed text-slate-100">
                {npc.pergunta.texto}
              </h3>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-1 gap-3">
              {npc.pergunta.opcoes.map((option, index) => {
                let btnStyle = 'border-[#4338CA] bg-[#1E1B4B]/40 text-indigo-150 hover:bg-pink-500/10 hover:border-pink-500 hover:text-white transition-all duration-200';
                let icon = null;

                if (selectedOption !== null) {
                  const isSelected = selectedOption === index;
                  const isThisCorrect = index === npc.pergunta.correta;

                  if (isThisCorrect) {
                     btnStyle = 'bg-emerald-950/30 border-emerald-500/70 text-emerald-400 font-medium shadow-[0_0_15px_rgba(16,185,129,0.15)]';
                    icon = <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />;
                  } else if (isSelected) {
                    btnStyle = 'bg-red-950/30 border-red-500/70 text-red-400 font-medium shadow-[0_0_15px_rgba(239,68,68,0.15)]';
                    icon = <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />;
                  } else {
                    btnStyle = 'opacity-40 border-[#4338CA]/30 bg-indigo-950/20 text-indigo-400 cursor-not-allowed';
                  }
                }

                return (
                  <button
                    key={index}
                    disabled={selectedOption !== null}
                    onClick={() => handleSelectOption(index)}
                    className={`flex items-start gap-3 w-full border rounded-xl p-4 text-left text-sm select-none cursor-pointer ${btnStyle}`}
                  >
                    <span className="font-mono text-xs text-pink-400 flex-shrink-0 bg-indigo-950/50 border border-[#4338CA]/60 w-6 h-6 rounded-md flex items-center justify-center font-bold">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-grow pt-0.5 leading-snug">{option}</span>
                    {icon}
                  </button>
                );
              })}
            </div>

            {/* Scientific Explanation section */}
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 border-l-4 rounded-r-xl text-xs sm:text-sm line-height-relaxed ${
                  isCorrect 
                    ? 'bg-emerald-950/20 border-emerald-500 text-emerald-100' 
                    : 'bg-indigo-950/35 border-pink-500 text-indigo-100'
                }`}
              >
                <h4 className="font-bold flex items-center gap-1.5 mb-1.5 uppercase tracking-wider text-xs font-mono text-yellow-300">
                  💡 Explicação Científica {isCorrect ? '• Excelente!' : '• Entenda o Conceito:'}
                </h4>
                <p className="leading-relaxed opacity-95">{npc.pergunta.explicacao}</p>
              </motion.div>
            )}

            {/* Broken Circuit Mini-game Section (Showed on Erro) */}
            {showRepair && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3"
              >
                <div className="bg-red-950/20 border border-red-900/60 rounded-xl p-4 text-xs text-red-200">
                  <p className="font-bold uppercase flex items-center gap-1.5 mb-1 text-red-400">
                    <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" /> Circuito Queimado!
                  </p>
                  <p>Sua resposta incorreta causou uma sobrecarga. O elétron guardião perdeu a conexão elétrica! Conecte os dois pólos de cobre para continuar a simulação.</p>
                </div>
                <CircuitRepair onSuccess={() => {
                  setRepairComplete(true);
                  playGameSound('sucesso');
                }} />
              </motion.div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-3 border-t border-[#4338CA]/60 px-6 py-4 bg-indigo-950/60">
            {canContinue ? (
              <motion.button
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleContinue}
                className="flex items-center gap-2 bg-pink-500 hover:bg-pink-400 text-white font-bold px-6 py-2.5 rounded-xl shadow-[0_4px_20px_rgba(244,63,94,0.4)] text-sm tracking-wide uppercase transition-all cursor-pointer"
              >
                Continuar Missão
                <Play className="w-4 h-4 fill-white text-white" />
              </motion.button>
            ) : (
              <div className="text-xs text-indigo-300 font-mono py-2 flex items-center gap-1">
                Aguardando conclusão do desafio...
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
