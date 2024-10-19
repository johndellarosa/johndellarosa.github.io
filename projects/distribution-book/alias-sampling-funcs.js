// Initial probabilities
let probabilities = [0.2, 0.15, 0.25, 0.1, 0.3];

// Number of outcomes
let N = probabilities.length;

// Alias tables
let alias = [];
let prob = [];

// Color palette for outcomes
const outcomeColors = [
    'rgba(31, 119, 180, 0.8)',  // Outcome 1 - Blue
    'rgba(255, 127, 14, 0.8)',  // Outcome 2 - Orange
    'rgba(44, 160, 44, 0.8)',   // Outcome 3 - Green
    'rgba(214, 39, 40, 0.8)',    // Outcome 4 - Red
    'rgba(148, 103, 189, 0.8)',  // Outcome 5 - Purple
    // Add more colors if needed
];

// Variables to store steps
let steps = [];
let currentSmall = [];
let currentLarge = [];

// Initialize sample data
let sampleData = {};
let sampleDetails = [];
let sampleCountTotal = 0;

// Function to create sliders for probability adjustment
function createSliders() {
    const slidersDiv = document.getElementById('sliders');
    slidersDiv.innerHTML = '';

    probabilities.forEach((p, i) => {
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';

        const label = document.createElement('label');
        label.innerText = `P${i + 1}:`;
        sliderContainer.appendChild(label);

        const input = document.createElement('input');
        input.type = 'range';
        input.min = '0';
        input.max = '1';
        input.step = '0.01';
        input.value = p;
        input.dataset.index = i;
        input.addEventListener('input', updateProbabilities);
        sliderContainer.appendChild(input);

        const valueLabel = document.createElement('span');
        valueLabel.id = `value${i}`;
        valueLabel.innerText = p.toFixed(2);
        sliderContainer.appendChild(valueLabel);

        slidersDiv.appendChild(sliderContainer);
    });
}

// Function to update probabilities and redraw charts
function updateProbabilities(event) {
    const index = event.target.dataset.index;
    let value = parseFloat(event.target.value);
    probabilities[index] = value;

    // Prevent all probabilities from being zero
    const total = probabilities.reduce((a, b) => a + b, 0);
    if (total === 0) {
        probabilities[index] = 0.01;
    }

    // Normalize probabilities to sum to 1
    const newTotal = probabilities.reduce((a, b) => a + b, 0);
    probabilities = probabilities.map(p => p / newTotal);

    // Update slider labels
    probabilities.forEach((p, i) => {
        document.getElementById(`value${i}`).innerText = p.toFixed(2);
        document.querySelector(`input[data-index="${i}"]`).value = p;
    });

    // Reconstruct alias tables and redraw charts
    constructAliasTables();
    drawChart();
    // updateAliasLists();
    updateDerivationList();
    resetSampling();
}

// Function to construct alias tables and record steps
function constructAliasTables() {
    N = probabilities.length;
    alias = new Array(N).fill(0);
    prob = new Array(N).fill(0);

    // Scale probabilities by N
    const scaledProb = probabilities.map(p => p * N);

    // Initialize small and large lists
    const small = [];
    const large = [];

    scaledProb.forEach((sp, i) => {
        if (sp < 1.0) {
            small.push(i);
        } else {
            large.push(i);
        }
    });

    // Record initial probabilities and scaled probabilities
    steps = [];
    steps.push({
        stepNumber: 0,
        title: "Initial Probabilities",
        description: "Original Probabilities:",
        data: probabilities.map((p, i) => `Outcome ${i + 1}: ${p.toFixed(4)}`)
    });
    steps.push({
        stepNumber: 0.5,
        title: "Scaled Probabilities",
        description: `Scaled Probabilities (P[i] * N where N=${N}):`,
        data: scaledProb.map((sp, i) => `Outcome ${i + 1}: ${sp.toFixed(4)}`)
    });

    while (small.length && large.length) {
        const less = small.pop();
        const more = large.pop();

        prob[less] = scaledProb[less];
        alias[less] = more;

        // Record the step
        steps.push({
            stepNumber: steps.length,
            title: `Step ${steps.length}`,
            description: `Set probability of Outcome ${less + 1} to ${scaledProb[less].toFixed(4)} and alias it to Outcome ${more + 1}.`,
            data: [
                `prob[${less}] = ${scaledProb[less].toFixed(4)}`,
                `alias[${less}] = ${more}`
            ]
        });

        scaledProb[more] = scaledProb[more] + scaledProb[less] - 1;

        if (scaledProb[more] < 1.0) {
            small.push(more);
        } else {
            large.push(more);
        }
    }

    // Remaining probabilities
    while (large.length) {
        const more = large.pop();
        prob[more] = 1.0;
        steps.push({
            stepNumber: steps.length,
            title: `Step ${steps.length}`,
            description: `Set probability of Outcome ${more + 1} to 1.0 as it remains in the large list.`,
            data: [
                `prob[${more}] = 1.0`
            ]
        });
    }
    while (small.length) {
        const less = small.pop();
        prob[less] = 1.0;
        steps.push({
            stepNumber: steps.length,
            title: `Step ${steps.length}`,
            description: `Set probability of Outcome ${less + 1} to 1.0 as it remains in the small list.`,
            data: [
                `prob[${less}] = 1.0`
            ]
        });
    }

    // Update the small and large lists in the DOM
    currentSmall = small.slice();
    currentLarge = large.slice();
}

