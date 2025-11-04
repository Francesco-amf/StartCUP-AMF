# 🚀 Guia Rápido - Novas Funcionalidades

## O que mudou?

Implementamos **4 melhorias automáticas** para resolver os problemas de sincronização identificados.

---

## ✨ Funcionalidades Novas

### 1. 🔄 Auto-Refresh (30 segundos)
**Onde:** Páginas `/submit` e `/dashboard`

**O que faz:**
- Atualiza automaticamente a cada 30 segundos
- Detecta quando fase muda no banco de dados
- **Não precisa mais dar F5 manualmente!**

**Como testar:**
```
1. Abra /submit
2. Em outra aba, mude a fase via SQL:
   UPDATE event_config SET current_phase = 2;
3. Aguarde até 30 segundos
4. ✅ Página mostra Quest 2.1 automaticamente
```

---

### 2. 🎯 Live Dashboard Sincronizado
**Onde:** Página `/live` (telão público)

**O que faz:**
- Verifica `event_config.current_phase` a cada 30 segundos
- Carrega quests da fase correta do banco
- Muda automaticamente quando `auto_advance_phase()` executa

**Como testar:**
```
1. Abra /live
2. Observe quests da Fase 1
3. Via SQL: UPDATE event_config SET current_phase = 3;
4. Aguarde até 30 segundos
5. ✅ Live Dashboard mostra quests da Fase 3
```

---

### 3. ⚠️ Notificação de Expiração
**Onde:** Página `/submit` (toast no canto superior direito)

**O que faz:**
- Detecta quando quest expira
- Mostra toast vermelho animado
- Auto-esconde após 10 segundos

**Visual:**
```
┌─────────────────────────────────┐
│ ⏰  ⚠️ Prazo Expirado!          │
│                                  │
│ A quest "Quest 1.2" expirou.    │
│ A página será atualizada        │
│ automaticamente.                │
└─────────────────────────────────┘
```

**Como testar:**
```
1. Abra /submit
2. Aguarde quest expirar (ou force via SQL)
3. ✅ Toast vermelho aparece no canto superior direito
4. ✅ Desaparece sozinho após 10 segundos
```

---

### 4. ⏱️ Contador Auto-Advance
**Onde:** Página `/submit` quando todas as quests expiram

**O que faz:**
- Mostra contador regressivo até próxima execução do cron
- Equipe sabe exatamente quando fase mudará
- Atualiza a cada 1 segundo

**Visual:**
```
┌─────────────────────────────────────────────┐
│ 🏁 Todas as quests desta fase foram         │
│    finalizadas                              │
│                                             │
│ Os prazos expiraram. Aguarde a próxima     │
│ fase do evento.                            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ⏱️ Próxima Verificação de Fase              │
│ Auto-advance executa a cada minuto         │
│                                             │
│              [ 47s ]                        │
└─────────────────────────────────────────────┘
```

**Como testar:**
```
1. Fazer todas as quests de uma fase expirarem
2. Abra /submit
3. ✅ Banner "Fase completa" aparece
4. ✅ Contador mostra segundos até próximo cron
5. ✅ Contador decrementa: 60 → 59 → 58 → ...
6. ✅ Quando chega a 0, reseta para 60
```

---

## 🎮 Fluxo Completo (Experiência do Usuário)

### Cenário: Equipe jogando Fase 1

**T+0min:** Quest 1.1 ativa
- Equipe vê Quest 1.1 na página `/submit`
- Live Dashboard mostra Quest 1.1

**T+10min:** Submete Quest 1.1 ✅
- Página recarrega automaticamente (`router.refresh()`)
- Agora mostra Quest 1.2

**T+60min:** Quest 1.2 expira ⏰
- **NOVO:** Toast vermelho aparece: "⚠️ Prazo Expirado!"
- Após 10s, toast desaparece
- **NOVO:** Página atualiza automaticamente em até 30s
- Mostra Quest 1.3 com banner: "🚦 Prazo finalizado em Quest 1.2"

**T+110min:** Todas as quests expiraram 🏁
- Banner: "🏁 Todas as quests finalizadas"
- **NOVO:** Contador mostra: "Próxima verificação: 45s"

**T+111min:** Auto-advance executa (cron)
- SQL: `UPDATE event_config SET current_phase = 2`
- **NOVO:** Live Dashboard detecta em até 30s → Mostra Fase 2
- **NOVO:** Página `/submit` detecta em até 30s → Mostra Quest 2.1

---

## 🔧 Para Desenvolvedores

