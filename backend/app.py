from flask import Flask, jsonify, request
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

@app.route('/api/knapsack', methods=['GET'])
def knapsack_endpoint():
    items = [
        {"name": "Filtro de Água", "weight": 5, "value": 60, "emoji": "💧"},
        {"name": "Scanner Geológico", "weight": 9, "value": 110, "emoji": "🔬"},
        {"name": "Painel Solar", "weight": 8, "value": 95, "emoji": "☀️"},
        {"name": "Sementes de Batata", "weight": 2, "value": 40, "emoji": "🥔"},
        {"name": "Roda de Rover", "weight": 7, "value": 80, "emoji": "⚙️"},
        {"name": "Antena de Comunicação", "weight": 11, "value": 130, "emoji": "📡"},
        {"name": "Kit de Primeiros Socorros", "weight": 4, "value": 50, "emoji": "⚕️"},
        {"name": "Traje Espacial", "weight": 10, "value": 120, "emoji": "👩‍🚀"},
        {"name": "Kit de Amostra de Solo", "weight": 6, "value": 75, "emoji": "🧪"},
        {"name": "Analisador de Plantas", "weight": 14, "value": 155, "emoji": "🌱"},
        {"name": "Broca de Rover", "weight": 3, "value": 45, "emoji": "🔩"},
        {"name": "Sorvete Espacial", "weight": 1, "value": 25, "emoji": "🍦"}
    ]
    capacity = request.args.get('capacity', default=20, type=int)
    mode = request.args.get('mode', default='iterative', type=str)
    instant = request.args.get('instant', default='false', type=str).lower() == 'true'

    if mode == 'recursive':
        # desenvolver recursivo
        
    else: # Default to iterative
        # desenvolver iterativo
    
    response = True
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, port=5000) 