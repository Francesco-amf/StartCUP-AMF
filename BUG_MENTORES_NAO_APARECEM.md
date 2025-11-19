# 🐛 BUG: Mentores Não Aparecem - SOLUÇÃO

## 🔍 Problema Identificado

Quando equipe tenta comprar mentoria, aparece mensagem:
```
Nenhum mentor disponível no momento
```

**Causa Raiz:** Não existem avaliadores com `role='mentor'` no banco de dados.

## 📊 Diagnóstico

Sistema busca mentores com esta query:
```typescript
await supabase
  .from('evaluators')
  .select('id, name, email, specialty, is_online')
  .eq('role', 'mentor')  // ❌ Não encontra ninguém!
```

**Problema:** Todos os avaliadores têm `role='evaluator'`, nenhum tem `role='mentor'`.

## ✅ Solução

Execute o SQL `FIX_ADD_MENTORS.sql` no Supabase SQL Editor:

### **Opção 1: Todos os Avaliadores Viram Mentores** (Recomendado)

```sql
UPDATE evaluators
SET role = 'mentor'
WHERE role = 'evaluator' OR role IS NULL;
```

**Vantagem:** Todos os avaliadores podem ser chamados para mentoria (sistema de duplo papel funciona).

### **Opção 2: Apenas Alguns Avaliadores Viram Mentores**

```sql
UPDATE evaluators
SET role = 'mentor'
WHERE email IN (
  'natalia.santos@startcup-amf.com',
  'bruno.costa@startcup-amf.com',
  'mariana.almeida@startcup-amf.com',
  'felipe.rocha@startcup-amf.com',
  'laura.silva@startcup-amf.com'
);
```

**Vantagem:** Controle granular de quem pode ser mentor.

## 🎯 Verificação

Após executar o SQL, verificar:

```sql
SELECT 
  email,
  name,
  role,
  specialty
FROM evaluators
WHERE role = 'mentor'
ORDER BY name;
```

Deve retornar lista de mentores disponíveis.

## 🚀 Teste no Sistema

1. Acesse dashboard da equipe
2. Clique em "🆘 Chamar Mentor"
3. Agora deve aparecer lista de mentores disponíveis
4. Selecione um mentor e envie solicitação
5. Verificar se AMF Coins foram deduzidos

## 📝 Observações

- **Duplo Papel:** Avaliadores com `role='mentor'` podem tanto avaliar quests quanto atender mentorias
- **Campo `is_online`:** Removido do filtro, então todos os mentores aparecem (online ou não)
- **Campo `specialty`:** Mostra especialidade do mentor na lista (opcional)

## 🔧 Arquivos Criados

- `CHECK_MENTORS.sql` - Diagnóstico completo do sistema
- `FIX_ADD_MENTORS.sql` - Script de correção
- `BUG_MENTORES_NAO_APARECEM.md` - Este documento

---

**Status:** 🟡 Aguardando execução do SQL no Supabase
**Próximo Passo:** Executar `FIX_ADD_MENTORS.sql` (Opção 1 recomendada)
