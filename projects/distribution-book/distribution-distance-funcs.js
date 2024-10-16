// Function to generate parameter inputs based on distribution type
function generateParams(dist, paramsDivId) {
    let paramsDiv = document.getElementById(paramsDivId);
    paramsDiv.innerHTML = '';
    if (dist === 'normal') {
        paramsDiv.innerHTML += 'Mean (μ): <input type="number" id="' + paramsDivId + '_mean" value="0"><br>';
        paramsDiv.innerHTML += 'Standard Deviation (σ): <input type="number" id="' + paramsDivId + '_std" value="1" min="0.0001"><br>';
    } else if (dist === 'exponential') {
        paramsDiv.innerHTML += 'Rate (λ): <input type="number" id="' + paramsDivId + '_lambda" value="1" min="0.0001"><br>';
    } else if (dist === 'uniform') {
        paramsDiv.innerHTML += 'Minimum (a): <input type="number" id="' + paramsDivId + '_min" value="0"><br>';
        paramsDiv.innerHTML += 'Maximum (b): <input type="number" id="' + paramsDivId + '_max" value="1"><br>';
    } else if (dist === 'binomial') {
        paramsDiv.innerHTML += 'Number of Trials (n): <input type="number" id="' + paramsDivId + '_n" value="10" min="1"><br>';
        paramsDiv.innerHTML += 'Probability of Success (p): <input type="number" id="' + paramsDivId + '_p" value="0.5" min="0" max="1" step="0.01"><br>';
    } else if (dist === 'poisson') {
        paramsDiv.innerHTML += 'Rate (λ): <input type="number" id="' + paramsDivId + '_lambda" value="5" min="0.0001"><br>';
    } else if (dist === 'beta') {
        paramsDiv.innerHTML += 'Alpha (α): <input type="number" id="' + paramsDivId + '_alpha" value="2" min="0.0001"><br>';
        paramsDiv.innerHTML += 'Beta (β): <input type="number" id="' + paramsDivId + '_beta" value="5" min="0.0001"><br>';
    } else if (dist === 'gamma') {
        paramsDiv.innerHTML += 'Shape (k): <input type="number" id="' + paramsDivId + '_k" value="2" min="0.0001"><br>';
        paramsDiv.innerHTML += 'Scale (θ): <input type="number" id="' + paramsDivId + '_theta" value="2" min="0.0001"><br>';
    }
}

// Initial parameter inputs
generateParams('normal', 'params1');
generateParams('normal', 'params2');

// Update parameter inputs when distribution selection changes
document.getElementById('dist1').addEventListener('change', function() {
    generateParams(this.value, 'params1');
});

document.getElementById('dist2').addEventListener('change', function() {
    generateParams(this.value, 'params2');
});

function computePDF(dist, params, x) {
    let y = [];
    if (dist === 'normal') {
        let mean = parseFloat(params.mean);
        let std = parseFloat(params.std);
        for (let i = 0; i < x.length; i++) {
            y.push(jStat.normal.pdf(x[i], mean, std));
        }
    } else if (dist === 'exponential') {
        let lambda = parseFloat(params.lambda);
        for (let i = 0; i < x.length; i++) {
            y.push(jStat.exponential.pdf(x[i], lambda));
        }
    } else if (dist === 'uniform') {
        let min = parseFloat(params.min);
        let max = parseFloat(params.max);
        for (let i = 0; i < x.length; i++) {
            y.push(jStat.uniform.pdf(x[i], min, max));
        }
    } else if (dist === 'binomial') {
        let n = parseInt(params.n);
        let p = parseFloat(params.p);
        for (let i = 0; i < x.length; i++) {
            let xi = Math.round(x[i]);
            y.push(jStat.binomial.pdf(xi, n, p));
        }
    } else if (dist === 'poisson') {
        let lambda = parseFloat(params.lambda);
        for (let i = 0; i < x.length; i++) {
            let xi = Math.round(x[i]);
            y.push(jStat.poisson.pdf(xi, lambda));
        }
    } else if (dist === 'beta') {
        let alpha = parseFloat(params.alpha);
        let beta = parseFloat(params.beta);
        for (let i = 0; i < x.length; i++) {
            y.push(jStat.beta.pdf(x[i], alpha, beta));
        }
    } else if (dist === 'gamma') {
        let k = parseFloat(params.k);
        let theta = parseFloat(params.theta);
        for (let i = 0; i < x.length; i++) {
            y.push(jStat.gamma.pdf(x[i], k, theta));
        }
    }
    return y;
}