// Function to update small and large lists display
function updateAliasLists() {
    const smallList = document.getElementById('smallItems');
    const largeList = document.getElementById('largeItems');
    smallList.innerHTML = '';
    largeList.innerHTML = '';

    currentSmall.forEach(i => {
        const li = document.createElement('li');
        li.innerText = `Outcome ${i + 1}`;
        smallList.appendChild(li);
    });

    currentLarge.forEach(i => {
        const li = document.createElement('li');
        li.innerText = `Outcome ${i + 1}`;
        largeList.appendChild(li);
    });
}

// Function to draw the stacked bar chart
function drawChart() {
    const xLabels = probabilities.map((_, i) => `Slot ${i + 1}`);

    // Initialize data arrays
    const traceBase = [];
    const traceAlias = [];

    // Prepare traces for each outcome
    for (let i = 0; i < N; i++) {
        // Base probability for the outcome itself
        traceBase.push({
            x: [xLabels[i]],
            y: [prob[i]],
            name: `Outcome ${i + 1}`,
            type: 'bar',
            marker: { color: outcomeColors[i % outcomeColors.length] },
            hoverinfo: 'x+y+name',
        });

        // Alias probability
        const aliasOutcome = alias[i];
        if (aliasOutcome !== i) { // Avoid stacking the same outcome twice
            traceAlias.push({
                x: [xLabels[i]],
                y: [1 - prob[i]],
                name: `Outcome ${aliasOutcome + 1}`,
                type: 'bar',
                marker: { color: outcomeColors[aliasOutcome % outcomeColors.length] },
                hoverinfo: 'x+y+name',
            });
        }
    }

    // Combine all traces
    const data = [...traceBase, ...traceAlias];

    const layout = {
        title: 'Alias Sampling Method - Stacked Bar Plot',
        barmode: 'stack',
        xaxis: { title: 'Alias Table Slots' },
        yaxis: { title: 'Probability', range: [0, 1] },
        legend: { orientation: 'h', y: -0.2 },
        margin: { t: 50, b: 150 },
        showlegend:false,
    };

    Plotly.newPlot('chart', data, layout);
    createLegend();
}

// Function to create a custom legend
function createLegend() {
    const legendDiv = document.getElementById('legend');
    legendDiv.innerHTML = '<h4>Legend:</h4>';

    probabilities.forEach((_, i) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';

        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = outcomeColors[i % outcomeColors.length];
        legendItem.appendChild(colorBox);

        const label = document.createElement('span');
        label.innerText = `Outcome ${i + 1}`;
        legendItem.appendChild(label);

        legendDiv.appendChild(legendItem);
    });
}

function sampleAlias() {
    const column = Math.floor(Math.random() * N);
    const coinToss = Math.random();

    if (coinToss < prob[column]) {
        return {
            slotPicked: column,
            rollValue: coinToss.toFixed(4),
            aliasUsed: false,
            outcome: column
        };
    } else {
        return {
            slotPicked: column,
            rollValue: coinToss.toFixed(4),
            aliasUsed: true,
            outcome: alias[column]
        };
    }
}

