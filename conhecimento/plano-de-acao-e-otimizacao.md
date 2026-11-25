# Plano de ação e de otimização (v2)

Baseado nas respostas do mentor na call de 23/11/2026 (resumo em `2026-11-23-call-mentoria-gerenciador.md`) e na estrutura que vocês definiram depois:

> **Campanha de TESTE:** 1 campanha, 1 conjunto e 5 a 10 criativos. É onde **todo criativo novo** entra.
> **Campanha de ESCALA:** CBO 1-1-1, só com um criativo vencedor. É onde o orçamento sobe 20% ao dia.

Legenda: ✅ = dito pelo mentor · 💡 = sugestão minha (Claude) · ⚠️ = confirmar no grupo

---

# PARTE 1: A ESTRUTURA

```
CONTA DE ANÚNCIO (1 por oferta) ✅
│
├── 🧪 CAMPANHA DE TESTE: [Oferta] [País] TESTE
│     └── 1 conjunto
│           └── 5 a 10 criativos ativos
│                 ├── criativo perdedor  → desativa
│                 ├── criativo sem gasto → não mexe
│                 ├── criativo vencedor  → continua aqui E é copiado para uma campanha de escala
│                 └── vaga aberta        → entra criativo NOVO
│
├── 🚀 CAMPANHA DE ESCALA: [Oferta] [País] ESCALA Criativo X  (CBO 1-1-1)
│     └── 1 conjunto → 1 criativo vencedor → +20% de orçamento ao dia
│
├── 🚀 CAMPANHA DE ESCALA: Criativo Y  (CBO 1-1-1)
└── ...
```

- **Uma conta de anúncio por oferta.** Todos os países dessa oferta ficam na mesma conta. ✅
- 💡 **Uma campanha de teste por país.** Assim vocês sabem qual país vende. Exemplo: `EDU-INF | PT | TESTE` e `EDU-INF | IT | TESTE`.
- CBO com **alto volume** nas duas campanhas, a de teste e a de escala. Bid Cap só depois de 30 a 50 vendas. ✅

---

# PARTE 2: PLANO DE AÇÃO

## Fase 0: Preparação (dias 1 a 3)

### Estudo (dividir entre os dois)
- [ ] ✅ **"Escalando uma oferta até R$ 1 mil de lucro por dia, na prática"**. É a prioridade nº 1. Anotar quando ele diminui orçamento, quanto diminui e quando desativa.
- [ ] ✅ Vídeo do **Henrique Salvador** (rodando em vários países).
- [ ] ✅ Os **2 vídeos extras** mandados no grupo depois da call.
- [ ] ✅ Aula do **Alanzord** e todas as aulas de campanha e gerenciador da área de membros.
- [ ] ✅ Módulo do **dashboard** na área de membros.

### Estrutura
- [ ] ✅ Conectar as campanhas ao **dashboard da mentoria**.
- [ ] ✅ Separar **uma conta de anúncio só para educação infantil**, em dólar, paga pela Wise.
- [ ] ✅ Pixel: se o nicho já tem ~50 vendas, **reutiliza**. Se não tem, **pixel novo**.
- [ ] ✅ Combinar quem entra em cada **aula ao vivo** (ideal: os dois).

### Caixa
- [ ] ✅ Investimento alvo: **R$ 120 a 150 por dia** (cerca de R$ 3.600 a 4.500 por mês).
- [ ] ✅ Hotmart: o saque começa em **D15**, e vendas no cartão podem ser antecipadas.

## Fase 1: Lançamento (dias 4 a 10)

- [ ] ✅ Oferta: **educação infantil**, a que vocês criaram e que já vendeu.
- [ ] ✅ Produzir o **primeiro estoque de criativos**: a meta é chegar a **~50**, feitos no Grok e no Claude, em todos os estilos.
- [ ] ✅ Lançar em **3 países ao mesmo tempo** (PT + IT + FR) na mesma conta.
- [ ] 💡 ⚠️ Funil e quiz traduzidos para o **idioma de cada país**.
- [ ] Subir **uma campanha de TESTE por país**, cada uma com **5 a 10 criativos** do estoque.
- [ ] 💡 Orçamento sugerido no início, dentro de R$ 120 a 150 por dia: cerca de **R$ 40 por dia em cada campanha de teste** (3 países = R$ 120). Conforme surgem vencedores, o caixa passa para as campanhas de escala.

## Fase 2: Ciclo contínuo de teste e escala (a partir do dia 4, todos os dias)

É o coração do plano. Ver a Parte 3.

