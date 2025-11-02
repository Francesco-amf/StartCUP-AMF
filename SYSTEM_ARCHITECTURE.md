# Arquitetura do Sistema de Automação de Quests

## 🏗️ Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        STARTCUP AMF EVENT                        │
└─────────────────────────────────────────────────────────────────┘
        │
        ├── event_config
        │   ├── event_started: BOOLEAN
        │   ├── event_ended: BOOLEAN
        │   ├── active_quest_id: UUID (NOVO)
        │   └── timestamps...
        │
        └── phases[]
            └── phase_1, phase_2, phase_3...
                └── quests[] (ANTES: todas visíveis | AGORA: apenas status='active')
                    ├── quest_1 (status: 'active', started_at: ..., ...)
                    ├── quest_2 (status: 'scheduled', started_at: null, ...)
                    └── quest_3 (status: 'closed', ended_at: ..., ...)
```

## 📊 Comparação: Antes vs Depois

### ANTES: Sistema Baseado em Fases

```
Admin Panel (NÃO EXISTIA)
     ↓
event_config.current_phase = 1
     ↓
SELECT quests WHERE phase_id = 1
     ↓
Todas as quests da fase aparecem para todos os times
     ↓
Tempo corre para TODAS as quests juntas
```

### DEPOIS: Sistema Baseado em Quests

```
Admin Panel (/admin) ✨
     ↓
[▶️ INICIAR EVENTO] → event_config.event_started = TRUE
     ↓
Painel mostra "Próximas Quests"
     ↓
[▶️ INICIAR] quest_1 → quest_1.status = 'active', quest_1.started_at = NOW()
     ↓
SELECT quests WHERE status = 'active'
     ↓
Apenas quest_1 aparece para todos os times
     ↓
[⏹️ ENCERRAR] quest_1 → quest_1.status = 'closed', quest_1.ended_at = NOW()
     ↓
[▶️ INICIAR] quest_2 → quest_2.status = 'active', quest_2.started_at = NOW()
     ↓
Apenas quest_2 aparece para todos os times
```

## 🗂️ Estrutura de Diretórios (Novo)

```
src/
├── app/
│   ├── (admin)/                          ← Nova rota
│   │   ├── layout.tsx                    ← Layout do Admin
│   │   └── admin/
│   │       └── page.tsx                  ← Dashboard Admin ✨
│   ├── (team)/
│   │   └── submit/
│   │       └── page.tsx                  ← Needs update ⏳
│   └── (evaluator)/
│       └── evaluate/
│           └── page.tsx                  ← Needs update ⏳
│
└── components/
    └── admin/
        └── QuestControlPanel.tsx         ← Novo componente ✨
```

## 📋 Estado de Uma Quest (State Machine)

```
┌──────────────┐
│  scheduled   │  ← Status inicial (criada, ainda não iniciada)
└──────┬───────┘
       │
       │ [▶️ INICIAR] (clique admin)
       │
       ↓
┌──────────────┐
│    active    │  ← Quest disponível para times submeterem
└──────┬───────┘
       │
       │ [⏹️ ENCERRAR] (clique admin)
       │
       ↓
┌──────────────┐
│    closed    │  ← Quest encerrada, não pode mais submeter
└──────┬───────┘
       │
       │ [Avaliação completa] (automático)
       │
       ↓
┌──────────────┐
│  completed   │  ← Quest avaliada, dados finalizados
└──────────────┘
```

## 🔄 Fluxo de Dados - Visão do Time

```
┌─────────────────────────────────────────────────────────────────┐
│ TEAM PERSPECTIVE                                                 │
└─────────────────────────────────────────────────────────────────┘

[ANTES]
Time entra em /submit
     ↓
SELECT quests WHERE phase_id = (current_phase)
     ↓
Vê 4 quests, começa a contar tempo de cada uma
     ↓
"Quest A está disponível até 10:30, Quest B até 11:00..."

[DEPOIS] ✨
Time entra em /submit
     ↓
SELECT quests WHERE status = 'active'
     ↓
Vê apenas a Quest que admin iniciou
     ↓
"Apenas Quest A está disponível"
     ↓
Não se confunde com timing complexo
```

## 🔐 RLS Policies (Segurança)

### Quests Table

```
SELECT:
  ├─ status IN ('active', 'closed', 'completed') → todos autenticados
  └─ status = 'scheduled' → admin apenas

UPDATE:
  └─ Apenas admin (validação no backend)

INSERT:
  └─ Apenas admin (validação no backend)
```

### Quest Activity Log Table

```
SELECT:
  └─ Todos autenticados

INSERT:
  └─ Sistema automático (RPC functions)
```

## 🎯 Fluxo de Admin: Passo a Passo

```
1. Admin acessa /admin
       ↓
2. Verifica: role = 'admin'? ✅
       ↓
3. Carrega:
   ├── event_config (status do evento)
   ├── phases (lista de fases)
   └── quests (todas as quests com status)
       ↓
4. Dashboard mostra:
   ├── [▶️ INICIAR EVENTO] [⏹️ ENCERRAR EVENTO]
   ├── Estatísticas (total, ativas, agendadas, fechadas)
   ├── QuestControlPanel
   │   ├── Ativas (com botão ENCERRAR)
   │   ├── Agendadas (com botão INICIAR)
   │   └── Fechadas (visual apenas)
   └── Lista completa de quests
       ↓
5. Admin clica [▶️ INICIAR EVENTO]
   └── event_config.event_started = TRUE
       ↓
6. Admin clica [▶️ INICIAR] em Quest A
   └── quest_A.status = 'active'
   └── quest_A.started_at = NOW()
   └── quest_A.started_by = admin_user_id
   └── Insert quest_activity_log (ação: 'started')
       ↓
