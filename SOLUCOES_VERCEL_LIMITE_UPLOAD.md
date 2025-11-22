# 🚀 Soluções para Limite de Upload no Vercel Gratuito

## Problema
Vercel Free Tier tem limite **4.5MB** em request body que **NÃO pode ser alterado** via config.

---

## ✅ SOLUÇÃO 1: Upload Direto ao Supabase Storage (RECOMENDADO)

### Como funciona:
1. **Frontend** gera URL signed do Supabase
2. **Frontend** faz upload direto para Supabase Storage
3. **Frontend** chama API apenas com referência do arquivo (100 bytes)
4. API cria registro no BD

### Vantagens:
- ✅ Sem limite (Supabase Free = 1GB)
- ✅ Mais rápido (direto para storage)
- ✅ Menos carga no servidor
- ✅ Menos custos de bandwidth Vercel

### Implementação:
```typescript
// 1. Frontend pede token assinado
const { data, error } = await supabase
  .storage
  .from('submissions')
  .createSignedUploadUrl('submissions/' + filename)

// 2. Frontend faz upload direto
fetch(data.signedUrl, {
  method: 'PUT',
  body: file,
  headers: { 'content-type': file.type }
})

// 3. Frontend chama API apenas com path
fetch('/api/submissions/create', {
  method: 'POST',
  body: JSON.stringify({
    questId,
    teamId,
    file_path: 'submissions/...' // Apenas string!
  })
})
```

---

## ✅ SOLUÇÃO 2: Chunked Upload (Upload em Pedaços)

### Como funciona:
1. Frontend divide arquivo em chunks de 1MB
2. Envia cada chunk em request separada (< 4.5MB)
3. API recebe e reconstrói no Supabase Storage

### Vantagens:
- ✅ Permite upload de qualquer tamanho
- ✅ Tolerante a falhas (retry apenas chunk com erro)
- ✅ Mostra progress bar ao usuário

### Implementação:
```typescript
const CHUNK_SIZE = 1024 * 1024 // 1MB

for (let i = 0; i < file.size; i += CHUNK_SIZE) {
  const chunk = file.slice(i, i + CHUNK_SIZE)
  const formData = new FormData()
  formData.append('file', chunk)
  formData.append('chunkIndex', Math.floor(i / CHUNK_SIZE))
  formData.append('totalChunks', Math.ceil(file.size / CHUNK_SIZE))
  formData.append('fileId', uniqueId) // Para rastrear upload
  
  await fetch('/api/submissions/upload-chunk', { method: 'POST', body: formData })
}
```

---

## ✅ SOLUÇÃO 3: AWS S3 / Google Cloud Storage

### Como funciona:
- Usar bucket externo em vez de Supabase Storage
- Supabase gera URL pré-assinada para upload
- Frontend faz upload direto para cloud

### Vantagens:
- ✅ Escalável para terabytes
- ✅ Melhor performance globalmente
- ✅ Menos carga em BD

### Implementação:
```typescript
// Via Supabase RPC que retorna pre-signed URL
const { data: presignedUrl } = await supabase
  .rpc('get_presigned_upload_url', {
    bucket: 'submissions',
    filename: 'submissions/' + file.name
  })

// Frontend faz upload direto
fetch(presignedUrl, {
  method: 'PUT',
  body: file,
})
```

---

## ✅ SOLUÇÃO 4: Compressão + Proxy Local

### Como funciona:
1. Frontend comprime arquivo (ZIP, gzip)
2. Envia versão comprimida via Vercel
3. API descompacta e salva

### Vantagens:
- ✅ Rápido de implementar
- ✅ Reduz banda em 70-90%

### Desvantagens:
- ❌ Ainda limitado a 4.5MB comprimido
- ❌ PDFs de 6MB mesmo comprimidos viram 5-5.5MB

---

## 📊 Comparação das Soluções

| Solução | Implementação | Limite | Custo | Velocidade |
|---------|--------------|--------|-------|-----------|
| **1. Upload Direto (Supabase)** | 🟢 Média | ✅ 1GB | 💰 Grátis | ⚡ Rápido |
| **2. Chunked Upload** | 🟡 Complexa | ✅ Ilimitado | 💰 Grátis | ⚠️ Mais lento |
| **3. S3/GCS** | 🟡 Complexa | ✅ Ilimitado | 💰 Pago | ⚡ Rápido |
| **4. Compressão** | 🟢 Simples | ❌ ~4.5MB | 💰 Grátis | ⚠️ + CPU |

---

## 🎯 RECOMENDAÇÃO

### Para você: **Solução 1 (Upload Direto Supabase)**

**Por quê?**
- ✅ Sem limite (1GB no Free Plan)
- ✅ Mais rápido que passar por Vercel
- ✅ Já usa Supabase, sem nova dependência
- ✅ Fácil implementar

---

## 📝 Implementação da Solução 1

### Step 1: Criar função RPC para gerar signed URL

```sql
-- No Supabase SQL
CREATE OR REPLACE FUNCTION get_upload_signed_url(
  bucket_name TEXT,
  file_path TEXT,
  expires_in_seconds INT DEFAULT 3600
)
RETURNS JSON AS $$
DECLARE
  signed_url TEXT;
BEGIN
  SELECT signed_url INTO signed_url
  FROM storage.uploads
  WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = bucket_name)
  LIMIT 1;
  
  -- Usar Supabase Auth para gerar URL
  RETURN json_build_object(
    'signedUrl', 'https://...' || file_path,
    'filePath', file_path
  );
END;
$$ LANGUAGE plpgsql;
```

### Step 2: Frontend pede URL assinada

```typescript
// SubmissionForm.tsx
const requestUploadUrl = async (filename: string) => {
  const { data, error } = await supabase
    .storage
    .from('submissions')
    .createSignedUploadUrl(`submissions/${teamId}/${questId}/${Date.now()}-${filename}`)
  
  if (error) throw error
  return data
}

// Upload arquivo direto
const uploadFile = async (file: File, signedUrl: string) => {
  const response = await fetch(signedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'content-type': file.type,
    },
  })
  
  if (!response.ok) throw new Error('Upload falhou')
  return response
}
```

### Step 3: API cria apenas o registro

```typescript
// route.ts - MUITO MAIS LEVE
export async function POST(request: Request) {
  const body = await request.json() // Apenas JSON!
  
  const { questId, teamId, filePath, deliverableType, content } = body
  
  // Insert no BD referenciando arquivo que já está em Storage
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      quest_id: questId,
      team_id: teamId,
      file_path: filePath, // Referência ao arquivo
      content: content,
      deliverable_type: deliverableType,
    })
  
  return NextResponse.json({ success: true })
}
```

---

## 🔒 Segurança

### Importante:
```typescript
// Validar no RPC antes de permitir upload
CREATE OR REPLACE FUNCTION validate_submission_before_upload(
  p_team_id UUID,
  p_quest_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se equipe pode submeter
  -- Verificar deadline
  -- Retornar true/false
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

// Frontend chama RPC antes de pedir signed URL
const { data: canUpload } = await supabase
  .rpc('validate_submission_before_upload', {
    p_team_id: teamId,
    p_quest_id: questId
  })

if (!canUpload) throw new Error('Não pode submeter')
```

---

## 📈 Próximos Passos

1. ✅ Implementar Solução 1 (Upload Direto)
2. ✅ Testar com PDF 6MB
3. ✅ Medir performance (deve ser mais rápido)
4. ✅ Remover validação de 100MB do Vercel (já não será usada)

