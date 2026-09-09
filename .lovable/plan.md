# Prelúdia — plataforma para profissionais da música

Versão visual completa em português, com dados de exemplo realistas, e a Mia já funcionando de verdade com inteligência artificial.

## Identidade

- Paleta: preto, branco, azul e cinzas; fundo claro com painéis escuros pontuais.
- Toques musicais discretos: linhas de pauta finas como divisores, ondas sonoras em cabeçalhos e gráficos.
- Tipografia sóbria (títulos com serifa leve, textos em sem-serifa), cantos suaves, sombras discretas.
- Mia: nota musical antropomorfizada minimalista, preta com detalhes azuis, gerada como imagem própria e usada no avatar do chat, nos cards e no estado vazio.

## Telas

1. **Painel** — resumo de projetos (em produção, revisão, concluídos, atrasados), próximos prazos por data, indicadores financeiros do mês (faturado, a receber, projetos ativos) e card da Mia com sugestões e atalhos.
2. **Projetos** — lista com filtros por status e página detalhada de cada projeto.
   - Fluxo: Orçamento → Aprovado → Em produção → Em revisão → Aguardando cliente → Concluído (barra de etapas clicável).
   - **Ficha Musical**: tonalidade original e do arranjo, BPM, duração, compasso, instrumentação, estrutura e observações.
   - Dados comerciais: cliente, orçamento, pago, saldo.
   - Abas internas: tarefas, arquivos, feedbacks, entrega.
3. **Clientes** — lista e ficha com contatos, histórico de projetos, total faturado e feedbacks.
4. **Feedbacks com a Mia** — o usuário cola a mensagem do cliente (ex.: WhatsApp), a Mia devolve as alterações pedidas em lista, um resumo objetivo, urgência e tom; botão para salvar no projeto.
5. **Tarefas & Entregas** — tarefas por projeto com prioridade e prazo; arquivos por categoria (Partitura, Áudio, Stems, Mix, Master, Documentos/NF); fluxo "Preparar entrega" que monta uma página-resumo organizada para o cliente.
6. **Financeiro** — receitas, valores a receber, status de pagamento, gráficos de faturamento e produção.
7. **Em Breve** — roadmap visual: bot de WhatsApp, Dropbox/Google Drive, emissão de NF, publicação social.

Layout com barra lateral fixa, cabeçalho com busca, e a Mia como botão flutuante em todas as páginas.

## Mia (IA real)

- Chat flutuante: perguntas em linguagem natural sobre projetos, prazos e finanças, respondendo com base nos dados de exemplo carregados na sessão.
- Ferramentas da Mia: criar projeto, criar tarefa e gerar resumo — as ações aparecem no chat e refletem na interface durante a sessão.
- Análise de feedback: transforma texto colado em alterações + resumo estruturado.
- Erros (limite de uso, falha de rede) aparecem como aviso claro, sem resposta falsa.

## Detalhes técnicos

- TanStack Start, rotas dedicadas: `/`, `/projetos`, `/projetos/$id`, `/clientes`, `/clientes/$id`, `/feedbacks`, `/tarefas`, `/financeiro`, `/em-breve`.
- Dados de exemplo em `src/data/*` com tipos TypeScript; estado da sessão em um store React (sem backend, sem login).
- IA via Lovable AI Gateway: rota de stream `src/routes/api/chat.ts` (chat da Mia, com ferramentas) e `createServerFn` para análise de feedback com saída estruturada. Chave lida só no servidor.
- UI de chat com AI Elements (conversation, message, prompt-input, tool, shimmer).
- Tokens de cor/tipografia em `src/styles.css`; nenhum valor de cor fixo nos componentes.
- Cada rota com título e descrição próprios para compartilhamento.

## Fora desta etapa

Login, dados salvos permanentemente e as integrações listadas em "Em Breve" (aparecem apenas como apresentação visual).
