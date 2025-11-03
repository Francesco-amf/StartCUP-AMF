# 🎯 Teste Completo do Fluxo de Evento StartCup AMF

**Data**: 2 de Novembro de 2025
**Versão do Sistema**: Production Ready
**Escopo**: Preparação → Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Conclusão

---

## 📋 Checklist de Pré-Requisitos

Antes de começar os testes, certifique-se de que:

- [ ] Sistema está rodando localmente (`npm run dev`)
- [ ] Supabase está conectado e acessível
- [ ] Banco de dados foi resetado (sem dados de testes anteriores)
- [ ] Você tem acesso às contas:
  - [ ] Admin: `admin@test.com`
  - [ ] Equipe 1: `team-test-1@startcup.local`
  - [ ] Equipe 2: `team-test-2@startcup.local` (opcional, para testes com múltiplas equipes)

---

## 🏗️ FASE 0: Preparação do Sistema

### Teste 0.1: Reset Completo do Sistema

**Objetivo**: Limpar todos os dados de testes anteriores

**Passos**:
1. Faça login como Admin (`admin@test.com`)
2. Navegue até `/admin/control-panel`
3. Procure pelo botão **"🔥 Resetar Sistema"** (parte inferior da página)
4. Clique no botão
5. Uma modal de confirmação aparecerá com a mensagem:
   ```
   ⚠️ ATENÇÃO: Resetar Sistema
   Esta ação é IRREVERSÍVEL e irá:
   - Deletar todas as avaliações
   - Deletar todas as submissões
   - Resetar pontuações das equipes
   - Limpar todo o progresso do evento
   ```
6. Digite **"RESETAR TUDO"** no campo de confirmação
7. Clique **"Confirmar Reset"**

**Resultado Esperado**:
```
✅ Sistema resetado com sucesso!

Todas as avaliações e submissões foram removidas.
```

**Verificação Pós-Reset**:
- [ ] Página mantém você logado (não faz logout inesperado)
- [ ] Mensagem de sucesso aparece
- [ ] Ao recarregar a página, todas as equipes têm 0 pontos
- [ ] Nenhuma quest está ativa

**Notas de Falha**:
- Se mostrar "Sua sessão expirou", houve regressão no auth handling (verificar client.ts listeners)
- Se não limpar penalidades, há problema no reset SQL (verificar add-late-submission-system.sql)

---

### Teste 0.2: Verificação de Estado Inicial

**Objetivo**: Confirmar que o sistema está limpo e pronto para testes

**Passos**:
1. Ainda como Admin, verifique o painel:
   - Procure pela seção **"Fases do Evento"**
   - Você deve ver 5 fases listadas: Descoberta, Inovação, Prototipagem, Pitch, Reflexão

2. Verifique cada fase:
   - [ ] Fase 1: "🔍 Descoberta" - status "Não Iniciada"
   - [ ] Fase 2: "💡 Inovação" - status "Não Iniciada"
   - [ ] Fase 3: "🛠️ Prototipagem" - status "Não Iniciada"
   - [ ] Fase 4: "🎤 Pitch" - status "Não Iniciada"
   - [ ] Fase 5: "🔄 Reflexão" - status "Não Iniciada"

3. Verifique na seção **"Estatísticas do Evento"**:
   - Total de equipes registradas
   - Total de quests disponíveis
   - Status geral: "⏳ Preparação"

**Resultado Esperado**:
```
✅ Sistema limpo
✅ 5 fases disponíveis
✅ Status: Preparação
✅ 0 submissões
✅ 0 avaliações
```

---

## 🔍 FASE 1: Descoberta

### Teste 1.1: Ativar Fase 1

**Objetivo**: Iniciar oficialmente a Fase 1 e ativar quests automaticamente

**Passos**:
1. Ainda no Admin Control Panel (`/admin/control-panel`)
2. Procure o card **"🔍 Fase 1: Descoberta"**
3. Clique no botão **"Ativar 🔍"**
4. Uma modal de confirmação aparece:
   ```
   🚀 INICIAR STARTCUP AMF

   Deseja iniciar o evento na Fase 1: Descoberta?
   O cronômetro oficial será iniciado agora!
   ```
