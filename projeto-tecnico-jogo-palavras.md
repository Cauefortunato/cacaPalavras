# Projeto Técnico - Jogo Diário de Palavras

**Versão:** 0.1  
**Status:** proposta técnica baseada no PRD e no protótipo Revista  
**PRD:** [PRD-jogo-palavras.md](PRD-jogo-palavras.md)  
**Protótipo visual:** [prototipos-interface.html](prototipos-interface.html)

## 1. Resumo executivo

Implementar um jogo de navegador para computador, em português do Brasil, com dez desafios diários temáticos e progressão por níveis. A interface seguirá a direção visual **Revista de repertório**: hierarquia editorial, tabuleiro central, percurso de níveis na lateral e pistas semânticas num painel auxiliar.

A proposta para o MVP é uma aplicação estática em React, TypeScript e Vite. O jogo não exige conta, não envia palpites a um servidor e não coleta dados pessoais. O conteúdo do desafio, incluindo as relações semânticas preparadas para ele, é publicado em arquivos estáticos versionados. O progresso e as preferências ficam no navegador.

Essa arquitetura reduz custo operacional e respeita o requisito de privacidade. Há uma ressalva importante: como as respostas precisam ser entregues ao cliente para a lógica do jogo funcionar sem servidor, uma pessoa tecnicamente experiente pode inspecionar os arquivos e descobrir palavras futuras. O produto não tem competição ou compartilhamento social no escopo atual, portanto a proposta privilegia simplicidade em vez de proteção contra trapaça.

## 2. Objetivos técnicos

- Entregar uma partida diária sem login e sem dependência de dados pessoais.
- Preservar partida, estatísticas locais e preferências entre visitas ao mesmo navegador.
- Manter regras de jogo testáveis sem depender da interface.
- Garantir que as pistas de letras sejam determinísticas e que a proximidade semântica venha de dados preparados e revisados.
- Reproduzir a hierarquia visual Revista em diferentes larguras desktop, sem perder teclado, leitor de tela ou ampliação de texto.
- Permitir corrigir conteúdo e publicar novos desafios sem alterar a lógica do jogo.

## 3. Escopo e pressupostos

### Incluído no MVP

- Dez palavras relacionadas ao tema do dia, organizadas em sequência.
- Um nível ativo por vez; os níveis seguintes ficam bloqueados até o critério de avanço ser cumprido.
- O tamanho das palavras aumenta ao longo dos níveis; o limite de tentativas permanece igual.
- Feedback após cada palpite válido: posição das letras e proximidade de significado.
- Dica opcional de sinônimo após cinco erros no nível.
- Revelação da resposta e, se confirmado editorialmente, definição e exemplo de uso.
- Estatísticas e retomada salvas localmente, sem penalidade por faltar um dia.
- Ajuste de texto, temas claro/escuro, operação por teclado e suporte a leitores de tela.

### Fora do escopo inicial

- Aplicativos nativos, experiência otimizada para celular, cadastro, sincronização entre dispositivos, multiplayer, placares públicos, feed social, anúncios e compras.
- Proteção criptográfica das respostas contra inspeção do pacote publicado.
- Personalização ou dificuldade adaptativa baseada em perfil do jogador.

### Pressupostos ainda sujeitos a confirmação

- O limite de oito tentativas usado no protótipo é apenas uma proposta; o PRD ainda não fechou o número.
- O protótipo apresenta 10 níveis diários sequenciais. Confirmar se essa interpretação de “10 palavras” está correta.
- Proposta inicial de tamanho: 3 a 8 letras, aumentando ao longo dos níveis.
- Proposta de não punir falhas: ao terminar as tentativas, revelar a resposta e permitir continuar para o próximo nível. O critério de desbloqueio ainda está pendente.
- O protótipo sugere definição e exemplo de uso. Confirmar se ambos entram no MVP.

## 4. Arquitetura proposta

### 4.1 Stack

- **Aplicação:** React + TypeScript com compilação pelo Vite.
- **Estilos:** CSS com propriedades customizadas para tokens visuais; sem biblioteca de componentes no MVP.
- **Conteúdo:** arquivos JSON versionados, separados por data de desafio.
- **Persistência:** `localStorage`, com chave versionada e validação do conteúdo lido.
- **Hospedagem:** hospedagem estática via HTTPS, por exemplo em um serviço de páginas estáticas.
- **Testes:** Vitest para funções puras, Testing Library para componentes, Playwright para fluxos de navegador e axe-core para verificações automatizadas de acessibilidade.

