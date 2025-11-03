# Guia de Integração - Sistema de Submissões com Atraso

## 🚀 Resumo Executivo

Foi implementado um sistema completo de submissões com:
- ✅ Janela de atraso de 15 minutos após deadline
- ✅ Penalidades progressivas: 5/10/15 pontos
- ✅ Bloqueio automático após 15 minutos
- ✅ Bloqueio sequencial de quests
- ✅ Validação 100% server-side

**Nenhuma alteração necessária no código existente** - o sistema foi projetado para funcionar em paralelo.

## 📋 Arquivos Criados/Modificados

### Novos Arquivos

1. **add-late-submission-system.sql**
   - Altera schema das tabelas `submissions` e `quests`
   - Cria 5 funções PL/pgSQL para validação
   - Cria 1 trigger automático
   - Cria 1 view para análise

2. **src/app/api/submissions/create/route.ts**
   - Novo endpoint para criar submissões
   - Substitui insert direto do banco
   - Implementa todas as validações

3. **src/components/quest/SubmissionDeadlineStatus.tsx**
   - Novo componente para mostrar status do deadline
   - Atualiza a cada 10 segundos
   - Mostra penalidade esperada se atrasado

4. **src/app/api/admin/quest/deadline/route.ts**
   - Endpoints para gerenciar deadlines
   - POST para configurar
   - GET para consultar

5. **LATE_SUBMISSION_SYSTEM.md**
   - Documentação técnica completa
   - Explicação de todas as funções
   - Exemplos de fluxos

6. **LATE_SUBMISSION_INTEGRATION.md** (este arquivo)
   - Guia de integração
   - Instruções de deployment
   - Testes

### Arquivos Modificados

1. **src/components/forms/SubmissionForm.tsx**
   - Agora usa `/api/submissions/create` em vez de insert direto
   - Integra `SubmissionDeadlineStatus` component
   - Trata erros de validação com detalhes

## 🔧 Passos de Implementação

### Passo 1: Executar SQL de Migração

```sql
-- No Supabase SQL Editor, execute:
-- Copie todo o conteúdo de add-late-submission-system.sql
```

**O que faz**:
- Adiciona 5 novos campos em `submissions`
- Adiciona 3 novos campos em `quests`
- Cria índices para performance
- Cria 5 funções PL/pgSQL
- Cria 1 trigger automático
- Cria 1 view para auditoria

**Tempo estimado**: < 5 segundos

### Passo 2: Fazer Deploy dos Arquivos

```bash
# Os arquivos TypeScript são automaticamente deployados
# quando você faz git push para a branch main
```

**Arquivos a fazer deploy**:
- `src/app/api/submissions/create/route.ts`
- `src/app/api/admin/quest/deadline/route.ts`
- `src/components/quest/SubmissionDeadlineStatus.tsx`
- `src/components/forms/SubmissionForm.tsx` (modificado)

### Passo 3: Testar o Sistema

Veja seção "Testes" abaixo.

## 🧪 Testes

### Teste 1: Submissão No Prazo

```bash
1. Criar quest nova com:
   - planned_deadline_minutes = 30
   - started_at = NOW()

2. Ir para page /submit como time

3. Deve mostrar:
   "✅ No Prazo - 30 minutos restantes"

4. Enviar submissão

5. Verificar:
   - submissions.is_late = FALSE
   - submissions.late_minutes = 0
   - submissions.late_penalty_applied = 0
   - penalties table = vazia
```

### Teste 2: Submissão Atrasada (3 minutos)

```bash
1. Modificar quest:
   - started_at = NOW() - 33 minutos (força atraso)
   - planned_deadline_minutes = 30

2. Ir para /submit

3. Deve mostrar:
   "⏰ Submissão Atrasada - 3 min atrasado(a) - Penalidade: -5pts"

4. Enviar submissão

5. Verificar:
   - submissions.is_late = TRUE
   - submissions.late_minutes = 3
   - submissions.late_penalty_applied = 5
   - penalties table tem 1 entrada com points_deduction = 5

6. Ranking deve refletir -5pts
```

### Teste 3: Submissão Atrasada (8 minutos)

