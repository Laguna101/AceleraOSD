---
name: AceleraOS
description: Sistema operacional comercial para captar, atender e converter oportunidades.
---

# Identidade visual AceleraOS

## Produto

O AceleraOS reúne a operação de marketing, atendimento, vendas e pós-venda. A equipe da AceleraOS e os times das empresas clientes trabalham no mesmo produto, cada um dentro da organização e das permissões correspondentes. A interface é uma ferramenta operacional diária: a pessoa precisa localizar rapidamente conversas, oportunidades, compromissos e resultados.

## Direção

Uma central comercial premium inspirada em terminais modernos de inteligência de receita. A interface é escura, precisa e calma, com superfícies grafite, acentos violeta discretos e dados alinhados para leitura rápida. A referência aprovada é o painel Quantix enviado pelo usuário: estrutura lateral escura, canvas preto-grafite, tipografia clara, divisões finas e violeta em estados ativos e gráficos.

O AceleraOS deve parecer uma plataforma própria. A aparência antiga do DeskcommCRM é uma referência negativa. Não reutilizar sua paleta sálvia, superfícies greige, composição das páginas, padrões de navegação ou linguagem visual. Preservar a lógica, as permissões, os dados, os fluxos e os controles que funcionam.

## Tokens

Os valores executados ficam centralizados em `app/aceleraos.css`. CSS específico do AceleraOS fica sob `body:has(.acelera-shell)` ou `.acelera-*`; telas públicas e marcas personalizadas preservam seu escopo.

| Papel              | Token / valor |
| ------------------ | ------------- |
| Canvas             | `#0c0d12`     |
| Rail lateral       | `#11121a`     |
| Superfície         | `#14151d`     |
| Superfície elevada | `#1c1e29`     |
| Texto principal    | `#f3f3fa`     |
| Texto auxiliar     | `#b5b8cc`     |
| Borda              | `#292b39`     |
| Acento violeta     | `#b3a9ff`     |
| Ação sobre violeta | `#16132b`     |
| Sucesso            | `#70cfa1`     |
| Atenção            | `#e5b96a`     |
| Erro               | `#f08b92`     |
| Informação         | `#91c4f0`     |

## Tipografia

- Manrope variável local em `public/fonts/manrope/`, licenciada pela SIL Open Font License. Usar para navegação, títulos, conteúdo e números.
- IBM Plex Mono pode ser usado em identificadores, logs e valores técnicos.
- Usar numerais tabulares em contagens e valores. Hierarquia por tamanho, peso e espaço, sem excesso de caixa alta ou rótulos decorativos.

## Composição e navegação

- Sidebar grafite fixa no desktop, com marca AceleraOS, contexto da organização e destinos agrupados por tarefa. O item ativo recebe superfície violeta translúcida e texto claro.
- A área de administração da plataforma usa os mesmos tokens e tipografia, com navegação própria e aviso âmbar persistente para manter visível a operação entre organizações.
- Em telas estreitas, a navegação abre em painel temporário e fecha ao escolher um destino.
- Barra superior sólida: organização e trilha de navegação à esquerda; busca e ações da conta à direita. Evitar blur decorativo.
- A tela prioriza uma tarefa e uma ação principal. Filtros ficam próximos da lista que alteram.
- Dashboard organiza o resultado do período, tendências e próximos passos. Não inventar números; os dados ilustrativos existem apenas na rota de prévia, identificados como demonstração.
- Kanban e tabelas preservam densidade operacional e hierarquia clara, com rolagem interna quando necessário.
- Em tablet e celular, quebrar a composição sem ocultar ações, contexto ou estado da tela.

## Componentes e estados

- Cards são superfícies de agrupamento, não decoração; evitar grades repetitivas de cartões iguais e cartões aninhados.
- Controles possuem contraste e foco visível. Menus, diálogos e painéis usam a mesma família de superfícies e bordas.
- Sucesso, alerta, erro e status sempre combinam cor com rótulo ou ícone.
- Carregando, erro, vazio inicial e vazio por filtro são estados distintos. Erro nunca se apresenta como ausência de dados.
- Confirmação modal fica reservada a ações que exigem foco protegido; filtros e escolhas simples permanecem no contexto.
- Mensagens do inbox mantêm distinção consistente entre recebidas e enviadas, sem competir com o texto.

