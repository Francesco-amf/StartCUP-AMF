# ✅ Verificação Completa: Avanço Automático de Fases (1-5)

## 🎯 Sistema de Avanço Automático

### Status: ✅ TOTALMENTE FUNCIONAL

O sistema está configurado para avançar automaticamente pelas **5 fases** quando:
1. Todas as quests de uma fase expirarem (prazo + 15min atraso)
2. OU todas as quests forem submetidas

**Execução:** A cada 1 minuto via `pg_cron`

---

## 📊 Estrutura de Fases e Quests

### Fase 1: Descoberta (4 quests)
- ✅ Quest 1.1: Conhecendo o Terreno (60 min, 100 pts)
- ✅ Quest 1.2: A Persona Secreta (50 min, 50 pts)
- ✅ Quest 1.3: Construindo Pontes (30 min, 50 pts)
- ✅ **BOSS 1**: Defesa do Problema (10 min, 100 pts) - `presentation`

### Fase 2: Ideia (4 quests)
- ✅ Quest 2.1: A Grande Ideia (50 min, 100 pts)
- ✅ Quest 2.2: Identidade Secreta (30 min, 50 pts)
- ✅ Quest 2.3: Prova de Conceito (120 min, 150 pts)
- ✅ **BOSS 2**: Demo do Protótipo (10 min, 100 pts) - `presentation`

### Fase 3: Execução (4 quests)
- ✅ Quest 3.1: Montando o Exército (40 min, 50 pts)
- ✅ Quest 3.2: Aliados Estratégicos (30 min, 50 pts)
- ✅ Quest 3.3: Show Me The Money (70 min, 100 pts)
- ✅ **BOSS 3**: Modelo de Negócio (10 min, 100 pts) - `presentation`

### Fase 4: Validação (4 quests)
- ✅ Quest 4.1: Teste de Fogo (40 min, 50 pts)
- ✅ Quest 4.2: Validação de Mercado (40 min, 50 pts)
- ✅ Quest 4.3: Números que Convencem (30 min, 50 pts)
- ✅ **BOSS 4**: Pitch Sob Pressão (10 min, 100 pts) - `presentation`

### Fase 5: Apresentação (4 quests)
- ✅ Quest 5.1: A História Épica (20 min, 75 pts)
- ✅ Quest 5.2: Slides de Impacto (40 min, 50 pts)
- ✅ Quest 5.3: Ensaio Geral (30 min, 25 pts)
- ✅ **BOSS FINAL**: Pitch Oficial (10 min, 200 pts) - `presentation`

---

## 🔧 Componentes Integrados

### 1. Banco de Dados ✅

**Tabelas:**
- `event_config`: Contém `current_phase` (avançado automaticamente)
- `phases`: 5 fases com `order_index` (1-5)
- `quests`: 20 quests totais (4 por fase, incluindo BOSS)
- `boss_battles`: Avaliações das apresentações BOSS

**Função SQL:**
- `auto_advance_phase()`: Verifica e avança fases automaticamente
- Executa via `pg_cron` a cada 1 minuto

**Script de Criação:**
- `CREATE_BOSS_QUESTS.sql`: Cria as 5 BOSS quests
- `auto-advance-phase.sql`: Sistema de avanço automático

### 2. Live Dashboard ✅

**Arquivo:** `src/components/dashboard/CurrentQuestTimer.tsx`

**Funcionalidades:**
- ✅ Detecta BOSS quests por `deliverable_type: 'presentation'`
- ✅ Mostra badge especial "🔥 BOSS" para quests de apresentação
- ✅ Timer individual por quest (usando `duration_minutes`)
- ✅ Fallback para todas as 5 fases caso DB não tenha dados
- ✅ Progride automaticamente entre quests da mesma fase
- ✅ Atualiza quando `event_config.current_phase` muda

**Estilos BOSS:**
```tsx
// BOSS quests têm visual diferenciado:
- bg-gradient-to-r from-[#5A0A0A] to-[#3A0A0A]
- border-4 border-[#FF6B6B]
- Badge "🔥 BOSS" pulsante
```

### 3. Página de Submissão ✅

**Arquivo:** `src/components/forms/SubmissionWrapper.tsx`

**Funcionalidades:**
- ✅ Detecta BOSS quests via `deliverable_type.includes('presentation')` OU `order_index === 4`
- ✅ Renderiza `BossQuestCard` ao invés de `SubmissionForm` para BOSS
- ✅ Não permite upload digital para BOSS (apenas apresentação presencial)
- ✅ Mostra banner "🏁 Todas as quests finalizadas" quando fase expira
- ✅ Auto-atualiza quando `current_phase` muda (via `router.refresh()`)

**Arquivo:** `src/app/(team)/submit/page.tsx`

**Filtragem:**
```tsx
// Busca quests da fase atual
const questsInCurrentPhase = quests.filter(
  q => q.phase?.order_index === eventConfig?.current_phase
)
```

### 4. BOSS Quest Card ✅

**Arquivo:** `src/components/quest/BossQuestCard.tsx`

**Características:**
- Card especial para apresentações presenciais
- Sem formulário de upload
- Visual temático vermelho/dourado
- Mostra horário e duração da apresentação

---

## 🔄 Fluxo Completo de Avanço

### Exemplo: Fase 1 → Fase 2

