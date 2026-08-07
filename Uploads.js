// banco-de-database.js
// Configuração e ponte oficial para o banco de dados "Upload" no Firebase Realtime Database.

console.log("Banco de dados 'Upload' integrado e pronto para sincronização com o Firebase.");

// Inicializa o cache global de arquivos JSON caso ainda não exista
if (typeof listaJsonsCache === 'undefined') {
    var listaJsonsCache = [];
}