O PRD e os arquivos do workspace ainda não fixam uma stack. Esta combinação é uma recomendação de baixo atrito, não uma restrição já aprovada.

### 4.2 Fronteiras

```text
Navegador
├── Interface React
│   ├── Shell e preferências
│   ├── Progresso dos 10 níveis
│   ├── Tabuleiro e entrada de palpite
│   ├── Feedback de letras e significado
│   └── Dica e encerramento
├── Domínio do jogo (TypeScript puro)
│   ├── Normalização e validação
│   ├── Avaliação das letras
│   ├── Consulta de proximidade semântica
│   ├── Transições de estado e desbloqueio
│   └── Estatísticas
├── Conteúdo estático versionado
│   ├── Desafio por data e tema
│   ├── Vocabulário aceito
│   ├── Definições, exemplos e sinônimos
│   └── Índices semânticos pré-calculados
└── Persistência local
    ├── Progresso do desafio atual
    ├── Estatísticas sem sequência punitiva
    └── Preferências visuais
```

A interface não deve implementar diretamente regras de acerto, contagem de erros ou desbloqueio. Ela envia ações ao domínio e apresenta o estado resultante. Assim, a mesma regra pode ser testada sem renderizar a tela.

### 4.3 Organização sugerida

```text
src/
  app/
    App.tsx
    routes.ts
  components/
    AppHeader.tsx
    LevelProgress.tsx
    GuessBoard.tsx
    GuessForm.tsx
    SemanticClue.tsx
    HintPanel.tsx
    ResultsPanel.tsx
    SettingsControls.tsx
  features/game/
    game-types.ts
    game-engine.ts
    letter-feedback.ts
    semantic-feedback.ts
    progression.ts
    statistics.ts
  features/content/
    daily-pack.ts
    content-loader.ts
    word-normalization.ts
  features/persistence/
    local-save.ts
    save-migrations.ts
  styles/
    tokens.css
    base.css
    editorial.css
    accessibility.css
  data/
    lexicon/
    daily-packs/
      2026-10-13.json
  tests/
    fixtures/
```

A estrutura é uma proposta para o início da implementação; pode ser reduzida se o projeto continuar muito pequeno. As responsabilidades e limites entre interface, domínio e conteúdo devem ser mantidos.

## 5. Modelo de conteúdo

Cada pacote diário deve ter versão de esquema e dados revisáveis. Exemplo conceitual:

```json
{
  "schemaVersion": 1,
  "date": "2026-10-13",
  "locale": "pt-BR",
  "timezone": "America/Sao_Paulo",
  "theme": {
    "id": "natureza",
    "title": "Trilha da natureza"
  },
  "attemptLimit": 8,
  "levels": [
    {
      "id": "nivel-01",
      "order": 1,
      "answer": "SOL",
      "acceptedGuessLength": 3,
      "definition": "Definição editorial revisada.",
      "example": "Exemplo de uso em uma frase.",
      "hintSynonym": "Sinônimo revisado.",
      "semanticIndexId": "natureza-01-v1"
    }
  ]
}
```

`attemptLimit`, `answer` e `acceptedGuessLength` no exemplo são campos de demonstração. O limite real e os critérios de conteúdo ainda precisam ser aprovados. Em produção, o comprimento deve ser calculado a partir da resposta normalizada, salvo se houver uma regra editorial explícita diferente.

### 5.1 Vocabulário e grafia

- O pacote deve declarar o locale `pt-BR`.
- A normalização deve operar por pontos de código Unicode, aplicar normalização Unicode (NFD), remover marcas diacríticas para comparação quando essa regra for aprovada e converter a forma comparada para maiúsculas.
- A forma exibida continua sendo a grafia canônica, com acentos e cedilha quando aplicável.
- A aceitação de palavras sem acento como equivalentes, flexões verbais, plurais, nomes próprios e palavras compostas ainda precisa de uma política editorial. Recomenda-se aceitar entrada sem acento quando a palavra canônica tem acento, sem remover o acento da resposta exibida.
- Letras repetidas exigem algoritmo em duas passagens: primeiro marcar correspondências na posição correta; depois consumir apenas as ocorrências restantes para marcar letras presentes em posição diferente. Isso evita indicar ocorrências inexistentes.
- Palpites duplicados devem ser rejeitados sem consumir tentativa. Palpites fora do vocabulário ou do comprimento esperado também não devem contar como erro.

