# 🧪 INSTRUÇÃO DE TESTE NA LIVE

**Build Status**: ✅ Compilado com sucesso
**Data**: 2025-11-14
**Servidor**: Rodando em `http://localhost:3000`

---

## Checklist Rápido

- [x] Build compilado sem erros
- [x] Três fluxos corrigidos
- [ ] Teste Scenario 1 (Team Submit)
- [ ] Teste Scenario 2 (Evaluator NEW)
- [ ] Teste Scenario 3 (Evaluator EDIT)

---

## Antes de Testar

1. **Abra DevTools**: F12 (Console aberto)
2. **Limpe Console**: Pressione ctrl+shift+K para limpar
3. **Procure por logs**: Veja a seção de logs esperados abaixo

---

## TESTE 1: Team Submit

### Setup
- Acesse `/submit` como **team**
- Tenha uma quest **não entregue** disponível
- Arquivo/texto/link pronto para enviar

### Passos
1. Selecione a quest não entregue
2. Escolha o tipo de entrega (arquivo, texto ou link)
3. Preencha o formulário
4. Clique em **"Enviar Entrega"**
5. **Aguarde ~2 segundos**

### Esperado ✅
```
[ ] Botão muda para "⏳ Enviando..."
[ ] Após ~1.5s: Formulário DESAPARECE
[ ] Mensagem "✅ Quest Concluída!" aparece
[ ] Mensagem "Aguarde o prazo desta quest expirar..." visível
[ ] Emoji "✅" + Descrição de próximas ações
```

### Console Logs Esperados
```
play('submission')
🔄 [SubmissionForm] Entrega completa - escondendo formulário...
```

### Se Falhar ❌
- [ ] Form ainda está visível? → Cheque `isSubmissionComplete` state
- [ ] Mensagem não apareceu? → Cheque renderização condicional
- [ ] Abra console e procure por erros (vermelho)

---

## TESTE 2: Evaluator NEW Evaluation

### Setup
- Acesse `/evaluate` como **avaliador**
- Tenha uma submission **não avaliada** disponível
- Valores prontos para preencher (ex: 40 pontos, 1.5x multiplicador)

### Passos
1. Clique em **"⭐ Avaliar"** em uma submission não avaliada
2. Preencha:
   - **AMF Coins Base**: 40
   - **Multiplicador**: 1.5
   - **Comentários**: "Bom trabalho!" (opcional)
3. Clique em **"Enviar Avaliação"**
4. **Observe a navegação**

### Esperado ✅
```
[ ] Botão muda para "⏳ Enviando..."
[ ] Formulário reseta
[ ] Após ~50ms: Página volta para /evaluate
[ ] Dashboard carrega automaticamente
[ ] Pode avaliar próxima submissão imediatamente
```

### Console Logs Esperados
```
🔍 [EvaluationForm] handleSubmit - isUpdate prop: false
✅ Avaliação salva: {...}
✅ [EvaluationForm] NEW evaluation detectado - redirecionando para /evaluate...
🔄 Redirecionando para /evaluate...
✅ Navegação via router.push funcionou
```

### Se Não Funcionar ❌
- [ ] Ficou na página individual? → Cheque se redirect está executando
- [ ] Não viu "router.push funcionou"? → Fallback pode ter ativado com `window.location.href`
- [ ] Form não resetou? → Cheque form.reset() no código

---

## TESTE 3: Evaluator EDIT Evaluation

### Setup
- Acesse `/evaluate` como **avaliador**
- Em "Minhas Avaliações", tenha uma avaliação anterior existente
- Prepare um novo valor para editar (ex: mudar 38 → 40)

### Passos
1. Em "Minhas Avaliações", clique em **"✏️ Editar"**
2. Mude um valor (recomendado: Base Points)
3. Clique em **"Atualizar Avaliação"**
4. **Aguarde ~500ms**

### Esperado ✅
```
[ ] Botão muda para "⏳ Enviando..."
[ ] Após ~500ms: Formulário reseta
[ ] ⚠️ Permanece na página /evaluate/[submissionId]
[ ] Novo valor aparece no campo (40 em vez de 38)
[ ] Pode editar novamente se necessário
```

### Console Logs Esperados
```
🔍 [EvaluationForm] handleSubmit - isUpdate prop: true
✅ Avaliação salva: {...}
🔄 [EvaluationForm] UPDATE detectado - fazendo refresh da página...
```

