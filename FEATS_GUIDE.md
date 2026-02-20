# Sistema de Talentos Avançado

O sistema de talentos foi atualizado para suportar fichas mais complexas e automação.

## Novos Recursos

Ao adicionar um talento ("Novo Talento"), você agora tem acesso a um formulário completo:

1.  **Título**: Nome do talento.
2.  **Descrição**: Texto explicativo. Suporta variáveis dinâmicas como `@strMod`, `@CA`, `@level`.
3.  **Fórmula de Rolagem**: Opcional. Ex: `1d20 + @BBA`. Aparece com um ícone de dado na lista.
4.  **É um Ataque?**: Se marcado, destaca o talento em vermelho (útil para Ataques Especiais ou Stances).
5.  **Modificadores Ativos**:
    *   Você pode adicionar bônus (ou penalidades) que são aplicados **automaticamente** na ficha.
    *   Exemplo: Se o talento der `+1` na `CA`, selecione `Classe de Armadura (@CA)` e valor `1`.
    *   Sua CA total será atualizada imediatamente.
    *   Alvos suportados: Atributos, CA, HP, BBA, Iniciativa, Deslocamento, Resistências.

## Compatibilidade

Talentos antigos (que eram apenas texto) continuam funcionando normalmente. Eles são exibidos como antes. Você pode removê-los e recriá-los no novo formato se desejar aproveitar os modificadores automáticos.
