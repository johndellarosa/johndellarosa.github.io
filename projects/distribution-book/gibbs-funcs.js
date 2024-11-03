// Event Listeners to Update Conditional Distribution Parameters
document.getElementById('condX').addEventListener('change', updateCondXParams);
document.getElementById('condY').addEventListener('change', updateCondYParams);
let thinnedSamplesX = [];
let thinnedSamplesY = [];
function updateCondXParams() {
    const condXType = document.getElementById('condX').value;
    const condXParamsDiv = document.getElementById('condXParams');
    condXParamsDiv.innerHTML = ''; // Clear previous parameters

    switch (condXType) {
        case 'normal':
            condXParamsDiv.innerHTML = `
                <label>Mean (μ):</label>
                <input type="text" id="condXMeanExpr" value="0.8 * y">
                <label>Std Dev (σ):</label>
                <input type="text" id="condXStdExpr" value="1">
                <p class="note">You can use expressions involving 'y'.</p>
            `;
            break;
        case 'uniform':
            condXParamsDiv.innerHTML = `
                <label>Min (a):</label>
                <input type="text" id="condXMinExpr" value="y - 1">
                <label>Max (b):</label>
                <input type="text" id="condXMaxExpr" value="y + 1">
                <p class="note">You can use expressions involving 'y'.</p>
            `;
            break;
        case 'exponential':
            condXParamsDiv.innerHTML = `
                <label>Rate (λ):</label>
                <input type="text" id="condXLambdaExpr" value="abs(y) + 1">
                <p class="note">You can use expressions involving 'y'.</p>
            `;
            break;
        case 'gamma':
            condXParamsDiv.innerHTML = `
                <label>Shape (k):</label>
                <input type="text" id="condXShapeExpr" value="abs(y) + 1">
                <label>Scale (θ):</label>
                <input type="text" id="condXScaleExpr" value="1">
                <p class="note">You can use expressions involving 'y'.</p>
            `;
            break;
        case 'beta':
            condXParamsDiv.innerHTML = `
                <label>Alpha (α):</label>
                <input type="text" id="condXAlphaExpr" value="abs(y) + 1">
                <label>Beta (β):</label>
                <input type="text" id="condXBetaExpr" value="abs(y) + 2">
                <p class="note">You can use expressions involving 'y'.</p>
            `;
            break;
        case 'poisson':
            condXParamsDiv.innerHTML = `
                <label>Lambda (λ):</label>
                <input type="text" id="condXLambdaExpr" value="abs(y) + 1">
                <p class="note">You can use expressions involving 'y'.</p>
            `;
            break;
    }
}

function updateCondYParams() {
    const condYType = document.getElementById('condY').value;
    const condYParamsDiv = document.getElementById('condYParams');
    condYParamsDiv.innerHTML = ''; // Clear previous parameters

    switch (condYType) {
        case 'normal':
            condYParamsDiv.innerHTML = `
                <label>Mean (μ):</label>
                <input type="text" id="condYMeanExpr" value="0.8 * x">
                <label>Std Dev (σ):</label>
                <input type="text" id="condYStdExpr" value="1">
                <p class="note">You can use expressions involving 'x'.</p>
            `;
            break;
        case 'uniform':
            condYParamsDiv.innerHTML = `
                <label>Min (a):</label>
                <input type="text" id="condYMinExpr" value="x - 1">
                <label>Max (b):</label>
                <input type="text" id="condYMaxExpr" value="x + 1">
                <p class="note">You can use expressions involving 'x'.</p>
            `;
            break;
        case 'exponential':
            condYParamsDiv.innerHTML = `
                <label>Rate (λ):</label>
                <input type="text" id="condYLambdaExpr" value="abs(x) + 1">
                <p class="note">You can use expressions involving 'x'.</p>
            `;
            break;
        case 'gamma':
            condYParamsDiv.innerHTML = `
                <label>Shape (k):</label>
                <input type="text" id="condYShapeExpr" value="abs(x) + 1">
                <label>Scale (θ):</label>
                <input type="text" id="condYScaleExpr" value="1">
                <p class="note">You can use expressions involving 'x'.</p>
            `;
            break;
        case 'beta':
            condYParamsDiv.innerHTML = `
                <label>Alpha (α):</label>
                <input type="text" id="condYAlphaExpr" value="abs(x) + 1">
                <label>Beta (β):</label>
                <input type="text" id="condYBetaExpr" value="abs(x) + 2">
                <p class="note">You can use expressions involving 'x'.</p>
            `;
            break;
        case 'poisson':
            condYParamsDiv.innerHTML = `
                <label>Lambda (λ):</label>
                <input type="text" id="condYLambdaExpr" value="abs(x) + 1">
                <p class="note">You can use expressions involving 'x'.</p>
            `;
            break;
    }
}

