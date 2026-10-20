# Palavra do dia

Jogo de palavras em português do Brasil, implementado com React, TypeScript e Vite. O produto usa a direção visual Revista do protótipo e funciona sem conta, servidor de palpites ou coleta de dados.

## Executar

```sh
npm install
npm run dev
```

`npm test` executa os testes do domínio; `npm run build` valida os tipos e gera a versão estática em `dist/`.

## Regras deste MVP

- Dez níveis em sequência, com palavras de 3 a 8 letras e oito tentativas por nível.
- Palpites vêm de um vocabulário editorial local; entradas inválidas ou repetidas não consomem tentativa.
- A comparação ignora acentos, mas a resposta é exibida com a grafia editorial.
- Após cinco erros, a pessoa pode pedir um sinônimo; a dica não consome tentativa.
- Acertar ou esgotar tentativas revela resposta, definição e exemplo; ambos permitem avançar.
- Relações semânticas são uma escala editorial discreta nos dados do jogo, não uma estimativa automática. Quando uma relação não foi cadastrada, a interface informa isso sem inventar uma distância.
- A data do desafio e a troca diária seguem `America/Sao_Paulo`. Este primeiro pacote de conteúdo é uma semente demonstrativa reutilizada até que sejam publicados pacotes editoriais adicionais.
- O conteúdo desse pacote fica em `src/data/daily-packs/2026-10-20.json`, separado das regras do jogo.
- Partida e preferências são guardadas no `localStorage` deste navegador. Sem sincronização entre dispositivos.

As escolhas concretizam decisões que o PRD deixou pendentes; o limite de tentativas e a política semântica devem ser revistos com produto/editoria antes de uma publicação pública.
