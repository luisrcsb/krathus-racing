// MOTOR LÓGICO E CÁLCULO DE TELEMETRIA - Krathus Racing

let myChart = null;

function getDatabase() {
    const saved = localStorage.getItem('krathus_db_sessions');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return { sessions: parsed };
            }
        } catch (e) {
            console.error("Erro ao ler dados salvos", e);
        }
    }
    return { sessions: [] };
}

function getUniqueDrivers() {
    const db = getDatabase();
    const set = new Set();
    db.sessions.forEach(s => {
        if (s.laps && Array.isArray(s.laps)) {
            s.laps.forEach(l => {
                if (l.driver) set.add(l.driver);
            });
        }
    });
    return Array.from(set);
}

function calculateSessionStats(session) {
    const driverLapsMap = {};

    if (!session.laps || !Array.isArray(session.laps)) return [];

    session.laps.forEach(l => {
        if (!driverLapsMap[l.driver]) {
            driverLapsMap[l.driver] = [];
        }
        driverLapsMap[l.driver].push(l);
    });

    const driverStats = [];

    Object.keys(driverLapsMap).forEach(driver => {
        const laps = driverLapsMap[driver];
        const validLaps = laps.filter(l => l.time < 60);
        const totalLapsCount = laps.length;

        const totalTimeSeconds = laps.reduce((acc, l) => acc + l.time, 0);
        
        const minutes = Math.floor(totalTimeSeconds / 60);
        const seconds = (totalTimeSeconds % 60).toFixed(3).replace('.', ',');
        const totalTimeFormatted = `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(6,'0')}`;

        let bestLapObj = { time: 999, lap: 0 };
        validLaps.forEach(l => {
            if (l.time < bestLapObj.time) {
                bestLapObj = { time: l.time, lap: l.lap };
            }
        });

        const sumValid = validLaps.reduce((acc, l) => acc + l.time, 0);
        const avg = validLaps.length > 0 ? sumValid / validLaps.length : 0;

        const variance = validLaps.length > 0 
            ? validLaps.reduce((acc, l) => acc + Math.pow(l.time - avg, 2), 0) / validLaps.length 
            : 0;
        const stdDev = Math.sqrt(variance);

        const driverEvents = laps.filter(l => l.event && l.event.trim() !== '');

        driverStats.push({
            name: driver,
            totalLaps: totalLapsCount,
            validLaps: validLaps.length,
            totalTimeSeconds: totalTimeSeconds,
            totalTimeFormatted: totalTimeFormatted,
            bestLap: bestLapObj.time < 999 ? `${bestLapObj.time.toFixed(3).replace('.',',')}s (V${String(bestLapObj.lap).padStart(2,'0')})` : '--',
            bestLapTime: bestLapObj.time,
            avg: avg,
            stdDev: stdDev,
            events: driverEvents
        });
    });

    driverStats.sort((a, b) => b.totalLaps - a.totalLaps || a.totalTimeSeconds - b.totalTimeSeconds);

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
    const db = getDatabase();
    const sessionContainer = document.getElementById('sessionCheckboxes');
    const driverContainer = document.getElementById('driverCheckboxes');

    if (!sessionContainer || !driverContainer) return;

    sessionContainer.innerHTML = '';
    if (db.sessions.length === 0) {
        sessionContainer.innerHTML = '<span style="font-size:0.8rem; color:var(--text-muted);">Nenhuma bateria carregada. Faça upload de um arquivo.</span>';
    } else {
        db.sessions.forEach(s => {
            sessionContainer.innerHTML += `
                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer; color: var(--text-main);">
                    <input type="checkbox" name="filterSession" value="${s.id}" checked onchange="applyFilters()" style="accent-color: var(--accent-red);">
                    ${s.name}
                </label>
            `;
        });
    }

    driverContainer.innerHTML = '';
    const drivers = getUniqueDrivers();
    if (drivers.length === 0) {
        driverContainer.innerHTML = '<span style="font-size:0.8rem; color:var(--text-muted);">Nenhum piloto encontrado.</span>';
    } else {
        drivers.forEach(d => {
            driverContainer.innerHTML += `
                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer; color: var(--text-main);">
                    <input type="checkbox" name="filterDriver" value="${d}" checked onchange="applyFilters()" style="accent-color: var(--accent-red);">
                    ${d}
                </label>
            `;
        });
    }
}

function toggleAllCheckboxes(state) {
    document.querySelectorAll('input[name="filterSession"]').forEach(cb => cb.checked = state);
    document.querySelectorAll('input[name="filterDriver"]').forEach(cb => cb.checked = state);
    applyFilters();
}

