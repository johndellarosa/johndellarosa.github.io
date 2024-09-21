let totalSamples = 0;
let acceptedSamples = 0;
const normalizationConstant = 1 / Math.sqrt(2 * Math.PI);
const maxLayerHeight = 1;  // Height of the tallest layer (at x = 0)
let layers = 6;  // Default number of layers

// Target distribution: Standard normal PDF
function targetDistribution(x) {
    return  Math.exp(-0.5 * x * x);  // Standard normal distribution
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
    const totalArea = 1/normalizationConstant/ numLayers;

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
        console.log(tailSample);
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
    const maxTailSample = 10;  // Cap extreme values for safety
    const scale = 2;  // Adjust this scaling factor to increase the tail's spread
    
    while (!tailAccepted) {
        // Generate a sample from an exponential distribution for the tail
        const proposalSample = -Math.log(Math.random()) * scale;  // Scale exponential sample
        
        // Cap the sample to avoid extreme values
        const boundedSample = Math.min(proposalSample, maxTailSample);
        
        // Rejection criterion: accept if below the normal distribution's tail
        const acceptanceProb = Math.exp(-0.5 * boundedSample * boundedSample);  // PDF for normal distribution

        // Avoid numerical issues with tiny probabilities
        if (Math.random() < acceptanceProb) {
            sample = boundedSample;
            if (Math.random() < 0.5) {
                sample *= -1;
            }
            tailAccepted = true;
        }
    }

    return sample;
}

// // Function to add sample to the plot
// function addSampleToPlot(x, y, accepted) {
//     const traceIndex = accepted ? 1 : 2;  // Trace 1 for accepted, 2 for rejected
//     const update = {
//         x: [[x]],  // Append x-coordinate
//         y: [[y]]   // Always plot sample on y=0
//     };
//     Plotly.extendTraces('plot', update, [traceIndex]);
// }

// // Plot traces for Ziggurat layers and samples
// let stepTrace = {
//     x: [],
//     y: [],
//     type: 'scatter',
//     mode: 'lines',
//     fill: 'tozeroy',  // Fill under the line to give the step look
//     line: { shape: 'hv', color: 'blue', width: 2 },  // Thicker outline
//     marker: { size: 0 },  // No markers for the steps
//     name: 'Ziggurat Layers'
// };

// let acceptedSampleTrace = {
//     x: [],
//     y: [],
//     mode: 'markers',
//     marker: { color: 'green', size: 8 },
//     name: 'Accepted Samples'
// };

// let rejectedSampleTrace = {
//     x: [],
//     y: [],
//     mode: 'markers',
//     marker: { color: 'red', size: 8 },
//     name: 'Rejected Samples'
// };

// // Plot layout
// const layout = {
//     title: 'Ziggurat Algorithm Step Plot',
//     xaxis: { title: 'X', range: [-5, 5] },
//     yaxis: { title: 'Y', range: [0, 1] }
// };

// // Create a trace for the standard normal distribution
// const normalX = [];
// const normalY = [];
// const numPoints = 100;  // Number of points for the normal distribution

// for (let i = 0; i <= numPoints; i++) {
//     const xVal = (i / numPoints) * 20 - 10;  // Range from -10 to 10
//     normalX.push(xVal);
//     normalY.push(Math.exp(-0.5 * xVal * xVal));  // Standard normal PDF
// }

// const normalTrace = {
//     x: normalX,
//     y: normalY,
//     type: 'scatter',
//     mode: 'lines',
//     line: { color: 'red', width: 2 },
//     name: 'Standard Normal Distribution'
// };

// // Initial plot
// Plotly.newPlot('plot', [normalTrace, stepTrace, acceptedSampleTrace, rejectedSampleTrace], layout);

// // Store the samples separately in arrays to rebuild the plot when needed
// let acceptedSamplesX = [];
// let acceptedSamplesY = [];
// let rejectedSamplesX = [];
// let rejectedSamplesY = [];

