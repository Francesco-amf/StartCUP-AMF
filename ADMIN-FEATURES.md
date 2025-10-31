# 🎮 StartCup AMF - Funcionalidades do Painel Admin

## ✅ Implementado e Funcional

### 1. Sistema de Controle de Fases ⭐
**Localização:** [/control-panel](src/app/(admin)/control-panel/page.tsx)

**Funcionalidades:**
- ✅ 6 fases gerenciáveis (Preparação + 5 fases do evento)
- ✅ Botões para iniciar cada fase
- ✅ Registro automático de timestamps de cada fase
- ✅ Estado do evento (Aguardando/Em Andamento/Encerrado)
- ✅ Fase atual visível para equipes em tempo real

**Fases Disponíveis:**
1. **Preparação** (⏸️) - Estado inicial
2. **Fase 1: Descoberta** (🔍) - 2h30min - 200 pontos
3. **Fase 2: Criação** (💡) - 3h30min - 300 pontos
4. **Fase 3: Estratégia** (📊) - 2h30min - 200 pontos
5. **Fase 4: Refinamento** (✨) - 2h - 150 pontos
6. **Fase 5: Pitch Final** (🎯) - 1h30min - 150 pontos

**Como Usar:**
1. Acesse `/control-panel` como admin
2. Vá até a seção "Controle de Fases do Evento"
3. Clique no botão da fase desejada
4. Confirme no modal
5. As equipes verão a fase atual atualizada automaticamente

---

### 2. Sistema de Reset Completo 🔥
**Localização:** [/control-panel](src/app/(admin)/control-panel/page.tsx) - Seção "Zona de Perigo"

**Funcionalidades:**
- ✅ Reset de todas as avaliações
- ✅ Reset de todas as submissões
- ✅ Reset de pontuações das equipes
- ✅ Confirmação de segurança (requer digitar "RESETAR TUDO")
- ✅ Multiple camadas de validação (frontend + backend + role check)

**Segurança:**
- Requer role de admin
- Validação de texto de confirmação
- Modal com avisos em vermelho
- Logs detalhados no servidor

---

### 3. Dashboard do Admin - Estatísticas em Tempo Real 📊
**Localização:** [/control-panel](src/app/(admin)/control-panel/page.tsx)

**Métricas Exibidas:**
- ✅ Total de equipes cadastradas
- ✅ Total de avaliadores
- ✅ Total de submissões
- ✅ Total de avaliações realizadas
- ✅ Fase atual do evento
- ✅ Status do evento (Aguardando/Em Andamento/Encerrado)

---

### 4. Visualização para Equipes 👥
**Localização:** [/dashboard](src/app/(team)/dashboard/page.tsx)

**Funcionalidades:**
- ✅ Card destacado mostrando fase atual do evento
- ✅ Badge de status (🔥 Em Andamento / ⏸️ Aguardando / 🏁 Encerrado)
- ✅ Atualização em tempo real ao recarregar página
- ✅ Design responsivo e colorido

---

## 📦 Estrutura do Banco de Dados

### Novas Tabelas Criadas

#### `event_config`
Gerencia o estado atual do evento:
- `current_phase` - Fase atual (0-5)
- `event_started` - Evento iniciado?
- `event_ended` - Evento encerrado?
- `phase_1_start_time` até `phase_5_start_time` - Timestamps de cada fase
- `event_start_time` - Quando o evento começou
- `event_end_time` - Quando o evento terminou

#### `power_ups` (estrutura criada, aguardando implementação UI)
Registra power-ups usados pelas equipes:
- `team_id` - Equipe que usou
- `power_up_type` - Tipo (mentoria/dica/validacao/checkpoint)
- `phase_used` - Em qual fase foi usado
- `mentor_id` - Mentor envolvido (se aplicável)
- `notes` - Observações

#### `achievements` (estrutura criada, aguardando implementação UI)
Achievements especiais das equipes:
- `team_id` - Equipe que conquistou
- `achievement_type` - Tipo (coruja/perfeccionista/velocista/inovador/team_player/visionario)
- `bonus_points` - Pontos bônus
- `awarded_at` - Quando foi conquistado

