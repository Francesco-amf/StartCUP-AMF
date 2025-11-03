# Guia de Execução do SQL - Late Submission System

## ⚠️ ANTES DE COMEÇAR

**IMPORTANTE**: Faça um backup do seu banco de dados antes de executar!

## 🚀 Como Executar no Supabase

### Método 1: Via SQL Editor (RECOMENDADO)

1. **Acesse o Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Selecione seu projeto StartCup

2. **Abra o SQL Editor**
   - No menu lateral esquerdo, clique em **SQL Editor**

3. **Copie todo o SQL**
   - Abra o arquivo: `add-late-submission-system.sql`
   - Selecione todo o conteúdo (Ctrl+A)
   - Copie (Ctrl+C)

4. **Cole no SQL Editor**
   - Clique na área de edição do Supabase
   - Cole o conteúdo (Ctrl+V)

5. **Execute**
   - Clique no botão **▶️ Run** (canto superior direito)
   - Aguarde a execução (levará alguns segundos)

6. **Verifique o Resultado**
   - Deve aparecer uma mensagem de sucesso no final:
   ```
   "Late Submission System com penalidades progressivas instalado com sucesso!"
   ```

### Método 2: Via psql (Command Line)

Se você tem acesso à linha de comando do PostgreSQL:

```bash
# 1. Conecte ao seu banco
psql -h supabase-host.supabase.co \
     -U postgres \
     -d postgres \
     -p 5432

# 2. Execute o arquivo SQL
\i add-late-submission-system.sql

# 3. Desconecte
\q
```

## 🔍 Como Verificar se Funcionou

### Verificação 1: Verificar Colunas Adicionadas

```sql
-- Execute no SQL Editor do Supabase
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'submissions'
ORDER BY ordinal_position;
```

**Deve incluir**:
- `submitted_at` (timestamp with time zone)
- `is_late` (boolean)
- `late_minutes` (integer)
- `late_penalty_applied` (integer)
- `quest_deadline` (timestamp with time zone)

### Verificação 2: Verificar Funções Criadas

```sql
-- Listar todas as funções criadas
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%late%'
  OR routine_name LIKE '%deadline%'
  OR routine_name LIKE '%penalty%'
ORDER BY routine_name;
```

**Deve listar**:
- `calculate_quest_deadline`
- `calculate_late_penalty`
- `validate_submission_allowed`
- `check_previous_quest_submitted`
- `is_late_submission_window_open`
- `update_late_submission_fields`

### Verificação 3: Verificar Índices

```sql
-- Listar índices na tabela submissions
SELECT indexname
FROM pg_indexes
WHERE tablename = 'submissions'
AND indexname LIKE '%late%'
OR indexname LIKE '%penalty%'
OR indexname LIKE '%team_quest%';
```

**Deve listar**:
- `idx_submissions_is_late`
- `idx_submissions_late_penalty`
- `idx_submissions_team_quest`

### Verificação 4: Verificar View

```sql
-- Verificar se a view foi criada
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'late_submissions_summary';
```

**Resultado esperado**: 1 linha com `late_submissions_summary`

### Verificação 5: Verificar Trigger

```sql
-- Listar triggers na tabela submissions
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'submissions';
```

**Deve listar**:
- `update_late_submission_fields_trigger`

## ⚙️ Campos Adicionados às Tabelas

### Tabela `submissions` - 5 novos campos:

| Campo | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `submitted_at` | TIMESTAMP | NOW() | Quando a submissão foi enviada |
| `is_late` | BOOLEAN | FALSE | Se foi atrasada |
| `late_minutes` | INTEGER | NULL | Quantos minutos atrasou |
| `late_penalty_applied` | INTEGER | 0 | Penalidade em pontos (0, 5, 10, 15) |
| `quest_deadline` | TIMESTAMP | NULL | Deadline calculado (para auditoria) |

### Tabela `quests` - 3 novos campos:

| Campo | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `planned_deadline_minutes` | INTEGER | 0 | Minutos até deadline após início |
| `late_submission_window_minutes` | INTEGER | 15 | Minutos de janela de atraso |
| `allow_late_submissions` | BOOLEAN | TRUE | Se permite envios atrasados |

## 🧪 Teste Rápido Após Execução