## Acessibilidade e interação

- Contraste suficiente, foco de teclado visível, controles nomeados e alvos de toque confortáveis.
- Seleção de cards e ações por teclado continuam disponíveis mesmo quando também há arrastar e soltar.
- Movimento é breve e informa uma mudança; evitar animação decorativa e conteúdo oculto por animação.
- Ícones vêm do conjunto já usado pelo projeto, sem emoji como substituto de ícone.

## Limites

- Não trazer de volta a identidade visual do DeskcommCRM.
- Não inventar clientes, resultados, receita, taxas ou promessas nas telas operacionais.
- Não esconder falhas de integração sob estados vazios.
- Não remover controles, permissões, integrações ou lógica de negócio durante mudanças visuais.
- Não mostrar dados de outra organização.

## Estado de implementação

Na tela **Agenda**, o título e a ação principal aparecem antes dos detalhes de integração. O status do Google fica em cartão compacto abaixo do cabeçalho; falhas de OAuth permanecem como alertas acionáveis antes dos controles do calendário. O cartão diferencia conexão indisponível, ativa e pronta para conectar. Em telas estreitas, status e ações quebram em linhas sem comprimir os controles.

Na **Prospecção de condomínios**, o cabeçalho explica o propósito da lista e expõe o nome do segmento e a tag `condominio` que controla a consulta. A dica orienta como trazer contatos para o segmento, sem introduzir campos ou automações que o banco atual não oferece.

No **quadro Kanban**, a cor configurada em cada etapa se estende do marcador para a borda superior da coluna. Durante o arraste, a zona de destino e a indicação de etapa vazia usam a mesma cor para explicitar onde o cartão será solto.

No **onboarding**, o indicador de configuração conecta as etapas, marca com ícone somente as etapas gravadas como concluídas e informa a posição atual no fluxo. Os rótulos completos continuam disponíveis a tecnologias assistivas e o indicador permanece compacto em celular.

Na recuperação de primeiro acesso (`/get-started`), a página agora compartilha a fachada escura e responsiva do AceleraOS, respeita o nome padrão ou a marca configurada e conserva o formulário, as traduções, os desvios de convite e as regras de autenticação existentes.

Em **Campanhas de mensagens**, o estado de simulação fica visível junto ao título, a cadência de referência D0/D2/D6 aparece como sequência e as proteções previstas ficam separadas dos atalhos para Contatos, Inbox e Follow-ups. O envio permanece desativado; essa tela não representa uma campanha executável.

Em **Meta Ads**, o resumo separa campanhas encontradas, campanhas veiculando e gasto do período. O gasto agregado usa a moeda da conta selecionada e só é exibido quando todas as campanhas têm valor informado pela plataforma; dados ausentes permanecem como indisponíveis. A tabela conserva os quinze indicadores, o estado de cada campanha e sua rolagem horizontal própria.

