import os
from flask import Flask, render_template_string, request, jsonify, send_file, redirect, url_for

app = Flask(__name__)

UPLOAD_BASE_DIR = 'uploads_projetos'
os.makedirs(UPLOAD_BASE_DIR, exist_ok=True)

CATEGORIAS_VALIDAS = {
    'identidade_visual': 'identidade_visual',
    'logomarca': 'identidade_visual',
    'documento_padrao': 'documento_padrao',
    'documentos_colaboradores': 'documentos_colaboradores'
}

def listar_arquivos_projeto(project_id):
    resultado = {}
    proj_dir = os.path.join(UPLOAD_BASE_DIR, str(project_id))
    
    for cat_key in ['identidade_visual', 'documento_padrao', 'documentos_colaboradores']:
        folder_path = os.path.join(proj_dir, cat_key)
        arquivos = []
        if os.path.exists(folder_path):
            for nome_arquivo in os.listdir(folder_path):
                caminho_completo = os.path.join(folder_path, nome_arquivo)
                if os.path.isfile(caminho_completo):
                    arquivos.append({
                        'nome': nome_arquivo,
                        'caminho': caminho_completo
                    })
        resultado[cat_key] = arquivos
    return resultado

# Template HTML com design totalmente responsivo para telas móveis e desktops
TEMPLATE_HTML = """
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Projeto ROCA - Gerenciamento</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 10px; color: #333; }
        .project-management-container { background: #fff; padding: 15px; border-radius: 8px; max-width: 900px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        h2 { border-bottom: 2px solid #eaeaea; padding-bottom: 10px; color: #2c3e50; font-size: 1.4rem; }
        .file-section { background: #fdfdfd; border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 15px; border-radius: 6px; }
        .section-desc { font-size: 0.85rem; color: #64748b; margin-bottom: 12px; }
        .upload-form { display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; background: #f8fafc; padding: 12px; border-radius: 4px; }
        input[type="file"] { width: 100%; font-size: 0.9rem; }
        .button-group { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn-upload, .btn-ai, .btn-inspect, .btn-delete { padding: 8px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85rem; border: none; color: white; text-align: center; }
        .btn-upload { background-color: #2563eb; flex: 1; }
        .btn-ai { background-color: #16a34a; flex: 1; }
        .btn-inspect { background-color: #d97706; }
        .btn-delete { background-color: #dc2626; }
        .btn-upload:hover { background-color: #1d4ed8; }
        .btn-ai:hover { background-color: #15803d; }
        .btn-inspect:hover { background-color: #b45309; }
        .btn-delete:hover { background-color: #b91c1c; }
        .file-list-container { background: #fff; border: 1px solid #e2e8f0; padding: 10px; border-radius: 4px; }
        .file-list { list-style: none; padding: 0; margin: 0; }
        .file-item { display: flex; flex-direction: column; gap: 8px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
        .file-item:last-child { border-bottom: none; }
        .file-name { word-break: break-all; font-size: 0.9rem; font-weight: 500; }
        .action-buttons { display: flex; gap: 6px; width: 100%; }
        .action-buttons button { flex: 1; }
        .no-files { color: #94a3b8; font-style: italic; font-size: 0.85rem; }
        .sub-group { margin-top: 10px; border-top: 1px dashed #cbd5e1; padding-top: 10px; }

        /* Ajustes para telas maiores (tablets e desktops) */
        @media (min-width: 600px) {
            body { padding: 20px; }
            .project-management-container { padding: 30px; }
            .upload-form { flex-direction: row; align-items: center; }
            .file-item { flex-direction: row; justify-content: space-between; align-items: center; }
            .action-buttons { width: auto; }
            .action-buttons button { flex: unset; }
            h2 { font-size: 1.8rem; }
        }
    </style>
</head>
<body>

<div class="project-management-container">
    <h2>Projeto ROCA - ID: {{ project_id }}</h2>

    <!-- Seção 1: Identidade Visual & Logomarca -->
    <div class="file-section">
        <h3>🎨 Identidade Visual e Logomarca</h3>
        <p class="section-desc">Logotipos, manuais de marca, paletas de cores e diretrizes gráficas.</p>
        
        <form action="/upload/identidade_visual" method="POST" enctype="multipart/form-data" class="upload-form">
            <input type="hidden" name="project_id" value="{{ project_id }}">
            <input type="file" name="file" required>
            <div class="button-group" style="width: 100%;">
                <button type="submit" class="btn-upload">Enviar Identidade</button>
                <button type="button" class="btn-ai" onclick="analisarComIA('identidade_visual')">🤖 IA</button>
            </div>
        </form>

        <form action="/upload/logomarca" method="POST" enctype="multipart/form-data" class="upload-form sub-group">
            <input type="hidden" name="project_id" value="{{ project_id }}">
            <div style="width: 100%;">
                <label style="font-size: 0.85rem; color: #475569; display:block; margin-bottom:5px;"><strong>Logomarca Específica:</strong></label>
                <input type="file" name="file" required>
            </div>
            <button type="submit" class="btn-upload" style="width: 100%;">Enviar Logomarca</button>
        </form>

        <div class="file-list-container">
            <h4>Arquivos Enviados:</h4>
            <ul class="file-list">
                {% for arquivo in arquivos.identidade_visual %}
                <li class="file-item">
                    <span class="file-name">{{ arquivo.nome }}</span>
                    <div class="action-buttons">
                        <button class="btn-inspect" onclick="inspecionarArquivo('{{ arquivo.caminho }}')">Inspecionar</button>
                        <button class="btn-delete" onclick="excluirArquivo('{{ arquivo.caminho }}')">Excluir</button>
                    </div>
                </li>
                {% else %}
                <li class="no-files">Nenhum arquivo enviado nesta categoria.</li>
                {% endfor %}
            </ul>
        </div>
    </div>

    <!-- Seção 2: Documento Padrão -->
    <div class="file-section">
        <h3>📄 Documento Padrão</h3>
        <p class="section-desc">Modelos oficiais, formulários, contratos, escopos e relatórios centrais.</p>
        
        <form action="/upload/documento_padrao" method="POST" enctype="multipart/form-data" class="upload-form">
            <input type="hidden" name="project_id" value="{{ project_id }}">
            <input type="file" name="file" required>
            <div class="button-group" style="width: 100%;">
                <button type="submit" class="btn-upload">Fazer Upload</button>
                <button type="button" class="btn-ai" onclick="analisarComIA('documento_padrao')">🤖 IA</button>
            </div>
        </form>

        <div class="file-list-container">
            <h4>Arquivos Enviados:</h4>
            <ul class="file-list">
                {% for arquivo in arquivos.documento_padrao %}
                <li class="file-item">
                    <span class="file-name">{{ arquivo.nome }}</span>
                    <div class="action-buttons">
                        <button class="btn-inspect" onclick="inspecionarArquivo('{{ arquivo.caminho }}')">Inspecionar</button>
                        <button class="btn-delete" onclick="excluirArquivo('{{ arquivo.caminho }}')">Excluir</button>
                    </div>
                </li>
                {% else %}
                <li class="no-files">Nenhum arquivo enviado nesta categoria.</li>
                {% endfor %}
            </ul>
        </div>
    </div>

    <!-- Seção 3: Documentos de Colaboradores -->
    <div class="file-section">
        <h3>👥 Documentos de Colaboradores</h3>
        <p class="section-desc">Fichas, registros, contratos individuais e documentação da equipe.</p>
        
        <form action="/upload/documentos_colaboradores" method="POST" enctype="multipart/form-data" class="upload-form">
            <input type="hidden" name="project_id" value="{{ project_id }}">
            <input type="file" name="file" required>
            <div class="button-group" style="width: 100%;">
                <button type="submit" class="btn-upload">Fazer Upload</button>
                <button type="button" class="btn-ai" onclick="analisarComIA('documentos_colaboradores')">🤖 IA</button>
            </div>
        </form>

        <div class="file-list-container">
            <h4>Arquivos Enviados:</h4>
            <ul class="file-list">
                {% for arquivo in arquivos.documentos_colaboradores %}
                <li class="file-item">
                    <span class="file-name">{{ arquivo.nome }}</span>
                    <div class="action-buttons">
                        <button class="btn-inspect" onclick="inspecionarArquivo('{{ arquivo.caminho }}')">Inspecionar</button>
                        <button class="btn-delete" onclick="excluirArquivo('{{ arquivo.caminho }}')">Excluir</button>
                    </div>
                </li>
                {% else %}
                <li class="no-files">Nenhum arquivo enviado nesta categoria.</li>
                {% endfor %}
            </ul>
        </div>
    </div>
</div>

<script>
function excluirArquivo(caminho) {
    if (confirm("Tem certeza absoluta que deseja excluir este arquivo?")) {
        fetch('/api/excluir-arquivo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caminho: caminho })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.mensagem);
            location.reload();
        })
        .catch(error => console.error("Erro ao excluir:", error));
    }
}

function inspecionarArquivo(caminho) {
    window.open('/api/inspecionar?caminho=' + encodeURIComponent(caminho), '_blank');
}

function analisarComIA(categoria) {
    alert("Iniciando varredura e Análise com IA para a categoria: " + categoria);
    fetch('/api/analisar-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria: categoria })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.mensagem);
    })
    .catch(error => console.error("Erro na análise:", error));
}
</script>

</body>
</html>
"""

