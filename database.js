// Banco de dados dinâmico de telemetria - Krathus Racing

const savedSessions = JSON.parse(localStorage.getItem('krathus_db_sessions'));

const database = {
    sessions: (savedSessions && savedSessions.length > 0 && savedSessions[0].laps.length > 0) ? savedSessions : [
        {
            id: "Bateria_17072026_233919",
            name: "Corrida ZRound (17/07/2026 23:39:19)",
            date: "17/07/2026 23:39:19",
            type: "Corrida",
            event: "Etapa Oficial",
            laps: [
                { sessionName: "Corrida ZRound (17/07/2026 23:39:19)", lap: 1, driver: "DJ", time: 4.520, event: "" },
                { sessionName: "Corrida ZRound (17/07/2026 23:39:19)", lap: 1, driver: "Ronaldo", time: 4.810, event: "" },
                { sessionName: "Corrida ZRound (17/07/2026 23:39:19)", lap: 1, driver: "Raphael", time: 4.310, event: "" },
                { sessionName: "Corrida ZRound (17/07/2026 23:39:19)", lap: 2, driver: "DJ", time: 4.120, event: "" },
                { sessionName: "Corrida ZRound (17/07/2026 23:39:19)", lap: 2, driver: "Ronaldo", time: 4.250, event: "" },
                { sessionName: "Corrida ZRound (17/07/2026 23:39:19)", lap: 2, driver: "Raphael", time: 4.150, event: "Melhor setor" }
            ]
        }
    ]
};
