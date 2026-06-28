export interface Question {
  texto: string;
  opcoes: string[];
  correta: number;
  explicacao: string;
}

export interface NPC {
  id: number;
  nome: string;
  x: number;
  y: number;
  alturaFlutuacao: number;
  raioColisao: number;
  interagido: boolean;
  pergunta: Question;
}

export interface Einstein {
  x: number;
  y: number;
  velX: number;
  velY: number;
  largura: number;
  altura: number;
  noChao: boolean;
  direcao: number;
  passoCiclo: number;
  estaAndando: boolean;
}

export interface Cloud {
  x: number;
  y: number;
  scale: number;
  vel: number;
  opacity: number;
}

export interface Particle {
  x: number;
  y: number;
  raio: number;
  velY: number;
  alpha: number;
  frequencia: number;
}

export interface Platform {
  x: number;
  y: number;
  larg: number;
  alt: number;
  tipo: 'fio_condutor' | 'resistor' | 'bateria' | 'lâmpada';
}

export interface Capanga {
  id: number;
  x: number;
  y: number;
  largura: number;
  altura: number;
  velX: number;
  direcao: number;
  patrulhaMinX: number;
  patrulhaMaxX: number;
  estaTonto: boolean;
  tontoTimer: number; // tick count
  derrotado: boolean;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  timeInSeconds: number;
  score: number;
  date: string;
}


