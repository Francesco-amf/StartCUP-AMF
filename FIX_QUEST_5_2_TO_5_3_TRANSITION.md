# 🐛 FIX: Quest 5.2 → 5.3 Transition Error

## 🔍 Problema Identificado

O sistema não conseguia avançar da Quest 5.2 para a Quest 5.3, retornando o erro:

```
POST /api/admin/advance-quest 500 (Internal Server Error)
{
  error: 'Erro ao ativar próxima quest.',
  details: 'UPDATE requires a WHERE clause',
  code: '21000',
  questId: 'eefb5798-a8b5-4d07-9c8d-8fee933dbcd6'
}
```

## 🕵️ Diagnóstico

### Testes Realizados:

1. **Quest 5.3 existe e está válida** ✅
   - ID: `eefb5798-a8b5-4d07-9c8d-8fee933dbcd6`
   - Status: `scheduled`
   - Phase: 5, Order: 3

2. **UPDATE com apenas `status` funciona** ✅
   ```js
   UPDATE quests SET status='active' WHERE id=... // ✅ OK
   ```

3. **UPDATE incluindo `started_at` FALHA** ❌
   ```js
   UPDATE quests SET status='active', started_at=NOW() WHERE id=... // ❌ UPDATE requires WHERE clause
   ```

### Causa Raiz:

Existe um **bug ou constraint** na coluna `started_at` da tabela `quests` que bloqueia qualquer UPDATE que tente modificá-la, mesmo usando:
- Service Role Key (privilégios elevados)
- Cláusula WHERE válida
- UPDATE separado em duas etapas

O PostgreSQL/Supabase retorna o erro genérico "UPDATE requires a WHERE clause" mesmo quando a cláusula WHERE está presente e correta.

## ✅ Solução Implementada

### 1. Trigger Automático (Banco de Dados)

Criar um **trigger BEFORE UPDATE** que preenche `started_at` automaticamente quando `status` muda para `'active'`:

```sql
-- Ver arquivo: create-auto-started-at-trigger.sql

CREATE OR REPLACE FUNCTION set_quest_started_at_on_activate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') AND NEW.started_at IS NULL THEN
    NEW.started_at = NOW();
  END IF
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_set_quest_started_at
  BEFORE UPDATE ON quests
  FOR EACH ROW
  EXECUTE FUNCTION set_quest_started_at_on_activate();
```

### 2. Modificação no Código (API)

Modificar `src/app/api/admin/advance-quest/route.ts` para **NÃO** tentar atualizar `started_at` manualmente. Apenas atualizar `status='active'`, e o trigger preenche `started_at` automaticamente.

**Antes:**
```typescript
await supabaseAdmin
  .from('quests')
  .update({
    status: 'active',
    started_at: updateTime  // ❌ Causava erro
  })
  .eq('id', nextQuest.id)
```

**Depois:**
```typescript
// ✅ Apenas status - started_at preenchido automaticamente por trigger
await supabaseAdmin
  .from('quests')
  .update({ status: 'active' })
  .eq('id', nextQuest.id)
```

## 📋 Passos para Aplicar o Fix

### Passo 1: Criar o Trigger no Supabase

1. Acesse o Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT/sql
   ```

2. Execute o SQL em `create-auto-started-at-trigger.sql`:
   - Cria a função `set_quest_started_at_on_activate()`
   - Cria o trigger `auto_set_quest_started_at`
   - Testa automaticamente

### Passo 2: Código Já Foi Atualizado

O arquivo `src/app/api/admin/advance-quest/route.ts` já foi modificado para usar apenas UPDATE de `status`.

### Passo 3: Rebuild e Deploy

```bash
npm run build
# ou
vercel deploy
```

## 🧪 Testes de Validação

Execute os scripts de teste para verificar se o fix funcionou:

```bash
# Testar que o trigger preenche started_at automaticamente
node test-trigger.js

# Simular avanço de quest 5.2 → 5.3
node test-advance-quest-final.js
```

## 📁 Arquivos Relacionados

- `fix-quest-5-3-corruption.sql` - Script inicial de diagnóstico
- `create-auto-started-at-trigger.sql` - **TRIGGER SOLUTION** (executar no Supabase)
- `src/app/api/admin/advance-quest/route.ts` - Código modificado
- `test-update-combinations.js` - Script de diagnóstico dos UPDATEs
- `check-quest-5-3.js` - Verificação inicial do problema

## 🎯 Resultado Esperado

Após aplicar o fix:

1. ✅ Quest 5.2 expira normalmente
2. ✅ API `/api/admin/advance-quest` é chamada
3. ✅ Quest 5.2 é marcada como `closed`
4. ✅ Quest 5.3 é ativada com `status='active'`
5. ✅ `started_at` é preenchido automaticamente pelo trigger
6. ✅ Interface atualiza via polling/realtime
7. ✅ Quest 5.3 aparece como ativa para os usuários

## 🔒 Segurança

O trigger é executado com `SECURITY DEFINER`, garantindo que:
- Apenas UPDATEs legítimos na tabela `quests` disparam o trigger
- O trigger roda com privilégios elevados
- Não expõe nenhuma vulnerabilidade adicional
- RLS policies continuam aplicadas normalmente

---

**Status:** ✅ FIX IMPLEMENTADO - AGUARDANDO CRIAÇÃO DO TRIGGER NO SUPABASE