- [ ] ✅ Cada país roda **no mínimo 5 dias** antes de qualquer decisão sobre o país.
- [ ] ✅ Oferta que vendeu roda **no mínimo 14 dias**.
- [ ] ✅ País sem ROI → testar em **outro país**. Não trocar a oferta.
- [ ] ✅ País vendendo → levar para **mais países**.

## Fase 3: Bid Cap (depois de 30 a 50 vendas no pixel)

- [ ] ✅ A campanha de escala com **maior ROAS** vai para **Bid Cap**.
  - **Opção A:** transformar essa campanha em Bid Cap e desativar as outras de escala.
  - **Opção B:** manter as CBO ativas, se estiverem muito boas, e abrir **outra conta** com CBO em Bid Cap.
- [ ] ✅ **Configuração do Bid Cap** (resposta do grupo, front € 7,99):
  - **Orçamento:** 2 a 3 × o ticket = **€ 16 a 24 por dia**. Com 60+ criativos, até 6 × = **~€ 48 por dia**. Depois, sobe aos poucos.
  - **Lance:** 1,5 × o ticket do front = **~€ 12**. Não usar custo por venda nem ticket médio. Converter para dólar no câmbio do dia.
  - **Estrutura:** **criativo novo em conjunto novo a cada 2 dias** dentro da campanha de Bid Cap.
  - **Se não gastar**, nesta ordem:
    1. Conferir se o **pixel está recebendo a compra**.
    2. Subir **mais criativos em conjuntos novos**.
    3. Subir o lance **aos poucos (~20% por vez)**, **só enquanto ficar abaixo do ticket médio** (o break-even).
  - ⚠️ Pegar o **ticket médio real na Hotmart**. Se ele for menor que ~€ 12, o lance já está no teto: **não subir o lance**.
- [ ] A campanha de teste **continua rodando** recebendo criativos novos.

---

# PARTE 3: PLANO DE OTIMIZAÇÃO

## Rotina diária, na ordem

### 1) Campanha de TESTE: revisar cada criativo

```
Para cada criativo da campanha de teste:

Está gastando?
├── NÃO ──► NÃO MEXE ✅
└── SIM ──► Já gastou 1 ticket (o valor do preço do produto)?
            ├── NÃO ──► Espera
            └── SIM ──► Quantas vendas?
                        ├── 0 vendas ──► DESATIVA ✅ (abre uma vaga)
                        ├── 1 venda  ──► ⚠️ A CONFIRMAR (💡 até lá: deixa rodando até 2 tickets)
                        └── 2+ vendas ─► VENCEDOR 🏆 → vai para o passo 2
```

### 2) Vencedor encontrado: criar a campanha de ESCALA
- [ ] Criar uma **CBO 1-1-1 nova** só com esse criativo ✅ ("isola ele no triplo um").
- [ ] Começar com o **orçamento inicial** (o "9", cerca de R$ 40 por dia).
- [ ] 💡 **Não pausar** o vencedor na campanha de teste. Ele continua lá.
- [ ] 💡 Usar **o mesmo post** (mesmo ID do anúncio) na campanha nova, para aproveitar curtidas e comentários.

### 3) Campanhas de ESCALA: ajustar orçamento
| Situação | Ação |
|---|---|
| Bateu 1 ticket e tem 2 ou mais vendas, com bom retorno | **+20% de orçamento por dia** ✅ (no máximo 1 aumento por dia) |
| Gastou mais do que o orçamento definido | Normal no alto volume ✅ |
| Piorou | ⚠️ Quanto reduzir e quando desativar está na aula de escala até R$ 1 mil por dia |

> **Os 20% vão sempre na campanha de ESCALA, nunca na de TESTE.**
> O teste serve para **descobrir** o vencedor. A escala serve para **multiplicar** ele.

### 4) Repor criativos NOVOS na campanha de teste
- [ ] Para **cada criativo desativado**, entra **um criativo novo** na campanha de teste.
- [ ] Manter a campanha de teste sempre com **5 a 10 criativos ativos**.
- [ ] **Todo criativo novo entra primeiro na campanha de teste.** Nunca direto na escala.
- [ ] 💡 Fazer variações dos vencedores (mesmo ângulo, outro gancho, formato ou imagem) **e também** estilos totalmente novos.

### 5) Registrar e postar no grupo
- [ ] Usar o modelo no fim deste documento. ✅ "Usa bastante o grupo."

---

# PARTE 4: PRODUÇÃO CONTÍNUA DE CRIATIVOS

