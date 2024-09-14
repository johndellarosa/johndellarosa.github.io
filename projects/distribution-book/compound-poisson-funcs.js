document.addEventListener('DOMContentLoaded', () => {

    

    document.getElementById('discreteType').addEventListener('change', updateDiscreteParams);
    document.getElementById('secondaryType').addEventListener('change', updateSecondaryParams);
    document.getElementById('generate-button').addEventListener('click', generateCompoundDistribution);
    document.getElementById('export-data').addEventListener('click', exportData);


// Function to update the discrete distribution parameters
function updateDiscreteParams() {
    const discreteType = document.getElementById('discreteType').value;
    const discreteParams = document.getElementById('discreteParams');
    discreteParams.innerHTML = ''; // Clear previous inputs

    if (discreteType === 'poisson') {
        discreteParams.innerHTML = `
            <label for="poissonLambda">Lambda (λ):</label>
            <input type="number" id="poissonLambda" value="3">
        `;
    } else if (discreteType === 'binomial') {
        discreteParams.innerHTML = `
            <label for="binomialN">n:</label>
            <input type="number" id="binomialN" value="10">
            <label for="binomialP">p:</label>
            <input type="number" id="binomialP" step="0.01" value="0.5">
        `;
    }
}

// Function to update the secondary distribution parameters
function updateSecondaryParams() {
    const secondaryType = document.getElementById('secondaryType').value;
    const secondaryParams = document.getElementById('secondaryParams');
    secondaryParams.innerHTML = ''; // Clear previous inputs

    if (secondaryType === 'normal') {
        secondaryParams.innerHTML = `
            <label for="normalMean">Mean (μ):</label>
            <input type="number" id="normalMean" value="0">
            <label for="normalVariance">Variance (σ²):</label>
            <input type="number" id="normalVariance" value="1">
        `;
    } else if (secondaryType === 'exponential') {
        secondaryParams.innerHTML = `
            <label for="expLambda">Rate (λ):</label>
            <input type="number" id="expLambda" value="1">
        `;
    } else if (secondaryType === 'uniform') {
        secondaryParams.innerHTML = `
            <label for="uniformMin">Min:</label>
            <input type="number" id="uniformMin" value="0">
            <label for="uniformMax">Max:</label>
            <input type="number" id="uniformMax" value="1">
        `;
    }
}

// Function to generate and plot the compound distribution
function generateCompoundDistribution() {
    const discreteType = document.getElementById('discreteType').value;
    const secondaryType = document.getElementById('secondaryType').value;

    let discreteSamples = [];

    // Generate samples from the discrete distribution
    if (discreteType === 'poisson') {
        const lambda = parseFloat(document.getElementById('poissonLambda').value);
        for (let i = 0; i < 1000; i++) {
            discreteSamples.push(poissonSample(lambda));
        }
    } else if (discreteType === 'binomial') {
        const n = parseInt(document.getElementById('binomialN').value);
        const p = parseFloat(document.getElementById('binomialP').value);
        for (let i = 0; i < 1000; i++) {
            discreteSamples.push(binomialSample(n, p));
        }
    }

    // Generate the compound distribution samples based on the secondary distribution
    let compoundSamples = [];
    discreteSamples.forEach(sample => {
        if (secondaryType === 'normal') {
            const mean = parseFloat(document.getElementById('normalMean').value);
            const variance = parseFloat(document.getElementById('normalVariance').value);
            compoundSamples.push(normalSample(mean, Math.sqrt(variance), sample));
        } else if (secondaryType === 'exponential') {
            const lambda = parseFloat(document.getElementById('expLambda').value);
            compoundSamples.push(exponentialSample(lambda, sample));
        } else if (secondaryType === 'uniform') {
            const min = parseFloat(document.getElementById('uniformMin').value);
            const max = parseFloat(document.getElementById('uniformMax').value);
            compoundSamples.push(uniformSample(min, max, sample));
        }
    });

    // Plot the compound distribution
    plotCompoundDistribution(compoundSamples);

    window.generatedData = compoundSamples;
    // updateDistributionFormulas();
        // Calculate and display summary statistics
    const stats = calculateStatistics(compoundSamples);
    document.getElementById('meanStat').textContent = stats.mean.toFixed(4);
    document.getElementById('varianceStat').textContent = stats.variance.toFixed(4);
    document.getElementById('stdDevStat').textContent = stats.stdDev.toFixed(4);
    document.getElementById('minStat').textContent = stats.min.toFixed(4);
    document.getElementById('maxStat').textContent = stats.max.toFixed(4);
    document.getElementById('skewnessStat').textContent = stats.skewness.toFixed(4);
    document.getElementById('kurtosisStat').textContent = stats.kurtosis.toFixed(4);


}

// Sampling functions for discrete and secondary distributions
function poissonSample(lambda) {
    let L = Math.exp(-lambda);
    let k = 0;
    let p = 1.0;
    do {
        k++;
        p *= Math.random();
    } while (p > L);
    return k - 1;
}

function binomialSample(n, p) {
    let successes = 0;
    for (let i = 0; i < n; i++) {
        if (Math.random() < p) successes++;
    }
    return successes;
}

function normalSample(mean, stdDev, factor = 1) {
    let u = Math.random();
    let v = Math.random();
    let z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return factor * (mean + stdDev * z);
}

function exponentialSample(lambda, factor = 1) {
    return factor * (-Math.log(1 - Math.random()) / lambda);
}

function uniformSample(min, max, factor = 1) {
    return factor * (min + (max - min) * Math.random());
}

// Function to plot the compound distribution using Chart.js
function plotCompoundDistribution(data) {
    const ctx = document.getElementById('compoundChart').getContext('2d');

    if (window.compoundChart instanceof Chart) {
        window.compoundChart.destroy();
    }

    const histData = createHistogram(data, 50); // Adjust the number of bins

    window.compoundChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: histData.labels,
            datasets: [{
                label: 'Compound Distribution',
                data: histData.values,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Value'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Frequency'
                    }
                }
            }
        }
    });
}

    // Function to calculate summary statistics, including skewness and kurtosis
    function calculateStatistics(data) {
        const n = data.length;
        const mean = data.reduce((a, b) => a + b, 0) / n;
        const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        const min = Math.min(...data);
        const max = Math.max(...data);

        // Skewness calculation
        const skewness = data.reduce((a, b) => a + Math.pow((b - mean) / stdDev, 3), 0) / n;

        // Kurtosis calculation (subtract 3 for excess kurtosis)
        const kurtosis = data.reduce((a, b) => a + Math.pow((b - mean) / stdDev, 4), 0) / n;
        // console.log("Generated Data:", data);
        // console.log("NumBins:", numBins, "xMin:", xMin, "xMax:", xMax, "yMin:", yMin, "yMax:", yMax);
        
        return { mean, variance, stdDev, min, max, skewness, kurtosis };
    }

        // Function to export the generated data as a CSV file
function exportData() {
    const data = window.generatedData;
    if (!data || data.length === 0) {
        alert('No data to export. Please generate the distribution first.');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Sample\n";
    data.forEach(sample => {
        csvContent += sample + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'compound_poisson_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to create histogram data from samples
function createHistogram(data, bins) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins;
    const histogram = Array(bins).fill(0);

    data.forEach(value => {
        const bin = Math.floor((value - min) / binWidth);
        if (bin >= 0 && bin < bins) {
            histogram[bin]++;
        }
    });

    const labels = Array(bins).fill().map((_, i) => (min + i * binWidth).toFixed(2));
    return { labels, values: histogram };
}

updateDiscreteParams();
updateSecondaryParams();
    
});