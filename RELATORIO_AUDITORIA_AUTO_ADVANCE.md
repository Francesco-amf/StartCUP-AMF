# 🔍 RELATÓRIO DE AUDITORIA: Sistema de Auto-Advance

**Data:** 19 de Novembro de 2025  
**Status:** ⚠️ **PROBLEMAS CRÍTICOS ENCONTRADOS**

---

## 📋 RESUMO EXECUTIVO

Foram identificados **conflitos graves** entre diferentes versões de scripts SQL que você executou. O sistema de auto-advance pode estar **completamente desabilitado** ou **em estado inconsistente**.

---

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **CONFLITO: Múltiplas Versões de auto_advance_phase()**

Você tem **3 arquivos diferentes** com versões conflitantes:

| Arquivo | Método | Estado Provável |
|---------|--------|----------------|
| `auto-advance-phase.sql` | Cron-based | ✅ Original |
| `auto-advance-phase-FIXED.sql` | Cron-based (corrigido) | ⚠️ Possivelmente aplicado |
| `auto-advance-phase-IMPROVED.sql` | **Trigger-based** | ⚠️ **PODE TER DESABILITADO CRON** |

**⚠️ PROBLEMA:**

O arquivo `auto-advance-phase-IMPROVED.sql` **REMOVE** a função `auto_advance_phase()` e o sistema de cron:

```sql
-- Linha 10 do auto-advance-phase-IMPROVED.sql
DROP FUNCTION IF EXISTS auto_advance_phase();
DROP TRIGGER IF EXISTS on_quest_completion_trigger ON public.quests;
DROP FUNCTION IF EXISTS manage_phase_transition();
```

**Consequência:**
- Se você executou `auto-advance-phase-IMPROVED.sql`, o cron foi **desabilitado**
- Sistema agora dependeria de **trigger** ao invés de **polling periódico**
- Trigger só dispara quando `quest.status = 'completed'`
- **Mas suas quests nunca ficam 'completed' automaticamente!**

---

### 2. **LÓGICA DE AVANÇO INCOMPATÍVEL**

#### Sistema Cron (auto-advance-phase-FIXED.sql):
```sql
-- Avança quando:
-- 1. Todas quests iniciaram (started_at IS NOT NULL)
-- 2. Todas quests foram processadas (expiradas OU submetidas)
```

#### Sistema Trigger (auto-advance-phase-IMPROVED.sql):
```sql
-- Avança quando:
-- 1. Uma quest muda status para 'completed'
-- 2. TODAS as outras quests também estão 'completed'
```

**⚠️ PROBLEMA:**

Suas quests **nunca** ficam com `status = 'completed'` automaticamente!

Elas ficam:
- `'active'` quando iniciadas
- `'closed'` quando expiram (via API `/advance-quest`)

**O trigger NUNCA será disparado!**

---

### 3. **INCONSISTÊNCIA: Avanço de Quest vs Avanço de Fase**

Você tem **dois sistemas separados**:

#### Avanço de Quest (API):
- Endpoint: `/api/admin/advance-quest`
- Chamado por: `QuestAutoAdvancer` (frontend)
- Quando: Quest expira (polling a cada 10s)
- O que faz:
  - Fecha quest atual (`status = 'closed'`)
  - Avança para próxima quest da MESMA fase
  - **NÃO** avança fase

#### Avanço de Fase (SQL):
- Método: `auto_advance_phase()` (cron) OU `manage_phase_transition()` (trigger)
- Quando: **Depende de qual versão está ativa**
- O que faz:
  - Avança `event_config.current_phase`
  - Inicia Quest 1 da próxima fase

**⚠️ PROBLEMA:**

Se o sistema trigger foi aplicado (`auto-advance-phase-IMPROVED.sql`), e as quests nunca ficam `'completed'`, então:

- ❌ Fases **NUNCA** avançam automaticamente
- ❌ Evento fica **travado** em uma fase
- ❌ Cron job foi **removido** (não há fallback)

---

### 4. **POSSÍVEL DESAGENDAMENTO DE CRON**

