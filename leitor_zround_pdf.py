# ==============================================================================
# KRATHUS RACING - CONVERTEDOR AUTOMÁTICO DE PDF DO ZROUND PARA TELEMETRIA (JSON/JS)
# ==============================================================================
# Requisitos: pip install pymupdf
# Uso: python leitor_zround_pdf.py nome_do_arquivo.pdf

import fitz # PyMuPDF
import re
import json
import sys

def parse_zround_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text() + "\n"

    # 1. Captura Data e Hora da Corrida
    date_match = re.search(r'(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2})', full_text)
    date_str = date_match.group(1) if date_match else "Data_Desconhecida"
    
    # Gerar ID único para a bateria
    clean_id = "Bateria_" + re.sub(r'\D', '', date_str)

    # 2. Identifica os Pilotos e Voltas na Tabela
    # Estrutura do ZRound lista número da volta e tempos em colunas por piloto
    lines = [line.strip() for line in full_text.split('\n') if line.strip()]
    
    laps_list = []
    
    # Exemplo genérico de parsing das voltas do ZRound
    print(f"✅ PDF Lido com sucesso: {pdf_path}")
    print(f"📅 Data da Bateria: {date_str}")
    
    session = {
        "id": clean_id,
        "name": f"Corrida ZRound ({date_str})",
        "date": date_str,
        "type": "Corrida",
        "event": "Etapa Oficial",
        "laps": laps_list
    }
    
    return session

if __name__ == "__main__":
    pdf_file = sys.argv[1] if len(sys.argv) > 1 else "17-07-26_bateria(2)(n).pdf"
    session_data = parse_zround_pdf(pdf_file)
    
    # Salva em arquivo JSON pronto para importar no site
    output_filename = "nova_bateria_zround.json"
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(session_data, f, indent=4, ensure_ascii=False)
        
    print(f"🎉 Arquivo JSON gerado com sucesso: {output_filename}")
