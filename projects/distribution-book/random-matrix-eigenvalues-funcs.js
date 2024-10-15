document.getElementById('matrix-type').addEventListener('change', function() {
    let type = this.value;
    if (type === 'wishart') {
        document.getElementById('degrees-freedom').style.display = 'inline';
        document.getElementById('df-label').style.display = 'inline';
    } else {
        document.getElementById('degrees-freedom').style.display = 'none';
        document.getElementById('df-label').style.display = 'none';
    }
});

document.getElementById('generate-btn').addEventListener('click', function() {
    let type = document.getElementById('matrix-type').value;
    let size = parseInt(document.getElementById('matrix-size').value);
    let binCount = parseInt(document.getElementById('bin-count').value);

    if (size <= 0 || isNaN(size)) {
        alert('Please enter a valid matrix size.');
        return;
    }

    if (binCount <= 0 || isNaN(binCount)) {
        alert('Please enter a valid number of bins.');
        return;
    }

    if (type === 'wishart') {
        let df = parseInt(document.getElementById('degrees-freedom').value);
        if (df < size) {
            alert('Degrees of Freedom (p) must be greater than or equal to Matrix Size (N).');
            return;
        }
        computeAndPlotWishart(size, df, binCount);
    } else if (type === 'wigner') {
        computeAndPlotWigner(size, binCount);
    }
});

// Function to compute and plot Wigner matrix eigenvalues
function computeAndPlotWigner(size, binCount) {
    showLoader(true);
    setTimeout(function() {
        let matrix = generateWignerMatrix(size);
        let eigenvalues = computeEigenvalues(matrix);
        plotWignerEigenvalues(eigenvalues, size, binCount);
        displayStatistics(eigenvalues);
        showLoader(false);
    }, 50);
}

function computeAndPlotWishart(size, df, binCount) {
    showLoader(true);
    setTimeout(function() {
        let matrix = generateWishartMatrix(size, df);
        let eigenvalues = computeEigenvalues(matrix);
        plotWishartEigenvalues(eigenvalues, size, df, binCount);
        displayStatistics(eigenvalues);
        showLoader(false);
    }, 50);
}

// Function to show or hide loader
function showLoader(show) {
    let loader = document.getElementById('loader');
    if (show) {
        loader.style.display = 'block';
    } else {
        loader.style.display = 'none';
    }
}

function generateWignerMatrix(size) {
    let matrix = [];
    let stdDev = 1 / Math.sqrt(size);
    for (let i = 0; i < size; i++) {
        matrix[i] = [];
        for (let j = 0; j <= i; j++) {
            let value = randomNormal(0, stdDev);
            matrix[i][j] = value;
            if (i !== j) {
                matrix[j][i] = value;
            }
        }
    }
    return matrix;
}

// Standard Normal variate using Box-Muller transform.
function randomNormal(mean=0, stdev=1) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}

function generateWishartMatrix(size, df) {
    let X = [];
    for (let i = 0; i < size; i++) {
        X[i] = [];
        for (let j = 0; j < df; j++) {
            X[i][j] = randomNormal(0, 1);
        }
    }
    // Compute X * X^T
    let Xt = math.transpose(X);
    let W = math.multiply(X, Xt);
    return W;
}

function generateGOEMatrix(size) {
    let matrix = [];
    for (let i = 0; i < size; i++) {
        matrix[i] = [];
        for (let j = 0; j <= i; j++) {
            let value = randomNormal(0, 1 / Math.sqrt(2));
            matrix[i][j] = value;
            if (i !== j) {
                matrix[j][i] = value;
            }
        }
    }
    return matrix;
}

function generateGUEMatrix(size) {
    let matrix = [];
    for (let i = 0; i < size; i++) {
        matrix[i] = [];
        for (let j = 0; j < size; j++) {
            let realPart = randomNormal(0, 1 / Math.sqrt(2));
            let imagPart = randomNormal(0, 1 / Math.sqrt(2));
            matrix[i][j] = math.complex(realPart, imagPart);
        }
    }
    // Ensure Hermitian by taking (M + M†)/2
    let matrixHermitian = math.divide(math.add(matrix, math.conj(math.transpose(matrix))), 2);
    return matrixHermitian;
}

