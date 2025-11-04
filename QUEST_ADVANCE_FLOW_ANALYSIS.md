# 📋 Fluxo de Avanço de Quests - Análise Completa

## 🎯 Resumo Executivo

O sistema avança quests em **3 níveis diferentes**:
1. **Nível QUEST** (dentro da mesma fase) - Live Dashboard avança visualmente
2. **Nível FASE** (entre fases 1-5) - Sistema automático SQL avança `event_config.current_phase`
3. **Nível UI** (páginas Team/Submit) - Frontend atualiza baseado em prazos e submissões

---

## 🔄 NÍVEL 1: Avanço de QUEST (Dentro da Fase)

### Live Dashboard (`CurrentQuestTimer.tsx`)

**Como funciona:**
```typescript
// Calcula qual quest está ativa com base no tempo decorrido
const elapsedSeconds = Math.floor(
  (new Date().getTime() - new Date(phaseStartedAt).getTime()) / 1000
)

// Soma durações individuais até encontrar a quest atual
let currentQuestIndex = 0
let timeInCurrentQuest = elapsedSeconds

for (let i = 0; i < quests.length; i++) {
  const questDurationSeconds = getQuestDurationMs(i) / 1000
  if (timeInCurrentQuest < questDurationSeconds) {
    currentQuestIndex = i
    questTimeRemaining = questDurationSeconds - timeInCurrentQuest
    break
  }
  timeInCurrentQuest -= questDurationSeconds
}
```

**Exemplo (Fase 1):**
```
Fase 1 iniciada em: 20:00:00
Quest 1.1: 60 min → Ativa de 20:00 a 21:00
Quest 1.2: 50 min → Ativa de 21:00 a 21:50
Quest 1.3: 30 min → Ativa de 21:50 a 22:20
BOSS 1:    10 min → Ativa de 22:20 a 22:30

Tempo decorrido: 75 minutos
  → currentQuestIndex = 1 (Quest 1.2)
  → questTimeRemaining = 35 minutos
```

**Atualização:** A cada 1 segundo (timer local)

**Visibilidade:**
- ✅ Live Dashboard: Mostra quest atual visualmente
- ❌ Página Submit: NÃO afeta (usa lógica diferente)
- ❌ Página Dashboard Team: NÃO afeta (usa lógica diferente)

---

## 🔄 NÍVEL 2: Avanço de FASE (SQL Automático)

### Função SQL (`auto_advance_phase()`)

**Como funciona:**
```sql
-- Executa a cada 1 minuto via pg_cron

-- 1. Conta quests totalmente expiradas
SELECT COUNT(*) INTO v_expired_quests
FROM quests q
WHERE p.order_index = v_current_phase
  AND NOW() > (started_at + planned_deadline_minutes + late_submission_window_minutes)

-- 2. Conta quests submetidas
SELECT COUNT(DISTINCT q.id) INTO v_submitted_quests
WHERE EXISTS (SELECT 1 FROM submissions s WHERE s.quest_id = q.id)

-- 3. Verifica se fase está completa
v_all_expired := (v_expired_quests >= v_total_quests) OR 
                 ((v_expired_quests + v_submitted_quests) >= v_total_quests)

-- 4. Se completa, avança para próxima fase
IF v_all_expired THEN
  UPDATE event_config 
  SET current_phase = current_phase + 1
END IF
```

**Condições para avançar:**
- ✅ **OPÇÃO A:** Todas as quests expiraram (incluindo janela de atraso)
- ✅ **OPÇÃO B:** Soma de (expiradas + submetidas) = total de quests

**Exemplo (Fase 1 → Fase 2):**
```
Fase 1: 4 quests
  - Quest 1.1: Submetida ✅
  - Quest 1.2: Expirada (21:06:42) ❌
  - Quest 1.3: Expirada (20:46:53) ❌
  - BOSS 1:    Expirada (20:12:05) ❌

Total finalizado: 1 submetida + 3 expiradas = 4/4
✅ FASE COMPLETA → event_config.current_phase = 2
```

**Atualização:** A cada 1 minuto via `cron.schedule`

