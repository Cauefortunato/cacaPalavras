# PRD - Jogo Diário de Adivinhação de Palavras

**Status:** Rascunho v0.1  
**Plataforma inicial:** navegador para computador  
**Público-alvo:** jovens e adolescentes de 13 a 20 anos  
**Idioma inicial:** português do Brasil

## 1. Visão do produto

Criar um jogo casual de navegador que ajude jovens a praticar vocabulário em português do Brasil por meio de desafios diários temáticos. O jogador descobre palavras usando pistas sobre as letras e sobre a proximidade de significado, avança por níveis de dificuldade e pode consultar dicas opcionais.

O jogo deve ser acessível sem cadastro, não punir a ausência em dias consecutivos e oferecer uma experiência simples para jogar no computador.

## 2. Objetivos

- Oferecer um desafio diário curto e temático.
- Incentivar a descoberta e a aprendizagem de vocabulário.
- Apresentar uma progressão de dificuldade baseada no tamanho das palavras.
- Permitir que o jogador retome uma partida sem perder o progresso.

## 3. Público e plataforma

- **Público:** jovens e adolescentes entre 13 e 20 anos.
- **Plataforma:** navegador em computador.
- **Fora do escopo inicial:** experiência otimizada para celular, cadastro, recursos sociais e anúncios.

## 4. Estrutura e regras do jogo

- Cada desafio diário contém 10 palavras relacionadas a um tema do dia.
- As palavras são apresentadas em sequência, com uma palavra por nível. Avançar desbloqueia o próximo nível.
- O tamanho das palavras aumenta gradualmente conforme o jogador avança.
- O limite de tentativas é igual em todos os níveis. O número exato ainda precisa ser definido.
- Após cada palpite válido, o jogo informa quais letras estão na palavra e se estão na posição correta, além de fornecer uma indicação de proximidade de significado.
- Ao completar cinco erros em um desafio, o jogador pode escolher receber uma dica em forma de sinônimo.
- Ao resolver ou encerrar um desafio, o jogo revela a resposta. Exibir também o significado e um exemplo de uso é uma proposta para reforçar o aprendizado.
- O jogador deve poder sair e retomar o progresso do desafio diário.

## 5. Requisitos funcionais

### RF-01 - Desafio diário temático

O sistema deve apresentar o tema do dia e disponibilizar 10 desafios de palavras associados a esse tema.

### RF-02 - Progressão por níveis

Os desafios devem ser organizados em níveis sequenciais. A progressão deve aumentar o tamanho das palavras e desbloquear o nível seguinte conforme o jogador avança. O critério exato de avanço precisa ser definido.

### RF-03 - Palpites e validação

O sistema deve aceitar palavras válidas conforme o vocabulário selecionado para português do Brasil. Palpites que não pertençam ao vocabulário aceito devem receber uma mensagem clara e não consumir tentativas.

### RF-04 - Feedback de letras

Após cada palpite válido, o sistema deve indicar letras corretas na posição correta e letras presentes na palavra em outra posição. O tratamento de letras repetidas e acentuadas precisa ser definido antes da implementação.

### RF-05 - Feedback semântico

Após cada palpite válido, o sistema deve indicar a proximidade de significado entre o palpite e a resposta. A forma visual e a fonte dos dados semânticos ainda precisam ser definidas.

### RF-06 - Dica opcional

Após cinco erros no mesmo desafio, o jogador deve poder solicitar uma dica em forma de sinônimo. Ainda é necessário decidir se a dica consome uma tentativa.

### RF-07 - Encerramento e aprendizado

Ao acertar ou encerrar um desafio, o sistema deve revelar a resposta. Exibir definição e exemplo de uso é uma proposta a confirmar.

### RF-08 - Progresso e estatísticas

O sistema deve salvar o progresso e as estatísticas localmente no navegador, sem exigir uma conta. A ausência em um ou mais dias não deve apagar o histórico nem bloquear o próximo desafio. As estatísticas exatas ainda precisam ser escolhidas.

### RF-09 - Preferências visuais

O jogador deve poder ajustar o tamanho do texto e alternar entre tema claro e tema escuro. As preferências devem permanecer salvas no navegador.

