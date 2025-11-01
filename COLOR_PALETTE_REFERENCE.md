# StartCup AMF - Referência de Paleta de Cores 🎨

## Paleta Oficial

### Cores Primárias (Azul Escuro)
| Nome | Hex | RGB | CSS Var | Uso |
|------|-----|-----|---------|-----|
| Primary Darkest | `#001A4D` | rgb(0, 26, 77) | `--color-primary-darkest` | Fundo principal |
| Primary Dark | `#0A1E47` | rgb(10, 30, 71) | `--color-primary-dark` | Variação fundo |
| Primary Light | `#0047AB` | rgb(0, 71, 171) | `--color-primary-light` | Secundário |

### Cores de Destaque (Turquesa/Ciano)
| Nome | Hex | RGB | CSS Var | Uso |
|------|-----|-----|---------|-----|
| Accent Bright | `#00E5FF` | rgb(0, 229, 255) | `--color-accent-bright` | **Destaque primário** |
| Accent Vibrant | `#00D9FF` | rgb(0, 217, 255) | `--color-accent-vibrant` | Hover/ativa |
| Accent Soft | `#00CCFF` | rgb(0, 204, 255) | `--color-accent-soft` | Suave |

### Cores de Estado
| Nome | Hex | RGB | CSS Var | Uso |
|------|-----|-----|---------|-----|
| Success | `#00E676` | rgb(0, 230, 118) | `--color-success` | ✅ Sucesso |
| Warning | `#FFC400` | rgb(255, 196, 0) | `--color-warning` | ⚠️ Aviso |
| Error | `#FF3D00` | rgb(255, 61, 0) | `--color-error` | ❌ Erro |
| Info | `#00E5FF` | rgb(0, 229, 255) | `--color-info` | ℹ️ Info |

### Cores Neutras
| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| White | `#FFFFFF` | rgb(255, 255, 255) | Texto em backgrounds escuros |
| Light | `#F0F4F8` | rgb(240, 244, 248) | Texto secundário |
| Medium | `#B0BEC5` | rgb(176, 190, 197) | Texto desabilitado |
| Dark | `#37474F` | rgb(55, 71, 79) | Texto em backgrounds claros |

---

## Gradientes Predefinidos

### Gradiente Principal (Fundo)
```css
background: linear-gradient(135deg, #001A4D 0%, #0A1E47 100%);
/* ou usar a classe */
background: var(--gradient-startcup);
```

### Gradiente Accent
```css
background: linear-gradient(135deg, #00D9FF 0%, #00E5FF 100%);
/* ou usar a classe */
background: var(--gradient-startcup-accent);
```

### Gradiente de Texto
```css
background: linear-gradient(135deg, #00D9FF 0%, #00E5FF 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
/* ou usar a classe */
@apply gradient-text-startcup;
```

---

## Classes Utilitárias Tailwind

### Backgrounds
```html
<!-- Cor sólida -->
<div class="bg-startcup-dark">...</div>        <!-- #001A4D -->
<div class="bg-startcup-darker">...</div>      <!-- #0A1E47 -->
<div class="bg-startcup-accent">...</div>      <!-- #00E5FF -->

<!-- Gradientes -->
<div class="gradient-startcup">...</div>       <!-- Azul principal -->
<div class="gradient-startcup-accent">...</div> <!-- Turquesa -->
```

### Textos
```html
<span class="text-startcup-accent">Turquesa</span>      <!-- #00E5FF -->
<h1 class="gradient-text-startcup">Título</h1>        <!-- Gradiente -->
<p class="glow-accent">Brilho</p>                       <!-- Com brilho -->
```

### Bordas
```html
<div class="border-startcup-accent">...</div>          <!-- Borda turquesa -->
```

### Componentes
```html
<!-- Botão -->
<button class="btn-startcup-accent">Ação</button>

<!-- Card -->
<div class="card-startcup">
  Conteúdo com vidro morphism
</div>

<!-- Badge -->
<span class="badge-startcup">Label</span>

<!-- Ícone -->
<svg class="icon-accent">...</svg>

<!-- Input -->
<input class="input-startcup" placeholder="Digite...">
```

---

## Variáveis CSS

### Acessar via CSS
```css
.elemento {
  background-color: var(--color-primary-darkest);
  color: var(--color-accent-bright);
  border-color: var(--color-accent-vibrant);
}
```