```bash
1. Modificar quest:
   - started_at = NOW() - 38 minutos
   - planned_deadline_minutes = 30

2. Enviar submissão

3. Verificar:
   - late_penalty_applied = 10
   - penalties.points_deduction = 10
```

### Teste 4: Submissão Bloqueada (20 minutos)

```bash
1. Modificar quest:
   - started_at = NOW() - 50 minutos
   - planned_deadline_minutes = 30

2. Ir para /submit

3. Deve mostrar:
   "🚫 Prazo Expirado"

4. Tentar enviar via API:

fetch('/api/submissions/create', {
  method: 'POST',
  body: new FormData([
    ['questId', '...'],
    ['teamId', '...'],
    ['deliverableType', 'text'],
    ['content', 'teste']
  ])
})

5. Deve retornar:
   {
     "error": "Prazo para submissão expirou completamente",
     "details": { "allowed": false }
   }

6. Status: 400
```

### Teste 5: Bloqueio Sequencial

```bash
1. Criar 2 quests na mesma fase:
   - Quest 1: order_index = 1
   - Quest 2: order_index = 2

2. Ir para /submit como time

3. Tentar enviar Quest 2 sem entregar Quest 1

4. Deve mostrar erro:
   "Você deve primeiro enviar a quest anterior"

5. Enviar Quest 1

6. Agora Quest 2 deve estar disponível

7. Tentar enviar Quest 2 deve funcionar
```

### Teste 6: Arquivo Upload com Atraso

```bash
1. Configurar quest com:
   - deliverable_type = 'file'
   - started_at = NOW() - 3 minutos
   - planned_deadline_minutes = 1

2. Ir para /submit

3. Selecionar arquivo > 50MB

4. Deve mostrar erro imediatamente:
   "Arquivo muito grande. Máximo: 50MB..."

5. Selecionar arquivo válido (< 50MB)

6. Status deve mostrar "Submissão Atrasada - 3 min - Penalidade: -5pts"

7. Enviar

8. Deve fazer upload E aplicar penalidade automaticamente
```

## 📊 Verificar Dados

### Query para Verificar Submissões Atrasadas

```sql
SELECT
  s.id,
  s.team_id,
  t.name as team_name,
  s.quest_id,
  q.name as quest_name,
  s.submitted_at,
  s.quest_deadline,
  s.is_late,
  s.late_minutes,
  s.late_penalty_applied
FROM submissions s
JOIN teams t ON s.team_id = t.id
JOIN quests q ON s.quest_id = q.id
WHERE s.is_late = TRUE
ORDER BY s.submitted_at DESC
```

### Query para Verificar Penalidades Automáticas

```sql
SELECT
  p.id,
  p.team_id,
  t.name,
  p.penalty_type,
  p.points_deduction,
  p.reason,
  p.assigned_by_admin,
  p.created_at
FROM penalties p
JOIN teams t ON p.team_id = t.id
WHERE p.penalty_type = 'atraso'
ORDER BY p.created_at DESC
```

### Usar View Late Submissions Summary

```sql
SELECT * FROM late_submissions_summary
WHERE is_late = TRUE
LIMIT 10
```

## 🛠️ Troubleshooting

### Problema: Penalidade não foi criada automaticamente

**Possível causa 1**: Quest não tem `started_at`
```sql
-- Verificar
SELECT id, started_at FROM quests WHERE status = 'active'

-- Corrigir
UPDATE quests SET started_at = NOW() WHERE started_at IS NULL
```

**Possível causa 2**: Função `calculate_late_penalty` retornando NULL
```sql
-- Isso acontece quando late_minutes > 15
-- Nesse caso, submissão DEVE ser bloqueada, não ter penalidade
```

### Problema: Submissão aceita mesmo após 15 minutos

**Verificar**: A função `validate_submission_allowed` está sendo chamada?

```typescript
// No endpoint, certifique-se que:
const { data: validationResult } = await supabase
  .rpc('validate_submission_allowed', {
    team_id_param: teamId,
    quest_id_param: questId
  })

if (!validationResult?.is_allowed) {
  // Rejeitar
  return NextResponse.json({ error: ... }, { status: 400 })
}
```

### Problema: Component SubmissionDeadlineStatus não mostra nada

