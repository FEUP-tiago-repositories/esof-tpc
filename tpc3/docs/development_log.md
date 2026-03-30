# TPC3 – Diário de Desenvolvimento e Automação de Acceptance Tests

### Curso: Engenharia de Software – LEIC, FEUP  
### Data: 30 de Março de 2026  
### Realizado por: Tiago Oliveira  
### Tecnologia: React Native (Expo SDK 54)

---

## 1. Objetivos do TPC3

- Implementar um protótipo funcional da app de ecopontos com base nas User Stories do TPC2.
- Traduzir cenários Given-When-Then para comportamentos verificáveis na interface.
- Automatizar o máximo possível da validação dos fluxos através de estados determinísticos no código (simulação de GPS, filtros, deteção de duplicados, validações de formulário).
- Garantir que o processo é reproduzível por outra pessoa (comandos, inputs, outputs e decisões documentadas).
- Produzir análise crítica do processo completo: da definição dos testes até ao resultado final.

---

## 2. Ferramentas e Materiais Utilizados

| Ferramenta / Material | Utilização | Link |
|---|---|---|
| GitHub | Versionamento e entrega do trabalho | https://github.com/FEUP-tiago-repositories/esof-tpc |
| Node.js / npm | Gestão de dependências e execução local | https://nodejs.org |
| Jest + React Native Testing Library | Automação de acceptance tests | https://testing-library.com/docs/react-native-testing-library/intro/ |
| Expo CLI | Execução da app (Android/iOS/Web) | https://docs.expo.dev |
| React Native Docs | Referência de componentes e APIs | https://reactnative.dev/docs/getting-started |
| Expo Docs | Compatibilidade de versões e runtime | https://docs.expo.dev/versions/latest/ |
| WebStorm | Edição e inspeção de código | https://www.jetbrains.com/webstorm/ |
| GenAI (Perplexity) | Apoio na estruturação dos critérios de aceitação e refinamento de fluxos | https://www.perplexity.ai |
| INVEST Guidelines | Revisão da qualidade das histórias/testes | https://xp123.com/articles/invest-in-good-stories-and-smart-tasks/ |

---

## 3. Contexto de Implementação

No TPC3 foi implementada uma app Expo/React Native que cobre os cenários principais definidos no TPC2:

- **US1**: visualizar pontos no mapa, filtrar por tipo e tratar GPS desligado.
- **US2**: adicionar novo ponto, validar campos obrigatórios e tratar potencial duplicado.

O projeto está em `/esof-tpc/tpc3` e usa:

- `expo ~54.0.33`
- `react-native 0.81.5`
- scripts: `start`, `android`, `ios`, `web`

---

## 4. Log de Tarefas (objetivo, comandos, prompts, inputs e outputs)

## Tarefa 1 — Preparação do ambiente

**Objetivo:** Garantir que o projeto arranca localmente para validar os cenários.

**Comandos:**

```bash
cd /esof-tpc/tpc3
npm install
npm run start
```

**Input principal:** código existente do projeto TPC3.  
**Output esperado:** Expo Dev Server ativo com QR code e opções para Android/iOS/Web.

---

## Tarefa 2 — Implementar fluxo da US1 (mapa + filtros + seleção)

**Objetivo:** Materializar cenário principal de consulta de ecopontos.

**Implementação funcional:**
- Lista inicial de pontos (`INITIAL_POINTS`) com nome, tipos, distância e posição relativa.
- Filtros horizontais (`Todos`, `Vidro`, `Papel`, `Plástico`, `Garrafas`, `Retoma`).
- Seleção de marcador e apresentação de detalhes no bottom sheet.

**Comportamentos testáveis (Given-When-Then):**
- Dado que o mapa está visível, quando seleciono filtro, então só aparecem pontos com esse tipo.
- Dado que toco num marcador, quando ele fica selecionado, então vejo nome, distância e tipos.

**Inputs de teste manual:**
- Tap em chips de filtro.
- Tap em marcadores diferentes.

