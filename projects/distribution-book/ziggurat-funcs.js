let totalSamples = 0;
let acceptedSamples = 0;
const normalizationConstant = 1 / Math.sqrt(2 * Math.PI);
const maxLayerHeight = 1;  // Height of the tallest layer (at x = 0)
let layers = 6;  // Default number of layers

// Target distribution: Standard normal PDF
function targetDistribution(x) {
    return Math.exp(-0.5 * x * x);  // Standard normal distribution
}

// Ziggurat layers data
let zigguratLayers = [];

// function find_x1(numLayers, targetArea) {
//     let x1 = 1.0;  // Initial guess for x1
//     const tol = 1e-6;  // Tolerance for stopping the iteration

//     let prevX1 = 0;
//     let maxVal = targetDistribution(0);  // PDF value at x = 0 for the normal distribution
//     while (Math.abs(x1 - prevX1) > tol) {
//         prevX1 = x1;
//         let totalArea = 0;

//         // Calculate the area for each layer based on the current x1
//         for (let i = 0; i < numLayers; i++) {
//             const height = Math.exp(-0.5 * prevX1 * prevX1);  // Normal distribution PDF: e^(-x^2 / 2)
//             const width = targetArea / height;  // Width to ensure constant area
//             totalArea += width * height;

//             // For the last layer (topmost), calculate x1 based on the current layer's width
//             if (i === numLayers - 1) {
//                 const newHeight = height * 0.9;  // Decrease the height for the top layer
//                 x1 = Math.sqrt(2 * Math.log(maxVal / newHeight));  // Solve for x1
//             }
//         }

//         // Adjust x1 based on the total area compared to the targetArea
//         if (totalArea > targetArea) {
//             x1 -= (totalArea - targetArea) / numLayers;  // Decrease x1 if the area is too large
//         } else {
//             x1 += (targetArea - totalArea) / numLayers;  // Increase x1 if the area is too small
//         }

//         // Ensure x1 is always positive
//         if (x1 <= 0) {
//             x1 = Math.abs(x1);  // Force positive value
//         }

//         // If x1 is still negative, exit to prevent invalid results
//         if (isNaN(x1) || x1 < 0) {
//             console.error("x1 is invalid, stopping iteration.");
//             break;
//         }
//     }

//     return x1;
// }



function precomputeZigguratLayers(numLayers) {
    zigguratLayers = [];
    
    // Maximum value of the standard normal distribution at x = 0
    let maxVal = targetDistribution(0);  // Max value of the distribution at x = 0
    
    // const totalArea = maxVal / numLayers;  // The area that each layer should cover
    const totalArea = 1/ numLayers;

    let x1 = 0;  // Starting width (for the first layer)
    let currX = x1;
    
    for (let i = 0; i < numLayers; i++) {
        // Calculate the height for the current layer
        const height =   Math.exp(-0.5 * currX * currX);  // Standard normal PDF: e^(-x^2 / 2)
        
        // Calculate next layer width using the Ziggurat relationship: z_{i+1} = sqrt(z_i^2 - 2A/h_{i+1})
        let term = currX * currX + (2 * totalArea) / height;
        
        if (term < 0) {
            console.warn("Negative value under the square root at layer", i, "adjusting to 0");
            term = 0;  // Set to 0 to avoid NaN
        }
        
        let nextX = Math.sqrt(term);
        // const height =  Math.exp(-0.5*nextX*nextX);
        // If we are at the last layer, set the width to 0
        // if (i === numLayers - 1) {
        //     nextX = 0;
        // }
        
        // Store the current layer (width and height)
        zigguratLayers.push({
            width: nextX,
            height: height
        });
        
        // Update the current X for the next iteration
        currX = nextX;
    }
    
    console.log(zigguratLayers);  // Output the layers for debugging
}




// Initialize Ziggurat with default number of layers
precomputeZigguratLayers(layers);

// Function to generate Ziggurat samples
function generateZigguratSample() {
    totalSamples++;

    // Select a random layer
    const layerIndex = Math.floor(Math.random() * layers);

    // If the selected layer is the last one (tail region), use tail sampling
    if (layerIndex === layers - 1) {
        const tailSample = sampleFromTail();  // Sample from the tail using rejection sampling
        addSampleToPlot(tailSample, 0, true);  // Plot the sample
        acceptedSamples++;
    } else {
        // Otherwise, generate random sample within the Ziggurat layer
        const layer = zigguratLayers[layerIndex];
        const randomX = (Math.random() - 0.5) * 2 * layer.width;  // X-value within [-width, width]
        const randomY = Math.random() * layer.height;  // Y-value within [0, height]

        // Check if sample is accepted (under the target PDF)
        if (randomY <= targetDistribution(randomX)) {
            acceptedSamples++;
            addSampleToPlot(randomX, randomY, true);  // Accepted sample
        } else {
            addSampleToPlot(randomX, randomY, false);  // Rejected sample
        }
    }

    // Update acceptance rate
    const acceptanceRate = (acceptedSamples / totalSamples) * 100;
    document.getElementById('acceptanceRate').innerText = acceptanceRate.toFixed(2);
}

