# 📊 FLUXO COMPLETO PÓS-QUEST 5.3

## 🎯 Resumo do Sistema

Após Quest 5.3 terminar, o sistema passa por **4 FASES** até a revelação do vencedor:

```
Quest 5.3 Termina
        ↓
FASE 1: Período de Avaliação (20 minutos com countdown)
        ↓
FASE 2: GAME OVER - Evento Terminado (com botão)
        ↓
FASE 3: Countdown de Suspense (15 segundos)
        ↓
FASE 4: Revelação do Vencedor
```

---

## 📋 FASE 1: Período de Avaliação (20 minutos)

### O que acontece quando Quest 5.3 termina:

**Trigger SQL:** `set_evaluation_period_on_last_quest_end()`

```sql
-- Quando Quest 5.3 (última quest) tem ended_at preenchido:
evaluation_period_end_time = ended_at + 20 minutos
```

**Exemplo:**
```
Quest 5.3 termina: 11:30
evaluation_period_end_time: 11:50 (11:30 + 20 min)
```

### Componente: `EvaluationPeriodCountdown.tsx`

**Mostra:**
- ⏰ Timer decrescente de 20:00 → 00:00
- 📝 Mensagem: "Período de Avaliação em Andamento"
- 🔄 Atualiza a cada segundo
- **Últimos 10 segundos:** Countdown grande e animado

**Quando chega a 0:**
- Chama `onEvaluationsComplete()`
- Avança para FASE 2 (GAME OVER)

---

## 📋 FASE 2: GAME OVER - Evento Terminado

### Componente: `EventEndCountdown.tsx` - Fase "Game Over"

**Mostra:**
- 🏁 "GAME OVER" gigante
- 🔴 "EVENTO TERMINADO"
- 📢 "O evento foi encerrado!"
- 📝 "Todas as submissões foram finalizadas"
- 🎯 **BOTÃO: "▶️ REVELAR VENCEDOR"**

**Quando clica no botão:**
- Executa `advanceToSuspense()`
- Transiciona para FASE 3 (Countdown de Suspense)

---

## 📋 FASE 3: Countdown de Suspense (15 segundos)

### Componente: `EventEndCountdown.tsx` - Fase "Suspense"

**Mostra:**
- 🌟 Estrelas e efeitos visuais épicos
- ⏳ Countdown de 15 → 0 segundos
- 📢 "O VENCEDOR DO JOGO É..."
- 🎵 Música de suspense tocando
- **Fade out nos últimos 3 segundos**

**Quando chega a 0:**
- Transiciona automaticamente para FASE 4 (Winner)

---

## 📋 FASE 4: Revelação do Vencedor

### Componente: `EventEndCountdown.tsx` - Fase "Winner"

**Animação Progressiva:**

1. **0.5s:** Mostra "PARABÉNS! 🎊"
2. **12.5s:** Mostra "A EQUIPE VENCEDORA É..."
3. **Nome revelado:** 
   - 🏆 Troféu animado
   - 🎊 Nome da equipe em destaque
   - 🪙 Pontuação total
   - 🎵 Música de vitória
4. **Informações completas:**
   - Detalhes da equipe
   - Mensagem para todas as equipes
   - ✨ Confetes caindo continuamente

### Busca o Vencedor:

```sql
SELECT 
  team_id,
  team_name,
  total_points
FROM ranking_with_badges
ORDER BY total_points DESC
LIMIT 1
```

---

## 🔧 Como Está Implementado

### 1. Trigger no Banco de Dados

**Arquivo:** `set-evaluation-period-on-quest-end.sql`

```sql
CREATE TRIGGER set_evaluation_period_trigger
AFTER UPDATE ON quests
FOR EACH ROW
EXECUTE FUNCTION set_evaluation_period_on_last_quest_end();
```

**Quando Quest 5.3 termina:**
```sql
UPDATE event_config
SET evaluation_period_end_time = NEW.ended_at + INTERVAL '20 minutes'
WHERE ...;
```

### 2. API - Advance Quest

**Arquivo:** `src/app/api/admin/advance-quest/route.ts`

Quando não há mais quests (final da Fase 5):

