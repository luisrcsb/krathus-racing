// Banco de dados dinâmico de telemetria - Krathus Racing

const savedSessions = JSON.parse(localStorage.getItem('krathus_db_sessions'));

const database = {
    sessions: savedSessions || [
        {
            id: "Bateria_17072026_233919",
            name: "Corrida ZRound (17/07/2026 23:39:19)",
            date: "17/07/2026 23:39:19",
            type: "Corrida",
            event: "Etapa Oficial",
            laps: []
        }
    ]
};