### 5.2 Validação semântica

A pista de significado não deve ser simulada por semelhança de letras. Para o MVP, recomenda-se preparar um índice por resposta diária:

1. Manter um vocabulário aceito e estável para o jogo.
2. Calcular fora do navegador a similaridade de cada palavra aceita com cada resposta, usando um modelo de palavras em português cuja licença e origem tenham sido verificadas.
3. Ordenar as palavras por proximidade e converter os resultados em faixas compreensíveis, como “distante”, “relação ampla”, “perto” e “muito perto”.
4. Revisar manualmente sinônimos e os palpites mais próximos, incluindo exemplos em que o modelo confunde polissemia, contexto ou variantes regionais.
5. Publicar só o índice do pacote diário; evitar carregar índices de dias futuros desnecessariamente.

Para 10 respostas e um vocabulário aceito com dezenas de milhares de entradas, um índice compacto de ranks por resposta é viável, mas o tamanho real deve ser medido após compressão e teste de carregamento. Se o conjunto aceito for maior ou o índice ficar pesado, comparar duas alternativas antes de implementar: uma API sem conta que não armazene palpites, ou um vocabulário de entrada mais restrito. A escolha deve equilibrar qualidade das pistas, desempenho, privacidade e custo operacional.

O ranking é relativo ao vocabulário aceito, não uma probabilidade absoluta de significado. Portanto, a interface deve usar rótulos e uma escala discreta; não exibir precisão decimal nem apresentar o valor como verdade linguística.

## 6. Modelo de domínio e ciclo de jogo

### 6.1 Tipos conceituais

- `DailyPack`: data, locale, tema, limite de tentativas e níveis.
- `LevelDefinition`: ordem, resposta, tamanho, definição, exemplo, sinônimo e referência ao índice semântico.
- `GuessRecord`: texto normalizado, data/hora local opcional, estados das letras, faixa semântica e resultado.
- `LevelProgress`: palpites, erros válidos, dica revelada, status e data de conclusão.
- `DailyProgress`: identificador/data do pacote, nível atual, níveis concluídos e estatísticas da sessão.
- `PlayerPreferences`: tema visual e escala de texto.

Não salvar identificador pessoal, nome, e-mail ou perfil. Estatísticas ficam no dispositivo e podem ser apagadas pelo usuário limpando os dados do navegador; uma ação explícita de reinicialização pode ser avaliada posteriormente.

### 6.2 Estados

O domínio deve representar ao menos estes estados:

- `ready`: desafio carregado, nenhuma tentativa no nível ativo.
- `playing`: aceitando palpites.
- `hint-available`: cinco erros válidos alcançados; dica pode ser solicitada.
- `hint-revealed`: sinônimo já mostrado.
- `solved`: resposta correta encontrada.
- `exhausted`: limite de tentativas alcançado sem acerto.
- `completed`: todos os níveis do pacote foram encerrados.

Transições principais:

```text
ready → playing
playing → playing                 palpite válido incorreto
playing → hint-available          quinto erro válido
hint-available → hint-revealed    jogador solicita sinônimo
playing → solved                  palpite correto
playing → exhausted               limite de tentativas atingido
solved/exhausted → próximo nível   conforme regra de avanço aprovada
último nível encerrado → completed
```

Entradas inválidas ou duplicadas não avançam o estado nem consomem tentativas. A dica não deve aparecer automaticamente; o jogador inicia a ação. Se ela consome uma tentativa é uma decisão pendente, portanto o motor deve receber essa regra por configuração em vez de fixá-la em vários componentes.

### 6.3 Funções puras esperadas

- `normalizeWord(value, locale)`: prepara texto para comparação.
- `validateGuess(value, level, lexicon)`: retorna validade e motivo legível.
- `evaluateLetters(guess, answer)`: retorna um estado por letra (`correct`, `present`, `absent`).
- `getSemanticFeedback(guess, semanticIndex)`: retorna faixa, rótulo e indicador discreto.
- `submitGuess(progress, guess, rules)`: aplica contagem, registra feedback e avança a máquina de estados.
- `requestHint(progress, rules)`: revela a dica somente quando disponível.
- `finishLevel(progress, rules)`: revela resposta e aplica critério de desbloqueio.
- `getDailyPackId(now, timezone)`: determina a data do desafio pela zona horária aprovada.

