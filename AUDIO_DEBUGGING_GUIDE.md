# 🔊 Guia de Debugging - Por Que os Sons Não Tocam

**Data:** 2025-11-12
**Status:** Investigação de problema de áudio

---

## 🎯 Resumo do Problema

Você relata:
> "Ativei fase 1 e não parte o som de event-start"

Já verificamos:
- ✅ Todos os arquivos de áudio existem em `/public/sounds`
- ✅ Código implementado corretamente em `CurrentQuestTimer.tsx`
- ✅ Logs console deveriam aparecer
- ✅ AudioManager está configurado com fila de prioridades
- ✅ Browser autorização já foi feita (você clicou)

---

## 🔍 Checklist de Diagnóstico (Você Deve Fazer Isso)

### Etapa 1: Abrir Developer Tools

1. Abra: http://localhost:3000/live-dashboard
2. Pressione **F12** para abrir Developer Tools
3. Vá para a aba **Console**

### Etapa 2: Verificar Mensagens de Autorização de Áudio

**Procure por:**
```
✅ Áudio autorizado automaticamente após interação do usuário
```

**Se NÃO aparecer:**
- O áudio ainda não foi autorizado
- Clique em qualquer lugar da página (qualquer lugar mesmo)
- Toque na tela (se mobile)
- Digite algo (pressione uma tecla)

---

### Etapa 3: Iniciar Fase no Control Panel

1. Abra segunda aba: http://localhost:3000/control-panel
2. Clique "Start Phase" em Fase 1
3. **NÃO FECHE** a aba de Developer Tools na Live Dashboard

---

### Etapa 4: Procurar por Logs de Som

Na aba Console do live-dashboard, procure por estes logs (em ordem):

#### 4.1 Logs de Quest Encontrada
```
📊 [FetchQuests] Resultado da query - Total de quests: 4
✅ Quests carregadas do DB para Fase 1: [1] Quest 1.1, [2] Quest 1.2, ...
```

#### 4.2 Logs de Detecção de Som
```
🔊 [CurrentQuestTimer] Primeira quest ativada! [quest-id-aqui]
🎬 INÍCIO DO EVENTO! Fase 1, Quest 1 ativada!
🔊 Tocando som: event-start
```

#### 4.3 Logs de Enfileiramento de Som
```
📞 [useSoundSystem.play] Chamado com tipo: event-start prioridade: undefined isClient: true
```

#### 4.4 Logs de audioManager
```
📀 Reproduzindo: event-start (duração: ...ms, prioridade: 0, readyState: ...)
🎵 Som adicionado à fila: event-start (prioridade: 0, fila agora tem 1 sons)
▶️ Tentativa 1/3 de tocar: event-start
✅ Som tocando com sucesso: event-start
✅ Áudio terminado: event-start
```

---

## 🚨 Possíveis Problemas e Soluções

### Problema A: Logs de Quest Não Aparecem

**Significa:** CurrentQuestTimer não está detectando que Fase 1 Quest 1 começou

**Possíveis Causas:**
1. Fetch de quests falhou
2. Quest não começou (status ainda é 'scheduled')
3. Polling não atualizou dados

**Solução:**
1. Procure por `❌ [FetchQuests] Erro ao buscar fase:`
2. Se houver erro, anote a mensagem exata
3. Recarregue a página (F5) e tente novamente

---

### Problema B: Logs de Som Não Aparecem (MAS Logs de Quest Aparecem)

**Significa:** O código que toca o som não está sendo executado

**Possíveis Causas:**
1. `previousQuestIdRef.current` não foi inicializado (bug raro)
2. `isFirstActivation` foi rejeitado (quest começou há mais de 5 segundos antes do reload)

**Verificação:**
- Procure por: `🔇 [CurrentQuestTimer] Quest 1 já está tocando há Xs`
- Se aparecer: Quest já estava tocando quando você recarregou, é normal
- Solução: Espere a próxima quest (Quest 1.2) e veja se toca `quest-start`

---

### Problema C: Logs de Som Aparecem MAS Nenhum áudio é Ouvido

**Significa:** Som foi "enfileirado" mas não foi reproduzido

**Possíveis Causas:**
1. `soundConfig.enabled` é false no localStorage
2. `isClient` é false em useSoundSystem (servidor side)
3. AudioContext ainda está suspenso
4. Volume está 0

**Verificar no Console:**

```javascript
// Copie e cole CADA UMA dessas linhas no console, pressione Enter:

// 1. Verificar se enabled
localStorage.getItem('soundConfig')

// Resposta esperada: {"volume": 0.7, "enabled": true}
// Se "enabled" é false, foi desabilitado!

// 2. Testar tocar um som manualmente
const audio = new Audio('/sounds/event-start.mp3')
audio.volume = 0.7
audio.play()

// Você deve OUVIR o som event-start
// Se não ouve: Problema de speaker/volume do computador

// 3. Verificar volume do navegador
// Clique no ícone de volume no navegador Chrome/Firefox
// Certifique-se que o volume não está muted (🔇 → 🔊)

// 4. Verificar se AudioContext está running
const ctx = new (window.AudioContext || window.webkitAudioContext)()
console.log('AudioContext state:', ctx.state)

// Resposta esperada: "running"
// Se "suspended": Precisa autorizar novamente
```

