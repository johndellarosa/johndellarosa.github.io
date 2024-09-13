// Arrays to store x, y, and labels for the points
let pointsX = [];
let pointsY = [];
let labels = [];
// Learning rate and number of iterations for gradient descent
const learningRate = 0.01;
const numIterations = 1000;

// Initial coefficients (starting at 0 for simplicity)
let beta0 = 0;
let beta1 = 0;
let beta2 = 0;

// Sigmoid function
function sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
}

// Logistic regression function using gradient descent
function fitLogisticRegression() {
    // Initialize coefficients
    beta0 = 0;
    beta1 = 0;
    beta2 = 0;

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
            let prediction = sigmoid(z);

            let error = prediction - y;
            gradientBeta0 += error;
            gradientBeta1 += error * x1;
            gradientBeta2 += error * x2;
        }

        // Update coefficients
        beta0 -= learningRate * gradientBeta0;
        beta1 -= learningRate * gradientBeta1;
        beta2 -= learningRate * gradientBeta2;
    }

    console.log("Fitted Coefficients: ", beta0, beta1, beta2);
    generateHeatmap();
    updateEquations();  // Call to update equations after fitting
}

// Function to update the equations and display them with LaTeX
function updateEquations() {
    const logisticEquation = `z = ${beta0.toFixed(2)} + ${beta1.toFixed(2)} x_1 + ${beta2.toFixed(2)} x_2`;
    const probabilityEquation = `P(y=1 | x_1, x_2) = \\frac{1}{1 + e^{-(${beta0.toFixed(2)} + ${beta1.toFixed(2)} x_1 + ${beta2.toFixed(2)} x_2)}}`;

    // Update the equation containers
    document.getElementById('logistic-equation').textContent = `\\[ ${logisticEquation} \\]`;
    document.getElementById('probability-equation').textContent = `\\[ ${probabilityEquation} \\]`;

    // Trigger MathJax to re-render the LaTeX
    MathJax.typeset();
}


function generateHeatmap() {
    const xGrid = [];
    const yGrid = [];
    const zGrid = [];

    const gridSize = 50;  // Number of grid points for each axis
    const xRange = [-10, 10];
    const yRange = [-10, 10];
    const xStep = (xRange[1] - xRange[0]) / gridSize;
    const yStep = (yRange[1] - yRange[0]) / gridSize;

    // for (let i = 0; i <= gridSize; i++) {
    //     let xVal = xRange[0] + i * xStep;
    //     let zRow = [];

    //     for (let j = 0; j <= gridSize; j++) {
    //         let yVal = yRange[0] + j * yStep;

    //         // Calculate the z value using the fitted logistic regression equation
    //         let z = beta0 + beta1 * xVal + beta2 * yVal;
    //         // Apply the sigmoid function to get the probability
    //         let probability = sigmoid(z);

    //         // Push x, y, and corresponding probability
    //         // xGrid.push(xVal);
    //         // yGrid.push(yVal);
    //         zRow.push(probability);
    //     }

    //     zGrid.push(zRow);
    // }

    // Loop through Feature 2 (y2) values for vertical axis
    for (let j = 0; j <= gridSize; j++) {
        let yVal = yRange[0] + j * yStep;  // x2 (Feature 2)

        let zRow = [];  // Row of probabilities for each x1 (Feature 1)

        // Loop through Feature 1 (x1) values for horizontal axis
        for (let i = 0; i <= gridSize; i++) {
            let xVal = xRange[0] + i * xStep;  // x1 (Feature 1)

            // Calculate the logistic regression equation: z = beta0 + beta1 * x1 + beta2 * x2
            let z = beta0 + beta1 * xVal + beta2 * yVal;
            let probability = sigmoid(z);  // Apply sigmoid to get probability

            // Fill the probability into the current row
            zRow.push(probability);
        }

        zGrid.push(zRow);  // Add the row of probabilities to the grid
    }

    const heatmapData = {
        x: Array.from({ length: gridSize + 1 }, (_, i) => xRange[0] + i * xStep),
        y: Array.from({ length: gridSize + 1 }, (_, i) => yRange[0] + i * yStep),
        z: zGrid,
        type: 'heatmap',
        colorscale: 'Viridis',
        showscale: true
    };

    const scatterData = {
        x: pointsX,
        y: pointsY,
        mode: 'markers',
        type: 'scatter',
        marker: {
            color: labels,
            colorscale: [[0, 'blue'], [1, 'red']],
            size: 10,
            showscale: false
        }
    };

    // Update the plot with the new heatmap and scatter points
    Plotly.newPlot('plot', [heatmapData, scatterData], {
        title: 'Logistic Regression Heatmap',
        xaxis: { range: [-10, 10], title: 'Feature 1' },
        yaxis: { range: [-10, 10], title: 'Feature 2' },
        showlegend: false
    });
}


// Initial empty plot
const plotData = {
    x: pointsX,
    y: pointsY,
    mode: 'markers',
    type: 'scatter',
    marker: {
        color: labels,
        colorscale: [[0, 'blue'], [1, 'red']], // Blue for 0, Red for 1
        size: 10,
        showscale: false
    }
};

const layout = {
    title: 'Interactive Logistic Regression Plot',
    xaxis: { range: [-10, 10], title: 'Feature 1' },
    yaxis: { range: [-10, 10], title: 'Feature 2' },
    showlegend: false
};


// Function to update the plot with new data
function updatePlot() {
    Plotly.restyle('plot', {
        x: [pointsX],
        y: [pointsY],
        marker: {
            color: labels,
            colorscale: [[0, 'blue'], [1, 'red']],
            size: 10
        }
    });
}

// Function to add a point manually through input fields
function addManualPoint() {
    // Get values from the input fields
    let feature1 = parseFloat(document.getElementById('feature1').value);
    let feature2 = parseFloat(document.getElementById('feature2').value);
    let labelVal = parseInt(document.getElementById('manualLabel').value);

    // Check if values are valid
    if (!isNaN(feature1) && !isNaN(feature2)) {
        // Add the new point
        pointsX.push(feature1);
        pointsY.push(feature2);
        labels.push(labelVal);

        // Update the plot with the new points
        updatePlot();

        // Clear the input fields after submission
        document.getElementById('feature1').value = '';
        document.getElementById('feature2').value = '';
    } else {
        alert("Please enter valid values for both features.");
    }
}

// Function to clear all points
function clearPoints() {
    pointsX = [];
    pointsY = [];
    labels = [];
    updatePlot();
}

// Fit logistic regression when user clicks the "Fit Model" button
function fitModel() {
    if (pointsX.length > 0) {
        fitLogisticRegression();
    } else {
        alert("Please add some points first!");
    }
}

document.addEventListener('DOMContentLoaded', () => {

// Create the initial plot
Plotly.newPlot('plot', [plotData], layout);

// Function to handle plot clicks and add points
document.getElementById('plot').on('plotly_click', function(data){
    let xVal = data.points[0].x;
    let yVal = data.points[0].y;
    let labelVal = parseInt(document.getElementById('label').value);

    // Add the new point from plot click
    pointsX.push(xVal);
    pointsY.push(yVal);
    labels.push(labelVal);

    // Update the plot with the new points
    updatePlot();
});

// Function to handle plot clicks and add points
document.getElementById('plot').on('plotly_click', function(data){
    let xVal = data.points[0].x;
    let yVal = data.points[0].y;
    let labelVal = parseInt(document.getElementById('label').value);

    // Add the new point
    pointsX.push(xVal);
    pointsY.push(yVal);
    labels.push(labelVal);

    // Update the plot with the new points
    updatePlot();
});
});