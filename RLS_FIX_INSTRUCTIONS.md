# RLS Recursion Fix - Instruções de Aplicação

## Problema Identificado

A função `get_my_team_id()` causa **recursão infinita** porque:
1. Ela consulta a tabela `teams`
2. A tabela `teams` tem RLS policies habilitadas
3. As RLS policies chamam `get_my_team_id()` novamente
4. Isso cria um loop infinito que resulta em "Database error querying schema"

## Solução

Substituir todas as chamadas para `get_my_team_id()` por subqueries diretas que usam o email do JWT token.

## Arquivos a Executar

### 1. Script Principal (Obrigatório)
**`FIX_RLS_RECURSION.sql`** - Corrige as políticas RLS problemáticas

**Onde executar:**
- Vá para Supabase Dashboard
- SQL Editor
- Cole o conteúdo de `FIX_RLS_RECURSION.sql`
- Clique em "Run"

**O que faz:**
- ✅ Remove política recursiva de `evaluations`
- ✅ Remove política recursiva de `penalties`
- ✅ Remove política recursiva de `power_ups`
- ✅ Substitui por subqueries com email-based lookup
- ✅ Adiciona LIMIT 1 para evitar múltiplos resultados

### 2. Atualizar rls_policies.sql (Opcional, para referência futura)

Se você quiser que `rls_policies.sql` reflita as mudanças permanentemente, pode manter o arquivo já atualizado que está em seu repositório.

## Passos para Executar

### Passo 1: Abrir Supabase SQL Editor
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto StartCup AMF
3. Clique em **SQL Editor** (lado esquerdo)
4. Clique em **New Query**

### Passo 2: Copiar e Executar o Script
1. Abra o arquivo `FIX_RLS_RECURSION.sql` do seu projeto
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou `Ctrl+Enter`)

### Passo 3: Verificar Sucesso
Se ver a mensagem: `RLS Recursion Fix Complete` - ✅ Sucesso!

Se houver erro, pode ser:
- Política já removida (mensagem de warning é OK)
- Sintaxe incorreta

## O Que Muda Para Usuários

**Antes do Fix:**
- ❌ Equipes não conseguiam acessar o dashboard ("Database error querying schema")
- ❌ Recursão infinita nas RLS policies

**Depois do Fix:**
- ✅ Equipes conseguem fazer login e acessar dashboard
- ✅ RLS policies usam email-based lookup (mais eficiente)
- ✅ Sem recursão infinita

## Políticas Corrigidas

| Tabela | Política | Antes | Depois |
|--------|----------|-------|--------|
| evaluations | "Allow teams to read their own evaluations" | `get_my_team_id()` | Subquery com email |
| penalties | "Allow teams to read their own penalties" | `get_my_team_id()` | Subquery com email |
| power_ups | "Allow teams to update power_ups" | `get_my_team_id()` | Subquery com email |
| teams | "Allow teams to update their own team" | `get_my_team_id()` | Email direto do JWT |
| submissions | "Allow teams to read/create submissions" | `get_my_team_id()` | Subquery com email |

## Verificação Pós-Fix

Depois de executar o script, teste:

1. **Login com uma equipe:**
   - Email: `visionone@startcup.local` (ou outra equipe)
   - Senha: `VisionOne@2024!` (correspondente)

2. **Acesse o dashboard:**
   - Deveria carregar sem erro
   - Mostre o quadro de controle da equipe

3. **Se ainda der erro:**
   - Verifique se as 15 equipes foram criadas (script setup-15-teams.sql)
   - Verifique se o email da equipe existe na tabela teams
   - Verifique se a senha está correta

## Próximos Passos

1. ✅ Executar `FIX_RLS_RECURSION.sql` no Supabase
2. ✅ Executar `setup-15-teams.sql` no Supabase (se ainda não fez)
3. ✅ Testar login com uma equipe
4. ✅ Verificar se dashboard carrega

## Arquivo de Referência

Para entender melhor as mudanças:
- Veja: `rls_policies.sql` (atualizado com comentários)
- Linhas 10-13: Explicação sobre deprecação de `get_my_team_id()`
- Linhas 93-119: Policies atualizadas para submissions
- Linhas 145-162: Policies atualizadas para teams

## Troubleshooting

**Erro: "policy already exists"**
- Normal, significa que já foi executado antes
- Execute novamente, os `DROP POLICY IF EXISTS` vão limpar

**Erro: "table does not exist"**
- Verifique se as tabelas existem no Supabase
- Tables devem incluir: teams, submissions, evaluations, penalties, power_ups

**Login funciona mas dashboard não carrega**
- Verifique se a equipe foi criada com setup-15-teams.sql
- Verifique se o email da equipe existe na tabela teams
- Verifique o console do navegador para erros detalhados

## Suporte

Se encontrar problemas:
1. Verifique o email exato da equipe no Supabase
2. Verifique se as senhas estão corretas
3. Limpe cache do navegador e tente novamente
4. Verifique os logs do Supabase para erros de RLS
