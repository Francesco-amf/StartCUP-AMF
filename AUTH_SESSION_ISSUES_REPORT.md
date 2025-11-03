# Relatório de Investigação - Problemas de Autenticação e Sessão

## 📊 Sumário Executivo

Investigação completa realizada no código revelou **8 problemas críticos/altos** que causam:
- ❌ Logouts involuntários durante operações
- ❌ Perda de sessão ao resetar sistema ou mudar fase
- ❌ Redirecionamentos incorretos após login
- ❌ Timeouts de token sem auto-refresh
- ❌ Páginas em branco ao invés de mensagens de erro claras

**Data**: 2025-11-02
**Status**: ⚠️ REQUER CORREÇÃO

---

## 🔴 PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. WINDOW.LOCATION.RELOAD() - Perda de Sessão em Operações

**Severity**: 🔴 CRÍTICA

**Arquivos Afetados**:
- `src/components/ResetSystemButton.tsx` (Linha 42)
- `src/components/PhaseController.tsx` (Linha 78)

**Problema**:
Ambos componentes usam `window.location.reload()` após operações críticas (resetar sistema, mudar fase). Isso causa:

1. **Perda de Estado de Auth**: Supabase armazena tokens em cookies. Full page reload pode causar invalidação de sessão.
2. **Race Condition**: Se a sessão está prestes a expirar ou há issue de rede durante reload, usuário é redirecionado para login.
3. **Sem Token Refresh**: Diferente de `router.push()`, full page reloads não passam pelo Next.js client routing, causando validação de token falhar.

**Exemplo**:
```typescript
// ResetSystemButton.tsx - Linha 42
window.location.reload()  // ❌ PROBLEMA: Limpa estado de auth

// PhaseController.tsx - Linha 78
window.location.reload()  // ❌ PROBLEMA: Mesmo issue
```

**Quando Ocorre**:
- Admin clica "Resetar Sistema" → Logout involuntário
- Admin clica "Ativar Fase 1" → Logout involuntário
- Página recarrega → Session perdida

**Impacto**: Usuário volta para login screen inesperadamente

---

### 2. Falta de Token Auto-Refresh

**Severity**: 🔴 ALTA

**Arquivo Afetado**:
- `src/lib/supabase/client.ts` (sem listeners de refresh)

**Problema**:
Cliente Supabase não está configurado para auto-refresh de tokens:

```typescript
// client.ts - INCOMPLETO
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  // ❌ Faltam: event listeners para token refresh
}
```

**Consequência**:
- Tokens expiram após ~1 hora
- Não há auto-refresh automático
- Usuário é deslogado sem aviso
- Especialmente após resetar tudo e recomeçar do zero

**Quando Ocorre**:
- Usuário fica na página por > 1 hora
- Token expira silenciosamente
- Próxima ação (submit, avaliação) falha com erro de auth

---

### 3. Falta de Tratamento de 401/403 em Componentes Client

**Severity**: 🟡 ALTA

**Arquivo Afetado**:
- `src/components/forms/SubmissionForm.tsx` (Linhas 104-124)
- `src/components/OnlineStatusToggle.tsx` (Sem verificação de auth)

**Problema**:
Componentes `'use client'` não verificam se usuário está autenticado. Se sessão expirar durante interação, não há redirecionamento gracioso para login.

```typescript
// SubmissionForm.tsx - Sem auth check
export default function SubmissionForm({
  questId,
  teamId,
}: SubmissionFormProps) {
  // ❌ Sem useEffect que verifique se user ainda está autenticado
  const [content, setContent] = useState('')

  // ...

  if (!response.ok) {
    // ❌ Não diferencia 401 (auth) de outros erros
    setError(data.error || 'Erro ao enviar entrega')
  }
}
```

**Quando Ocorre**:
- Equipe preenche form de submissão
- Token expira (sem notificar)
- Clica "Enviar"
- API retorna 401
- Usuário vê erro genérico, não é redirecionado para login

---

### 4. Race Condition em Redirect Pós-Login

**Severity**: 🟡 ALTA

**Arquivo Afetado**:
- `src/app/(auth)/login/page.tsx` (Linhas 34-46)

**Problema**:
Lógica de redirect tenta usar `user_metadata?.role` antes da sessão estar completamente estabelecida:

```typescript
// login/page.tsx - Linhas 34-46
const userRole = data.user?.user_metadata?.role  // ❌ Pode estar undefined

if (userRole === 'team') {
  router.push('/dashboard')  // Pode falhar se role não está set
} else if (userRole === 'admin') {
  router.push('/control-panel')
} else {
  setError('Role não definido para este usuário')  // Cai aqui
}
```