7. Times veem Quest A em /submit
       ↓
8. Admin clica [⏹️ ENCERRAR] em Quest A
   └── quest_A.status = 'closed'
   └── quest_A.ended_at = NOW()
   └── Insert quest_activity_log (ação: 'ended')
       ↓
9. Times não veem mais Quest A
       ↓
10. Admin clica [▶️ INICIAR] em Quest B
    └── quest_B.status = 'active'
    └── Times veem Quest B em /submit
```

## 🔌 Integração de APIs (RPC Functions)

### Frontend chama Supabase RPC

```typescript
// QuestControlPanel.tsx
const { data, error } = await supabase.rpc('start_quest', {
  quest_id_param: questId,
  started_by_user_id: user.id
})
```

### Supabase executa função PL/pgSQL

```sql
CREATE OR REPLACE FUNCTION start_quest(
  quest_id_param UUID,
  started_by_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Atualiza quest
  UPDATE quests
  SET status = 'active',
      started_at = NOW(),
      started_by = started_by_user_id
  WHERE id = quest_id_param;

  -- 2. Registra atividade
  INSERT INTO quest_activity_log (quest_id, action, triggered_by, notes)
  VALUES (quest_id_param, 'started', started_by_user_id, '...');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### Resultado

```
Database Update:
├── quests table: status='active', started_at=NOW()
└── quest_activity_log: nova linha com ação='started'
    ↓
Frontend atualiza:
├── QuestControlPanel mostra Quest em "Quests Ativas"
└── Button muda para [⏹️ ENCERRAR]
    ↓
Todos os clients que buscam quests veem a mudança
```

## 📱 Screens da Interface

### Admin Dashboard (`/admin`)

```
╔════════════════════════════════════════════════════════════════╗
║                    🔧 Admin Dashboard                          ║
║                 Controle de Evento e Quests                    ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║ 📅 Status do Evento                                           ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ Estado: 🟢 Iniciado  |  [▶️ INICIAR]  [⏹️ ENCERRAR]    │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                                ║
║ Estatísticas                                                  ║
║ ┌──────────┬──────────┬──────────┬──────────┐               ║
║ │ Total    │ Ativas   │ Agendadas│ Fechadas │               ║
║ │    12    │     1    │     3    │     8    │               ║
║ └──────────┴──────────┴──────────┴──────────┘               ║
║                                                                ║
║ 🟢 Quests Ativas                                              ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ Quest A (Fase 1)                  [⏹️ ENCERRAR]        │  ║
║ │ Ativa desde 10:15 | Pontos: 50                         │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                                ║
║ ⏳ Próximas Quests                                            ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │ Quest B (Fase 1)                  [▶️ INICIAR]         │  ║
║ │ Agendada | Pontos: 30                                  │  ║
║ ├─────────────────────────────────────────────────────────┤  ║
║ │ Quest C (Fase 1)                  [▶️ INICIAR]         │  ║
║ │ Agendada | Pontos: 40                                  │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                                ║
║ 📋 Todas as Quests                                            ║
║ [Ver lista completa de quests...]                            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

## 🔄 Autofresh (Real-time Updates)

Para implementação futura:

```typescript
// Usar Supabase Realtime Subscriptions
supabase
  .from('quests')
  .on('*', payload => {
    console.log('Quest atualizada:', payload)
    loadAdminData() // Recarregar dados
  })
  .subscribe()
```

## 🗄️ Estrutura de Dados - Exemplo

```javascript
// Antes de iniciar qualquer quest
{
  quests: [
    {
      id: 'uuid-1',
      name: 'Quest A',
      phase_id: 'phase-1',
      max_points: 50,
      status: 'scheduled',        // ← Novo
      started_at: null,            // ← Novo
      started_by: null,            // ← Novo
      ended_at: null,              // ← Novo
      auto_start_enabled: false,   // ← Novo
      auto_start_delay_minutes: 0  // ← Novo
    },
    // ... mais quests
  ]
}

// Depois de admin clicar [▶️ INICIAR]
{
  quests: [
    {
      id: 'uuid-1',
      name: 'Quest A',
      phase_id: 'phase-1',
      max_points: 50,
      status: 'active',                   // ← Mudou para 'active'
      started_at: '2025-11-02T10:15:00Z', // ← Preenchido
      started_by: 'admin-user-id',        // ← Preenchido
      ended_at: null,
      auto_start_enabled: false,
      auto_start_delay_minutes: 0
    },
    // ... mais quests
  ]
}
```

## ✅ Checklist de Implementação

```
Database:
☐ Executar add-quest-automation-system.sql
☐ Executar fix-teams-rls.sql
☐ Verificar novos campos em quests table
☐ Verificar nova tabela quest_activity_log
☐ Verificar novas funções RPC

Frontend:
☐ Testar página /admin (acesso, layout)
☐ Testar botão "INICIAR EVENTO"
☐ Testar "INICIAR" quest agendada
☐ Testar "ENCERRAR" quest ativa
☐ Testar "ENCERRAR EVENTO"

Integração:
☐ Testar que times veem apenas quests ativas
☐ Testar que quest_activity_log registra ações
☐ Testar visibilidade após mudar status

Segurança:
☐ Verificar que apenas admin acessa /admin
☐ Verificar que usuários sem admin veem erro 403
☐ Verificar RLS policies funcionam
```

---

**Documentação de Arquitetura**
**Status:** Fase 1 - Design e Implementação Backend
**Próximas:** Atualizar Submit/Evaluate pages para novo sistema