Você tem scripts que **removem** jobs cron:

```sql
-- FIX_AUTO_ADVANCE_URGENT.sql (linha 6)
SELECT cron.unschedule('auto-advance-phase-job');

-- RESET_EVENT_TO_START.sql (linha 6)
SELECT cron.unschedule('auto-advance-phase-job');
```

**⚠️ PROBLEMA:**

Se você executou algum desses scripts:
- Job cron foi **removido**
- Sistema de auto-advance está **completamente desabilitado**
- Fases só avançam **manualmente**

---

### 5. **INCOMPATIBILIDADE: Trigger vs API**

O sistema API (`/advance-quest`) usa:

```typescript
// route.ts linha 86
const { error: updateError } = await supabaseAdmin
  .rpc('close_quest', { 
    p_quest_id: questId 
  })
```

Função `close_quest()` provavelmente faz:

```sql
UPDATE quests SET status = 'closed' WHERE id = p_quest_id;
```

**⚠️ PROBLEMA:**

O trigger `on_quest_completion_trigger` só dispara quando:

```sql
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
```

Como a API seta `'closed'` e não `'completed'`, o trigger **NUNCA** dispara!

---

## 🔧 DIAGNÓSTICO NECESSÁRIO

**Para saber o estado real do sistema, você PRECISA executar:**

```sql
-- Execute o script de auditoria que criei:
-- AUDIT_AUTO_ADVANCE_SYSTEM.sql
```

Este script vai verificar:

1. ✅ pg_cron está habilitado?
2. ✅ Existe job `auto-advance-phase-job` ativo?
3. ✅ Qual função existe: `auto_advance_phase()` OU `manage_phase_transition()`?
4. ✅ Existe trigger `on_quest_completion_trigger`?
5. ✅ Qual é o estado atual das quests e fases?

---

## 🎯 CENÁRIOS POSSÍVEIS

### **CENÁRIO A: Sistema Cron Ativo (Bom)**

Se auditoria mostrar:
- ✅ `auto_advance_phase()` existe
- ✅ Job cron `auto-advance-phase-job` está ativo
- ❌ Trigger `on_quest_completion_trigger` **NÃO** existe

**Status:** Sistema funcionando corretamente  
**Ação:** Nenhuma necessária

---

### **CENÁRIO B: Sistema Trigger Ativo (Ruim)**

Se auditoria mostrar:
- ❌ `auto_advance_phase()` **NÃO** existe
- ❌ Job cron **NÃO** está ativo
- ✅ Trigger `on_quest_completion_trigger` existe
- ✅ `manage_phase_transition()` existe

**Status:** Sistema **QUEBRADO** (trigger nunca dispara)  
**Ação:** Reverter para sistema cron

---

### **CENÁRIO C: Ambos Ativos (Muito Ruim)**

Se auditoria mostrar:
- ✅ `auto_advance_phase()` existe
- ✅ Job cron está ativo
- ✅ Trigger `on_quest_completion_trigger` existe

**Status:** **CONFLITO** - dois sistemas competindo  
**Ação:** Remover trigger, manter cron

---

### **CENÁRIO D: Nenhum Ativo (Crítico)**

Se auditoria mostrar:
- ❌ `auto_advance_phase()` **NÃO** existe
- ❌ Job cron **NÃO** está ativo
- ❌ Trigger **NÃO** existe

**Status:** Auto-advance **COMPLETAMENTE DESABILITADO**  
**Ação:** Reinstalar sistema cron

---

## 📝 RECOMENDAÇÕES

### 1️⃣ **EXECUTAR AUDITORIA AGORA**

```bash
# Abra Supabase Dashboard > SQL Editor
# Execute: AUDIT_AUTO_ADVANCE_SYSTEM.sql
```

### 2️⃣ **ESCOLHER UMA ABORDAGEM**

#### **Opção A: Sistema Cron (RECOMENDADO)**

**Vantagens:**
- ✅ Funciona com qualquer `quest.status`
- ✅ Polling periódico (confiável)
- ✅ Independente da API
- ✅ Já testado e funcionando