**Verificar**:
1. Quest tem `started_at`?
2. `planned_deadline_minutes` está setado?

```javascript
// Debug no console
console.log('Deadline info:', {
  questStartedAt: quest.started_at,
  plannedDeadline: quest.planned_deadline_minutes,
  now: new Date().toISOString()
})
```

## 📱 Configuração de Exemplo para Fase 1

```javascript
// Script para configurar Phase 1 com deadlines

const phase1Quests = [
  {
    order: 1,
    name: "Descoberta - Quest 1",
    deadlineMinutes: 30,
    deliverableType: "file"
  },
  {
    order: 2,
    name: "Descoberta - Quest 2",
    deadlineMinutes: 25,
    deliverableType: "text"
  },
  {
    order: 3,
    name: "Descoberta - Quest 3",
    deadlineMinutes: 20,
    deliverableType: "url"
  }
];

// Para cada quest:
const response = await fetch('/api/admin/quest/deadline', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    questId: quest.id,
    plannedDeadlineMinutes: quest.deadlineMinutes,
    allowLateSubmissions: true
  })
})
```

## 🎯 Próximas Integrações Recomendadas

### 1. Admin Control Panel Enhancement
Adicionar seção para:
- Visualizar quests com deadlines
- Configurar deadline de uma quest selecionada
- Ver submissões atrasadas em tempo real

### 2. Email Notifications
Quando deadline está próximo (15 min antes):
- Enviar email para todas as equipes
- "Atenção: Faltam 15 minutos para o deadline da Quest X"

### 3. Dashboard Analytics
- Gráfico de atrasos por quest
- Gráfico de penalidades por equipe
- Distribuição de submissões (ontime vs late)

### 4. Manual Deadline Extension
Permitir admin:
- Estender deadline para uma quest
- Registrar motivo da extensão
- Notificar equipes afetadas

## ✅ Checklist de Deployment

- [ ] SQL executado no Supabase com sucesso
- [ ] Não há erros de constraint ou FK
- [ ] Arquivos .ts fazem deploy sem erros
- [ ] Teste 1 passando (submissão no prazo)
- [ ] Teste 2 passando (submissão atrasada)
- [ ] Teste 3 passando (bloqueio após 15min)
- [ ] Teste 4 passando (bloqueio sequencial)
- [ ] Query de verificação mostra dados corretos
- [ ] Penalidades aparecem no ranking
- [ ] Admin pode configurar deadlines
- [ ] Não há erros de console
- [ ] Performance está OK (< 500ms por submissão)

## 🚨 Rollback (se necessário)

```sql
-- Se precisar reverter a migração:

-- 1. Remover trigger
DROP TRIGGER IF EXISTS update_late_submission_fields_trigger ON submissions;

-- 2. Remover funções
DROP FUNCTION IF EXISTS update_late_submission_fields();
DROP FUNCTION IF EXISTS calculate_quest_deadline(UUID);
DROP FUNCTION IF EXISTS calculate_late_penalty(INTEGER);
DROP FUNCTION IF EXISTS validate_submission_allowed(UUID, UUID);
DROP FUNCTION IF EXISTS check_previous_quest_submitted(UUID, UUID);
DROP FUNCTION IF EXISTS is_late_submission_window_open(UUID);

-- 3. Remover view
DROP VIEW IF EXISTS late_submissions_summary CASCADE;

-- 4. Remover colunas (cuidado! dados serão perdidos)
ALTER TABLE submissions
DROP COLUMN IF EXISTS submitted_at,
DROP COLUMN IF EXISTS is_late,
DROP COLUMN IF EXISTS late_minutes,
DROP COLUMN IF EXISTS late_penalty_applied,
DROP COLUMN IF EXISTS quest_deadline;

ALTER TABLE quests
DROP COLUMN IF EXISTS planned_deadline_minutes,
DROP COLUMN IF EXISTS late_submission_window_minutes,
DROP COLUMN IF EXISTS allow_late_submissions;
```

## 📞 Suporte

Se encontrar issues:

1. Verificar logs no Supabase (SQL Editor)
2. Verificar console do browser (F12)
3. Verificar terminal onde app está rodando
4. Consultar `LATE_SUBMISSION_SYSTEM.md` para detalhes técnicos