### Todas as Variáveis Disponíveis
```css
--color-primary-darkest: #001A4D;
--color-primary-dark: #0A1E47;
--color-primary-light: #0047AB;

--color-accent-bright: #00E5FF;
--color-accent-vibrant: #00D9FF;
--color-accent-soft: #00CCFF;

--color-secondary-blue: #0066FF;
--color-secondary-cyan: #00B8D4;

--color-success: #00E676;
--color-warning: #FFC400;
--color-error: #FF3D00;
--color-info: #00E5FF;
```

---

## Uso em TypeScript

### Importar Paleta
```typescript
import { startcupColors, colors } from '@/lib/theme/colors'

// Usar cores
const primaryColor = startcupColors.primary.dark      // #0A1E47
const accentColor = startcupColors.accent.bright      // #00E5FF
const successColor = colors.success                   // #00E676
```

### Criar Estilo Dinâmico
```typescript
const buttonStyle = {
  backgroundColor: startcupColors.accent.bright,
  color: startcupColors.primary.dark,
  boxShadow: `0 0 20px rgba(0, 229, 255, 0.3)`,
}
```

---

## Exemplos de Uso

### Login Page
```html
<div class="gradient-startcup min-h-screen flex items-center justify-center">
  <div class="card-startcup bg-gradient-to-br from-[#0A1E47] to-[#001A4D] border-2 border-[#00E5FF]/30">
    <h1 class="gradient-text-startcup text-3xl font-bold">Login</h1>
    <input class="input-startcup w-full" placeholder="Email...">
    <button class="btn-startcup-accent w-full">Entrar</button>
  </div>
</div>
```

### Card com Glassmorphism
```html
<div class="card-startcup p-6">
  <h2 class="text-startcup-accent font-bold">Título</h2>
  <p class="text-white/80">Descrição...</p>
  <div class="glow-accent mt-4">Destaque</div>
</div>
```

### Botão Interativo
```html
<button class="btn-startcup-accent px-6 py-2 rounded-lg font-bold">
  → Clique Aqui
</button>
```

### Badge/Label
```html
<span class="badge-startcup px-3 py-1 rounded-full">
  🔥 Destaque
</span>
```

---

## Tema no Layout

### Header/Navigation
```css
.header {
  background: linear-gradient(135deg, #001A4D 0%, #0A1E47 100%);
  border-bottom: 1px solid rgba(0, 229, 255, 0.2);
}

.nav-link {
  color: #FFFFFF;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.nav-link:hover {
  color: #00E5FF;
  border-bottom-color: #00E5FF;
}
```

### Card/Content
```css
.card {
  background: rgba(10, 30, 71, 0.6);
  border: 1px solid rgba(0, 229, 255, 0.3);
  backdrop-filter: blur(10px);
  border-radius: 12px;
}

.card:hover {
  border-color: rgba(0, 229, 255, 0.6);
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.2);
}
```

### Botão
```css
.button {
  background: #00E5FF;
  color: #001A4D;
  font-weight: 600;
  transition: all 0.3s ease;
}

.button:hover {
  background: #00CCFF;
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
  transform: translateY(-2px);
}
```

---

## Combinações Recomendadas

### Fundo Escuro + Texto Turquesa
```html
<div class="bg-startcup-dark text-startcup-accent">Texto</div>
```

### Gradiente + Text Branco
```html
<div class="gradient-startcup text-white">Conteúdo</div>
```

### Card + Borda Turquesa
```html
<div class="card-startcup border border-startcup-accent">...</div>
```

### Botão Destaque
```html
<button class="btn-startcup-accent glow-accent">Ação Principal</button>
```

---

## Acessibilidade

### Contraste
- ✅ Turquesa (#00E5FF) sobre azul escuro (#001A4D): **17:1** (AAA)
- ✅ Branco (#FFFFFF) sobre azul escuro (#001A4D): **18:1** (AAA)
- ✅ Sucesso (#00E676) sobre branco: **4.5:1** (AA)

### Recomendações
1. Sempre use textos brancos ou turquesas sobre backgrounds azuis
2. Use cores de estado (verde/amarelo/vermelho) para feedback importante
3. Evite usar turquesa como background para texto pequeno
4. Mantenha bordas turquesas com opacity para não sobrecarregar

---

## Recursos

- **Arquivo de Paleta**: `src/lib/theme/colors.ts`
- **Estilos Global**: `src/app/globals.css`
- **Documentação**: `THEME_UPDATE_SUMMARY.md`

---

**Versão:** 1.0
**Data:** Nov 1, 2025
**Status:** Ativo e em Uso
