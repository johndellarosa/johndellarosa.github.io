// Arrays to store x, y, and labels for the points (counts)
let pointsX = [];
let pointsY = [];
let labels = [];
const isMobile = window.matchMedia("only screen and (max-width: 767px)").matches;

const plotTypeSelect = document.getElementById('plotType');

// Adjusted learning rate for stability
const learningRate = 0.000001;  // Decreased learning rate
const numIterations = 5000;

// Initial coefficients (small random values)
let beta0 = Math.random() * 0.01;
let beta1 = Math.random() * 0.01;
let beta2 = Math.random() * 0.01;

// Function to compute lambda = exp(z)
function computeLambda(z) {
    return Math.exp(z);
}

// Poisson regression function using gradient descent
function fitPoissonRegression() {
    // Regularization strength
    const regularizationStrength = 0.0000001;  // Increased regularization

    // Perform gradient descent
    for (let iter = 0; iter < numIterations; iter++) {
        let gradientBeta0 = 0;
        let gradientBeta1 = 0;
        let gradientBeta2 = 0;

        // Calculate gradients
        for (let i = 0; i < pointsX.length; i++) {
            let x1 = pointsX[i];
            let x2 = pointsY[i];
            let y = labels[i];

            let z = beta0 + beta1 * x1 + beta2 * x2;

            // Clip z to prevent overflow/underflow
            z = Math.max(Math.min(z, 50), -50);  // z ∈ [-20, 20]

            let lambda = computeLambda(z);

            let error = lambda - y; // Gradient of NLL with respect to beta

            gradientBeta0 += error;
            gradientBeta1 += error * x1;
            gradientBeta2 += error * x2;
        }

        // Add regularization terms to the gradients
        gradientBeta0 += regularizationStrength * beta0;
        gradientBeta1 += regularizationStrength * beta1;
        gradientBeta2 += regularizationStrength * beta2;

        // Gradient clipping
        const maxGradient = 10000;
        gradientBeta0 = Math.max(Math.min(gradientBeta0, maxGradient), -maxGradient);
        gradientBeta1 = Math.max(Math.min(gradientBeta1, maxGradient), -maxGradient);
        gradientBeta2 = Math.max(Math.min(gradientBeta2, maxGradient), -maxGradient);

        // Update coefficients
        beta0 -= learningRate * gradientBeta0;
        beta1 -= learningRate * gradientBeta1;
        beta2 -= learningRate * gradientBeta2;

        // Coefficient clipping
        const maxCoeff = 100;
        beta0 = Math.max(Math.min(beta0, maxCoeff), -maxCoeff);
        beta1 = Math.max(Math.min(beta1, maxCoeff), -maxCoeff);
        beta2 = Math.max(Math.min(beta2, maxCoeff), -maxCoeff);

        // Check for NaN or Infinite values
        if (!isFinite(beta0) || !isFinite(beta1) || !isFinite(beta2)) {
            console.error("Coefficients became NaN or Infinity at iteration ", iter);
            break;
        }
    }

    console.log("Fitted Coefficients: ", beta0, beta1, beta2);
    updatePlot();      // Update the plot after fitting
    updateEquations(); // Update equations after fitting
}

// Function to update the equations and display them with LaTeX
function updateEquations() {
    const poissonEquation = `\\log(\\lambda) = ${beta0.toFixed(4)} + (${beta1.toFixed(4)}) x_1 + (${beta2.toFixed(4)}) x_2`;
    const lambdaEquation = `\\lambda = \\exp\\left(${beta0.toFixed(4)} + (${beta1.toFixed(4)}) x_1 + (${beta2.toFixed(4)}) x_2\\right)`;

    // Update the equation containers
    document.getElementById('poisson-equation').textContent = `\\[ ${poissonEquation} \\]`;
    document.getElementById('lambda-equation').textContent = `\\[ ${lambdaEquation} \\]`;

    // Trigger MathJax to re-render the LaTeX
    MathJax.typesetPromise();
}

// Function to generate heatmap data
function generateHeatmapData(plotType) {
    const gridSize = 100;  // Reduced grid size for performance
    const xRange = [-10, 10];
    const yRange = [-10, 10];
    const xStep = (xRange[1] - xRange[0]) / gridSize;
    const yStep = (yRange[1] - yRange[0]) / gridSize;

    const xValues = [];
    const yValues = [];
    const zValues = [];

    // Loop through y (vertical axis)
    for (let j = 0; j <= gridSize; j++) {
        let yVal = yRange[0] + j * yStep;
        let zRow = [];

        // Loop through x (horizontal axis)
        for (let i = 0; i <= gridSize; i++) {
            let xVal = xRange[0] + i * xStep;
            let z = beta0 + beta1 * xVal + beta2 * yVal;
            z = Math.max(Math.min(z, 50), -50);  // Clip z

            let lambda = computeLambda(z);

            zRow.push(lambda);

            // Store x and y values only once
            if (j === 0) {
                xValues.push(xVal);
            }
        }

        zValues.push(zRow);
        yValues.push(yVal);
    }

    const heatmapData = {
        x: xValues,
        y: yValues,
        z: zValues,
        type: plotType, // Use the selected plot type
        colorscale: 'Cividis',
        showscale: true,
        opacity: 0.6,
        colorbar: {
            thickness: isMobile ? 5 : 10,
            orientation: 'h',
            title: 'Lambda',
        }
    };

    if (plotType === 'surface') {
        // Adjust properties specific to surface plots if needed
        heatmapData.contours = {
            z: {
                show: true,
                usecolormap: true,
                highlightcolor: "#42f462",
                project: { z: true }
            }
        };
        heatmapData.opacity = 1; // Surface plots don't support opacity
    }

    return heatmapData;
}