5. Clique **"OK"**

**Resultado Esperado**:
```
✅ Fase atualizada para: Fase 1: Descoberta
✨ 1 quest(s) ativada(s) automaticamente!
```

**Verificações**:
- [ ] Card da Fase 1 fica destacado em **VERDE**
- [ ] Status muda para **"✓ Fase Atual"**
- [ ] Contador regressivo começa (XX minutos restantes)
- [ ] Página recarrega e você permanece logado
- [ ] Nenhuma mensagem de erro "sessão expirada"

**Notas sobre Deadline**:
- Padrão: 30 minutos para submissão
- Janela extra: +15 minutos (até 45 minutos totais)
- Penalidades: 5pts (min 15-30), 10pts (min 30-45), 15pts (após 45min)

---

### Teste 1.2: Equipe Vê Quest da Fase 1 (Como Equipe)

**Objetivo**: Verificar que a quest aparece corretamente para equipes

**Passos**:
1. Faça logout como Admin
2. Faça login como Equipe de Teste: `team-test-1@startcup.local`
3. Você deve ser redirecionado para `/team/dashboard`
4. Procure pela seção **"📝 Submeter Entregas"** ou clique no botão
5. Navegue até `/team/submit`

**Resultado Esperado**:
```
📝 Submeter Entregas
Equipe de Teste - Engenharia de Software

🟢 Evento em Andamento
Há 1 quest(s) disponível(is) para submissão
```

**Verificações da Quest Card**:
- [ ] Título: **"🔍 Quest 1: [Nome da Quest]"**
- [ ] Descrição é visível (texto claro)
- [ ] Pontos máximos exibidos em VERDE: **50 pontos** (ou conforme configurado)
- [ ] Tipo de Entrega mostrado com emoji (📄, 📝, ou 🔗)
- [ ] Requisitos listados com ✅ em tópicos
- [ ] Critérios de Avaliação visíveis com ✓
- [ ] Dicas de Sucesso em seção amarela
- [ ] **Layout responsivo**: Testa em mobile (320px) e desktop (1024px)
  - [ ] Mobile: Elementos empilhados verticalmente
  - [ ] Desktop: Layout com melhor espaçamento

**Design Checks** (melhorias recentes):
- [ ] Padding aumentado: `p-3 md:p-4` (visível conforto)
- [ ] Spacing entre seções: `space-y-3 md:space-y-4` (não compactado)
- [ ] Título em tamanho maior: `text-base md:text-lg` (legível)
- [ ] Pontos em verde destacado: `text-[#00FF88]` (visível)
- [ ] Listas com espaçamento: `space-y-2 md:space-y-2.5` (não apertado)

---

### Teste 1.3: Submeter Quest No Prazo

**Objetivo**: Enviar primeira entrega dentro do deadline

**Passos**:
1. Ainda na página `/team/submit`
2. Localize o campo de entrada conforme tipo de entrega:
   - **Se arquivo** (`file`): Clique no input e selecione um arquivo
   - **Se texto** (`text`): Clique no textarea e digite conteúdo
   - **Se URL** (`url`): Digite uma URL válida

3. **Exemplo para arquivo**:
   - Selecione um PDF ou DOC de < 50MB
   - Você verá:
     ```
     ✅ Arquivo selecionado
     documento.pdf (2.45MB)
     ```

4. Clique no botão **"🚀 Enviar Entrega"**

5. Uma confirmação aparece:
   ```
   ⚠️ ATENÇÃO: Esta submissão é DEFINITIVA e não poderá ser alterada.

   Tem certeza que deseja enviar esta entrega?
   ```

6. Clique **"OK"**

**Resultado Esperado**:
```
✅ Entrega enviada com sucesso!
```

**Verificações**:
- [ ] Mensagem de sucesso aparece
- [ ] Status da submission: "Entrega em análise. Aguarde a avaliação."
- [ ] Você permanece logado
- [ ] Tempo de envio: < 5 segundos (arquivo) ou < 2 segundos (texto/URL)