function applyFilters() {
    const db = getDatabase();
    const selectedSessions = Array.from(document.querySelectorAll('input[name="filterSession"]:checked')).map(cb => cb.value);
    const selectedDrivers = Array.from(document.querySelectorAll('input[name="filterDriver"]:checked')).map(cb => cb.value);

    let filteredSessions = db.sessions.filter(s => selectedSessions.includes(s.id));

    let allClassRows = [];
    let allLaps = [];

    filteredSessions.forEach(s => {
        const stats = calculateSessionStats(s);
        stats.forEach(st => {
            if (selectedDrivers.includes(st.name)) {
                allClassRows.push({ ...st, sessionName: s.name, sessionId: s.id });
            }
        });

        if (s.laps && Array.isArray(s.laps)) {
            s.laps.forEach(l => {
                if (selectedDrivers.includes(l.driver)) {
                    allLaps.push({ ...l, sessionName: s.name, sessionId: s.id });
                }
            });
        }
    });

    updateCards(filteredSessions, allClassRows, allLaps);
    renderClassificationTable(allClassRows);
    renderDriverRaceAnalysis(filteredSessions, selectedDrivers);
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

    if (!cardWinner) return;

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
    if (!tbody) return;
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

function renderDriverRaceAnalysis(filteredSessions, selectedDrivers) {
    const container = document.getElementById('driverAnalysisContainer');
    if (!container) return;
    container.innerHTML = '';

    selectedDrivers.forEach(driverName => {
        let driverHtml = `
            <div style="background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: var(--accent-red); margin-bottom: 12px;">🏎️ Análise de Desempenho e Consistência: <strong>${driverName}</strong></h3>
                <div style="display: flex; flex-direction: column; gap: 16px;">
        `;

        let count = 0;
        filteredSessions.forEach(session => {
            const stats = calculateSessionStats(session);
            const dData = stats.find(s => s.name === driverName);
            if (!dData) return;
            count++;

            let consistencyText = "";
            let consistencyColor = "var(--accent-green)";
            if (dData.stdDev < 1.0) {
                consistencyText = "Excepcional! Ritmo extremamente constante e previsível em voltas limpas.";
            } else if (dData.stdDev < 2.5) {
                consistencyText = "Boa consistência, mantendo um bom padrão de pilotagem com pequenas variações de traçado.";
            } else {
                consistencyText = "Oscilação acentuada no ritmo, indicando voltas sob influência de tráfego, pequenos erros ou incidentes em pista.";
                consistencyColor = "var(--accent-yellow)";
            }

            let summaryText = `Encerrou a bateria na <strong>${dData.pos}ª posição</strong> completando ${dData.validLaps} voltas válidas de um total de ${dData.totalLaps} voltas registradas. `;
            if (dData.events.length > 0) {
                summaryText += `Durante a prova, registrou os seguintes marcos/incidentes: <em>` + dData.events.map(e => `[Volta ${e.lap}: ${e.event}]`).join(' ') + `</em>. `;
            } else {
                summaryText += `Manteve uma pilotagem limpa sem nenhum incidente grave reportado na telemetria. `;
            }
            summaryText += `Seu ritmo médio foi de <strong>${dData.avg.toFixed(3).replace('.',',')}s</strong> com melhor marca pessoal de <strong>${dData.bestLap}</strong>.`;

            driverHtml += `
                <div style="background-color: var(--bg-dark); border: 1px solid var(--border-color); border-left: 4px solid ${dData.pos === 1 ? 'var(--accent-yellow)' : 'var(--accent-blue)'}; padding: 18px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-weight: bold; color: #fff; font-size: 1.05rem;">🏁 ${session.name} (${session.event})</span>
                        <span class="badge ${dData.pos === 1 ? 'badge-p1' : (dData.pos === 2 ? 'badge-p2' : 'badge-p3')}">${dData.pos}º Lugar</span>
                    </div>
                    
                    <div style="font-size: 0.9rem; color: var(--text-main); line-height: 1.5; margin-bottom: 12px; background: #121520; padding: 12px; border-radius: 6px; border: 1px solid #1f2335;">
                        <strong>📝 Resumo da Corrida:</strong> ${summaryText}
                    </div>

                    <div style="font-size: 0.9rem; color: var(--text-main); line-height: 1.4; margin-bottom: 12px; background: #121520; padding: 12px; border-radius: 6px; border: 1px solid #1f2335;">
                        <strong>🎯 Análise de Consistência:</strong> <span style="color: ${consistencyColor};">${consistencyText}</span> (Desvio Padrão: <strong>±${dData.stdDev.toFixed(3).replace('.',',')}s</strong>)
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; font-size: 0.85rem; background: #161926; padding: 10px; border-radius: 6px;">
                        <div>⏱️ <strong>Tempo Total:</strong> ${dData.totalTimeFormatted}</div>
                        <div>📊 <strong>Gap / Diferença:</strong> ${dData.gap}</div>
                        <div>🚀 <strong>Melhor Volta:</strong> <span style="color: var(--accent-green);">${dData.bestLap}</span></div>
                        <div>📈 <strong>Média de Giro:</strong> ${dData.avg.toFixed(3).replace('.',',')}s</div>
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
    if (!tbody) return;
    tbody.innerHTML = '';

    if (laps.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">Nenhuma volta registrada.</td></tr>';
        return;
    }

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
    if (!container) return;
    container.innerHTML = '';

    if (driversStats.length === 0) {
        container.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted);">Sem dados para resumir.</span>';
        return;
    }

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
    const canvasElement = document.getElementById('lapChart');
    if (!canvasElement) return;
    const ctx = canvasElement.getContext('2d');
    const chartLaps = laps.filter(l => l.time < 60);

    const lapNumbers = [...new Set(chartLaps.map(l => l.lap))].sort((a,b) => a - b);
    const labels = lapNumbers.map(n => `V${n}`);

    const drivers = [...new Set(chartLaps.map(l => l.driver))];
    const colorPalette = ['#e63946', '#2ecc71', '#f1c40f', '#3498db', '#9b59b6', '#e67e22'];

    const datasets = drivers.map((driver, index) => {
        const driverLaps = chartLaps.filter(l => l.driver === driver);
        const dataPoints = lapNumbers.map(lapNum => {
            const found = driverLaps.find(l => l.lap === lapNum);
            return found ? found.time : null;
        });

        return {
            label: driver,
            data: dataPoints,
            borderColor: colorPalette[index % colorPalette.length],
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
    toggleAllCheckboxes(true);
}

window.onload = function() {
    initFilters();
    applyFilters();
};
