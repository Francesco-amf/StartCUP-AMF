# Sistema de Automação de Quests - Guia de Implementação

## 📋 Resumo das Mudanças

Você solicitou uma refatoração do sistema de controle de **Fases** para um sistema baseado em **Quests** com automação e controle manual via Admin Panel.

### O Que Mudou

**Antes:** Sistema centrado em fases, onde o evento controlava qual fase estava ativa
**Depois:** Sistema centrado em quests, onde cada quest pode ser iniciada/parada individualmente

## 🗄️ Alterações no Banco de Dados

### 1. Nova Migration: `add-quest-automation-system.sql`

Adiciona os seguintes campos à tabela `quests`:

```sql
ALTER TABLE quests ADD COLUMN:
- status VARCHAR(50) -- 'scheduled', 'active', 'closed', 'completed'
- started_at TIMESTAMP -- Quando a quest foi iniciada
- started_by UUID -- Qual admin iniciou
- ended_at TIMESTAMP -- Quando foi encerrada
- auto_start_enabled BOOLEAN -- Habilita auto-start
- auto_start_delay_minutes INTEGER -- Delay para auto-start
```

### 2. Alterações em `event_config`

**Removido:**
- `current_phase` (INTEGER)
- `phase_1_start_time` até `phase_5_start_time` (TIMESTAMP)
- `phase_start_time` (TIMESTAMP)

**Adicionado:**
- `active_quest_id` (UUID REFERENCES quests)

Mantido:
- `event_started` (BOOLEAN)
- `event_ended` (BOOLEAN)
- `event_start_time` (TIMESTAMP)
- `event_end_time` (TIMESTAMP)

### 3. Nova Tabela: `quest_activity_log`

Rastreia histórico de ativações/desativações de quests:

```sql
CREATE TABLE quest_activity_log (
  id UUID PRIMARY KEY,
  quest_id UUID REFERENCES quests,
  action VARCHAR(50), -- 'started', 'ended', 'auto_started', 'auto_ended'
  triggered_by UUID REFERENCES auth.users,
  triggered_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP
)
```

### 4. Novas Funções PL/pgSQL

#### `start_quest(quest_id, started_by_user_id)`
Inicia uma quest manualmente

#### `end_quest(quest_id)`
Encerra uma quest manualmente

#### `get_active_quest_by_timing(phase_id)`
Calcula qual quest deve estar ativa baseada em timing e auto-start

### 5. Nova View: `quest_status_by_phase`

Agregação de status de quests por fase

## 🎨 Novos Componentes Frontend

### 1. Página Admin: `src/app/(admin)/admin/page.tsx`

**Rota:** `/admin`

**Funcionalidades:**
- Status do evento (Iniciado/Encerrado)
- Botões START/STOP para evento
- Dashboard com estatísticas:
  - Total de quests
  - Quests ativas
  - Quests agendadas
  - Quests fechadas
- Lista completa de todas as quests por fase

**Proteção:** Apenas usuários com `role = 'admin'` podem acessar

### 2. Componente QuestControlPanel: `src/components/admin/QuestControlPanel.tsx`

**Responsabilidades:**
- Mostrar quests ativas (com botão ENCERRAR)
- Mostrar próximas quests agendadas (com botão INICIAR)
- Mostrar histórico de quests fechadas
- Integração com funções RPC: `start_quest()` e `end_quest()`

**Estados Visuais:**
- 🟢 Ativa (fundo verde)
- ⏳ Agendada (fundo azul)
- 🔴 Fechada (fundo amarelo)

## 🚀 Passos de Implementação

### Passo 1: Aplicar Migration no Supabase

```bash
# Abra o Supabase Dashboard
# Vá para: SQL Editor
# Crie uma nova query
# Cole o conteúdo de: add-quest-automation-system.sql
# Execute (Run)
```

**Arquivos necessários:**
- `add-quest-automation-system.sql`

### Passo 2: Aplicar Fix de RLS em Teams

```bash
# Se ainda não aplicou:
# Crie nova query no Supabase SQL Editor
# Cole o conteúdo de: fix-teams-rls.sql
# Execute (Run)
```

**Arquivos necessários:**
- `fix-teams-rls.sql`

### Passo 3: Verificar Acesso Admin

Certifique-se de que seu usuário admin tem `role = 'admin'`:

```sql
-- Execute no Supabase SQL Editor
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"admin"')
WHERE email = 'seu-email-admin@example.com';
```

### Passo 4: Acessar a Nova Página Admin

**URL:** `http://localhost:3000/admin`

## 📊 Fluxo de Uso - Como Admin

### Cenário 1: Controle Manual Total

1. **Acesse `/admin`**
2. **Clique em "▶️ INICIAR EVENTO"** para começar
3. **Na seção "Próximas Quests"** clique **"▶️ INICIAR"** para cada quest
4. Equipes verão a quest disponível para submissão
5. **Quando terminar o tempo** clique **"⏹️ ENCERRAR"**
6. **Ao final clique "⏹️ ENCERRAR EVENTO"**

### Cenário 2: Automação com Controle Manual

1. Configure no banco: `quests.auto_start_enabled = TRUE`
2. Configure: `quests.auto_start_delay_minutes = 5`
3. Sistema inicia automaticamente 5 min após início da fase
4. Você ainda pode parar manualmente com **"⏹️ ENCERRAR"**

### Cenário 3: Híbrido

