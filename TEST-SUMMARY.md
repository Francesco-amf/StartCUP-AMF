# Resumo Executivo - Problemas dos Testes

## 3 Problemas Identificados

### ✅ 1. "Voltou Refresh" - RESOLVIDO
**Status:** 🟢 **RESOLVIDO**

**Problema:** Página recarregava ao abrir dashboard de avaliador/equipe ou ao submeter.

**Causa:** Componente `TeamPageRealtime.tsx` que:
- Fazia polling a cada 2 segundos
- Chamava `router.refresh()` em qualquer mudança
- Causava recarga total da página

**Solução Aplicada:**
- ✅ Componente removido de todos os dashboards
- ✅ Substituído por polling inteligente com debounce
- ✅ Dados atualizam sem refresh de página

**Arquivos Afetados:**
- `src/components/TeamPageRealtime.tsx` (REMOVIDO)
- `src/app/(evaluator)/evaluate/page.tsx`
- `src/app/(team)/dashboard/page.tsx`
- `src/app/(team)/submit/page.tsx`

---

### 🔴 2. "Atraso entre Quests" - INVESTIGAÇÃO
**Status:** 🟡 **Requer Investigação**

**Problema:** Uma quest não avançou automaticamente para a próxima quando o deadline expirou.

**Sistema Implementado:**
- Polling automático a cada 500ms via `QuestAutoAdvancer.tsx`
- Deadline: `planned_deadline_minutes` (ex: 2 minutos)
- Late window: 15 minutos adicionais para submissão atrasada

**Diagnóstico:**
- ✅ Sistema de timing está implementado corretamente
- ✅ API `/api/admin/advance-quest` existe
- ❌ Pode ter falhado o polling ou API respondeu lentamente

**Ação Necessária:**
1. Verificar logs do servidor durante o teste
2. Procurar por erros em `QuestAutoAdvancer`
3. Verificar se API respondeu com status 200
4. Confirmar se `planned_deadline_minutes` está configurado (> 0)

**Arquivos Relacionados:**
- `src/components/QuestAutoAdvancer.tsx`
- `src/app/api/admin/advance-quest/route.ts`
- `src/components/dashboard/CurrentQuestTimer.tsx`

---

### 🔴 3. "Penalidade por Atraso Não Aplicada" - BUG CONFIRMADO
**Status:** 🔴 **BUG IDENTIFICADO**

**Problema:** Equipe "Áurea Forma" submeteu atrasada mas NÃO recebeu penalidade automática de -5 pontos.

**O Que Foi Descoberto:**
```
Submissão ID: 9667cec3-685e-49f2-a4dc-2fb951f42cd8
✅ is_late = TRUE (sistema detectou atraso)
✅ late_minutes = 0 min (arredondado)
❌ late_penalty_applied = NULL (BUG - deveria ser 5)
❌ Sem registro em penalties com penalty_type='atraso'
```

**Causa Provável:**
A RPC `validate_submission_allowed()` não retornou o valor correto para `penalty_calculated`, então a API não inseriu a penalidade.

**Possibilidades:**
1. `penalty_calculated` retornou `NULL`
2. `penalty_calculated` retornou `0`
3. Erro na chamada da RPC (timeout/exceção)
4. Error handling silenciou a exceção

**Ação Necessária:**
1. Adicionar logs na RPC `calculate_late_penalty()`
2. Adicionar logs na API `submissions/create/route.ts` linha 267-282
3. Executar teste novamente com logs habilitados

**Arquivos Relacionados:**
- `add-late-submission-system.sql` (RPC validate_submission_allowed)
- `src/app/api/submissions/create/route.ts` (Inserção de penalidade)
- `create-penalties-system.sql` (Estrutura penalties)

---

## Dados Coletados

### Configuração de Quests
```
Total de Quests: 19
Deadline padrão: 2 minutos
Late window: 1 minuto
Status: Mix de 'scheduled', 'active', 'closed'
```

### Equipe Áurea Forma
```
Email: aureaforma@startcup-amf.com
Submissões totais: 1
Submissões atrasadas: 1
Penalidades registradas: 1
  - Tipo: 'desorganizacao' (MANUAL, não 'atraso' automática)
  - Pontos: -10 (não -5 automático)
  - Data: 14/11/2025, 02:54:14
```

### Estatísticas Gerais
```
Equipes: 15
Submissões: 1
Penalidades: 1
Submissões atrasadas detectadas: 1
Penalidades automáticas aplicadas: 0 ❌
```

---

## Prioridade de Correção

1. **🔴 ALTA** - Penalidade por atraso (BUG confirmado, afeta pontuação)
2. **🟡 MÉDIA** - Atraso entre quests (afeta fluxo, requer investigação)
3. **🟢 BAIXA** - Refresh na página (já resolvido)

---

## Como Reproduzir o BUG

1. Criar uma quest com `planned_deadline_minutes = 2`
2. Iniciar a quest
3. Esperar 3 minutos (passar do deadline)
4. Submeter resposta (será marcada como atrasada)
5. Verificar tabela `submissions`:
   - Campo `is_late` deve ser TRUE ✅
   - Campo `late_penalty_applied` deve ser 5 ou NULL ❌

6. Verificar tabela `penalties`:
   - Deve ter registro com `penalty_type = 'atraso'` ❌
   - Com `points_deduction = 5`

---

## Próximos Passos

### Imediato
- [ ] Adicionar logs na RPC `validate_submission_allowed()`
- [ ] Adicionar logs na API `submissions/create/route.ts`
- [ ] Re-executar teste para capturar logs

### Curto Prazo
- [ ] Verificar logs do servidor para problema do atraso entre quests
- [ ] Corrigir BUG da penalidade automática
- [ ] Executar testes novamente

### Médio Prazo
- [ ] Implementar melhor tratamento de erros
- [ ] Adicionar alertas para falhas de sistema
- [ ] Documentar timeline de cada evento

---

