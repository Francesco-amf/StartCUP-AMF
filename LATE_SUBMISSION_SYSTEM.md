# Sistema de Submissões com Atraso e Penalidades Progressivas

## Visão Geral

Este documento descreve o sistema implementado para gerenciar submissões de quests com suporte a janela de atraso de 15 minutos e penalidades progressivas.

## Componentes Principais

### 1. Banco de Dados (SQL)

**Arquivo**: `add-late-submission-system.sql`

Novos campos adicionados:

**Tabela `submissions`**:
- `submitted_at` (TIMESTAMP) - Quando a submissão foi criada
- `is_late` (BOOLEAN) - Se foi atrasada
- `late_minutes` (INTEGER) - Quantos minutos atrasou
- `late_penalty_applied` (INTEGER) - Penalidade aplicada em pontos
- `quest_deadline` (TIMESTAMP) - Deadline da quest (para auditoria)

**Tabela `quests`**:
- `planned_deadline_minutes` (INTEGER) - Duração em minutos até o deadline
- `late_submission_window_minutes` (INTEGER) - Duração da janela de atraso (padrão 15 min)
- `allow_late_submissions` (BOOLEAN) - Se permite submissões atrasadas

### Funções PL/pgSQL Implementadas

#### 1. `calculate_quest_deadline(quest_id_param UUID)`
Calcula o deadline absoluto de uma quest baseado em `started_at + planned_deadline_minutes`.

**Returns**: TIMESTAMP do deadline

#### 2. `calculate_late_penalty(late_minutes_param INTEGER)`
Calcula a penalidade baseada em minutos de atraso.

**Lógica**:
- 0-5 minutos: 5 pontos
- 5-10 minutos: 10 pontos
- 10-15 minutos: 15 pontos
- Mais de 15: NULL (não permitido)

**Returns**: INTEGER (pontos de penalidade)

#### 3. `validate_submission_allowed(team_id_param, quest_id_param)`
Função completa que valida se uma submissão é permitida.

**Validações Realizadas**:
1. ✅ Quest existe
2. ✅ Quest está ativa ou fechada (em janela de atraso)
3. ✅ Quest foi iniciada
4. ✅ Não passou da janela de atraso (15 min após deadline)
5. ✅ Calcula minutos de atraso se aplicável
6. ✅ Calcula penalidade se aplicável

**Returns**:
```sql
is_allowed: BOOLEAN
reason: TEXT
late_minutes_calculated: INTEGER
penalty_calculated: INTEGER
```

#### 4. `check_previous_quest_submitted(team_id_param, quest_id_param)`
Valida se a quest anterior foi entregue (bloqueio sequencial).

**Lógica**:
- Se é a primeira quest da fase, permite
- Se quest anterior existe, verifica se equipe enviou
- Se quest anterior não foi entregue, bloqueia

**Returns**:
```sql
can_submit: BOOLEAN
reason: TEXT
```

#### 5. `is_late_submission_window_open(quest_id_param)`
Verifica se a janela de atraso ainda está aberta.

**Returns**:
```sql
window_open: BOOLEAN
minutes_remaining: INTEGER
```

### 2. API Endpoint

**Arquivo**: `src/app/api/submissions/create/route.ts`

**Method**: POST
**Auth**: Requerido (user autenticado)

**Request Body** (FormData):
```javascript
{
  questId: string,      // UUID da quest
  teamId: string,       // UUID da equipe
  deliverableType: 'file' | 'text' | 'url',
  content: string,      // URL ou texto (se aplicável)
  file: File           // Arquivo (se tipo='file')
}
```

**Fluxo de Processamento**:

1. **Validação de Entrada**
   - Verifica questId, teamId, deliverableType obrigatórios
   - Valida autenticação do usuário

2. **Validação de Submissão** (via RPC)
   - Chama `validate_submission_allowed()` no banco
   - Retorna se é permitido, por quê, minutos de atraso, penalidade

3. **Validação Sequencial** (via RPC)
   - Chama `check_previous_quest_submitted()` no banco
   - Garante que quest anterior foi entregue

4. **Busca da Quest**
   - Recupera dados da quest (nome, tipo de entrega, max_points)

5. **Upload de Arquivo** (se aplicável)
   - Valida tamanho (máx 50MB)
   - Valida tipo de arquivo
   - Faz upload para Supabase Storage
   - Gera URL pública

6. **Verificação de Duplicata**
   - Valida UNIQUE(team_id, quest_id)

