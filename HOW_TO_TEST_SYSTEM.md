# Como Testar o Sistema StartCup - Guia Passo a Passo

## 🚀 Setup Inicial

### 1. Ter Admin + Equipe de Teste

Você provavelmente está logado como:
- **Email**: `admin@test.com`
- **Role**: `admin`

Para testar como **equipe**, você precisa de uma conta diferente.

### 2. Criar Equipe de Teste

**Opção A: Via SQL (RECOMENDADO - Rápido)**

1. Abra Supabase SQL Editor
2. Cole o conteúdo de `create-test-team.sql`
3. Clique "Run"
4. Equipe criada em < 1 segundo

**Opção B: Via UI (Manual)**

1. Ir para Admin Control Panel
2. Procurar seção "Registrar Nova Equipe"
3. Preencher:
   - Nome: "Equipe Teste"
   - Email: "test-team@startcup.local"
   - Curso: "Engenharia de Software"
   - Membros: "João, Maria, Pedro"
4. Salvar

### 3. Criar Usuário no Supabase Auth

**Passo 1**: Ir para Supabase Dashboard
- URL: https://supabase.com/dashboard
- Selecionar seu projeto

**Passo 2**: Menu esquerdo → Authentication

**Passo 3**: Clique "Create User" ou "Add User"

**Passo 4**: Preencher:
```
Email: test-team@startcup.local
Password: SenhaSegura123!
```

**Passo 5**: Clique "Create User"

**Passo 6**: Voltar ao app
- Clique "Logout" (se logado)
- Clique "Login"
- Email: `test-team@startcup.local`
- Password: `SenhaSegura123!`
- Clique "Login"

---

## 🧪 Testes - Fluxo Completo

### Teste 1: Admin Inicia Fase 1

**Como Admin**:

1. Abra Admin Control Panel
   - URL: `https://seu-app.com/admin/control-panel`
   - Você já está logado como admin

2. Procure **"🔍 Fase 1: Descoberta"** card

3. Clique botão **"Ativar 🔍"**

4. Confirme no popup:
   ```
   🚀 INICIAR STARTCUP AMF

   Deseja iniciar o evento na Fase 1: Descoberta?
   O cronômetro oficial será iniciado agora!

   [Cancelar] [OK]
   ```

5. Clique **OK**

6. **Resultado esperado**:
   ```
   ✅ Fase atualizada para: Fase 1: Descoberta
   ✨ 1 quest(s) ativada(s) automaticamente!
   ```

7. **Verificar**:
   - Card da Fase 1 fica destacado em VERDE
   - Status muda para "✓ Fase Atual"
   - Primeira quest da Fase 1 agora está ativa

---

### Teste 2: Equipe Acessa Dashboard e Vê Quest

**Como Equipe** (logado com test-team@startcup.local):

1. Acesse Dashboard
   - URL: `https://seu-app.com/team/dashboard`

2. **Resultado esperado**:
   - Nome da equipe no topo: "Equipe Teste StartCup"
   - Status: "🟢 Evento em Andamento"
   - Ranking mostra sua equipe com 0 pontos

3. Clique em **"📝 Submeter Entregas"**
   - URL: `https://seu-app.com/team/submit`

4. **Resultado esperado**:
   ```
   📝 Submeter Entregas
   Equipe Teste StartCup - Engenharia de Software

   🟢 Evento em Andamento
   Há 1 quest(s) disponível(is) para submissão

   📋 Quests Disponíveis

   [Quest Card]
   🔍 Primeira Quest da Fase 1
   Pontuação máxima: 50 pontos

   ✅ No Prazo
   Tempo restante: 29 minutos
   ...
   ```

---

### Teste 3: Submissão No Prazo

**Ainda como Equipe**:

1. Na página `/submit`, você vê a quest com:
   ```
   ✅ No Prazo
   Tempo restante: 29 minutos
   Após o prazo, você terá uma janela de 15 minutos adicionais
   com penalidades progressivas.
   ```

2. Preencha o formulário:
   - Se for arquivo: Selecione um PDF/DOC
   - Se for texto: Digite algo
   - Se for URL: Cole um link

3. Clique **"🚀 Enviar Entrega"**

4. Confirme:
   ```
   ⚠️ ATENÇÃO: Esta submissão é DEFINITIVA e não poderá ser alterada.
   Tem certeza que deseja enviar esta entrega?

   [Cancelar] [OK]
   ```

5. **Resultado esperado**:
   ```
   ✅ Entrega enviada com sucesso!
   ```