function computeEigenvalues(matrix) {
    let eig = numeric.eig(matrix);
    let eigenvalues = eig.lambda.x; // Real parts of eigenvalues
    return eigenvalues;
}

function plotWignerEigenvalues(eigenvalues, size, binCount) {
    // Histogram trace
    let traceHist = {
        x: eigenvalues,
        type: 'histogram',
        histnorm: 'probability density',
        xbins: {
            start: Math.min(...eigenvalues),
            end: Math.max(...eigenvalues),
            size: (Math.max(...eigenvalues) - Math.min(...eigenvalues)) / binCount,
        },
        marker: {
            color: 'rgba(100, 200, 102, 0.7)',
        },
        name: 'Empirical Distribution',
    };

    // Semi-circle law trace
    let R = 2;
    let xValues = numeric.linspace(-R, R, 200);
    let yValues = xValues.map(x => semicircleDensity(x, R));

    let traceSemicircle = {
        x: xValues,
        y: yValues,
        mode: 'lines',
        line: { color: 'red', width: 2 },
        name: 'Semi-Circle Law',
    };

    let layout = {
        title: `Eigenvalue Distribution vs. Semi-Circle Law (Wigner Matrix, N=${size})`,
        xaxis: { title: 'Eigenvalue' },
        yaxis: { title: 'Probability Density' },
    };

    Plotly.newPlot('eigenvalue-distribution', [traceHist, traceSemicircle], layout);
}

 // Semi-circle density function
 function semicircleDensity(x, R) {
    if (Math.abs(x) > R) return 0;
    return (2 / (Math.PI * R * R)) * Math.sqrt(R * R - x * x);
}

function plotWishartEigenvalues(eigenvalues, size, df, binCount) {
    // Histogram trace
    let traceHist = {
        x: eigenvalues,
        type: 'histogram',
        histnorm: 'probability density',
        xbins: {
            start: Math.min(...eigenvalues),
            end: Math.max(...eigenvalues),
            size: (Math.max(...eigenvalues) - Math.min(...eigenvalues)) / binCount,
        },
        marker: {
            color: 'rgba(0, 0, 255, 0.7)',
        },
        name: 'Empirical Distribution',
    };

    // Marchenko-Pastur law trace
    let c = size / df;
    let lambdaMin = (1 - Math.sqrt(c)) ** 2;
    let lambdaMax = (1 + Math.sqrt(c)) ** 2;
    let xValues = numeric.linspace(lambdaMin, lambdaMax, 200);
    let yValues = xValues.map(x => marchenkoPasturDensity(x, c));

    let traceMP = {
        x: xValues,
        y: yValues,
        mode: 'lines',
        line: { color: 'red', width: 2 },
        name: 'Marchenko-Pastur Law',
    };

    let layout = {
        title: `Eigenvalue Distribution vs. Marchenko-Pastur Law (Wishart Matrix, N=${size}, p=${df})`,
        xaxis: { title: 'Eigenvalue' },
        yaxis: { title: 'Probability Density' },
    };

    Plotly.newPlot('eigenvalue-distribution', [traceHist, traceMP], layout);
}

function marchenkoPasturDensity(x, c) {
    let lambdaMin = (1 - Math.sqrt(c)) ** 2;
    let lambdaMax = (1 + Math.sqrt(c)) ** 2;
    if (x < lambdaMin || x > lambdaMax) return 0;
    return (1 / (2 * Math.PI * c * x)) * Math.sqrt((lambdaMax - x) * (x - lambdaMin));
}

// Function to display statistics
function displayStatistics(eigenvalues) {
    let mean = math.mean(eigenvalues);
    let std = math.std(eigenvalues);
    let variance = math.variance(eigenvalues);
    let statsHTML = `
        <h3>Eigenvalue Statistics</h3>
        <p>Mean: ${mean.toFixed(4)}</p>
        <p>Standard Deviation: ${std.toFixed(4)}</p>
        <p>Variance: ${variance.toFixed(4)}</p>
    `;
    document.getElementById('statistics').innerHTML = statsHTML;
}

// Function to show or hide loader
function showLoader(show) {
    let loader = document.getElementById('loader');
    if (show) {
        loader.style.display = 'block';
    } else {
        loader.style.display = 'none';
    }
}