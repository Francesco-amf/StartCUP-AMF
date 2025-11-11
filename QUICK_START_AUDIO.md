# 🎵 Quick Start - Audio System Guide

**Para usuários finais e desenvolvedores**

---

## ⚡ TL;DR

1. **Abra `/live-dashboard`**
2. **Você verá um banner amarelo:** "⚠️ Para ouvir sons, clique em qualquer lugar"
3. **Clique em qualquer lugar da página** (título, ranking, botão, etc)
4. **Banner fica verde:** "✅ Áudio autorizado - Sons estão ativos!"
5. **Pronto!** Sons tocam normalmente quando penalidades são aplicadas

---

## 📱 User Flow

### Primeiro Acesso (Sem Autorização)
```
Usuário abre /live-dashboard
         ↓
   [Banner Amarelo]
   🔇 Para ouvir sons, clique em qualquer lugar
         ↓
   Usuário clica em qualquer lugar
         ↓
   [Banner Verde]
   ✅ Áudio autorizado - Sons estão ativos!
         ↓
   Admin aplica penalidade
         ↓
   🔊 SOM TOCA IMEDIATAMENTE!
```

### Próximos Acessos (Mesma Sessão)
```
Usuário atualiza página ou volta
         ↓
   [Banner Amarelo] (novamente)
         ↓
   Clica
         ↓
   [Banner Verde]
         ↓
   Pronto novamente!
```

**Nota:** A autorização é POR SESSÃO do navegador, não permanente. Isso é uma política de segurança do navegador.

---

## 🎯 O Que Toca

### Penalidades
- **Evento:** Penalidade aplicada no admin
- **Som:** Buzina / Aviso (penalty.mp3)
- **Onde:** `/live-dashboard`
- **Latência:** ~1 segundo
- **Console Log:** `🔊 Penalidade nova detectada: Nome da Equipe`

### Mudanças de Ranking
- **Evento 1:** Time sobe no ranking
  - **Som:** Nota musical ascendente (ranking-up)
- **Evento 2:** Time desce no ranking
  - **Som:** Nota musical descendente (ranking-down)
- **Evento 3:** Time ganha coins
  - **Som:** Ding/Moeda (coins)
- **Onde:** `/live-dashboard`
- **Latência:** ~1 segundo

### Outros Sons
- **Quest Start/Complete:** Quando quests mudam
- **Avaliador Online/Offline:** Quando status de avaliadores muda
- **Fase Start:** Quando nova fase começa
- **Menu Interactions:** Feedback de UI

---

## 🔧 Para Desenvolvedores

### Usar o Sistema de Som

```typescript
import { useSoundSystem } from '@/lib/hooks/useSoundSystem'

function MeuComponente() {
  const { play } = useSoundSystem()

  const handleClick = () => {
    play('penalty') // Toca som de penalidade
    // ou
    play('coins')   // Toca som de coins
    // ou
    play('quest-complete') // Toca som de quest
  }

  return <button onClick={handleClick}>Fazer algo</button>
}
```

### Tipos de Sons Disponíveis

```typescript
type AudioFileType =
  | 'penalty'          // Buzina (arquivo)
  | 'ranking-up'       // Web Audio
  | 'ranking-down'     // Web Audio
  | 'coins'            // Web Audio
  | 'quest-start'      // Arquivo
  | 'quest-complete'   // Arquivo
  | 'phase-start'      // Arquivo
  | 'power-up'         // Web Audio
  | 'error'            // Web Audio
  | 'evaluator-online' // Web Audio
  | 'evaluator-offline'// Web Audio
  | 'menu-select'      // Web Audio
```

### Controlar Volume

```typescript
const { setVolume } = useSoundSystem()

// Volume 0-100
setVolume(50) // 50%
setVolume(75) // 75%
setVolume(100) // 100%
```

### Reproduzir Arquivo Customizado

```typescript
const { playFile } = useSoundSystem()

playFile('/sounds/my-sound.mp3')
```

### Sintetizar Som Customizado

```typescript
const { playSynth } = useSoundSystem()

playSynth({
  frequency: 440,      // Hz
  duration: 500,       // ms
  type: 'sine',        // 'sine', 'square', 'sawtooth', 'triangle'
  volume: 0.5          // 0-1
})
```

---

## 🐛 Troubleshooting

### "Não ouço nada"

**Passo 1:** O banner está amarelo ou verde?
- **Amarelo:** Você não clicou ainda. Clique em qualquer lugar!
- **Verde:** Vá para o Passo 2

**Passo 2:** O volume está ligado?
- Verificar volume do sistema
- Verificar volume do navegador (não está muted)
- Tentar aumentar volume

**Passo 3:** Som foi realmente aplicado?
- Abrir F12 (Developer Tools)
- Ir para aba "Console"
- Procurar mensagens que começam com 🔊 ou 🎵
- Se houver erro vermelho, ver Passo 4