// // Function to update the Ziggurat layers
// function updateZigguratLayers() {
//     precomputeZigguratLayers(layers);

//     acceptedSampleTrace.x = [];
//     acceptedSampleTrace.y = [];
//     rejectedSampleTrace.x = [];
//     rejectedSampleTrace.y = [];

//     const newX = [];
//     const newY = [];

//     zigguratLayers.forEach(layer => {
//         const left = -layer.width;
//         const right = layer.width;
//         const height = layer.height;

//         newX.push(left, right, right, left);  // Symmetrical layers
//         newY.push(height, height, 0, 0);  // Heights for step shape
//     });

//     // Update the stepTrace for the Ziggurat layers
//     stepTrace = {
//         x: newX,
//         y: newY,
//         type: 'scatter',
//         mode: 'lines',
//         fill: 'tozeroy',  // Fill under step
//         line: { shape: 'hv', color: 'blue', width: 2 },
//         marker: { size: 0 },
//         name: 'Ziggurat Layers'
//     };

//     Plotly.react('plot', [normalTrace, stepTrace, acceptedSampleTrace, rejectedSampleTrace], layout);
// }

// // Generate and plot multiple Ziggurat samples
// function generateMultipleSamples() {
//     for (let i = 0; i < 25; i++) {
//         generateZigguratSample();
//     }
// }

// Store the samples separately in arrays to rebuild the plot when needed
let acceptedSamplesX = [];
let acceptedSamplesY = [];
let rejectedSamplesX = [];
let rejectedSamplesY = [];
// Store the accepted samples for statistics
let acceptedSamples_list = [];

// Plot traces for Ziggurat layers and samples
const zigguratLayersIndex = 1;  // Index for Ziggurat layers trace
const acceptedSamplesIndex = 2;  // Index for accepted samples trace
const rejectedSamplesIndex = 3;  // Index for rejected samples trace
// const normalIndex = 4;

// Function to add sample to plot (no Ziggurat modification)
function addSampleToPlot(x, y, accepted) {
    let sampleMarkerSize = window.innerWidth < 600 ? 2 : 4;  // Smaller size for mobile screens
    acceptedSampleTrace.marker.size = sampleMarkerSize;
    rejectedSampleTrace.marker.size = sampleMarkerSize;
    if (accepted) {
        acceptedSamples_list.push(x);
        acceptedSamplesX.push(x);
        acceptedSamplesY.push(y);
        Plotly.update('plot', {
            x: [acceptedSamplesX],
            y: [acceptedSamplesY]
        }, {}, [acceptedSamplesIndex]);
    } else {
        rejectedSamplesX.push(x);
        rejectedSamplesY.push(y);
        Plotly.update('plot', {
            x: [rejectedSamplesX],
            y: [rejectedSamplesY]
        }, {}, [rejectedSamplesIndex]);
    }

    
    // Only update statistics if we have accepted samples
    if (acceptedSamples_list.length > 0) {
        updateSampleStatistics();
    }
}



const layout = {
    // title: 'Ziggurat Algorithm Step Plot',
    xaxis: { title: 'X', range: [-5, 5] },
    yaxis: { title: 'Y', range: [0, 1] },
    autosize: true,  // Allow automatic resizing
    width: Math.min(window.innerWidth * 0.95,800),  // Set the width to 95% of the window width
    legend: {
        orientation: 'h',  // Horizontal legend
        // x: 0.,  // Center horizontally
        y: 1.5,  // Adjust legend position
        font: {
            size: 10  // Shrink the font size to prevent overlap
        },
        itemwidth: 30,  // Reduce item width to shrink the legend further
    }
};

// Create a trace for the standard normal distribution
const normalX = [];
const normalY = [];
const numPoints = 100;

for (let i = 0; i <= numPoints; i++) {
    const xVal = (i / numPoints) * 20 - 10;
    normalX.push(xVal);
    normalY.push(Math.exp(-0.5 * xVal * xVal));
}