7. **Criação da Submissão**
   - Insere na tabela submissions
   - Trigger automático calcula `is_late`, `late_minutes`, `late_penalty_applied`

8. **Aplicação de Penalidade** (se atrasada)
   - Se `penalty_calculated > 0`, insere penalidade automática
   - Razão: "Submissão atrasada por X minutos"

**Response de Sucesso** (201):
```json
{
  "success": true,
  "message": "Submissão criada com sucesso!",
  "submission": {
    "id": "uuid",
    "questId": "uuid",
    "teamId": "uuid",
    "status": "pending",
    "submittedAt": "2025-11-02T22:45:30Z",
    "fileUrl": "https://...",
    "isLate": false,
    "lateMinutes": 0,
    "penaltyApplied": false,
    "penaltyAmount": 0
  }
}
```

**Response de Erro** (400):
```json
{
  "error": "Prazo para submissão expirou completamente",
  "details": {
    "allowed": false,
    "reason": "...",
    "lateMinutes": 0,
    "penalty": 0
  }
}
```

### 3. Componentes React

#### A. `SubmissionForm.tsx`
Formulário principal de submissão.

**Mudanças**:
- Agora usa `/api/submissions/create` em vez de insert direto
- Envia FormData (suporta arquivo)
- Trata erros de validação com contexto
- Mostra mensagem de sucesso com informações de penalidade se atrasada
- Integra `SubmissionDeadlineStatus` component

**Props**:
```typescript
{
  questId: string
  teamId: string
  deliverableType: 'file' | 'text' | 'url'
  questName: string
  maxPoints: number
  onSuccess?: () => void
}
```

#### B. `SubmissionDeadlineStatus.tsx` (NOVO)
Componente que mostra status do deadline e janela de atraso.

**Props**:
```typescript
{
  questId: string
  teamId: string
}
```

**Estados Mostrados**:

1. **No Prazo** (✅ Verde)
   - Mostra tempo restante em minutos
   - Avisa sobre janela de atraso

2. **Atrasado** (⏰ Laranja)
   - Mostra minutos atrasados
   - Mostra penalidade a ser aplicada
   - Mostra tempo restante na janela

3. **Prazo Expirado** (🚫 Vermelho)
   - Bloqueado, não permite mais submissão

**Atualização**: A cada 10 segundos (polling)

### 4. Gerenciamento de Deadlines (Admin)

**Endpoint**: `src/app/api/admin/quest/deadline/route.ts`

**POST** - Configurar deadline de uma quest:
```json
{
  "questId": "uuid",
  "plannedDeadlineMinutes": 30,
  "allowLateSubmissions": true
}
```

**GET** - Obter informações de deadline:
```
GET /api/admin/quest/deadline?questId=uuid
```

## Fluxo Completo de Submissão

### Cenário 1: Submissão No Prazo

```
1. Equipe abre page submit
2. SubmissionForm mostra status "No Prazo - 25 minutos restantes"
3. Equipe preenche conteúdo/arquivo
4. Clica "Enviar Entrega"
5. API valida: submitted_at (22:30:00) < deadline (22:35:00) ✅
6. Submissão criada com is_late=FALSE, late_penalty_applied=0
7. Mensagem de sucesso: "✅ Entrega enviada com sucesso!"
```

### Cenário 2: Submissão Atrasada (Dentro da Janela)

```
1. Equipe tenta submeter 3 minutos após deadline
2. SubmissionForm mostra status "Submissão Atrasada - 3 min atrasado(a) - Penalidade: -5pts"
3. Equipe clica "Enviar Entrega"
4. API valida: submitted_at (22:38:00) > deadline (22:35:00) ✅
   - Calcula: 3 minutos de atraso
   - Penalidade: calculate_late_penalty(3) = 5 pts
5. Submissão criada com is_late=TRUE, late_penalty_applied=5
6. Penalidade inserida automaticamente na tabela penalties
7. Mensagem: "✅ Entrega enviada com sucesso! (3min atrasado) - Penalidade: -5pts"
```

### Cenário 3: Submissão Bloqueada (Após Janela)

```
1. Equipe tenta submeter 20 minutos após deadline
2. SubmissionForm mostra status "🚫 Prazo Expirado"
3. Formulário desabilitado, botão não aparece
4. Se tentar via API diretamente:
5. API valida: submitted_at (22:55:00) > lateWindowEnd (22:50:00) ❌
6. Retorna erro: "Prazo para submissão expirou completamente"
7. Status 400 Bad Request
```

