// MOTOR LÓGICO E CÁLCULO DE TELEMETRIA - Krathus Racing

let myChart = null;

// Extrai todos os pilotos únicos do banco
function getUniqueDrivers() {
    const set = new Set();
    database.sessions.forEach(s => s.laps.forEach(l => set.add(l.driver)));
    return Array.from(set);
}

// CÁLCULO AUTOMÁTICO DE METRICAS POR SESSÃO
function calculateSessionStats(session) {
    const driverLapsMap = {};

    session.laps.forEach(l => {
        if (!driverLapsMap[l.driver]) {
            driverLapsMap[l.driver] = [];
        }
        driverLapsMap[l.driver].push(l);
    });

    const driverStats = [];

    Object.keys(driverLapsMap).forEach(driver => {
        const laps = driverLapsMap[driver];
        const validLaps = laps.filter(l => l.time < 60); // descarta retenções > 60s para cálculo de média
        const totalLapsCount = laps.length;

        const totalTimeSeconds = laps.reduce((acc, l) => acc + l.time, 0);
        
        // Formata tempo total em MM:SS,ms
        const minutes = Math.floor(totalTimeSeconds / 60);
        const seconds = (totalTimeSeconds % 60).toFixed(3).replace('.', ',');
        const totalTimeFormatted = `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(6,'0')}`;

        // Melhor volta
        let bestLapObj = { time: 999, lap: 0 };
        validLaps.forEach(l => {
            if (l.time < bestLapObj.time) {
                bestLapObj = { time: l.time, lap: l.lap };
            }
        });

        // Média e Desvio Padrão
        const sumValid = validLaps.reduce((acc, l) => acc + l.time, 0);
        const avg = validLaps.length > 0 ? sumValid / validLaps.length : 0;

        const variance = validLaps.length > 0 
            ? validLaps.reduce((acc, l) => acc + Math.pow(l.time - avg, 2), 0) / validLaps.length 
            : 0;
        const stdDev = Math.sqrt(variance);

        driverStats.push({
            name: driver,
            totalLaps: totalLapsCount,
            validLaps: validLaps.length,
            totalTimeSeconds: totalTimeSeconds,
            totalTimeFormatted: totalTimeFormatted,
            bestLap: bestLapObj.time < 999 ? `${bestLapObj.time.toFixed(3).replace('.',',')}s (V${String(bestLapObj.lap).padStart(2,'0')})` : '--',
            bestLapTime: bestLapObj.time,
            avg: avg,
            stdDev: stdDev
        });
    });

    // Ordenação: 1º por Total de Voltas (decrescente), 2º por Tempo Total (crescente)
    driverStats.sort((a, b) => b.totalLaps - a.totalLaps || a.totalTimeSeconds - b.totalTimeSeconds);

    // Atribui Posições e Gap
    const leaderLaps = driverStats[0] ? driverStats[0].totalLaps : 0;
    driverStats.forEach((d, idx) => {
        d.pos = idx + 1;
        if (idx === 0) {
            d.gap = 'Líder';
        } else {
            const diffLaps = leaderLaps - d.totalLaps;
            d.gap = diffLaps > 0 ? `+${diffLaps} Volta(s)` : `+${(d.totalTimeSeconds - driverStats[0].totalTimeSeconds).toFixed(3)}s`;
        }
    });

    return driverStats;
}

function initFilters() {
    const sessionSelect = document.getElementById('filterSession');
    const driverSelect = document.getElementById('filterDriver');

    sessionSelect.innerHTML = '<option value="ALL">Todas as Baterias</option>';
    database.sessions.forEach(s => {
        sessionSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });

    driverSelect.innerHTML = '<option value="ALL">Todos os Pilotos</option>';
    getUniqueDrivers().forEach(d => {
        driverSelect.innerHTML += `<option value="${d}">${d}</option>`;
    });
}

function applyFilters() {
    const sessionVal = document.getElementById('filterSession').value;
    const driverVal = document.getElementById('filterDriver').value;

    let filteredSessions = database.sessions.filter(s => sessionVal === 'ALL' || s.id === sessionVal);

    let allClassRows = [];
    let allLaps = [];

    filteredSessions.forEach(s => {
        const stats = calculateSessionStats(s);
        stats.forEach(st => {
            if (driverVal === 'ALL' || st.name === driverVal) {
                allClassRows.push({ ...st, sessionName: s.name, sessionId: s.id });
            }
        });

        s.laps.forEach(l => {
            if (driverVal === 'ALL' || l.driver === driverVal) {
                allLaps.push({ ...l, sessionName: s.name, sessionId: s.id });
            }
        });
    });

    updateCards(filteredSessions, allClassRows, allLaps);
    renderClassificationTable(allClassRows);
    renderDriverRaceAnalysis(filteredSessions, driverVal);
    renderLapsTable(allLaps);
    renderChart(allLaps);
    renderSummaryList(allClassRows);
}