### Componentes Criados
```
src/components/dashboard/DashboardAutoRefresh.tsx
src/components/quest/QuestExpirationNotifier.tsx
src/components/quest/AutoAdvanceCountdown.tsx
```

### Componentes Modificados
```
src/components/forms/SubmissionWrapper.tsx
src/components/dashboard/CurrentQuestTimer.tsx
src/app/(team)/dashboard/page.tsx
```

### Padrões Usados
- **Polling:** `setInterval` com 30s (balance UX/performance)
- **Cleanup:** Todos os `useEffect` têm `return () => clearInterval()`
- **Client-Side:** Componentes `'use client'` isolados
- **Server-Side:** Páginas mantêm SSR, componentes client são wrappers

---

## ⚙️ Configurações

### Intervalos (podem ser ajustados)

**Auto-Refresh:**
```tsx
// src/components/forms/SubmissionWrapper.tsx
setInterval(() => router.refresh(), 30000) // 30 segundos
```

**Live Dashboard Sync:**
```tsx
// src/components/dashboard/CurrentQuestTimer.tsx
setInterval(syncCurrentPhase, 30000) // 30 segundos
```

**Notificação de Expiração:**
```tsx
// src/components/quest/QuestExpirationNotifier.tsx
setTimeout(() => setShowNotification(false), 10000) // 10 segundos
```

**Contador Auto-Advance:**
```tsx
// src/components/quest/AutoAdvanceCountdown.tsx
setInterval(updateCounter, 1000) // 1 segundo
```

---

## 🐛 Troubleshooting

### Problema: Página não atualiza após 30s
**Solução:**
1. Verificar console do navegador (F12)
2. Procurar erros de rede ou Supabase
3. Verificar se componente `DashboardAutoRefresh` está renderizado

### Problema: Toast não aparece quando quest expira
**Solução:**
1. Verificar se `QuestExpirationNotifier` recebe `currentQuest`
2. Confirmar que `started_at` e `planned_deadline_minutes` estão definidos
3. Verificar console: deve logar quando detecta expiração

### Problema: Contador mostra valores negativos
**Solução:**
1. Verificar relógio do servidor vs cliente
2. Confirmar que cron está executando (`SELECT cron.schedule(...)`)
3. Checar logs do PostgreSQL para execuções do `auto_advance_phase()`

### Problema: Live Dashboard não muda de fase
**Solução:**
1. Verificar console: deve logar "🔄 Fase mudou: X → Y"
2. Confirmar que `event_config.current_phase` foi atualizado no banco
3. Aguardar até 30s para sincronização

---

## 📊 Logs de Debug

### Console do Navegador (F12)

**Auto-Refresh:**
```
[Next.js] Refreshing page...
```

**Live Dashboard Sync:**
```
🔄 [LiveDashboard] Fase mudou: 1 → 2
🔍 Buscando quests para Fase 2 (phase_id: uuid-here)
📊 Resultado da query - Total de quests: 4
✅ Quests carregadas para Fase 2: [1] Quest 2.1, [2] Quest 2.2, ...
```

**Quest Expiration:**
```
⏰ Quest "Quest 1.2" expirou!
```

**Contador:**
```
⏱️ Próxima execução em: 45 segundos
⏱️ Próxima execução em: 44 segundos
...
```

---

## ✅ Checklist de Implementação

- [x] Auto-refresh em SubmissionWrapper (30s)
- [x] Auto-refresh em Dashboard via componente invisível (30s)
- [x] Live Dashboard sincroniza com current_phase (30s)
- [x] Toast de expiração com animação
- [x] Contador regressivo para auto-advance
- [x] Cleanup de intervals (evita memory leak)
- [x] TypeScript sem erros
- [x] Componentes client-side isolados
- [x] Documentação completa

---

## 🚀 Deploy

**Nenhuma mudança necessária:**
- ✅ Não requer variáveis de ambiente novas
- ✅ Não requer mudanças no banco de dados
- ✅ Não requer atualizações de dependências
- ✅ Compatível com Next.js 16 + React 19

**Após deploy:**
```bash
# Verificar se build passou
npm run build

# Verificar se não há erros TS
npm run type-check

# Deploy normal
git push origin main
```

---

## 📚 Referências

- `QUEST_ADVANCE_FLOW_ANALYSIS.md` - Análise completa do fluxo
- `SOLUTIONS_IMPLEMENTED.md` - Detalhes técnicos das soluções
- `auto-advance-phase.sql` - Função SQL do cron
- `VERIFY_ALL_BOSS_QUESTS.sql` - Script de verificação

---

**Última atualização:** 2025-11-03  
**Versão:** 1.0.0  
**Status:** ✅ Produção