O mentor foi claro: **criativo é volume** ✅. A campanha de teste precisa de reposição constante.

| Item | Meta |
|---|---|
| Estoque inicial | ~50 criativos antes ou logo depois do lançamento |
| Ritmo de produção | 💡 pelo menos **5 a 10 criativos novos por semana, por oferta** (repor o que foi desativado) |
| Ferramentas | ✅ Grok (mais rápido hoje) e Claude |
| Estilos | ✅ "Todos os estilos possíveis": foto, vídeo, depoimento, antes e depois, problema e solução, carrossel… |
| Fonte de ideias | Pinterest, TikTok e biblioteca de anúncios (o que vocês já faziam) |
| Depois de achar vencedores | 💡 50% variações dos vencedores e 50% ideias novas |

### Ciclo semanal sugerido 💡
| Dia | Tarefa |
|---|---|
| Segunda | Produzir o lote de criativos novos da semana |
| Todo dia | Rotina de otimização (Parte 3) + repor as vagas abertas no teste |
| Sexta | Revisar a semana: quais estilos e ângulos venceram e quais perderam → orienta o próximo lote |

### Nome dos criativos 💡
`[OFERTA]-[Nº]-[ESTILO]-[ÂNGULO]` → ex.: `EDU-INF-023-VIDEO-DOR-MAE`
Isso ajuda a ver no relatório qual estilo e qual ângulo vendem mais.

---

## Atenção ⚠️

Colocar criativo novo dentro do mesmo conjunto faz o Facebook **reajustar a entrega** do conjunto. Isso é comportamento da plataforma, não foi dito na call. Duas formas de lidar:
- Fazer as trocas **uma vez por dia, todas juntas**, em vez de mexer várias vezes ao dia. 💡
- Se a campanha de teste ficar instável, abrir uma **campanha de teste nova por lote** (ex.: `TESTE LOTE 2`) em vez de mexer na antiga. ⚠️ Perguntar ao mentor qual ele prefere.

---

## O que NÃO fazer
- ❌ Aumentar 20% na campanha de teste.
- ❌ Colocar criativo novo direto na campanha de escala.
- ❌ Pausar o que não está gastando.
- ❌ Pausar o vencedor na campanha de teste.
- ❌ Dobrar o orçamento de uma vez.
- ❌ Ficar com menos de 5 criativos ativos no teste.
- ❌ Testar um país de cada vez.
- ❌ Abandonar uma oferta que já vendeu antes de 14 dias.
- ❌ Copiar a lógica do gestor de tráfego local do Brasil.

---

## Modelo de mensagem diária para o grupo

```
📊 [Educação infantil] — Dia X — [data]
Países: PT / IT / FR | Gasto: ___ | Vendas: ___ | ROAS: ___

🧪 TESTE
- Ativos: __ criativos
- Desativei: __ (1 ticket, 0 vendas)
- Vencedores: __ (1 ticket, 2+ vendas) → isolados em 1-1-1
- Novos que entraram: __

🚀 ESCALA
- Criativo X: gasto __ | vendas __ | ROAS __ → +20% / mantive / reduzi
- Criativo Y: ...

❓ Dúvida: Na aula "___" você disse ___. Fiz ___ e aconteceu ___. Está certo?
```

---

## Perguntas para o grupo ⚠️
1. "Testo em **1 campanha / 1 conjunto / 5 a 10 criativos**. Quando um criativo bate 1 ticket com 2 vendas, eu **isolo ele numa CBO 1-1-1 nova**, subo 20% ao dia nela e mantenho ele na campanha de teste. Está certo?"
2. "Os criativos novos eu coloco **na mesma campanha de teste** ou abro uma campanha de teste nova a cada lote?"
3. "Qual é o critério de **criativo validado**? E o que faço quando ele gasta 1 ticket e faz só **1 venda**?"
4. "Na escala, **quando e quanto reduzo** o orçamento se o ROAS cair?"

---

## Metas da primeira quinzena
| Indicador | Antes | Meta |
|---|---|---|
| Investimento por dia | ~R$ 30 | R$ 120 a 150 |
| Criativos testados | 5 a 10 | ~50 |
| Criativos ativos no teste | — | sempre entre 5 e 10 |
| Países ao mesmo tempo | 1 | 3 ou mais |
| Mensagens no grupo | poucas | todo dia, com métricas |
| Aulas ao vivo | 2 | todas |
| Vendas no pixel | — | caminhar para 30 a 50 (gatilho do Bid Cap) |
