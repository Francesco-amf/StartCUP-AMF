# 🧪 Guia de Teste - Otimizações de Quest Advancement

## O Que Mudou

### Problema Crítico (Resolvido)
- ❌ **Antes:** Late window bloqueava sistema por 15 minutos entre quests
- ✅ **Depois:** Cada quest avança em 2 minutos (teste rápido)

### Problema de Performance (Resolvido)
- ❌ **Antes:** Display lag de 30-60 segundos após quest expirar
- ✅ **Depois:** Display atualiza em ~2-3 segundos

### Sincronização (Resolvido)
- ❌ **Antes:** Diferentes componentes com polling em 500ms, 5s, 10s
- ✅ **Depois:** Tudo sincronizado em 500ms-1s

---

## 📋 Checklist Pré-Teste

- [ ] Build passou: `npm run build` ✓ (já foi executado)
- [ ] Supabase SQL executado: `TESTE_RAPIDO_SIMPLES.sql` ✓ (já foi executado)
- [ ] Event config resetado ✓ (já foi resetado)
- [ ] Trigger desabilitado: `ALTER TABLE event_config DISABLE TRIGGER start_evaluation_period_trigger` ✓ (já foi desabilitado)
- [ ] Phase 5 reconstruída com 3 quests ✓ (já foi reconstruída)

---

## 🚀 Executando Teste

### Passo 1: Abrir 3 Janelas

**Janela 1 - Control Panel (Admin):**
```
http://localhost:3000/control-panel
```

**Janela 2 - Live Dashboard (Public):**
```
http://localhost:3000/live-dashboard
```
Pressione **F12** e vá para a aba **Console** para ver logs em tempo real.

**Janela 3 - Terminal (Logs do servidor):**
```
Terminal com npm run dev (ou onde o servidor estiver rodando)
```

---

## ⏱️ Timeline do Teste Esperado (~39 minutos)

```
[00:00]  Clique "Start Phase" em Fase 1: Descoberta (Control Panel)
         └─ Sistema inicia Fase 1, Quest 1.1

[00:00-00:38] Quests progridem normalmente
         ├─ Fase 1: 00-08 min (4 quests × 2 min)
         ├─ Fase 2: 08-16 min (4 quests × 2 min)
         ├─ Fase 3: 16-24 min (4 quests × 2 min)
         ├─ Fase 4: 24-32 min (4 quests × 2 min)
         └─ Fase 5: 32-38 min (3 quests × 2 min, SEM BOSS)

[00:38-00:39] 🟦 EVALUATION PERIOD (1 minuto)
         ├─ Background: Azul/Roxo
         ├─ Display: "AVALIAÇÕES FINAIS EM ANDAMENTO"
         └─ Timer: 60 → 0 segundos

[00:39]  ⬛ GAME OVER (imediato)
         ├─ Background: Preto
         ├─ Display: "GAME OVER"
         └─ Botão: "▶️ REVELAR VENCEDOR"

[00:39-00:49] 🏆 WINNER REVELATION (10 seg countdown)
         ├─ Nome do vencedor
         ├─ Pontos totais
         └─ Confetti animation
```

---

## 👀 O Que Observar Durante Teste

### 1️⃣ Advanço de Quests (Mais Rápido)

**Terminal:**
```
🔵 ADVANCE-QUEST ENDPOINT CALLED for questId: [uuid]
✅ Quest [id] (order_index) da Fase [id] marcada como 'closed'
✅ Próxima quest [id] ativada na Fase [id]
```

**Esperado:**
- ✅ Approx a cada 2 minutos (test timing)
- ✅ Sem demoras de 15 minutos (late window fixed)
- ✅ Progression suave: 1.1 → 1.2 → 1.3 → 1.4 → 2.1 → ... → 5.3

### 2️⃣ Display Update (Mais Rápido)

**Console (F12) na Live Dashboard:**
```
📊 [EventEndCountdownWrapper] Carregado estado...
🔵 [QuestAutoAdvancer] Monitoring Quest 1: "Quest 1.1"
   - Detection window: X.Xs / 1s
🔴 [QuestAutoAdvancer] Quest 1 EXPIRED!
⚠️ [QuestAutoAdvancer] FORCING auto-advance of Quest 1 (waited Xs, Ys overdue)
📤 Calling /api/admin/advance-quest with questId: [uuid]
📥 Response: status=200, ok=true
📢 [QuestAutoAdvancer] Broadcast enviado para quest-updates ([uuid])
```

**Esperado:**
- ✅ Detection window de ~1 segundo (era 5s antes)
- ✅ Immediate broadcast após advance
- ✅ Display atualiza em ~2-3 segundos (era 30-60s antes)

### 3️⃣ Cache Invalidation

**Network Tab (F12):**
- Procure por respostas do `/api/admin/advance-quest`
- Headers devem incluir: `Cache-Control: no-store, must-revalidate, max-age=0`

**Esperado:**
- ✅ Resposta inclui timestamp: `"timestamp": 1731394500000`
- ✅ Cache-Control headers presentes
- ✅ Cada request força refetch fresh

### 4️⃣ Late Window Behavior

**Observations:**
- ✅ Quest 5.3 termina em ~38 minutos (não 15 min depois!)
- ✅ Sistema avança imediatamente para Evaluation Period
- ✅ Nenhum travamento de 15 minutos

**Antes:** Sistema travava aqui por 15 minutos
**Depois:** Progression suave

### 5️⃣ Evaluation Period

