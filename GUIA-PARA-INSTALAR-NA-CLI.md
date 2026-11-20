# Instalação do AceleraOS pela CLI

Este repositório contém o código, o design e as funcionalidades do AceleraOS.
Ele não contém dados de clientes, banco de produção, `.env`, sessões do WhatsApp
ou credenciais. Cada instalação precisa usar seus próprios serviços e variáveis.

## Mensagem recomendada para colar na CLI

```text
Você é o responsável por instalar este projeto com segurança.

Clone o repositório privado AceleraOSD e leia o README.md, AGENTS.md e CLAUDE.md
antes de executar qualquer comando. Faça a instalação em uma pasta nova ou em
um diretório explicitamente aprovado. Não sobrescreva outra instalação e não
apague banco, volumes, arquivos .env ou sessões do WhatsApp.

1. Verifique Docker, Docker Compose, Git e os requisitos de memória.
2. Crie o arquivo .env a partir do .env.example, sem colocar segredos no Git.
3. Configure uma instância Supabase própria para esta instalação e aplique o
   supabase/baseline.sql conforme as instruções do projeto.
4. Defina domínio, URL pública, Redis, WAHA e as demais variáveis obrigatórias.
5. Suba a stack com os arquivos de compose exigidos pelo ambiente.
6. Verifique login, cadastro, dashboard, CRM, inbox, agenda, desempenho e
   navegação responsiva antes de dizer que terminou.
7. Se algo falhar, pare, mostre o erro exato e faça backup antes de tentar
   qualquer correção destrutiva.

Não invente credenciais, não use dados da instalação original e não publique
segredos nos logs, no terminal ou no repositório. Ao final, informe os comandos
executados, a URL da instalação e o que ainda depende de configuração manual.
```

## Observação

Para acessar um repositório privado, a pessoa precisa ser adicionada como
colaboradora no GitHub ou autenticar a CLI com uma conta que tenha acesso.
