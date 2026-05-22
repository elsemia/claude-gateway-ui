# Claude Code Gateway — Manual do Administrador

## Acesso ao painel

- URL: https://claudegateway.netlify.app/login
- Entre com seu email e senha

## Como adicionar um novo usuário

1. No painel, vá até a seção **"Nova chave de acesso"**
2. Preencha o nome do usuário
3. Defina os limites de tokens (padrão: 500.000/dia e 2.000.000/mês)
4. Clique em **"Gerar chave"**
5. **IMPORTANTE:** Uma janela vai aparecer com a chave e o link de setup. Guarde essas informações agora — elas não serão exibidas novamente
6. Envie o link de setup para o usuário via WhatsApp ou email

## O que o usuário recebe

O usuário recebe um link no formato:
https://claudegateway.netlify.app/setup/sk-xxxxx

Ao abrir o link, ele verá instruções passo a passo para:
1. Instalar o Node.js (se necessário)
2. Instalar o Claude Code
3. Configurar o terminal (Windows, Mac ou Linux)
4. Começar a usar

O usuário também pode baixar um script automático que faz tudo isso com um clique.

## Como desativar ou revogar o acesso de um usuário

1. No painel, localize o usuário na tabela **"Chaves de acesso"**
2. Clique no toggle da coluna **"Status"** para desativar temporariamente
3. Para remover permanentemente, clique em **"Deletar"**

## Como convidar outro administrador

1. Na seção **"Convidar administrador"**
2. Digite o email da pessoa
3. Clique em **"Enviar convite"**
4. A pessoa receberá um email com link para definir a senha

## Monitoramento de uso

Na seção **"Logs de uso"** você pode:
- Filtrar por usuário ou status
- Ver tokens consumidos por requisição
- Identificar erros ou abusos
- Carregar mais registros clicando em "Carregar mais"

## Informações importantes

- Cada usuário tem uma chave única — nunca compartilhe chaves entre pessoas
- A chave raw só é exibida uma vez, no momento da criação
- Usuários com cota esgotada recebem erro automaticamente
- O painel atualiza os dados em tempo real ao carregar a página
