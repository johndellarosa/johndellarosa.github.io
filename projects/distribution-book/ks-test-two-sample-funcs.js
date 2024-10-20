// script.js

// Declare myChart in the outer scope
let myChart;


document.addEventListener('DOMContentLoaded', function() {
    // Initialize the parameter fields for both samples
    updateDistributionParams('1');
    updateDistributionParams('2');

    // Update parameter fields when the distribution selection changes
    document.getElementById('theoreticalDist1').addEventListener('change', function() {
        updateDistributionParams('1');
    });
    document.getElementById('theoreticalDist2').addEventListener('change', function() {
        updateDistributionParams('2');
    });

    // Handle the form submission
    document.getElementById('submitBtn').addEventListener('click', function() {
            // Get data points for Sample 1
            const dataPoints1 = getDataPoints('1');
            // Get data points for Sample 2
            const dataPoints2 = getDataPoints('2');
            if (dataPoints1.length === 0 || dataPoints2.length === 0) {
                alert('Please enter valid data points for both samples.');
                return;
            }
        try {


            if (dataPoints1.length === 0 || dataPoints2.length === 0) {
                alert('Please enter valid data points for both samples.');
                return;
            }

            // Get x-axis limits
            let xAxisLimits = getXAxisLimits();

            // Get colors
            const colors1 = getLineColors('1');
            const colors2 = getLineColors('2');

            // Proceed to plot and analyze
            plotData(dataPoints1, dataPoints2, xAxisLimits, colors1, colors2);
        } catch (error) {
            // Handle errors gracefully
            console.error(error);
            alert('An error occurred: ' + error.message);
        }
    });

    // Handle the clear button
    document.getElementById('clearBtn').addEventListener('click', function() {
        // Clear Sample 1 inputs
        document.getElementById('dataPoints1').value = '';
        document.getElementById('distributionParams1').innerHTML = '';
        document.getElementById('numSamples1').value = '100';

        // Clear Sample 2 inputs
        document.getElementById('dataPoints2').value = '';
        document.getElementById('distributionParams2').innerHTML = '';
        document.getElementById('numSamples2').value = '100';

        // Clear common inputs
        document.getElementById('testResults').innerHTML = '';
        document.getElementById('xMin').value = '';
        document.getElementById('xMax').value = '';

        if (myChart) myChart.destroy();
        myChart = null;

        updateDistributionParams('1');
        updateDistributionParams('2');
    });

    // Handle the generate data buttons
    document.getElementById('generateBtn1').addEventListener('click', function() {
        generateData('1');
    });
    document.getElementById('generateBtn2').addEventListener('click', function() {
        generateData('2');
    });

    // Handle CSV file uploads
    document.getElementById('csvFile1').addEventListener('change', function(event) {
        handleCSVUpload(event, '1');
    });
    document.getElementById('csvFile2').addEventListener('change', function(event) {
        handleCSVUpload(event, '2');
    });
});

// Function to get data points for a sample
function getDataPoints(sampleNumber) {
    const dataInput = document.getElementById('dataPoints' + sampleNumber).value;
    if (dataInput == '') return [];
    let dataPoints = dataInput.split(/[\s,]+/)
        .map(Number)
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);
    return dataPoints;
}

// Function to parse CSV data
function parseCSVData(csvText) {
    const rows = csvText.split(/\r?\n/);
    let data = [];
    for (let row of rows) {
        const values = row.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
        data = data.concat(values);
    }
    return data;
}

// Function to handle CSV upload for a sample
function handleCSVUpload(event, sampleNumber) {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            const data = parseCSVData(text);
            document.getElementById('dataPoints' + sampleNumber).value = data.join(', ');
        };
        reader.readAsText(file);
    } else {
        alert('Please select a valid CSV file.');
    }
}