**Visibilidade:**
- ✅ Página Submit: Filtra quests por `current_phase`
- ✅ Página Dashboard Team: Filtra quests por `current_phase`
- ✅ Live Dashboard: **NÃO** usa `current_phase` diretamente (usa tempo decorrido)

---

## 🔄 NÍVEL 3: Avanço de QUEST na UI (Páginas Team/Submit)

### A. Página de Submissão (`/submit`)

**Lógica de Seleção (Server Component):**
```tsx
// 1. Buscar TODAS as quests
const { data: activeQuestsData } = await supabase
  .from('quests')
  .select(`*, phase:phase_id (id, name, order_index)`)
  .order('phase_id, order_index')

// 2. Filtrar pela fase atual
const questsInCurrentPhase = quests.filter(
  q => q.phase?.order_index === eventConfig?.current_phase
)

// 3. Ordenar por order_index
const sortedQuests = questsInCurrentPhase.sort((a, b) => a.order_index - b.order_index)

// 4. Passar para SubmissionWrapper (Client Component)
<SubmissionWrapper quests={sortedQuests} ... />
```

**Lógica de Avanço (Client Component - `SubmissionWrapper.tsx`):**
```tsx
// 1. Encontrar quests não-submetidas
const notSubmittedIndexes = []
for (let i = 0; i < sortedQuests.length; i++) {
  if (!submittedQuestIds.includes(sortedQuests[i].id)) {
    notSubmittedIndexes.push(i)
  }
}

// 2. Selecionar primeira NÃO expirada
let currentIndex = -1
for (const idx of notSubmittedIndexes) {
  const q = sortedQuests[idx]
  if (!isFullyExpired(q)) { 
    currentIndex = idx
    break 
  }
}

// 3. Se TODAS expiraram
const allExpired = notSubmittedIndexes.length > 0 && currentIndex === -1

// 4. Renderizar
if (allExpired) {
  return <div>🏁 Todas as quests desta fase foram finalizadas</div>
} else if (currentIndex >= 0) {
  const quest = sortedQuests[currentIndex]
  if (quest.isBoss) {
    return <BossQuestCard ... />
  } else {
    return <SubmissionForm ... />
  }
}
```

**Fluxo Completo de Avanço:**
```
1. Equipe submete Quest 1.1
   → submittedQuestIds = ['quest-1.1-id']
   → currentIndex avança para 1 (Quest 1.2)
   → Mostra Quest 1.2

2. Prazo de Quest 1.2 expira (sem submissão)
   → isFullyExpired(Quest 1.2) = true
   → currentIndex avança para 2 (Quest 1.3)
   → Mostra Quest 1.3

3. Quest 1.3 expira, BOSS 1 expira, nenhuma submetida
   → Todas não-submetidas estão expiradas
   → allExpired = true
   → Mostra banner "🏁 Todas as quests finalizadas"

4. SQL auto_advance_phase() detecta fase completa
   → event_config.current_phase = 2
   → Próximo refresh da página mostra Quest 2.1
```

**Banner de Auto-Avanço:**
```tsx
// Se avançou de uma quest expirada para a próxima
if (previousQuestExpired && currentQuest) {
  return (
    <div>
      🚦 Prazo finalizado em "{previousQuest.name}". 
      Agora você está na próxima quest: {currentQuest.name}
    </div>
  )
}
```

**Atualização:** 
- Manual (F5 ou navegação)
- Automática após submissão (`router.refresh()`)

---

### B. Página Dashboard Team (`/dashboard`)

**Lógica de Seleção (Server Component):**
```tsx
// Mesma filtragem que /submit
const sortedQuests = quests
  .filter((q: any) => q.phase?.order_index === eventConfig?.current_phase)
  .sort((a: any, b: any) => a.order_index - b.order_index)

// Selecionar quest atual
let currentIndex = -1
for (let i = 0; i < sortedQuests.length; i++) {
  const q = sortedQuests[i]
  if (submittedQuestIds.includes(q.id)) continue
  
  // Se não expirou, é a atual
  if (!isFullyExpired(q)) { 
    currentIndex = i
    break 
  }
}

// Fallback: primeira não-submetida (mesmo expirada)
if (currentIndex === -1) {
  for (let i = 0; i < sortedQuests.length; i++) {
    if (!submittedQuestIds.includes(sortedQuests[i].id)) { 
      currentIndex = i
      break 
    }
  }
}

const currentQuest = currentIndex >= 0 ? sortedQuests[currentIndex] : undefined
```