**Passo 4:** Que erro vê?
- `NotAllowedError: play() failed...` → Banner amarelo! Clique para autorizar
- `Error loading audio: [arquivo]` → Arquivo não existe, contacte desenvolvedor
- Outro erro → Copiar erro completo e reportar

### "Penalidade aplicada mas não ouço som"

1. Checar se o banner está verde ✅
2. Checar se volume está ligado 🔊
3. Abrir console (F12) e procurar:
   - `📡 Buscando penalidades...` → Query funcionando
   - `✅ X penalidades encontradas` → Dados chegando
   - `🔊 Penalidade nova detectada` → Som foi acionado
4. Se nenhuma mensagem aparece, recarregar página

### "Banner não muda de cor ao clicar"

1. Tentar clicar em locais diferentes:
   - Título da página
   - Ranking board
   - Cards de times
   - Botões

2. Se nada funciona:
   - Abrir console (F12)
   - Procurar erro vermelho
   - Tentar em abas privadas/incógnito do navegador

---

## 📊 Checklist de Setup

### Para Usuários
- [ ] Abrir `/live-dashboard`
- [ ] Ver banner amarelo
- [ ] Clicar para autorizar (amarelo → verde)
- [ ] Ir para `/control-panel` (outra aba)
- [ ] Aplicar penalidade
- [ ] Voltar para `/live-dashboard`
- [ ] Ouvir som! 🔊

### Para Desenvolvedores
- [ ] Sistema rodando: `npm run dev`
- [ ] Live Dashboard aberto e autorizado
- [ ] Control Panel aberto em outra aba
- [ ] Console aberto (F12) para verificar logs
- [ ] Aplicar penalidade
- [ ] Verificar console para mensagens de som
- [ ] Ouvir som na aba de live-dashboard

### Para QA
- [ ] Banner aparece em primeira visita
- [ ] Banner é amarelo (aviso)
- [ ] Clique autoriza (verde)
- [ ] Som de penalidade toca
- [ ] Som de ranking-up toca
- [ ] Som de ranking-down toca
- [ ] Som de coins toca
- [ ] Volume pode ser ajustado
- [ ] Funciona em mobile (touch)
- [ ] Funciona em teclado (keydown)

---

## 🎮 Exemplos Práticos

### Exemplo 1: Testar Banner

```bash
1. npm run dev
2. http://localhost:3000/live-dashboard
3. Observar banner amarelo ⚠️
4. Clicar em qualquer lugar
5. Observar banner verde ✅
6. Sucesso!
```

### Exemplo 2: Testar Som de Penalidade

```bash
1. Aba 1: http://localhost:3000/live-dashboard
   - Ver banner amarelo
   - Clicar para autorizar
   - Ver banner verde

2. Aba 2: http://localhost:3000/control-panel
   - Clicar em "Aplicar Penalidade"
   - Preencher dados
   - Clicar em "Confirmar"

3. Volta Aba 1
   - Observar:
     * Penalidade aparece na lista
     * Som toca! 🔊
     * Console mostra: "🔊 Penalidade nova detectada"

4. Sucesso!
```

### Exemplo 3: Testar Ranking Sounds

```bash
1. Aba 1: http://localhost:3000/live-dashboard
   - Autorizar áudio (clicar)
   - Observar ranking inicial

2. Aba 2: http://localhost:3000/control-panel
   - Aplicar múltiplas penalidades:
     * Penalidade 1 para Time A → ranking-down
     * Penalidade 2 para Time B → ranking-up
     * Penalidade 3 para Time C → coins

3. Volta Aba 1
   - Observar:
     * Ranking muda
     * Sons diferentes tocam para cada mudança 🎵
     * Console mostra eventos

4. Sucesso!
```

---

## 📚 Documentação Relacionada

- [AUTOPLAY_POLICY_SOLUCAO.md](./AUTOPLAY_POLICY_SOLUCAO.md) - Por que precisa clicar
- [AUDIO_AUTHORIZATION_BANNER.md](./AUDIO_AUTHORIZATION_BANNER.md) - Como funciona o banner
- [FINAL_STATUS_v2.5.md](./FINAL_STATUS_v2.5.md) - Status técnico completo
- [SOLUCAO_SONS_LIVE_DASHBOARD.md](./SOLUCAO_SONS_LIVE_DASHBOARD.md) - Evolução da feature

---

## 🆘 Suporte

**Problema não resolvido?**

1. Verificar documentação acima
2. Checar console para erros (F12)
3. Tentar em navegador diferente (Chrome, Firefox, Safari)
4. Tentar em modo incógnito
5. Limpar cache (Ctrl+Shift+Delete)
6. Reportar com:
   - Navegador e versão
   - Arquivo de console (F12 → Console → Copy All)
   - Passos para reproduzir

---

```
Quick Start v1.0
Status: ✅ READY
Audio System: ✅ WORKING
User Experience: ✅ CLEAR AND INTUITIVE

🎊 Aproveite os sons! 🎊
```
