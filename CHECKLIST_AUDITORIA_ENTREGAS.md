# 🔍 Checklist de Validação: Sistema de Entregas

## Contexto do Problema Anterior
- ❌ Uma equipe não conseguiu submeter entrega
- ❌ Acontecia durante confusão de Quest 1.1 voltando
- ❌ Precisa investigar erro 500 associado
- ⏰ Validar prazos: normal vs atraso

---

## 📋 SEÇÕES DO SCRIPT DE AUDITORIA

### 1️⃣ SUBMISSÕES COM ERRO/REJEITADAS (últimas 72h)
**O que procurar:**
- ✅ Status = 'rejected', 'error', 'pending'
- ✅ is_late = true
- ✅ late_penalty_applied > 0

**Se encontrar:**
- 🚩 **Status "error"** → erro 500 no backend
- 🚩 **Status "rejected"** → validação falhou
- 🚩 **Sem arquivo + type file** → upload falhou

---

### 2️⃣ VALIDAÇÃO DE PRAZOS E PENALIDADES
**O que verificar:**
- ✅ NO PRAZO → penalidade DEVE ser 0
- ✅ ATRASADA → penalidade DEVE ser > 0
- ❌ NO PRAZO mas penalidade > 0 → BUG!
- ❌ ATRASADA mas penalidade = 0 → BUG!

**Coluna "validacao":**
```
✅ CORRETO          = lógica funcionando
❌ ERRO: ...        = bug na validação
⚠️ VERIFICAR        = caso especial
```

---

### 3️⃣ HISTÓRICO DE TENTATIVAS POR EQUIPE
**Identifica padrões:**
- Multiple tentativas = equipe tentou reenviar
- Rejeitadas vs sucesso = taxa de falha
- Tempo entre tentativas = quanto tempo esperou

**Análise:**
- Se `total_tentativas > 1` → problemas recorrentes
- Se `rejeitadas > 0` → validação falhou

---

### 4️⃣ CORRELAÇÃO ERRO × DEADLINE
**Questão chave:** Os erros 500 acontecem mais em prazo normal ou atraso?

**Interpretação:**
```
PRAZO_NORMAL | 5 submissões | 1 erro | 20% taxa erro
PRAZO_ATRASO | 3 submissões | 2 erros | 67% taxa erro ← PROBLEMA!
```

Se taxa erro é alta em PRAZO_ATRASO → bug na validação de atraso

---

### 5️⃣ SUBMISSÕES REJEITADAS - MOTIVOS
**Categorias comuns:**
- 🚫 ALÉM DA JANELA (>15min) → bloqueado corretamente
- ⚠️ COM PENALIDADE → bloqueado? Deveria passar
- 📄 SEM ARQUIVO → upload falhou
- ⏳ NÃO FINALIZADA → timeout

---

### 6️⃣ TESTE DE VALIDAÇÃO - Função calculate_late_penalty()
**Tabela de testes:**
```
0 seg     → 0 pts      ✅ (no prazo)
30 seg    → 5 pts      ✅ (arredonda 1 min)
3 min     → 5 pts      ✅
5 min     → 5 pts      ✅ (limite)
7 min     → 10 pts     ✅
12 min    → 15 pts     ✅ (limite)
16 min    → -1 (rejeita) ✅
```

**Se algum teste FALHAR:**
- ❌ Função não foi atualizada corretamente
- ❌ Precisa re-executar FIX_LATE_SUBMISSION_SECONDS.sql

---

### 7️⃣ RESUMO EXECUTIVO
**Métricas de saúde:**
```
Taxa de sucesso: > 95% ✅ (ok)
                 < 90% ❌ (problema sério)

Taxa de falha:   > 10% ❌ (investigar)
                 < 5%  ✅ (ok)

Com penalidade:  deve ser ~2-5% (normal)
                 > 20% ❌ (muitos atrasados?)
```

---

## 🎯 AÇÃO POR RESULTADO

### Se encontrar erros 500 em PRAZO_ATRASO:
1. Verificar logs do Vercel
2. Testar endpoint `/api/submissions/create` manualmente
3. Verificar se `calculate_late_penalty()` está retornando valor válido

### Se encontrar rejeitadas sem motivo claro:
1. Verificar campo `late_minutes` - pode estar NULL
2. Verificar se `is_late` foi calculado corretamente
3. Testar trigger `update_late_submission_fields()`

### Se encontrar discrepância (prazo × penalidade):
1. Verificar `quest_deadline` na submission
2. Comparar com `started_at + planned_deadline_minutes`
3. Pode haver timezone mismatch

---

## 📊 PRÓXIMAS AÇÕES

**Depois de executar o script:**

1. **Buscar padrão:**
   - Todos os erros em prazo atraso? → bug de atraso
   - Todos em mesma quest? → bug específico daquela quest
   - Aleatório? → pode ser timeout de rede

2. **Consultar logs:**
   - Vercel: Deployments → función route.ts → logs
   - Supabase: SQL Editor → query performance

3. **Testar manualmente:**
   - Submeter arquivo no prazo normal
   - Submeter arquivo em prazo atraso
   - Submeter após expiração

4. **Se continuar errando:**
   - Reexecutar `FIX_LATE_SUBMISSION_SECONDS.sql`
   - Fazer rollback se necessário

---

## 🚨 RED FLAGS

Procure por estes padrões:

| Pattern | Significado | Ação |
|---------|------------|------|
| Muitos "error" em PRAZO_ATRASO | Bug em validação de atraso | Verificar calculate_late_penalty() |
| "rejected" sem penalidade aplicada | Rejeitada mas sem motivo | Debug trigger |
| Sem arquivo mas status "submitted" | Upload falhou mas registrou | Verificar file_path NULL |
| Tempo grande entre tentativas | Equipe esperou reenviar | Possível timeout |
| Taxa erro > 10% | Muitos problemas | Problema sistêmico |

---

## 📝 NOTAS DA IMPLEMENTAÇÃO

- ✅ FIX_LATE_SUBMISSION_SECONDS.sql foi aplicado
- ✅ Função usa SECONDS agora (não MINUTES)
- ✅ calculate_late_penalty() faz CEIL() para não truncar
- ✅ Tratamento de erro melhorado em SubmissionForm.tsx
- ⚠️ Limite 5MB ainda pode bloquear arquivos maiores
  - Se problema, usar SOLUCOES_VERCEL_LIMITE_UPLOAD.md

