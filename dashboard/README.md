# Painel da Oferta

Painel diário para otimizar uma oferta: **anúncios do Facebook + página de vendas**, seguindo as regras da mentoria (`../conhecimento/`).

## O que ele faz

| Tela | O que mostra |
|---|---|
| **Hoje** | A lista do que fazer no dia, separada em *Fazer agora*, *Mandar no grupo*, *Não mexer* e *Para saber*. Cada tarefa diz se é **regra do mentor** ou **sugestão do Claude**. As mensagens para o grupo já vêm prontas para copiar. |
| **Anúncios** | Cada campanha e criativo: gasto, vendas, ROAS, CTR, CPC e lucro, com a recomendação ao lado. |
| **Página** | Funil da página de vendas (chegou → rolou 25/50/75/100% → clicou → comprou), em qual parte as pessoas desistem, e resultado por versão, por criativo e por país. |
| **Mudanças** | Histórico das versões da página, com o antes e depois de cada micro-alteração. |
| **Configurações** | Preço, câmbio, taxa, regras e status das conexões. |

### Regras aplicadas automaticamente
- **Teste (CBO 1-1-X):** dias 1–3 não mexe · fim do 3º dia, mensagem pronta com CPC, CTR, gasto e ROAS · campanha no lucro não desativa ninguém · gastou 1 ticket sem vender → desativa · 1 venda → não mexe · prejuízo sem venda → pausa · campeão no lucro no período inteiro → isolar em CBO 1-1-1.
- **Escala (CBO 1-1-1):** no lucro → +20% (um por dia) · 1 dia ruim → não mexe · 3 dias ruins → mensagem com período inteiro + 7 dias · subiu e piorou → volta ao orçamento anterior · prejuízo sem venda em 3 dias → pausa.
- **Bid Cap:** gatilho em 30 vendas, orçamento 2–3× o ticket, lance 1,5× o ticket; se não gastar: pixel → criativo novo em conjunto novo → lance +20% até o ticket médio.
- **Página:** a cada 40 visitantes por versão, aponta o maior gargalo e sugere a micro-alteração.

### Nome das campanhas (importante)
O painel descobre o tipo e o país pelo nome:
```
EDU-INF | PT | TESTE LOTE 1
EDU-INF | PT | ESCALA Criativo 07
EDU-INF | PT | BIDCAP
```

## Colocar no ar (Vercel)

1. **Novo projeto** na Vercel importando este repositório, com **Root Directory = `dashboard`**.
2. **Banco de dados:** no projeto, *Storage → Create Database → Neon (Postgres)* e conectar. Isso cria `DATABASE_URL`.
3. **Variáveis de ambiente** (*Settings → Environment Variables*):

| Variável | Para quê |
|---|---|
| `DASHBOARD_PASSWORD` | Senha para entrar no painel. |
| `META_ACCESS_TOKEN` | Token de um **usuário do sistema** do Gerenciador de Negócios, com permissão `ads_read` na conta de anúncio. |
| `META_AD_ACCOUNT_ID` | Número da conta de anúncio (sem `act_`). |
| `HOTMART_HOTTOK` | Hottok da Hotmart, para receber as vendas reais pelo webhook. |
| `CLAUDE_API_KEY` | Chave longa e aleatória. O Claude usa para ler `/api/summary`. |
| `CRON_SECRET` | Chave longa e aleatória. A Vercel usa para puxar os dados do Facebook todo dia. |
| `META_API_VERSION` | Opcional. Padrão `v24.0`. |

4. **Hotmart:** *Ferramentas → Webhook* → URL `https://SEU-PAINEL/api/hotmart`, eventos de compra aprovada, completa, reembolso e chargeback.
5. **Página de vendas:** colar antes do `</body>`:
   ```html
   <script src="https://SEU-PAINEL/t.js" data-versao="v1" defer></script>
   ```
   - Marcar as partes da página com `data-secao="topo"`, `data-secao="depoimentos"`, etc.
   - Links para `pay.hotmart.com` são rastreados sozinhos, e o script adiciona `sck` (visitante) e `src` (versão) para ligar a venda ao visitante.
6. **Anúncios:** nos parâmetros de URL, usar `utm_content={{ad.name}}&utm_campaign={{campaign.name}}`.

## Rodar localmente

```bash
npm install
npm run seed   # dados de exemplo
npm run dev    # http://localhost:3000
npm test       # testes das regras
```
Sem `DATABASE_URL`, usa um banco local em `.data/`. Sem `DASHBOARD_PASSWORD`, o acesso local fica liberado.

## Para o Claude
`GET /api/summary` com o header `x-api-key: CLAUDE_API_KEY` devolve tudo em JSON: tarefas do dia, campanhas, funil da página por versão, criativo e país, seções, vendas da Hotmart e histórico de mudanças.
