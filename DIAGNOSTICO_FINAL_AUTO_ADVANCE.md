# ✅ DIAGNÓSTICO COMPLETO: Sistema de Auto-Advance

**Data:** 19 de Novembro de 2025  
**Status:** ⚠️ **FUNCIONANDO, MAS PRECISA CORREÇÃO**

---

## 📊 RESULTADO DA AUDITORIA

### ✅ **O QUE ESTÁ BEM**

1. **pg_cron habilitado** ✅
2. **Jobs cron ativos (2 jobs)** ✅
   - `auto-advance-phase-job` - Avança fases a cada 1 minuto
   - `auto-start-next-quest-job` - Avança quests a cada 1 minuto
3. **Função `auto_advance_phase()` existe** ✅
4. **Função `auto_start_next_quest()` existe** ✅
5. **Trigger `auto_set_quest_started_at` ativo** ✅ (preenche started_at automaticamente)
6. **Evento iniciado** ✅
7. **Quest 1.1 ativa e rodando** ✅

---

## ⚠️ **PROBLEMAS ENCONTRADOS**

### 1. **CRÍTICO: Faltam Timestamps de Fases**

```
phase_1_start_time: 2025-11-19 13:27:29.816 ✅
phase_2_start_time: null ❌
phase_3_start_time: null ❌  
phase_4_start_time: null ❌
phase_5_start_time: null ❌
```

**Impacto:**
- Quando avançar para Fase 2, `phase_2_start_time` ficará `NULL`
- Live Dashboard vai quebrar (não consegue calcular countdown)
- Timer de fase vai mostrar valores errados

**Causa:**
A função `auto_advance_phase()` atual faz:
```sql
UPDATE event_config
SET current_phase = v_next_phase,
    updated_at = NOW()
-- ❌ FALTA: phase_X_start_time = NOW()
```

**Solução:**
Aplicar `FIX_AUTO_ADVANCE_TIMESTAMPS.sql` que corrige para:
```sql
EXECUTE format(
  'UPDATE event_config 
   SET current_phase = $1,
       phase_%s_start_time = NOW(),  -- ✅ CORRIGIDO
       updated_at = NOW()',
  v_next_phase
)
```

---

### 2. **MENOR: Auto-Start Sem Validação de Quests Não Iniciadas**

A função `auto_start_next_quest()` funciona, mas pode tentar avançar para Quest 1.2 mesmo se houver quests não iniciadas.

**Não é crítico agora** porque `auto_advance_phase()` já valida isso para avanço de fase.

---

### 3. **MENOR: Erro em Query de Submissões**

A Parte 6 da auditoria deu erro:
```
ERROR: column s.created_at does not exist
```

**Causa:** Tabela `submissions` não tem coluna `created_at`, provavelmente é `submitted_at`.

**Impacto:** Apenas no script de auditoria, não afeta o sistema.

---

## 🔧 CORREÇÃO IMEDIATA NECESSÁRIA

### **Aplicar Fix de Timestamps**

Execute este SQL no Supabase Dashboard:

```sql
-- Abra: FIX_AUTO_ADVANCE_TIMESTAMPS.sql
-- Execute TODO o arquivo
```

Isso vai:
1. ✅ Substituir `auto_advance_phase()` pela versão corrigida
2. ✅ Garantir que `phase_X_start_time` seja setado automaticamente
3. ✅ Testar a função manualmente
4. ✅ Verificar estado atual

---

## 📋 ESTADO ATUAL DO SISTEMA

### **Fase Atual:** 1
### **Quest Ativa:** 1.1 - Conhecendo o Terreno
- **Iniciada:** 13:27:29 (há ~1h30)
- **Duração:** 60 minutos
- **Janela atraso:** 15 minutos
- **Expira em:** 14:42:29 (faltam ~15 minutos) ⏰

### **Próximas Quests (não iniciadas):**
- Quest 1.2 - A Persona Secreta (50 min)
- Quest 1.3 - Construindo Pontes (30 min)
- BOSS 1 - Defesa do Problema (10 min)

---

## 🎯 FLUXO ESPERADO

### **Quando Quest 1.1 expirar (14:42:29):**

1. **`auto_start_next_quest()`** (roda a cada 1 min)
   - Detecta que Quest 1.1 expirou
   - Inicia Quest 1.2 automaticamente
   - Seta `started_at = NOW()` e `status = 'active'`

2. **Ou `/advance-quest` API** (chamado pelo frontend QuestAutoAdvancer)
   - Frontend detecta expiração (polling 10s)
   - Chama API para fechar Quest 1.1
   - API fecha quest (`status = 'closed'`)
   - ⚠️ **API NÃO avança para próxima quest** (isso é job do cron)

**Possível Race Condition:**
- API e Cron podem competir para avançar quest
- Não é crítico (cron verifica se quest já foi iniciada)

---

### **Quando todas quests da Fase 1 expirarem:**

1. **`auto_advance_phase()`** (roda a cada 1 min)
   - Conta quests expiradas + submetidas
   - Se soma >= 4 (total de quests):
     - Avança `current_phase` de 1 → 2
     - ✅ **Seta `phase_2_start_time = NOW()`** (após fix)
     - Inicia Quest 2.1 automaticamente

---

## ⚠️ AVISOS IMPORTANTES

### **1. Quest 1.1 vai expirar em ~15 minutos**

Se você **NÃO** aplicar o fix agora:
- Fases 1→2, 2→3, etc. vão avançar **SEM** setar timestamps
- Live Dashboard vai quebrar nas próximas fases
- Você terá que setar timestamps manualmente depois

### **2. Dois Sistemas Competindo**

Você tem:
- **Cron `auto_start_next_quest`** - Inicia próxima quest
- **API `/advance-quest`** - Fecha quest atual (mas não avança)

Isso pode causar inconsistências. Recomendo:
- **Opção A:** Desabilitar cron `auto_start_next_quest` (deixar apenas API)
- **Opção B:** Desabilitar chamada da API no frontend (deixar apenas cron)

**Por enquanto, deixe como está** (ambos funcionando). Se houver problemas, ajustamos.

---

## 🎯 AÇÃO IMEDIATA

**EXECUTE AGORA (antes de Quest 1.1 expirar):**

```bash
# 1. Abra Supabase Dashboard > SQL Editor
# 2. Cole e execute: FIX_AUTO_ADVANCE_TIMESTAMPS.sql
# 3. Verifique logs no painel "Messages"
```

Depois me confirme que executou, e eu verifico se ficou correto!

---

## 📊 CHECKLIST PÓS-CORREÇÃO

Após aplicar fix, verificar:

- [ ] Função `auto_advance_phase()` atualizada (veja logs)
- [ ] Teste manual retorna logs corretos
- [ ] `phase_1_start_time` continua preenchido
- [ ] Sistema continua rodando normalmente

Quando Fase 1 terminar e avançar para Fase 2:

- [ ] `current_phase` = 2
- [ ] `phase_2_start_time` está preenchido (não NULL)
- [ ] Quest 2.1 foi iniciada automaticamente
- [ ] Live Dashboard mostra timer correto

---

**FIM DO DIAGNÓSTICO**

**Próximo passo:** Aplicar `FIX_AUTO_ADVANCE_TIMESTAMPS.sql` agora!