// Function to update parameter fields based on the selected distribution
function updateDistributionParams(sampleNumber) {
    const distType = document.getElementById('theoreticalDist' + sampleNumber).value;
    const paramsDiv = document.getElementById('distributionParams' + sampleNumber);
    paramsDiv.innerHTML = ''; // Clear previous inputs

    if (distType === 'normal') {
        paramsDiv.innerHTML += `
            <label for="mean${sampleNumber}">Mean (μ):</label>
            <input type="number" id="mean${sampleNumber}" value="0" step="any" placeholder="e.g., 0">
            <label for="stdDev${sampleNumber}">Standard Deviation (σ):</label>
            <input type="number" id="stdDev${sampleNumber}" value="1" step="any" placeholder="e.g., 1">
        `;
    } else if (distType === 'uniform') {
        paramsDiv.innerHTML += `
            <label for="min${sampleNumber}">Minimum (a):</label>
            <input type="number" id="min${sampleNumber}" value="0" step="any" placeholder="e.g., 0">
            <label for="max${sampleNumber}">Maximum (b):</label>
            <input type="number" id="max${sampleNumber}" value="1" step="any" placeholder="e.g., 1">
        `;
    } else if (distType === 'exponential') {
        paramsDiv.innerHTML += `
            <label for="lambda${sampleNumber}">Rate (λ):</label>
            <input type="number" id="lambda${sampleNumber}" value="1" step="any" placeholder="e.g., 1">
        `;
    } else if (distType === 'lognormal') {
        paramsDiv.innerHTML += `
            <label for="mu${sampleNumber}">Mu (μ):</label>
            <input type="number" id="mu${sampleNumber}" value="0" step="any" placeholder="e.g., 0">
            <label for="sigma${sampleNumber}">Sigma (σ):</label>
            <input type="number" id="sigma${sampleNumber}" value="1" step="any" placeholder="e.g., 1">
        `;
    } else if (distType === 'gamma') {
        paramsDiv.innerHTML += `
            <label for="shape${sampleNumber}">Shape (k):</label>
            <input type="number" id="shape${sampleNumber}" value="2" step="any" placeholder="e.g., 2">
            <label for="scale${sampleNumber}">Scale (θ):</label>
            <input type="number" id="scale${sampleNumber}" value="2" step="any" placeholder="e.g., 2">
        `;
    }
    // Add more distributions as needed
}

function getDistributionParams(distType, sampleNumber) {
    let params = {};
    if (distType === 'normal') {
        params.mean = parseFloat(document.getElementById('mean' + sampleNumber).value);
        params.stdDev = parseFloat(document.getElementById('stdDev' + sampleNumber).value);
        if (params.stdDev <= 0 || isNaN(params.mean) || isNaN(params.stdDev)) {
            alert('Please enter a valid mean and a positive standard deviation for Sample ' + sampleNumber + '.');
            throw new Error('Invalid parameters');
        }
    } else if (distType === 'uniform') {
        params.min = parseFloat(document.getElementById('min' + sampleNumber).value);
        params.max = parseFloat(document.getElementById('max' + sampleNumber).value);
        if (params.min >= params.max || isNaN(params.min) || isNaN(params.max)) {
            alert('Please ensure that minimum is less than maximum and both are valid numbers for Sample ' + sampleNumber + '.');
            throw new Error('Invalid parameters');
        }
    } else if (distType === 'exponential') {
        params.lambda = parseFloat(document.getElementById('lambda' + sampleNumber).value);
        if (params.lambda <= 0 || isNaN(params.lambda)) {
            alert('Please enter a positive rate (λ) for Sample ' + sampleNumber + '.');
            throw new Error('Invalid parameters');
        }
    } else if (distType === 'lognormal') {
        params.mu = parseFloat(document.getElementById('mu' + sampleNumber).value);
        params.sigma = parseFloat(document.getElementById('sigma' + sampleNumber).value);
        if (params.sigma <= 0 || isNaN(params.mu) || isNaN(params.sigma)) {
            alert('Please enter a valid mu and a positive sigma for Sample ' + sampleNumber + '.');
            throw new Error('Invalid parameters');
        }
    } else if (distType === 'gamma') {
        params.shape = parseFloat(document.getElementById('shape' + sampleNumber).value);
        params.scale = parseFloat(document.getElementById('scale' + sampleNumber).value);
        if (params.shape <= 0 || params.scale <= 0 || isNaN(params.shape) || isNaN(params.scale)) {
            alert('Please enter positive values for shape and scale parameters for Sample ' + sampleNumber + '.');
            throw new Error('Invalid parameters');
        }
    }
    return params;
}

