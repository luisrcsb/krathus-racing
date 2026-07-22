# 🏁 Krathus Racing - Central de Telemetria e Análise Dinâmica

> **Versão Atual:** `v1.2.0`  
> **Status do Projeto:** Estável / Produção  
> **Compatibilidade do Sistema:** MYLAPS Sports Timing & ZRound Suite

A **Central de Telemetria e Análise Dinâmica da Krathus Racing** é uma plataforma web completa desenvolvida para processar, visualizar e gerar relatórios analíticos avançados de corridas de veículos RC e automobilismo a partir de dados de cronometragem.

---

## 🚀 Principais Recursos

### 1. 📊 Painel Interativo Multissessão
- **Filtros Dinâmicos em Tempo Real:** Permite isolar ou combinar **Sessões/Baterias**, **Pilotos** e **Módulos Visíveis** instantaneamente.
- **KPIs Principais no Topo:** Destaque automático para Vencedor da Seleção, Melhor Volta Legítima da prova, Total de Voltas Válidas e Média Global do Grid.

### 2. 🧩 Módulos de Visualização Flexíveis
1. **📈 Evolução de Ritmo (Lap Times - Lap by Lap):** Gráfico interativo temporal expandido em largura total para analisar o ritmo e a degradação dos tempos de cada piloto ao longo das voltas.
2. **📊 Posição Volta a Volta (Race Position History & Log):**
   - **Gráfico de Posições com Eixo Invertido:** Visualização gráfica clara de ultrapassagens e trocas de liderança (1º lugar mantido no topo).
   - **📝 Relatório Narrativo da Disputa:** Painel analítico automático posicionado abaixo do gráfico, descrevendo detalhadamente o grid de largada, momentos exatos de ganho/perda de posições e a bandeirada final.
3. **🏆 Classificação & Análise de Consistência:** Tabela unificada integrando a classificação oficial, métricas estatísticas (Posição, Voltas Válidas, Tempo Total, Melhor Volta, Média e Desvio Padrão) e **diagnóstico individual em sub-linha** para cada piloto.
4. **⏱️ Tabela Geral Volta a Volta (Grid Comparativo):** Matriz lado a lado com os tempos de todas as voltas registradas, com destaque visual em verde para as passagens mais rápidas (*⚡ Fastest Lap*).

### 3. 📄 Gerador de Relatório PDF Empresarial
- **Botão de Alto Contraste:** Atalho direto para exportação e impressão de relatórios.
- **Estilização `@media print` Exclusiva:** Converte automaticamente o tema escuro (*Dark Mode*) da tela para um documento corporativo em fundo branco com **texto 100% preto**, otimizando a leitura e a impressão em papel.

### 4. 🏷️ Identidade e Compatibilidade
- Rodapé com metadados do sistema, versão, status de execução e logotipos de integração nativa aos sistemas **MYLAPS** e **ZRound**.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 & CSS3:** CSS Grid, Flexbox, Variáveis CSS (`:root`) e regras avançadas de impressão (`@media print`).
- **JavaScript (Vanilla ES6+):** Processamento dinâmico sem dependências de frameworks, geração de relatórios textuais de ultrapassagem e manipulação DOM.
- **Chart.js (v4):** Renderização dos gráficos de tempo e de posições.
- **Print API Native (`window.print()`):** Exportação direta para PDF.

---

## 📁 Estrutura de Arquivos do Projeto

```text
krathus-racing-telemetria/
├── index.html        # Dashboard principal de telemetria, gráficos e PDF
├── upload.html       # Módulo de importação/envio de arquivos de prova
└── README.md         # Documentação oficial do projeto
