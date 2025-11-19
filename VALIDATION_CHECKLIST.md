# ✅ CHECKLIST - Validação Completa da Solução RPC

## 📋 Pré-Deploy (Execute ANTES de fazer push)

- [ ] **SQL executado no Supabase**
  - Arquivo: `create-activate-quest-rpc.sql`
  - Local: Supabase Dashboard → SQL Editor
  - Resultado: "RPC functions created successfully!"

- [ ] **Teste Node.js passou**
  - Comando: `node test-rpc-solution.js`
  - Resultado: "TODOS OS TESTES PASSARAM!"
  - Quest 5.3 foi ativada: ✅
  - Quest 5.3 foi fechada: ✅

- [ ] **Código API atualizado**
  - Arquivo: `src/app/api/admin/advance-quest/route.ts`
  - Linha ~83: `.rpc('close_quest')` ✅
  - Linha ~187: `.rpc('activate_quest')` ✅
  - Sem erros TypeScript: ✅

- [ ] **Documentação criada**
  - `RPC_SOLUTION_COMPLETE.md` ✅
  - `QUICK_START_RPC.md` ✅
  - `test-rpc-solution.js` ✅

## 🚀 Deploy

- [ ] **Git commit**
  ```powershell
  git status  # Verificar mudanças
  git add .
  git commit -m "fix: use RPC functions to bypass Supabase UPDATE bug on Quest 5.3"
  ```

- [ ] **Git push**
  ```powershell
  git push
  ```

- [ ] **Vercel/Netlify rebuild**
  - Se não for automático, force rebuild manual

## ✅ Pós-Deploy (Validação em Produção)

### Teste 1: Verificar RPC via Supabase Dashboard

- [ ] Abrir Supabase → SQL Editor
- [ ] Executar:
  ```sql
  SELECT id, name, status, started_at 
  FROM quests 
  WHERE phase_id = 5 AND order_index = 3;
  ```
- [ ] Quest 5.3 existe: ✅
- [ ] Status atual: `scheduled`

- [ ] Executar ativação manual:
  ```sql
  SELECT * FROM activate_quest('40e52ab2-482f-4d09-97f8-cd37aae15402');
  ```
- [ ] Resultado: status = `active`, started_at preenchido ✅

- [ ] Resetar quest:
  ```sql
  UPDATE quests 
  SET status = 'scheduled', started_at = NULL, ended_at = NULL
  WHERE phase_id = 5 AND order_index = 3;
  ```

### Teste 2: Validar API via Postman/Insomnia

- [ ] Endpoint: `POST /api/admin/advance-quest`
- [ ] Body:
  ```json
  {
    "questId": "ID_DA_QUEST_5.2"
  }
  ```
- [ ] Response: 200 OK
- [ ] Mensagem: "Quest 2 fechada. Quest 3 ativada."

### Teste 3: Validar Auto-Advance (Teste Real)

**Opção A: Aguardar expiração natural**
- [ ] Quest 5.2 está ativa
- [ ] Aguardar deadline expirar
- [ ] QuestAutoAdvancer chama API automaticamente
- [ ] Quest 5.3 é ativada sem erros

**Opção B: Forçar expiração (mais rápido)**
- [ ] Abrir Supabase SQL Editor
- [ ] Executar:
  ```sql
  UPDATE quests 
  SET deadline = NOW() - INTERVAL '1 minute'
  WHERE phase_id = 5 AND order_index = 2;
  ```
- [ ] Aguardar ~30 segundos (polling interval)
- [ ] Quest 5.3 deve ser ativada automaticamente

### Teste 4: Verificar Logs (Next.js)

- [ ] Abrir console do servidor Next.js
- [ ] Procurar por:
  ```
  📝 RPC: fechando quest ... usando close_quest()
  ✅ Quest ID validado
  📊 CLOSE RPC resultado: error=não
  📝 RPC: ativando quest ... usando activate_quest()
  📊 ACTIVATE RPC resultado: error=não
  ```
- [ ] Sem mensagens de erro ✅

## 🎯 Critérios de Sucesso

### ✅ Sucesso Total
- Quest 5.2 fecha automaticamente ao expirar
- Quest 5.3 ativa automaticamente sem erros
- Logs mostram "RPC resultado: error=não"
- Sem erro "UPDATE requires WHERE clause"

### ⚠️ Sucesso Parcial
- Quest ativa manualmente via SQL mas falha via API
  → Verificar Service Role Key no `.env`
- Quest ativa via API mas não auto-advance
  → Verificar QuestAutoAdvancer component

### ❌ Falha
- Erro "function activate_quest does not exist"
  → SQL não foi executado no Supabase
- Erro "UPDATE requires WHERE clause" ainda aparece
  → API não foi atualizada para usar RPC
- Erro 500 em produção mas funciona local
  → Env vars não configuradas no Vercel/Netlify

## 📊 Métricas de Validação

| Métrica | Esperado | Como Verificar |
|---------|----------|----------------|
| Quest 5.2 → 5.3 automático | ✅ Funciona | Aguardar deadline expirar |
| Tempo de transição | < 1 segundo | Logs do servidor |
| Erro 21000 | Nunca aparece | Logs + Supabase errors |
| RPC execution time | < 100ms | Supabase → Database → Query Performance |

## 🐛 Troubleshooting Checklist

Se algo falhar, verificar NA ORDEM:

1. [ ] **SQL executado?**
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name IN ('activate_quest', 'close_quest');
   ```
   Deve retornar 2 linhas

2. [ ] **Env vars corretas?**
   - `.env.local` tem `SUPABASE_SERVICE_ROLE_KEY`
   - Vercel/Netlify tem env vars configuradas

3. [ ] **API atualizada?**
   - `git log` mostra commit "fix: use RPC functions"
   - Deploy foi feito após commit

4. [ ] **Função RPC tem permissões?**
   ```sql
   SELECT has_function_privilege('service_role', 'activate_quest(uuid)', 'execute');
   ```
   Deve retornar `true`

## 📝 Notas Finais

- **Rollback**: Se precisar voltar atrás, delete as funções:
  ```sql
  DROP FUNCTION activate_quest(uuid);
  DROP FUNCTION close_quest(uuid);
  ```
  E reverta o commit com `git revert`

- **Monitoramento**: Após deploy, monitore logs por 24h para garantir estabilidade

- **Backup**: Quest data está em `fix-and-recreate-quest-5-3.js` (backup automático)

---

**Status Final**: ⬜ Aguardando validação  
**Última atualização**: 2025-01-12  
**Responsável**: GitHub Copilot