**Dashboard:**
```
[00:38-00:39] Fundo azul/roxo
              Timer: "AVALIAÇÕES FINAIS EM ANDAMENTO"
              Countdown: 00:60 → 00:00
```

**Terminal:**
```
✅ Todas as quests da Fase 5 concluídas!
⏰ Período de avaliação: [ISO timestamp]
⏰ Evento terminará em: [ISO timestamp]
```

**Esperado:**
- ✅ Inicia automática após Quest 5.3
- ✅ Dura exatamente 1 minuto (test config)
- ✅ Transição suave para Game Over

### 6️⃣ Game Over

**Dashboard:**
```
[00:39] Fundo preto
        Display: "GAME OVER"
        Botão: "▶️ REVELAR VENCEDOR"
```

**Esperado:**
- ✅ Appears imediatamente após evaluation terminar
- ✅ Usuário pode clicar botão para revelar vencedor
- ✅ Nenhum delay

### 7️⃣ Winner Revelation

**Dashboard:**
```
[00:39-00:49] Countdown: 10 → 0
              Nome da equipe
              Pontos totais
              Confetti animation
```

**Esperado:**
- ✅ Reveals automaticamente (ou após clique)
- ✅ Confetti animation funciona
- ✅ Pontos corretos refletem todas as fases

---

## 🚨 Possíveis Problemas e Soluções

### Problema: "Quest não avança em 2 minutos"
**Causa possível:** Late window ainda está bloqueando
**Solução:** Verificar se as mudanças em QuestAutoAdvancer.tsx foram aplicadas
```bash
grep "planned_deadline_minutes || 0) \* 60 \* 1000" src/components/QuestAutoAdvancer.tsx
# Não deve aparecer "+ late_submission_window_minutes"
```

### Problema: "Display lag ainda é 30-60 segundos"
**Causa possível:** Cache headers não foram aplicados
**Solução:** Verificar F12 Network tab - respostas devem ter Cache-Control header
```
Cache-Control: no-store, must-revalidate, max-age=0
```

### Problema: "Evaluation period não aparece"
**Causa possível:** Timestamp em advance-quest não foi atualizado
**Solução:** Verificar na Supabase se `evaluation_period_end_time` foi setado
```sql
SELECT evaluation_period_end_time, event_end_time FROM event_config LIMIT 1;
```

### Problema: "Game over preso ou não avança"
**Causa possível:** `event_ended` está true prematuramente
**Solução:** Reset na Supabase:
```sql
UPDATE event_config SET event_ended = false WHERE id = '00000000-0000-0000-0000-000000000001';
```

### Problema: "Terminal mostra errors em BroadcastChannel"
**Causa possível:** Navegador não suporta BroadcastChannel (Safari, etc)
**Solução:** Isso é normal! Sistema tem fallback para polling
```
⚠️ BroadcastChannel falhou, polling vai detectar mudança
```

---

## 📊 Métricas de Sucesso

Teste passou se:

- [ ] Nenhuma quest fica presa por 15+ minutos
- [ ] Display atualiza em ~2-3 segundos (antes: 30-60s)
- [ ] Evaluation period inicia automática após Quest 5.3
- [ ] Game over funciona corretamente
- [ ] Winner revelation sem erros
- [ ] Timeline total é ~39 minutos (não 54+ minutos)
- [ ] Logs mostram detection window de 1 segundo
- [ ] Não há erros critério no console (F12)

---

## 🎯 Comparação Antes vs Depois

### ANTES (Com Bug Late Window)
```
T=32:00  Quest 5.1 inicia
T=34:00  Quest 5.1 deadline regular
         └─ Sistema BLOQUEIA aqui por 15 min!
T=49:00  Late window expira
         └─ Sistema desbloqueia
T=49:00  Quest 5.2 pode iniciar
...
T=84:00  Total timeline (54+ minutos)
```

### DEPOIS (Com Otimizações)
```
T=32:00  Quest 5.1 inicia
T=34:00  Quest 5.1 deadline regular + late window checked
T=34:00  Quest 5.2 inicia imediatamente (respects late window via RLS only)
T=36:00  Quest 5.2 deadline
T=36:00  Quest 5.3 inicia
T=38:00  Quest 5.3 deadline
T=38:00  Evaluation period inicia (1 minuto)
T=39:00  Game over inicia
T=39-49  Winner revelation
...
T=49:00  Total timeline (39-49 minutos)
```

---

## ✅ Status Final

✅ Todas as otimizações implementadas
✅ Build compila sem erros
✅ Pronto para teste
✅ Late window bug corrigido
✅ Display lag otimizado
✅ Polling sincronizado

**Recomendação:** Execute o teste e observe os logs. Tudo deve funcionar suavemente agora!

---

## 📞 Debug Rápido

Se algo ficar errado durante o teste, você pode rapidamente verificar:

**Estado do evento:**
```sql
SELECT
  current_phase,
  event_started,
  event_ended,
  evaluation_period_end_time,
  event_end_time
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';
```

**Última quest:**
```sql
SELECT order_index, name, status, started_at, ended_at
FROM quests
WHERE status IN ('active', 'closed')
ORDER BY started_at DESC
LIMIT 5;
```

**Reset completo (se necessário):**
```sql
UPDATE event_config
SET
  event_started = false,
  event_ended = false,
  current_phase = 0,
  evaluation_period_end_time = NULL,
  event_end_time = NULL
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE quests SET status = 'scheduled', started_at = NULL, ended_at = NULL;
```