---

### Problema D: `localStorage.getItem('soundConfig')` Retorna null

**Significa:** Configuração de áudio não foi salva

**Solução:**
```javascript
// Cole no console:
localStorage.setItem('soundConfig', JSON.stringify({ volume: 0.7, enabled: true }))

// Depois recarregue (F5) e tente novamente
```

---

### Problema E: Volume do Computador está Mudo

**Verificar:**
1. Clique no ícone de volume do Windows/Mac no canto inferior direito
2. Certifique-se que não está muted
3. Aumente o volume (deve estar acima de 10%)

---

## 📊 Resumo Técnico da Cadeia de Áudio

```
[CurrentQuestTimer] Quest começa
         ↓
[Detecta isFirstActivation ou isQuestChange]
         ↓
[play('event-start') chamado]
         ↓
[useSoundSystem.play()]
         ↓
[audioManager.playFile('event-start')]
         ↓
[Cria Audio element: new Audio('/sounds/event-start.mp3')]
         ↓
[Adiciona à fila com prioridade 0 (máxima)]
         ↓
[processQueue() começca]
         ↓
[audio.play() chamado]
         ↓
[HTML Audio API toca o arquivo]
         ↓
[🔊 Você ouve o som!]
```

Se falhar em qualquer ponto, o som não toca.

---

## 🧪 Teste Completo Passo-a-Passo

### Setup
1. Abrir http://localhost:3000/live-dashboard em um navegador
2. Abrir F12 (DevTools → Console)
3. Abrir http://localhost:3000/control-panel em OUTRA aba

### Teste
1. **Clicar na página do live-dashboard** para autorizar áudio
   - Deve ver: `✅ Áudio autorizado automaticamente após interação do usuário`
2. **Ir para control-panel**
3. **Clicar "Start Phase" em Fase 1**
4. **Voltar para live-dashboard**
5. **Procurar logs console:**
   - `🎬 INÍCIO DO EVENTO! Fase 1, Quest 1 ativada!`
   - `🔊 Tocando som: event-start`
6. **Ouvir som event-start**

---

## 📝 Output Esperado Completo

Quando tudo funciona, você deve ver na console:

```
✅ Áudio autorizado automaticamente após interação do usuário

🔍 Buscando quests para Fase 1 (phase_id: ...)
📊 [FetchQuests] Resultado da query - Total de quests: 4
✅ Quests carregadas do DB para Fase 1: [1] Quest 1.1, [2] Quest 1.2, [3] Quest 1.3, [4] Quest 1.4

🔊 [CurrentQuestTimer] Primeira quest ativada! [uuid-da-quest-1]
🎬 INÍCIO DO EVENTO! Fase 1, Quest 1 ativada!
🔊 Tocando som: event-start

📞 [useSoundSystem.play] Chamado com tipo: event-start prioridade: undefined isClient: true
📀 Reproduzindo: event-start (duração: 10000ms, prioridade: 0, readyState: 2)
🎵 Som adicionado à fila: event-start (prioridade: 0, fila agora tem 1 sons)
▶️ Tentativa 1/3 de tocar: event-start
✅ Som tocando com sucesso: event-start
✅ Áudio terminado: event-start

[SOM TOCA] 🔊🔊🔊
```

---

## 🎯 O Que Você Deve Fazer Agora

1. Abra live-dashboard + DevTools Console
2. Clique na página (autorizar áudio)
3. Abra control-panel
4. Clique "Start Phase" em Fase 1
5. Volte para live-dashboard
6. **Procure por estes logs:**
   - `🎬 INÍCIO DO EVENTO!`
   - `📞 [useSoundSystem.play]`
   - `▶️ Tentativa 1/3`
7. **Copie os logs que aparecem** (ou não aparecem) e envie para análise

---

## 📞 Se Ainda Não Funcionar

Se depois de todo este debugging ainda não funcionar, envie:

1. **Screenshot do console** (com todos os logs visíveis)
2. **Resultado de:**
   ```javascript
   localStorage.getItem('soundConfig')
   ```
3. **Resultado de:**
   ```javascript
   navigator.mediaDevices.enumerateDevices()
   ```
4. **Browser & OS** (Chrome 120 no Windows 11, etc)

---

## ✅ Checklist Final

- [ ] Abri DevTools (F12)
- [ ] Cliquei na página para autorizar áudio
- [ ] Vi log `✅ Áudio autorizado`
- [ ] Cliquei "Start Phase" em Fase 1
- [ ] Procurei por `🎬 INÍCIO DO EVENTO!` nos logs
- [ ] Procurei por `📞 [useSoundSystem.play]` nos logs
- [ ] Procurei por `✅ Som tocando com sucesso`
- [ ] Tentei tocar áudio manualmente: `new Audio('/sounds/event-start.mp3').play()`

---

**Status:** Aguardando seus logs de console para diagnóstico
