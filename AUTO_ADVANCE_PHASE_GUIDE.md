# 🚀 AVANÇO AUTOMÁTICO DE FASE - GUIA RÁPIDO

## O que faz?

Quando **todas as quests de uma fase** expirarem totalmente (incluindo a janela de 15 minutos de atraso), o sistema **avança automaticamente** para a próxima fase.

## Como instalar?

### 1️⃣ Abra o Supabase Dashboard
- Acesse: https://supabase.com/dashboard
- Navegue até: **Database > SQL Editor**

### 2️⃣ Execute o script
- Abra o arquivo `auto-advance-phase.sql` 
- Copie TODO o conteúdo
- Cole no SQL Editor do Supabase
- Clique em **RUN**

### 3️⃣ Habilite pg_cron (opcional, para automação total)
- Dashboard > Database > Extensions
- Procure por `pg_cron`
- Clique em **Enable**
- Volte ao SQL Editor e descomente as linhas do `cron.schedule`

## Como funciona?

A função `auto_advance_phase()` faz o seguinte:

```
1. Pega a fase atual (event_config.current_phase)
2. Busca todas as quests dessa fase
3. Verifica quantas expiraram TOTALMENTE:
   - Expiração = started_at + planned_deadline_minutes + late_submission_window_minutes
4. Se TODAS expiraram:
   ✅ Avança event_config.current_phase para próxima fase
5. Se ainda há quests ativas:
   ⏳ Não faz nada, aguarda
```

## Testar AGORA (sem esperar 1 minuto)

Execute no SQL Editor:

```sql
SELECT auto_advance_phase();
```

Depois verifique se avançou:

```sql
SELECT current_phase FROM event_config;
```

## Seu caso específico (Fase 1 → Fase 2)

Baseado nos logs anteriores:
- Quest 1.2: Expirou em 21:06:42 ✅
- Quest 1.3: Expirou em 20:46:53 ✅  
- BOSS 1: Expirou em 20:12:05 ✅
- Quest 1.1: Já submetida ✅

**Todas as quests da Fase 1 estão finalizadas!**

Ao executar `SELECT auto_advance_phase();`:
- ✅ Detectará que 4/4 quests expiraram ou foram submetidas
- ✅ Mudará `event_config.current_phase` de `1` para `2`
- ✅ Sua página de submissão mostrará Quest 2.1 automaticamente

## Verificar resultado

Depois de executar, rode:

```sql
-- Ver fase atual
SELECT current_phase, updated_at FROM event_config;

-- Ver quests da nova fase
SELECT 
  q.name,
  q.order_index,
  q.started_at,
  q.status
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.phase_number = (SELECT current_phase FROM event_config LIMIT 1)
ORDER BY q.order_index;
```

## Problema com `supabase@2.54.11`?

Se você viu essa mensagem no terminal, é apenas um aviso do npm. Você pode ignorar ou instalar:

```powershell
npm install -g supabase@2.54.11
```

Mas NÃO é necessário para o avanço automático de fase funcionar.

## Automação contínua (opcional)

Se você habilitou `pg_cron` e descomentou o `cron.schedule`:
- A função rodará **automaticamente a cada 1 minuto**
- Não precisa executar manualmente
- Fases avançarão sozinhas quando expirarem

## Desinstalar

Se quiser reverter:

```sql
-- Remover agendamento
SELECT cron.unschedule('auto-advance-phase-job');

-- Remover função
DROP FUNCTION IF EXISTS auto_advance_phase();
```

---

## ⚡ AÇÃO IMEDIATA

**Para resolver agora:**

1. Abra Supabase Dashboard > SQL Editor
2. Execute:
   ```sql
   SELECT auto_advance_phase();
   ```
3. Recarregue a página de submissão (F5)
4. Você verá Quest 2.1 (primeira quest da Fase 2)

✅ Pronto!