// Function to generate scatter plot data
function generateScatterData(plotType) {
    const scatterData = {
        x: pointsX,
        y: pointsY,
        mode: 'markers+text',
        marker: {
            size: 10,
            color: labels,
            colorscale: 'Viridis',
            showscale: !isMobile,
            colorbar: {
                title: 'Counts',
                //display: false,//isMobile ? false : true,
            },
            showlegend:false,
            line: {
                color: '#000000',
                width: 1,
            },
        },
        text: labels.map(String),
        textposition: 'top center',
        textfont: {
            size: 10,
            color: '#333333',
        },
        hovertemplate: 'Count: %{text}<extra></extra>',
    };

    if (plotType === 'surface') {
        scatterData.type = 'scatter3d';
        scatterData.z = labels.map(() => 0); // Place points at z=0
        scatterData.textposition = 'top center';
    } else {
        scatterData.type = 'scatter';
    }

    return scatterData;
}


function updatePlot() {
    const plotType = plotTypeSelect.value; // Get the selected plot type
    const data = [generateHeatmapData(plotType), generateScatterData(plotType)];

    let updatedLayout = { ...layout };

    if (plotType === 'surface') {
        updatedLayout.scene = {
            xaxis: { title: 'Feature 1' },
            yaxis: { title: 'Feature 2' },
            zaxis: { title: 'Lambda' },
        };
        // Remove 2D axes from layout
        delete updatedLayout.xaxis;
        delete updatedLayout.yaxis;
    }

    Plotly.react('plot', data, updatedLayout);
}


// Initial empty plot
const layout = {
    title: 'Poisson Regression Visualization',
    xaxis: {
        range: [-10, 10],
        title: 'Feature 1',
        gridcolor: '#e1e1e1',
    },
    yaxis: {
        range: [-10, 10],
        title: 'Feature 2',
        gridcolor: '#e1e1e1',
    },
    plot_bgcolor: '#f9f9f9',
    showlegend: false,
    responsive: true,
    dragmode: 'pan',
    autosize: true,
    margin: {
        t: 50,
        l: 60,
        r: 10,
        b: 50,
    },
    scrollZoom: false,
    displayModeBar: false,
};

// Function to generate Poisson random numbers
function poissonRandom(lambda) {
    let L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
        k++;
        p *= Math.random();
    } while (p > L && k < 5000);  // Limit k to prevent infinite loops
    return k - 1;
}

// Function to autogenerate points for Poisson regression
function autogeneratePoints() {
    const numPoints = 75;  // Total number of points to generate

    // Clear existing points
    pointsX = [];
    pointsY = [];
    labels = [];

    // Reset coefficients
    beta0 = Math.random() * 0.01;
    beta1 = Math.random() * 0.01;
    beta2 = Math.random() * 0.01;

    // Generate random coefficients for data generation
    const true_beta0 = (Math.random() - 0.5) * 1.0;  // Random between -1 and 1
    const true_beta1 = (Math.random() - 0.5) * 0.5;
    const true_beta2 = (Math.random() - 0.5) * 0.5;

    // Generate random x1 and x2 values within a reasonable range
    for (let i = 0; i < numPoints; i++) {
        let x1 = Math.random() * 15 - 7.5;  // Random x1 in range [-5, 5]
        let x2 = Math.random() * 15 - 7.5;  // Random x2 in range [-5, 5]

        // Calculate z with added noise
        let z = true_beta0 + true_beta1 * x1 + true_beta2 * x2 + (Math.random() - 0.5) * 3.0; // Add noise

        // Clip z to prevent lambda from being too large
        z = Math.max(Math.min(z, 50), -50);  // z ∈ [-5, 5]

        let lambda = computeLambda(z);

        // Generate y_i from Poisson(lambda)
        let y = poissonRandom(lambda);

        // Store the data
        pointsX.push(x1);
        pointsY.push(x2);  // Corrected from y2 to x2
        labels.push(y);
    }

    // Update the plot with the new generated points
    fitPoissonRegression();
}

// Function to add a point manually through input fields
function addManualPoint() {
    // Get values from the input fields
    let feature1 = parseFloat(document.getElementById('feature1').value);
    let feature2 = parseFloat(document.getElementById('feature2').value);
    let countVal = parseInt(document.getElementById('manualLabel').value);

    // Check if values are valid
    if (!isNaN(feature1) && !isNaN(feature2) && !isNaN(countVal) && countVal >= 0) {
        // Add the new point
        pointsX.push(feature1);
        pointsY.push(feature2);
        labels.push(countVal);

        // Update the plot with the new points
        updatePlot();

        // Clear the input fields after submission
        document.getElementById('feature1').value = '';
        document.getElementById('feature2').value = '';
        document.getElementById('manualLabel').value = '';

        // Re-fit the model with the new data
        fitPoissonRegression();
    } else {
        alert("Please enter valid values for features and count (non-negative integer).");
    }
}

// Function to clear all points
function clearPoints() {
    pointsX = [];
    pointsY = [];
    labels = [];

    // Reset coefficients
    beta0 = Math.random() * 0.01;
    beta1 = Math.random() * 0.01;
    beta2 = Math.random() * 0.01;

    // Update the plot and equations
    updatePlot();
    updateEquations();
}

// Event listener for DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create the initial plot
    Plotly.newPlot('plot', [], layout);

    // Force Plotly to resize when the window is resized
    window.addEventListener('resize', () => {
        Plotly.Plots.resize(document.getElementById('plot'));
    });

    // Autogenerate points on load
    autogeneratePoints();
});