**Database Checks** (Verificar no Supabase):
```sql
-- Verificar submissão criada
SELECT
  id,
  quest_id,
  team_id,
  submitted_at,
  is_late,
  points_deduction
FROM submissions
WHERE team_id = 'team-test-1'
ORDER BY submitted_at DESC
LIMIT 1;

-- Resultado esperado: 1 row, is_late = false, points_deduction = 0
```

---

### Teste 1.4: Pontos Refletem no Ranking

**Objetivo**: Confirmar que pontos foram adicionados ao ranking

**Passos**:
1. Volte ao Dashboard da Equipe (`/team/dashboard`)
2. Procure pela seção **"🏆 Ranking em Tempo Real"**
3. Verifique sua posição e pontos

**Resultado Esperado**:
```
🏆 Ranking
1º - Equipe de Teste: 50 pontos (ou valor da quest)
```

**Verificações**:
- [ ] Sua equipe aparece no ranking
- [ ] Pontos mostram corretamente (50 ou conforme quest)
- [ ] Posição atualiza automaticamente

---

### Teste 1.5: Status de Deadline (Timeline)

**Objetivo**: Verificar que o contador regressivo funciona

**Passos**:
1. Volte para `/team/submit`
2. Procure pela seção **"SubmissionDeadlineStatus"**
3. Você deve ver um contador como:
   ```
   ✅ No Prazo
   Tempo restante: 29 minutos
   Após o prazo, você terá uma janela de 15 minutos adicionais
   com penalidades progressivas.
   ```

**Verificações**:
- [ ] Contador decrementa a cada segundo
- [ ] Mostra "No Prazo" enquanto dentro do deadline
- [ ] Explica a janela extra de 15 minutos
- [ ] Cores: Verde (no prazo) ou Amarelo (atrasado)

---

## 💡 FASE 2: Inovação

### Teste 2.1: Transição de Fase (Como Admin)

**Objetivo**: Iniciar Fase 2 quando Fase 1 termina

**Passos**:
1. Faça logout como Equipe
2. Faça login como Admin novamente
3. Acesse `/admin/control-panel`
4. Procure o card **"💡 Fase 2: Inovação"**
5. Clique no botão **"Ativar 💡"**
6. Confirme no popup

**Resultado Esperado**:
```
✅ Fase atualizada para: Fase 2: Inovação
✨ 1 quest(s) ativada(s) automaticamente!
```

**Verificações**:
- [ ] Fase 1 agora mostra status **"✓ Concluída"**
- [ ] Fase 2 mostra status **"✓ Fase Atual"**
- [ ] Admin permanece logado (não faz logout)
- [ ] Nenhuma mensagem de erro "sessão expirada"

---

### Teste 2.2: Validação de Bloqueio Sequencial

**Objetivo**: Confirmar que quest N+1 só aparece quando quest N foi entregue

**Passos**:
1. Ainda como Admin, verifique:
   - [ ] Quest 1 da Fase 1 é obrigatória (deve ter submissão)
   - [ ] Quest 2 da Fase 1 (se houver) permanece bloqueada sem submissão
   - [ ] Quest 1 da Fase 2 agora está desbloqueada

2. Como Equipe (`team-test-1@startcup.local`):
   - Acesse `/team/submit`
   - Você deve ver **APENAS** a Quest 1 da Fase 2

**Verificações**:
- [ ] Quest anterior concluída = nova quest aparece
- [ ] Quest anterior não concluída = nova quest bloqueada
- [ ] UI mostra claramente qual quest está ativa

**CSS Verification**:
- [ ] Quest bloqueada: Opacity reduzida, botão desabilitado
- [ ] Quest ativa: Cores vibrantes, botão clicável

---

### Teste 2.3: Segunda Submissão

**Objetivo**: Enviar segunda quest sem problemas

**Passos** (Como Equipe):
1. Acesse `/team/submit`
2. Preencha a Quest 1 da Fase 2 (novo tipo de entrega)
3. Clique **"🚀 Enviar Entrega"**
4. Confirme

**Resultado Esperado**:
```
✅ Entrega enviada com sucesso!
```

**Verificações**:
- [ ] Segunda submissão registra sem duplicação
- [ ] Ranking atualiza com novos pontos
- [ ] Histórico de submissões preservado

