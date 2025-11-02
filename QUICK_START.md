# 🚀 Quick Start - Sistema de Automação de Quests

## ⚡ Resumo Executivo

Você pediu para transformar o sistema baseado em **Fases** para um sistema baseado em **Quests** com controle manual via Admin Panel.

### ✅ O Que Foi Entregue (Fase 1)

1. **Migration SQL** - Adiciona campos de controle a cada quest
2. **Página Admin** - Interface para iniciar/parar quests manualmente
3. **Componente QuestControlPanel** - Painel de controle visual
4. **Documentação completa** - Arquitetura e implementação

### ⏳ O Que Falta (Fase 2 - Próxima)

1. Atualizar página `/submit` para usar novo sistema
2. Atualizar página `/evaluate` para usar novo sistema
3. Criar API routes para validação adicional

---

## 📋 Arquivos Criados

### Database
```
add-quest-automation-system.sql      ← Execute no Supabase
fix-teams-rls.sql                    ← Execute no Supabase (se não feito)
```

### Frontend Pages
```
src/app/(admin)/admin/page.tsx       ← Nova página admin
src/app/(admin)/layout.tsx           ← Layout wrapper
```

### Components
```
src/components/admin/QuestControlPanel.tsx ← Novo componente
```

### Documentation
```
QUEST_AUTOMATION_IMPLEMENTATION.md   ← Guia completo
SYSTEM_ARCHITECTURE.md               ← Diagramas e fluxos
QUICK_START.md                       ← Este arquivo
```

---

## 🎯 Passo 1: Aplicar Migrations (2 min)

### 1.1 Abrir Supabase Dashboard
- Vá para: https://supabase.com/
- Login com sua conta
- Selecione seu projeto StartCup AMF

### 1.2 Executar Migration #1

1. Clique em: **SQL Editor**
2. Clique em: **New Query**
3. Copie o conteúdo de: `add-quest-automation-system.sql`
4. Cole na caixa de SQL
5. Clique em: **RUN**

**Esperado:**
```
✅ Query executed successfully
Quest Automation System instalado com sucesso!
```

### 1.3 Executar Migration #2

Se não aplicou ainda:

1. Nova query no SQL Editor
2. Copie: `fix-teams-rls.sql`
3. Cole e execute
4. Verifique RLS policies criadas

---

## 🎯 Passo 2: Configurar Admin User (1 min)

```sql
-- Cole no Supabase SQL Editor e execute:
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{role}',
  '"admin"'
)
WHERE email = 'seu-email@example.com';  -- ← MUDE PARA SEU EMAIL!
```

---

## 🎯 Passo 3: Testar Frontend (5 min)

### 3.1 Abrir aplicação
```
http://localhost:3000/admin
```

### 3.2 Esperado

#### Cenário A: Você é Admin
```
✅ Página carrega corretamente
✅ Mostra "Status do Evento: 🔴 Não iniciado"
✅ Mostra estatísticas (Total, Ativas, Agendadas, Fechadas)
✅ Botão "▶️ INICIAR EVENTO" habilitado
✅ Lista de todas as quests abaixo
```

#### Cenário B: Você NÃO é Admin
```
❌ Erro vermelho: "Acesso negado. Você não tem permissão..."
→ Volte ao Passo 2 e configure admin
```

### 3.3 Clique em "▶️ INICIAR EVENTO"

```
Antes:
├── Estado: 🔴 Não iniciado
├── Botões: [▶️ INICIAR EVENTO] habilitado
└── Painel: escondido

Depois:
├── Estado: 🟢 Iniciado
├── Botões: [⏹️ ENCERRAR EVENTO] habilitado
└── Painel: QuestControlPanel aparece
    ├── "🟢 Quests Ativas" (vazio no início)
    └── "⏳ Próximas Quests" (mostra todas as quests agendadas)
```

### 3.4 Clique em "▶️ INICIAR" em uma Quest

```
Antes de clicar:
└── "⏳ Próximas Quests"
    └── Quest A [▶️ INICIAR]
    └── Quest B [▶️ INICIAR]
    └── Quest C [▶️ INICIAR]

Depois de clicar:
├── "🟢 Quests Ativas"
│   └── Quest A (🟢 Ativa desde 10:15) [⏹️ ENCERRAR]
└── "⏳ Próximas Quests"
    └── Quest B [▶️ INICIAR]
    └── Quest C [▶️ INICIAR]
```

---

## 🔍 Verificar Banco de Dados (Optional)

### Novos Campos em Quests

```sql
-- Execute no SQL Editor
SELECT
  id,
  name,
  status,
  started_at,
  ended_at,
  auto_start_enabled
FROM quests
LIMIT 5;
```

**Esperado:**
```
id        | name      | status    | started_at | ended_at | auto_start_enabled
uuid-1    | Quest A   | active    | 2025-11... | null     | false
uuid-2    | Quest B   | scheduled | null       | null     | false
uuid-3    | Quest C   | scheduled | null       | null     | false
```

### Histórico de Atividades

```sql
-- Execute no SQL Editor
SELECT
  quest_id,
  action,
  triggered_at,
  notes
FROM quest_activity_log
ORDER BY triggered_at DESC
LIMIT 10;
```

**Esperado:**
```
quest_id  | action   | triggered_at      | notes
uuid-1    | started  | 2025-11-02 10:15  | Manually started via admin panel
uuid-1    | ended    | 2025-11-02 11:00  | Manually closed via admin panel
```

---

## 🧪 Teste Completo (10 min)

### Cenário Ideal: Admin Completo