A migração visual está em andamento. As telas já adaptadas são login, casca e navegação, desempenho, agentes, campanhas, contatos, prospecção de condomínios (segmentada pela tag existente `condominio`), funis, inbox, conexões, webhooks, respostas rápidas, tarefas, equipe, configurações da organização e de funis, solicitações e detalhe LGPD, auditoria, radar de risco, agenda, relatório de atividades, catálogo de produtos, onboarding, memória compartilhada da IA, biblioteca de conhecimento, capacidades (Skills), execuções e falhas dos agentes, propostas aguardando decisão, evolução da IA e fluxos/fila de follow-up, perfil, notificações, segurança, billing, conversões, tipos de agendamento, extensões e guia das extensões; e a casca de administração da plataforma. Desempenho usa os dados presentes no CRM Imobiliario: leads captados, qualificação derivada da etapa configurada, etapas e visitas agendadas. O resumo explicita período e indicadores, e um gráfico de duas séries compara captação e visitas nos mesmos intervalos com legenda e valores de contagem; a área preenchida marca a captação e a linha de visitas a compara sem sobrepor as áreas. A base também guarda oportunidades ganhas e valores informados; esta visão ainda não apresenta receita. Custo de anúncios e atribuição de vendas por canal precisam estar disponíveis antes de calcular retorno ou atribuir receita a WhatsApp/Ads. Uso de IA apresenta custo em USD, orçamento e quatro gráficos com a mesma identidade e cores semânticas. Conexões organiza cada número como uma linha operacional com saúde, modo da IA, roteamento e ações. No Inbox, o título fica acima da área de trabalho; busca e filas ficam na coluna de conversas, a conversa ocupa o painel central e a ficha permanece à direita em telas largas. Em tablet estreito, a seleção alterna entre lista e conversa para manter espaço de leitura. O acabamento da lista destaca a conversa selecionada, o painel da mensagem tem superfície própria e os erros usam estado semântico; vazio, carregamento e seleção continuam distintos. Respostas rápidas tem busca em título/conteúdo, filtros locais para todas, próprias e da equipe, além de estados distintos de erro, carregamento e ausência de conteúdo. O catálogo de produtos destaca busca e importação no cabeçalho operacional, separa nome, disponibilidade, estoque e preço e mantém o resumo de linhas importadas na tela. Os cartões do Kanban hierarquizam valor, próxima ação e responsável, sem alterar seleção, abertura de dossiê ou arraste. Colunas e cartões derivam profundidade e superfícies dos tokens, com foco de teclado visível e indicação de etapa vazia ou em arraste. A navegação lateral conserva rotas e permissões, com estados ativos, foco e marca próprios do AceleraOS. Tarefas destacam o volume na visualização, separam os grupos por prazo e identificam atrasos; o calendário mantém os sete dias legíveis com rolagem horizontal em telas estreitas. Equipe agrupa membros e convites, usa tabelas com rolagem própria e apresenta separadamente configuração de roteamento, presença e horários de atendimento. Configurações da organização agrupam perfil, preferências regionais, privacidade e motivos de perda; a zona de perigo mantém tratamento próprio e a confirmação existente. Configurações de funis separam etapas, mapeamento do agente e vocabulário/campos, mantendo os vínculos entre as seções e os controles de papéis das etapas. Solicitações LGPD e auditoria seguem a mesma linguagem tabular escura, com filtros destacados, rolagem local e estados de erro separados de listas vazias; a auditoria permite tentar novamente quando a leitura falha. O Radar hierarquiza níveis de risco, tarefas sem próximo passo e ações de assumir/ver compromisso, e separa erro de carregamento do estado sem ocorrências. Webhooks organiza fontes, captações, automações e atividade em abas próprias, com formulários, estados vazios, tabelas e cartões ajustados ao mesmo tema. Antes de declarar a reformulação concluída, revisar todas as rotas autenticadas, conferir desktop e tablet, testar os fluxos existentes e fechar a compatibilidade com o banco atual. A prévia `/design-preview` usa dados fictícios e só deve ser liberada em desenvolvimento.

Na integração **Nuvemshop**, o estado da conexão aparece junto ao título. Credenciais pendentes, autorização ausente e conexão registrada têm instruções próprias; os detalhes da loja mostram somente os valores que a integração já fornece. As ações OAuth e os papéis que podem conectar ou desconectar são preservados.

Quando a pessoa abre o **Inbox sem uma organização ativa**, o estado de acesso explica por que as conversas ainda não estão disponíveis e destaca o caminho de configuração. A ação continua levando ao onboarding existente.

A tela de **erro global** usa o fundo grafite, a superfície escura e o violeta do AceleraOS mesmo quando o layout principal foi substituído. Ela preserva o envio ao Sentry, a cópia do identificador do erro e a tentativa de recuperação.

As telas de **acesso negado (403)** e **página não encontrada (404)** usam a mesma identidade escura, mantendo as respectivas mensagens e os atalhos existentes para voltar ou abrir o Inbox.

Durante o carregamento do **Inbox**, o esqueleto ocupa a largura do celular com uma lista legível; em larguras maiores, mostra lista e painel lado a lado. O estado de carregamento é anunciado a leitores de tela.

Nos **hubs de navegação**, a primeira etapa de cada jornada aparece como lista operacional compacta. As etapas seguintes mantêm cartões com descrição para descoberta. A ordem, os destinos e as permissões continuam projetados do registro único de navegação.

Nos **gráficos de tendência**, a geometria se ajusta à largura interna do painel. Os seis intervalos e os rótulos do eixo ficam visíveis em desktop, tablet e celulares compactos, sem rolagem horizontal dentro do gráfico nem aumento da largura da página.