As funções devem ser determinísticas e sem acesso a DOM, React, relógio global ou `localStorage`; esses recursos são fornecidos por adaptadores externos.

## 7. Persistência e data diária

### 7.1 Armazenamento

Usar uma chave versionada, por exemplo `palavra-do-dia:save:v1`. Estrutura conceitual:

```json
{
  "schemaVersion": 1,
  "lastPackDate": "2026-10-13",
  "dailyProgress": {},
  "statistics": {
    "daysPlayed": 0,
    "levelsSolved": 0,
    "guessesByLevel": []
  },
  "preferences": {
    "theme": "light",
    "textScale": 1
  }
}
```

- Validar o objeto lido; dados ausentes ou corrompidos devem resultar em estado inicial seguro, sem bloquear a partida.
- Fazer gravação após cada mudança significativa, sem depender do encerramento da aba.
- Incluir migração explícita quando a estrutura mudar. Nunca interpretar dados antigos sem validar a versão.
- Persistir os desafios anteriores somente na medida necessária para estatísticas/histórico. Definir limite de retenção para evitar crescimento indefinido.
- Informar que dados locais não sincronizam entre navegadores ou dispositivos e podem ser apagados pelo navegador.

### 7.2 Virada do dia

- Usar `America/Sao_Paulo` como zona de referência proposta, não o fuso escolhido pelo relógio do computador.
- O identificador do pacote deve ser uma data civil nesse fuso, calculada por uma função testada; não construir a data apenas com `toISOString()` em UTC.
- Ao iniciar em outra data, carregar o pacote do dia e conservar o histórico local sem cobrar sequência perdida.
- Definir comportamento quando a página é aberta antes da virada e permanece aberta durante a mudança de data.

## 8. Interface e design visual

### 8.1 Direção Revista de repertório

A estrutura do [protótipo atual](prototipos-interface.html) é a referência visual, sujeita a revisão de acessibilidade antes do lançamento:

- Cabeçalho: marca, nome do jogo, ajuste de texto e alternância claro/escuro.
- Cabeçalho editorial: tema, data e título curto do desafio.
- Coluna esquerda: tema e percurso numerado dos 10 níveis; níveis concluídos, atual e bloqueados devem ter texto/ícone, além de cor.
- Coluna central: nível e tentativas, tabuleiro, campo de palpite, feedback de validação e estado salvo.
- Coluna direita: proximidade semântica, dica opcional e notas de estado relevantes.
- Em telas desktop menores, permitir que o painel de progresso e pistas reorganize sem ocultar o campo ou causar rolagem horizontal.

### 8.2 Tokens iniciais

Valores de partida retirados da proposta visual; não devem ser considerados aprovados sem auditoria de contraste:

- Fundo de papel: `#F4F0E6`.
- Superfície: `#FFFDF7`.
- Texto principal: `#18332F`.
- Texto secundário: `#62706A`.
- Acento coral: `#D75B45`.
- Acento azul: `#3D73C8`.
- Estado correto: `#28694E`.
- Estado presente em outra posição: `#9B5D10`.
- Tipografia editorial: DM Serif Display para títulos, DM Sans para interface e IBM Plex Mono para tabuleiro/contadores, com fontes locais de fallback.

Texto pequeno deve cumprir o contraste WCAG AA (4.5:1); texto grande deve cumprir 3:1. O coral ou o azul podem ser usados como acentos, mas não como texto pequeno sobre fundo claro sem verificação. Estados de letra devem combinar cor com rótulo, forma, borda ou ícone.

A preferência de tema deve alterar todos os tokens por propriedades CSS, não duplicar componentes. Tema escuro precisa de teste de contraste próprio. O ajuste de texto deve ampliar o conteúdo sem corte, sobreposição ou rolagem horizontal.

## 9. Acessibilidade e usabilidade

Meta proposta: WCAG 2.2 nível AA nos fluxos principais, validada manualmente além das ferramentas automáticas.