**Outputs observados:**
- Marcadores visíveis atualizados conforme filtro.
- Bottom sheet atualizado para o ponto selecionado.

---

## Tarefa 3 — Implementar fluxo excecional da US1 (GPS desligado)

**Objetivo:** Tratar ausência de localização com opções de recuperação.

**Implementação funcional:**
- Estado `locationEnabled`.
- Overlay/modal “Localização desativada”.
- Botão “Ativar Localização”.
- Pesquisa por morada com validação mínima (`>= 4` caracteres).
- Botão de apoio “Simular GPS ligado/desligado” para testes rápidos.

**Comportamentos testáveis:**
- Dado GPS desligado, quando entro no mapa, então vejo modal de limitação.
- Dado morada curta, quando pesquiso, então surge erro.
- Dado morada válida, quando pesquiso, então o estado volta a localização ativa.

**Inputs de teste manual:**
- Toggle de simulação GPS.
- Texto de pesquisa curto e válido.

**Outputs observados:**
- Apresentação de erro: “Morada demasiado curta...”
- Fecho do estado de bloqueio quando a pesquisa é válida.

---

## Tarefa 4 — Implementar fluxo da US2 (adicionar local)

**Objetivo:** Criar fluxo de submissão de novo ponto com validações.

**Implementação funcional:**
- Ecrã “Adicionar Local”.
- Mini-mapa com pin ajustável por toque.
- Campo nome obrigatório.
- Seleção de tipos (multiseleção).
- Morada auto-preenchida com base na posição aproximada.
- Submissão para revisão.

**Comportamentos testáveis:**
- Dado formulário vazio, quando submeto, então vejo erros em campos obrigatórios.
- Dado dados válidos, quando submeto, então o ponto é criado e aparece no mapa.

**Inputs de teste manual:**
- Nome vazio vs. nome preenchido.
- Nenhum tipo selecionado vs. tipos válidos.
- Toques no mini-mapa para alterar pin.

**Outputs observados:**
- Mensagens de erro de validação.
- Novo marcador criado com foco no mapa.

---
---

## Tarefa 5 — Automação dos Acceptance Tests com Jest + React Native Testing Library

**Objetivo:** Automatizar os cenários Given-When-Then do fluxo de adicionar ponto usando testes de aceitação programáticos, sem necessidade de emulador ou dispositivo físico.

**Ferramenta escolhida:** Jest + React Native Testing Library (RNTL)
- URL: https://testing-library.com/docs/react-native-testing-library/intro/
- Razão: integração nativa com Expo, sem dependências externas, sintaxe orientada ao comportamento real do utilizador (`fireEvent`, `screen`).

**Instalação:**

```bash
cd tpc3
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo react-test-renderer
```

**Configuração adicionada ao `package.json`:**
- Preset `jest-expo`
- `transformIgnorePatterns` para compatibilidade com módulos nativos

**Ficheiro criado:** `tpc3/__tests__/App.acceptance.test.js`

**Cenários automatizados (7 testes):**

| # | User Story | Given | When | Then |
|---|---|---|---|---|
| 1 | US2 | Estou no mapa | Carrego no FAB `＋` | Vejo o ecrã "Adicionar Local" |
| 2 | US2 | Estou no formulário com nome vazio | Submeto | Vejo erro "Nome obrigatório" |
| 3 | US2 | Preencho nome válido com tipo "Vidro" e pin longe | Submeto | Volto ao mapa e o ponto aparece |
| 4 | US2 | Pin está próximo de ponto existente | Submeto | Vejo aviso "⚠️ Local já existente?" |
| 5 | US2 | Aviso de duplicado visível | Confirmo "É diferente" | Ponto é guardado e mapa é mostrado |
| 6 | US1 | GPS está ligado | Carrego em "Simular GPS desligado" | Vejo modal "📍 Localização desativada" |
| 7 | US1 | GPS desligado, modal visível | Pesquiso com menos de 4 caracteres | Vejo erro "Morada demasiado curta..." |

**Execução:**

```bash
npm test
```

