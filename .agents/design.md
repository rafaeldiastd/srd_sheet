Maestro Design System Standards
1. Cores e Destaques
Texto Principal: text-lumina-text (Zinc-200)
Texto Muted: text-lumina-text-muted (Zinc-500)
Destaque/Accent: text-lumina-detail (Gold/Beige - #DFD4BD)
Bordas: border-lumina-border (Zinc-800)
Background Cards: bg-lumina-card (Zinc-900/95)
2. Ícones
Todos os ícones devem seguir este padrão, salvo exceções muito específicas (como ilustrações grandes).

Tamanho Padrão: h-4 w-4 (16px) ou h-5 w-5 (20px) para ícones de navegação maior.
Cor: Ícones de título ou destaque devem usar text-lumina-detail ou text-lumina-text quando em botões neutros.
Stroke: Padrão do Lucide (2px).
3. Tipografia
Títulos de Seção/Sidebar:
Fonte: font-serif (Inknut Antiqua ou similar configurada).
Tamanho: text-sm (14px).
Peso: font-bold.
Cor: text-lumina-text.
Exemplo: text-sm font-bold font-serif text-lumina-text
Texto de Corpo:
Fonte: font-sans (Inter/Outfit).
Tamanho: text-sm ou text-xs.
4. Botões e Ações
Botões de Ícone (Ghost/Outline)
Usados para fechar modais, toggles, etc.

Tamanho: h-8 w-8 ou h-9 w-9.
Hover Padrão: hover:text-lumina-text hover:bg-lumina-bg.
Transição: transition-colors.
Cor Base: text-lumina-text-muted.
Exemplo de Botão de Fechar:

<Button variant="ghost" size="icon" class="h-8 w-8 text-lumina-text-muted hover:text-lumina-text hover:bg-lumina-bg">
  <X class="h-4 w-4" />
</Button>
Botões Primários
Background: bg-lumina-text (Invertido) ou bg-lumina-detail.
Texto: text-lumina-bg.
Hover: Opacidade ou leve escala.
5. Espaçamento (Headers de Sidebar)
Padding: p-4.
Altura: h-14 (56px) para headers fixos.
Borda: border-b border-lumina-border.
6. Exemplo de Implementação (Header Padrão)
<div class="h-14 shrink-0 border-b border-lumina-border flex items-center justify-between px-4 bg-lumina-bg/80 backdrop-blur-md">
    <div class="flex items-center gap-2">
        <IconeDaFeature class="h-4 w-4 text-lumina-detail" />
        <span class="text-sm font-bold text-lumina-text font-serif tracking-wide">Título da Feature</span>
    </div>
    <Actions>
        <!-- Botões aqui -->
    </Actions>
</div>