---

## 🛠️ FASE 3: Prototipagem

### Teste 3.1: Ativar Fase 3 (Como Admin)

**Procedimento padrão**:
1. Admin acessa `/admin/control-panel`
2. Clica em **"Ativar 🛠️"** para Fase 3
3. Confirma

**Resultado Esperado**:
```
✅ Fase atualizada para: Fase 3: Prototipagem
✨ 1 quest(s) ativada(s) automaticamente!
```

---

### Teste 3.2: Teste de Submissão Atrasada (Simulada)

**Objetivo**: Verificar que sistema calcula penalidades corretamente

**Passos**:
1. Como Admin, execute SQL para simular atraso:
   ```sql
   -- Simular que quest começou há 35 minutos (5 min atrasado)
   UPDATE quests
   SET started_at = NOW() - INTERVAL '35 minutes'
   WHERE order_index = 1
     AND phase_id IN (SELECT id FROM phases WHERE order_index = 3)
   LIMIT 1;

   -- Deadline de 30 minutos
   UPDATE quests
   SET planned_deadline_minutes = 30
   WHERE order_index = 1
     AND phase_id IN (SELECT id FROM phases WHERE order_index = 3)
   LIMIT 1;
   ```

2. Como Equipe, acesse `/team/submit`

3. Você deve ver:
   ```
   ⚠️ Atrasado
   Tempo excedido: 5 minutos
   Penalidade: -5 pontos
   ```

4. Preencha e envie o formulário

**Resultado Esperado**:
```
✅ Entrega enviada com sucesso!
(5 minutos atrasado) - Penalidade: -5pts
```

**Database Verification**:
```sql
SELECT
  is_late,
  late_minutes,
  points_deduction,
  penalty_applied
FROM submissions
WHERE quest_id = (SELECT id FROM quests
                  WHERE phase_id = (SELECT id FROM phases WHERE order_index = 3)
                  LIMIT 1)
ORDER BY submitted_at DESC
LIMIT 1;

-- Esperado: is_late=true, late_minutes=5, points_deduction=5, penalty_applied=true
```

---

### Teste 3.3: Verificar Penalidades no Ranking

**Passos**:
1. Como Equipe, acesse `/team/dashboard`
2. Procure pela seção **"🏆 Ranking"**
3. Sua equipe deve mostrar pontos com penalidade descontada

**Verificações**:
- [ ] Pontos = (50 + 50 + 50) - 5 = 145 pontos
- [ ] Ou conforme cálculo correto de penalidades

---

## 🎤 FASE 4: Pitch

### Teste 4.1-4.2: Procedimento Padrão

**Como Admin**:
1. Ativar Fase 4: Pitch
2. Confirmar ativação automática de quests

**Como Equipe**:
1. Ver nova quest
2. Submeter conforme tipo de entrega

**Resultado Esperado**:
- [ ] Fase 4 ativa
- [ ] Quests N+1 bloqueadas
- [ ] Submissão registra
- [ ] Pontos atualizam

---

## 🔄 FASE 5: Reflexão

### Teste 5.1-5.2: Procedimento Padrão

**Como Admin**:
1. Ativar Fase 5: Reflexão (última fase)
2. Confirmar ativação

**Como Equipe**:
1. Ver quest final
2. Submeter resposta de reflexão

**Resultado Esperado**:
- [ ] Fase 5 ativa
- [ ] Última quest disponível
- [ ] Submissão registra
- [ ] Ranking final atualizado

---

## ✅ FASE 6: Conclusão e Verificações Finais

### Teste 6.1: Bloquear Novas Submissões

**Objetivo**: Garantir que após conclusão, nenhuma submissão é aceita

**Passos**:
1. Como Admin, finalize o evento (set status = 'ended')
2. Como Equipe, tente acessar `/team/submit`

**Resultado Esperado**:
```
🛑 Evento Finalizado
O evento foi concluído. Nenhuma nova submissão é aceita.
```

---

### Teste 6.2: Ranking Final

**Objetivo**: Verificar placar final