function updateCards(sessions, driversStats, laps) {
    const cardWinner = document.getElementById('cardWinner');
    const cardWinnerSub = document.getElementById('cardWinnerSub');
    const cardFastest = document.getElementById('cardFastest');
    const cardFastestSub = document.getElementById('cardFastestSub');
    const cardTotalLaps = document.getElementById('cardTotalLaps');
    const cardAvgPace = document.getElementById('cardAvgPace');

    if (sessions.length === 1) {
        const stats = calculateSessionStats(sessions[0]);
        const winner = stats[0] ? stats[0].name : '--';
        cardWinner.innerText = winner;
        cardWinnerSub.innerText = sessions[0].name;
    } else {
        cardWinner.innerText = "Múltiplas Sessões";
        cardWinnerSub.innerText = `${sessions.length} baterias carregadas`;
    }

    const validLaps = laps.filter(l => l.time < 60);
    cardTotalLaps.innerText = validLaps.length;

    if (validLaps.length > 0) {
        const best = validLaps.reduce((prev, curr) => prev.time < curr.time ? prev : curr);
        cardFastest.innerText = `${best.time.toFixed(3).replace('.', ',')}s`;
        cardFastestSub.innerText = `${best.driver} (${best.sessionName})`;

        const avgGlobal = validLaps.reduce((acc, c) => acc + c.time, 0) / validLaps.length;
        cardAvgPace.innerText = `${avgGlobal.toFixed(3).replace('.', ',')}s`;
    } else {
        cardFastest.innerText = "--";
        cardFastestSub.innerText = "Sem laps no filtro";
        cardAvgPace.innerText = "--";
    }
}

function renderClassificationTable(driversStats) {
    const tbody = document.getElementById('classificationTableBody');
    tbody.innerHTML = '';

    if (driversStats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: var(--text-muted);">Nenhum resultado encontrado.</td></tr>';
        return;
    }

    driversStats.sort((a, b) => a.pos - b.pos);

    driversStats.forEach(d => {
        let badgeClass = d.pos === 1 ? 'badge-p1' : (d.pos === 2 ? 'badge-p2' : 'badge-p3');
        tbody.innerHTML += `
            <tr>
                <td><span class="badge ${badgeClass}">${d.pos}º</span></td>
                <td><strong>${d.name}</strong></td>
                <td><span class="badge badge-session">${d.sessionName}</span></td>
                <td>${d.validLaps} / ${d.totalLaps}</td>
                <td>${d.totalTimeFormatted}</td>
                <td><span style="color: var(--accent-green); font-weight: bold;">${d.bestLap}</span></td>
                <td>${d.avg.toFixed(3).replace('.', ',')}s</td>
                <td>±${d.stdDev.toFixed(3).replace('.', ',')}s</td>
            </tr>
        `;
    });
}

function renderDriverRaceAnalysis(filteredSessions, selectedDriver) {
    const container = document.getElementById('driverAnalysisContainer');
    container.innerHTML = '';

    const uniqueDrivers = selectedDriver === 'ALL' 
        ? getUniqueDrivers()
        : [selectedDriver];

    uniqueDrivers.forEach(driverName => {
        let driverHtml = `
            <div style="background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: var(--accent-red); margin-bottom: 12px;">🏎️ Análise de Desempenho: <strong>${driverName}</strong></h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
        `;

        let count = 0;
        filteredSessions.forEach(session => {
            const stats = calculateSessionStats(session);
            const dData = stats.find(s => s.name === driverName);
            if (!dData) return;
            count++;

            driverHtml += `
                <div style="background-color: var(--bg-dark); border: 1px solid var(--border-color); border-left: 4px solid ${dData.pos === 1 ? 'var(--accent-yellow)' : 'var(--accent-blue)'}; padding: 16px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: bold; color: #fff;">🏁 ${session.name}</span>
                        <span class="badge ${dData.pos === 1 ? 'badge-p1' : (dData.pos === 2 ? 'badge-p2' : 'badge-p3')}">${dData.pos}º Lugar</span>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px;">
                        ⏱️ Tempo Total: ${dData.totalTimeFormatted} (${dData.gap})
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85rem; background: #141722; padding: 10px; border-radius: 6px;">
                        <div>🚀 <strong>Melhor Volta:</strong> <span style="color: var(--accent-green);">${dData.bestLap}</span></div>
                        <div>📊 <strong>Média:</strong> ${dData.avg.toFixed(3).replace('.',',')}s</div>
                        <div>🔄 <strong>Voltas:</strong> ${dData.validLaps}</div>
                        <div>📈 <strong>Desvio:</strong> ±${dData.stdDev.toFixed(3).replace('.',',')}s</div>
                    </div>
                </div>
            `;
        });

        driverHtml += `</div></div>`;
        if (count > 0) container.innerHTML += driverHtml;
    });
}

