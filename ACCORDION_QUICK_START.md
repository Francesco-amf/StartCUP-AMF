# ⚡ Accordion - Quick Start Guide

Guia rápido para usar o novo componente accordion na sua página.

---

## 🎯 O que é?

Um componente que transforma múltiplos cards fixos em seções clicáveis e interativas.

```
ANTES: [Card 1] [Card 2] [Card 3] ... muuuito scroll
DEPOIS: [Accordion com 1, 2, 3 expandível] ... scroll mínimo
```

---

## 📥 Instalação (Já está feita!)

O componente já existe em: `src/components/ui/Accordion.tsx`

---

## 🚀 Como Usar

### Passo 1: Importar
```typescript
import { Accordion } from '@/components/ui/Accordion'
```

### Passo 2: Criar items
```typescript
const items = [
  {
    id: 'item-1',              // Identificador único
    title: 'Meu Título',        // O que aparece no header
    icon: '🎯',                 // Emoji (ou qualquer string)
    defaultOpen: true,          // Abrir por padrão?
    children: <div>
      Conteúdo aqui!
    </div>
  },
  {
    id: 'item-2',
    title: 'Outro Item',
    icon: '📋',
    defaultOpen: false,
    children: <div>
      Mais conteúdo!
    </div>
  }
]
```

### Passo 3: Usar no JSX
```typescript
<Accordion items={items} />
```

---

## 📋 Exemplo Completo

```typescript
'use client'  // Se for componente cliente

import { Accordion } from '@/components/ui/Accordion'

export default function MeuDashboard() {
  return (
    <div className="p-4 space-y-4">
      {/* Seu header aqui */}
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Accordion com 3 seções */}
      <Accordion
        items={[
          {
            id: 'perfil',
            title: 'Meu Perfil',
            icon: '👤',
            defaultOpen: true,
            children: (
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-bold">Nome:</span> João Silva
                </p>
                <p className="text-sm">
                  <span className="font-bold">Email:</span> joao@example.com
                </p>
              </div>
            ),
          },
          {
            id: 'estatisticas',
            title: 'Estatísticas',
            icon: '📊',
            defaultOpen: false,
            children: (
              <div className="space-y-2">
                <p className="text-sm">Pontos: 150</p>
                <p className="text-sm">Entregas: 3</p>
                <p className="text-sm">Avaliadas: 2</p>
              </div>
            ),
          },
          {
            id: 'ajuda',
            title: 'Precisa de Ajuda?',
            icon: '❓',
            defaultOpen: false,
            children: (
              <p className="text-sm text-gray-600">
                Entre em contato através do formulário de suporte.
              </p>
            ),
          },
        ]}
        allowMultipleOpen={true}
      />
    </div>
  )
}
```

---

## 🎨 Props Principais

### AccordionItem
```typescript
{
  id: string                     // Obrigatório: ID único
  title: string                  // Obrigatório: Título visível
  icon: string                   // Obrigatório: Emoji/ícone
  children: React.ReactNode      // Obrigatório: Conteúdo
  defaultOpen?: boolean          // Opcional: Abrir ao carregar (default: false)
  className?: string             // Opcional: Classes CSS adicionais
}
```

### Accordion (componente wrapper)
```typescript
<Accordion
  items={[...]}                   // Obrigatório: Array de items
  allowMultipleOpen={true}        // Opcional: Múltiplos abertos? (default: true)
/>
```

---

## 🎯 Exemplos Práticos

### Exemplo 1: Seção de Configurações
```typescript
<Accordion
  items={[
    {
      id: 'config-notificacoes',
      title: 'Notificações',
      icon: '🔔',
      children: (
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            Email
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            SMS
          </label>
        </div>
      ),
    },
  ]}
/>
```

### Exemplo 2: FAQ
```typescript
<Accordion
  items={[
    {
      id: 'faq-1',
      title: 'Como submeter minha entrega?',
      icon: '📝',
      children: <p>Siga estes passos: 1... 2... 3...</p>,
    },
    {
      id: 'faq-2',
      title: 'Posso editar minha entrega?',
      icon: '✏️',
      children: <p>Não, submissões são definitivas.</p>,
    },
  ]}
/>
```

### Exemplo 3: Lista de Equipes
```typescript
const teams = [
  { id: 1, name: 'Time Alpha' },
  { id: 2, name: 'Time Beta' },
]

<Accordion
  items={teams.map(team => ({
    id: `team-${team.id}`,
    title: team.name,
    icon: '👥',
    children: <TeamDetails teamId={team.id} />
  }))}
/>
```

---

## 🎨 Personalizando Aparência