// Initialize parameter input fields
updateCondXParams();
updateCondYParams();

// Function to evaluate expressions safely
function evaluateExpression(expr, scope) {
    try {
        const code = math.compile(expr);
        return code.evaluate(scope);
    } catch (error) {
        console.error(`Error evaluating expression: ${expr}`, error);
        return NaN;
    }
}

// Sampling functions with parameter expressions
function sampleConditionalX(y, type, params) {
    let evaluatedParams = {};

    switch (type) {
        case "normal":
            evaluatedParams.mean = evaluateExpression(params.meanExpr, { y });
            evaluatedParams.std = evaluateExpression(params.stdExpr, { y });
            if (isNaN(evaluatedParams.mean) || isNaN(evaluatedParams.std) || evaluatedParams.std <= 0) {
                console.error('Invalid parameters for Normal distribution in sampleConditionalX.');
                return NaN;
            }
            return jStat.normal.sample(evaluatedParams.mean, evaluatedParams.std);
        case "uniform":
            evaluatedParams.min = evaluateExpression(params.minExpr, { y });
            evaluatedParams.max = evaluateExpression(params.maxExpr, { y });
            if (isNaN(evaluatedParams.min) || isNaN(evaluatedParams.max) || evaluatedParams.min >= evaluatedParams.max) {
                console.error('Invalid parameters for Uniform distribution in sampleConditionalX.');
                return NaN;
            }
            return jStat.uniform.sample(evaluatedParams.min, evaluatedParams.max);
        case "exponential":
            evaluatedParams.lambda = evaluateExpression(params.lambdaExpr, { y });
            if (isNaN(evaluatedParams.lambda) || evaluatedParams.lambda <= 0) {
                console.error('Invalid parameter for Exponential distribution in sampleConditionalX.');
                return NaN;
            }
            return jStat.exponential.sample(evaluatedParams.lambda);
        case "gamma":
            evaluatedParams.shape = evaluateExpression(params.shapeExpr, { y });
            evaluatedParams.scale = evaluateExpression(params.scaleExpr, { y });
            if (
                isNaN(evaluatedParams.shape) || evaluatedParams.shape <= 0 ||
                isNaN(evaluatedParams.scale) || evaluatedParams.scale <= 0
            ) {
                console.error('Invalid parameters for Gamma distribution in sampleConditionalX.');
                return NaN;
            }
            return jStat.gamma.sample(evaluatedParams.shape, evaluatedParams.scale);
        case "beta":
            evaluatedParams.alpha = evaluateExpression(params.alphaExpr, { y });
            evaluatedParams.beta = evaluateExpression(params.betaExpr, { y });
            if (
                isNaN(evaluatedParams.alpha) || evaluatedParams.alpha <= 0 ||
                isNaN(evaluatedParams.beta) || evaluatedParams.beta <= 0
            ) {
                console.error('Invalid parameters for Beta distribution in sampleConditionalX.');
                return NaN;
            }
            return jStat.beta.sample(evaluatedParams.alpha, evaluatedParams.beta);
        case "poisson":
            evaluatedParams.lambda = evaluateExpression(params.lambdaExpr, { y });
            if (isNaN(evaluatedParams.lambda) || evaluatedParams.lambda <= 0) {
                console.error('Invalid parameter for Poisson distribution in sampleConditionalX.');
                return NaN;
            }
            return jStat.poisson.sample(evaluatedParams.lambda);
        default:
            return NaN;
    }
}

