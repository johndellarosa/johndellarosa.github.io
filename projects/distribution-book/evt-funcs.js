let myChart; // Declare the chart variable globally

// // Function to generate a random sample from a distribution
// function generateSample(size, distribution) {
//     let sample = [];
//     // Handling parameters based on the distribution
//     const mean = parseFloat(document.getElementById('mean') ? document.getElementById('mean').value : 0);
//     const stdDev = parseFloat(document.getElementById('stdDev') ? document.getElementById('stdDev').value : 1);
//     const lambda = parseFloat(document.getElementById('lambda') ? document.getElementById('lambda').value : 1);
//     const min = parseFloat(document.getElementById('min') ? document.getElementById('min').value : 0);
//     const max = parseFloat(document.getElementById('max') ? document.getElementById('max').value : 1);
//     // const shape = parseFloat(document.getElementById('shape') ? document.getElementById('shape').value : 1);
//     // const scale = parseFloat(document.getElementById('scale') ? document.getElementById('scale').value : 1);
//     // const alpha = parseFloat(document.getElementById('alpha') ? document.getElementById('alpha').value : 1);
//     // const beta = parseFloat(document.getElementById('beta') ? document.getElementById('beta').value : 1);

//     for (let i = 0; i < size; i++) {
//         switch (distribution) {
//             case 'normal':
//                 sample.push(math.randomNormal(mean, stdDev));
//                 break;
//             case 'exponential':
//                 sample.push(math.randomExponential(lambda));
//                 break;
//             case 'uniform':
//                 sample.push(math.random(min, max));
//                 break;

//         }
//     }

//     console.log("Sample data:", sample);
    
//     return sample;
// }

// Handle parameter inputs based on distribution type
function updateDistributionParameters() {
    const distribution = document.getElementById('distribution').value;
    const container = document.getElementById('distributionParameters');
    container.innerHTML = '';  // Clear previous inputs

    let html = '';
    switch (distribution) {
        case 'normal':
            html += '<label for="mean">Mean:</label> <input type="number" id="mean" value="0" step="any" onchange="onParameterChange();">';
            html += '<label for="stdDev">Standard Deviation:</label> <input type="number" id="stdDev" value="1" step="any" onchange="onParameterChange();">';
            break;
        case 'exponential':
            html += '<label for="lambda">Lambda (rate):</label> <input type="number" id="lambda" value="1" step="any" onchange="onParameterChange();">';
            break;
        case 'uniform':
            html += '<label for="min">Min:</label> <input type="number" id="min" value="0" step="any" onchange="onParameterChange();"">';
            html += '<label for="max">Max:</label> <input type="number" id="max" value="1" step="any" onchange="onParameterChange();">';
            break;

    }

    container.innerHTML = html; // Set the appropriate HTML for parameters
    onParameterChange()

}

// Function to calculate the maximum of a sample
function calculateMax(sample) {
    return Math.max(...sample);
}

// Function to calculate summary statistics
function calculateStatistics(data) {
    const mean_ = math.mean(data);
    const median = math.median(data);
    const variance = math.variance(data);  // Fixed variance calculation
    const stdDev = math.std(data);
    // Update DOM with calculated statistics
    document.getElementById('mean_').innerText = `Mean: ${mean_.toFixed(2)}`;
    document.getElementById('median').innerText = `Median: ${median.toFixed(2)}`;
    document.getElementById('variance').innerText = `Variance: ${variance.toFixed(2)}`;
    document.getElementById('stdDev_').innerText = `Standard Deviation: ${stdDev.toFixed(2)}`;
    // console.log("Mean:", mean_, "Median:", median, "Variance:", variance, "Standard Deviation:", stdDev);
    return { mean_, median, variance, stdDev };
}

// Function to run the Monte Carlo simulation
function runSimulation() {
    // Get user inputs
    const sampleSize = parseInt(document.getElementById('sampleSize').value);
    const numSimulations = parseInt(document.getElementById('numSimulations').value);
    const numBins = parseInt(document.getElementById('numBins').value);
    const distribution = document.getElementById('distribution').value;

    // Array to store the maximums
    let maxima = [];

    // Monte Carlo Simulation: Generate samples and compute their maximum
    for (let i = 0; i < numSimulations; i++) {
        const sample = generateSample(sampleSize, distribution);
        if (sample.some(isNaN)) {
            console.error("Sample contains NaN values", sample);
        }
        const maxVal = calculateMax(sample);
        maxima.push(maxVal);
    }

    // Plot the histogram of maxima
    plotHistogram(maxima, numBins);

    // Calculate and display summary statistics
    const stats = calculateStatistics(maxima);
    // document.getElementById('mean').innerText = `Mean: ${stats.mean_.toFixed(2)}`;
    // document.getElementById('median').innerText = `Median: ${stats.median.toFixed(2)}`;
    // document.getElementById('variance').innerText = `Variance: ${stats.variance.toFixed(2)}`;
    // document.getElementById('stdDev').innerText = `Standard Deviation: ${stats.stdDev.toFixed(2)}`;


}