// Function to get x-axis limits from input fields
function getXAxisLimits() {
    let xMin = parseFloat(document.getElementById('xMin').value);
    let xMax = parseFloat(document.getElementById('xMax').value);
    if (isNaN(xMin)) xMin = null;
    if (isNaN(xMax)) xMax = null;
    if (xMin !== null && xMax !== null && xMin >= xMax) {
        alert('Please ensure that X-Axis Min is less than X-Axis Max.');
        throw new Error('Invalid x-axis limits');
    }
    return { xMin, xMax };
}

function generateData(sampleNumber) {
    try {
        // Get theoretical distribution
        const distType = document.getElementById('theoreticalDist' + sampleNumber).value;

        // Get distribution parameters
        let params = getDistributionParams(distType, sampleNumber);

        // Get number of samples
        let numSamples = parseInt(document.getElementById('numSamples' + sampleNumber).value);
        if (isNaN(numSamples) || numSamples <= 0) {
            alert('Please enter a valid number of samples for Sample ' + sampleNumber + '.');
            return;
        }

        // Generate data
        let generatedData = generateRandomData(distType, params, numSamples);

        // Populate data input field
        document.getElementById('dataPoints' + sampleNumber).value = generatedData.join(', ');

    } catch (error) {
        // Handle errors gracefully
        console.error(error);
        alert('An error occurred: ' + error.message);
    }
}

function generateRandomData(distType, params, numSamples) {
    let data = [];
    if (distType === 'normal') {
        for (let i = 0; i < numSamples; i++) {
            data.push(randomNormal(params.mean, params.stdDev));
        }
    } else if (distType === 'uniform') {
        for (let i = 0; i < numSamples; i++) {
            data.push(randomUniform(params.min, params.max));
        }
    } else if (distType === 'exponential') {
        for (let i = 0; i < numSamples; i++) {
            data.push(randomExponential(params.lambda));
        }
    } else if (distType === 'lognormal') {
        for (let i = 0; i < numSamples; i++) {
            data.push(randomLogNormal(params.mu, params.sigma));
        }
    } else if (distType === 'gamma') {
        for (let i = 0; i < numSamples; i++) {
            data.push(randomGamma(params.shape, params.scale));
        }
    }
    return data;
}

// Function to get line colors for a sample
function getLineColors(sampleNumber) {
    const empiricalColor = document.getElementById('empiricalColor' + sampleNumber).value;
    const theoreticalColor = document.getElementById('theoreticalColor' + sampleNumber).value;
    return { empiricalColor, theoreticalColor };
}

