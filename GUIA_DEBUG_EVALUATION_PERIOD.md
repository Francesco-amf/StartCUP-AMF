# 🔍 Guia de Debug: Por que evaluation_period_end_time não aparece

## 📋 O Problema

Quando Quest 5.3 termina:
1. ✅ Terminal mostra logs que o evento foi agendado
2. ❌ Live dashboard mostra "Quest 5.1 zerada" em vez do countdown de avaliação

## 🔧 Causas Possíveis

### Causa 1: `evaluation_period_end_time` não está sendo salvo no banco
O endpoint está tentando fazer UPDATE, mas por algum motivo não está persistindo.

**Como verificar:**
1. Vá para Supabase Dashboard
2. Abra SQL Editor
3. Execute o script: `DIAGNOSTICO_EVALUATION_PERIOD.sql`
4. Procure por:
   - `evaluation_period_end_time`: Deve ter um valor como `2025-11-11T16:30:00.000Z`
   - Se for NULL, o UPDATE não funcionou

### Causa 2: O componente `EventEndCountdownWrapper` não está recebendo o update em tempo real
O UPDATE funciona, mas o componente não está sendo notificado.

**Como verificar:**
1. Abra Developer Tools (F12)
2. Vá para Console
3. Procure por logs do `EventEndCountdownWrapper`
4. Verifique se há mensagens sobre "realtime subscription"

### Causa 3: Problema de timing - `all_submissions_evaluated` está TRUE quando deveria ser FALSE
Se `all_submissions_evaluated = true`, o componente pula para a Fase 2 (countdown final) direto.

**Como verificar:**
```sql
SELECT all_submissions_evaluated FROM event_config;
-- Deve ser FALSE após 5.3 terminar
-- Só deve ficar TRUE quando avaliações realmente completarem
```

---

## 🧪 Teste Passo-a-Passo

### Antes do Teste
1. Limpe o banco executando em Supabase SQL:
```sql
UPDATE event_config
SET
  event_ended = false,
  event_end_time = NULL,
  evaluation_period_end_time = NULL,
  all_submissions_evaluated = false;
```

2. Reconstrua Phase 5 executando: `RECONSTRUIR_FASE_5_SIMPLES.sql`

### Durante o Teste - Monitorar Terminal

Quando Quest 5.3 expirar (~2 minutos), procure por EXATAMENTE estes logs:

```
🔵 ADVANCE-QUEST ENDPOINT CALLED for questId: [ID-DE-5.3]
✅ Quest [ID-DE-5.3] marcada como em processamento
📊 Quest 5.3 completado com sucesso
ℹ️ Todas as quests da Fase 5 concluídas. Tentando avançar para a próxima fase...
✅ Todas as quests da Fase 5 concluídas! Definindo intervalo de 1 minuto antes do game over.
⏰ Período de avaliação: 2025-11-11T[HH:MM:SS]Z
⏰ Evento terminará em: 2025-11-11T[HH:MM:SS]Z
```

Se você NÃO ver esses logs, significa que o endpoint não chegou na condição de "fim da Fase 5".

### Durante o Teste - Checar Banco de Dados

1. **Imediatamente após 5.3 terminar** (antes de 30 segundos):
```sql
SELECT
  evaluation_period_end_time,
  event_end_time,
  all_submissions_evaluated,
  event_ended
FROM event_config;
```

Esperado:
```
evaluation_period_end_time: [timestamp futuro ~30 seg]
event_end_time:             [timestamp futuro ~60 seg]
all_submissions_evaluated:  false
event_ended:                false
```

2. **Se `evaluation_period_end_time` for NULL**, significa o UPDATE falhou
3. **Se `all_submissions_evaluated` for TRUE**, significa a lógica pulou para countdown final

### Durante o Teste - Verificar Live Dashboard

Logo após 5.3 terminar:

1. **Esperado:** Tela inteira deve ser substituída por `EvaluationPeriodCountdown`
   - Fundo azul/roxo
   - Título: "AVALIAÇÕES FINAIS EM ANDAMENTO"
   - Timer gigante: `00:30` ou menos

