# Hooks - Guia de Uso

## Hooks Otimizados com SWR

### 🆕 `useRealtimeRankingOptimized()`

Hook otimizado para buscar ranking em tempo real usando SWR em vez de polling.

**Benefícios:**
- ✅ Caching automático
- ✅ Deduplicação de requisições
- ✅ Revalidação inteligente (ao focar a aba)
- ✅ Menos requisições ao banco de dados
- ✅ Fallback automático

**Uso:**
```typescript
import { useRealtimeRankingOptimized } from '@/lib/hooks/useRealtimeRankingOptimized'

export default function Dashboard() {
  const { ranking, loading, error, mutate } = useRealtimeRankingOptimized()

  if (loading) return <p>Carregando...</p>
  if (error) return <p>Erro ao carregar ranking</p>

  return (
    <div>
      {ranking.map((team) => (
        <div key={team.id}>{team.team_name}</div>
      ))}

      {/* Forçar refresh */}
      <button onClick={() => mutate()}>Atualizar</button>
    </div>
  )
}
```

**Opções SWR:**
- `refreshInterval: 10000` - Revalidar a cada 10 segundos
- `revalidateOnFocus: true` - Revalidar ao focar a aba
- `dedupingInterval: 2000` - Deduplicar requisições dentro de 2s

---

### 🆕 `useRealtimePenaltiesOptimized()`

Hook otimizado para penalidades com som automático para novas penalidades.

**Benefícios:**
- ✅ Detecção automática de novas penalidades
- ✅ Som automático via `useSoundSystem`
- ✅ Caching com SWR
- ✅ Logging integrado

**Uso:**
```typescript
import { useRealtimePenaltiesOptimized } from '@/lib/hooks/useRealtimePenaltiesOptimized'

export default function PenaltiesDisplay() {
  const { penalties, loading, error } = useRealtimePenaltiesOptimized()

  if (loading) return <p>Carregando penalidades...</p>
  if (error) return <p>Erro ao carregar penalidades</p>

  return (
    <ul>
      {penalties.map((penalty) => (
        <li key={penalty.id}>{penalty.description}</li>
      ))}
    </ul>
  )
}
```

---

### ⚙️ Hooks Originais (Mantidos com Otimizações)

#### `useRealtimeRanking()`
- **Polling interval**: 1s → 5s
- **Novo**: Visibility listener (pausa quando aba não está visível)
- **Compatibilidade**: 100% backward compatible

#### `useRealtimePhase()`
- **Polling interval**: 2s → 5s
- **Novo**: Visibility listener
- **Compatibilidade**: 100% backward compatible

#### `useRealtimePenalties()`
- **Polling interval**: 1s (sem mudança)
- **Novo**: Pode ser substituído por `useRealtimePenaltiesOptimized()`

#### `useRealtimeEvaluators()`
- **Polling interval**: 5s (sem mudança)
- **Status**: Pode ser otimizado com SWR no futuro

---

## Error Boundary

### `<ErrorBoundary>`

Componente que captura erros de componentes filhos.

**Uso:**
```typescript
import ErrorBoundary from '@/components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary
      fallback={<div>Algo deu errado!</div>}
      onError={(error, info) => console.log(error, info)}
    >
      <MeuComponente />
    </ErrorBoundary>
  )
}
```

**Props:**
- `children`: Componentes a proteger
- `fallback?`: Elemento customizado para erro (opcional)
- `onError?`: Callback quando erro é capturado (opcional)

---

## Migrando do Polling para SWR

### Antes (Polling):
```typescript
const { ranking, loading } = useRealtimeRanking()
```

### Depois (SWR):
```typescript
const { ranking, loading } = useRealtimeRankingOptimized()
// 100% compatível, apenas troque o import!
```

**Benefícios da migração:**
- 📉 Reduz requisições em ~50-70%
- ⚡ Mais responsivo (cache + revalidação inteligente)
- 🔄 Sincronização automática entre abas
- 📱 Melhor para mobile (menos banda)

---

## Performance Comparação

### Polling (Original)
- Intervalo: 1-2 segundos
- Requisições/min: ~30-60 por cliente
- Latência: ~1-2s de atraso
- Banda: Alta durante inatividade

### SWR (Novo)
- Intervalo: 5-10 segundos (background)
- Requisições/min: ~6-12 por cliente
- Latência: Imediato (cache) + revalidação inteligente
- Banda: ~70% menor

---

## Dicas de Uso

1. **Usar `mutate()` para updates otimistas:**
   ```typescript
   // Atualizar UI imediatamente
   mutate([...newRanking], false)
   ```

2. **Conditional Fetching:**
   ```typescript
   // Não fazer fetch se condição não for atendida
   const { ranking } = useRealtimeRankingOptimized()
   // SWR só vai fazer fetch quando o hook estiver renderizado
   ```

3. **Combinar com Error Boundary:**
   ```typescript
   <ErrorBoundary>
     <RankingBoard />
   </ErrorBoundary>
   ```

---

## Links Úteis

- [SWR Docs](https://swr.vercel.app/)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Supabase Client](../supabase/client.ts)
