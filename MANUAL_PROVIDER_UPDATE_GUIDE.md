# Atualizar Provider Manualmente no Supabase

## Passo 1: Abrir a tabela auth.users no Supabase

1. Vá para **Supabase Dashboard**
2. Selecione seu projeto **StartCup AMF**
3. Clique em **SQL Editor** (ou **Table Editor**)
4. Se usar **Table Editor**: selecione a tabela `auth` → `users`
5. Se usar **SQL Editor**: execute uma query para ver os usuários

## Passo 2: Localizar um usuário da equipe

Procure por: `visionone@startcup-amf.com`

## Passo 3: Editar o campo raw_app_meta_data

1. Clique no usuário para abrir os detalhes
2. Localize o campo `raw_app_meta_data`
3. Clique para editar
4. **SUBSTITUIR** o conteúdo por:

```json
{"provider":"email","providers":["email"]}
```

## Passo 4: Salvar

1. Clique em **Save** ou **Update**
2. Confirme

## Passo 5: Repetir para os outros 14 usuários

Repita os passos 2-4 para cada um:
- visionone@startcup-amf.com
- codigosentencial@startcup-amf.com
- smartcampus@startcup-amf.com
- geracaof@startcup-amf.com
- sparkup@startcup-amf.com
- mistoscom@startcup-amf.com
- cogniverse@startcup-amf.com
- osnotaveis@startcup-amf.com
- turistando@startcup-amf.com
- sym@startcup-amf.com
- gastroproject@startcup-amf.com
- mova@startcup-amf.com
- aureaforma@startcup-amf.com
- lumus@startcup-amf.com
- mosaico@startcup-amf.com

## Verificação via SQL

Depois de atualizar todos manualmente, execute esta query para confirmar:

```sql
SELECT email, raw_app_meta_data->>'provider' as provider
FROM auth.users
WHERE email LIKE '%@startcup-amf.com'
ORDER BY email;
```

Todos devem mostrar `provider: email`

## Depois de Atualizar

1. Vá para a página de login
2. Limpe cache do navegador (Ctrl+Shift+Delete)
3. Tente fazer login com: `visionone@startcup-amf.com` / `VisionOne@2024!`
4. Deve funcionar agora!

---

## Alternativa Mais Rápida: Script SQL com UPDATE BY EMAIL

Se preferir uma solução mais rápida, execute este SQL:

```sql
-- Atualizar CADA usuário individualmente
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  raw_app_meta_data,
  '{provider}',
  '"email"'
)
WHERE email = 'visionone@startcup-amf.com';

UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  raw_app_meta_data,
  '{provider}',
  '"email"'
)
WHERE email = 'codigosentencial@startcup-amf.com';

-- ... e assim por diante para os outros 13
```

Isto atualiza o campo `provider` preservando o resto do JSON.