**Input:** `App.js` existente (sem alterações ao código de produção).  
**Output:** suíte de 7 testes a passar, cobrindo os fluxos principais de US1 e US2.

---

## 5. Prompts de apoio (GenAI) e respetivo uso

> Nota: Prompts abaixo representam o tipo de instruções usadas para apoiar o processo e podem ser reutilizados por qualquer colega para repetir o trabalho.

### Prompt A — Derivar critérios Given-When-Then a partir das User Stories

**Prompt:**
```text
Com base nesta user story e cenário excecional, escreve acceptance tests em Given-When-Then com foco em estados observáveis no UI e erros de validação.
```

**Input:** descrição das US1/US2 do TPC2.  
**Output usado no TPC3:** lista de critérios objetivos para mapear para estados React (`locationEnabled`, `duplicateCandidate`, `formErrors`, `filter`).

### Prompt B — Melhorar testabilidade do protótipo

**Prompt:**
```text
Como tornar um protótipo React Native mais testável sem backend?
Preciso de estados controláveis para simular GPS ligado/desligado e validações de formulário.
```

**Input:** necessidade de validar cenários sem serviços externos.  
**Output usado no TPC3:** uso de toggles e validações locais determinísticas.

---

## 6. Checklist de Repetibilidade (passo-a-passo)

1. Clonar repositório.
2. Entrar em `/esof-tpc/tpc3`.
3. Executar `npm install`.
4. Executar `npm run start`.
5. Executar `npm test` para correr os 7 acceptance tests automatizados.
6. Confirmar que todos passam.
7. Abrir no emulador/dispositivo para validação visual.
8. Validar US1:
   - alternar filtros;
   - selecionar marcadores;
   - alternar GPS via botão de simulação;
   - testar pesquisa inválida e válida.
9. Validar US2:
   - abrir formulário no FAB `+`;
   - testar validações obrigatórias;
   - submeter caso normal;
   - submeter caso duplicado e testar duas decisões do modal.
10. Confirmar resultado visual no mapa e estado final dos marcadores.

---

## 7. Análise Crítica do Processo (do zero ao resultado final)

### O que correu bem

- A tradução de acceptance tests para estados React foi direta e eficaz.
- O uso de dados locais (`INITIAL_POINTS`) permitiu testar cenários rapidamente sem bloqueios de integração.
- A simulação de GPS facilitou a validação de fluxos excecionais.

### Dificuldades encontradas

- Sem motor de mapas real (tiles/SDK), o "mapa" é um fundo estático, reduzindo o realismo visual.
- A configuração do Jest com Expo 50 exigiu ajustes manuais: o `babel.config.js` teve de ser criado
  explicitamente e o `transformIgnorePatterns` refinado para incluir `@react-native/.*`, dado que o
  preset `jest-expo` não resolvia sozinho os módulos com Flow types (ex.: `error-guard.js`).
- O pin por defeito no formulário (x=0.5, y=0.5) fica dentro do raio de duplicado de um ponto
  existente, pelo que o teste de adição bem-sucedida exigiu simular um press no mini-mapa para
  mover o pin para uma zona livre (x=0.05, y=0.05).

### Trade-offs assumidos

- Priorizou-se **testabilidade e clareza dos critérios de aceitação** em vez de integração externa completa.
- Optou-se por validações locais simples para maximizar repetibilidade.

### Melhorias recomendadas para evolução

1. Integrar `react-native-maps` com coordenadas reais (lat/lng).
2. Substituir distância simulada por cálculo geográfico.
3. Introduzir backend para persistência e moderação de submissões.
4. Formalizar suíte de regressão para os Given-When-Then do TPC2/TPC3.

---

## 8. Conclusão

O TPC3 ficou funcional para validação dos cenários principais e excecionais das duas User Stories prioritárias. O processo foi documentado com objetivos, comandos, prompts, inputs/outputs e análise crítica, permitindo que qualquer pessoa reproduza os passos e compreenda as decisões técnicas tomadas até ao resultado final.
