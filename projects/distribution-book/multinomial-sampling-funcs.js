// Maximum number of outcomes
const MAX_OUTCOMES = 10;

// Initial probabilities
let probabilities = [0.2, 0.15, 0.25, 0.1, 0.3];

// Number of outcomes
let N = probabilities.length;

// CDF array
let cdf = [];

// Color palette for outcomes (up to 10 colors)
const outcomeColors = [
    'rgba(31, 119, 180, 0.8)',   // Blue
    'rgba(255, 127, 14, 0.8)',   // Orange
    'rgba(44, 160, 44, 0.8)',    // Green
    'rgba(214, 39, 40, 0.8)',    // Red
    'rgba(148, 103, 189, 0.8)',  // Purple
    'rgba(140, 86, 75, 0.8)',     // Brown
    'rgba(227, 119, 194, 0.8)',   // Pink
    'rgba(127, 127, 127, 0.8)',   // Gray
    'rgba(188, 189, 34, 0.8)',    // Olive
    'rgba(23, 190, 207, 0.8)'     // Cyan
];

// Variables to store steps
let steps = [];

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

    // Reconstruct CDF and redraw charts
    constructCDF();
    drawProbChart();
    drawCDFChart();
    updateDerivationList();
    resetSampling();
}

// Function to construct CDF and record steps
function constructCDF() {
    cdf = [];
    let cumulative = 0;
    steps = [];

    // Record initial probabilities
    steps.push({
        stepNumber: 0,
        title: "Initial Probabilities",
        description: "Original Probabilities:",
        data: probabilities.map((p, i) => `Outcome ${i + 1}: ${p.toFixed(4)}`)
    });

    // Compute CDF
    probabilities.forEach((p, i) => {
        cumulative += p;
        cdf.push(cumulative);
        steps.push({
            stepNumber: i + 1,
            title: `Step ${i + 1}`,
            description: `Compute CDF for Outcome ${i + 1}:`,
            data: [
                `CDF[${i}] = CDF[${i - 1 >= 0 ? i - 1 : 0}] + P${i + 1} = ${(cdf[i - 1] || 0).toFixed(4)} + ${p.toFixed(4)} = ${cumulative.toFixed(4)}`
            ]
        });
    });
}

// Function to draw the probability bar chart
function drawProbChart() {
    const xLabels = probabilities.map((_, i) => `Outcome ${i + 1}`);

    const trace = {
        x: xLabels,
        y: probabilities,
        type: 'bar',
        name: 'Probability',
        marker: { color: outcomeColors.slice(0, N) },
        hoverinfo: 'x+y+name',
    };

    const layout = {
        title: 'Probabilities of Outcomes',
        xaxis: { title: 'Outcomes' },
        yaxis: { title: 'Probability', range: [0, 1] },
        margin: { t: 50, b: 100 },
    };

    Plotly.newPlot('probChart', [trace], layout);
}

// Function to draw the CDF line chart
function drawCDFChart() {
    const xLabels = probabilities.map((_, i) => `Outcome ${i + 1}`);
    const yValues = cdf;

    const trace = {
        x: xLabels,
        y: yValues,
        mode: 'lines+markers',
        type: 'scatter',
        name: 'CDF',
        line: { color: 'rgba(255, 165, 0, 1)' },
        marker: { color: 'rgba(255, 165, 0, 1)', size: 8 },
        hoverinfo: 'x+y+name',
    };

    const layout = {
        title: 'Cumulative Distribution Function (CDF)',
        xaxis: { title: 'Outcomes' },
        yaxis: { title: 'Cumulative Probability', range: [0, 1] },
        showlegend: true,
        margin: { t: 50, b: 100 },
    };

    Plotly.newPlot('cdfChart', [trace], layout);
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

// Function to compute the CDF and initialize charts
function initializeCharts() {
    constructCDF();
    drawProbChart();
    drawCDFChart();
    createLegend();
}

// Function to sample using inverse transform sampling
function sampleInverseTransform() {
    const uniformValue = Math.random();
    let outcome = -1;

    for (let i = 0; i < cdf.length; i++) {
        if (uniformValue <= cdf[i]) {
            outcome = i;
            break;
        }
    }

    // Determine if condition is met (for detailed logging)
    let conditionMet = 'No';
    if (outcome === 0) {
        conditionMet = uniformValue <= cdf[outcome];
    } else {
        conditionMet = uniformValue > cdf[outcome - 1] && uniformValue <= cdf[outcome];
    }

    return {
        sampleNumber: sampleCountTotal + 1,
        uniformValue: uniformValue.toFixed(4),
        outcome: outcome,
        conditionMet: conditionMet ? 'Yes' : 'No'
    };
}

// Function to perform multiple samples and update histogram and table
function performSampling(count) {
    const maxDetailedSamples = 100; // Limit detailed logs to 100 samples to prevent performance issues

    for (let i = 0; i < count; i++) {
        const sample = sampleInverseTransform();
        sampleCountTotal++;
        const sampleNumber = sample.sampleNumber;

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
                uniformValue: sample.uniformValue,
                outcome: outcomeName,
                conditionMet: sample.conditionMet
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
        }
    };

    const layout = {
        title: `Sampling Histogram`,
        xaxis: { title: 'Outcomes' },
        yaxis: { title: 'Count' },
        margin: { t: 50 },
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

        const cellUniform = document.createElement('td');
        cellUniform.innerText = sample.uniformValue;
        row.appendChild(cellUniform);

        const cellOutcome = document.createElement('td');
        cellOutcome.innerText = sample.outcome;
        row.appendChild(cellOutcome);

        const cellCondition = document.createElement('td');
        cellCondition.innerText = sample.conditionMet;
        row.appendChild(cellCondition);

        tbody.appendChild(row);
    });

    // If there are more than 100 samples, indicate that not all are displayed
    if (sampleDetails.length > 100) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
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

// Function to add a new outcome
function addOutcome() {
    if (N >= MAX_OUTCOMES) {
        alert(`Maximum of ${MAX_OUTCOMES} outcomes reached.`);
        return;
    }

    probabilities.push(0.1); // Assign a default probability
    N++;
    createSliders();
    constructCDF();
    drawProbChart();
    drawCDFChart();
    createLegend();
    updateDerivationList();
    resetSampling();
}

// Function to remove the last outcome
function removeOutcome() {
    if (N <= 1) {
        alert('At least one outcome is required.');
        return;
    }

    probabilities.pop();
    N--;
    createSliders();
    constructCDF();
    drawProbChart();
    drawCDFChart();
    createLegend();
    updateDerivationList();
    resetSampling();
}

// Function to initialize everything
function initializeVisualization() {
    initializeCharts();
    createLegend();
    updateDerivationList();
}

// Event listeners for add/remove outcome buttons
document.getElementById('addOutcomeButton').addEventListener('click', addOutcome);
document.getElementById('removeOutcomeButton').addEventListener('click', removeOutcome);

// Event listener for sampling
document.getElementById('sampleButton').addEventListener('click', () => {
    const count = parseInt(document.getElementById('sampleCount').value);
    if (isNaN(count) || count < 1) {
        alert('Please enter a valid number of samples.');
        return;
    }
    performSampling(count);
});

// Event listener for reset sampling
document.getElementById('resetSampleButton').addEventListener('click', () => {
    resetSampling();
});

// Initialize sliders, charts, and derivation
createSliders();
initializeVisualization();