### Se Falhar ❌
- [ ] Ainda mostra valor antigo? → Page não fez refresh
- [ ] Page saiu de /evaluate/[submissionId]? → Não deveria sair (só fazer refresh)
- [ ] Abra console e procure pelo log UPDATE

---

## Checklist Geral

| Scenario | Resultado | ✅/❌ |
|----------|-----------|-----|
| Team Submit - Form desaparece | | |
| Team Submit - Mensagem "Concluída" | | |
| Evaluator NEW - Volta ao dashboard | | |
| Evaluator NEW - Redirect em 50ms | | |
| Evaluator EDIT - Mostra novo valor | | |
| Evaluator EDIT - Permanece na página | | |

---

## Se Algo Não Funcionar

### Passo 1: Limpe Cache
```bash
# No terminal:
npm run build
# Espere completar
```

### Passo 2: Reinicie o Servidor
```bash
# Matá todos os node processes:
# Windows (Power Shell):
Get-Process node | Stop-Process -Force

# Depois:
npm run dev
```

### Passo 3: Verifique Console
- F12 → Console
- Procure por logs vermelhos (erros)
- Procure por logs azuis/amarelos (warnings)

### Passo 4: Verifique Network
- F12 → Network
- Procure por requisições falhadas (status ❌)
- POST /api/evaluate deve retornar 200 OK

---

## Debug Detalhado

### Para Team Submit
1. Vá para `/submit`
2. Selecione quest
3. F12 → Elements
4. Procure pelo elemento `<form>`
5. Após enviar, veja se desaparece do DOM

### Para Evaluator NEW
1. Vá para `/evaluate`
2. Clique "Avaliar"
3. F12 → Application → Cookies
4. Procure por URL (deve estar em `/evaluate/[id]`)
5. Após clique, veja se muda para `/evaluate`

### Para Evaluator EDIT
1. Vá para `/evaluate`
2. Clique "Editar"
3. F12 → Network → XHR
4. Procure por POST /api/evaluate
5. Response deve conter avaliação atualizada
6. Após refresh, form deve mostrar novo valor

---

## Logging Extra (Se Precisar Debug Mais)

Se algo não funcionar, você pode adicionar logs extras temporários:

### SubmissionForm.tsx
```typescript
// Após setIsSubmissionComplete(true)
console.log('DEBUG: isSubmissionComplete agora é:', true)
```

### EvaluationForm.tsx
```typescript
// Antes de router.push()
console.log('DEBUG: Tentando router.push para /evaluate')
console.log('DEBUG: Current pathname:', window.location.pathname)
```

---

## Limpeza de Estado

Se precisar "resetar" para testar novamente:

### Team
- Criar nova quest
- OU resetar submissions via admin panel

### Evaluator
- Deletar avaliações via admin panel (se houver)
- OU usar nova submission

---

## Performance Esperada

| Ação | Tempo |
|------|-------|
| Team Submit → Form desaparece | ~1.5s |
| Evaluator NEW → Redirect | ~50ms |
| Evaluator EDIT → Refresh completo | ~500ms |

Se demorando muito, pode ser:
- Servidor lento (verifique terminal do npm run dev)
- Network ruim (F12 → Network → veja latência)
- API lenta (POST /api/evaluate demorado)

---

## Final Checklist

Antes de marcar como "OK":

- [ ] Team Submit: Form desaparece corretamente
- [ ] Team Submit: "Quest Concluída!" visível
- [ ] Evaluator NEW: Volta ao dashboard em ~50ms
- [ ] Evaluator NEW: Sem delay de som
- [ ] Evaluator EDIT: Novos valores aparecem
- [ ] Evaluator EDIT: Permanece na página individual
- [ ] Console: Todos os logs esperados aparecendo
- [ ] Build: Sem erros ao compilar

---

## Contato / Suporte

Se encontrar bugs:
1. Verifique console logs
2. Tire screenshot da situação
3. Documente os passos para reproduzir
4. Procure por patterns no código

---

## Documentação Relacionada

- [FLUXOS-CORRIGIDOS.md](FLUXOS-CORRIGIDOS.md) - Explicação técnica detalhada
- [RESUMO-MUDANCAS.md](RESUMO-MUDANCAS.md) - Resumo visual das mudanças
- [IMPLEMENTATION-VERIFICATION.md](IMPLEMENTATION-VERIFICATION.md) - Verificação de implementação

---

**Status Final**: ✅ Pronto para testar! 🚀

