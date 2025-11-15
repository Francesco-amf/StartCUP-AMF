# 🔄 Exemplo Prático: Migrar `useRealtimePenalties` para Realtime

**Objetivo**: Mostrar como migrar um hook de polling para Realtime + Fallback
**Baseado em**: Padrão já implementado em `useRealtimeQuests`

---

## Antes: Polling Puro

```typescript
// ATUAL: useRealtimePenalties usa polling (3 segundos)
export function useRealtimePenalties() {
  const [penalties, setPenalties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPenalties = async () => {
      // Faz query a cada 3 segundos
      const { data } = await supabase
        .from('penalties')
        .select('*')
        .order('created_at', { ascending: false })

      // Enriquecer com teams e evaluators
      const enriched = await enrichPenalties(data)
      setPenalties(enriched)
    }

    // Poll a cada 3 segundos = 20 requisições/minuto
    fetchPenalties()
    const interval = setInterval(fetchPenalties, 3000)

    return () => clearInterval(interval)
  }, [])

  return { penalties, loading }
}
```

**Problemas:**
- ❌ 20 requisições/minuto contínuo
- ❌ Latência: 3 segundos para aparecer penalidade
- ❌ Overhead: Sempre buscando mesmo sem mudanças

---

## Depois: Realtime + Polling Fallback

