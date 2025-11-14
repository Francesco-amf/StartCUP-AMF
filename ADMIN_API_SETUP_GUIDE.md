# Criar Usuários Corretamente via Admin API

## Por Que Isto Funciona

O problema com os scripts SQL é que **não registram o provider corretamente**. O jeito certo é usar a **Admin API do Supabase**, que garante que tudo está configurado corretamente no Auth.

## Passo-a-Passo

### 1. Verificar Dependências

O script usa `@supabase/supabase-js` que provavelmente já está instalado. Mas confirme:

```bash
npm list @supabase/supabase-js
```

Se não está instalado:
```bash
npm install @supabase/supabase-js
```

### 2. Executar o Script

No seu terminal/PowerShell, vá para a pasta do projeto:

```bash
cd c:\Users\symbi\Desktop\startcup-amf\startcup-amf
node create-teams-via-admin-api.js
```

### 3. Resultado Esperado

Você deve ver:

```
🚀 Iniciando criação de equipes via Admin API...

🗑️  Deletando usuários antigos (.local)...
⏳ Criando usuário: visionone@startcup-amf.com...
✅ Usuário criado: visionone@startcup-amf.com
✅ Time registrado: VisionOne

[... para todos os 15 ...]

✅ RESUMO:
✅ Usuários criados com sucesso: 15
❌ Erros: 0

🎉 Agora tente fazer login!
```

### 4. Verificar no Supabase Dashboard

Depois de executar:

1. Abra **Supabase Dashboard**
2. Vá para **Authentication → Users**
3. Procure por `visionone@startcup-amf.com`
4. Verifique que agora tem **"Email"** no Provider type

Deve estar assim:
- Email: visionone@startcup-amf.com
- Provider type: **Email** ✅

### 5. Testar Login

1. Vá para: `http://localhost:3000/login`
2. Email: `visionone@startcup-amf.com`
3. Senha: `VisionOne@2024!`
4. Clique: **Entrar**

Deve funcionar agora! 🎉

## Se der erro

### Erro: "Cannot find module '@supabase/supabase-js'"

Execute:
```bash
npm install @supabase/supabase-js
```

### Erro: "unauthorized"

Significa que a Service Role Key está incorreta. Verifique em:
- **Supabase Dashboard → Settings → API → Service Role Key**
- Copie exatamente
- Atualize no script

### Erro: "User already exists"

Significa que os usuários já foram criados. Isto é normal - o script verifica se já existem.

### Nenhum usuário foi criado

Verifique:
1. Service Role Key está correta
2. Supabase URL está correta
3. Você está online
4. Verifique logs do Supabase: Dashboard → Logs

## Credenciais Finais

Depois de executar com sucesso, os usuários estarão prontos:

| Email | Senha |
|-------|-------|
| visionone@startcup-amf.com | VisionOne@2024! |
| codigosentencial@startcup-amf.com | CodigoSentencial@2024! |
| smartcampus@startcup-amf.com | Smartcampus@2024! |
| geracaof@startcup-amf.com | GeracaoF@2024! |
| sparkup@startcup-amf.com | SparkUp@2024! |
| mistoscom@startcup-amf.com | Mistos.com@2024! |
| cogniverse@startcup-amf.com | Cogniverse@2024! |
| osnotaveis@startcup-amf.com | OsNotaveis@2024! |
| turistando@startcup-amf.com | Turistando@2024! |
| sym@startcup-amf.com | S.Y.M.@2024! |
| gastroproject@startcup-amf.com | Gastroproject@2024! |
| mova@startcup-amf.com | MOVA@2024! |
| aureaforma@startcup-amf.com | AureaForma@2024! |
| lumus@startcup-amf.com | Lumus@2024! |
| mosaico@startcup-amf.com | Mosaico@2024! |

## Por Que Isto Funciona

✅ Usa a Admin API corretamente
✅ Registra o provider como "email"
✅ Confirma email automaticamente
✅ Cria equipes na tabela teams
✅ Garante que tudo está sincronizado

Vs. Scripts SQL que:
❌ Não registram provider corretamente
❌ Deixam email não confirmado
❌ Podem ter bugs de sincronização

## Próximas Vezes

Para criar mais equipes no futuro, use este script. É o jeito certo!