6. **Verificar no ranking**:
   - Volte ao Dashboard
   - Sua equipe agora tem pontos (ex: 50 pontos)
   - Status da quest: "Entrega em análise. Aguarde a avaliação."

---

### Teste 4: Submissão Atrasada (Simular)

**Para simular atraso**, você precisa:

1. **Como Admin**: Ajuste o tempo da quest para simular atraso

2. **Via SQL** (Supabase Editor):
```sql
-- Simular que a quest começou há 25 minutos
UPDATE quests
SET started_at = NOW() - INTERVAL '25 minutes'
WHERE order_index = 1
  AND phase_id IN (SELECT id FROM phases WHERE order_index = 1)
LIMIT 1;

-- Configurar deadline de 20 minutos (para estar atrasado)
UPDATE quests
SET planned_deadline_minutes = 20
WHERE order_index = 1
  AND phase_id IN (SELECT id FROM phases WHERE order_index = 1)
LIMIT 1;
```

3. **Como Equipe**: Volte a `/submit`

4. **Status deve mostrar**:
   ```
   ⏰ Submissão Atrasada
   Você está 5 minutos atrasado(a).
   Penalidade: -5pts (0-5 minutos)
   Janela de atraso: 10 minutos restantes
   ```

5. **Envie mesmo assim**

6. **Resultado**:
   ```
   ✅ Entrega enviada com sucesso! (5min atrasado) - Penalidade: -5pts
   ```

7. **No ranking**:
   - Pontos: 50 - 5 = 45 pontos
   - Mostra a penalidade aplicada

---

### Teste 5: Bloqueio Sequencial

**Pré-requisito**: Ter pelo menos 2 quests na mesma fase

1. **Como Admin**: Na Fase 1, ative a Quest 2:
   - Via QuestControlPanel, clique "INICIAR" em Quest 2

2. **Como Equipe**: Acesse `/submit`

3. **Resultado esperado**:
   ```
   Você deve primeiro enviar a quest anterior
   ```
   (Quest 2 não aparece no formulário)

4. **Após entregar Quest 1**:
   - Quest 2 agora fica disponível

---

### Teste 6: Bloqueio Após 15 Minutos

**Via SQL** (simular atraso extremo):

```sql
-- Quest começou há 35 minutos
UPDATE quests
SET started_at = NOW() - INTERVAL '35 minutes'
WHERE order_index = 1
  AND phase_id IN (SELECT id FROM phases WHERE order_index = 1)
LIMIT 1;

-- Deadline: 20 minutos
-- Janela fecha: 35 minutos (20 + 15)
-- Agora: 36 minutos (passou!)
UPDATE quests
SET planned_deadline_minutes = 20
WHERE order_index = 1
  AND phase_id IN (SELECT id FROM phases WHERE order_index = 1)
LIMIT 1;
```

**Como Equipe**: Acesse `/submit`

**Status**:
```
🚫 Prazo Expirado
A janela para submissão desta quest expirou.
Você não pode mais enviar uma entrega.
```

**Formulário**:
- Desabilitado
- Botão "Enviar" não aparece

---

## 📊 Teste de Admin - Avaliação

### Avaliar Submissões

**Como Admin**:

1. Vá para Admin Control Panel
2. Procure seção **"Evaluators"** ou **"Avaliações"**
3. Veja submissões pendentes

**Como Avaliador** (se criado):

1. Vá para `/evaluator/evaluate`
2. Liste submissões pendentes
3. Clique em uma submissão
4. Preencha avaliação:
   - Base Points: 40-50
   - Bonus Points: 0-10
   - Multiplier: 0.8-1.0
   - Comments: opcional
5. Clique "Avaliar"

**Resultado**:
- Submissão agora tem status "evaluated"
- Pontos finais calculados
- Ranking atualizado automaticamente

---

## ⏰ Teste de Deadline com Atraso

### Configurar Deadline Real

**Como Admin**, via API ou SQL:

```bash
curl -X POST 'https://seu-app.com/api/admin/quest/deadline' \
  -H 'Content-Type: application/json' \
  -d '{
    "questId": "uuid-da-quest",
    "plannedDeadlineMinutes": 30,
    "allowLateSubmissions": true
  }'
```

**Ou via SQL**:
```sql
UPDATE quests
SET planned_deadline_minutes = 30,
    late_submission_window_minutes = 15,
    allow_late_submissions = TRUE
WHERE id = 'uuid-da-quest';
```