**Quando Ocorre**:
- Usuário faz login
- Role metadata não está populado no token JWT
- Usuário vê erro "Role não definido"
- Ou é redirecionado para login page novamente (loop infinito)

---

### 5. Sem Tratamento de Erros RLS em Queries Aninhadas

**Severity**: 🟡 MÉDIA

**Arquivo Afetado**:
- `src/app/(evaluator)/evaluate/page.tsx` (Linhas 56-92)

**Problema**:
Queries complexas com JOINs não tratam erros de RLS (Row Level Security):

```typescript
// evaluate/page.tsx - Sem error handling
const { data: submissions, error: submissionsError } = await supabase
  .from('submissions')
  .select(`
    *,
    team:team_id (name, course),
    quest:quest_id (...)
  `)
  // ❌ Se RLS nega acesso, submissionsError existe mas não é tratado

console.log('Submissions:', { submissions, error: submissionsError })
// Continua como se nada tivesse acontecido
```

**Quando Ocorre**:
- RLS policy nega acesso (usuário sem permissão)
- Query retorna null/empty
- Página mostra vazia em vez de erro
- Usuário confuso

---

### 6. Logout Sem Tratamento de Erro

**Severity**: 🟡 MÉDIA

**Arquivo Afetado**:
- `src/components/Header.tsx` (Linhas 32-38)

**Problema**:
Função de logout não trata erros:

```typescript
// Header.tsx - Logout sem error handling
const handleLogout = async () => {
  const confirm = window.confirm('Tem certeza?')
  if (!confirm) return

  await supabase.auth.signOut()  // ❌ Sem try/catch
  router.push('/login')           // ❌ Pode falhar se signOut falhou
}
```

**Quando Ocorre**:
- Session já inválida
- signOut() falha silenciosamente
- Redirect não funciona
- Usuário fica em página protegida sem estar autenticado

---

### 7. Sem Verificação de Permissão em Queries Aninhadas

**Severity**: 🟡 MÉDIA

**Arquivos Afetados**:
- `src/app/(team)/dashboard/page.tsx` (Linhas 40-60)
- `src/app/(admin)/control-panel/page.tsx` (Linhas 40-70)
- `src/app/(evaluator)/evaluate/page.tsx` (Linhas 56-92)

**Problema**:
Páginas verificam user auth mas não verificam se queries de banco succedem:

```typescript
// control-panel/page.tsx
const userRole = user.user_metadata?.role
if (userRole !== 'admin') {
  redirect('/login')  // ✓ Bom
}

// Mas depois...
const { data: teams } = await supabase
  .from('teams')
  .select('*')
  // ❌ Se RLS nega ou user perdeu permissão, data será null
  // Página continua carregando com dados vazios
```

---

### 8. Reset System Causa Logout

