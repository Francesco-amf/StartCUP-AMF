# 🔴 MEGA CHECKLIST PRÉ-EVENTO - INÍCIO IMEDIATO

## 📋 ANTES DE COMEÇAR - EXECUTE ISTO EM ORDEM:

### 1️⃣ DATABASE (Supabase SQL Editor)
- [ ] Execute `MEGA_CHECKLIST_PREEVENTO.sql`
- [ ] Capture resultado completo (screenshot ou salve em txt)
- [ ] **Resultado esperado:** Todos ✅ (nenhum ❌)

### 2️⃣ FRONTEND (DevTools Console - F12)
```javascript
// Cole isto no Console:
await runAllChecks();
```
- [ ] Execute `MEGA_CHECKLIST_PREEVENTO.js` (copie e cole no Console)
- [ ] Verifique resultado: Todos ✅
- [ ] **Resultado esperado:** 🟢 TUDO OK! PRONTO PARA EVENTO!

### 3️⃣ VERIFICAÇÕES MANUAIS (Critical!)

#### 3.1 AUDIOVISUAL
- [ ] Som no notebook toca NORMAL
- [ ] Projetor exibe vídeo do notebook
- [ ] Caixa Bluetooth conectada e testada
- [ ] ⚠️ IMPORTANTE: Som no projetor está SINCRONIZADO? (ver guia HDMI+Bluetooth)

#### 3.2 INTERFACE
- [ ] Página inicial carrega
- [ ] Botões de admin visíveis (se admin)
- [ ] Avatar/profile do usuário aparece
- [ ] Dark/light mode funcionando

#### 3.3 DADOS AO VIVO
- [ ] Acessar página de admin > Quest Status
- [ ] Deve mostrar: **Phase: 0** e **event_started: false**
- [ ] Se não, PARE E INVESTIGUE!

#### 3.4 CONECTIVIDADE
- [ ] Abrir DevTools > Network
- [ ] Recarregar página
- [ ] Verificar que **todos** requests têm status 2xx (200, 304)
- [ ] Se houver 5xx: AVISO - API com problema

#### 3.5 PERFORMANCE
- [ ] DevTools > Lighthouse
- [ ] Rodar rápida auditoria
- [ ] Performance score > 70 = OK
- [ ] < 70 = considerar otimização

---

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES RÁPIDAS

### ❌ Database Check falhou (✅ se virou ❌)

**Problema: Quest com status errado**
```sql
-- Resetar todas para scheduled
UPDATE quests SET status = 'scheduled', started_at = NULL, completed_at = NULL;
```

**Problema: Boss battles ainda existem**
```sql
DELETE FROM boss_battles;
```

**Problema: Submissions/Evaluations não zeradas**
```sql
DELETE FROM submissions;
DELETE FROM evaluations;
DELETE FROM team_member_evaluation;
```

### ❌ API retornando 500

**Solução:**
- [ ] Verificar logs do servidor (Vercel/Railway/etc)
- [ ] Restartar servidor
- [ ] Verificar variáveis de ambiente (.env)

### ❌ Realtime não conectando

**Solução:**
- [ ] Verificar conexão internet
- [ ] Verificar Supabase project status (dashboard.supabase.com)
- [ ] Limpar LocalStorage + recarregar: `localStorage.clear(); location.reload();`

### ❌ Audio dessincronizado

**Ver:** `FIX_AUDIO_HDMI_BLUETOOTH_SYNC.sql`
- [ ] Conectar caixa no projetor (não no notebook)
- [ ] Ou usar HDMI splitter com extrator de áudio
- [ ] Ou aceitar ~200ms de latência

---

## ✅ ÚLTIMO CHECK ANTES DE COMEÇAR

Responda com SINCERIDADE:

- [ ] Todos database checks passaram? (Sim/Não)
- [ ] Todos frontend checks passaram? (Sim/Não)
- [ ] Áudio está testado e sincronizado? (Sim/Não/NA)
- [ ] Internet está estável? (Sim/Não)
- [ ] Admin pode logar? (Sim/Não)
- [ ] Avaliadores podem logar? (Sim/Não)
- [ ] Times podem logar? (Sim/Não)
- [ ] Event config está em Phase 0? (Sim/Não)
- [ ] Você tem plano B se algo falhar? (Sim/Não)

---

## 🟢 SE TUDO DER CHECKMARK:

**PRONTO PARA COMEÇAR! 🚀**

```
╔════════════════════════════════════════╗
║  ✅ SISTEMA 100% PRONTO PARA EVENTO  ║
║  🟢 Pode começar com confiança       ║
║  📺 Todos os checks passaram         ║
║  🎉 BOA SORTE!                       ║
╚════════════════════════════════════════╝
```

---

## 🔴 SE ALGO FALHAR:

**NÃO COMECE AINDA!**

1. Identifique qual check falhou
2. Consulte a seção "Problemas Comuns" acima
3. Se não conseguir resolver em 5 minutos:
   - Volte para checklist anterior
   - Rode `CHECK_DIRTY_DATA.sql` novamente
   - Considere fazer reset manual

---

## 📞 EMERGENCY CONTACTS

Se tudo falhar no meio do evento:

**Para resetar completamente:**
```
Execute: FULL_SYSTEM_RESET.sql (se existir)
Ou: DELETE FROM quests, submissions, evaluations, boss_battles
Depois: Recarregar página
```

**Para ativar event:**
```sql
UPDATE event_config SET event_started = true, current_phase = 1;
```

**Para parar tudo:**
```sql
UPDATE event_config SET event_started = false, current_phase = 0;
```

---

## 📝 TEMPO ESTIMADO PARA ESTE CHECKLIST:

- ⏱️ SQL checks: 2-3 minutos
- ⏱️ Frontend checks: 2-3 minutos
- ⏱️ Manual checks: 5-10 minutos
- ⏱️ **Total: ~15 minutos**

**VALE CADA SEGUNDO!** 🎯