// Function to create histogram data (binning)
function createHistogramData(data, numBins) {
    let min = Math.min(...data);
    let max = Math.max(...data);
    const xMinInput = document.getElementById('xMin').value;
    const xMaxInput = document.getElementById('xMax').value;
    let xMinValue = isNaN(parseFloat(xMinInput)) ? min : parseFloat(xMinInput);
    let xMaxValue = isNaN(parseFloat(xMaxInput)) ? max : parseFloat(xMaxInput);

    min = Math.min(min, xMinValue);  // Ensure the bins cover the user specified range
    max = Math.max(max, xMaxValue);

    const binWidth = (max - min) / numBins;
    let bins = new Array(numBins).fill(0);
    let labels = [];

    for (let i = 0; i < numBins; i++) {
        const binStart = min + i * binWidth;
        labels.push(binStart.toFixed(2));
    }

    data.forEach(val => {
        if (val >= xMinValue && val <= xMaxValue) {
            const binIndex = Math.min(Math.floor((val - min) / binWidth), numBins - 1);
            bins[binIndex]++;
        }
    });

    return { labels: labels, values: bins };
}

// Function to generate a random sample from a distribution
function generateSample(size, distribution) {
    let sample = [];
    const mean = parseFloat(document.getElementById('mean') ? document.getElementById('mean').value : 0);
    const stdDev = parseFloat(document.getElementById('stdDev') ? document.getElementById('stdDev').value : 1);
    const lambda = parseFloat(document.getElementById('lambda') ? document.getElementById('lambda').value : 1);
    const min = parseFloat(document.getElementById('min') ? document.getElementById('min').value : 0);
    const max = parseFloat(document.getElementById('max') ? document.getElementById('max').value : 1);

    for (let i = 0; i < size; i++) {
        switch (distribution) {
            case 'normal':
                const u1 = Math.random();
                const u2 = Math.random();
                const z = mean + stdDev * (Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2));
                sample.push(z);
                break;
            case 'exponential':
                const x = -Math.log(1 - Math.random()) / lambda;
                sample.push(x);
                break;
            case 'uniform':
                sample.push(min + Math.random() * (max - min));
                break;
        }
    }
    // console.log("Sample data:", sample);
    return sample;
}



// Function to plot histogram using Chart.js
function plotHistogram(data, numBins) {
    const histogramData = createHistogramData(data, numBins);
    const ctx = document.getElementById('myChart').getContext('2d');

    if (myChart) {
        myChart.destroy();
    }

    const xMinInput = document.getElementById('xMin').value;
    const xMaxInput = document.getElementById('xMax').value;
    const xMinValue = isNaN(parseFloat(xMinInput)) ? undefined : parseFloat(xMinInput);
    const xMaxValue = isNaN(parseFloat(xMaxInput)) ? undefined : parseFloat(xMaxInput);

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: histogramData.labels,
            datasets: [{
                label: 'Frequency',
                data: histogramData.values,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',  // Ensure this is set for numeric x-axis
                    title: {
                        display: true,
                        text: 'Sample Maximum'
                    },
                    min: xMinValue,  // Set the x-axis minimum
                    max: xMaxValue,  // Set the x-axis maximum
                },
                y: {
                    title: {
                        display: true,
                        text: 'Frequency'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}


// Function to update slider value display and check auto-update setting
function onParameterChange() {
    // Update displayed values next to sliders
    updateSliderValue('sampleSizeValue', document.getElementById('sampleSize').value);
    updateSliderValue('numSimulationsValue', document.getElementById('numSimulations').value);
    updateSliderValue('numBinsValue', document.getElementById('numBins').value);

    // Check if auto-update is enabled
    if (document.getElementById('autoUpdate').checked) {
        runSimulation();
    }
}

// Function to update slider value display
function updateSliderValue(elementId, value) {
    document.getElementById(elementId).innerText = value;
}

window.onload = () => {
    updateDistributionParameters();  // Initialize parameters on page load
};