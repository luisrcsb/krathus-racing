function getDatabase() {
    const saved = localStorage.getItem('krathus_db_sessions');
    return saved ? { sessions: JSON.parse(saved) } : { sessions: [] };
}

function initFilters() {
    const db = getDatabase();
    const sContainer = document.getElementById('sessionCheckboxes');
    const dContainer = document.getElementById('driverCheckboxes');
    if (!sContainer || !dContainer) return;

    sContainer.innerHTML = '';
    db.sessions.forEach(s => {
        sContainer.innerHTML += `<label style="display:block; font-size:0.85rem; margin-bottom:5px;"><input type="checkbox" name="filterSession" value="${s.id}" checked onchange="renderAll()"> ${s.name}</label>`;
    });

    const drivers = [...new Set(db.sessions.flatMap(s => s.laps.map(l => l.driver)))];
    dContainer.innerHTML = '';
    drivers.forEach(d => {
        dContainer.innerHTML += `<label style="display:block; font-size:0.85rem; margin-bottom:5px;"><input type="checkbox" name="filterDriver" value="${d}" checked onchange="renderAll()"> ${d}</label>`;
    });
}

function renderAll() {
    const db = getDatabase();
    const selSessions = Array.from(document.querySelectorAll('input[name="filterSession"]:checked')).map(cb => cb.value);
    const selDrivers = Array.from(document.querySelectorAll('input[name="filterDriver"]:checked')).map(cb => cb.value);

    let rows = [];
    db.sessions.filter(s => selSessions.includes(s.id)).forEach(s => {
        // Agrupa por piloto na sessão
        const map = {};
        s.laps.forEach(l => {
            if (!map[l.driver]) map[l.driver] = { name: l.driver, session: s.name, total: 0, best: 999 };
            map[l.driver].total++;
            if (l.time < map[l.driver].best) map[l.driver].best = l.time;
        });

        Object.values(map).forEach(d => {
            if (selDrivers.includes(d.name)) rows.push(d);
        });
    });

    rows.sort((a, b) => b.total - a.total || a.best - b.best);

    const tbody = document.getElementById('classificationTableBody');
    if (tbody) {
        tbody.innerHTML = rows.length ? '' : '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Nenhum resultado filtrado.</td></tr>';
        rows.forEach((r, idx) => {
            tbody.innerHTML += `<tr><td>${idx+1}º</td><td><strong>${r.name}</strong></td><td>${r.session}</td><td>${r.total}</td><td style="color:#2ecc71; font-weight:bold;">${r.best.toFixed(3)}s</td></tr>`;
        });
    }

    document.getElementById('cardTotalLaps').innerText = rows.reduce((acc, r) => acc + r.total, 0);
}

window.onload = function() {
    initFilters();
    renderAll();
};