```typescript
/**
 * ✨ P5: Migração para Realtime
 *
 * Benefícios:
 * - Penalidades aparecem instantaneamente (<100ms)
 * - 90% redução em requisições (20 → ~2 req/min)
 * - Mesmo padrão de `useRealtimeQuests`
 */
export function useRealtimePenalties() {
  const [penalties, setPenalties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())
  const subscriptionRef = useRef<any>(null)
  const initialLoadRef = useRef(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const subscriptionHealthRef = useRef<boolean>(false)
  const previousPenaltyIdsRef = useRef<Set<string>>(new Set())
  const isFirstRenderRef = useRef(true)

  const supabase = supabaseRef.current
  const POLLING_DEBOUNCE_MS = 5000 // Aguarda 5s de Realtime inativo

  useEffect(() => {
    let mounted = true

    // 1️⃣ INITIAL LOAD & ENRICHMENT
    const initialFetchPenalties = async () => {
      if (!mounted) return

      try {
        DEBUG.log('useRealtimePenalties', '📡 Initial load...')
        const { data: penaltiesData } = await supabase
          .from('penalties')
          .select('*')
          .order('created_at', { ascending: false })

        if (penaltiesData && mounted) {
          const enriched = await enrichPenalties(penaltiesData)
          setPenalties(enriched)
          previousPenaltyIdsRef.current = new Set(enriched.map(p => p.id))
          setLoading(false)
        }
      } catch (err) {
        DEBUG.error('useRealtimePenalties', 'Initial load error:', err)
        setLoading(false)
      }
    }

    // 2️⃣ POLLING FALLBACK (quando Realtime falha)
    const fetchPenaltiesFallback = async () => {
      if (!mounted) return

      try {
        DEBUG.log('useRealtimePenalties-Fallback', '⏳ Polling fallback...')
        const { data: penaltiesData } = await supabase
          .from('penalties')
          .select('*')
          .order('created_at', { ascending: false })

        if (penaltiesData && mounted) {
          const enriched = await enrichPenalties(penaltiesData)
          setPenalties(enriched)
        }
      } catch (err) {
        DEBUG.error('useRealtimePenalties-Fallback', 'Error:', err)
      }
    }

    // 3️⃣ REALTIME SUBSCRIPTION
    const setupRealtime = async () => {
      try {
        // Initial load first
        await initialFetchPenalties()

        if (!mounted) return

        DEBUG.log('useRealtimePenalties', '📡 Configurando Realtime subscription...')

        // Subscribe to penalties changes
        const channel = supabase
          .channel('public:penalties')
          .on(
            'postgres_changes',
            {
              event: '*', // INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'penalties'
            },
            async (payload: any) => {
              DEBUG.log('useRealtimePenalties', `📡 Mudança detectada:`, payload.eventType)

              if (!mounted) return

              // Quando penalty muda, refetch ALL + enrich
              // (Mais simples que tentar atualizar individualmente)
              try {
                const { data: allPenalties } = await supabase
                  .from('penalties')
                  .select('*')
                  .order('created_at', { ascending: false })

                if (allPenalties) {
                  const enriched = await enrichPenalties(allPenalties)

                  // Detectar penalidades novas e tocar som
                  if (!isFirstRenderRef.current) {
                    enriched.forEach((penalty: any) => {
                      if (!previousPenaltyIdsRef.current.has(penalty.id)) {
                        DEBUG.log('useRealtimePenalties', `🔊 PENALTY NOVA: ${penalty.team_name}`)
                        // Aqui você poderia tocar som de penalidade
                      }
                    })
                  }

                  previousPenaltyIdsRef.current = new Set(enriched.map(p => p.id))
                  if (isFirstRenderRef.current) {
                    isFirstRenderRef.current = false
                  }

                  setPenalties(enriched)
                }
              } catch (err) {
                DEBUG.error('useRealtimePenalties', 'Error enriquecendo penalty:', err)
              }
            }
          )
          .subscribe((status: any) => {
            DEBUG.log('useRealtimePenalties', `🔔 Subscription status: ${status}`)

            subscriptionHealthRef.current = status === 'SUBSCRIBED'

            if (status === 'SUBSCRIBED') {
              DEBUG.log('useRealtimePenalties', '✅ Realtime subscription ativa!')

              // WebSocket funcionando: parar polling
              if (pollingDebounceRef.current) {
                clearTimeout(pollingDebounceRef.current)
                pollingDebounceRef.current = null
              }
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
              }
            } else {
              DEBUG.warn('useRealtimePenalties', `⚠️ Realtime inativo, ativando fallback...`)

              // WebSocket não funcionando: ativar polling
              if (!pollingDebounceRef.current && mounted) {
                pollingDebounceRef.current = setTimeout(() => {
                  if (subscriptionHealthRef.current === false && !pollingIntervalRef.current) {
                    DEBUG.log('useRealtimePenalties', '🔄 Ativando polling fallback...')
                    // Poll a cada 10 segundos (vs 3 segundos antes)
                    // Menos agressivo porque é fallback
                    pollingIntervalRef.current = setInterval(fetchPenaltiesFallback, 10000)
                  }
                  pollingDebounceRef.current = null
                }, POLLING_DEBOUNCE_MS)
              }
            }
          })

        subscriptionRef.current = channel
      } catch (err) {
        DEBUG.error('useRealtimePenalties', 'Realtime setup error:', err)
        // Se Realtime falha, ativar polling
        if (mounted && !pollingIntervalRef.current) {
          pollingIntervalRef.current = setInterval(fetchPenaltiesFallback, 10000)
        }
      }
    }

    setupRealtime()

    // 🧹 CLEANUP
    return () => {
      mounted = false
      if (subscriptionRef.current) {
        DEBUG.log('useRealtimePenalties', '🧹 Limpando subscription...')
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      if (pollingDebounceRef.current) {
        clearTimeout(pollingDebounceRef.current)
        pollingDebounceRef.current = null
      }
    }
  }, [])

  return { penalties, loading }
}

// 4️⃣ HELPER: Enriquecer penalties com teams e evaluators
async function enrichPenalties(penaltiesData: any[]) {
  const supabase = createClient()

  if (!penaltiesData || penaltiesData.length === 0) return []

  try {
    // Buscar teams e evaluators em paralelo
    const teamIds = [...new Set(penaltiesData.map(p => p.team_id))]
    const evaluatorIds = [
      ...new Set(
        penaltiesData
          .filter(p => p.assigned_by_evaluator_id)
          .map(p => p.assigned_by_evaluator_id)
      )
    ]

    const [teamsResult, evaluatorsResult] = await Promise.all([
      teamIds.length > 0
        ? supabase.from('teams').select('id, name, email').in('id', teamIds)
        : Promise.resolve({ data: [], error: null }),
      evaluatorIds.length > 0
        ? supabase.from('evaluators').select('id, name').in('id', evaluatorIds)
        : Promise.resolve({ data: [], error: null })
    ])

    // Montar maps
    const teamMap = new Map(
      (teamsResult.data || []).map((t: any) => [t.id, t.name])
    )
    const evaluatorMap = new Map(
      (evaluatorsResult.data || []).map((e: any) => [e.id, e.name])
    )

    // Enriquecer
    return penaltiesData.map(p => ({
      ...p,
      team_name: teamMap.get(p.team_id) || 'Equipe Desconhecida',
      evaluator_name: p.assigned_by_evaluator_id
        ? evaluatorMap.get(p.assigned_by_evaluator_id)
        : null
    }))
  } catch (err) {
    DEBUG.error('enrichPenalties', 'Error:', err)
    return penaltiesData
  }
}
```

