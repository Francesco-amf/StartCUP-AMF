# 🔧 FIX URGENTE - Políticas RLS de Mentor Requests

## Problema Identificado

As políticas RLS (Row Level Security) da tabela `mentor_requests` estavam buscando mentores na tabela **`teams`**, mas os mentores estão na tabela **`evaluators`**.

**Resultado**: Mentores não conseguiam ver as solicitações de mentoria na página deles.

---

## Solução

Execute o SQL abaixo **NO SUPABASE DASHBOARD → SQL EDITOR**:

```sql
-- ==========================================
-- FIX: Políticas RLS de mentor_requests
-- ==========================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Mentors can view requests for them" ON mentor_requests;
DROP POLICY IF EXISTS "Mentors can update their requests" ON mentor_requests;

-- NOVA Política: Mentores podem ver solicitações direcionadas a eles
CREATE POLICY "Mentors can view requests for them" 
  ON mentor_requests FOR SELECT 
  TO authenticated 
  USING (
    mentor_id IN (
      SELECT id FROM evaluators WHERE email = auth.jwt()->>'email'
    )
    OR
    EXISTS (
      SELECT 1 FROM teams 
      WHERE email = auth.jwt()->>'email' 
      AND course = 'Administration'
    )
  );

-- NOVA Política: Mentores podem atualizar status de suas solicitações
CREATE POLICY "Mentors can update their requests" 
  ON mentor_requests FOR UPDATE 
  TO authenticated 
  USING (
    mentor_id IN (
      SELECT id FROM evaluators WHERE email = auth.jwt()->>'email'
    )
    OR
    EXISTS (
      SELECT 1 FROM teams 
      WHERE email = auth.jwt()->>'email' 
      AND course = 'Administration'
    )
  );
```

---

## Como Executar

1. Abrir **Supabase Dashboard**
2. Ir em **SQL Editor**
3. Copiar e colar o SQL acima
4. Clicar em **Run** (ou Ctrl+Enter)

---

## Verificar Se Funcionou

Após executar, verifique:

```sql
-- Ver todas as políticas da tabela mentor_requests
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'mentor_requests'
ORDER BY policyname;
```

**Resultado esperado**: 4 políticas:
- `Mentors can update their requests`
- `Mentors can view requests for them`
- `Teams can create mentor requests`
- `Teams can view their own mentor requests`

---

## Testar

1. **Equipe** faz solicitação de mentoria (paga coins)
2. **Mentor** faz login e acessa `/evaluate`
3. Deve aparecer a solicitação na seção "Solicitações de Mentoria Pendentes"
4. Verificar no console do navegador (F12) os logs:
   ```
   🔍 [MentorRequestsList] Buscando solicitações para mentor: [UUID]
   📦 [MentorRequestsList] Resultado da query: { count: 1 }
   ```

---

## Arquivos Atualizados

- ✅ `FIX_MENTOR_REQUESTS_RLS.sql` (novo - arquivo de correção)
- ✅ `CREATE_MENTOR_REQUEST_SYSTEM.sql` (atualizado)
- ✅ `MentorRequestsList.tsx` (logs de debug adicionados)

---

**Status**: Pronto para executar no Supabase 🚀