#### `boss_battles` (estrutura criada, aguardando implementação UI)
Avaliações dos BOSS de cada fase:
- `team_id` - Equipe avaliada
- `phase` - Qual fase (1-5)
- `evaluator_id` - Avaliador responsável
- `points` - Pontos (0-100 para fases 1-4, 0-200 para fase 5)
- `comments` - Feedback do jurado

#### `final_pitch` (estrutura criada, aguardando implementação UI)
Avaliação do pitch final (ÚLTIMO CHEFÃO):
- `team_id` - Equipe
- `evaluator_id` - Jurado
- `points` - Pontuação total (0-200)
- `viability_score` - Viabilidade (30%)
- `innovation_score` - Inovação (20%)
- `pitch_quality_score` - Qualidade do pitch (10%)

#### `penalties` (estrutura criada, aguardando implementação UI)
Penalidades aplicadas:
- `team_id` - Equipe penalizada
- `penalty_type` - Tipo (plagio/desorganizacao/desrespeito/ausencia/atraso)
- `points_deducted` - Pontos deduzidos
- `applied_by` - Admin que aplicou

#### VIEW `team_stats`
Estatísticas completas de cada equipe:
- Pontos de quests
- Pontos de BOSS battles
- Pontos do pitch final
- Pontos de achievements
- Penalidades
- **Total de pontos** (cálculo automático)
- Submissões completadas
- BOSS battles completados
- Power-ups usados

---

## 🚀 Scripts SQL Disponíveis

### 1. `setup-event-management.sql` ⭐ **EXECUTAR PRIMEIRO**
Cria todas as tabelas necessárias para o gerenciamento do evento.

**O que faz:**
- Cria todas as novas tabelas
- Configura índices para performance
- Cria view `team_stats` para ranking
- Configura políticas RLS (Row Level Security)
- Insere configuração padrão do evento

**Como executar:**
1. Abra Supabase Dashboard
2. SQL Editor > New Query
3. Cole o conteúdo do arquivo
4. Run

### 2. `fix-evaluations-rls.sql`
Corrige políticas RLS da tabela `evaluations` (já executado).

### 3. `reset-system.sql`
Reset manual via SQL (alternativa ao botão no painel).

### 4. `create-live-ranking-view.sql`
View para ranking ao vivo (já executado).

---

## 📋 Checklist de Setup

### Antes do Evento:

- [x] 1. Executar `setup-event-management.sql` no Supabase
- [ ] 2. Verificar se todas as quests estão cadastradas
- [ ] 3. Cadastrar todas as equipes
- [ ] 4. Cadastrar todos os avaliadores
- [ ] 5. Testar login de admin
- [ ] 6. Verificar se o ranking ao vivo está funcionando (`/live-dashboard`)
- [ ] 7. Testar controle de fases (iniciar e voltar)

### Durante o Evento:

1. **Iniciar Evento**
   - Acesse `/control-panel`
   - Clique em "Iniciar 🔍" na Fase 1: Descoberta
   - Confirme no modal

2. **Avançar de Fase**
   - Quando uma fase terminar, clique no botão da próxima fase
   - O sistema registra automaticamente os timestamps

3. **Monitorar Progresso**
   - Veja estatísticas em tempo real no painel admin
   - Acesse `/live-dashboard` para ranking ao vivo
   - As equipes veem a fase atual em seus dashboards

4. **Encerrar Evento**
   - Após o pitch final, clique em "Preparação"
   - Isso marca o evento como encerrado

### Depois do Evento:

- [ ] 1. Exportar rankings finais
- [ ] 2. Revisar todas as avaliações
- [ ] 3. Calcular premiações
- [ ] 4. (Opcional) Resetar sistema para próximo evento

---

## 🎯 Próximas Funcionalidades (Não Implementadas Ainda)

### Alta Prioridade:
1. **UI para BOSS Battles** 🎮
   - Formulário para avaliadores inserirem pontuação dos pitches de cada fase
   - Listagem de BOSS battles realizadas

2. **Gestão de Power-Ups** ⚡
   - Interface para registrar uso de power-ups
   - Limite de 4 por equipe, 1 por fase
   - Seleção de mentor (se for mentoria)