function plotData(dataPoints1, dataPoints2, xAxisLimits, colors1, colors2) {
    // Compute empirical CDFs
    const n1 = dataPoints1.length;
    const n2 = dataPoints2.length;
    const empiricalCDF1 = [];
    const empiricalCDF2 = [];
    // const plotTheoretical1 = document.getElementById('plotTheoretical1').checked;
    // const plotTheoretical2 = document.getElementById('plotTheoretical2').checked;
    // let theoreticalCDF1 = [];
    // let theoreticalCDF2 = [];

    for (let i = 0; i < n1; i++) {
        empiricalCDF1.push({ x: dataPoints1[i], y: i / n1 });
        empiricalCDF1.push({ x: dataPoints1[i], y: (i + 1) / n1 });
    }

    for (let i = 0; i < n2; i++) {
        empiricalCDF2.push({ x: dataPoints2[i], y: i / n2 });
        empiricalCDF2.push({ x: dataPoints2[i], y: (i + 1) / n2 });
    }

    const xMinData = Math.min(dataPoints1[0], dataPoints2[0]);
    const xMaxData = Math.max(dataPoints1[dataPoints1.length - 1], dataPoints2[dataPoints2.length - 1]);
    let xMin = xAxisLimits.xMin !== null ? xAxisLimits.xMin : xMinData;
    let xMax = xAxisLimits.xMax !== null ? xAxisLimits.xMax : xMaxData;

    if (xMin > xMinData) xMin = xMinData;
    if (xMax < xMaxData) xMax = xMaxData;

    // Get user selections for plotting theoretical CDFs
    const plotTheoretical1 = document.getElementById('plotTheoretical1').checked;
    const plotTheoretical2 = document.getElementById('plotTheoretical2').checked;

    // Generate theoretical CDFs if selected
    let theoreticalCDF1 = [];
    let theoreticalCDF2 = [];

    const step = (xMax - xMin) / 200;



    // Perform two-sample K-S test
    const ksResult = twoSampleKSTest(dataPoints1, dataPoints2);
    const ksX = ksResult.ksX;

    // Vertical line for KS statistic
    const ksLine = {
        label: 'KS Statistic Location',
        data: [{ x: ksX, y: 0 }, { x: ksX, y: 1 }],
        borderColor: '#000000',
        borderWidth: 1,
        fill: false,
        pointRadius: 0,
        showLine: true,
        tension: 0,
        type: 'line',
        borderDash: [5, 5] // Dashed line
    };

    if (plotTheoretical1) {
        const distType1 = document.getElementById('theoreticalDist1').value;
        const params1 = getDistributionParams(distType1, '1');

        for (let x = xMin; x <= xMax; x += step) {
            let y;
            if (distType1 === 'normal') {
                y = normalCDF(x, params1.mean, params1.stdDev);
            } else if (distType1 === 'uniform') {
                y = uniformCDF(x, params1.min, params1.max);
            } else if (distType1 === 'exponential') {
                y = exponentialCDF(x, params1.lambda);
            } else if (distType1 === 'lognormal') {
                y = logNormalCDF(x, params1.mu, params1.sigma);
            } else if (distType1 === 'gamma') {
                y = gammaCDF(x, params1.shape, params1.scale);
            }
            theoreticalCDF1.push({ x, y });
        }
    }

    if (plotTheoretical2) {
        const distType2 = document.getElementById('theoreticalDist2').value;
        const params2 = getDistributionParams(distType2, '2');

        for (let x = xMin; x <= xMax; x += step) {
            let y;
            if (distType2 === 'normal') {
                y = normalCDF(x, params2.mean, params2.stdDev);
            } else if (distType2 === 'uniform') {
                y = uniformCDF(x, params2.min, params2.max);
            } else if (distType2 === 'exponential') {
                y = exponentialCDF(x, params2.lambda);
            } else if (distType2 === 'lognormal') {
                y = logNormalCDF(x, params2.mu, params2.sigma);
            } else if (distType2 === 'gamma') {
                y = gammaCDF(x, params2.shape, params2.scale);
            }
            theoreticalCDF2.push({ x, y });
        }
    }

    // Prepare datasets
    const datasets = [
        {
            label: 'Empirical CDF Sample 1',
            data: empiricalCDF1,
            borderColor: colors1.empiricalColor,
            fill: false,
            stepped: 'before',
            tension: 0,
            pointRadius: 0
        },
        {
            label: 'Empirical CDF Sample 2',
            data: empiricalCDF2,
            borderColor: colors2.empiricalColor,
            fill: false,
            stepped: 'before',
            tension: 0,
            pointRadius: 0
        },
        ksLine
    ];

    if (plotTheoretical1) {
        datasets.push({
            label: 'Theoretical CDF Sample 1',
            data: theoreticalCDF1,
            borderColor: colors1.theoreticalColor,
            fill: false,
            tension: 0,
            pointRadius: 0
        });
    }

    if (plotTheoretical2) {
        datasets.push({
            label: 'Theoretical CDF Sample 2',
            data: theoreticalCDF2,
            borderColor: colors2.theoreticalColor,
            fill: false,
            tension: 0,
            pointRadius: 0
        });
    }

    // Plot using Chart.js
    const ctx = document.getElementById('myChart').getContext('2d');
    if (myChart) myChart.destroy(); // Destroy previous chart if any

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            // maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Value'
                    },
                    min: xMin,
                    max: xMax
                },
                y: {
                    min: 0,
                    max: 1,
                    title: {
                        display: true,
                        text: 'Cumulative Probability'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                    },
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: false
            }
        }
    });

    // Display test results
    const resultsDiv = document.getElementById('testResults');
    resultsDiv.innerHTML = `
        <h2>Two-Sample Test Results</h2>
        <p><strong>Kolmogorov-Smirnov Test:</strong> Statistic = ${ksResult.ksStatistic.toFixed(4)}, Approximate p-value = ${ksResult.ksPValue.toFixed(4)}</p>
    `;
}