**Desvantagens:**
- ⚠️ Delay de até 1 minuto para avanço

**Arquivo:** `auto-advance-phase-FIXED.sql`

---

#### **Opção B: Sistema Trigger**

**Vantagens:**
- ✅ Resposta instantânea (sem delay)
- ✅ Mais eficiente (não faz polling)

**Desvantagens:**
- ❌ Requer modificar API para setar `status = 'completed'`
- ❌ Requer modificar lógica de expiração
- ❌ Mais complexo (mais pontos de falha)

**Arquivo:** `auto-advance-phase-IMPROVED.sql` + modificações na API

---

### 3️⃣ **AÇÃO IMEDIATA**

**Se escolher Sistema Cron:**

```sql
-- 1. Remover trigger (se existir)
DROP TRIGGER IF EXISTS on_quest_completion_trigger ON public.quests;
DROP FUNCTION IF EXISTS manage_phase_transition();

-- 2. Instalar função cron
-- Execute: auto-advance-phase-FIXED.sql (até PASSO 2)

-- 3. Agendar job cron
SELECT cron.schedule(
  'auto-advance-phase-job',
  '* * * * *',
  $$ SELECT auto_advance_phase(); $$
);

-- 4. Verificar
SELECT * FROM cron.job WHERE jobname = 'auto-advance-phase-job';
```

---

**Se escolher Sistema Trigger:**

```sql
-- 1. Remover cron
SELECT cron.unschedule('auto-advance-phase-job');
DROP FUNCTION IF EXISTS auto_advance_phase();

-- 2. Instalar trigger
-- Execute: auto-advance-phase-IMPROVED.sql

-- 3. MODIFICAR API /advance-quest para setar status = 'completed'
-- MODIFICAR QuestAutoAdvancer para não chamar API (deixar trigger fazer tudo)
```

---

## ⚠️ AVISOS IMPORTANTES

1. **NÃO execute múltiplos scripts SQL sem auditoria**
   - Cada script pode sobrescrever o anterior
   - Estado do banco fica inconsistente

2. **NÃO misture sistemas cron e trigger**
   - Escolha UM e mantenha

3. **SEMPRE teste funções antes de agendar cron**
   ```sql
   SELECT auto_advance_phase(); -- Ver logs
   ```

4. **DOCUMENTE qual sistema está ativo**
   - Adicione comentário no `.env` ou README

---

## 🎯 PRÓXIMOS PASSOS

1. **EXECUTAR:** `AUDIT_AUTO_ADVANCE_SYSTEM.sql`
2. **ANALISAR:** Resultados da auditoria
3. **DECIDIR:** Cron ou Trigger?
4. **LIMPAR:** Remover sistema não escolhido
5. **INSTALAR:** Sistema escolhido
6. **TESTAR:** Função manualmente
7. **VERIFICAR:** Logs e comportamento

---

## 📊 CHECKLIST DE VALIDAÇÃO

Após correção, verificar:

- [ ] Apenas UMA função existe (`auto_advance_phase` OU `manage_phase_transition`)
- [ ] Apenas UM sistema ativo (cron OU trigger)
- [ ] Job cron ativo (se sistema cron) OU trigger ativo (se sistema trigger)
- [ ] Função executa sem erros (`SELECT auto_advance_phase();`)
- [ ] Fase avança corretamente quando todas quests expiram
- [ ] Quest 1 da próxima fase inicia automaticamente
- [ ] `phase_X_start_time` é setado corretamente
- [ ] Logs no SQL Editor mostram comportamento esperado

---

## 📞 AÇÃO IMEDIATA REQUERIDA

**EXECUTE AGORA:**

1. Abra Supabase Dashboard > SQL Editor
2. Cole e execute: `AUDIT_AUTO_ADVANCE_SYSTEM.sql`
3. Me envie os resultados
4. Eu vou analisar e dizer exatamente qual correção aplicar

---

**FIM DO RELATÓRIO**