- Todas as ações operáveis por teclado, com ordem de foco previsível, foco claramente visível e sem armadilha de foco.
- Campo com rótulo programático, comprimento esperado e instrução associada; não depender de placeholder como rótulo.
- Após envio, anunciar a nova linha de pistas por região `aria-live="polite"`; erros de validação importantes podem usar anúncio mais direto sem repetir toda a tela.
- Para cada letra, fornecer um equivalente textual: correta na posição, presente em outra posição ou não encontrada. Não usar a cor como único sinal.
- A proximidade semântica deve ter rótulo textual e valor/escala acessíveis; não anunciar apenas uma cor ou uma animação.
- Controlar tabs com teclado e semântica correta; se os três mockups não forem mantidos no produto final, remover a navegação de protótipo e manter as configurações em controles simples.
- Suportar ampliação de texto, zoom do navegador, contraste adequado e conteúdo refluído em janelas desktop estreitas.
- Respeitar `prefers-reduced-motion`; nenhuma pista pode depender de animação ou som.
- Alvos de interação devem ter dimensão ou espaçamento suficiente; seguir o critério WCAG 2.2 de pelo menos 24 CSS px, preferindo alvos maiores para controles frequentes.
- Testar com teclado, leitor de tela e pelo menos um usuário que utilize recursos de acessibilidade antes do lançamento.

## 10. Privacidade, segurança e operação

- Não solicitar cadastro, nome, e-mail, localização ou outro identificador.
- Não incluir analytics de terceiros no MVP. Estatísticas ficam em `localStorage`.
- Servir a aplicação por HTTPS e aplicar política de segurança de conteúdo compatível com os recursos usados.
- Não incluir chaves ou segredos no JavaScript publicado.
- Conteúdo estático significa que as respostas podem ser inspecionadas por ferramentas do navegador; isso é uma limitação aceita para o MVP, não uma garantia de segredo.
- Como parte do público tem menos de 18 anos, a ausência de coleta de dados é uma escolha deliberada. Qualquer adição futura de analytics, conta ou publicidade requer análise específica de privacidade e das obrigações legais aplicáveis a menores no Brasil.
- Manter uma revisão editorial dos temas, respostas, definições, exemplos, sinônimos e potenciais interpretações ofensivas/ambíguas.

## 11. Plano de testes

### Testes unitários do domínio

- Letras certas, presentes e ausentes.
- Letras duplicadas na resposta e no palpite.
- Acentos, cedilha, Unicode e equivalência sem acento conforme a política aprovada.
- Palavra inválida, comprimento incorreto e palpite duplicado sem consumo de tentativa.
- Acerto, erro, quinta falha, disponibilidade/uso da dica e limite de tentativas.
- Regra de avanço depois de acerto e esgotamento.
- Troca de data na zona `America/Sao_Paulo`, incluindo meia-noite e horário de verão histórico quando relevante.
- Migração e recuperação de estado local inválido.

### Testes de interface e acessibilidade

- Leitura e entrada de palpite por teclado, com foco visível.
- Leitor de tela recebe estado de letra, pista semântica, erro e dica.
- Tema claro/escuro e tamanho de texto persistem ao recarregar.
- Nenhum estado depende exclusivamente de cor.
- Ferramenta axe-core sem violações críticas/altas nos fluxos principais; resultados automáticos não substituem auditoria manual.
- Contraste calculado para cada par efetivamente usado, incluindo textos pequenos, controles desabilitados relevantes e foco.

### Testes ponta a ponta

1. Abrir o jogo sem cadastro e iniciar o desafio.
2. Enviar palpite inválido; conferir que não consumiu tentativa.
3. Enviar palpite aceito; conferir feedback de letras e semântica.
4. Fazer cinco erros; solicitar sinônimo.
5. Acertar ou encerrar o nível; conferir resposta e regra de desbloqueio.
6. Atualizar a página e confirmar a retomada.
7. Avançar a data simulada; confirmar que o desafio novo abre sem apagar histórico.

## 12. Sequência de implementação

1. **Fechar regras de produto:** tentativas, política de grafia, vocabulário aceito, custo da dica, critério de avanço e escala semântica.
2. **Validar dados:** criar um pequeno pacote editorial de teste, escolher/licenciar o recurso semântico e medir qualidade, cobertura lexical e tamanho do índice.
3. **Criar fundação:** Vite, React, TypeScript estrito, testes, tokens visuais e estrutura do pacote diário.
4. **Implementar domínio:** normalização, validação, feedback de letras, índice semântico, máquina de estados, progressão e testes unitários.
5. **Implementar interface Revista:** shell, níveis, tabuleiro, entrada, feedback, dica, resultado e preferências.
6. **Adicionar persistência:** validação, migração, retomada e estatísticas locais.
7. **Revisar acessibilidade e conteúdo:** contraste, teclado, leitor de tela, fonte ampliada e revisão com falantes de português brasileiro.
8. **Validar e publicar:** testes ponta a ponta, build estático, HTTPS, smoke test e observação sem analytics invasivo.