// Two-Sample Kolmogorov-Smirnov Test
function twoSampleKSTest(data1, data2) {
    const n1 = data1.length;
    const n2 = data2.length;
    const allData = data1.concat(data2).sort((a, b) => a - b);

    let dMax = 0;
    let ksX = allData[0];
    let i = 0;
    let j = 0;

    for (let k = 0; k < allData.length; k++) {
        while (i < n1 && data1[i] <= allData[k]) i++;
        while (j < n2 && data2[j] <= allData[k]) j++;

        const fn1 = i / n1;
        const fn2 = j / n2;
        const d = Math.abs(fn1 - fn2);

        if (d > dMax) {
            dMax = d;
            ksX = allData[k];
        }
    }

    // K-S Statistic and p-value
    const ksStatistic = dMax;
    const en = Math.sqrt((n1 * n2) / (n1 + n2));
    const ksPValue = twoSampleKSPValueApproximation(ksStatistic, en);

    return { ksStatistic, ksPValue, ksX };
}

// Approximate p-value for two-sample K-S test
function twoSampleKSPValueApproximation(d, en) {
    const lambda = (en + 0.12 + 0.11 / en) * d;
    // Use the asymptotic formula
    const pValue = 2 * Math.exp(-2 * lambda * lambda);
    return pValue > 1 ? 1 : pValue;
}


// Statistical distribution functions

// Normal distribution CDF using the error function
function normalCDF(x, mean, stdDev) {
    return 0.5 * (1 + erf((x - mean) / (stdDev * Math.sqrt(2))));
}

// Error function approximation
function erf(x) {
    // Save the sign of x
    const sign = Math.sign(x);
    x = Math.abs(x);

    // Constants
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    // Abramowitz and Stegun formula 7.1.26
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
}

// Uniform distribution CDF
function uniformCDF(x, min, max) {
    if (x < min) return 0;
    else if (x > max) return 1;
    else return (x - min) / (max - min);
}

// Exponential distribution CDF
function exponentialCDF(x, lambda) {
    if (x < 0) return 0;
    else return 1 - Math.exp(-lambda * x);
}

// Log-Normal distribution CDF
function logNormalCDF(x, mu, sigma) {
    if (x <= 0) return 0;
    else return 0.5 + 0.5 * erf((Math.log(x) - mu) / (sigma * Math.sqrt(2)));
}

// Gamma distribution CDF using numerical integration
function gammaCDF(x, shape, scale) {
    if (x < 0) return 0;
    else return gammaIncomplete(shape, x / scale) / gammaFunction(shape);
}

// Gamma function using Lanczos approximation
function gammaFunction(z) {
    const p = [
        676.5203681218851,  -1259.1392167224028,
        771.32342877765313, -176.61502916214059,
        12.507343278686905, -0.13857109526572012,
        9.9843695780195716e-6, 1.5056327351493116e-7
    ];
    const g = 7;
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaFunction(1 - z));
    z -= 1;
    let x = 0.99999999999980993;
    for (let i = 0; i < p.length; i++) {
        x += p[i] / (z + i + 1);
    }
    const t = z + g + 0.5;
    return Math.sqrt(2 * Math.PI) * t ** (z + 0.5) * Math.exp(-t) * x;
}

// Incomplete gamma function using series expansion
function gammaIncomplete(a, x) {
    let sum = 1 / a;
    let value = sum;
    for (let n = 1; n < 100; n++) {
        sum *= x / (a + n);
        value += sum;
        if (sum / value < 1e-8) break;
    }
    return Math.exp(-x + a * Math.log(x) - Math.log(gammaFunction(a))) * value;
}

// Random data generation functions

// Random Normal Distribution (Box-Muller Transform)
function randomNormal(mean, stdDev) {
    let u1 = Math.random();
    let u2 = Math.random();
    let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
}

// Random Uniform Distribution
function randomUniform(min, max) {
    return Math.random() * (max - min) + min;
}

// Random Exponential Distribution
function randomExponential(lambda) {
    return -Math.log(1 - Math.random()) / lambda;
}

// Random Log-Normal Distribution
function randomLogNormal(mu, sigma) {
    let normalSample = randomNormal(mu, sigma);
    return Math.exp(normalSample);
}

