// Metropolis Algorithm Parameters
const sigmaInput = document.getElementById('sigma');
const iterationsInput = document.getElementById('iterations');
const x0Input = document.getElementById('x0');
const burnInInput = document.getElementById('burnIn');
const thinInput = document.getElementById('thin');
const runButton = document.getElementById('runButton');
const infoDiv = document.getElementById('info');

// Plot Divs
const histogramDiv = document.getElementById('histogram');
const traceplotDiv = document.getElementById('traceplot');
const autocorrDiv = document.getElementById('autocorrelation');
const qqplotDiv = document.getElementById('qqplot');

// Event Listener for the Run Button
runButton.addEventListener('click', () => {
    const sigma = parseFloat(sigmaInput.value);
    const numIterations = parseInt(iterationsInput.value);
    const x0 = parseFloat(x0Input.value);
    const burnIn = parseInt(burnInInput.value);
    const thin = parseInt(thinInput.value);
    runMetropolisAlgorithm(sigma, numIterations, x0, burnIn, thin);
});

// Target Distribution: Standard Normal PDF using jStat
function targetDistribution(x) {
    return jStat.normal.pdf(x, 0, 1);
}

// Metropolis Algorithm Function
function metropolisAlgorithm(sigma, numIterations, x0) {
    const samples = [];
    let x = x0; // Starting point
    let accepted = 0;

    for (let t = 0; t < numIterations; t++) {
        // Propose a new sample from the proposal distribution
        const xPrime = x + jStat.normal.sample(0, sigma);

        // Calculate acceptance probability
        const alpha = Math.min(1, targetDistribution(xPrime) / targetDistribution(x));

        // Accept or reject the proposal
        if (Math.random() < alpha) {
            x = xPrime;
            accepted++;
        }
        samples.push(x);
    }
    const acceptanceRate = accepted / numIterations;
    return { samples, acceptanceRate };
}

// Function to compute autocorrelation
function autocorrelation(data, lag) {
    const n = data.length;
    const mean = jStat.mean(data);
    const c0 = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);

    let autocov = 0;
    for (let i = 0; i < n - lag; i++) {
        autocov += (data[i] - mean) * (data[i + lag] - mean);
    }

    return autocov / c0;
}