function sampleConditionalY(x, type, params) {
    let evaluatedParams = {};

    switch (type) {
        case "normal":
            evaluatedParams.mean = evaluateExpression(params.meanExpr, { x });
            evaluatedParams.std = evaluateExpression(params.stdExpr, { x });
            if (isNaN(evaluatedParams.mean) || isNaN(evaluatedParams.std) || evaluatedParams.std <= 0) {
                console.error('Invalid parameters for Normal distribution in sampleConditionalY.');
                return NaN;
            }
            return jStat.normal.sample(evaluatedParams.mean, evaluatedParams.std);
        case "uniform":
            evaluatedParams.min = evaluateExpression(params.minExpr, { x });
            evaluatedParams.max = evaluateExpression(params.maxExpr, { x });
            if (isNaN(evaluatedParams.min) || isNaN(evaluatedParams.max) || evaluatedParams.min >= evaluatedParams.max) {
                console.error('Invalid parameters for Uniform distribution in sampleConditionalY.');
                return NaN;
            }
            return jStat.uniform.sample(evaluatedParams.min, evaluatedParams.max);
        case "exponential":
            evaluatedParams.lambda = evaluateExpression(params.lambdaExpr, { x });
            if (isNaN(evaluatedParams.lambda) || evaluatedParams.lambda <= 0) {
                console.error('Invalid parameter for Exponential distribution in sampleConditionalY.');
                return NaN;
            }
            return jStat.exponential.sample(evaluatedParams.lambda);
        case "gamma":
            evaluatedParams.shape = evaluateExpression(params.shapeExpr, { x });
            evaluatedParams.scale = evaluateExpression(params.scaleExpr, { x });
            if (
                isNaN(evaluatedParams.shape) || evaluatedParams.shape <= 0 ||
                isNaN(evaluatedParams.scale) || evaluatedParams.scale <= 0
            ) {
                console.error('Invalid parameters for Gamma distribution in sampleConditionalY.');
                return NaN;
            }
            return jStat.gamma.sample(evaluatedParams.shape, evaluatedParams.scale);
        case "beta":
            evaluatedParams.alpha = evaluateExpression(params.alphaExpr, { x });
            evaluatedParams.beta = evaluateExpression(params.betaExpr, { x });
            if (
                isNaN(evaluatedParams.alpha) || evaluatedParams.alpha <= 0 ||
                isNaN(evaluatedParams.beta) || evaluatedParams.beta <= 0
            ) {
                console.error('Invalid parameters for Beta distribution in sampleConditionalY.');
                return NaN;
            }
            return jStat.beta.sample(evaluatedParams.alpha, evaluatedParams.beta);
        case "poisson":
            evaluatedParams.lambda = evaluateExpression(params.lambdaExpr, { x });
            if (isNaN(evaluatedParams.lambda) || evaluatedParams.lambda <= 0) {
                console.error('Invalid parameter for Poisson distribution in sampleConditionalY.');
                return NaN;
            }
            return jStat.poisson.sample(evaluatedParams.lambda);
        default:
            return NaN;
    }
}

// Gibbs Sampling Function
function gibbsSampling(numIterations, x0, y0, condXType, condYType, condXParams, condYParams) {
    const samplesX = [];
    const samplesY = [];
    let x = x0;
    let y = y0;

    for (let t = 0; t < numIterations; t++) {
        x = sampleConditionalX(y, condXType, condXParams);
        if (isNaN(x)) {
            console.error(`Sampling x failed at iteration ${t}.`);
            break;
        }
        samplesX.push(x);

        y = sampleConditionalY(x, condYType, condYParams);
        if (isNaN(y)) {
            console.error(`Sampling y failed at iteration ${t}.`);
            break;
        }
        samplesY.push(y);
    }

    return { samplesX, samplesY };
}

// Function to run Gibbs Sampling and plot the results
function runGibbsSampling(numIterations, x0, y0, burnIn, thin, condXType, condYType, condXParams, condYParams) {
    // Clear previous plots
    Plotly.purge('scatterplot');
    Plotly.purge('traceplot');
    let isMobile = window.matchMedia("only screen and (max-width: 767px)").matches;
  
    const result = gibbsSampling(numIterations, x0, y0, condXType, condYType, condXParams, condYParams);
    let { samplesX, samplesY } = result;

        // Apply Burn-in and Thinning
        thinnedSamplesX = samplesX.slice(burnIn).filter((_, i) => i % thin === 0);
        thinnedSamplesY = samplesY.slice(burnIn).filter((_, i) => i % thin === 0);
    
        // 2D Scatter Plot
        const scatterTrace = {
            x: thinnedSamplesX,
            y: thinnedSamplesY,
            mode: 'markers',
            marker: {
                color: 'rgba(100, 150, 200, 0.7)',
                size: isMobile? 4:6,
            },
            name: 'Sampled Points'
        };
    
        const scatterLayout = {
            title: {

                text:'2D Scatter Plot of Sampled Values (X vs Y)',
                font:{
                    size:12,
                }
            },
            xaxis: { title: 'X', autorange: true },
            yaxis: { title: 'Y', autorange: true },
            hovermode: 'closest',
            autosize:true,
            margin:{
              l:isMobile? 50:70,
              r:isMobile? 20:40,
            },
        };
    
        Plotly.newPlot('scatterplot', [scatterTrace], scatterLayout, { responsive: true });
    
        // 2D Trace Plot
        const tracePlotTrace = {
            x: thinnedSamplesX,
            y: thinnedSamplesY,
            mode: 'lines+markers',
            line: { width:isMobile?.25:2,
                color: 'rgb(31, 119, 180)' },
            marker: { size: isMobile? 3:6,
                 color: 'rgb(255, 127, 14)' },
            name: 'Trace of Sampling Sequence'
        };
    
        const tracePlotLayout = {
            title: {text:'2D Trace Plot of Sampling Sequence',
                font:{
                    size:12,
                }
            },
            xaxis: { title: 'X', autorange: true },
            yaxis: { title: 'Y', autorange: true },
            hovermode: 'closest',
            autosize:true,
            margin:{
              l:isMobile? 50:70,
              r:isMobile? 20:40,
            },
        };
    
        Plotly.newPlot('traceplot', [tracePlotTrace], tracePlotLayout, { responsive: true });
    }