**Passos**:
1. Como Admin, acesse `/admin/rankings`
2. Verifique ranking final completo
3. Confirme que pontos refletem:
   - Todas as 5 submissões
   - Penalidades aplicadas corretamente
   - Total = Σ(pontos_quest) - Σ(penalidades)

**Verificação do Cálculo**:
```
Equipe Teste:
- Quest 1 Fase 1: +50 (no prazo)
- Quest 1 Fase 2: +50 (no prazo)
- Quest 1 Fase 3: +50 - 5 (5min atrasado)
- Quest 1 Fase 4: +50 (no prazo)
- Quest 1 Fase 5: +50 (no prazo)
= Total: 245 pontos
```

---

## 🔐 Testes de Segurança e Confiabilidade

### Teste S1: Persistência de Sessão

**Objetivo**: Confirmar que refresh/navegação mantém autenticação

**Passos**:
1. Admin faz login
2. Atualiza página (`F5` ou `Ctrl+R`)
3. Navegação entre páginas:
   - `/admin/control-panel`
   - `/admin/rankings`
   - `/admin/evaluations`

**Resultado Esperado**:
- [ ] Permanece logado após refresh
- [ ] Nenhum redirect para login inesperado
- [ ] Sessão preservada entre navegações

---

### Teste S2: Múltiplas Abas

**Objetivo**: Testar comportamento com múltiplas abas do navegador

**Passos**:
1. Abra 2 abas: Aba A (Admin) e Aba B (Equipe)
2. Em Aba A: Ative Fase 2
3. Em Aba B (Equipe):
   - Volte para página de submissão
   - Verifique se mostra Fase 2 corretamente

**Resultado Esperado**:
- [ ] Ambas as abas mantêm suas sessões
- [ ] Logout em uma aba não afeta a outra
- [ ] Dados atualizam corretamente em ambas

---

### Teste S3: Erro 401/403 Handling

**Objetivo**: Testar tratamento de sessão expirada

**Passos**:
1. Admin faz login
2. (Simule expiração de token):
   - Abra DevTools (F12)
   - Storage → Cookies → Delete session cookies
3. Tente realizar ação que requer auth:
   - Clique em "Ativar Fase"

**Resultado Esperado**:
```
⚠️ Sua sessão expirou. Redirecionando para login...
```

- [ ] Redirecionamento ocorre gracefully
- [ ] Nenhum erro de JavaScript
- [ ] Página de login carrega corretamente

---

## 📊 Verificações de Banco de Dados

### Verificação SQL 1: Submissões Completas

```sql
SELECT
  COUNT(*) as total_submissions,
  COUNT(CASE WHEN is_late = false THEN 1 END) as on_time,
  COUNT(CASE WHEN is_late = true THEN 1 END) as late,
  SUM(COALESCE(points_deduction, 0)) as total_penalties
FROM submissions;

-- Esperado para teste com 1 equipe × 5 quests:
-- total_submissions: 5
-- on_time: 4 (ou conforme teste)
-- late: 1 (ou conforme teste)
-- total_penalties: 5 (ou conforme penalidades simuladas)
```

### Verificação SQL 2: Quests Ativadas

```sql
SELECT
  COUNT(*) as total_quests,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_quests,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_quests
FROM quests;

-- Esperado: 5 quests, 1 ativa (última), 4 completadas
```

### Verificação SQL 3: Ranking Correto

```sql
SELECT
  teams.name,
  COALESCE(SUM(CASE WHEN s.is_late = false THEN q.max_points ELSE 0 END), 0) as on_time_points,
  COALESCE(SUM(CASE WHEN s.is_late = true THEN q.max_points ELSE 0 END), 0) as late_points,
  COALESCE(SUM(COALESCE(s.points_deduction, 0)), 0) as total_penalties,
  COALESCE(SUM(q.max_points), 0) - COALESCE(SUM(s.points_deduction), 0) as final_score
FROM teams
LEFT JOIN submissions s ON teams.id = s.team_id
LEFT JOIN quests q ON s.quest_id = q.id
GROUP BY teams.id, teams.name
ORDER BY final_score DESC;

-- Esperado: Equipe Teste com ~245 pontos (conforme cálculo acima)
```