function performSampling(count) {
    const maxDetailedSamples = 100; // Limit detailed logs to 100 samples to prevent performance issues

    for (let i = 0; i < count; i++) {
        const sample = sampleAlias();
        sampleCountTotal++;
        const sampleNumber = sampleCountTotal;

        // Update sample counts
        const outcomeName = `Outcome ${sample.outcome + 1}`;
        if (sampleData[outcomeName]) {
            sampleData[outcomeName]++;
        } else {
            sampleData[outcomeName] = 1;
        }

        // Store sample details if within limit
        if (sampleNumber <= maxDetailedSamples) {
            sampleDetails.push({
                sampleNumber: sampleNumber,
                slotPicked: `Slot ${sample.slotPicked + 1}`,
                rollValue: sample.rollValue,
                aliasUsed: sample.aliasUsed ? 'Yes' : 'No',
                outcome: outcomeName
            });
        }
    }

    updateSamplingResult();
    updateHistogram();
    updateSampleDetailsTable();
}

// Function to update sampling result display
function updateSamplingResult() {
    const resultDiv = document.getElementById('samplingResult');
    let resultText = 'Sampling Counts:<br>';
    for (const [key, value] of Object.entries(sampleData)) {
        resultText += `${key}: ${value}<br>`;
    }
    document.getElementById('samplingResult').innerHTML = resultText;
}

// Function to update the histogram
function updateHistogram() {
    const outcomes = probabilities.map((_, i) => `Outcome ${i + 1}`);
    const counts = outcomes.map(outcome => sampleData[outcome] || 0);

    const trace = {
        x: outcomes,
        y: counts,
        type: 'bar',
        marker: {
            color: outcomeColors.slice(0, N)
        },
        showLegend:false,
    };

    const layout = {
        title: `Sampling Histogram`,
        xaxis: { title: 'Outcomes' },
        yaxis: { title: 'Count' },
        margin: { t: 50 },
        showLegend:false,
    };

    Plotly.newPlot('samplingHistogram', [trace], layout);
}

// Function to reset sampling data
function resetSampling() {
    sampleData = {};
    sampleDetails = [];
    sampleCountTotal = 0;
    document.getElementById('samplingResult').innerHTML = '';
    Plotly.purge('samplingHistogram');
    clearSampleDetailsTable();
}

// Function to clear the sample details table
function clearSampleDetailsTable() {
    const tbody = document.getElementById('sampleDetailsBody');
    tbody.innerHTML = '';
}

// Function to update the sample details table
function updateSampleDetailsTable() {
    const tbody = document.getElementById('sampleDetailsBody');
    tbody.innerHTML = ''; // Clear existing rows

    // Display up to the first 100 samples
    const displaySamples = sampleDetails.slice(0, 100);
    displaySamples.forEach(sample => {
        const row = document.createElement('tr');

        const cellSample = document.createElement('td');
        cellSample.innerText = sample.sampleNumber;
        row.appendChild(cellSample);

        const cellSlot = document.createElement('td');
        cellSlot.innerText = sample.slotPicked;
        row.appendChild(cellSlot);

        const cellRoll = document.createElement('td');
        cellRoll.innerText = sample.rollValue;
        row.appendChild(cellRoll);

        const cellAlias = document.createElement('td');
        cellAlias.innerText = sample.aliasUsed;
        row.appendChild(cellAlias);

        const cellOutcome = document.createElement('td');
        cellOutcome.innerText = sample.outcome;
        row.appendChild(cellOutcome);

        tbody.appendChild(row);
    });

    // If there are more than 100 samples, indicate that not all are displayed
    if (sampleDetails.length > 100) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.innerText = `...and ${sampleDetails.length - 100} more samples not displayed.`;
        cell.style.fontStyle = 'italic';
        row.appendChild(cell);
        tbody.appendChild(row);
    }
}


// Function to update the derivation list
function updateDerivationList() {
    const stepsList = document.getElementById('stepsList');
    stepsList.innerHTML = '';

    steps.forEach(step => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${step.title}:</strong> ${step.description}`;

        if (step.data && step.data.length > 0) {
            const innerUl = document.createElement('ul');
            step.data.forEach(detail => {
                const detailLi = document.createElement('li');
                detailLi.innerText = detail;
                innerUl.appendChild(detailLi);
            });
            li.appendChild(innerUl);
        }

        stepsList.appendChild(li);
    });
}

// Initialize the visualization
createSliders();
constructAliasTables();
drawChart();
// updateAliasLists();
updateDerivationList();

// Event listener for sampling
document.getElementById('sampleButton').addEventListener('click', () => {
    const count = parseInt(document.getElementById('sampleCount').value);
    if (isNaN(count) || count < 1) {
        alert('Please enter a valid number of samples.');
        return;
    }
    performSampling(count);
});
document.getElementById('resetSampleButton').addEventListener('click', () => {
    resetSampling();
});