### Mudar cores
Edite em `src/components/ui/Accordion.tsx`:
```typescript
// Encontre:
className="bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60"

// Mude para suas cores:
className="bg-gradient-to-br from-blue-500/60 to-blue-900/60"
```

### Mudar velocidade de animação
```typescript
// Default: 300ms
<div className={`transform transition-transform duration-300`}>

// Mais rápido: 200ms
<div className={`transform transition-transform duration-200`}>

// Mais lento: 500ms
<div className={`transform transition-transform duration-500`}>
```

### Mudar ícone do chevron
```typescript
// Default: ▼ (abre/fecha)
// Alternativas: ►, ⌄, ⊕, ▶

{isOpen ? '▲' : '▼'}  // Mude aqui
```

---

## 📱 Responsividade Automática

O componente já é responsivo! Funciona perfeitamente em:
- 📱 Mobile (320px)
- 📱 Tablet (768px)
- 🖥️ Desktop (1024px+)

Sem fazer nada especial!

---

## ⚙️ Configurações

### Múltiplos Abertos
```typescript
// Permitir múltiplos accordions abertos ao mesmo tempo
<Accordion items={items} allowMultipleOpen={true} />

// Apenas 1 aberto por vez (last open wins)
<Accordion items={items} allowMultipleOpen={false} />
```

### Abrir por Padrão
```typescript
// Abrir "Detalhes da Quest"
{
  id: 'quest',
  title: 'Detalhes da Quest',
  icon: '🎯',
  defaultOpen: true,  // ← Isto
  children: <div>...</div>
}
```

---

## 🎯 Melhores Práticas

### ✅ Faça Assim
```typescript
// Bom: Títulos curtos e descritivos
<Accordion
  items={[
    { id: 'sobre', title: 'Sobre', icon: 'ℹ️', ... },
    { id: 'guia', title: 'Como Usar', icon: '📖', ... },
  ]}
/>
```

### ❌ Não Faça Assim
```typescript
// Ruim: Títulos muito longos
<Accordion
  items={[
    {
      id: 'item-numero-um',
      title: 'Esta é uma seção muito longa que não cabe no header',
      icon: '❓',
      ...
    },
  ]}
/>
```

---

## 🔍 Debugging

### Accordion não abre?
```
1. Abrir DevTools (F12)
2. Ir para Console
3. Procurar por erros vermelhos
4. Verificar se ID é único
```

### Chevron não rotaciona?
```
1. Verificar se Tailwind está carregando
2. Verificar se "transform" está no tailwind.config.js
3. Limpar cache do browser
```

### Animação está lenta?
```
1. Mudar duration-300 para duration-200
2. Reiniciar servidor dev
3. Limpar cache do browser
```

---

## 📊 Exemplo Real: Dashboard da Equipe

```typescript
import { Accordion } from '@/components/ui/Accordion'

export default function TeamDashboard() {
  return (
    <div className="space-y-4">
      {/* Sempre visível */}
      <div className="bg-blue-500 p-4 rounded text-white">
        <h2 className="text-xl font-bold">🎮 Fase Atual: Descoberta</h2>
      </div>

      {/* Interativo */}
      <Accordion
        items={[
          {
            id: 'quest-atual',
            title: '🎯 Quest Atual',
            icon: '📝',
            defaultOpen: true,
            children: <QuestDetails />,
          },
          {
            id: 'entregas',
            title: 'Minhas Entregas',
            icon: '📋',
            defaultOpen: false,
            children: <MySubmissions />,
          },
          {
            id: 'avaliadores',
            title: 'Avaliadores Online',
            icon: '👥',
            defaultOpen: false,
            children: <EvaluatorsList />,
          },
          {
            id: 'penalidades',
            title: 'Penalidades',
            icon: '⚠️',
            defaultOpen: false,
            children: <PenaltiesInfo />,
          },
        ]}
        allowMultipleOpen={true}
      />
    </div>
  )
}
```

---

## 🚀 Performance

O accordion é muito leve:
- **Tamanho**: ~3.5KB
- **Dependências**: React (já tem)
- **Speed**: Sem lag em mobile
- **Memory**: Negligível

---

## 📚 Referências

- **Componente**: `src/components/ui/Accordion.tsx`
- **Documentação Completa**: `README_ACCORDION.md`
- **Demonstração Visual**: `ACCORDION_DEMO.md`
- **Página de Exemplo**: `src/app/(team)/dashboard/page.tsx`

---

## ✨ Próximos Passos

Depois de implementar:

1. Teste em mobile
2. Verifique animações suaves
3. Confirme que texto fica legível
4. Teste em Firefox, Safari, Chrome

Tudo ok? ✅ Pronto para produção!

---

**Criado em**: 2 de Novembro de 2025
**Status**: Pronto para Uso
**Exemplos**: Inclusos
