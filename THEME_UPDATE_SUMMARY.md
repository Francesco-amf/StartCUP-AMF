# StartCup AMF - Atualização de Tema Visual 🎨

## Visão Geral

Toda a plataforma foi redesenhada com a **paleta de cores oficial da logo StartCup AMF**, criando uma experiência visual coesa e moderna.

---

## Paleta de Cores StartCup

### Cores Primárias
- **Azul Muito Escuro**: `#001A4D` - Fundo principal
- **Azul Escuro**: `#0A1E47` - Variação de fundo
- **Azul**: `#0047AB` - Secundário

### Destaque Principal (Ciano/Turquesa)
- **Turquesa Brilhante**: `#00E5FF` - Cor primária de destaque
- **Turquesa Vibrante**: `#00D9FF` - Variação
- **Turquesa Suave**: `#00CCFF` - Subtil

### Cores de Estados
- **Sucesso**: `#00E676` ✅
- **Aviso**: `#FFC400` ⚠️
- **Erro**: `#FF3D00` ❌
- **Info**: `#00E5FF` ℹ️

---

## Arquivos Atualizados

### Tema e Estilos Globais
- ✅ `src/app/globals.css`
  - Adicionadas variáveis CSS StartCup
  - Utilitários de classe:
    - `.gradient-startcup` - Gradiente de fundo
    - `.gradient-startcup-accent` - Gradiente accent
    - `.btn-startcup-accent` - Botão com hover animado
    - `.card-startcup` - Card com estilo StartCup
    - `.glow-accent` - Efeito brilho
    - `.gradient-text-startcup` - Texto gradiente
    - `.badge-startcup` - Badge com tema
  - Customização de scrollbar com gradiente turquesa

- ✅ `src/lib/theme/colors.ts`
  - Arquivo de tipos TypeScript com paleta completa
  - Exportações para uso em componentes

### Páginas Atualizadas

1. **Login Page** - `src/app/(auth)/login/page.tsx`
   - Fundo: Gradiente azul escuro
   - Cartão: Semitransparente com borda turquesa
   - Título: Texto gradiente turquesa
   - Inputs: Estilo StartCup com focus turquesa
   - Labels: Cor turquesa
   - Decoração: Círculos de blur turquesa e azul

2. **Team Dashboard** - `src/app/(team)/dashboard/page.tsx`
   - Fundo: Gradiente StartCup
   - Cards: Bordas turquesa, backgrounds escuros
   - Textos principais: Turquesa
   - Status badges: Cores apropriadas (verde para sucesso)

3. **Live Dashboard** - `src/app/live-dashboard/page.tsx`
   - Fundo: Gradiente azul escuro a azul
   - Header: Background com transparência turquesa
   - Bordas: Turquesa com opacity controlada
   - Textos secundários: Turquesa suave

4. **Admin Control Panel** - `src/app/(admin)/control-panel/page.tsx`
   - Fundo: Gradiente StartCup
   - Cards de status: Turquesa brilhante
   - Textos: Turquesa em toda a página
   - Badges de status: Mantêm cores apropriadas

5. **Evaluator Pages** - `src/app/(evaluator)/evaluate/`
   - Fundo: Gradiente StartCup
   - Cards: Bordas turquesa
   - Títulos e labels: Turquesa
   - Inputs: Estilo consistente StartCup

---

## Componentes de UI Utilizando a Paleta

Todos os componentes de UI utilizam as variáveis CSS do tema:

- `Card` - Usa `--color-card` (azul escuro)
- `Button` - Usa `--color-accent` (turquesa)
- `Input` - Usa `--color-input` (transparente com borda turquesa)
- Badges, tooltips, etc. - Cores das variáveis globais

---

## Efeitos Visuais Implementados

### 1. **Glassmorphism**
```css
backdrop-filter: blur(10px);
background: rgba(10, 30, 71, 0.6);
```

### 2. **Glow Effects**
```css
box-shadow: 0 0 20px rgba(0, 229, 255, 0.3);
```

### 3. **Gradient Text**
```css
background: linear-gradient(135deg, #00D9FF 0%, #00E5FF 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

### 4. **Hover Animations**
```css
transition: all 0.3s ease;
transform: translateY(-2px);
```

### 5. **Scrollbar Customizada**
```css
background: linear-gradient(to bottom, #00D9FF, #00E5FF);
```

---

## Benefícios do Novo Tema

✅ **Identidade Visual Unificada**
- Toda a plataforma usa a paleta da logo oficial

✅ **Acessibilidade**
- Contraste de cores otimizado (turquesa sobre azul escuro)
- Textos bem legíveis

✅ **Modernidade**
- Efeitos glassmorphism e glow
- Gradientes suaves
- Animações elegantes

✅ **Consistência**
- Componentes reutilizáveis
- Variáveis CSS centralizadas
- Classe utilitárias padronizadas

✅ **Performance**
- Uso de CSS puro (sem shadows excessivos)
- Animações otimizadas
- GPU acceleration habilitada

---

## Guia de Uso para Novos Componentes

### Usar Classes Utilitárias

```html
<!-- Fundo StartCup -->
<div class="gradient-startcup">

<!-- Botão com destaque -->
<button class="btn-startcup-accent">Clique aqui</button>

<!-- Card com estilo -->
<div class="card-startcup">
  <!-- conteúdo -->
</div>

<!-- Texto gradiente -->
<h2 class="gradient-text-startcup">Título</h2>

<!-- Efeito glow -->
<span class="glow-accent">Destaque</span>
```

### Cores em Variáveis CSS

```css
background-color: var(--color-primary-darkest);  /* #001A4D */
color: var(--color-accent-bright);               /* #00E5FF */
border-color: var(--color-accent-vibrant);       /* #00D9FF */
```

### Importar Paleta no TypeScript

```typescript
import { startcupColors, colors } from '@/lib/theme/colors'

const accentColor = colors.accent  // #00E5FF
const bgDark = startcupColors.primary.dark  // #0A1E47
```

---

## Páginas Afetadas

- ✅ `/login` - Login page
- ✅ `/dashboard` - Team dashboard
- ✅ `/live-dashboard` - Live dashboard
- ✅ `/control-panel` - Admin panel
- ✅ `/evaluate` - Evaluator list
- ✅ `/evaluate/[submissionId]` - Evaluator detail
- ✅ `/` - Root (redireciona para login)

---

## Build Status

```
✓ Compiled successfully in 2.9s
✓ TypeScript: 0 erros
✓ 17 rotas geradas
✓ Pronto para produção
```

---

## Próximas Melhorias (Opcional)

- [ ] Adicionar tema dark/light toggle
- [ ] Criar tema customizado para diferentes eventos
- [ ] Adicionar animações de transição entre páginas
- [ ] Criar library de componentes estilizados
- [ ] Adicionar suporte a temas do usuário

---

## Referência de Cores Rápida

| Nome | Hex | Uso |
|------|-----|-----|
| Primary Darkest | #001A4D | Fundo principal |
| Primary Dark | #0A1E47 | Variação fundo |
| Primary Light | #0047AB | Secundário |
| Accent Bright | #00E5FF | **Destaque primário** |
| Accent Vibrant | #00D9FF | Hover/ativa |
| Accent Soft | #00CCFF | Suave |
| Success | #00E676 | Sucesso |
| Warning | #FFC400 | Aviso |
| Error | #FF3D00 | Erro |
| Info | #00E5FF | Informação |

---

**Data de Implementação:** Nov 1, 2025
**Status:** ✅ Completo e Testado
**Build Time:** 2.9s
**Zero TypeScript Errors:** ✅
