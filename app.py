import os
from flask import Flask, render_template_string, request, jsonify, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.secret_key = 'roca_secret_key_segura'

# Configuração da URL do Banco de Dados (pega a variável de ambiente do Render ou usa uma padrão local)
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://roca_user:3RB3vu5kFL1ZRCDABet75l9FDLzVX3ae@dpg-d9v2egk9v7es73b468ig-a/roca_db')

# Correção necessária para URLs do Postgres no Render (trocar postgres:// por postgresql:// se necessário)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Definição das Tabelas no Banco de Dados
class Perfil(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    crea = db.Column(db.String(50), nullable=False)
    senha_sistema = db.Column(db.String(100), nullable=False)

class Projeto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    descricao = db.Column(db.Text, nullable=True)

class Arquivo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    projeto_id = db.Column(db.Integer, db.ForeignKey('projeto.id'), nullable=False)
    categoria = db.Column(db.String(50), nullable=False) # identidade, padrao, colaboradores
    nome_arquivo = db.Column(db.String(255), nullable=False)

# Inicializa as tabelas no banco de dados automaticamente ao iniciar
with app.app_context():
    db.create_all()
    # Cria um perfil padrão e projetos iniciais caso o banco esteja vazio
    if not Perfil.query.first():
        perfil_inicial = Perfil(nome="Luís Raphael Cavalcanti Silva Belowodski", crea="CREA-AL 18048-D", senha_sistema="manta2026")
        db.session.add(perfil_inicial)
        
        p1 = Projeto(nome="Manta Eco Retreat", descricao="Projeto residencial de alto padrão supervisionado com design Pininfarina.")
        p2 = Projeto(nome="Residencial Patacho", descricao="Complexo hoteleiro e estrutural no litoral.")
        db.session.add_all([p1, p2])
        db.session.commit()

# Template HTML unificado, responsivo e limpo
TEMPLATE_HTML = """
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Projeto ROCA - Gestão de Engenharia</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 10px; color: #333; }
        .container { background: #fff; padding: 20px; border-radius: 8px; max-width: 950px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        h1, h2, h3, h4 { color: #1e293b; margin-top: 0; }
        .nav-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        .nav-links a { text-decoration: none; background: #e2e8f0; color: #334155; padding: 6px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; cursor: pointer; }
        .nav-links a:hover { background: #cbd5e1; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 6px; margin-bottom: 15px; }
        
        .grid-sections { display: grid; grid-template-columns: 1fr; gap: 20px; margin-top: 15px; }
        .doc-section-card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 18px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .doc-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 12px; }
        .doc-title { font-size: 1.05rem; font-weight: bold; color: #0f172a; margin: 0; }
        
        .upload-row { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; background: #f8fafc; padding: 10px; border-radius: 4px; border: 1px dashed #cbd5e1; }
        .upload-row label { font-size: 0.85rem; color: #475569; font-weight: bold; }
        
        input[type="file"], input[type="text"], input[type="password"] { width: 100%; padding: 8px; font-size: 0.9rem; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff; }
        
        .btn-primary, .btn-upload, .btn-ai, .btn-inspect, .btn-delete, .btn-warning { padding: 8px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85rem; border: none; color: white; text-align: center; }
        .btn-primary { background-color: #0284c7; }
        .btn-upload { background-color: #2563eb; }
        .btn-ai { background-color: #16a34a; }
        .btn-inspect { background-color: #d97706; padding: 5px 10px; font-size: 0.8rem; text-decoration: none; display: inline-block; }
        .btn-delete { background-color: #dc2626; padding: 5px 10px; font-size: 0.8rem; }
        .btn-warning { background-color: #ca8a04; }
        
        .file-list { list-style: none; padding: 0; margin: 8px 0 0 0; }
        .file-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 6px; }
        .file-name { word-break: break-all; font-size: 0.85rem; font-weight: 500; color: #334155; }
        .file-actions { display: flex; gap: 5px; }
        
        .no-files { color: #94a3b8; font-style: italic; font-size: 0.85rem; padding: 6px 0; }
        .hidden { display: none !important; }

        @media (min-width: 768px) {
            body { padding: 20px; }
            .container { padding: 30px; }
            .grid-sections { grid-template-columns: repeat(2, 1fr); }
            .doc-section-card.full-width { grid-column: span 2; }
            .upload-row { flex-direction: row; align-items: center; justify-content: space-between; }
        }
    </style>
</head>
<body>

<div class="container">
    <div class="nav-bar">
        <h2>Projeto ROCA 🏗️</h2>
        <div class="nav-links">
            <a href="/">Dashboard</a>
            <a href="/perfil">Perfil & CREA</a>
            <a href="/logout">Sair</a>
        </div>
    </div>

    {% if pagina == 'login' %}
        <div class="card" style="max-width: 400px; margin: 40px auto; text-align: center;">
            <h3>Acesso Restrito</h3>
            <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 12px;">Digite sua senha para entrar no sistema.</p>
            {% if erro %}
                <p style="color: #dc2626; font-size: 0.85rem; margin-bottom: 10px;">{{ erro }}</p>
            {% endif %}
            <form method="POST" action="/login" style="display: flex; flex-direction: column; gap: 12px;">
                <input type="password" name="senha" placeholder="Senha de Acesso" required>
                <button type="submit" class="btn-primary">Entrar no Sistema</button>
            </form>
        </div>

    {% elif pagina == 'perfil' %}
        <div class="card">
            <h3>⚙️ Configuração do Engenheiro e Perfil</h3>
            <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 12px;">Gerencie seus dados profissionais salvos na nuvem.</p>
            <form method="POST" action="/perfil/salvar" style="display: flex; flex-direction: column; gap: 12px;">
                <label><strong>Nome Completo:</strong></label>
                <input type="text" name="nome" value="{{ perfil.nome }}" required>
                
                <label><strong>Registro Profissional (CREA):</strong></label>
                <input type="text" name="crea" value="{{ perfil.crea }}" required>
                
                <label><strong>Nova Senha de Acesso (opcional):</strong></label>
                <input type="password" name="senha" placeholder="Deixe em branco para manter a atual">
                
                <button type="submit" class="btn-primary" style="margin-top: 10px;">Salvar Alterações</button>
            </form>
        </div>

    {% elif pagina == 'dashboard' %}
        <div class="card">
            <h3>📊 Painel de Projetos</h3>
            <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 12px;">Engenheiro Responsável: <strong>{{ perfil.nome }}</strong> ({{ perfil.crea }})</p>
            
            <h4 style="margin-top: 20px; font-size: 1rem;">Projetos Cadastrados:</h4>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                {% for p in projetos %}
                <div style="background: #fff; padding: 12px; border: 1px solid #cbd5e1; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <strong>{{ p.nome }}</strong><br>
                        <small style="color: #64748b;">{{ p.descricao }}</small>
                    </div>
                    <a href="/projeto/{{ p.id }}" class="btn-primary" style="font-size: 0.8rem; padding: 6px 12px; text-decoration: none;">Acessar Projeto</a>
                </div>
                {% else %}
                <p class="no-files">Nenhum projeto cadastrado no momento.</p>
                {% endfor %}
            </div>

            <hr style="margin: 20px 0; border: 0; border-top: 1px solid #e2e8f0;">

            <h4 style="font-size: 1rem;">Cadastrar Novo Projeto:</h4>
            <form method="POST" action="/projeto/criar" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                <input type="text" name="nome" placeholder="Nome do Novo Projeto" required>
                <input type="text" name="descricao" placeholder="Breve Descrição" required>
                <button type="submit" class="btn-primary">Criar Projeto</button>
            </form>
        </div>

    {% elif pagina == 'projeto' %}
        <!-- Cabeçalho do Projeto -->
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 6px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div>
                <a href="/" style="color: #0284c7; font-size: 0.85rem; font-weight: bold; text-decoration: none;">&larr; Voltar ao Dashboard</a>
                <h3 style="margin: 6px 0 4px 0; color: #0f172a;">📁 Projeto: {{ projeto.nome }}</h3>
                <p style="margin: 0; color: #64748b; font-size: 0.9rem;">{{ projeto.descricao }}</p>
            </div>
            <div style="display: flex; gap: 8px;">
                <form action="/projeto/{{ projeto.id }}/editar" method="POST" style="display:inline;">
                    <button type="submit" class="btn-warning">✏️ Editar</button>
                </form>
                <form action="/projeto/{{ projeto.id }}/excluir" method="POST" onsubmit="return confirm('Tem certeza absoluta que deseja excluir este projeto?');" style="display:inline;">
                    <button type="submit" class="btn-delete">🗑️ Excluir</button>
                </form>
            </div>
        </div>

        <div class="grid-sections">
            <!-- Bloco 1: Identidade Visual & Logomarca -->
            <div class="doc-section-card full-width">
                <div class="doc-header">
                    <h4 class="doc-title">🎨 Identidade Visual e Logomarca</h4>
                </div>
                
                <form action="/upload/{{ projeto.id }}/identidade" method="POST" enctype="multipart/form-data" class="upload-row">
                    <label>Manual / Identidade Geral:</label>
                    <div style="display:flex; gap:8px; width:100%; max-width:400px;">
                        <input type="file" name="file" required>
                        <button type="submit" class="btn-upload" style="white-space:nowrap;">Enviar</button>
                    </div>
                </form>

                <form action="/upload/{{ projeto.id }}/logomarca" method="POST" enctype="multipart/form-data" class="upload-row">
                    <label>Logomarca Específica:</label>
                    <div style="display:flex; gap:8px; width:100%; max-width:400px;">
                        <input type="file" name="file" required>
                        <button type="submit" class="btn-upload" style="white-space:nowrap;">Enviar</button>
                    </div>
                </form>

                <div style="border-top: 1px solid #f1f5f9; padding-top: 8px;">
                    <span style="font-size: 0.8rem; font-weight: bold; color: #64748b;">Arquivos Armazenados:</span>
                    <ul class="file-list">
                        {% for arq in arquivos.identidade %}
                        <li class="file-item">
                            <span class="file-name">{{ arq.nome_arquivo }}</span>
                            <div class="file-actions">
                                <a href="/arquivo/excluir/{{ arq.id }}" class="btn-delete" onclick="return confirm('Excluir arquivo?');" style="text-decoration:none;">Excluir</a>
                            </div>
                        </li>
                        {% else %}
                        <li class="no-files">Nenhum arquivo enviado nesta categoria.</li>
                        {% endfor %}
                    </ul>
                </div>
            </div>

            <!-- Bloco 2: Documento Padrão -->
            <div class="doc-section-card">
                <div class="doc-header">
                    <h4 class="doc-title">📄 Documento Padrão</h4>
                </div>
                
                <form action="/upload/{{ projeto.id }}/padrao" method="POST" enctype="multipart/form-data" class="upload-row" style="flex-direction: column; align-items: stretch;">
                    <label style="margin-bottom: 4px;">Novo Modelo / Contrato:</label>
                    <input type="file" name="file" required style="margin-bottom: 6px;">
                    <button type="submit" class="btn-upload">Fazer Upload</button>
                </form>

                <div style="border-top: 1px solid #f1f5f9; padding-top: 8px;">
                    <span style="font-size: 0.8rem; font-weight: bold; color: #64748b;">Arquivos Armazenados:</span>
                    <ul class="file-list">
                        {% for arq in arquivos.padrao %}
                        <li class="file-item">
                            <span class="file-name">{{ arq.nome_arquivo }}</span>
                            <div class="file-actions">
                                <a href="/arquivo/excluir/{{ arq.id }}" class="btn-delete" onclick="return confirm('Excluir arquivo?');" style="text-decoration:none;">Excluir</a>
                            </div>
                        </li>
                        {% else %}
                        <li class="no-files">Nenhum arquivo enviado nesta categoria.</li>
                        {% endfor %}
                    </ul>
                </div>
            </div>

            <!-- Bloco 3: Colaboradores (Lote) -->
            <div class="doc-section-card">
                <div class="doc-header">
                    <h4 class="doc-title">👥 Colaboradores (Lote)</h4>
                </div>
                
                <form action="/upload/{{ projeto.id }}/colaboradores" method="POST" enctype="multipart/form-data" class="upload-row" style="flex-direction: column; align-items: stretch;">
                    <label style="margin-bottom: 4px;">Fichas / Documentos da Equipe (Múltiplos):</label>
                    <input type="file" name="files" multiple required style="margin-bottom: 6px;">
                    <button type="submit" class="btn-upload">Enviar Lote de Arquivos</button>
                </form>

                <div style="border-top: 1px solid #f1f5f9; padding-top: 8px;">
                    <span style="font-size: 0.8rem; font-weight: bold; color: #64748b;">Arquivos Armazenados:</span>
                    <ul class="file-list">
                        {% for arq in arquivos.colaboradores %}
                        <li class="file-item">
                            <span class="file-name">{{ arq.nome_arquivo }}</span>
                            <div class="file-actions">
                                <a href="/arquivo/excluir/{{ arq.id }}" class="btn-delete" onclick="return confirm('Excluir arquivo?');" style="text-decoration:none;">Excluir</a>
                            </div>
                        </li>
                        {% else %}
                        <li class="no-files">Nenhum arquivo enviado nesta categoria.</li>
                        {% endfor %}
                    </ul>
                </div>
            </div>
        </div>
    {% endif %}
</div>

</body>
</html>
"""

# Rotas do Servidor Flaskconectadas ao Banco PostgreSQL
@app.route('/login', methods=['GET', 'POST'])
def login():
    perfil = Perfil.query.first()
    if request.method == 'POST':
        senha_digitada = request.form.get('senha')
        if senha_digitada == perfil.senha_sistema:
            session['autenticado'] = True
            return redirect(url_for('index'))
        else:
            return render_template_string(TEMPLATE_HTML, pagina='login', erro="Senha incorreta. Tente novamente.")
    return render_template_string(TEMPLATE_HTML, pagina='login')

@app.route('/logout')
def logout():
    session.pop('autenticado', None)
    return redirect(url_for('login'))

@app.route('/')
def index():
    if not session.get('autenticado'):
        return redirect(url_for('login'))
    perfil = Perfil.query.first()
    projetos = Projeto.query.all()
    return render_template_string(TEMPLATE_HTML, pagina='dashboard', perfil=perfil, projetos=projetos)

@app.route('/perfil')
def perfil():
    if not session.get('autenticado'):
        return redirect(url_for('login'))
    perfil = Perfil.query.first()
    return render_template_string(TEMPLATE_HTML, pagina='perfil', perfil=perfil)

@app.route('/perfil/salvar', methods=['POST'])
def salvar_perfil():
    if not session.get('autenticado'):
        return redirect(url_for('login'))
    p = Perfil.query.first()
    p.nome = request.form.get('nome')
    p.crea = request.form.get('crea')
    nova_senha = request.form.get('senha').strip()
    if nova_senha:
        p.senha_sistema = nova_senha
    db.session.commit()
    return redirect(url_for('index'))

@app.route('/projeto/criar', methods=['POST'])
def criar_projeto():
    if not session.get('autenticado'):
        return redirect(url_for('login'))
    nome = request.form.get('nome')
    desc = request.form.get('descricao')
    if nome:
        novo = Projeto(nome=nome, descricao=desc)
        db.session.add(novo)
        db.session.commit()
    return redirect(url_for('index'))

@app.route('/projeto/<int:id>')
def pagina_projeto(id):
    if not session.get('autenticado'):
        return redirect(url_for('login'))
    projeto = Projeto.query.get_or_404(id)
    
    # Organiza os arquivos por categoria
    arquivos_db = Arquivo.query.filter_by(projeto_id=id).all()
    arquivos = {'identidade': [], 'padrao': [], 'colaboradores': []}
    for a in arquivos_db:
        if a.categoria in arquivos:
            arquivos[a.categoria].append(a)
            
    return render_template_string(TEMPLATE_HTML, pagina='projeto', projeto=projeto, arquivos=arquivos)

@app.route('/projeto/<int:id>/editar', methods=['POST'])
def editar_projeto(id):
    if not session.get('autenticado'):
        return redirect(url_for('login'))
    p = Projeto.query.get_or_404(id)
    # Redireciona para um formulário simples ou atualiza via query params / request
    return redirect(url_for('pagina_projeto', id=id))

@app.route('/projeto/<int:id>/excluir', methods=['POST'])
def excluir_projeto(id):
    if not session.get('autenticado'):
        return redirect(url_for('login'))
    Arquivo.query.filter_by(projeto_id=id).delete()
    p = Projeto.query.get_or_404(id)
    db.session.delete(p)
    db.session.commit()
    return redirect(url_for('index'))

@app.route('/upload/<int:projeto_id>/<categoria>', methods=['POST'])
def upload_file(projeto_id, categoria):
    if not session.get('autenticado'):
        return redirect(url_for('login'))
    
    if categoria == 'colaboradores':
        files = request.files.getlist('files')
        for f in files:
            if f and f.filename:
                novo_arq = Arquivo(projeto_id=projeto_id, categoria='colaboradores', nome_arquivo=f.filename)
                db.session.add(novo_arq)
    else:
        f = request.files.get('file')
        cat_real = 'identidade' if categoria in ['identidade', 'logomarca'] else 'padrao'
        if f and f.filename:
            nome_prefixo = "[Logomarca] " if categoria == 'logomarca' else ""
            novo_arq = Arquivo(projeto_id=projeto_id, categoria=cat_real, nome_arquivo=nome_prefixo + f.filename)
            db.session.add(novo_arq)
            
    db.session.commit()
    return redirect(url_for('pagina_projeto', id=projeto_id))

@app.route('/arquivo/excluir/<int:id>')
def excluir_arquivo(id):
    if not session.get('autenticado'):
        return redirect(url_for('login'))
    arq = Arquivo.query.get_or_404(id)
    pid = arq.projeto_id
    db.session.delete(arq)
    db.session.commit()
    return redirect(url_for('pagina_projeto', id=pid))

if __name__ == '__main__':
    app.run(debug=True)