// Function to update the plot
function updatePlot() {
    // Get distributions and parameters
    let dist1 = document.getElementById('dist1').value;
    let dist2 = document.getElementById('dist2').value;

    let params1 = {};
    let params2 = {};

    // Get parameters for Distribution 1
    if (dist1 === 'normal') {
        params1.mean = document.getElementById('params1_mean').value;
        params1.std = document.getElementById('params1_std').value;
    } else if (dist1 === 'exponential') {
        params1.lambda = document.getElementById('params1_lambda').value;
    } else if (dist1 === 'uniform') {
        params1.min = document.getElementById('params1_min').value;
        params1.max = document.getElementById('params1_max').value;
    } else if (dist1 === 'binomial') {
        params1.n = document.getElementById('params1_n').value;
        params1.p = document.getElementById('params1_p').value;
    } else if (dist1 === 'poisson') {
        params1.lambda = document.getElementById('params1_lambda').value;
    } else if (dist1 === 'beta') {
        params1.alpha = document.getElementById('params1_alpha').value;
        params1.beta = document.getElementById('params1_beta').value;
    } else if (dist1 === 'gamma') {
        params1.k = document.getElementById('params1_k').value;
        params1.theta = document.getElementById('params1_theta').value;
    }

    // Get parameters for Distribution 2
    if (dist2 === 'normal') {
        params2.mean = document.getElementById('params2_mean').value;
        params2.std = document.getElementById('params2_std').value;
    } else if (dist2 === 'exponential') {
        params2.lambda = document.getElementById('params2_lambda').value;
    } else if (dist2 === 'uniform') {
        params2.min = document.getElementById('params2_min').value;
        params2.max = document.getElementById('params2_max').value;
    } else if (dist2 === 'binomial') {
        params2.n = document.getElementById('params2_n').value;
        params2.p = document.getElementById('params2_p').value;
    } else if (dist2 === 'poisson') {
        params2.lambda = document.getElementById('params2_lambda').value;
    } else if (dist2 === 'beta') {
        params2.alpha = document.getElementById('params2_alpha').value;
        params2.beta = document.getElementById('params2_beta').value;
    } else if (dist2 === 'gamma') {
        params2.k = document.getElementById('params2_k').value;
        params2.theta = document.getElementById('params2_theta').value;
    }

    // Validate parameters
    try {
        validateParameters(dist1, params1, 'Distribution 1');
        validateParameters(dist2, params2, 'Distribution 2');
    } catch (error) {
        alert(error);
        return;
    }
            // Get x-axis bounds for plotting
            let xMinPlot = parseFloat(document.getElementById('x_min').value);
            let xMaxPlot = parseFloat(document.getElementById('x_max').value);

            if (xMinPlot >= xMaxPlot) {
                alert('X-Axis Minimum must be less than X-Axis Maximum.');
                return;
            }

    // Generate x values for plotting
    let xPlot = [];
    let numPointsPlot = 1000;
    let stepPlot = (xMaxPlot - xMinPlot) / numPointsPlot;
    for (let i = 0; i <= numPointsPlot; i++) {
        xPlot.push(xMinPlot + i * stepPlot);
    }


    // Compute PDFs for plotting
    let y1Plot = computePDF(dist1, params1, xPlot);
    let y2Plot = computePDF(dist2, params2, xPlot);

    // Plotting with fill
    let trace1 = {
        x: xPlot,
        y: y1Plot,
        mode: 'lines',
        name: 'Distribution 1',
        line: { color: color1 },
        fill: 'tozeroy',
        opacity: 0.5
    };

    let trace2 = {
        x: xPlot,
        y: y2Plot,
        mode: 'lines',
        name: 'Distribution 2',
        line: { color: color2 },
        fill: 'tozeroy',
        opacity: 0.5
    };

    let data = [trace1, trace2];

    let layout = {
        title: 'Probability Distribution Comparison',
        xaxis: { title: 'x', range: [xMinPlot, xMaxPlot] },
        yaxis: { title: 'Probability Density' },
        // Disable drag mode
        dragmode: false,
        showlegend:false,
    };

    // Disable zoom feature
    let config = {
        staticPlot: true
    };

    Plotly.newPlot('plot', data, layout, config);

    // Calculate divergence measures over a wider range
    calculateDivergence(dist1, params1, dist2, params2);


    Plotly.newPlot('plot', data, layout,config);

    // Calculate divergence measures
    calculateDivergence(dist1, params1, dist2, params2);
    }
    

// Function to adjust xMin and xMax based on distributions
function adjustXMin(dist, params, currentMin) {
    let xMin = currentMin;
    if (dist === 'exponential' || dist === 'gamma' || dist === 'beta' || dist === 'poisson' || dist === 'binomial') {
        xMin = 0;
    }
    if (dist === 'uniform') {
        xMin = Math.min(xMin, parseFloat(params.min) - 1);
    }
    return xMin;
}

function adjustXMax(dist, params, currentMax) {
    let xMax = currentMax;
    if (dist === 'uniform') {
        xMax = Math.max(xMax, parseFloat(params.max) + 1);
    }
    if (dist === 'binomial') {
        xMax = Math.max(xMax, parseInt(params.n) + 1);
    }
    return xMax;
}

