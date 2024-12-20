// Arrays to store x, y, and labels for the points
let pointsX = [];
let pointsY = [];
let labels = [];
const isMobile = window.matchMedia("only screen and (max-width: 767px)").matches;

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
    calculateROC();
    updateThreshold();
}

// Function to update the equations and display them with LaTeX
function updateEquations() {
    const logisticEquation = `z = \\log(\\frac{p}{1-p}) = ${beta0.toFixed(2)} + ${beta1.toFixed(2)} x_1 + ${beta2.toFixed(2)} x_2`;
    const probabilityEquation = `P(y=1 | x_1, x_2) = \\frac{1}{1 + \\exp\\left(-(${beta0.toFixed(2)} + ${beta1.toFixed(2)} x_1 + ${beta2.toFixed(2)} x_2)\\right)}`;

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

    const gridSize = 500;  // Number of grid points for each axis
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

    const fadedRdBu = [
        [0, 'rgba(110, 164, 214, 0.3)'],  // Soft blue (transparent)
        [0.1, 'rgba(135, 180, 220, 0.4)'],  // Slightly lighter blue
        [0.2, 'rgba(175, 200, 230, 0.4)'],  // Even lighter blue
        [0.3, 'rgba(210, 220, 240, 0.5)'],  // Faded blue/white mix
        [0.4, 'rgba(230, 230, 240, 0.5)'],  // Faded white/blue
        [0.5, 'rgba(245, 245, 245, 0.5)'],  // Neutral white
        [0.6, 'rgba(240, 220, 230, 0.5)'],  // Faded white/pink
        [0.7, 'rgba(230, 180, 190, 0.4)'],  // Light pink/red mix
        [0.8, 'rgba(220, 140, 140, 0.4)'],  // Soft red/pink
        [0.9, 'rgba(210, 110, 110, 0.4)'],  // Softer red
        [1, 'rgba(200, 80, 80, 0.3)']  // Soft red (transparent)
    ];

    const heatmapData = {
        x: Array.from({ length: gridSize + 1 }, (_, i) => xRange[0] + i * xStep),
        y: Array.from({ length: gridSize + 1 }, (_, i) => yRange[0] + i * yStep),
        z: zGrid,
        type: 'heatmap',
        colorscale: fadedRdBu,
        showscale: true,
        colorbar: {
            title:"Prob Red",
            thickness: isMobile? 7.5:10,  // Reduce the thickness of the colorbar
            orientation: isMobile? 'h':'v',  // Change orientation to horizontal if needed
        }
    };

    if (window.innerWidth < 500) {
        console.log(window.innerWidth);
        heatmapData.colorbar.thickness = 7.5;  // Further reduce colorbar on mobile
        heatmapData.colorbar.orientation = 'h';
    }

    const scatterData = {
        x: pointsX,
        y: pointsY,
        mode: 'markers',
        type: 'scatter',
        marker: {
            color: labels,
            colorscale: [[0, '#007FFF'], [1, '#E62020']],
            size: 10,
            showscale:false,
            line: {
                width:2,
                color:labels,
                colorscale: [[0, '#0039a6'], [1, '#8B0000']]
            }
        }
    };

    // Update the plot with the new heatmap and scatter points
    Plotly.newPlot('plot', [heatmapData, scatterData], layout);
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
    // title: 'Interactive Logistic Regression Plot',
    xaxis: { range: [-10, 10], title: 'Feature 1' },
    yaxis: { range: [-10, 10], title: 'Feature 2' },
    showlegend: false,
    responsive: true,
    dragmode: 'pan',  // Disable zooming on click
    autosize: true,
    margin: {
        t: 40,  // Reduce top margin (space for title)
        l: 50,  // Left margin
        r: 10,  // Right margin
        b: 40   // Bottom margin
    },
    scrollZoom:false,
    displayModeBar: false
};