- Algumas quests com auto-start
- Outras com controle manual
- Você decide qual é qual na edição da quest

## 🔄 Como as Quests Agora Aparecem para Times

### Antes (Sistema de Fase)
```
1. Admin define current_phase = 1
2. Sistema mostra TODAS as quests da fase
3. Times veem tudo, começa junto
```

### Depois (Sistema de Quest)
```
1. Admin clica "▶️ INICIAR" em Quest A
2. Apenas Quest A fica visível
3. Times veem apenas Quest A
4. Admin clica "⏹️ ENCERRAR" em Quest A
5. Quest A fecha, passa para Quest B
6. Apenas Quest B fica visível
```

## 📝 Alterações Necessárias no Frontend (Próximas)

### ✅ Já Implementado
- Página Admin com controle de quests
- Componente QuestControlPanel
- Layout (admin)

### ⏳ Próximas Tarefas (Não Incluídas Neste PR)

1. **Atualizar `/submit` page** para:
   - Buscar quests com `status = 'active'` (não todas)
   - Remover lógica de `duration_minutes`
   - Mostrar apenas quests ativas

2. **Atualizar `/evaluate` page** para:
   - Buscar submissions apenas de quests ativas
   - Remover lógica baseada em fases

3. **Criar API Route** para:
   - `POST /api/quests/start` (validação no backend)
   - `POST /api/quests/end` (validação no backend)
   - Ao invés de usar RPC diretamente

## 🛡️ Segurança

### RLS Policies Adicionadas

**Quests:**
- SELECT: Todos autenticados podem ver quests ativas/fechadas
- UPDATE: Validação no backend (apenas admin)

**Quest Activity Log:**
- SELECT: Todos autenticados podem ver
- INSERT: Sistema registra automaticamente

### Validação Backend (Recomendado)

Adicionar validação na API antes de chamar funções RPC:

```typescript
// Verificar se usuário é admin
if (user.user_metadata?.role !== 'admin') {
  throw new Error('Acesso negado')
}

// Verificar se evento está ativo
if (!eventConfig.event_started) {
  throw new Error('Evento não iniciado')
}

// Chamar função RPC
await supabase.rpc('start_quest', { quest_id_param: questId, ... })
```

## 📱 Status da Implementação

| Item | Status | Arquivo |
|------|--------|---------|
| Migration SQL | ✅ Criada | `add-quest-automation-system.sql` |
| RLS Fix Teams | ✅ Criada | `fix-teams-rls.sql` |
| Página Admin | ✅ Criada | `src/app/(admin)/admin/page.tsx` |
| QuestControlPanel | ✅ Criada | `src/components/admin/QuestControlPanel.tsx` |
| Layout Admin | ✅ Criada | `src/app/(admin)/layout.tsx` |
| Atualização Submit Page | ⏳ Pendente | - |
| Atualização Evaluate Page | ⏳ Pendente | - |
| API Routes | ⏳ Pendente | - |

## 🧪 Testando

### 1. Após Aplicar Migrations

```sql
-- Verificar campos adicionados
SELECT * FROM quests LIMIT 1;
-- Deve mostrar: status, started_at, started_by, ended_at, auto_start_enabled, auto_start_delay_minutes

-- Verificar nova tabela
SELECT * FROM quest_activity_log;
-- Deve estar vazia inicialmente

-- Verificar novas funções
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('start_quest', 'end_quest', 'get_active_quest_by_timing');
-- Deve listar as 3 funções
```

### 2. Teste Frontend

1. Acesse `/admin`
2. Verifique se mostra erro se não for admin
3. Se for admin, verifique:
   - ✅ Status do evento (não iniciado)
   - ✅ Botão "▶️ INICIAR EVENTO" habilitado
   - ✅ Estatísticas (Total: X, Ativas: 0, Agendadas: X)
   - ✅ Lista de quests
4. Clique em "▶️ INICIAR EVENTO"
5. Verifique:
   - ✅ Status muda para "Iniciado 🟢"
   - ✅ Botões INICIAR aparecem nas quests
6. Clique "▶️ INICIAR" em uma quest
7. Verifique:
   - ✅ Quest muda para "ativa 🟢"
   - ✅ Aparece horário de início

## ❓ FAQ

**P: Por que remover `current_phase`?**
R: Porque agora cada quest é independente. Não precisamos saber qual é a fase "atual", apenas quais quests estão "ativas".

**P: E se quisermos fases em sequence?**
R: Você ainda controla via order_index. Admin inicia Quest 1, depois Quest 2, etc. Sistema respeta a ordem.

**P: Auto-start funciona sem intervenção?**
R: Será implementado com cron job ou cloud function. Por enquanto, controle é manual.

**P: Donde ir se quiser voltar ao sistema antigo?**
R: Mantenha backup da migration. Você pode fazer rollback, mas será necessário resetar dados.

## 📞 Próximas Etapas Recomendadas

1. ✅ Aplicar `add-quest-automation-system.sql`
2. ✅ Aplicar `fix-teams-rls.sql`
3. ✅ Testar página `/admin`
4. ⏳ Atualizar página `/submit` para usar novo sistema
5. ⏳ Atualizar página `/evaluate` para usar novo sistema
6. ⏳ Criar API routes para validação adicional
7. ⏳ Implementar auto-start com cloud functions

---

**Criado em:** 2025-11-02
**Versão:** 1.0
**Status:** Fase 1 Completa (Admin Panel + Database Schema)