// Function to validate parameters
function validateParameters(dist, params, distName) {
    if (dist === 'normal') {
        if (params.std <= 0) {
            throw distName + ': Standard deviation (σ) must be positive.';
        }
    } else if (dist === 'exponential') {
        if (params.lambda <= 0) {
            throw distName + ': Rate (λ) must be positive.';
        }
    } else if (dist === 'uniform') {
        if (parseFloat(params.min) >= parseFloat(params.max)) {
            throw distName + ': Minimum (a) must be less than Maximum (b).';
        }
    } else if (dist === 'binomial') {
        if (parseInt(params.n) <= 0 || !Number.isInteger(parseFloat(params.n))) {
            throw distName + ': Number of trials (n) must be a positive integer.';
        }
        if (params.p < 0 || params.p > 1) {
            throw distName + ': Probability of success (p) must be between 0 and 1.';
        }
    } else if (dist === 'poisson') {
        if (params.lambda <= 0) {
            throw distName + ': Rate (λ) must be positive.';
        }
    } else if (dist === 'beta') {
        if (params.alpha <= 0 || params.beta <= 0) {
            throw distName + ': Alpha (α) and Beta (β) must be positive.';
        }
    } else if (dist === 'gamma') {
        if (params.k <= 0 || params.theta <= 0) {
            throw distName + ': Shape (k) and Scale (θ) must be positive.';
        }
    }
}

function calculateDivergence(dist1, params1, dist2, params2) {
    // Determine x-range for divergence calculations
    let xRange1 = getXRangeForDistribution(dist1, params1);
    let xRange2 = getXRangeForDistribution(dist2, params2);

    // Merge x-ranges
    let xMinDiv = Math.min(xRange1.min, xRange2.min);
    let xMaxDiv = Math.max(xRange1.max, xRange2.max);

    // Generate x values for divergence calculations
    let numPointsDiv = 5000; // Increased number of points for accuracy
    let xDiv = [];
    let stepDiv = (xMaxDiv - xMinDiv) / numPointsDiv;
    for (let i = 0; i <= numPointsDiv; i++) {
        xDiv.push(xMinDiv + i * stepDiv);
    }

    // Compute PDFs over the divergence x-range
    let p = computePDF(dist1, params1, xDiv);
    let q = computePDF(dist2, params2, xDiv);

    // Normalize PDFs
    let sumP = p.reduce((a, b) => a + b) * stepDiv;
    let sumQ = q.reduce((a, b) => a + b) * stepDiv;

    p = p.map(y => y / sumP);
    q = q.map(y => y / sumQ);

    // Calculate divergence measures
    let klDiv = 0;
    let jsDiv = 0;
    let tvDist = 0;
    let m = [];
    for (let i = 0; i < p.length; i++) {
        m.push(0.5 * (p[i] + q[i]));
    }

    for (let i = 0; i < p.length; i++) {
        if (p[i] > 0 && q[i] > 0) {
            klDiv += p[i] * Math.log(p[i] / q[i]) * stepDiv;
        } else if (p[i] > 0 && q[i] === 0) {
            klDiv += p[i] * Math.log(p[i] / Number.EPSILON) * stepDiv;
        }
        tvDist += Math.abs(p[i] - q[i]) * stepDiv / 2;
    }

    for (let i = 0; i < p.length; i++) {
        if (p[i] > 0) {
            jsDiv += p[i] * Math.log(p[i] / m[i]) * stepDiv;
        }
        if (q[i] > 0) {
            jsDiv += q[i] * Math.log(q[i] / m[i]) * stepDiv;
        }
    }
    jsDiv = 0.5 * jsDiv;

    // Display divergence measures
    let div = document.getElementById('divergence');
    div.innerHTML = '<h3>Divergence Measures</h3>';
    div.innerHTML += 'Kullback-Leibler Divergence (P || Q): ' + klDiv.toFixed(4) + '<br>';
    div.innerHTML += 'Jensen-Shannon Divergence: ' + jsDiv.toFixed(4) + '<br>';
    div.innerHTML += 'Total Variation Distance: ' + tvDist.toFixed(4) + '<br>';
}

function getXRangeForDistribution(dist, params) {
    let xMin, xMax;
    if (dist === 'normal') {
        let mean = parseFloat(params.mean);
        let std = parseFloat(params.std);
        xMin = mean - 5 * std;
        xMax = mean + 5 * std;
    } else if (dist === 'exponential') {
        xMin = 0;
        xMax = 1 / parseFloat(params.lambda) * 10;
    } else if (dist === 'uniform') {
        xMin = parseFloat(params.min);
        xMax = parseFloat(params.max);
    } else if (dist === 'binomial') {
        xMin = 0;
        xMax = parseInt(params.n);
    } else if (dist === 'poisson') {
        xMin = 0;
        xMax = parseFloat(params.lambda) * 5;
    } else if (dist === 'beta') {
        xMin = 0;
        xMax = 1;
    } else if (dist === 'gamma') {
        xMin = 0;
        xMax = parseFloat(params.k) * parseFloat(params.theta) * 5;
    }
    return { min: xMin, max: xMax };
}

// Initial plot
updatePlot();