```
1. Equipes trabalham em Quest 1.1, 1.2, 1.3
2. Quest 1.1: Submetida ✅
3. Quest 1.2: Expirou (20:01:42 + 50min + 15min = 21:06:42) ❌
4. Quest 1.3: Expirou (20:01:53 + 30min + 15min = 20:46:53) ❌
5. BOSS 1: Expirou (20:02:05 + 10min + 0min = 20:12:05) ❌

🤖 Função auto_advance_phase() verifica (a cada 1 min):
   - Fase 1: 4 quests totais
   - Expiradas: 3 quests
   - Submetidas: 1 quest
   - Total finalizado: 3 + 1 = 4 ✅

🎉 Condição atendida → Avança event_config.current_phase = 2

✅ Página de submissão agora mostra Quest 2.1
✅ Live dashboard mostra Quest 2.1
```

### Timeline Completa do Evento

```
Fase 1 (150 min) → Quest 1.1 (60) + Quest 1.2 (50) + Quest 1.3 (30) + BOSS 1 (10)
Fase 2 (210 min) → Quest 2.1 (50) + Quest 2.2 (30) + Quest 2.3 (120) + BOSS 2 (10)
Fase 3 (150 min) → Quest 3.1 (40) + Quest 3.2 (30) + Quest 3.3 (70) + BOSS 3 (10)
Fase 4 (120 min) → Quest 4.1 (40) + Quest 4.2 (40) + Quest 4.3 (30) + BOSS 4 (10)
Fase 5 (100 min) → Quest 5.1 (20) + Quest 5.2 (40) + Quest 5.3 (30) + BOSS 5 (10)

Total: 730 minutos = 12h10min
```

---

## ✅ Checklist de Integração

### Banco de Dados
- [x] `pg_cron` habilitado no schema `public`
- [x] Função `auto_advance_phase()` criada
- [x] Job `auto-advance-phase-job` agendado (1 min)
- [x] 5 fases na tabela `phases` (order_index 1-5)
- [x] 20 quests na tabela `quests` (4 por fase)
- [x] 5 BOSS quests com `deliverable_type = ['presentation']`

### Frontend - Live Dashboard
- [x] `CurrentQuestTimer.tsx` suporta todas as 5 fases
- [x] Fallback data para fases 1-5
- [x] Detecta BOSS por `deliverable_type: 'presentation'`
- [x] Visual especial para BOSS (vermelho/dourado)
- [x] Timer individual por quest (`duration_minutes`)
- [x] Auto-progride entre quests da mesma fase

### Frontend - Submissão
- [x] `SubmissionWrapper.tsx` detecta BOSS
- [x] `BossQuestCard.tsx` renderiza apresentações
- [x] Filtra quests por `event_config.current_phase`
- [x] Banner "🏁 Todas as quests finalizadas"
- [x] Auto-refresh quando fase muda

### Sistema de Pontuação
- [x] BOSS 1-4: 100 pontos cada
- [x] BOSS FINAL (Fase 5): 200 pontos
- [x] Tabela `boss_battles` para avaliações
- [x] View `live_ranking` inclui `boss_points`

---

## 🧪 Como Testar

### 1. Verificar avanço automático
```sql
-- Verificar fase atual
SELECT current_phase, updated_at FROM event_config;

-- Ver jobs agendados
SELECT * FROM cron.job;

-- Executar manualmente (teste)
SELECT auto_advance_phase();
```

### 2. Verificar quests no DB
```sql
-- Ver todas as quests por fase
SELECT 
  p.order_index as fase,
  q.order_index as quest_num,
  q.name,
  q.deliverable_type,
  q.planned_deadline_minutes,
  q.max_points
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;
```

### 3. Verificar BOSS quests
```sql
-- Apenas BOSS quests (order_index = 4 OU deliverable_type = presentation)
SELECT 
  p.order_index as fase,
  q.name,
  q.deliverable_type,
  q.max_points
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.order_index = 4 
   OR 'presentation' = ANY(q.deliverable_type)
ORDER BY p.order_index;
```

### 4. Testar na aplicação
1. Abra http://localhost:3000/submit (página de submissão)
2. Abra http://localhost:3000/live (live dashboard)
3. Verifique que ambas mostram a fase atual
4. Aguarde 1 minuto após todas as quests expirarem
5. Recarregue (F5) → Deve mostrar próxima fase

---

## 🚨 Troubleshooting

### Fase não avança automaticamente
```sql
-- Verificar se job está ativo
SELECT * FROM cron.job WHERE jobname = 'auto-advance-phase-job';

-- Se não houver resultado, reagendar:
SELECT cron.schedule(
  'auto-advance-phase-job',
  '* * * * *',
  $$ SELECT auto_advance_phase(); $$
);
```

### BOSS quest não aparece com visual especial
- Verificar se `deliverable_type` contém `'presentation'`
- OU se `order_index = 4`
- Conferir console do browser (F12) para logs

### Página mostra fase errada
```sql
-- Forçar atualização para próxima fase
UPDATE event_config 
SET current_phase = current_phase + 1
WHERE current_phase < 5;
```

---

## 📝 Resumo Final

✅ **Sistema 100% Integrado:**
- 5 fases configuradas
- 20 quests (4 por fase, incluindo 1 BOSS)
- Avanço automático via pg_cron
- Live dashboard suporta todas as fases
- Página de submissão filtra por fase atual
- BOSS quests têm visual especial

✅ **Tudo pronto para produção!**

O evento pode rodar do início ao fim sem intervenção manual. As fases avançarão automaticamente conforme os prazos expirarem.