---

## 🎨 Verificações de UI/UX

### Verificação UI 1: Responsividade QuestCard

**Testa em diferentes breakpoints**:

1. **Mobile (320px)**:
   ```
   ✅ Elementos empilhados verticalmente
   ✅ Texto legível (não truncado)
   ✅ Padding adequado: 12px (p-3)
   ✅ Emojis visíveis
   ```

2. **Tablet (768px)**:
   ```
   ✅ Layout misto (alguns elementos lado-a-lado)
   ✅ Padding maior: 16px (md:p-4)
   ✅ Spacing generoso: md:space-y-4
   ✅ Título em md:text-lg
   ```

3. **Desktop (1024px)**:
   ```
   ✅ Classe md: ativada
   ✅ Header flex-row (lado-a-lado)
   ✅ Pontos em box separado
   ✅ Máximo de espaço utilizado
   ```

### Verificação UI 2: Cores e Contraste

**Usar DevTools ou WAVE extension**:
- [ ] Texto azul: `text-[#00E5FF]` contraste OK
- [ ] Pontos verdes: `text-[#00FF88]` contraste OK
- [ ] Fundo escuro: `from-[#0A1E47]/60` suficiente contraste
- [ ] WCAG AA: Passou em teste de contraste

### Verificação UI 3: Transições Suaves

- [ ] Hover effects em badges: `transition` ativado
- [ ] Mudança de cor ao fazer hover
- [ ] Sem efeitos jarring

---

## 📝 Resultado Final

### Checklist de Sucesso

- [ ] Fase 0: Sistema resetado sem problemas de auth
- [ ] Fase 1: Quest ativa, submissão registra, ranking atualiza
- [ ] Fase 2: Transição suave, nova quest aparece, validação sequencial OK
- [ ] Fase 3: Submissão atrasada simula corretamente, penalidade de 5pts aplicada
- [ ] Fase 4: Procedimento padrão funcionando
- [ ] Fase 5: Última fase ativa, submissão final registra
- [ ] Conclusão: Ranking final correto, cálculos de penalidades OK
- [ ] Segurança: Sessão persiste, refresh não faz logout, 401/403 handled
- [ ] UI: Responsividade OK, cores OK, espaçamento OK
- [ ] Database: Todas as submissões registradas, penalidades corretas

### Score Geral

**Se todos os itens estiverem marcados**:
```
🎉 FLUXO COMPLETO APROVADO!

Status: PRODUCTION READY ✅
Confiabilidade: 100%
UI/UX: Aprovado
Segurança: Aprovada
```

---

## 📞 Suporte e Troubleshooting

### Problema: "Sessão expirada" ao resetar

**Solução**: Verificar `src/lib/supabase/client.ts` - listeners devem estar configurados

```typescript
if (!listenerRegistered) {
  listenerRegistered = true
  clientInstance.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') console.log('✅ Token refreshed')
  })
}
```

### Problema: Penalidades não aplicam

**Solução**: Verificar `add-late-submission-system.sql` - funções PL/pgSQL devem estar ativas

```sql
-- Verificar função
SELECT * FROM pg_proc WHERE proname = 'apply_late_penalty';
```

### Problema: Quest N+1 aparece bloqueada

**Solução**: Verificar RLS policies em `quests` table

```sql
-- Verificar policy
SELECT * FROM pg_policies WHERE tablename = 'quests';
```

---

## 📚 Documentação Relacionada

- [HOW_TO_TEST_SYSTEM.md](./HOW_TO_TEST_SYSTEM.md) - Guia de testes rápidos
- [AUTH_SESSION_ISSUES_REPORT.md](./AUTH_SESSION_ISSUES_REPORT.md) - Detalhes de auth
- [LATE_SUBMISSION_SYSTEM.md](./LATE_SUBMISSION_SYSTEM.md) - Sistema de atrasos
- [add-late-submission-system.sql](./add-late-submission-system.sql) - SQL das penalidades

---

**Gerado em**: 2 de Novembro de 2025
**Status**: Pronto para Testes Manuais
**Próximo Passo**: Executar testes conforme checklist acima