**Timeline**:
- 00:00 - Quest inicia
- 00:30 - Deadline
- 00:31 - 00:35 (5 min atrasado): -5 pts penalidade
- 00:36 - 00:40 (5-10 min): -10 pts penalidade
- 00:41 - 00:45 (10-15 min): -15 pts penalidade
- 00:46 - BLOQUEADO

---

## 🎮 Teste de Múltiplas Equipes

### Criar Mais Equipes de Teste

**Via SQL**:
```sql
INSERT INTO teams (name, email, course, members)
VALUES
  ('Equipe A', 'teamA@startcup.local', 'Eng. Software', 'João, Maria'),
  ('Equipe B', 'teamB@startcup.local', 'Eng. Dados', 'Pedro, Ana'),
  ('Equipe C', 'teamC@startcup.local', 'Eng. Sistemas', 'Carlos, Beatriz')
ON CONFLICT (email) DO NOTHING;
```

**Criar usuários correspondentes** em Supabase Auth para cada equipe

**Testar**:
1. Login como Team A
2. Submeter Quest 1
3. Login como Team B
4. Submeter Quest 1 (com atraso simulado)
5. Login como Team C
6. Não submeter (para ver como fica no ranking)

**Resultado**:
- Ranking mostra 3 equipes
- Team A: 50 pts
- Team B: 40 pts (50 - 10 penalidade por atraso)
- Team C: 0 pts
- Ordenado corretamente

---

## 🔍 Verificar Dados no Banco

### Query para Ver Submissões

```sql
SELECT
  t.name as team,
  q.name as quest,
  s.status,
  s.submitted_at,
  s.is_late,
  s.late_minutes,
  s.late_penalty_applied,
  s.final_points
FROM submissions s
JOIN teams t ON s.team_id = t.id
JOIN quests q ON s.quest_id = q.id
ORDER BY s.submitted_at DESC;
```

### Query para Ver Penalidades

```sql
SELECT
  t.name as team,
  p.penalty_type,
  p.points_deduction,
  p.reason,
  p.created_at
FROM penalties p
JOIN teams t ON p.team_id = t.id
ORDER BY p.created_at DESC;
```

### Query para Ver Ranking

```sql
SELECT
  t.name as team,
  COALESCE(SUM(s.final_points), 0) - COALESCE(SUM(p.points_deduction), 0) as total_points,
  COUNT(DISTINCT s.id) as submissions,
  COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN p.id END) as penalties
FROM teams t
LEFT JOIN submissions s ON t.team_id = s.team_id
LEFT JOIN penalties p ON t.team_id = p.team_id
WHERE t.email NOT LIKE '%@test.com'
GROUP BY t.id, t.name
ORDER BY total_points DESC;
```

---

## ✅ Checklist de Testes

- [ ] Admin inicia Fase 1
- [ ] Quest 1 ativa automaticamente
- [ ] Equipe vê quest no /submit
- [ ] Equipe submete no prazo (sem penalidade)
- [ ] Ranking atualiza com pontos
- [ ] Submissão atrasada mostra penalidade
- [ ] Bloqueio após 15 minutos funciona
- [ ] Bloqueio sequencial (Quest 2 bloqueada)
- [ ] Avaliador consegue avaliar
- [ ] Pontos finais calculados corretamente
- [ ] Múltiplas equipes ranking correto
- [ ] Performance OK com 15 equipes

---

## 🆘 Troubleshooting

### "Equipe não encontrada"
- **Causa**: Está logado como admin, não equipe
- **Solução**: Fazer logout e login com email de equipe

### "Nenhuma quest ativa"
- **Causa**: Fase não foi iniciada ainda
- **Solução**: Como admin, clique "Ativar" em uma fase

### Penalidade não aparece
- **Causa**: SQL migration não foi executado
- **Solução**: Execute `add-late-submission-system.sql` no Supabase

### Erro "Cannot coerce the result to a single JSON object"
- **Causa**: Query retornou múltiplas linhas quando esperava 1
- **Solução**: Verificar `.single()` em queries que deveriam retornar 1 resultado

---

## 📚 Documentação Relacionada

- `LATE_SUBMISSION_SYSTEM.md` - Detalhes técnicos
- `QUEST_AUTO_ACTIVATION.md` - Como quests ativam
- `SQL_EXECUTION_GUIDE.md` - Como executar migrations
- `LATE_SUBMISSION_IMPLEMENTATION_SUMMARY.md` - Sumário de features