Após executar o SQL, teste se tudo funciona:

```sql
-- 1. Verificar se trigger funciona
INSERT INTO submissions (team_id, quest_id, content, status, submitted_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',  -- UUID válido
  '22222222-2222-2222-2222-222222222222',  -- UUID válido
  'teste',
  'pending',
  NOW()
);

-- Deve aparecer: is_late = FALSE, late_minutes = 0, late_penalty_applied = 0

-- 2. Limpar dados de teste
DELETE FROM submissions WHERE content = 'teste';
```

## ❌ Se Houver Erros

### Erro: "column already exists"
```
ERRO:  coluna "submitted_at" já existe
```
**Solução**: Os campos já foram adicionados em uma execução anterior. É seguro continuar.

### Erro: "function already exists"
```
ERRO: função "calculate_late_penalty" já existe
```
**Solução**: As funções já foram criadas. É seguro continuar (elas serão recriadas).

### Erro: "relation does not exist"
```
ERRO: relação "penalties" não existe
```
**Solução**: Certifique-se de que a tabela `penalties` existe. Se não existir, execute primeiro o script que cria as tabelas do sistema.

### Erro: "syntax error"
```
ERRO: erro de sintaxe
```
**Solução**: Verifique se o arquivo SQL está completo. Certifique-se de não há linhas cortadas.

## 🔄 Se Precisar Reverter

Se algo der errado e você quiser reverter (⚠️ CUIDADO - DADOS SERÃO PERDIDOS):

```sql
-- Remover trigger
DROP TRIGGER IF EXISTS update_late_submission_fields_trigger ON submissions;

-- Remover funções
DROP FUNCTION IF EXISTS update_late_submission_fields();
DROP FUNCTION IF EXISTS calculate_quest_deadline(UUID);
DROP FUNCTION IF EXISTS calculate_late_penalty(INTEGER);
DROP FUNCTION IF EXISTS validate_submission_allowed(UUID, UUID);
DROP FUNCTION IF EXISTS check_previous_quest_submitted(UUID, UUID);
DROP FUNCTION IF EXISTS is_late_submission_window_open(UUID);

-- Remover view
DROP VIEW IF EXISTS late_submissions_summary CASCADE;

-- Remover índices
DROP INDEX IF EXISTS idx_submissions_is_late;
DROP INDEX IF EXISTS idx_submissions_late_penalty;
DROP INDEX IF EXISTS idx_submissions_team_quest;

-- Remover colunas
ALTER TABLE submissions DROP COLUMN IF EXISTS submitted_at;
ALTER TABLE submissions DROP COLUMN IF EXISTS is_late;
ALTER TABLE submissions DROP COLUMN IF EXISTS late_minutes;
ALTER TABLE submissions DROP COLUMN IF EXISTS late_penalty_applied;
ALTER TABLE submissions DROP COLUMN IF EXISTS quest_deadline;

ALTER TABLE quests DROP COLUMN IF EXISTS planned_deadline_minutes;
ALTER TABLE quests DROP COLUMN IF EXISTS late_submission_window_minutes;
ALTER TABLE quests DROP COLUMN IF EXISTS allow_late_submissions;
```

## ✅ Checklist

- [ ] Backup do banco realizado
- [ ] SQL Editor aberto no Supabase
- [ ] Arquivo SQL copiado completamente
- [ ] SQL colado no editor
- [ ] Botão "Run" clicado
- [ ] Execução concluída sem erros
- [ ] Verificação 1 passando (colunas visíveis)
- [ ] Verificação 2 passando (funções listadas)
- [ ] Verificação 3 passando (índices criados)
- [ ] Verificação 4 passando (view criada)
- [ ] Verificação 5 passando (trigger criado)
- [ ] Pronto para usar!

## 📞 Suporte

Se encontrar problemas:

1. Verifique o arquivo `LATE_SUBMISSION_INTEGRATION.md` para detalhes de troubleshooting
2. Consulte `LATE_SUBMISSION_SYSTEM.md` para documentação técnica
3. Revise as mensagens de erro acima

## ⏱️ Tempo Estimado

- Cópia do SQL: 1 minuto
- Execução: 5-10 segundos
- Verificação: 2 minutos
- **Total**: ~3-5 minutos
