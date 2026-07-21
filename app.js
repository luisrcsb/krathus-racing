// Inicializa os checkboxes dinamicamente ao carregar a página
function initFilters() {
    const sessionContainer = document.getElementById('sessionCheckboxes');
    const driverContainer = document.getElementById('driverCheckboxes');

    sessionContainer.innerHTML = '';
    database.sessions.forEach(s => {
        sessionContainer.innerHTML += `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer; color: var(--text-main);">
                <input type="checkbox" name="filterSession" value="${s.id}" checked onchange="applyFilters()" style="accent-color: var(--accent-red);">
                ${s.name}
            </label>
        `;
    });

    driverContainer.innerHTML = '';
    getUniqueDrivers().forEach(d => {
        driverContainer.innerHTML += `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer; color: var(--text-main);">
                <input type="checkbox" name="filterDriver" value="${d}" checked onchange="applyFilters()" style="accent-color: var(--accent-red);">
                ${d}
            </label>
        `;
    });
}

// Botões rápidos para Marcar/Desmarcar todos os checkboxes
function toggleAllCheckboxes(state) {
    document.querySelectorAll('input[name="filterSession"]').forEach(cb => cb.checked = state);
    document.querySelectorAll('input[name="filterDriver"]').forEach(cb => cb.checked = state);
    applyFilters();
}

// Aplica os filtros com base nas caixas marcadas
function applyFilters() {
    const selectedSessions = Array.from(document.querySelectorAll('input[name="filterSession"]:checked')).map(cb => cb.value);
    const selectedDrivers = Array.from(document.querySelectorAll('input[name="filterDriver"]:checked')).map(cb => cb.value);

    let filteredSessions = database.sessions.filter(s => selectedSessions.includes(s.id));

    let allClassRows = [];
    let allLaps = [];

    filteredSessions.forEach(s => {
        const stats = calculateSessionStats(s);
        stats.forEach(st => {
            if (selectedDrivers.includes(st.name)) {
                allClassRows.push({ ...st, sessionName: s.name, sessionId: s.id });
            }
        });

        s.laps.forEach(l => {
            if (selectedDrivers.includes(l.driver)) {
                allLaps.push({ ...l, sessionName: s.name, sessionId: s.id });
            }
        });
    });

    updateCards(filteredSessions, allClassRows, allLaps);
    renderClassificationTable(allClassRows);
    renderDriverRaceAnalysis(filteredSessions, selectedDrivers);
    renderLapsTable(allLaps);
    renderChart(allLaps);
    renderSummaryList(allClassRows);
}

// Função de reset ajustada para marcar tudo de novo
function resetFilters() {
    toggleAllCheckboxes(true);
}
