console.log("Banco de dados integrado e pronto para sincronização com o Firebase.");

// Inicializa o cache global de dados caso ainda não exista
if (typeof listaJsonsCache === 'undefined') {
    var listaJsonsCache = [];
}