// Function to run the Metropolis Algorithm and plot the results
function runMetropolisAlgorithm(sigma, numIterations, x0, burnIn, thin) {
    // Clear previous plots
    Plotly.purge(histogramDiv);
    Plotly.purge(traceplotDiv);
    Plotly.purge(autocorrDiv);
    Plotly.purge(qqplotDiv);

    const result = metropolisAlgorithm(sigma, numIterations, x0);
    const samples = result.samples;
    const acceptanceRate = result.acceptanceRate;

    // Display acceptance rate
    infoDiv.innerHTML = `<p>Acceptance Rate: ${(acceptanceRate * 100).toFixed(2)}%</p>`;

    // Apply Burn-in and Thinning
    let processedSamples = samples.slice(burnIn);
    if (thin > 1) {
        processedSamples = processedSamples.filter((_, index) => index % thin === 0);
    }

    if (processedSamples.length < 10) {
        infoDiv.innerHTML += `<p style="color:red;">Insufficient data after burn-in and thinning. Please adjust parameters.</p>`;
        return;
    }

    // Prepare data for plotting
    const targetX = jStat.arange(-5, 5, 0.1);
    // console.log(targetX);
    const targetY = targetX.map(x => targetDistribution(x));
    // console.log(targetY);

    // Histogram Plot
    const histogramTrace = {
        x: processedSamples,
        type: 'histogram',
        histnorm: 'probability density',
        marker: {
            color: 'rgba(100, 200, 102, 0.7)',
            line: {
                color: 'rgba(100, 200, 102, 1)',
                width: 1
            }
        },
        opacity: 0.5,
        name: 'Sampled Distribution'
    };

    const targetTrace = {
        x: targetX,
        y: targetY,
        mode: 'lines',
        line: {
            color: 'rgb(31, 119, 180)',
            width: 2
        },
        name: 'Target Distribution'
    };

    const histogramData = [histogramTrace, targetTrace];

    const histogramLayout = {
        title: 'Histogram of Sampled Values',
        xaxis: { title: 'x' },
        yaxis: { title: 'Probability Density' },
        bargap: 0.05,
        hovermode: 'closest'
    };

    Plotly.newPlot('histogram', histogramData, histogramLayout, { responsive: true });

    // Trace Plot
    const iterationIndices = processedSamples.map((_, i) => burnIn + i * thin);

    const tracePlotTrace = {
        x: iterationIndices,
        y: processedSamples,
        mode: 'lines',
        line: {
            color: 'rgb(255, 127, 14)',
            width: 1
        },
        name: 'Trace Plot'
    };

    const tracePlotData = [tracePlotTrace];

    const tracePlotLayout = {
        title: 'Trace Plot of Samples Over Iterations',
        xaxis: { title: 'Iteration' },
        yaxis: { title: 'Sample Value' },
        hovermode: 'closest'
    };

    Plotly.newPlot('traceplot', tracePlotData, tracePlotLayout, { responsive: true });

    // Autocorrelation Plot
    const maxLag = Math.min(100, processedSamples.length - 1);
    const lags = [];
    const autocorrValuesFull = [];
    const autocorrValuesThinned = [];

    // Autocorrelation for Full Data
    for (let lag = 1; lag <= maxLag; lag++) {
        lags.push(lag);
        autocorrValuesFull.push(autocorrelation(samples.slice(burnIn), lag));
        autocorrValuesThinned.push(autocorrelation(processedSamples, lag));
    }

    const autocorrTraceFull = {
        x: lags,
        y: autocorrValuesFull,
        mode: 'lines',
        line: {
            color: 'rgb(31, 119, 180)',
            width: 2
        },
        name: 'Full Data'
    };

    const autocorrTraceThinned = {
        x: lags,
        y: autocorrValuesThinned,
        mode: 'lines',
        line: {
            color: 'rgb(255, 127, 14)',
            width: 2,
            dash: 'dash'
        },
        name: 'Thinned Data'
    };

    const autocorrData = [autocorrTraceFull, autocorrTraceThinned];

    const autocorrLayout = {
        title: 'Autocorrelation Function',
        xaxis: { title: 'Lag' },
        yaxis: { title: 'Autocorrelation' },
        hovermode: 'closest',
        legend: { x: 0.1, y: 0.9 }
    };

    Plotly.newPlot('autocorrelation', autocorrData, autocorrLayout);

    // QQ Plot
    const sortedSamples = processedSamples.slice().sort((a, b) => a - b);
    const n = sortedSamples.length;
    const theoreticalQuantiles = sortedSamples.map((_, i) => jStat.normal.inv((i + 0.5) / n, 0, 1));
    const sampleQuantiles = sortedSamples;

    const qqTrace = {
        x: theoreticalQuantiles,
        y: sampleQuantiles,
        mode: 'markers',
        marker: {
            color: 'rgb(31, 119, 180)',
            size: 5
        },
        name: 'QQ Plot',
        text: sampleQuantiles.map((q, i) => `Sample Q: ${q.toFixed(3)}<br>Theoretical Q: ${theoreticalQuantiles[i].toFixed(3)}`),
        hoverinfo: 'text'
    };

    const qqLine = {
        x: [-4, 4],
        y: [-4, 4],
        mode: 'lines',
        line: {
            color: 'rgb(255, 127, 14)',
            width: 2,
            dash: 'dash'
        },
        name: '45-degree Line'
    };

    const qqData = [qqTrace, qqLine];

    const qqLayout = {
        title: 'QQ Plot of Thinned Samples vs. Standard Normal',
        xaxis: { title: 'Theoretical Quantiles' },
        yaxis: { title: 'Sample Quantiles' },
        hovermode: 'closest',
        showlegend: false
    };

    Plotly.newPlot('qqplot', qqData, qqLayout, { responsive: true });
}

// Initial Run with default parameters
runMetropolisAlgorithm(
    parseFloat(sigmaInput.value),
    parseInt(iterationsInput.value),
    parseFloat(x0Input.value),
    parseInt(burnInInput.value),
    parseInt(thinInput.value)
);
