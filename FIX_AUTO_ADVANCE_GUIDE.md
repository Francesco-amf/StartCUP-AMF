# 🚨 CORREÇÃO URGENTE: Auto-Advance Descontrolado

## 📋 Problema Identificado

O auto-advance avançou rapidamente da Fase 1 → Fase 5 porque:

1. **TODAS as 20 quests foram iniciadas simultaneamente** (started_at definido)
2. Como têm prazos curtos (10-120 min), **todas expiraram rapidamente**
3. Auto-advance detectou "todas expiradas" em cada fase
4. Avançou Fase 1 → 2 → 3 → 4 → 5 em minutos

### Causa Raiz
- ❌ Lógica não verificava se quests **não iniciaram** ainda
- ❌ Aceitava `v_not_started > 0` como válido para avanço
- ❌ Todas as quests foram iniciadas de uma vez (bug separado)

---

## 🔧 SOLUÇÃO - PASSO A PASSO

### **PASSO 1: Parar Auto-Advance Imediatamente**

Abra **Supabase Dashboard > SQL Editor** e execute:

```sql
SELECT cron.unschedule('auto-advance-phase-job');
```

**Resultado esperado:** Mensagem de sucesso  
**Verificar:**
```sql
SELECT * FROM cron.job WHERE jobname = 'auto-advance-phase-job';
-- Deve retornar 0 linhas
```

---

### **PASSO 2: Resetar Evento Para Estado Inicial**

Execute o arquivo: **`RESET_EVENT_TO_START.sql`**

Isso vai:
- ✅ Voltar para Fase 1
- ✅ Limpar `started_at` de TODAS as quests
- ✅ Iniciar APENAS Quest 1.1

**Verificar:**
```sql
SELECT 
  p.order_index as fase,
  q.order_index,
  q.name,
  q.status,
  q.started_at IS NOT NULL as iniciada
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;
```

**Resultado esperado:**
- Fase 1, Quest 1: `iniciada = TRUE`
- Todas as outras: `iniciada = FALSE`

---

### **PASSO 3: Instalar Função Corrigida**

Execute o arquivo: **`auto-advance-phase-FIXED.sql`**

**IMPORTANTE:** Execute APENAS até o "PASSO 2" (a função). **NÃO** descomente o cron.schedule ainda!

**Mudanças na nova versão:**
```sql
-- ✅ CORREÇÃO 1: Verificar quests não iniciadas
SELECT COUNT(*) INTO v_not_started_quests
WHERE started_at IS NULL;

IF v_not_started_quests > 0 THEN
  RETURN; -- NÃO avançar se há quests não iniciadas
END IF;

-- ✅ CORREÇÃO 2: Só contar quests que iniciaram
v_all_expired := (v_expired_quests + v_submitted_quests) >= v_total_quests;

-- ✅ CORREÇÃO 3: Iniciar Quest 1 da próxima fase automaticamente
UPDATE quests SET started_at = NOW()
WHERE (próxima fase, quest 1);
```

---

### **PASSO 4: Testar Manualmente**

Execute:
```sql
SELECT auto_advance_phase();
```

**No painel "Messages" deve aparecer:**
```
========================================
Verificando Fase 1
Total de quests na Fase 1: 4
Quests não iniciadas: 3
⏳ Fase 1 ainda tem 3 quest(s) não iniciada(s). Aguardando.
========================================
```

**✅ Se viu essa mensagem:** Funcionou! A função detectou corretamente que há quests não iniciadas.

**❌ Se avançou a fase:** Algo está errado, me avise!

---

### **PASSO 5: Agendar Auto-Advance (Opcional)**

**SOMENTE** execute se o teste do PASSO 4 passou:

```sql
SELECT cron.schedule(
  'auto-advance-phase-job',
  '* * * * *',
  $$ SELECT auto_advance_phase(); $$
);
```

**Verificar agendamento:**
```sql
SELECT jobname, schedule, active 
FROM cron.job 
WHERE jobname = 'auto-advance-phase-job';
```

---

## 🧪 Como Testar o Fluxo Completo

### Teste 1: Quest Expira → Não Avança (Correto)
```
1. Apenas Quest 1.1 está ativa
2. Aguardar 75 minutos (60 + 15 de atraso)
3. Quest 1.1 expira
4. Auto-advance executa
5. ✅ NÃO deve avançar (quests 1.2, 1.3, BOSS não iniciaram)
```

### Teste 2: Todas Expiram → Avança (Correto)
```
1. Quest 1.1 iniciada e expirada
2. Manualmente iniciar Quest 1.2, 1.3, BOSS
3. Aguardar todas expirarem
4. Auto-advance executa
5. ✅ DEVE avançar para Fase 2
6. ✅ Quest 2.1 deve iniciar automaticamente
```

### Teste 3: Submissão Conta Como "Processada"
```
1. Quest 1.1 ativa
2. Equipe submete Quest 1.1
3. Quest 1.2, 1.3, BOSS iniciam e expiram
4. Auto-advance: 1 submetida + 3 expiradas = 4/4
5. ✅ DEVE avançar para Fase 2
```

---

## 🚧 PROBLEMA PENDENTE: Iniciar Quests Automaticamente

A função corrigida **apenas inicia Quest 1 da próxima fase** quando avança.

**Você precisa de um sistema que:**
- Inicia Quest 1.2 quando Quest 1.1 termina (submete ou expira)
- Inicia Quest 1.3 quando Quest 1.2 termina
- Etc.

**Esse sistema EXISTE?** Se sim, onde está o código/trigger?

**Opções:**
1. **Manual:** Admin inicia cada quest via dashboard
2. **Trigger SQL:** Trigger que detecta fim de quest e inicia próxima
3. **API/Frontend:** Código que chama endpoint para iniciar próxima quest

**Me diga qual é o fluxo desejado** e crio a solução!

---

## 📊 Estado Atual vs Esperado

| Item | ❌ Antes (Bugado) | ✅ Depois (Corrigido) |
|------|-------------------|----------------------|
| **Quests iniciadas** | Todas as 20 | Apenas Quest 1.1 |
| **Auto-advance** | Avança mesmo com quests não iniciadas | Só avança se TODAS iniciaram |
| **Fase atual** | 5 (incorreto) | 1 (correto) |
| **Cron ativo** | Sim (bugado) | Não (parado) |

---

## ⚠️ Próximos Passos

1. ✅ Execute PASSO 1 (parar cron)
2. ✅ Execute PASSO 2 (resetar evento)
3. ✅ Execute PASSO 3 (instalar função corrigida)
4. ✅ Execute PASSO 4 (testar manualmente)
5. ⏸️ AGUARDE antes de executar PASSO 5 (agendar cron)

**Me avise quando completar cada passo** para eu confirmar que está funcionando!
