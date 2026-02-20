# Variáveis Dinâmicas

Agora é possível utilizar variáveis no texto de **Talentos**, **Magias** e **Itens**. Estas variáveis são substituídas automaticamente pelos valores atuais do personagem.

## Lista de Variáveis

### Atributos
*   `@str` (Força Total)
*   `@dex` (Destreza Total)
*   `@con` (Constituição Total)
*   `@int` (Inteligência Total)
*   `@wis` (Sabedoria Total)
*   `@cha` (Carisma Total)

### Modificadores de Atributo
*   `@strMod`
*   `@dexMod`
*   `@conMod`
*   `@intMod`
*   `@wisMod`
*   `@chaMod`

### Combate
*   `@CA` (Classe de Armadura)
*   `@BBA` (Bônus Base de Ataque)
*   `@iniciativa`
*   `@hp` (Pontos de Vida Totais)
*   `@level` (Nível do Personagem)

### Resistências
*   `@fort` (Fortitude)
*   `@ref` (Reflexos)
*   `@will` (Vontade)

## Exemplo de Uso

Ao criar um talento ou magia, digite:
> **Ataque Poderoso (@strMod)**

Se o seu modificador de Força for +3, o texto aparecerá como:
> **Ataque Poderoso (+3)**