// Event Listener for the Run Button
document.getElementById('runButton').addEventListener('click', () => {
    const numIterations = parseInt(document.getElementById('iterations').value);
    const x0 = parseFloat(document.getElementById('x0').value);
    const y0 = parseFloat(document.getElementById('y0').value);
    const burnIn = parseInt(document.getElementById('burnIn').value);
    const thin = parseInt(document.getElementById('thin').value);
    const condXType = document.getElementById('condX').value;
    const condYType = document.getElementById('condY').value;

    // Get parameters for conditional distributions
    const condXParams = getCondXParams();
    const condYParams = getCondYParams();

    runGibbsSampling(numIterations, x0, y0, burnIn, thin, condXType, condYType, condXParams, condYParams);
});

function getCondXParams() {
    const condXType = document.getElementById('condX').value;
    const params = {};

    switch (condXType) {
        case 'normal':
            params.meanExpr = document.getElementById('condXMeanExpr').value;
            params.stdExpr = document.getElementById('condXStdExpr').value;
            break;
        case 'uniform':
            params.minExpr = document.getElementById('condXMinExpr').value;
            params.maxExpr = document.getElementById('condXMaxExpr').value;
            break;
        case 'exponential':
            params.lambdaExpr = document.getElementById('condXLambdaExpr').value;
            break;
        case 'gamma':
            params.shapeExpr = document.getElementById('condXShapeExpr').value;
            params.scaleExpr = document.getElementById('condXScaleExpr').value;
            break;
        case 'beta':
            params.alphaExpr = document.getElementById('condXAlphaExpr').value;
            params.betaExpr = document.getElementById('condXBetaExpr').value;
            break;
        case 'poisson':
            params.lambdaExpr = document.getElementById('condXLambdaExpr').value;
            break;
    }
    return params;
}

function getCondYParams() {
    const condYType = document.getElementById('condY').value;
    const params = {};

    switch (condYType) {
        case 'normal':
            params.meanExpr = document.getElementById('condYMeanExpr').value;
            params.stdExpr = document.getElementById('condYStdExpr').value;
            break;
        case 'uniform':
            params.minExpr = document.getElementById('condYMinExpr').value;
            params.maxExpr = document.getElementById('condYMaxExpr').value;
            break;
        case 'exponential':
            params.lambdaExpr = document.getElementById('condYLambdaExpr').value;
            break;
        case 'gamma':
            params.shapeExpr = document.getElementById('condYShapeExpr').value;
            params.scaleExpr = document.getElementById('condYScaleExpr').value;
            break;
        case 'beta':
            params.alphaExpr = document.getElementById('condYAlphaExpr').value;
            params.betaExpr = document.getElementById('condYBetaExpr').value;
            break;
        case 'poisson':
            params.lambdaExpr = document.getElementById('condYLambdaExpr').value;
            break;
    }
    return params;
}
// Event Listener for the Export Button
document.getElementById('exportButton').addEventListener('click', exportDataAsCSV);

// Function to Export Data as CSV
function exportDataAsCSV() {
    if (thinnedSamplesX.length === 0 || thinnedSamplesY.length === 0) {
        alert('No data available to export. Please run the Gibbs sampler first.');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,X,Y\n";
    for (let i = 0; i < thinnedSamplesX.length; i++) {
        csvContent += `${thinnedSamplesX[i]},${thinnedSamplesY[i]}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
    link.setAttribute("download", `gibbs_sampling_data_${timestamp}.csv`);
    document.body.appendChild(link); // Required for Firefox

    link.click();

    document.body.removeChild(link);
}
// Initialize with default parameters
document.getElementById('runButton').click();