**Componente de Exibição:**
```tsx
<PhaseDetailsCard
  currentQuest={currentQuest}
  currentPhaseNumber={eventConfig?.current_phase || 0}
/>
```

**Banner de Auto-Avanço:**
```tsx
// Detecta se avançou de quest expirada
if (currentIndex > 0) {
  const prev = sortedQuests[currentIndex - 1]
  if (!submittedQuestIds.includes(prev.id) && prev.started_at) {
    // Se anterior expirou e não foi submetida
    if (Date.now() > (prevEndTime + epsilon)) {
      autoAdvancedNotice = { fromName: prev.name, toName: currentQuest.name }
    }
  }
}
```

**Atualização:** 
- Manual (F5 ou navegação)
- Não tem refresh automático

---

## 📊 Comparação dos 3 Níveis

| Aspecto | Live Dashboard | SQL Auto-Advance | UI Team/Submit |
|---------|----------------|------------------|----------------|
| **O que avança** | Quest visual | Fase no DB | Quest exibida |
| **Baseado em** | Tempo decorrido | Prazos + Submissões | Prazos + Submissões |
| **Frequência** | 1 segundo | 1 minuto | Manual |
| **Escopo** | Dentro da fase | Entre fases (1-5) | Dentro da fase |
| **Automático** | ✅ Sim | ✅ Sim (cron) | ❌ Não (refresh manual) |
| **Afeta DB** | ❌ Não | ✅ Sim (`current_phase`) | ❌ Não |

---

## 🎬 Cenário Completo: Equipe jogando Fase 1

### Fase 1 Iniciada (20:00:00)

**T+0min (20:00):**
- **Live Dashboard:** Mostra Quest 1.1 (60 min)
- **Submit Page:** Mostra Quest 1.1 (formulário de upload)
- **Dashboard Team:** Mostra Quest 1.1 (card com detalhes)

**T+10min (20:10):**
- **Live Dashboard:** Mostra Quest 1.1 (50 min restantes)
- Equipe submete Quest 1.1 ✅
- **Submit Page:** Refresh → Mostra Quest 1.2 (formulário)
- **Dashboard Team:** Refresh → Mostra Quest 1.2

**T+60min (21:00):**
- **Live Dashboard:** Avança automaticamente para Quest 1.2
- **Submit Page:** Continua mostrando Quest 1.2 (já estava)
- Equipe NÃO submete Quest 1.2

**T+110min (21:50):**
- **Live Dashboard:** Avança para Quest 1.3
- **Submit Page:** Ainda mostra Quest 1.2 (prazo + 15min atraso até 22:05)
- Prazo regular de Quest 1.2 expirou

**T+125min (22:05):**
- Quest 1.2 expira TOTALMENTE (50min + 15min atraso)
- **Submit Page:** Refresh → Avança para Quest 1.3 com banner:
  ```
  🚦 Prazo finalizado em "Quest 1.2". 
  Agora você está na próxima quest: Quest 1.3
  ```
- **Dashboard Team:** Refresh → Mostra Quest 1.3

**T+140min (22:20):**
- **Live Dashboard:** Avança para BOSS 1
- **Submit Page:** Ainda mostra Quest 1.3 (até 22:35)

**T+155min (22:35):**
- Quest 1.3 expira TOTALMENTE
- **Submit Page:** Refresh → Avança para BOSS 1 (BossQuestCard, sem formulário)

**T+165min (22:45):**
- BOSS 1 expira (10:12:05 + 10min = 10:22:05)
- Fase 1 completa: 1 submetida + 3 expiradas = 4/4

**T+166min (22:46):**
- SQL `auto_advance_phase()` executa (próximo minuto)
- Detecta fase completa
- `UPDATE event_config SET current_phase = 2`

**T+167min (22:47):**
- **Submit Page:** Refresh → Mostra Quest 2.1 (Fase 2)
- **Dashboard Team:** Refresh → Mostra Quest 2.1
- **Live Dashboard:** Continua mostrando BOSS 1 (não usa `current_phase`)