## 6. Conteúdo e idioma

- O idioma inicial é português do Brasil.
- As respostas e os palpites aceitos devem respeitar a gramática e a ortografia do português brasileiro.
- A lista de palavras deve ser revisada para evitar respostas excessivamente obscuras ou ambíguas para o público-alvo.
- Regras para acentos, cedilha, formas verbais, plurais, nomes próprios e letras repetidas ainda precisam ser definidas.
- Os temas diários e as relações de sinonímia/proximidade semântica precisam ser preparados ou validados editorialmente.

## 7. Requisitos não funcionais

- O jogo deve funcionar nos principais navegadores para computador.
- O estado da partida deve ser preservado ao atualizar ou reabrir o navegador.
- O jogo não deve exigir cadastro.
- As respostas corretas do dia não devem ser reveladas antes do encerramento do desafio.
- O tamanho do texto e os temas claro/escuro devem ser utilizáveis em todas as telas do jogo.

## 8. Critérios de aceite iniciais

- O jogador consegue iniciar e jogar sem criar uma conta.
- O desafio do dia apresenta um tema e até 10 palavras organizadas em níveis.
- Palpites válidos recebem feedback de letras e de proximidade semântica.
- Palpites inválidos não consomem tentativas.
- A opção de sinônimo aparece após cinco erros no desafio correspondente.
- Todos os níveis usam o mesmo limite de tentativas.
- O jogador consegue retomar uma partida após atualizar ou fechar e reabrir o navegador.
- Perder um dia não apaga estatísticas nem impede jogar o desafio atual.
- O jogador consegue alterar o tamanho do texto e alternar entre os temas claro e escuro.

## 9. Métricas propostas

As métricas finais precisam ser escolhidas. Opções alinhadas aos objetivos do jogo:

- Desafios iniciados e concluídos por dia.
- Taxa de conclusão das palavras e dos níveis.
- Número médio de tentativas por palavra.
- Frequência de uso da dica.
- Retorno voluntário ao jogo, sem transformar sequência diária em punição.

Como o jogo não terá cadastro, métricas agregadas de uso exigiriam uma decisão explícita sobre coleta de dados e privacidade. Não coletar dados pessoais é a opção inicial recomendada.

## 10. Decisões pendentes

1. Quantas tentativas cada palavra permite? Proposta inicial: 8, para que a dica apareça após cinco erros e ainda restem tentativas.
2. Confirmar se as 10 palavras diárias correspondem a 10 níveis jogados em sequência.
3. Definir o menor e o maior tamanho de palavra. Proposta inicial: começar em 3 letras e aumentar gradualmente até 8.
4. Definir o que significa avançar quando o jogador não acerta a palavra: revelar a resposta e permitir continuar, ou exigir acerto para desbloquear o próximo nível.
5. Definir como apresentar proximidade semântica: ranking, barra ou categorias como “perto” e “longe”. Também definir como os dados semânticos serão produzidos e revisados.
6. Definir se a dica de sinônimo consome uma tentativa.
7. Confirmar se serão exibidos significado e exemplo de uso após cada palavra.
8. Definir as estatísticas mostradas ao jogador.
9. Definir regras para acentuação, cedilha, letras repetidas, flexões e validação de palavras.
10. Definir como identificar a virada do dia para o desafio diário, incluindo fuso horário.

## 11. Referências da pesquisa

- G1, cobertura sobre Wordle e Termo: https://g1.globo.com/pop-arte/games/noticia/2022/01/19/wordle-e-termo-historia-de-amor-se-transformou-em-jogo-de-palavras-que-e-sensacao-em-2022.ghtml
- Contexto, referência de jogo de proximidade semântica: https://contexto.me/
- Semantle, referência de jogo de proximidade semântica: https://semantle.com/
- Game Accessibility Guidelines: https://gameaccessibilityguidelines.com/basic/
- WCAG 2.2, uso de cores: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- WCAG 2.2, contraste mínimo: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Nielsen Norman Group, heurísticas de usabilidade: https://www.nngroup.com/articles/ten-usability-heuristics/
