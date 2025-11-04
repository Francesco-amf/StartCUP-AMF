# 🤖 SISTEMA TOTALMENTE AUTOMÁTICO - Guia Completo

## 🎯 Objetivo

Você **inicia apenas a Fase 1** e depois tudo funciona **automaticamente**:
- ✅ Quests avançam sozinhas (Quest 1.1 → 1.2 → 1.3 → BOSS)
- ✅ Fases avançam sozinhas (Fase 1 → 2 → 3 → 4 → 5)
- ✅ Primeira quest de cada nova fase inicia automaticamente

---

## 📋 Componentes do Sistema

### **1. Auto-Start Next Quest** (NOVO)
- **Arquivo:** `auto-start-next-quest.sql`
- **Frequência:** A cada 1 minuto
- **Função:** Inicia próxima quest quando atual termina (expira ou submete)
- **Job:** `auto-start-next-quest-job`

### **2. Auto-Advance Phase** (JÁ INSTALADO)
- **Arquivo:** `auto-advance-phase-FIXED.sql`
- **Frequência:** A cada 1 minuto
- **Função:** Avança fase quando todas as quests terminam
- **Job:** `auto-advance-phase-job`

---

## 🚀 Instalação Completa

### **PASSO 1: Certifique-se que já fez:**

✅ Executou `RESET_EVENT_TO_START.sql` (resetou para Fase 1, Quest 1.1 ativa)  
✅ Executou `auto-advance-phase-FIXED.sql` (instalou auto-advance de fases)  
✅ Agendou cron do auto-advance: `SELECT cron.schedule(...)`

### **PASSO 2: Instalar Auto-Start de Quests**

Execute no **Supabase SQL Editor**:

```sql
-- Cole TUDO do arquivo auto-start-next-quest.sql e execute
```

**Resultado esperado:**
```
schedule
--------
3
```

Isso significa que o **Job 3** foi criado (auto-start-next-quest-job).

### **PASSO 3: Verificar Jobs Ativos**

```sql
SELECT 
  jobid,
  jobname, 
  schedule, 
  active
FROM cron.job 
WHERE jobname IN ('auto-advance-phase-job', 'auto-start-next-quest-job')
ORDER BY jobname;
```

**Deve mostrar:**
| jobid | jobname | schedule | active |
|-------|---------|----------|--------|
| 2 | auto-advance-phase-job | * * * * * | t |
| 3 | auto-start-next-quest-job | * * * * * | t |

---

## 🎬 Fluxo Completo Automático

### **Você Faz APENAS:**
```sql
-- Iniciar a Fase 1, Quest 1.1
UPDATE quests 
SET started_at = NOW(), status = 'active'
WHERE id = (
  SELECT q.id 
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 1 AND q.order_index = 1
  LIMIT 1
);
```

### **Sistema Faz TUDO Automaticamente:**

```
┌─────────────────────────────────────────────────┐
│ T+0min: Quest 1.1 iniciada (VOCÊ)               │
│ Prazo: 60 minutos + 15 atraso = 75 min total   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ T+75min: Quest 1.1 expira                       │
│ ✅ auto-start-next-quest executa (próximo min) │
│ → Inicia Quest 1.2 automaticamente              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ T+76min: Quest 1.2 iniciada                     │
│ Prazo: 50 minutos + 15 atraso = 65 min total   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ T+141min: Quest 1.2 expira                      │
│ ✅ auto-start-next-quest executa                │
│ → Inicia Quest 1.3 automaticamente              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ T+142min: Quest 1.3 iniciada                    │
│ Prazo: 30 minutos + 15 atraso = 45 min total   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ T+187min: Quest 1.3 expira                      │
│ ✅ auto-start-next-quest executa                │
│ → Inicia BOSS 1 automaticamente                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ T+188min: BOSS 1 iniciada                       │
│ Prazo: 10 minutos (sem atraso) = 10 min total  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ T+198min: BOSS 1 expira                         │
│ ✅ auto-start-next-quest tenta próxima          │
│ → Não existe Quest 1.5, para de tentar         │
│ ✅ auto-advance-phase executa                   │
│ → Todas 4 quests finalizadas (4/4 expiradas)   │
│ → Avança para Fase 2                            │
│ → Inicia Quest 2.1 automaticamente              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ T+199min: Fase 2, Quest 2.1 iniciada            │
│ → Ciclo repete até Fase 5                      │
└─────────────────────────────────────────────────┘
```

---

