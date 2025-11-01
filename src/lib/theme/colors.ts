/**
 * StartCup AMF - Color Palette
 * Baseado na logo do evento
 */

export const startcupColors = {
  // Cores Primárias
  primary: {
    dark: '#001A4D',      // Azul muito escuro (fundo principal)
    base: '#0A1E47',      // Azul escuro (variação)
    light: '#0047AB',     // Azul
  },

  // Destaque Principal (Ciano/Turquesa)
  accent: {
    bright: '#00E5FF',    // Turquesa brilhante (primário)
    vibrant: '#00D9FF',   // Turquesa vibrante
    soft: '#00CCFF',      // Turquesa suave
  },

  // Cores de Suporte
  secondary: {
    blue: '#0066FF',      // Azul secundário
    cyan: '#00B8D4',      // Ciano suave
  },

  // Cores Neutras
  neutral: {
    white: '#FFFFFF',     // Branco puro
    light: '#F0F4F8',     // Cinza muito claro
    medium: '#B0BEC5',    // Cinza médio
    dark: '#37474F',      // Cinza escuro
  },

  // Cores de Estados
  states: {
    success: '#00E676',   // Verde (sucesso)
    warning: '#FFC400',   // Amarelo (aviso)
    error: '#FF3D00',     // Vermelho (erro)
    info: '#00E5FF',      // Ciano (info)
  },

  // Gradientes
  gradients: {
    primary: 'linear-gradient(135deg, #001A4D 0%, #0A1E47 100%)',
    accent: 'linear-gradient(135deg, #00D9FF 0%, #00E5FF 100%)',
    dark: 'linear-gradient(135deg, #001A4D 0%, #0047AB 100%)',
  },
};

// Aliases para uso mais conveniente
export const colors = {
  bg: {
    darkest: startcupColors.primary.dark,
    dark: startcupColors.primary.base,
    light: startcupColors.neutral.light,
    white: startcupColors.neutral.white,
  },
  text: {
    primary: startcupColors.neutral.white,
    secondary: startcupColors.neutral.light,
    dark: startcupColors.primary.dark,
  },
  accent: startcupColors.accent.bright,
  accentLight: startcupColors.accent.soft,
  success: startcupColors.states.success,
  warning: startcupColors.states.warning,
  error: startcupColors.states.error,
  info: startcupColors.states.info,
};