// Random Gamma Distribution (Marsaglia and Tsang Method)
function randomGamma(shape, scale) {
    if (shape < 1) {
        // Use Johnk's generator
        let c = (1 / shape);
        let d = ((1 - shape) * Math.pow(shape, shape / (1 - shape)));
        while (true) {
            let u = Math.random();
            let v = Math.random();
            let x = c * Math.pow(u, 1 / shape);
            let y = v * Math.pow(x, shape - 1);
            if (y <= d * Math.exp(-x)) {
                return x * scale;
            }
        }
    } else {
        // Use Marsaglia and Tsang's method
        let d = shape - 1 / 3;
        let c = 1 / Math.sqrt(9 * d);
        while (true) {
            let x = randomNormal(0, 1);
            let v = Math.pow(1 + c * x, 3);
            if (v > 0) {
                let u = Math.random();
                let x2 = x * x;
                if (u < 1 - 0.0331 * x2 * x2 || Math.log(u) < 0.5 * x2 + d * (1 - v + Math.log(v))) {
                    return d * v * scale;
                }
            }
        }
    }
}

// Goodness-of-Fit Tests

function performTests(dataPoints, distType, params) {
    const n = dataPoints.length;
    let dMax = 0;
    let ksX = dataPoints[0];
    let cvmSum = 0;
    let adSum = 0;

    // Precompute theoretical CDF values
    const cdfTheoreticalArray = dataPoints.map(x => {
        let cdfTheoretical;
        if (distType === 'normal') {
            cdfTheoretical = normalCDF(x, params.mean, params.stdDev);
        } else if (distType === 'uniform') {
            cdfTheoretical = uniformCDF(x, params.min, params.max);
        } else if (distType === 'exponential') {
            cdfTheoretical = exponentialCDF(x, params.lambda);
        } else if (distType === 'lognormal') {
            cdfTheoretical = logNormalCDF(x, params.mu, params.sigma);
        } else if (distType === 'gamma') {
            cdfTheoretical = gammaCDF(x, params.shape, params.scale);
        }
        return cdfTheoretical;
    });

    // Sort data and theoretical CDFs in ascending order
    const sortedDataPoints = [...dataPoints].sort((a, b) => a - b);
    const sortedCdfTheoretical = [...cdfTheoreticalArray].sort((a, b) => a - b);

    for (let i = 0; i < n; i++) {
        const cdfEmpirical = (i + 1) / n;
        const cdfEmpiricalPrev = i / n;
        const cdfTheoretical = cdfTheoreticalArray[i];

        const d1 = Math.abs(cdfEmpirical - cdfTheoretical);
        const d2 = Math.abs(cdfEmpiricalPrev - cdfTheoretical);
        const d = Math.max(d1, d2);
        if (d > dMax) {
            dMax = d;
            ksX = dataPoints[i];
        }

        // Cramér-von Mises sum
        const u = cdfTheoretical;
        const term = u - (2 * i + 1) / (2 * n);
        cvmSum += term * term;
    }

    // Corrected Anderson-Darling sum
    for (let i = 0; i < n; i++) {
        const Fi = sortedCdfTheoretical[i];
        const FiComplement = 1 - sortedCdfTheoretical[n - i - 1];
        if (Fi > 0 && FiComplement > 0) {
            adSum += (2 * i + 1) * (Math.log(Fi) + Math.log(FiComplement));
        } else {
            // Adjust for edge cases where Fi is 0 or 1
            adSum += 0;
        }
    }
    const adStatistic = -n - (1 / n) * adSum;

    // K-S Statistic and p-value
    const ksStatistic = dMax;
    const ksPValue = ksPValueApproximation(ksStatistic, n);

    // Cramér-von Mises Statistic
    const cvmStatistic = (1 / (12 * n)) + cvmSum;

    // Display results
    const resultsDiv = document.getElementById('testResults');
    resultsDiv.innerHTML = `
        <h2>Test Results</h2>
        <p><strong>Kolmogorov-Smirnov Test:</strong> Statistic = ${ksStatistic.toFixed(4)}, Approximate p-value = ${ksPValue.toFixed(4)}</p>
        <p><strong>Anderson-Darling Test:</strong> Statistic = ${adStatistic.toFixed(4)}</p>
        <p><strong>Cramér-von Mises Test:</strong> Statistic = ${cvmStatistic.toFixed(4)}</p>
    `;

    return { ksStatistic, ksX };
}


// Approximate p-value for K-S test (for large n)
function ksPValueApproximation(d, n) {
    const sqrtN = Math.sqrt(n);
    const lambda = (sqrtN + 0.12 + 0.11 / sqrtN) * d;
    // Use the asymptotic formula
    const pValue = 2 * Math.exp(-2 * lambda * lambda);
    return pValue > 1 ? 1 : pValue;
}