2. **Se aparecer "Quest 5.1 zerada":** Significa o componente não recebeu o update
   - Pode ser problema de realtime subscription
   - Pode ser que `evaluation_period_end_time` seja NULL no cliente

3. **Se aparecer "GAME OVER":** Significa `all_submissions_evaluated` está TRUE
   - Problema: Não deveria estar TRUE
   - Causa: RPC `check_all_submissions_evaluated()` retornando resultado incorreto

---

## 🚨 Se O Problema Persistir

### Hipótese 1: RPC `check_all_submissions_evaluated()` retorna wrong result

Teste manualmente:
```sql
SELECT check_all_submissions_evaluated() as result;
```

Esperado após 5.3 terminar:
```json
{
  "total_submissions": [número total de submissões],
  "evaluated_submissions": [quantas foram avaliadas],
  "pending_submissions": [quantas pendentes],
  "all_evaluated": false
}
```

Se `all_evaluated: true` quando deveria ser false, o RPC está quebrado.

### Hipótese 2: Realtime subscription não está funcionando

Adicione console.log ao EventEndCountdownWrapper:

No arquivo `src/components/EventEndCountdownWrapper.tsx`, linha 56-64, adicione:

```typescript
(payload: any) => {
  console.log('🔔 REALTIME UPDATE RECEBIDO:', payload.new)
  setEventEnded(payload.new.event_ended)
  setEventEndTime(payload.new.event_end_time)
  setEvaluationPeriodEndTime(payload.new.evaluation_period_end_time)
  setAllSubmissionsEvaluated(payload.new.all_submissions_evaluated || false)
}
```

Se não ver nenhuma mensagem `🔔 REALTIME UPDATE` no console, realtime não está funcionando.

### Hipótese 3: UPDATE no endpoint está falhando silenciosamente

Adicione logs ao endpoint `src/app/api/admin/advance-quest/route.ts`, após linha 233:

```typescript
if (eventEndError) {
  console.error('❌ ERRO CRÍTICO ao atualizar event_config:', eventEndError)
  console.error('Error message:', eventEndError.message)
  console.error('Error details:', JSON.stringify(eventEndError, null, 2))
}
```

Se ver mensagem `❌ ERRO CRÍTICO`, aí sim há um problema no UPDATE.

---

## ✅ Checklist de Debug

Quando Quest 5.3 termina, execute na ordem:

```
☐ 1. Ver logs do terminal procurando por "Período de avaliação:"
☐ 2. Executar DIAGNOSTICO_EVALUATION_PERIOD.sql
☐ 3. Verificar se evaluation_period_end_time NÃO É NULL
☐ 4. Verificar se all_submissions_evaluated é FALSE
☐ 5. Olhar para live-dashboard, deve ter EvaluationPeriodCountdown
☐ 6. Abrir F12 Developer Tools, procurar por erros no Console
☐ 7. Se não funcionar, procure por logs 🔔 REALTIME UPDATE no console
☐ 8. Se ainda não funcionar, cheque se há 🔵 ADVANCE-QUEST logs no terminal
```

---

## 💡 Minha Suspeita Principal

Baseado no comportamento (volta para Quest 5.1 zerada), minha suspeita é:

**O RPC `check_all_submissions_evaluated()` está retornando `all_evaluated: true` quando deveria retornar `false`**

Porque:
1. O endpoint executa corretamente (terminal mostra logs)
2. Mas no frontend, a lógica de `EventEndCountdownWrapper` pula direto para a fase final
3. Que mostraria... nada (porque `event_ended = false`)
4. Então renderiza o layout padrão (que é renderizado no fim)
5. Que mostra a Dashboard normal (com quests)
6. Mas as quests mostram como "zeradas" porque já foram completadas

**Teste isso primeiro:**
```sql
SELECT check_all_submissions_evaluated();
```

Se retornar `all_evaluated: true`, essa é a causa raiz!