@app.route('/')
def index():
    return redirect(url_for('pagina_projeto', project_id=1))

@app.route('/projeto/<project_id>')
def pagina_projeto(project_id):
    arquivos = listar_arquivos_projeto(project_id)
    return render_template_string(TEMPLATE_HTML, project_id=project_id, arquivos=arquivos)

@app.route('/upload/<categoria>', methods=['POST'])
def upload_file(categoria):
    if categoria not in CATEGORIAS_VALIDAS:
        return jsonify({"erro": "Categoria inválida"}), 400
    
    project_id = request.form.get('project_id', 'geral')
    file = request.files.get('file')
    
    if not file or file.filename == '':
        return "Nenhum arquivo selecionado", 400
    
    pasta_destino = CATEGORIAS_VALIDAS[categoria]
    target_dir = os.path.join(UPLOAD_BASE_DIR, str(project_id), pasta_destino)
    os.makedirs(target_dir, exist_ok=True)
    
    file_path = os.path.join(target_dir, file.filename)
    file.save(file_path)
    
    return redirect(url_for('pagina_projeto', project_id=project_id))

@app.route('/api/excluir-arquivo', methods=['POST'])
def excluir_arquivo():
    dados = request.get_json()
    caminho = dados.get('caminho')
    
    if caminho and os.path.exists(caminho):
        if os.path.abspath(caminho).startswith(os.path.abspath(UPLOAD_BASE_DIR)):
            os.remove(caminho)
            return jsonify({"status": "sucesso", "mensagem": "Arquivo excluído com sucesso!"}), 200
            
    return jsonify({"status": "erro", "mensagem": "Arquivo não encontrado."}), 400

@app.route('/api/inspecionar', methods=['GET'])
def inspecionar_arquivo():
    caminho = request.args.get('caminho')
    if caminho and os.path.exists(caminho):
        if os.path.abspath(caminho).startswith(os.path.abspath(UPLOAD_BASE_DIR)):
            return send_file(caminho, as_attachment=False)
            
    return "Arquivo não encontrado", 404

@app.route('/api/analisar-ia', methods=['POST'])
def analisar_ia():
    dados = request.get_json()
    categoria = dados.get('categoria')
    return jsonify({
        "status": "sucesso",
        "mensagem": f"Análise com IA concluída com sucesso para a categoria '{categoria}'!"
    }), 200

if __name__ == '__main__':
    app.run(debug=True)
