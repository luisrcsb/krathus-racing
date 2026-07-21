// Banco de dados dinâmico de telemetria - Krathus Racing

// Verifica se existem sessões novas enviadas pelo painel secreto de upload
const savedSessions = JSON.parse(localStorage.getItem('krathus_db_sessions'));

const database = {
    sessions: savedSessions || [
        {
            id: "Bateria_17072026_233919",
            name: "Corrida ZRound (17/07/2026 23:39:19)",
            date: "17/07/2026 23:39:19",
            type: "Corrida",
            event: "Etapa Oficial",
            laps: [
                // Insira as voltas padrão aqui se necessário, ou deixe gerenciado pelo upload
            ]
        }
    ]
};
