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
});