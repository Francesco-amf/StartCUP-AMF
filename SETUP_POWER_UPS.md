# 🔧 Setup da Tabela Power-ups

Se você está recebendo o erro "Equipe não encontrada" ou outro erro ao tentar ativar power-ups, é possível que a tabela `power_ups` não exista ou não tenha as permissões corretas no Supabase.

## ✅ Passos para Configurar:

### 1. Abrir o Supabase Dashboard
- Acesse: https://app.supabase.com
- Selecione seu projeto

### 2. SQL Editor
- Clique em **SQL Editor** (esquerda)
- Clique em **New Query**

### 3. Copiar e Executar o SQL
- Abra o arquivo: `create-power-ups-table.sql`
- Copie TODO o conteúdo
- Cole no editor do Supabase
- Clique em **Run** (ou Ctrl+Enter)

### 4. Verificar Resultado
Você deve ver mensagens como:
```
CREATE TABLE
CREATE INDEX
ALTER TABLE
CREATE POLICY
GRANT
```

### 5. Testar Novamente
- Recarregue a dashboard da equipe
- Tente ativar um power-up novamente

## 🐛 Se ainda der erro:

1. **Abra o F12** (DevTools do navegador)
2. **Vá em Console**
3. **Tente ativar o power-up**
4. **Copie a mensagem de erro completa**
5. **Compartilhe comigo**

## 📝 Checklist:
- [ ] SQL foi executado com sucesso no Supabase
- [ ] Não há erros na console do navegador
- [ ] Tabela `power_ups` existe (pode verificar em Supabase > Tables)
- [ ] RLS está habilitado na tabela
- [ ] Políticas foram criadas

## 🔍 Verificar Tabela (Opcional):

Se quiser verificar se a tabela existe e o que tem nela:

```sql
-- Ver estrutura da tabela
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'power_ups';

-- Ver registros
SELECT * FROM power_ups LIMIT 10;

-- Ver políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'power_ups';
```
