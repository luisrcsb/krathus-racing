# 🏁 Krathus Racing - Central de Telemetria e Análise Dinâmica

> **Versão Atual:** `v1.2.0`  
> **Status do Projeto:** Estável / Produção  
> **Compatibilidade do Sistema:** MYLAPS Sports Timing & ZRound Suite

A **Central de Telemetria e Análise Dinâmica da Krathus Racing** é uma aplicação web completa projetada para processar, visualizar e gerar relatórios analíticos avançados de corridas de veículos RC e automobilismo a partir de dados de voltas e cronometragem.

---

## 🚀 Principais Recursos

### 1. 📊 Painel Interativo Multissessão
- **Filtros Dinâmicos em Tempo Real:** Permite isolar ou combinar **Sessões/Baterias**, **Pilotos** e **Módulos Visíveis** instantaneamente.
- **KPIs Principais no Topo:** Destaque automático para o Vencedor da Seleção, Melhor Volta Legítima da prova, Total de Voltas Válidas e Média Global do Grid.

### 2. 🧩 Módulos de Visualização Flexíveis
1. **📈 Evolução de Ritmo (Gráfico & Resumo):** Gráfico interativo volta a volta (*Lap by Lap*) utilizando Chart.js, permitindo comparar o ritmo e a degradação de cada piloto.
2. **🏆 Classificação & Análise de Consistência:** Tabela unificada que junta a classificação oficial, dados numéricos (Posição, Voltas Válidas, Tempo Total, Melhor Volta, Média e Desvio Padrão) e uma **linha de análise diagnóstica individual** para cada piloto (detalhando ritmo, picos e incidentes em pista).
3. **⏱️ Tabela Geral Volta a Volta (Grid Comparativo):** Matriz lado a lado com todos os tempos de cada volta gravada, com destaque em verde para as passagens mais rápidas (*⚡ Fastest Lap*).

### 3. 📄 Gerador de Relatório PDF Inteligente
- **Botão de Alto Contraste:** Localizado diretamente abaixo do painel de filtros para geração rápida do relatório impresso/salvo.
- **Motor CSS `@media print` Automatizado:** Transforma o dashboard escuro (Dark Mode) da tela em um documento corporativo limpo, em fundo claro, texto **100% preto** para máxima legibilidade e economia de tinta, omitindo botões e controles interativos.

### 4. 🏷️ Rodapé de Integração
- Presença e suporte oficial aos sistemas de cronometragem **MYLAPS** e **ZRound**, juntamente com os direitos reservados da **Krathus Racing**.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 & CSS3:** CSS Grid, Flexbox e CSS Variables (`:root`) para temas dinamizados.
- **JavaScript (Vanilla ES6+):** Manipulação de DOM sem dependências pesadas, cálculo de médias/desvios e renderização condicional.
- **Chart.js (v4):** Biblioteca leve para renderização do gráfico de evolução temporal.
- **Print API Native (`window.print()`):** Para exportação nativa em PDF com CSS dedicado para impressão.

---

## 📁 Estrutura de Arquivos do Projeto

```text
krathus-racing-telemetria/
├── index.html        # Dashboard principal de telemetria e gerador de PDF
├── upload.html       # Módulo de importação/envio de arquivos de prova
└── README.md         # Documentação oficial do projeto