**Severity**: 🔴 CRÍTICA (Combinação de #1 + #2)

**Fluxo Problemático**:
```
1. Admin clica "Resetar Sistema"
   ↓
2. API executa reset (deleta todos dados)
   ↓
3. ResetSystemButton.tsx chama window.location.reload() ❌
   ↓
4. Full page reload limpa cookies de auth
   ↓
5. Página espera por token, mas Supabase não encontra
   ↓
6. Usuário redirecionado para /login ❌
```

**Quando Relatado**:
Exatamente isso: "depois de resetar tudo e recomeçar as fases do zero"

---

## 📋 Matriz de Impacto

| Problema | Admin | Equipe | Avaliador | Frequency | Severity |
|----------|-------|--------|-----------|-----------|----------|
| window.location.reload() logout | ALTO | ALTO | ALTO | SEMPRE | 🔴 |
| Token não auto-refresh | MÉDIO | ALTO | ALTO | >1h | 🔴 |
| 401/403 não tratado | MÉDIO | ALTO | MÉDIO | Ocasional | 🟡 |
| Role redirect race | ALTO | ALTO | ALTO | 1x | 🟡 |
| RLS error silent | MÉDIO | BAIXO | ALTO | Ocasional | 🟡 |
| Logout sem error | MÉDIO | BAIXO | BAIXO | Raro | 🟡 |
| Query RLS fail | MÉDIO | BAIXO | ALTO | Ocasional | 🟡 |

---

## 🔍 Detalhes Técnicos por Cenário

### Cenário 1: Admin Resets System
```
Timeline:
T0:00 - Admin clica "Resetar Sistema"
T0:01 - API `/api/admin/reset` executa com sucesso
T0:02 - ResetSystemButton chama window.location.reload()
T0:03 - Browser faz full page reload
T0:04 - Session cookie pode ter sido invalidado
T0:05 - Página tenta carregar, auth check falha
T0:06 - Redirect para /login
T0:07 - Admin está deslogado ❌
```

### Cenário 2: Admin Changes Phase After 1 Hour
```
Timeline:
T0:00 - Admin faz login
T1:00 - Token expira (1 hora típica)
T1:05 - Admin clica "Ativar Fase 2"
T1:06 - Token está inválido
T1:07 - Sem auto-refresh, não há novo token
T1:08 - API recusa request (401)
T1:09 - window.location.reload() chamado
T1:10 - Admin está deslogado ❌
```

### Cenário 3: Equipe Submete Form com Token Expirado
```
Timeline:
T0:00 - Equipe faz login
T1:00 - Token expira
T1:05 - Equipe preenche form de submission
T1:10 - Equipe clica "Enviar"
T1:11 - Token inválido, API retorna 401
T1:12 - SubmissionForm não reconhece 401
T1:13 - Mostra erro genérico "Erro ao enviar"
T1:14 - Equipe não sabe que precisa fazer login novamente ❌
```

---

## 🛠️ Sugestões de Correção

### Prioridade 1: Remover window.location.reload()

**Arquivo**: `src/components/PhaseController.tsx` (Linha 78)

**Substituir**:
```typescript
// ❌ ANTES
window.location.reload()

// ✅ DEPOIS
router.refresh()  // Next.js client-side refresh
// OU
setTimeout(() => window.location.href = window.location.pathname, 500)
// OU melhor: usar router + revalidation
```

**Arquivo**: `src/components/ResetSystemButton.tsx` (Linha 42)

**Mesmo tratamento acima**

---

### Prioridade 2: Adicionar Token Auto-Refresh

**Arquivo**: `src/lib/supabase/client.ts`

**Adicionar**:
```typescript
export function createClient() {
  const client = createBrowserClient(...)

  // Listener para refresh automático
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('✅ Token auto-refreshed')
    }
  })

  return client
}
```

---

### Prioridade 3: Adicionar Auth Check em Client Components

**Arquivo**: `src/components/forms/SubmissionForm.tsx`

**Adicionar**:
```typescript
useEffect(() => {
  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    }
  }

  checkAuth()
}, [])
```

---

### Prioridade 4: Tratar 401/403 em Responses

**Em todos os fetch():**
```typescript
if (response.status === 401 || response.status === 403) {
  // Auth failure - redirect to login
  router.push('/login')
  return
}

// Other errors
setError(data.error)
```

---

## 📝 Resumo dos Achados

| ID | Problema | Arquivo | Linha | Fix Priority |
|----|----------|---------|-------|--------------|
| 1 | window.location.reload() | PhaseController.tsx | 78 | 🔴 P1 |
| 2 | window.location.reload() | ResetSystemButton.tsx | 42 | 🔴 P1 |
| 3 | Sem token auto-refresh | client.ts | - | 🔴 P2 |
| 4 | Sem auth check em forms | SubmissionForm.tsx | 20 | 🟡 P3 |
| 5 | Sem 401/403 handling | Múltiplos | - | 🟡 P3 |
| 6 | Role redirect race | login/page.tsx | 35 | 🟡 P4 |
| 7 | RLS silent failure | evaluate/page.tsx | 56 | 🟡 P4 |
| 8 | Logout sem error handling | Header.tsx | 32 | 🟡 P5 |

---

## ✅ Recomendações

1. **Imediato (Hoje)**:
   - [ ] Substituir `window.location.reload()` por `router.refresh()`
   - [ ] Adicionar try/catch ao signOut()

2. **Curto Prazo (Esta Semana)**:
   - [ ] Implementar token auto-refresh
   - [ ] Adicionar auth check com useEffect em client components
   - [ ] Tratar 401/403 em todas as API calls

3. **Médio Prazo**:
   - [ ] Adicionar error handling para RLS failures
   - [ ] Verificar role metadata logo após login
   - [ ] Adicionar toast notifications para auth errors

4. **Testing**:
   - [ ] Testar logout/login cycle
   - [ ] Testar sessão > 1 hora
   - [ ] Testar reset system com preservação de sessão
   - [ ] Testar role-based redirects

---

## 📞 Próximos Passos

Você gostaria que eu:
1. **Corrija os problemas imediatos** (P1 fixes)?
2. **Crie patch completo** com todas as correções?
3. **Implemente safeguards** contra perda de sessão?
4. **Adicione monitoring** de auth state?

---

**Relatório Completo**
Data: 2025-11-02
Status: Pronto para ação
