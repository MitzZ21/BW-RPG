# Black Wolfes RPG — BD local

A aplicação usa **apenas a base local `server/database/db.json`**.

## Local
```bash
npm install
npm run build
npm start
```
Abrir `http://localhost:3000`.

## Vite + ngrok para testes
```bash
npm run dev -- --host 0.0.0.0
ngrok http 5173
```

## Firebase Hosting + BD local
O Firebase Hosting serve apenas o frontend. A API/BD continua no PC/VM.

1. Gere o build: `npm run build`.
2. Exponha a API local com ngrok: `ngrok http 3000`.
3. No deploy do frontend, defina `VITE_API_URL` com a URL HTTPS do ngrok da API.
4. Faça deploy do `dist` no Firebase Hosting.

Se o endereço ngrok mudar, altere `VITE_API_URL` e faça novo build/deploy. Para URL fixa, use um domínio reservado do ngrok.


## Dados e rolagens
- A base de dados continua 100% local em `server/database/db.json`.
- O Firebase Hosting serve apenas o frontend.
- A API pública deve apontar para o `server.cjs` através do ngrok.
- Antes do build para Firebase, pode criar `.env` a partir de `.env.example` e colocar a URL HTTPS do ngrok em `VITE_API_URL`.

## Importante
O servidor é `server.cjs` porque o projeto usa `"type": "module"`; isto evita o erro `require is not defined in ES module scope`.

## Atualização — campanhas, auto-save e negociações
- Campanhas podem ser eliminadas no Painel Admin. A eliminação limpa também os dados associados da campanha (fichas, rolagens, iniciativas, NPCs e negociações) e remove a atribuição aos utilizadores.
- O auto-save inclui agora a cor de fundo do telemóvel e um `updatedAt`; o PUT local cria a ficha se ainda não existir.
- As definições do telemóvel têm apenas um campo de URL e uma seleção de cor padrão.
- Itens podem ter preço base em CR.
- O botão da loja abre uma página/painel de negociação onde o jogador apresenta uma proposta e uma mensagem. O Mestre vê o preço original e a proposta e, ao aprovar, o preço acordado é retirado do dinheiro em mão do jogador e o item é adicionado ao inventário.

## Funcionalidades desta build
- Base de dados exclusivamente local em `server/database/db.json`.
- Menu de Sessão sincronizado por polling: Mestre inicia/termina, jogadores e ameaças aparecem em direto.
- Sessão mostra retratos, vida, sanidade, defesa e última rolagem dos jogadores.
- Mestre pode colocar em cena NPCs/monstros já criados.
- Testes de perícia com escolha de atributo quando existem dois atributos possíveis.
- Vantagens e desvantagens com quantidade configurável.
- Testes personalizados: Sorte, Estado de sanidade e dados personalizados com quantidade de dados configurável.
- Os resultados dos rolls continuam ocultos até ao fim da animação.
