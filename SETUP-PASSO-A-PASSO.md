# Setup Passo a Passo - StartCup AMF

## Situação Atual
Você tem o sistema básico funcionando (teams, evaluators, submissions, evaluations), mas as funcionalidades avançadas (event_config, boss battles, achievements, etc.) ainda não estão no banco de dados.

## Passo 1: Verificar Event Config
Execute [check-event-config.sql](check-event-config.sql) no Supabase SQL Editor para ver se a tabela `event_config` existe.

## Passo 2: Setup Completo das Novas Tabelas

Execute [setup-complete-fresh.sql](setup-complete-fresh.sql) no Supabase SQL Editor. Este script:

- ✅ Remove views antigas (live_ranking, team_stats)
- ✅ Remove tabelas antigas de eventos (se existirem)
- ✅ Cria `event_config` com estrutura correta
- ✅ Cria `power_ups` (para power-ups das equipes)
- ✅ Cria `achievements` (conquistas especiais)
- ✅ Cria `boss_battles` (avaliações de fase - 0-100 pontos)
- ✅ Cria `final_pitch` (pitch final - 0-200 pontos)
- ✅ Cria `penalties` (penalidades aplicadas)
- ✅ Cria views atualizadas (`live_ranking` e `team_stats`)
- ✅ Configura políticas RLS
- ✅ Insere registro inicial de event_config

## Passo 3: Criar Função de Reset

Execute [create-reset-function.sql](create-reset-function.sql) no Supabase SQL Editor.

Esta função permite resetar o sistema via botão na dashboard, ignorando RLS.

## Passo 4: Testar o Sistema

1. **Recarregue a dashboard do admin** (`/control-panel`)
   - Deve mostrar "⏸️ Aguardando Início"
   - Deve mostrar "Fase Atual: Preparação"
   - Deve mostrar o PhaseController com 6 cards (Preparação + 5 Fases)

2. **Teste iniciar a Fase 1**
   - Clique em "Iniciar 🔍" na Fase 1
   - Status deve mudar para "🔥 Evento em Andamento"
   - Fase atual deve mudar para "Fase 1"

3. **Teste o Reset**
   - Clique em "Resetar Sistema"
   - Digite "RESETAR TUDO"
   - Deve limpar submissions, evaluations e voltar para Preparação

## Passo 5: Verificar Tudo Funcionando

Execute [diagnostico-completo.sql](diagnostico-completo.sql) para verificar:
- Todas as tabelas existem
- Event config está correto
- Contadores estão zerados após reset

---

## Se Der Erro

### Erro: "relation event_config does not exist"
**Solução:** Execute [setup-complete-fresh.sql](setup-complete-fresh.sql)

### Erro: "column X does not exist"
**Solução:** A tabela existe mas com estrutura antiga. Execute [setup-complete-fresh.sql](setup-complete-fresh.sql) que vai dropar e recriar tudo.

### Reset não funciona
**Solução:** Execute [create-reset-function.sql](create-reset-function.sql) para criar a função RPC.

### Como usar reset nuclear (última opção)
Se nada funcionar, execute [reset-nuclear.sql](reset-nuclear.sql) - este script desabilita RLS temporariamente e força deleção com TRUNCATE.

---

## Ordem Recomendada de Execução

```sql
-- 1. Setup completo (cria todas as tabelas)
\i setup-complete-fresh.sql

-- 2. Criar função de reset
\i create-reset-function.sql

-- 3. Verificar se tudo está ok
\i diagnostico-completo.sql
```

Depois disso, recarregue a dashboard do admin e tudo deve funcionar! 🚀
