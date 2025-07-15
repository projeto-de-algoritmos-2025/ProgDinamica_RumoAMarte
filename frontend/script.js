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
})