## 🧪 Teste Rápido (Sem Esperar Horas)

### **Forçar Quests a Expirar Rápido:**

```sql
-- Forçar Quest 1.1 a expirar em 2 minutos
UPDATE quests 
SET planned_deadline_minutes = 1,
    late_submission_window_minutes = 1
WHERE id = (
  SELECT q.id FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 1 AND q.order_index = 1
  LIMIT 1
);

-- Aguardar 3 minutos
-- Quest 1.2 deve iniciar automaticamente
```

### **Verificar Automação:**

A cada minuto, execute:
```sql
SELECT 
  p.order_index as fase,
  q.order_index as quest,
  q.name,
  q.started_at,
  CASE 
    WHEN q.started_at IS NULL THEN '❌ NÃO INICIADA'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute') + (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')) THEN '🔴 EXPIRADA'
    ELSE '✅ ATIVA'
  END as status
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;
```

**Deve ver:**
```
Minuto 0: Quest 1.1 ATIVA
Minuto 3: Quest 1.1 EXPIRADA, Quest 1.2 ATIVA
Minuto 6: Quest 1.2 EXPIRADA, Quest 1.3 ATIVA
...
```

---

## 📊 Monitoramento em Tempo Real

### **Ver Logs dos Crons:**

```sql
-- Ver mensagens do auto-start
DO $$ BEGIN PERFORM auto_start_next_quest(); END $$;

-- Ver mensagens do auto-advance
DO $$ BEGIN PERFORM auto_advance_phase(); END $$;
```

### **Dashboard Simples:**

```sql
SELECT 
  ec.current_phase as fase_atual,
  (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id 
   WHERE p.order_index = ec.current_phase AND q.started_at IS NOT NULL) as quests_iniciadas,
  (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id 
   WHERE p.order_index = ec.current_phase) as quests_total,
  ec.updated_at as ultima_mudanca
FROM event_config ec;
```

---

## 🛑 Parar/Reiniciar Sistema

### **Parar Tudo:**
```sql
SELECT cron.unschedule('auto-advance-phase-job');
SELECT cron.unschedule('auto-start-next-quest-job');
```

### **Reativar:**
```sql
-- Auto-advance de fases
SELECT cron.schedule(
  'auto-advance-phase-job',
  '* * * * *',
  $$ SELECT auto_advance_phase(); $$
);

-- Auto-start de quests
SELECT cron.schedule(
  'auto-start-next-quest-job',
  '* * * * *',
  $$ SELECT auto_start_next_quest(); $$
);
```

---

## ⚠️ Cenários Especiais

### **E se Equipe Submeter Antes de Expirar?**

**Exemplo:** Equipe submete Quest 1.1 aos 30 minutos (antes dos 75 de prazo total)

```
✅ auto-start-next-quest detecta submissão
✅ Inicia Quest 1.2 no próximo minuto
✅ Quest 1.1 não precisa expirar para avançar
```

### **E se Admin Pausar Evento?**

**Opção:** Adicionar flag `event_paused` em `event_config`

```sql
-- Modificar funções para checar:
IF (SELECT event_paused FROM event_config LIMIT 1) THEN
  RETURN; -- Não fazer nada se pausado
END IF;
```

---

## ✅ Checklist Final

- [ ] Executei `RESET_EVENT_TO_START.sql`
- [ ] Executei `auto-advance-phase-FIXED.sql`
- [ ] Agendei cron: `auto-advance-phase-job`
- [ ] Executei `auto-start-next-quest.sql`
- [ ] Agendei cron: `auto-start-next-quest-job`
- [ ] Verifiquei 2 jobs ativos no `cron.job`
- [ ] Testei: Quest 1.1 ativa → aguardar 1-3 min → Quest 1.2 inicia

---

## 🎉 Pronto!

Agora você tem um sistema **100% automático**:

1. **Inicie Fase 1, Quest 1.1** (comando SQL único)
2. **Aguarde e observe** o sistema rodar sozinho
3. **Equipes podem submeter** a qualquer momento
4. **Fases avançam automaticamente** até Fase 5

**Duração total estimada (se nada for submetido):**
- Fase 1: 105 minutos (60+50+30+10 + atrasos)
- Fase 2: 225 minutos
- Fase 3: 165 minutos
- Fase 4: 125 minutos
- Fase 5: 105 minutos
- **TOTAL: ~12-14 horas** (variação por atrasos/submissões)

🚀 **Boa sorte no evento!**