```typescript
// Fase 1: Período de Avaliação (20 min)
const evaluationPeriodEnd = new Date(now.getTime() + 20 * 60 * 1000)

// Fase 2: Countdown final (60 seg)
const eventEndTime = new Date(evaluationPeriodEnd.getTime() + 60 * 1000)

await supabaseAdmin
  .from('event_config')
  .update({
    evaluation_period_end_time: evaluationPeriodEnd.toISOString(),
    event_end_time: eventEndTime.toISOString()
  })
```

### 3. Wrapper Component

**Arquivo:** `src/components/EventEndCountdownWrapper.tsx`

Gerencia as 3 fases:

```typescript
// FASE 1: Período de Avaliação (20 minutos)
if (evaluationPeriodEndTime && !allSubmissionsEvaluated) {
  return <EvaluationPeriodCountdown onEvaluationsComplete={handleEvaluationsComplete} />
}

// FASE 2-4: Countdown e Revelação (gerenciados por EventEndCountdown)
if (showFinalCountdown || allSubmissionsEvaluated) {
  return <EventEndCountdown />
}

// Nada a mostrar (evento em andamento)
return null
```

### 4. Countdown Component

**Arquivo:** `src/components/EventEndCountdown.tsx`

Gerencia 4 fases internas:

```typescript
type EventPhase = 'countdown' | 'gameOver' | 'suspense' | 'winner'

// FLUXO:
// 1. countdown (10 segundos finais dos 20 min) → 
// 2. gameOver (GAME OVER com botão) → 
// 3. suspense (15 segundos) → 
// 4. winner (revelação)

// Transições:
// - countdown → gameOver: Automática quando timeLeft === 0
// - gameOver → suspense: Manual via botão "REVELAR VENCEDOR"
// - suspense → winner: Automática quando suspenseCountdown === 0
```

---

## ⚙️ Configurações

### Duração do Período de Avaliação

```sql
-- Atualmente: 20 minutos
v_evaluation_period_minutes INT := 20;

-- Para alterar, edite set-evaluation-period-on-quest-end.sql
```

### Duração do Countdown de Suspense

```typescript
// Atualmente: 15 segundos
const SUSPENSE_DURATION = 15

// Para alterar, edite src/components/EventEndCountdown.tsx
```

### Últimos Segundos Visíveis

```typescript
// Countdown grande aparece nos últimos 10 segundos dos 20 minutos
if (seconds <= 10 && seconds > 0) {
  // Mostra contador gigante animado
  // "⏰ EVENTO TERMINANDO"
  // Números: 10, 9, 8, 7...
}
```

---

## 🧪 Como Testar

### 1. Forçar Quest 5.3 a Terminar

```sql
-- Marcar Quest 5.3 como encerrada
UPDATE quests
SET 
  status = 'closed',
  ended_at = NOW()
WHERE phase_id = 5 AND order_index = 3;

-- Verificar se evaluation_period_end_time foi setado
SELECT 
  evaluation_period_end_time,
  event_end_time,
  all_submissions_evaluated
FROM event_config;
```

### 2. Simular Avaliações Completas

```sql
-- Marcar todas submissões como avaliadas
UPDATE event_config
SET all_submissions_evaluated = true;
```

### 3. Avançar para Countdown Final

```sql
-- Reduzir evaluation_period_end_time para 1 minuto
UPDATE event_config
SET evaluation_period_end_time = NOW() + INTERVAL '1 minute';
```

### 4. Testar Revelação de Vencedor

```
1. Abrir: http://localhost:3000/live-dashboard
2. Aguardar countdown chegar a 0
3. Ver revelação progressiva do vencedor
```

---

## 🎮 Experiência do Usuário

### Timeline Completa

```
11:30:00 - Quest 5.3 termina
11:30:01 - FASE 1 inicia: "Período de Avaliação - 20:00"
11:49:50 - Timer: "00:10" (últimos 10 segundos aparecem grandes)
11:49:59 - Timer: "00:01"
11:50:00 - FASE 2 inicia: GAME OVER + Botão "REVELAR VENCEDOR"
         - Usuário clica no botão (quando quiser)
11:50:XX - FASE 3 inicia: Countdown Suspense "15"
11:50:XX+15s - FASE 4 inicia: Revelação do Vencedor
         - 0.5s: "PARABÉNS!"
         - 12.5s: "A EQUIPE VENCEDORA É..."
         - Nome revelado + confetes + música
```

