# GeoCam Engenharia - Documentação de Memória

## Resumo do Projeto
Um Web App (PWA) de câmera focado no uso em campo (obras de engenharia), desenvolvido puramente com Vite, HTML, CSS (Vanilla), e JavaScript.
O app captura fotos na proporção exata de 1:1 (quadrada, 1080x1080) sobrepondo uma logomarca e metadados vitais de georreferenciamento em tempo real, gerando evidências fotográficas automáticas para auditoria e controle.

## Stack Tecnológica
- **Vite** como empacotador veloz.
- **vite-plugin-pwa** para transformar em aplicativo nativo (funcionalidade offline, manifest e Service Worker).
- **@vitejs/plugin-basic-ssl** para rodar localmente com HTTPS, um requisito rigoroso para os navegadores mobile permitirem o uso do hardware da Câmera.
- **Proj4js** para conversão matemática do sinal GPS de Geográficas (Lat/Lon) para Projetadas UTM (E, N).

## Funcionalidades Implementadas

### 1. Captura de Foto (Motor do Canvas)
- A foto é extraída por baixo dos panos na resolução travada em `1080x1080` (independente da tela do celular).
- Logomarca da empresa fixada de forma absoluta no canto superior esquerdo (coordenadas Canvas `0,0`, sem padding).
- Textos de metadados fixados no canto inferior direito. O design é altamente refinado: fonte de `14px`, `letter-spacing: 0`, e um micro-contorno (`lineWidth: 0.5`, `rgba(0,0,0,0.5)`) para máxima legibilidade sem poluição visual.

### 2. Georreferenciamento e Formatação (UTM)
- Transforma Lat/Lon para Coordenadas UTM (`E` e `N` sem casas decimais).
- Calcula o Hemisfério e a banda da Zona UTM exatamente (ex: "24M" em vez do genérico "24S") usando a função robusta `getUTMLetter()`.
- Puxa o nome dinâmico da Empresa do arquivo `./Nome.json` via Fetch na inicialização do app.

### 3. Gerenciamento Inteligente de Obras
- Interface oculta via *Accordion* (`<details>`) em Configurações para Cadastrar, Editar e Excluir obras ativas.
- Salva o ponto central (E, N) ou o captura na hora usando o botão nativo do GPS.
- **Algoritmo de Bounding Box:** Para detectar se o usuário pisou em uma obra, a lógica não usa uma distância radial, mas constrói uma caixa matemática pegando o limite Máximo/Mínimo de X e Y somados ao `Raio` informado pelo usuário, otimizando o enquadramento de grandes retângulos.
- Tudo persistido imediatamente no `localStorage`. Fora da obra, estampa um `-`.

### 4. Nivelador de Horizonte Embutido
- Um indicador SVG discreto (`24x24px`) no topo da tela reage ativamente à inclinação `gamma` do sensor de giroscópio do celular.
- Se o usuário manter a inclinação próxima a `0.0°`, o marcador digital fica verde.
- Implementado um "Filtro Passa-Baixa" (Média Móvel com peso `0.15`) puramente via JS para matar ruídos ou tremores físicos de hardware, garantindo transição imaculada e super natural. Não é impresso na foto final.

### 5. Layout com Trava de Rotação Simulada
- O PWA e o container de HTML/Video estão com `"orientation": "portrait"` selados. O Layout geral nunca quebra quando o aparelho é virado.
- Contudo, **se o usuário quiser tirar a foto na paisagem (Landscape)**, o evento de giroscópio invoca a função `updateUIOrientation(rot)`.
- Ela identifica se o celular rotacionou para 90° ou -90° e então, usando CSS dinâmico, **desloca e gira** a Logomarca e os Textos para os novos "falsos" cantos superiores/inferiores garantindo que a pessoa os leia de pé.
- Na hora do disparo, o `ctx` do Canvas traduz essa métrica física, aplica o `ctx.translate` + `ctx.rotate`, e salva o `.JPG` na memória como se a foto estivesse sendo enxergada no PC perfeitamente orientada e natural.

### 6. Atualizações e Service Worker
- O botão "Buscar Atualizações" comunica-se via `navigator.serviceWorker.getRegistration().update()`.
- Previne travamento com aviso de feedback ("Buscando..."), identificando se existe SSL válido. Assim que finalizado, o SW decide se solta o balão para recarregar o novo layout que vier lá da Vercel/Hospedagem futura.

## Onde Paramos / Status Atual
- Versão madura de base finalizada. UI, PWA e core de UTM/Canvas funcionando perfeitamente sem gargalos.
- Ajustes finos do ícone de nivelador (tremores consertados e alinhamento ajustado) e da detecção precisa de Obras validados no dispositivo final do usuário.
- Nas próximas conversas, basta pedir ao assistente para referenciar este documento como ponte de retomada.