## 13. Critérios técnicos de conclusão do MVP

- O build estático funciona nos navegadores desktop definidos para suporte.
- Dez níveis diários carregam e seguem a progressão aprovada; o limite de tentativas é consistente.
- Entradas inválidas não contam como erro; feedback de letras trata corretamente ocorrências duplicadas.
- A pista semântica é originada de dados versionados, com documentação da fonte e validação editorial; não é um valor aleatório ou baseado em ortografia.
- A dica só é oferecida conforme a regra de cinco erros e a política aprovada de custo.
- Progresso e preferências sobrevivem ao recarregamento, sem conta ou dados pessoais.
- Ausência em dias anteriores não bloqueia o desafio atual nem apaga estatísticas.
- Os fluxos principais passam nos testes de teclado, contraste, leitor de tela e regressão visual.
- O tamanho do pacote diário e o tempo de carregamento são medidos e aceitos antes da publicação.

## 14. Riscos e decisões que bloqueiam implementação

| Tema | Risco | Decisão/recomendação |
|---|---|---|
| Proximidade semântica | Embeddings podem devolver relações estranhas ou depender do sentido contextual da palavra. | Medir com um conjunto de palpites brasileiros; revisar sinônimos e rótulos manualmente. Não exibir precisão decimal. |
| Cobertura lexical | Uma lista pequena rejeita palavras legítimas; uma lista ampla aumenta o índice e pode incluir termos inadequados. | Definir lista e política editorial antes de congelar o conteúdo diário. |
| Tentativas | A dica após cinco erros pode deixar poucas tentativas se o limite total for baixo. | Escolher limite após teste de jogo; oito é somente o valor atual do protótipo. |
| Desbloqueio | Exigir acerto pode frustrar; avançar automaticamente muda o significado de “desbloquear”. | Recomendação: revelar a resposta e deixar seguir, sem penalizar, mas confirmar com produto. |
| Dia e fuso horário | A data local pode divergir entre dispositivos e regiões. | Usar uma única zona de referência declarada e testar a virada. |
| Conteúdo no cliente | Respostas e índice podem ser inspecionados. | Aceitar no MVP sem competição; adotar API somente se proteção contra spoilers justificar complexidade. |
| Público adolescente | Dados de uso podem envolver menores. | Evitar coleta de dados; reavaliar privacidade antes de adicionar serviços de terceiros. |

## 15. Fontes de requisitos

- PRD do jogo: [PRD-jogo-palavras.md](PRD-jogo-palavras.md).
- Direção visual recomendada e protótipo interativo: [prototipos-interface.html](prototipos-interface.html).
- Critério de contraste WCAG 2.2: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Uso de cor WCAG 2.2: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- Operação por teclado WCAG 2.2: https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html
- Tamanho mínimo de alvos WCAG 2.2: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Game Accessibility Guidelines: https://gameaccessibilityguidelines.com/basic/

## 16. Implementação inicial

A primeira versão executável está na raiz do projeto e em `src/`, com o pacote editorial em `src/data/daily-packs/2026-10-20.json`. Ela concretiza as escolhas pendentes com oito tentativas por nível, avanço após acerto ou esgotamento, dica sem custo após cinco erros, comparação sem acentos e confirmação lexical por uma lista editorial local. As relações semânticas são rótulos discretos revisados manualmente; palpites sem entrada editorial são identificados como não cadastrados, não como distantes. Não são geradas por similaridade ortográfica nem por um modelo automático.

O conteúdo incluído é um pacote demonstrativo de natureza, com dez níveis e vocabulário limitado. A data civil é calculada em `America/Sao_Paulo`, mas este pacote inicial é reutilizado nos dias seguintes até a inclusão de novos pacotes. Persistência local usa chaves versionadas para a partida e as preferências. Essa primeira entrega não substitui a validação editorial, a expansão do léxico, testes assistivos manuais nem revisão de contraste em navegadores reais.
