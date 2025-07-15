document.addEventListener('DOMContentLoaded', () => {
    const availableItemsContainer = document.getElementById('available-items');
    const finalCargoContainer = document.getElementById('final-cargo');
    const rocketCapacitySpan = document.getElementById('rocket-capacity');
    const selectedValueSpan = document.getElementById('selected-value');
    const selectedWeightSpan = document.getElementById('selected-weight');
    const planMissionBtn = document.getElementById('plan-mission-btn');
    const dpTable = document.getElementById('dp-table');
    const visualizationContainer = document.getElementById('visualization-container');
    const explanationText = document.getElementById('explanation-text');
    const rocket = document.getElementById('rocket');
    const capacitySlider = document.getElementById('capacity-slider');
    const instantExecutionCheckbox = document.getElementById('instant-execution');

    const API_URL = 'http://127.0.0.1:5000/api/knapsack';
    let allItems = [];
    let isInstant = false;

    const sleep = (ms) => {
        if (isInstant) {
            return Promise.resolve();
        }
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    const createItemCard = (item) => {
        const card = document.createElement('div');
        card.classList.add('item-card');
        card.id = `item-${item.name.replace(/\s+/g, '-')}`;
        card.innerHTML = `
            <span class="emoji">${item.emoji}</span>
            <p class="name">${item.name}</p>
            <p class="weight">Peso: ${item.weight}kg</p>
            <p class="value">Valor: R$${item.value}</p>
        `;
        return card;
    };

    capacitySlider.addEventListener('input', (e) => {
        rocketCapacitySpan.textContent = e.target.value;
    });

    planMissionBtn.addEventListener('click', handleMissionButtonClick);

    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            allItems = data.items;
            availableItemsContainer.innerHTML = '';
            allItems.forEach(item => {
                const card = createItemCard(item);
                availableItemsContainer.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Error fetching initial data:', error);
            explanationText.textContent = 'Erro: Não foi possível conectar ao servidor de controle da missão. O backend Python está em execução?';
        });

    async function handleMissionButtonClick() {
        if (planMissionBtn.textContent === 'Reiniciar Missão') {
            resetUI();
        }

        planMissionBtn.disabled = true;
        planMissionBtn.textContent = 'Calculando...';
        visualizationContainer.style.display = 'block';

        try {
            const capacity = capacitySlider.value;
            const mode = document.querySelector('input[name="algorithm-mode"]:checked').value;
            isInstant = instantExecutionCheckbox.checked;
            const response = await fetch(`${API_URL}?capacity=${capacity}&mode=${mode}&instant=${isInstant}`);
            const data = await response.json();
            await visualize(data);
        } catch (error) {
            console.error('Error during mission planning:', error);
            explanationText.textContent = 'Ocorreu um erro durante o planejamento da missão.';
            planMissionBtn.disabled = false;
            planMissionBtn.textContent = 'Planejar Carga Ideal!';
        }
    }



    async function visualize(data) {
        const { items, capacity, result, mode } = data;

        if (mode === 'recursive') {
            await visualizeRecursion(items, capacity, result);
        } else {
            await visualizeIteration(items, capacity, result);
        }
    }

    async function visualizeIteration(items, capacity, result) {
        const { dp_table, selected_items } = result;
        generateTable(items, capacity);
        explanationText.innerHTML = `Tabela inicializada usando o método <strong>Iterativo</strong>. O algoritmo agora preencherá a tabela linha por linha, de cima para baixo.`;
        await sleep(2000);

        await fillTable(items, dp_table);

        await highlightPath(items, capacity, dp_table);

        showFinalSelectionAndEnd(result);
    }

    async function visualizeRecursion(items, capacity, result) {
        const { call_log, dp_table, selected_items } = result;
        let lastCallCell = null;

        generateTable(items, capacity);
        explanationText.innerHTML = `Tabela inicializada para o método <strong>Recursivo</strong>. O algoritmo agora resolverá o problema principal quebrando-o em subproblemas menores. Veja como ele "explora" a tabela.`;
        await sleep(3000);

        for (const step of call_log) {
            const { type, w, n, value } = step;
            const cell = document.getElementById(`cell-${n}-${w}`);

            if (!cell) continue;

            if (type === 'call') {
                if (lastCallCell) lastCallCell.classList.remove('recursive-call');
                cell.classList.add('recursive-call');
                explanationText.innerHTML = `Chamando função para o item <strong>#${n}</strong> com capacidade <strong>${w}kg</strong>. Verificando o memo...`;
                lastCallCell = cell;
            } else if (type === 'hit') {
                cell.classList.remove('recursive-call');
                cell.classList.add('memo-hit');
                explanationText.innerHTML = `<strong>HIT na Memoização!</strong> Encontrado valor pré-calculado para [${n}, ${w}]: <span class="value">${value}</span>. Nenhum novo cálculo necessário.`;
            } else if (type === 'calculate') {
                cell.classList.remove('recursive-call', 'memo-hit');
                cell.classList.add('current-cell');
                cell.textContent = value;
                explanationText.innerHTML = `Valor calculado para [${n}, ${w}] é <span class="value">${value}</span>. Armazenando no memo e retornando.`;
            }
            await sleep(200);
            cell.classList.remove('current-cell', 'memo-hit');
        }

        await highlightPath(items, capacity, dp_table);

        showFinalSelectionAndEnd(result);
    }

    function showFinalSelectionAndEnd(result) {
        showFinalSelection(result.selected_items);
        const finalValue = result.total_value;
        const executionTime = result.execution_time.toFixed(3);

        explanationText.innerHTML = `<strong>Missão Completa!</strong> A combinação ótima foi encontrada em <span class="value">${executionTime} ms</span> para um valor total de <span class="value">${finalValue}</span>. Decolagem! 🚀`;
        rocket.classList.add('launch');

        planMissionBtn.disabled = false;
        planMissionBtn.textContent = 'Reiniciar Missão';
        capacitySlider.disabled = false;
    }

    function resetUI() {
        dpTable.innerHTML = '';

        finalCargoContainer.innerHTML = '';

        selectedValueSpan.textContent = '0';
        selectedWeightSpan.textContent = '0';

        document.querySelectorAll('.item-card.selected').forEach(card => {
            card.classList.remove('selected');
        });

        rocket.classList.remove('launch');

        explanationText.innerHTML = 'Ajuste o controle de capacidade e clique em "Planejar Carga Ideal!" para começar.';
        document.querySelector('.explanation-box').style.backgroundColor = 'rgba(0,0,0,0.4)';
    }

    function generateTable(items, capacity) {
        dpTable.innerHTML = '';

        const thead = document.createElement('thead');
        let headerRow = '<tr><th class="item-header">Item</th>';
        for (let w = 0; w <= capacity; w++) {
            headerRow += `<th>${w}kg</th>`;
        }
        headerRow += '</tr>';
        thead.innerHTML = headerRow;
        dpTable.appendChild(thead);

        const tbody = document.createElement('tbody');
        for (let i = 1; i < items.length + 1; i++) {
            let row = `<tr>`;
            const item = items[i - 1];
            row += `<td class="item-header">${item.emoji} ${item.name}</td>`;
            for (let w = 0; w <= capacity; w++) {
                row += `<td id="cell-${i}-${w}">0</td>`;
            }
            row += '</tr>';
            tbody.innerHTML += row;
        }
        dpTable.appendChild(tbody);
    }

    async function fillTable(items, dp_table) {
        let lastCell = null;
        let lastCalculatingCard = null;

        for (let i = 1; i < dp_table.length; i++) {
            const item = items[i - 1];
            const currentCard = document.getElementById(`item-${item.name.replace(/\s+/g, '-')}`);

            if (lastCalculatingCard) lastCalculatingCard.classList.remove('calculating');
            if (currentCard) currentCard.classList.add('calculating');
            lastCalculatingCard = currentCard;

            for (let w = 1; w < dp_table[i].length; w++) {
                const cell = document.getElementById(`cell-${i}-${w}`);
                const value = dp_table[i][w];

                if (lastCell) lastCell.classList.remove('current-cell');
                cell.classList.add('current-cell');
                cell.textContent = value;

                if (item.weight > w) {
                    explanationText.innerHTML = `Considerando <strong>${item.name}</strong> (peso: ${item.weight}kg) na capacidade <strong>${w}kg</strong>. <br>O item é muito pesado para caber. Devemos excluí-lo. O valor é pego da célula diretamente acima: <span class="value">${dp_table[i - 1][w]}</span>.`;
                } else {
                    const value_if_excluded = dp_table[i - 1][w];
                    const value_if_included = item.value + dp_table[i - 1][w - item.weight];
                    explanationText.innerHTML = `Considerando <strong>${item.name}</strong> (peso: ${item.weight}kg) na capacidade <strong>${w}kg</strong>. Temos duas escolhas:
                    <br>1. <strong>Excluí-lo:</strong> O valor seria o da célula acima (<span class="value">${value_if_excluded}</span>).
                    <br>2. <strong>Incluí-lo:</strong> O valor é ${item.value} + valor da célula em [linha acima, coluna ${w}-${item.weight}=${w - item.weight}] (<span class="value">${dp_table[i - 1][w - item.weight]}</span>) = <span class="value">${value_if_included}</span>.
                    <br>Nós escolhemos o máximo: <span class="value">${value}</span>.`;
                }

                const delay = dp_table[0].length > 50 ? 25 : 100;
                await sleep(delay);

                lastCell = cell;
            }
        }
        if (lastCell) lastCell.classList.remove('current-cell');
        if (lastCalculatingCard) lastCalculatingCard.classList.remove('calculating');
    }

    async function highlightPath(items, capacity, dp_table) {
        explanationText.innerHTML = "Tabela completa! Agora, rastreando de volta da célula inferior direita para encontrar os itens que compõem a solução ótima...";
        document.querySelector('.explanation-box').style.backgroundColor = 'rgba(0, 47, 42, 0.8)';
        await sleep(2500);

        let w = capacity;
        for (let i = items.length; i > 0; i--) {
            const cell = document.getElementById(`cell-${i}-${w}`);
            cell.classList.add('path-cell');

            const item = items[i - 1];
            if (dp_table[i][w] !== dp_table[i - 1][w]) {
                explanationText.innerHTML = `O valor na célula [${i},${w}] (<span class="value">${dp_table[i][w]}</span>) é diferente do que está acima (<span class="value">${dp_table[i - 1][w]}</span>).
                <br>Isso significa que <strong>${item.name}</strong> foi <strong>incluído</strong> no conjunto ótimo. Adicionando à nossa carga!`;

                const itemCard = document.getElementById(`item-${item.name.replace(/\s+/g, '-')}`);
                if (itemCard) itemCard.classList.add('selected');

                w -= item.weight;
            } else {
                explanationText.innerHTML = `O valor na célula [${i},${w}] (<span class="value">${dp_table[i][w]}</span>) é o mesmo que o de cima.
                <br>Isso significa que <strong>${item.name}</strong> foi <strong>não incluído</strong>. Subindo para o item anterior.`;
            }
            await sleep(1000);
        }
    }


});