let stepTrace = {
    x: [],
    y: [],
    type: 'scatter',
    mode: 'lines',
    fill: 'tozeroy',  
    line: { shape: 'hv', color: 'rgba(0,0,0,0.1)', width: 1 },  
    marker: { size: 0 },  
    name: 'Ziggurat Layers'
};

let acceptedSampleTrace = {
    x: [],
    y: [],
    mode: 'markers',
    marker: { color: 'green', size: 3 },
    name: 'Accepted Samples'
};

let rejectedSampleTrace = {
    x: [],
    y: [],
    mode: 'markers',
    marker: { color: 'red', size: 3 },
    name: 'Rejected Samples'
};

const normalTrace = {
    x: normalX,
    y: normalY,
    type: 'scatter',
    mode: 'lines',
    line: { color: 'red', width: 2 },
    name: 'Standard Normal Distribution'
};

// Initial plot
// Ensure normal distribution is the first trace (index 0)
Plotly.newPlot('plot', [normalTrace, stepTrace, acceptedSampleTrace, rejectedSampleTrace], layout);


// Function to update the Ziggurat layers
function updateZigguratLayers() {
    layers = parseInt(document.getElementById('layerInput').value);
    precomputeZigguratLayers(layers);

    // Clear existing sample data when updating layers
    acceptedSamplesX = [];
    acceptedSamplesY = [];
    rejectedSamplesX = [];
    rejectedSamplesY = [];

    const newX = [];
    const newY = [];

    zigguratLayers.forEach(layer => {
        const left = -layer.width;
        const right = layer.width;
        const height = layer.height;

        newX.push(left, right, right, left);  // Symmetrical layers
        newY.push(height, height, 0, 0);  // Heights for step shape
    });

    stepTrace = {
        x: newX,
        y: newY,
        type: 'scatter',
        mode: 'lines',
        fill: 'tozeroy',
        line: { shape: 'hv', color: 'rgba(0,0,255,0.05)', width: 1},
        marker: { size: 0 },
        name: 'Ziggurat Layers'
    };

    Plotly.react('plot', [normalTrace, stepTrace, acceptedSampleTrace, rejectedSampleTrace], layout);
}

// Generate and plot multiple Ziggurat samples
function generateMultipleSamples() {
    for (let i = 0; i < 25; i++) {
        generateZigguratSample();
    }
}

// Function to calculate sample statistics
function updateSampleStatistics() {
    if (acceptedSamples_list.length === 0) return;  // Ensure there are samples
    // Calculate the mean
    const mean = acceptedSamples_list.reduce((acc, val) => acc + val, 0) / acceptedSamples_list.length;

    // Calculate the variance
    const variance = acceptedSamples_list.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / acceptedSamples_list.length;

    // Standard deviation
    const stdDev = Math.sqrt(variance);

    // Min and Max
    const min = Math.min(...acceptedSamples_list);
    const max = Math.max(...acceptedSamples_list);

    // Calculate the kurtosis
    const kurtosis = acceptedSamples_list.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0) / acceptedSamples_list.length;

    // Update the statistics display
    document.getElementById('sampleStats').innerHTML = `
        <strong>Sample Statistics:</strong><br>
        Mean: ${mean.toFixed(4)}<br>
        Variance: ${variance.toFixed(4)}<br>
        Standard Deviation: ${stdDev.toFixed(4)}<br>
        Min: ${min.toFixed(4)}<br>
        Max: ${max.toFixed(4)}<br>
        Kurtosis: ${kurtosis.toFixed(4)}
    `;
}

// Ensure plot resizes when the window size changes
window.onresize = function() {
    Plotly.relayout('plot', {
        width: Math.min(window.innerWidth * 0.95,1000),
    });
};

document.addEventListener('DOMContentLoaded', () => {
layers = parseInt(document.getElementById('layerInput').value);
updateZigguratLayers();  // Initialize layers
});