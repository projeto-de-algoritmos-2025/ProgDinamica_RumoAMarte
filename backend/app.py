from flask import Flask, jsonify, request
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

def solve_knapsack_iterative(items, capacity):
    """
    Resolve o problema da Mochila (knapsack) 0/1 usando a abordagem de Programação Dinâmica bottom-up (iterativa).
    """
    start_time = time.perf_counter()
    num_items = len(items)
    dp_table = [[0 for _ in range(capacity + 1)] for _ in range(num_items + 1)]
    
    for i in range(1, num_items + 1):
        name, weight, value, emoji = items[i-1].values()
        
        for w in range(1, capacity + 1):
            if weight > w:
                dp_table[i][w] = dp_table[i-1][w]
            else:
                value_if_included = value + dp_table[i-1][w - weight]
                value_if_excluded = dp_table[i-1][w]
                dp_table[i][w] = max(value_if_included, value_if_excluded)

    max_value = dp_table[num_items][capacity]
    
    selected_items = []
    w = capacity
    for i in range(num_items, 0, -1):
        if dp_table[i][w] != dp_table[i-1][w]:
            item = items[i-1]
            selected_items.append(item)
            w -= item['weight']
    
    selected_items.reverse()
    end_time = time.perf_counter()

    return {
        "selected_items": selected_items,
        "total_value": max_value,
        "dp_table": dp_table,
        "execution_time": (end_time - start_time) * 1000  # in milliseconds
    }

def solve_knapsack_recursive(items, capacity):
    """
    Resolve o problema da Mochila (knapsack) 0/1 usando a abordagem de Programação Dinâmica top-down (recursiva) com memoização.
    Retorna um registro passo a passo das chamadas para visualização.
    """
    num_items = len(items)
    memo = {} # Using a dict for sparse memoization table
    call_log = [] # To store the visualization steps

    def _recursive_helper(w, n):
        call_log.append({'type': 'call', 'w': w, 'n': n})

        if (w, n) in memo:
            call_log.append({'type': 'hit', 'w': w, 'n': n, 'value': memo[(w, n)]})
            return memo[(w, n)]
        
        if n == 0 or w == 0:
            return 0
        
        item_weight = items[n-1]['weight']
        item_value = items[n-1]['value']
        
        if item_weight > w:
            result = _recursive_helper(w, n - 1)
        else:
            value_if_included = item_value + _recursive_helper(w - item_weight, n - 1)
            value_if_excluded = _recursive_helper(w, n - 1)
            result = max(value_if_included, value_if_excluded)
        
        memo[(w, n)] = result
        call_log.append({'type': 'calculate', 'w': w, 'n': n, 'value': result})
        return result

    start_time = time.perf_counter()
    max_value = _recursive_helper(capacity, num_items)
    end_time = time.perf_counter()

    # Reconstruct the final DP table from the memo for traceback
    dp_table = [[0 for _ in range(capacity + 1)] for _ in range(num_items + 1)]
    for (w, n), value in memo.items():
        if n <= num_items and w <= capacity:
            dp_table[n][w] = value

    # Fill in the rest of the table for a complete view
    for i in range(1, num_items + 1):
        for w in range(1, capacity + 1):
            if dp_table[i][w] == 0:
                dp_table[i][w] = dp_table[i-1][w]
            if dp_table[i][w] == 0 and i > 0: # If still 0, check row above
                 dp_table[i][w] = dp_table[i-1][w]
            if dp_table[i][w] == 0 and w > 0: # or col before
                 dp_table[i][w] = dp_table[i][w-1]


    selected_items = []
    w = capacity
    for i in range(num_items, 0, -1):
        if i > 0 and w > 0 and dp_table[i][w] != dp_table[i-1][w]:
            item = items[i-1]
            selected_items.append(item)
            w -= item['weight']
    selected_items.reverse()
    
    return {
        "selected_items": selected_items,
        "total_value": max_value,
        "dp_table": dp_table, # The final table for path highlighting
        "call_log": call_log,
        "execution_time": (end_time - start_time) * 1000  # in milliseconds
    }

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
        result = solve_knapsack_recursive(items, capacity)
    else: # Default to iterative
        result = solve_knapsack_iterative(items, capacity)
    
    response = {
        "items": items,
        "capacity": capacity,
        "result": result,
        "mode": mode,
        "instant": instant
    }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, port=5000) 