### Cenário 4: Quest Anterior Não Entregue (Bloqueio Sequencial)

```
1. Equipe tenta submeter Quest 2 sem ter entregue Quest 1
2. SubmissionForm tenta renderizar
3. API chama validate_submission_allowed() ✅
4. API chama check_previous_quest_submitted() ❌
5. Retorna erro: "Você deve primeiro enviar a quest anterior"
6. Formulário não aparece ou é desabilitado
```

## Penalidades Progressivas

| Tempo de Atraso | Penalidade | Status UI |
|-----------------|-----------|-----------|
| 0 minutos | 0 pts | ✅ No Prazo |
| 1-5 minutos | 5 pts | ⏰ Atrasado |
| 5-10 minutos | 10 pts | ⏰ Atrasado |
| 10-15 minutos | 15 pts | ⏰ Atrasado |
| 15+ minutos | Bloqueado | 🚫 Expirado |

## Configuração de Deadlines

### Para Admin no Control Panel (TODO):

```javascript
// Exemplo: Configurar Quest 1 com 30 minutos de deadline
fetch('/api/admin/quest/deadline', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    questId: '...',
    plannedDeadlineMinutes: 30,
    allowLateSubmissions: true
  })
})
```

### Valores Recomendados:

- **Fase 1 (Descoberta)**: 30-40 minutos
- **Fase 2 (Criação)**: 45-60 minutos
- **Fase 3 (Estratégia)**: 30-40 minutos
- **Fase 4 (Refinamento)**: 20-30 minutos
- **Fase 5 (Pitch)**: 30-45 minutos

Janela de atraso: sempre 15 minutos

## Trigger de Atualização Automática

Quando uma submissão é inserida ou atualizada, o trigger `update_late_submission_fields_trigger` automaticamente:

1. Calcula o deadline da quest
2. Compara `submitted_at` com `deadline`
3. Se atrasada, calcula `late_minutes`
4. Calcula `late_penalty_applied` usando função

Isso garante que **mesmo se a penalidade não for inserida**, os campos de rastreamento estarão corretos.

## View para Análise

**View**: `late_submissions_summary`

Mostra todas as submissões atrasadas com:
- Team name
- Quest name
- Phase name
- Minutos de atraso
- Penalidade aplicada
- Categoria de atraso

**Query**:
```sql
SELECT * FROM late_submissions_summary
WHERE is_late = TRUE
ORDER BY submitted_at DESC
```

## Segurança

### Validações Lado Servidor
- ✅ Todas as validações acontecem no banco (funções PL/pgSQL)
- ✅ Impossível fazer upload após deadline via API direta
- ✅ Penalidades aplicadas automaticamente
- ✅ RLS policies protegem dados

### Proteção Contra Manipulação
- ✅ Client não pode modificar `is_late`, `late_penalty_applied`
- ✅ Trigger força recálculo em UPDATE
- ✅ Service role key usado apenas para admin operations
- ✅ Penalidades não podem ser deletadas por usuários comuns

## TODO / Próximos Passos

- [ ] Integrar controle de deadlines no Admin Control Panel
- [ ] Adicionar visualização de submissões atrasadas no Dashboard Admin
- [ ] Teste de carga com múltiplas equipes enviando no mesmo tempo
- [ ] Email notificação quando deadline está próximo (15 min antes)
- [ ] Report de submissões atrasadas por fase
- [ ] Opção para admin estender deadline manualmente
- [ ] Webhook para notify avaliadores quando submissão é atrasada
- [ ] Gráfico de distribuição de atrasos por fase

## Troubleshooting

### Problema: "is_late sempre false mesmo com atraso"
**Causa**: Trigger não executou ou função `calculate_quest_deadline` retornou NULL
**Solução**: Verifique se `quest.started_at` está preenchido

### Problema: Penalidade não aparece em penalties table
**Causa**: Penalidade com 0 pontos (dentro do prazo)
**Solução**: Verificamente se `late_minutes <= 0`

### Problema: "Quest anterior não foi entregue" mesmo tendo enviado
**Causa**: Ordem da quest incorreta ou phase_id incorreto
**Solução**: Verifique `quests.order_index` e `quests.phase_id`

### Problema: Usuário consegue fazer 2 submissões da mesma quest
**Causa**: UNIQUE constraint não está funcionando
**Solução**: Execute SQL: `CREATE UNIQUE INDEX idx_submissions_team_quest ON submissions(team_id, quest_id) WHERE status IS NOT NULL;`