---

## ⚠️ Problemas Identificados

### 1. Live Dashboard NÃO Sincroniza com Fases
**Problema:** Live dashboard avança quests baseado em tempo, mas não detecta mudança de fase.

**Impacto:** 
- Se admin avançar manualmente `current_phase`, live dashboard continua mostrando fase anterior
- Equipes veem informação inconsistente entre live e submit

**Solução Futura:**
```tsx
// CurrentQuestTimer.tsx deveria verificar event_config.current_phase
const { data: eventConfig } = await supabase
  .from('event_config')
  .select('current_phase')
  .single()

// Buscar quests da fase atual
const { data: quests } = await supabase
  .from('quests')
  .select('*')
  .eq('phase_id', (SELECT id FROM phases WHERE order_index = eventConfig.current_phase))
```

### 2. Refresh Manual Necessário
**Problema:** Páginas Team/Submit não atualizam automaticamente quando fase muda.

**Impacto:**
- Equipe pode ficar vendo "fase completa" por minutos até dar F5
- Perde tempo tentando submeter quest expirada

**Solução Futura:**
```tsx
// Polling a cada 30 segundos ou Supabase Realtime
useEffect(() => {
  const interval = setInterval(() => {
    router.refresh()
  }, 30000) // 30 segundos
  
  return () => clearInterval(interval)
}, [])
```

### 3. Banner de Avanço Depende de Refresh
**Problema:** Banner "🚦 Prazo finalizado" só aparece quando equipe recarrega página.

**Impacto:**
- Equipe não é notificada que quest expirou
- Continua trabalhando em quest que não pode mais submeter

**Solução Futura:**
- WebSocket/Realtime notificando expiração
- Timer client-side que detecta expiração e mostra modal

---

## ✅ O Que Está Funcionando Bem

1. ✅ **Lógica determinística** - Sempre mostra a mesma quest para mesma situação
2. ✅ **Fallback robusto** - Se DB não tem quest, usa fallback do código
3. ✅ **BOSS detection** - Detecta por `deliverable_type` E `order_index`
4. ✅ **Auto-advance SQL** - Avança fases automaticamente sem intervenção
5. ✅ **Separação clara** - Live (visual) vs Submit/Team (funcional)

---

## 📝 Recomendações

### Curto Prazo (Manter como está)
- Sistema funciona conforme projetado
- Equipes podem recarregar página (F5) quando necessário
- Admin pode monitorar via SQL queries

### Médio Prazo (Melhorias)
1. Adicionar polling automático nas páginas Team/Submit (30s)
2. Integrar `current_phase` no Live Dashboard
3. Adicionar contador de refresh ("Última atualização: 15s atrás")

### Longo Prazo (Ideal)
1. Supabase Realtime para atualização instantânea
2. Notificações push quando quest expira
3. Modal automático quando fase avança
4. Sincronização completa Live ↔ Submit ↔ Team

---

## 🧪 Como Testar

### Teste 1: Avanço por Submissão
```
1. Abra /submit
2. Submeta Quest 1.1
3. Página deve recarregar automaticamente
4. ✅ Deve mostrar Quest 1.2
```

### Teste 2: Avanço por Expiração
```
1. Aguarde Quest 1.2 expirar (prazo + 15min)
2. Recarregue página (F5)
3. ✅ Deve mostrar Quest 1.3 com banner "Prazo finalizado"
```

### Teste 3: Avanço de Fase (SQL)
```
1. Aguarde todas as quests expirarem
2. Recarregue /submit
3. ✅ Deve mostrar "🏁 Todas as quests finalizadas"
4. Aguarde 1 minuto (cron executa)
5. Recarregue /submit
6. ✅ Deve mostrar Quest 2.1 (Fase 2)
```

### Teste 4: Live Dashboard
```
1. Abra /live
2. Observe timer de quest atual
3. Aguarde timer zerar
4. ✅ Deve avançar para próxima quest automaticamente
5. ❌ NÃO avança para próxima fase (limitação conhecida)
```

---

**Documento criado:** `QUEST_ADVANCE_FLOW_ANALYSIS.md`