### Sons e Música

1. **Últimos 10 segundos (FASE 1):**
   - Beeps a cada segundo (10, 9, 8...)
   - Som final no 0

2. **GAME OVER (FASE 2):**
   - Silencioso
   - Aguarda clique do usuário

3. **Suspense (FASE 3):**
   - Música de suspense em loop
   - 15 segundos de tensão

4. **Winner (FASE 4):**
   - Música de vitória
   - Som de celebração ao revelar nome

---

## ✅ Validação do Sistema

### Checklist de Funcionamento

- [ ] Quest 5.3 termina → `evaluation_period_end_time` é setado (+20 min)
- [ ] Timer de 20 minutos aparece no `/live-dashboard`
- [ ] Timer decrementa: 20:00 → 00:10
- [ ] Últimos 10 segundos: Contador grande animado aparece
- [ ] Timer chega a 0 → GAME OVER aparece
- [ ] Botão "REVELAR VENCEDOR" visível e clicável
- [ ] Ao clicar → Countdown de 15 segundos inicia
- [ ] Música de suspense toca durante os 15s
- [ ] Fade out nos últimos 3 segundos
- [ ] Ao chegar a 0 → Revelação do vencedor inicia
- [ ] Vencedor é buscado corretamente do ranking
- [ ] Nome é revelado progressivamente
- [ ] Música de vitória toca
- [ ] Confetes caem continuamente

---

## 🐛 Possíveis Problemas

### Problema: Timer não aparece após Quest 5.3 terminar

**Causa:** Trigger não executou ou `evaluation_period_end_time` é null

**Solução:**
```sql
-- Verificar trigger
SELECT * FROM pg_trigger WHERE tgname = 'set_evaluation_period_trigger';

-- Executar manualmente
UPDATE event_config
SET evaluation_period_end_time = NOW() + INTERVAL '20 minutes'
WHERE id = '00000000-0000-0000-0000-000000000001';
```

### Problema: Countdown pula direto para vencedor (sem GAME OVER)

**Causa:** Botão não é mostrado ou é clicado automaticamente

**Solução:**
```typescript
// Verificar que fase 'gameOver' está sendo renderizada
console.log('Current phase:', currentPhase)

// Deve mostrar GAME OVER antes de suspense
// gameOver → (botão clicado) → suspense → winner
```

### Problema: Botão "REVELAR VENCEDOR" não funciona

**Causa:** Função `advanceToSuspense()` não está conectada

**Solução:**
```typescript
// Verificar que onClick está correto
<button onClick={advanceToSuspense}>
  ▶️ REVELAR VENCEDOR
</button>

// E que a função transiciona corretamente
const advanceToSuspense = () => {
  setCurrentPhase('suspense')
  setSuspenseCountdown(SUSPENSE_DURATION)
}
```

### Problema: Vencedor não aparece

**Causa:** Nenhuma equipe no ranking ou query falhou

**Solução:**
```sql
-- Verificar se há equipes no ranking
SELECT * FROM ranking_with_badges ORDER BY total_points DESC LIMIT 1;
```

---

## 📁 Arquivos Relevantes

| Arquivo | Responsabilidade |
|---------|------------------|
| `set-evaluation-period-on-quest-end.sql` | Trigger que seta `evaluation_period_end_time` |
| `src/components/EventEndCountdownWrapper.tsx` | Gerencia as 3 fases principais |
| `src/components/EventEndCountdown.tsx` | Countdown e revelação do vencedor |
| `src/components/EvaluationPeriodCountdown.tsx` | Timer de 20 minutos |
| `src/app/api/admin/advance-quest/route.ts` | API que fecha Quest 5.3 |

---

**Status**: ✅ Sistema implementado e funcionando  
**Última atualização**: 2025-11-19  
**Autor**: GitHub Copilot