---

## 📊 Comparação: Antes vs Depois

### Antes (Polling a cada 3 segundos)
```
Requisições/minuto:  20
Latência:            3 segundos
WebSocket:           0
Código:              Simples (sem fallback)
Fallback:            Nenhum
```

### Depois (Realtime + Polling fallback)
```
Requisições/minuto:  ~2 (apenas quando mudanças)
Latência:            <100ms
WebSocket:           1 ativo
Código:              Mais complexo (mas reutilizável)
Fallback:            Poll a cada 10s se Realtime falha
```

### Impacto
```
Redução de requisições: 20 → ~2 = 90% ↓
Melhoria de latência:   3s → <100ms = 97% ↓
Custo:                  Mesmo $25/mês (Pro)
```

---

## 🚀 Processo de Implementação

### 1. Testar Realtime em Desenvolvimento
```bash
# Certificar que useRealtimeQuests funciona com Realtime
# Se funciona, o padrão está ok
NEXT_PUBLIC_DEBUG=true npm run dev
# Verificar no console se Realtime subscription ativa
```

### 2. Copiar Padrão de useRealtimeQuests
```typescript
// Usar mesma estrutura:
// - subscriptionRef, pollingIntervalRef, pollingDebounceRef
// - subscriptionHealthRef
// - Mesmo debounce logic (5 segundos antes de ativar polling)
```

### 3. Adaptar para Penalidades
```typescript
// Mudanças principais:
// 1. Trocar channel name: 'public:penalties'
// 2. Trocar table: 'penalties'
// 3. Adicionar enrichment (teams + evaluators)
// 4. Adicionar sound detection (se tiver)
```

### 4. Testar Fallback
```bash
# Desabilitar Realtime temporariamente para testar fallback:
# - Fechar aba do navegador (WebSocket cai)
# - Verificar se polling ativa automaticamente
# - Verificar latência entre mudança e atualização (~10s)
```

### 5. Deploy
```bash
git commit -m "🔄 P5: Migrar useRealtimePenalties para Realtime + Fallback"
git push
```

---

## ✅ Checklist

- [ ] Código escrito seguindo padrão de `useRealtimeQuests`
- [ ] Realtime subscription testada
- [ ] Polling fallback testado (desabilitar WebSocket)
- [ ] RLS Policies verificadas (SELECT em penalties table)
- [ ] Enrichment funciona (teams + evaluators)
- [ ] Sound/notification funciona
- [ ] DEBUG logs mostram "Realtime subscription ativa!"
- [ ] Fallback ativa quando Realtime falha
- [ ] Cleanup funciona (unsubscribe ao desmontar)

---

## 🎯 Próximos Passos

Após sucesso com `useRealtimePenalties`:
1. Repetir com `useRealtimeRanking` (mais simples)
2. Depois `useRealtimePhase`
3. Depois `useRealtimeEvaluators`
4. Observar redução de requisições (~94%)
5. Monitorar custos (deve cair significativamente)

---

**Tempo estimado**: 2-3 horas
**Dificuldade**: ⭐⭐ (médio)
**ROI**: 📈 EXCELENTE (90% redução de requisições)