1. **Acesse `/admin`** ✅
2. **Clique "▶️ INICIAR EVENTO"** ✅
3. **Status muda para "🟢 Iniciado"** ✅
4. **Clique "▶️ INICIAR" em Quest A** ✅
5. **Quest A aparece em "Ativas"** ✅
6. **Verifique BD:** `quest_activity_log` tem entrada nova ✅
7. **Clique "⏹️ ENCERRAR" em Quest A** ✅
8. **Quest A move para "Fechadas"** ✅
9. **Clique "▶️ INICIAR" em Quest B** ✅
10. **Apenas Quest B em Ativas** ✅

---

## 🚨 Troubleshooting

### Problema: "Acesso negado"

```
❌ Erro: "Acesso negado. Você não tem permissão para acessar esta página."
```

**Solução:**
1. Volte ao Passo 2
2. Execute SQL para adicionar role = 'admin'
3. Faça logout e login novamente
4. Tente novamente

### Problema: Página Admin não carrega

```
❌ Erro: 404 ou página em branco
```

**Solução:**
1. Verifique se Next.js está rodando: `npm run dev`
2. Verifique se não há erros no console (F12)
3. Limpe cache: Ctrl+Shift+Delete
4. Recarregue: F5

### Problema: Botões não funcionam

```
❌ Clico em [▶️ INICIAR] mas nada acontece
```

**Solução:**
1. Abra F12 → Console
2. Verifique se há erros vermelhos
3. Verifique se Supabase está conectado
4. Verifique se RPC functions existem:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('start_quest', 'end_quest');
```

### Problema: Dados não atualizam no BD

```
❌ Clico [▶️ INICIAR] mas quest.status não muda
```

**Solução:**
1. Verifique RLS policies:

```sql
SELECT policyname FROM pg_policies WHERE tablename = 'quests';
```

2. Deve listar policies de SELECT e UPDATE
3. Se não houver, reexecute `add-quest-automation-system.sql`

---

## 📊 Dados Esperados Após Setup

### Tabelas Alteradas

```
✅ quests
   ├── status (VARCHAR) - novo
   ├── started_at (TIMESTAMP) - novo
   ├── started_by (UUID) - novo
   ├── ended_at (TIMESTAMP) - novo
   ├── auto_start_enabled (BOOLEAN) - novo
   └── auto_start_delay_minutes (INTEGER) - novo

✅ event_config
   ├── REMOVED: current_phase
   ├── REMOVED: phase_1_start_time ... phase_5_start_time
   ├── ADDED: active_quest_id (UUID) - novo
   └── Mantido: event_started, event_ended, timestamps
```

### Tabelas Novas

```
✅ quest_activity_log
   ├── id (UUID)
   ├── quest_id (UUID FK)
   ├── action (VARCHAR) - started, ended, auto_started, auto_ended
   ├── triggered_by (UUID FK)
   ├── triggered_at (TIMESTAMP)
   ├── notes (TEXT)
   └── created_at (TIMESTAMP)
```

### Funções Novas

```
✅ start_quest(quest_id_param, started_by_user_id)
✅ end_quest(quest_id_param)
✅ get_active_quest_by_timing(phase_id_param)
```

### Views Novas

```
✅ quest_status_by_phase
   ├── phase_id
   ├── phase_name
   ├── total_quests
   ├── active_quests
   ├── scheduled_quests
   ├── closed_quests
   └── timestamps
```

---

## 📝 Próximas Tarefas (Fase 2)

Estas serão para a próxima rodada:

1. **Atualizar `/submit` page**
   - Buscar apenas quests ativas
   - Remover lógica de fases
   - Remover `duration_minutes`

2. **Atualizar `/evaluate` page**
   - Buscar submissions de quests ativas
   - Remover lógica baseada em fases

3. **Criar API Routes**
   - `POST /api/quests/start` (validação no backend)
   - `POST /api/quests/end` (validação no backend)
   - Ao invés de RPC direto

4. **Auto-start (Opcional)**
   - Implementar cron job ou cloud function
   - Para iniciar quests automaticamente

---

## 🎓 Resumo do Novo Fluxo

### Admin Perspective

```
1. Acessa /admin
2. Clica "INICIAR EVENTO"
3. Vê quests agendadas
4. Clica "INICIAR" em Quest A
5. Quest A fica ativa
6. (Espera/Faz outras coisas)
7. Clica "ENCERRAR" em Quest A
8. Quest A fecha
9. Clica "INICIAR" em Quest B
10. Quest B fica ativa
... repete para cada quest ...
11. Clica "ENCERRAR EVENTO"
```

### Team Perspective

```
1. Entra em /submit
2. Vê APENAS Quest A (a que admin ativou)
3. Envia resposta
4. Espera Quest A fechar
5. Próxima vez, vê APENAS Quest B
6. Mais simples, menos confusão!
```

---

## ✅ Checklist Rápido

```
☐ Executei add-quest-automation-system.sql
☐ Executei fix-teams-rls.sql
☐ Configurei meu email como admin
☐ Acessei /admin e não deu erro
☐ Cliquei "INICIAR EVENTO"
☐ Cliquei "INICIAR" em uma quest
☐ Quest ficou ativa
☐ Verifico BD que quest_activity_log tem registros
☐ Cliquei "ENCERRAR"
☐ Tudo funcionou!
```

Se tudo passou: ✅ **Fase 1 Completa!**

---

## 📞 Resumo

| Item | Status | Tempo |
|------|--------|-------|
| Aplicar Migrations | ✅ Pronto | 2 min |
| Configurar Admin | ✅ Pronto | 1 min |
| Testar Frontend | ✅ Pronto | 5 min |
| Verificar BD | ✅ Pronto | 3 min |
| **Total** | ✅ **Pronto** | **~15 min** |

**Próxima Fase:** Atualizar `/submit` e `/evaluate` pages

---

**Criado:** 2025-11-02
**Versão:** 1.0 - Quick Start
**Status:** Pronto para Implementação
