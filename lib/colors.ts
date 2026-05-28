export type Theme = 'dark' | 'light'

export const COLORS = {
  dark: {
    bg:         '#0a0a0a',
    bgDeep:     '#050505',
    cardMain:   '#0d0d0d',
    cardAlt:    '#1a1a1a',
    cardHover:  '#2a2a2a',
    text:       '#f5f5f0',
    textMuted:  '#888',
    textSub:    '#555',
    textFaint:  '#444',
    textGhost:  '#333',
    border:     '#1a1a1a',
    borderSub:  '#222',
    borderFaint:'#2a2a2a',
    accent:     '#FFE000',
  },
  light: {
    bg:         '#ffffff',
    bgDeep:     '#f8f8f8',
    cardMain:   '#f5f5f0',
    cardAlt:    '#eeeeee',
    cardHover:  '#e4e4e4',
    text:       '#0a0a0a',
    textMuted:  '#666',
    textSub:    '#888',
    textFaint:  '#999',
    textGhost:  '#bbb',
    border:     '#e0e0e0',
    borderSub:  '#d4d4d4',
    borderFaint:'#cccccc',
    accent:     '#FFE000',
  },
} as const

export type Colors = {
  bg: string; bgDeep: string; cardMain: string; cardAlt: string; cardHover: string
  text: string; textMuted: string; textSub: string; textFaint: string; textGhost: string
  border: string; borderSub: string; borderFaint: string; accent: string
}
export const getC = (theme: Theme): Colors => COLORS[theme]