// Function to update the plot with new data
function updatePlot() {
    Plotly.restyle('plot', {
        x: [pointsX],
        y: [pointsY],
        marker: {
            color: labels,
            colorscale: [[0, '#007FFF'], [1, '#E62020']],
            size: 10,
            line: {
                width:2,
                color:labels,
                colorscale: [[0, '#0039a6'], [1, '#8B0000']]
            }
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

    fitLogisticRegression();
    // updateEquations();  // Call to update equations after fitting
    calculateROC();

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

function plotDecisionBoundary() {
    const boundaryX = [];
    const boundaryY = [];

    const xRange = [-10, 10];
    const yRange = [-10, 10];
    const step = 0.1;  // Finer steps for smooth boundary

    for (let x1 = xRange[0]; x1 <= xRange[1]; x1 += step) {
        // Solve for x2 when P(y = 1) = 0.5 (z = 0)
        let x2 = -(beta0 + beta1 * x1) / beta2;  // Set z = 0

        if (x2 >= yRange[0] && x2 <= yRange[1]) {
            boundaryX.push(x1);
            boundaryY.push(x2);
        }
    }

    const boundaryData = {
        x: boundaryX,
        y: boundaryY,
        mode: 'lines',
        type: 'scatter',
        line: { color: 'black', width: 2 }
    };

    Plotly.addTraces('plot', [boundaryData]);  // Add to the existing plot
}

function calculateAccuracy() {
    const trainSize = Math.floor(0.7 * pointsX.length);
    const trainX = pointsX.slice(0, trainSize);
    const trainY = pointsY.slice(0, trainSize);
    const trainLabels = labels.slice(0, trainSize);

    const testX = pointsX.slice(trainSize);
    const testY = pointsY.slice(trainSize);
    const testLabels = labels.slice(trainSize);

    // Fit the model on training data
    fitLogisticRegression(trainX, trainY, trainLabels);

    // Test model on test data
    let correctPredictions = 0;
    for (let i = 0; i < testX.length; i++) {
        let z = beta0 + beta1 * testX[i] + beta2 * testY[i];
        let prediction = sigmoid(z) >= 0.5 ? 1 : 0;
        if (prediction === testLabels[i]) correctPredictions++;
    }

    let accuracy = (correctPredictions / testX.length) * 100;
    console.log(`Model Accuracy: ${accuracy.toFixed(2)}%`);
}

function updateThreshold() {
    const threshold = parseFloat(document.getElementById('thresholdSlider').value);
    document.getElementById('thresholdValue').textContent = threshold;

    // Arrays to store marker symbols (correct vs incorrect predictions) and colors (true labels)
    const markerSymbols = [];  // Circle for correct, X for incorrect
    const markerColors = [];  // Keep true label color (red for y=1, blue for y=0)
    const markerLineWidths = [];  // To adjust outline widths

    let tp = 0, fp = 0, tn = 0, fn = 0;  // Initialize confusion matrix counters


    for (let i = 0; i < pointsX.length; i++) {
        let z = beta0 + beta1 * pointsX[i] + beta2 * pointsY[i];
        let predictedLabel = sigmoid(z) >= threshold ? 1 : 0;

        // Set marker symbol: 'circle' for correct prediction, 'x' for incorrect
        markerSymbols.push(predictedLabel === labels[i] ? 'circle' : 'x');

        // // Keep the color based on the true label
        // markerColors.push(labels[i] === 1 ? 'red' : 'blue');




        // Update confusion matrix counts
        if (predictedLabel === 1 && labels[i] === 1) {
            tp++;  // True Positive
        } else if (predictedLabel === 1 && labels[i] === 0) {
            fp++;  // False Positive
        } else if (predictedLabel === 0 && labels[i] === 0) {
            tn++;  // True Negative
        } else if (predictedLabel === 0 && labels[i] === 1) {
            fn++;  // False Negative
        }
    }

    // Update the scatter plot with new marker symbols and colors
    Plotly.restyle('plot', {
        'marker.symbol': [markerSymbols],  // Circle or X based on correctness
        // 'marker.color': [markerColors],  // Keep true label color
        'marker.size': [10],  // Adjust size for visibility
        // 'marker.line.width': [1],  // Glow for misclassified points
    });

    // Update the confusion matrix display
    updateConfusionMatrix(tp, fp, tn, fn);
}


function calculateROC() {
    const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);  // 0 to 1 in steps of 0.01
    const tpr = [];  // True positive rate (TP / (TP + FN))
    const fpr = [];  // False positive rate (FP / (FP + TN))

    for (let threshold of thresholds) {
        let tp = 0, fp = 0, tn = 0, fn = 0;

        for (let i = 0; i < pointsX.length; i++) {
            let z = beta0 + beta1 * pointsX[i] + beta2 * pointsY[i];
            let prediction = sigmoid(z) >= threshold ? 1 : 0;  // Predicted label based on the threshold

            if (prediction === 1 && labels[i] === 1) tp++;  // True positive
            if (prediction === 1 && labels[i] === 0) fp++;  // False positive
            if (prediction === 0 && labels[i] === 0) tn++;  // True negative
            if (prediction === 0 && labels[i] === 1) fn++;  // False negative
        }

        // Calculate TPR and FPR for the current threshold
        const tprValue = tp / (tp + fn);
        const fprValue = fp / (fp + tn);

        tpr.push(tprValue);
        fpr.push(fprValue);
    }

    // Prepare data for the ROC curve plot
    const rocData = {
        x: fpr,
        y: tpr,
        mode: 'lines',
        type: 'scatter',
        line: { color: 'blue' },
        name: 'ROC Curve'
    };

    // Plot the ROC curve using Plotly
    Plotly.newPlot('rocPlot', [rocData], {
        title: 'ROC Curve',
        xaxis: { title: 'False Positive Rate (FPR)', range: [0, 1] },
        yaxis: { title: 'True Positive Rate (TPR)', range: [0, 1] },
        showlegend: false,
        responsive: true,
        autosize: true,
        width: document.getElementById('rocplotContainer').clientWidth  // Restrict width to the container
    });
}


// function updateConfusionMatrix() {
//     let tp = 0, fp = 0, tn = 0, fn = 0;
//     for (let i = 0; i < pointsX.length; i++) {
//         let z = beta0 + beta1 * pointsX[i] + beta2 * pointsY[i];
//         let prediction = sigmoid(z) >= 0.5 ? 1 : 0;

//         if (prediction === 1 && labels[i] === 1) tp++;
//         if (prediction === 1 && labels[i] === 0) fp++;
//         if (prediction === 0 && labels[i] === 0) tn++;
//         if (prediction === 0 && labels[i] === 1) fn++;
//     }

//     document.getElementById('tn').textContent = tn;
//     document.getElementById('fp').textContent = fp;
//     document.getElementById('tp').textContent = tp;
//     document.getElementById('fn').textContent = fn;
// }
function updateConfusionMatrix(tp, fp, tn, fn) {
    document.getElementById('tp').textContent = tp;
    document.getElementById('fp').textContent = fp;
    document.getElementById('tn').textContent = tn;
    document.getElementById('fn').textContent = fn;
    const auc = calculateAUC();
        // Calculate Accuracy
        const total = tp + fp + tn + fn;
        const accuracy = ((tp + tn) / total) * 100;
    
        // Calculate Precision (avoid division by zero)
        const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
    
        // Calculate Recall (Sensitivity) (avoid division by zero)
        const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
    
        // Calculate F1-Score (harmonic mean of precision and recall)
        const f1score = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    
        // Update the accuracy metrics in the UI
        document.getElementById('accuracy').textContent = accuracy.toFixed(2) + '%';
        document.getElementById('precision').textContent = precision.toFixed(3);
        document.getElementById('recall').textContent = recall.toFixed(3);
        document.getElementById('f1score').textContent = f1score.toFixed(3);
        document.getElementById('auc').textContent = auc.toFixed(3);  // Display AUC
    }

function calculateAUC() {
    const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);  // Thresholds from 0 to 1
    const tpr = [];  // True positive rate
    const fpr = [];  // False positive rate

    for (let threshold of thresholds) {
        let tp = 0, fp = 0, tn = 0, fn = 0;

        for (let i = 0; i < pointsX.length; i++) {
            let z = beta0 + beta1 * pointsX[i] + beta2 * pointsY[i];
            let predictedLabel = sigmoid(z) >= threshold ? 1 : 0;

            if (predictedLabel === 1 && labels[i] === 1) tp++;
            if (predictedLabel === 1 && labels[i] === 0) fp++;
            if (predictedLabel === 0 && labels[i] === 0) tn++;
            if (predictedLabel === 0 && labels[i] === 1) fn++;
        }

        // Calculate TPR and FPR for the current threshold
        const tprValue = tp / (tp + fn);  // True Positive Rate
        const fprValue = fp / (fp + tn);  // False Positive Rate

        tpr.push(tprValue);
        fpr.push(fprValue);
    }

    // Sort FPR and TPR in ascending order based on FPR
    let sorted = fpr.map((fprVal, index) => [fprVal, tpr[index]]);
    sorted.sort((a, b) => a[0] - b[0]);  // Sort by FPR

    // Extract sorted FPR and TPR values
    const sortedFPR = sorted.map(item => item[0]);
    const sortedTPR = sorted.map(item => item[1]);

    // Use trapezoidal rule to calculate AUC
    let auc = 0;
    for (let i = 1; i < sortedFPR.length; i++) {
        auc += (sortedFPR[i] - sortedFPR[i - 1]) * (sortedTPR[i] + sortedTPR[i - 1]) / 2;
    }

    return auc;  // Return the calculated AUC
}
    

function autogeneratePoints() {
    const numPoints = 30;  // Total number of points to generate
    const noiseLevel = 7;  // Wider spread (increased noise level)

    // Clear existing points
    pointsX = [];
    pointsY = [];
    labels = [];

    // Randomly pick centers for each label within [-3, 3] range
    const centerX0 = -3 + Math.random() * 6;  // Random center x for y = 0
    const centerY0 = -3 + Math.random() * 6;  // Random center y for y = 0
    const centerX1 = -3 + Math.random() * 6;  // Random center x for y = 1
    const centerY1 = -3 + Math.random() * 6;  // Random center y for y = 1

    // Generate points for y = 0 (around centerX0, centerY0)
    for (let i = 0; i < numPoints / 2; i++) {
        let x = centerX0 + (Math.random() - 0.5) * noiseLevel;  // Random point around centerX0
        let y = centerY0 + (Math.random() - 0.5) * noiseLevel;  // Random point around centerY0
        pointsX.push(x);
        pointsY.push(y);
        labels.push(0);  // Label 0 for this cluster
    }

    // Generate points for y = 1 (around centerX1, centerY1)
    for (let i = 0; i < numPoints / 2; i++) {
        let x = centerX1 + (Math.random() - 0.5) * noiseLevel;  // Random point around centerX1
        let y = centerY1 + (Math.random() - 0.5) * noiseLevel;  // Random point around centerY1
        pointsX.push(x);
        pointsY.push(y);
        labels.push(1);  // Label 1 for this cluster
    }

    // Update the plot with the new generated points
    fitLogisticRegression();
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
// Force Plotly to resize when the window is resized
window.addEventListener('resize', () => {
    Plotly.Plots.resize(document.getElementById('plot'));
    Plotly.Plots.resize(document.getElementById('rocPlot'));


});

document.getElementById('plot').addEventListener('contextmenu', (event) => event.preventDefault());

// Function to convert pixel coordinates to data coordinates
function convertPixelToDataCoords(event, plotElement) {
    const rect = plotElement.getBoundingClientRect();
    const xPixel = event.clientX - rect.left;
    const yPixel = event.clientY - rect.top;

    const xAxis = plotElement._fullLayout.xaxis;
    const yAxis = plotElement._fullLayout.yaxis;

    const xData = xAxis.p2l(xPixel);  // p2l: pixels to linear data
    const yData = yAxis.p2l(yPixel);

    return { xData, yData };
}

// Helper function to check if a click is inside the plotting area
function isInPlotArea(xPixel, yPixel, plotElement) {
    const layout = plotElement._fullLayout;
    const xAxis = layout.xaxis;
    const yAxis = layout.yaxis;

    // Get the pixel boundaries of the plotting area
    const xStart = xAxis._offset;
    const xEnd = xStart + xAxis._length;
    const yStart = yAxis._offset;
    const yEnd = yStart + yAxis._length;

    // Check if the click is within the plotting area boundaries
    return (xPixel >= xStart && xPixel <= xEnd && yPixel >= yStart && yPixel <= yEnd);
}

// Function to convert pixel coordinates to data coordinates
function convertPixelToDataCoords(event, plotElement) {
    const layout = plotElement._fullLayout;
    const xAxis = layout.xaxis;
    const yAxis = layout.yaxis;

    // Use event.layerX and event.layerY to get layer-specific coordinates
    const xPixel = event.layerX;
    const yPixel = event.layerY;

    // Convert pixel to data coordinates
    const xData = xAxis.p2l(xPixel);  // Convert x pixels to data
    const yData = yAxis.p2l(yPixel);  // Convert y pixels to data

    return { xData, yData };
}

// Handle left-click to add label 0 (blue)
document.getElementById('plot').addEventListener('click', function(event) {
    
    const plotElement = document.getElementById('plot');

    // Convert pixel coordinates to data coordinates using layerX/layerY
    const coords = convertPixelToDataCoords(event, plotElement);
    const x = coords.xData;
    const y = coords.yData;

    // Add the point with label 0 (left-click = blue)
    pointsX.push(x);
    pointsY.push(y);
    labels.push(0);  // Label 0 for left-click

    // Update the plot
    updatePlot();
});

// Handle right-click to add label 1 (red)
document.getElementById('plot').addEventListener('contextmenu', function(event) {
    event.preventDefault();  // Prevent default right-click context menu

    const plotElement = document.getElementById('plot');

    // Convert pixel coordinates to data coordinates using layerX/layerY
    const coords = convertPixelToDataCoords(event, plotElement);
    const x = coords.xData;
    const y = coords.yData;

    // Add the point with label 1 (right-click = red)
    pointsX.push(x);
    pointsY.push(y);
    labels.push(1);  // Label 1 for right-click

    // Update the plot
    updatePlot();
    // fitLogisticRegression();
});



});