function renderLapsTable(laps) {
    const tbody = document.getElementById('lapTableBody');
    tbody.innerHTML = '';

    laps.forEach(l => {
        tbody.innerHTML += `
            <tr>
                <td><small>${l.sessionName}</small></td>
                <td><strong>V${String(l.lap).padStart(2, '0')}</strong></td>
                <td><strong>${l.driver}</strong></td>
                <td>${l.time.toFixed(3).replace('.', ',')}s</td>
                <td>${l.event || 'Normal'}</td>
            </tr>
        `;
    });
}

function renderSummaryList(driversStats) {
    const container = document.getElementById('driverSummaryList');
    container.innerHTML = '';

    const uniqueNames = [...new Set(driversStats.map(d => d.name))];
    uniqueNames.forEach(name => {
        const filtered = driversStats.filter(d => d.name === name);
        const avgGlobal = filtered.reduce((acc, c) => acc + c.avg, 0) / filtered.length;

        container.innerHTML += `
            <div style="background-color: var(--bg-dark); padding: 12px; border-radius: 6px; border-left: 4px solid var(--accent-red);">
                <div style="font-weight: bold; display: flex; justify-content: space-between;">
                    <span>🏎️ ${name}</span>
                    <span style="color: var(--accent-yellow); font-size: 0.85rem;">Média: ${avgGlobal.toFixed(3).replace('.',',')}s</span>
                </div>
            </div>
        `;
    });
}

function renderChart(laps) {
    const ctx = document.getElementById('lapChart').getContext('2d');
    const chartLaps = laps.filter(l => l.time < 30);

    const lapNumbers = [...new Set(chartLaps.map(l => l.lap))].sort((a,b) => a - b);
    const labels = lapNumbers.map(n => `V${n}`);

    const drivers = [...new Set(chartLaps.map(l => l.driver))];
    const colors = { 'DJ': '#2ecc71', 'Ronaldo': '#f1c40f', 'Raphael': '#e63946' };

    const datasets = drivers.map(driver => {
        const driverLaps = chartLaps.filter(l => l.driver === driver);
        const dataPoints = lapNumbers.map(lapNum => {
            const found = driverLaps.find(l => l.lap === lapNum);
            return found ? found.time : null;
        });

        return {
            label: driver,
            data: dataPoints,
            borderColor: colors[driver] || '#3498db',
            borderWidth: 2,
            spanGaps: true,
            tension: 0.1
        };
    });

    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#a0a5b5' }, grid: { color: '#262a3d' } },
                y: { ticks: { color: '#a0a5b5' }, grid: { color: '#262a3d' } }
            },
            plugins: { legend: { labels: { color: '#f8f9fa' } } }
        }
    });
}

function resetFilters() {
    document.getElementById('filterSession').value = 'ALL';
    document.getElementById('filterDriver').value = 'ALL';
    applyFilters();
}

function openImportModal() { document.getElementById('importModal').style.display = 'flex'; }
function closeImportModal() { document.getElementById('importModal').style.display = 'none'; }

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const content = event.target.result;
            const parsed = JSON.parse(content);
            const newSessions = Array.isArray(parsed) ? parsed : [parsed];
            
            newSessions.forEach(ns => {
                if (ns.id && ns.laps) {
                    database.sessions = database.sessions.filter(s => s.id !== ns.id);
                    database.sessions.push(ns);
                }
            });

            initFilters();
            applyFilters();
            closeImportModal();
            alert("Nova sessão importada com sucesso!");
        } catch (err) {
            alert("Erro ao ler JSON. Certifique-se de que o arquivo está no formato correto de telemetria ZRound.");
        }
    };
    reader.readAsText(file);
}

window.onload = function() {
    initFilters();
    applyFilters();
};