function sampleFromTail() {
    let tailAccepted = false;
    let sample;

    while (!tailAccepted) {
        // Generate a sample from an exponential distribution for the tail
        const proposalSample = -Math.log(Math.random());  // Exponential sample
        
        // Rejection criterion: accept if below the normal distribution's tail
        const acceptanceProb = Math.exp(-0.5 * proposalSample * proposalSample);  // PDF for normal distribution
        if (Math.random() < acceptanceProb) {
            sample = proposalSample;
            tailAccepted = true;
        }
    }

    return sample;
}


// Function to add sample to plot (ensure it's added to the correct trace)
function addSampleToPlot(x, y, accepted) {
    const update = {
        x: [[x]],  // Append x-coordinate
        y: [[y]]   // Append y-coordinate
    };
    const traceIndex = accepted ? 1 : 2;  // Use the correct trace (1: accepted, 2: rejected)
    Plotly.extendTraces('plot', update, [traceIndex]);  // Extend the sample trace, not Ziggurat layers
}


// Plot traces for Ziggurat layers and samples
let stepTrace = {
    x: [],
    y: [],
    type: 'scatter',
    mode: 'lines+markers',
    fill: 'tozeroy',  // Fill under the line to give the step look
    line: { shape: 'hv', color: 'blue', width: 2 },  // Thicker outline
    marker: { size: 0 },  // No markers for the steps
    name: 'Ziggurat Layers'
};

let acceptedSampleTrace = {
    x: [],
    y: [],
    mode: 'markers',
    marker: { color: 'green', size: 8 },
    name: 'Accepted Samples'
};
let rejectedSampleTrace = {
    x: [],
    y: [],
    mode: 'markers',
    marker: { color: 'red', size: 8 },
    name: 'Rejected Samples'
};

// Plot layout
const layout = {
    title: 'Ziggurat Algorithm Step Plot',
    xaxis: { title: 'X',
        range:[-5,5],
     },
    yaxis: { title: 'Y' }
};

// Create a trace for the standard normal distribution
const normalX = [];
const normalY = [];
const numPoints = 100;  // Number of points for the normal distribution

for (let i = 0; i <= numPoints; i++) {
    const xVal = (i / numPoints) * (10 * 2) - 10;  // Range from -x1 to x1
    normalX.push(xVal);
    normalY.push(Math.exp(-0.5 * xVal * xVal));  // Standard normal PDF
}

// Add the standard normal distribution trace
const normalTrace = {
    x: normalX,
    y: normalY,
    type: 'scatter',
    mode: 'lines',
    line: { color: 'red', width: 2 },
    name: 'Standard Normal Distribution'
};


// Initial plot
Plotly.newPlot('plot', [normalTrace,stepTrace, acceptedSampleTrace, rejectedSampleTrace], layout);

// Recompute the steps for the Ziggurat layers with proper filling and symmetry
function updateZigguratLayers() {
    layers = parseInt(document.getElementById('layerInput').value);
    precomputeZigguratLayers(layers);

    // Clear existing sample data when updating bins
    acceptedSampleTrace.x = [];
    acceptedSampleTrace.y = [];
    rejectedSampleTrace.x = [];
    rejectedSampleTrace.y = [];

    const newX = [];
    const newY = [];

    zigguratLayers.forEach(layer => {
        const left = -layer.width;  // Left side of the layer
        const right = layer.width;  // Right side of the layer
        const height = layer.height;

        // Add step values for each layer
        newX.push(left, right, right, left);  // Symmetrical layers, closed polygon
        newY.push(height, height, 0, 0);  // Heights for each segment of the step, closing to 0
    });

    stepTrace = {
        x: newX,
        y: newY,
        type: 'scatter',
        mode: 'lines',
        fill: 'tozeroy',  // Proper vertical filling
        line: { shape: 'hv', color: 'blue', width: 2 },  // Thicker line for outline
        marker: { size: 0 },  // No markers on the steps
        name: 'Ziggurat Layers'
    };

    Plotly.react('plot', [normalTrace,stepTrace, acceptedSampleTrace, rejectedSampleTrace], layout);
}

function generateMultipleSamples() {
    for (let i = 0; i < 25; i++) {
        generateZigguratSample();
    }
}

document.addEventListener('DOMContentLoaded', () => {

updateZigguratLayers();  // Initialize layers
});