3. **Sistema de Achievements** 🏅
   - Atribuir achievements às equipes
   - Visualização de achievements conquistados
   - Cálculo automático de alguns (ex: Velocista, Perfeccionista)

4. **Sistema de Penalidades** ⚠️
   - Interface para aplicar penalidades
   - Tipos: plágio, desorganização, desrespeito, ausência, atraso
   - Dedução automática de pontos

### Média Prioridade:
5. **Pitch Final** 🎯
   - Formulário especial para avaliação do pitch final
   - 3 critérios: Viabilidade (30%), Inovação (20%), Qualidade do Pitch (10%)
   - Pontuação de 0-200

6. **Exportação de Relatórios** 📊
   - Exportar ranking em PDF/Excel
   - Relatório completo de cada equipe
   - Histórico de todas as avaliações

7. **Cronômetro em Tempo Real** ⏱️
   - Mostrar tempo restante da fase atual
   - Alertas quando falta pouco tempo
   - Countdown visual

### Baixa Prioridade:
8. **Notificações** 🔔
   - Notificar equipes quando fase mudar
   - Alertar avaliadores sobre novas submissões
   - Email/push notifications

9. **Analytics** 📈
   - Gráficos de progresso das equipes
   - Comparação entre cursos
   - Estatísticas de uso de power-ups

10. **Histórico** 📜
   - Log de todas as ações do admin
   - Histórico de mudanças de fase
   - Auditoria completa

---

## 🔐 Segurança

### Políticas RLS Configuradas:
- ✅ `event_config` - Todos podem ver, apenas admin pode atualizar
- ✅ `power_ups` - Todos podem ver, admin pode inserir
- ✅ `achievements` - Todos podem ver, admin pode inserir
- ✅ `boss_battles` - Todos podem ver, avaliadores podem inserir/atualizar
- ✅ `final_pitch` - Todos podem ver, avaliadores podem inserir
- ✅ `penalties` - Todos podem ver, admin pode inserir

### Verificações de Permissão:
- ✅ API `/api/admin/start-phase` - Requer role admin
- ✅ API `/api/admin/reset` - Requer role admin + confirmação textual
- ✅ Página `/control-panel` - Redirect se não for admin

---

## 🐛 Troubleshooting

### Problema: "Erro ao iniciar fase"
**Solução:** Verificar se o script `setup-event-management.sql` foi executado.

### Problema: "event_config não encontrado"
**Solução:**
```sql
INSERT INTO event_config (id, event_name, current_phase, event_started)
VALUES ('00000000-0000-0000-0000-000000000001', 'StartCup AMF 2025', 0, FALSE);
```

### Problema: Equipes não veem fase atualizada
**Solução:** Pedir para equipes recarregarem a página (F5).

### Problema: Reset não funciona
**Solução:** Verificar se políticas RLS de `evaluations` foram corrigidas (`fix-evaluations-rls.sql`).

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar este documento primeiro
2. Revisar logs do console (F12 no navegador)
3. Verificar logs do servidor Next.js
4. Checar Supabase Dashboard para erros de banco de dados

---

## 🎉 Resumo

### ✅ Pronto para Uso:
- Controle de fases do evento
- Reset completo do sistema
- Dashboard admin com estatísticas
- Visualização de fase atual para equipes
- Estrutura de banco de dados completa

### 🚧 Estrutura Criada (Aguardando UI):
- Power-ups
- Achievements
- BOSS Battles
- Pitch Final
- Penalidades
- View de estatísticas completas (`team_stats`)

### 📊 Sistema de Pontuação Implementado:
O cálculo final de pontos está na view `team_stats`:
```
TOTAL = quest_points + boss_points + final_pitch_points + achievement_points - penalty_points
```

Onde:
- **quest_points** = Soma dos pontos das quests avaliadas (40% da nota final)
- **boss_points** = Soma dos BOSS battles (até 500 pontos no total)
- **final_pitch_points** = Pontos do pitch final (0-200)
- **achievement_points** = Bônus de achievements
- **penalty_points** = Penalidades aplicadas

---

**Status:** Sistema base funcional e pronto para o evento! 🚀
