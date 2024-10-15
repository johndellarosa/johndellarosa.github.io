// script.js

document.addEventListener('DOMContentLoaded', function () {
    const distXSelect = document.getElementById('dist-x');
    const distYSelect = document.getElementById('dist-y');
    const paramsXDiv = document.getElementById('params-x');
    const paramsYDiv = document.getElementById('params-y');
    const sampleSizeInput = document.getElementById('sample-size');
    const correlationInput = document.getElementById('correlation');
    const generateBtn = document.getElementById('generate-btn');
    const runBtn = document.getElementById('run-btn');
    const manualInput = document.getElementById('manual-input');
    const tauValueSpan = document.getElementById('tau-value');

    // Color pickers
    const colorHoverInput = document.getElementById('color-hover');
    const colorConcordantInput = document.getElementById('color-concordant');
    const colorDiscordantInput = document.getElementById('color-discordant');
    const colorTiedInput = document.getElementById('color-tied');

    let dataX = [];
    let dataY = [];

    // Distribution parameter inputs
    const distParams = {
        uniform: [
            { name: 'Min', key: 'min', value: 0 },
            { name: 'Max', key: 'max', value: 1 }
        ],
        normal: [
            { name: 'Mean', key: 'mean', value: 0 },
            { name: 'Std Dev', key: 'std', value: 1 }
        ],
        exponential: [
            { name: 'Rate (λ)', key: 'lambda', value: 1 }
        ]
    };

    function createParamsInputs(dist, paramsDiv) {
        paramsDiv.innerHTML = '';
        distParams[dist].forEach(param => {
            const div = document.createElement('div');
            const label = document.createElement('label');
            label.textContent = `${param.name}:`;
            const input = document.createElement('input');
            input.type = 'number';
            input.value = param.value;
            input.id = `${paramsDiv.id}-${param.key}`;
            input.style.width = '150px';
            input.style.padding = '5px';
            div.appendChild(label);
            div.appendChild(input);
            paramsDiv.appendChild(div);
        });
    }

    function getParams(paramsDiv) {
        const inputs = paramsDiv.querySelectorAll('input');
        const params = {};
        inputs.forEach(input => {
            params[input.id.split('-').pop()] = parseFloat(input.value);
        });
        return params;
    }

    // Parse manual data input (from the textarea)
    function parseManualInput() {
        const inputText = manualInput.value.trim();
        const points = inputText.split(/\s+/); // Split by space
        const x = [];
        const y = [];
        for (const point of points) {
            const [xCoord, yCoord] = point.split(',').map(Number);
            if (!isNaN(xCoord) && !isNaN(yCoord)) {
                x.push(xCoord);
                y.push(yCoord);
            }
        }
        return { dataX: x, dataY: y };
    }

    function generateDataFromGaussianCopula(size, rho) {
        // Generate samples from a bivariate normal distribution with correlation rho
        const data = { u: [], v: [] };
        for (let i = 0; i < size; i++) {
            // Generate standard normal variates Z1 and Z2 with correlation rho
            let z1 = randn_bm();
            let z2 = randn_bm();
            z2 = rho * z1 + Math.sqrt(1 - rho * rho) * z2;
            // Convert to uniform [0,1] via CDF
            let u = 0.5 * (1 + erf(z1 / Math.sqrt(2)));
            let v = 0.5 * (1 + erf(z2 / Math.sqrt(2)));
            data.u.push(u);
            data.v.push(v);
        }
        return data;
    }

    function generateData(distX, paramsX, distY, paramsY, size, rho) {
        const copulaData = generateDataFromGaussianCopula(size, rho);
        const dataX = [];
        const dataY = [];

        // Transform uniform marginals to desired distributions
        for (let i = 0; i < size; i++) {
            let x, y;
            let u = copulaData.u[i];
            let v = copulaData.v[i];

            // Transform u to X using inverse CDF of distX
            if (distX === 'uniform') {
                const { min, max } = paramsX;
                x = min + u * (max - min);
            } else if (distX === 'normal') {
                const { mean, std } = paramsX;
                x = mean + std * Math.sqrt(2) * inverseErf(2 * u - 1);
            } else if (distX === 'exponential') {
                const { lambda } = paramsX;
                x = -Math.log(1 - u) / lambda;
            }

            // Transform v to Y using inverse CDF of distY
            if (distY === 'uniform') {
                const { min, max } = paramsY;
                y = min + v * (max - min);
            } else if (distY === 'normal') {
                const { mean, std } = paramsY;
                y = mean + std * Math.sqrt(2) * inverseErf(2 * v - 1);
            } else if (distY === 'exponential') {
                const { lambda } = paramsY;
                y = -Math.log(1 - v) / lambda;
            }

            const generatedPoints = dataX.map((x, i) => `${x.toFixed(2)},${dataY[i].toFixed(2)}`).join(' ');
            manualInput.value = generatedPoints;

            dataX.push(x);
            dataY.push(y);
        }
        return { dataX, dataY };
    }

    // Helper functions
    function randn_bm() {
        // Box-Muller transform
        let u = 0, v = 0;
        while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    function erf(x) {
        // Approximation of error function
        // Using Abramowitz and Stegun formula 7.1.26
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;

        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    function inverseErf(x) {
        // Approximation of inverse error function
        // Reference: Winitzki, Sergei. "A handy approximation for the error function and its inverse." arXiv preprint math/0805.1598 (2008).
        const a = 0.147;
        const ln1MinusXSqrd = Math.log(1 - x * x);
        const term1 = (2 / (Math.PI * a)) + ln1MinusXSqrd / 2;
        const term2 = ln1MinusXSqrd / a;
        const sqrtTerm = Math.sqrt(term1 * term1 - term2);
        return (x < 0 ? -1 : 1) * Math.sqrt(sqrtTerm - term1);
    }

    function calculateKendallsTau(x, y) {
        let n = x.length;
        let concordant = 0;
        let discordant = 0;

        for (let i = 0; i < n - 1; i++) {
            for (let j = i + 1; j < n; j++) {
                let xi = x[i], xj = x[j];
                let yi = y[i], yj = y[j];
                let sign = Math.sign((xi - xj) * (yi - yj));
                if (sign > 0) concordant++;
                else if (sign < 0) discordant++;
            }
        }
        return (concordant - discordant) / (0.5 * n * (n - 1));
    }

    function updatePlot(x, y) {
        const defaultColor = '#0000FF'; // Blue
        const trace = {
            x: x,
            y: y,
            mode: 'markers',
            type: 'scatter',
            marker: {
                color: defaultColor,
                size: 8
            },
            hoverinfo: 'x+y',
            customdata: Array.from({ length: x.length }, (_, i) => i)
        };
        const layout = {
            xaxis: { title: 'X' },
            yaxis: { title: 'Y' },
            title: "Scatter Plot of Generated Data (Click on Points)",
            dragmode: false // Disable zoom and pan
        };
        const config = {
            responsive: true,
            staticPlot: false, // Keep plot interactive
            displaylogo: false, // Remove the Plotly logo
            modeBarButtonsToRemove: ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
            doubleClick: false, // Disable double-click zoom reset
            scrollZoom: false, // Disable scroll wheel zooming
        };
        Plotly.newPlot('plot', [trace], layout, config).then(function () {
            const plotDiv = document.getElementById('plot');
            plotDiv.on('plotly_click', handleClick);
            plotDiv.on('plotly_clickannotation', handleUnclick); // Handle clicking outside points
        });
    }


    function runCalculation() {
        const data = parseManualInput();
        dataX = data.dataX;
        dataY = data.dataY;

        const tau = calculateKendallsTau(dataX, dataY);
        tauValueSpan.textContent = tau.toFixed(4);

        updatePlot(dataX, dataY);
    }

    function handleClick(eventData) {
        const pointIndex = eventData.points[0].pointIndex;
        const x0 = dataX[pointIndex];
        const y0 = dataY[pointIndex];

        // Get selected colors
        const colorHover = colorHoverInput.value;
        const colorConcordant = colorConcordantInput.value;
        const colorDiscordant = colorDiscordantInput.value;
        const colorTied = colorTiedInput.value;

        const colors = [];
        for (let i = 0; i < dataX.length; i++) {
            if (i === pointIndex) {
                colors.push(colorHover); // Highlight the clicked point
            } else {
                let xi = dataX[i];
                let yi = dataY[i];
                let sign = Math.sign((x0 - xi) * (y0 - yi));
                if (sign > 0) {
                    colors.push(colorConcordant); // Concordant
                } else if (sign < 0) {
                    colors.push(colorDiscordant); // Discordant
                } else {
                    colors.push(colorTied); // Tied
                }
            }
        }

        updatePointColors(colors);
    }

    function handleUnclick() {
        // Reset colors to default when clicking outside points
        const defaultColor = '#0000FF'; // Blue
        const colors = Array(dataX.length).fill(defaultColor);
        updatePointColors(colors);
    }

    function updatePointColors(colors) {
        Plotly.restyle('plot', 'marker.color', [colors]);
    }
    function generateAndPlot() {
        const distX = distXSelect.value;
        const distY = distYSelect.value;
        const paramsX = getParams(paramsXDiv);
        const paramsY = getParams(paramsYDiv);
        const sampleSize = parseInt(sampleSizeInput.value);
        let rho = parseFloat(correlationInput.value);
        if (rho < -1) rho = -1;
        if (rho > 1) rho = 1;

        const generatedData = generateData(distX, paramsX, distY, paramsY, sampleSize, rho);
        dataX = generatedData.dataX;
        dataY = generatedData.dataY;

        const tau = calculateKendallsTau(dataX, dataY);
        tauValueSpan.textContent = tau.toFixed(4);

        updatePlot(dataX, dataY);
    }

    // Initialize parameter inputs
    createParamsInputs(distXSelect.value, paramsXDiv);
    createParamsInputs(distYSelect.value, paramsYDiv);

    // Update parameter inputs when distribution changes
    distXSelect.addEventListener('change', function () {
        createParamsInputs(this.value, paramsXDiv);
    });

    distYSelect.addEventListener('change', function () {
        createParamsInputs(this.value, paramsYDiv);
    });

    generateBtn.addEventListener('click', function() {
        const distX = distXSelect.value;
        const distY = distYSelect.value;
        const paramsX = getParams(paramsXDiv);
        const paramsY = getParams(paramsYDiv);
        const sampleSize = parseInt(sampleSizeInput.value);
        let rho = parseFloat(correlationInput.value);
        if (rho < -1) rho = -1;
        if (rho > 1) rho = 1;
        const generatedData = generateData(distX, paramsX, distY, paramsY, sampleSize, rho);
        dataX = generatedData.dataX;
        dataY = generatedData.dataY;
    });

    runBtn.addEventListener('click', runCalculation);

    runCalculation();
});
