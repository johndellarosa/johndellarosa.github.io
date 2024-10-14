// Initialize variables
let kde2DCounter = 0;  // To track unique KDEs
const plotType = document.getElementById('plot-type').value;

// Function to parse 2-D data points from input
function parse2DData(input) {
    if (!input.trim()) {
        alert("Input is empty. Please provide data points.");
        return [];
    }

    const rawPairs = input.trim().split(/\s+/);  // Split by any whitespace
    const dataPoints = [];

    for (let pair of rawPairs) {
        const coords = pair.split(',');
        if (coords.length !== 2) {
            alert(`Invalid format for pair "${pair}". Expected format: x,y`);
            return [];
        }

        const x = parseFloat(coords[0]);
        const y = parseFloat(coords[1]);

        if (isNaN(x) || isNaN(y)) {
            alert(`Invalid numerical values in pair "${pair}".`);
            return [];
        }

        dataPoints.push({ x: x, y: y });
    }

    // Debug: Log parsed data points
    console.log("Parsed Data Points:", dataPoints);

    return dataPoints;
}

// Kernel functions updated to use bandwidth matrix H
// a. Gaussian Kernel
function gaussianKernel2D(x, y, xi, yi, invH, detH) {
    const dx = x - xi;
    const dy = y - yi;
    const exponent = -0.5 * (dx * (invH[0][0] * dx + invH[0][1] * dy) + dy * (invH[1][0] * dx + invH[1][1] * dy));
    const factor = 1 / (2 * Math.PI * Math.sqrt(detH));
    return factor * Math.exp(exponent);
}

// b. Epanechnikov Kernel
function epanechnikovKernel2D(x, y, xi, yi, invH, detH) {
    const dx = x - xi;
    const dy = y - yi;
    const distanceSquared = dx * (invH[0][0] * dx + invH[0][1] * dy) + dy * (invH[1][0] * dx + invH[1][1] * dy);
    if (distanceSquared > 1) return 0;
    const factor = 2 / (Math.PI * Math.sqrt(detH));
    return factor * (1 - distanceSquared);
}

// c. Uniform Kernel
function uniformKernel2D(x, y, xi, yi, invH, detH) {
    const dx = x - xi;
    const dy = y - yi;
    const distanceSquared = dx * (invH[0][0] * dx + invH[0][1] * dy) + dy * (invH[1][0] * dx + invH[1][1] * dy);
    if (distanceSquared > 1) return 0;
    const factor = 1 / (Math.PI * Math.sqrt(detH));
    return factor;
}

// d. Triangular Kernel
function triangularKernel2D(x, y, xi, yi, invH, detH) {
    const dx = x - xi;
    const dy = y - yi;
    const distance = Math.sqrt(dx * (invH[0][0] * dx + invH[0][1] * dy) + dy * (invH[1][0] * dx + invH[1][1] * dy));
    if (distance > 1) return 0;
    const factor = 2 / (Math.PI * Math.sqrt(detH));
    return factor * (1 - distance);
}

// e. Biweight (Quartic) Kernel
function biweightKernel2D(x, y, xi, yi, invH, detH) {
    const dx = x - xi;
    const dy = y - yi;
    const distanceSquared = dx * (invH[0][0] * dx + invH[0][1] * dy) + dy * (invH[1][0] * dx + invH[1][1] * dy);
    if (distanceSquared > 1) return 0;
    const factor = 15 / (8 * Math.PI * Math.sqrt(detH));
    return factor * Math.pow(1 - distanceSquared, 2);
}

// f. Cosine Kernel
function cosineKernel2D(x, y, xi, yi, invH, detH) {
    const dx = x - xi;
    const dy = y - yi;
    const distance = Math.sqrt(dx * (invH[0][0] * dx + invH[0][1] * dy) + dy * (invH[1][0] * dx + invH[1][1] * dy));
    if (distance > 1) return 0;
    const factor = (1 / (Math.PI * Math.sqrt(detH))) * (Math.PI / 2);
    return factor * Math.cos((Math.PI / 2) * distance);
}

// g. Laplace Kernel
function laplaceKernel2D(x, y, xi, yi, invH, detH) {
    const dx = x - xi;
    const dy = y - yi;
    const distance = Math.sqrt(dx * (invH[0][0] * dx + invH[0][1] * dy) + dy * (invH[1][0] * dx + invH[1][1] * dy));
    const factor = 1 / (2 * Math.PI * Math.sqrt(detH));
    return factor * Math.exp(-distance);
}

// Kernel selection function
function kernelFunction2D(x, y, xi, yi, invH, detH, kernelType) {
    switch (kernelType.toLowerCase()) {
        case 'gaussian':
            return gaussianKernel2D(x, y, xi, yi, invH, detH);
        case 'epanechnikov':
            return epanechnikovKernel2D(x, y, xi, yi, invH, detH);
        case 'uniform':
            return uniformKernel2D(x, y, xi, yi, invH, detH);
        case 'triangular':
            return triangularKernel2D(x, y, xi, yi, invH, detH);
        case 'biweight':
            return biweightKernel2D(x, y, xi, yi, invH, detH);
        case 'cosine':
            return cosineKernel2D(x, y, xi, yi, invH, detH);
        case 'laplace':
            return laplaceKernel2D(x, y, xi, yi, invH, detH);
        default:
            alert(`Unknown kernel type "${kernelType}". Defaulting to Gaussian kernel.`);
            return gaussianKernel2D(x, y, xi, yi, invH, detH);
    }
}

// Kernel Density Estimation function
function kernelDensityEstimate2D(data, invH, detH, xRange, yRange, kernelType) {
    const kde = [];
    for (let j = 0; j < yRange.length; j++) {
        kde[j] = [];
        for (let i = 0; i < xRange.length; i++) {
            let sum = 0;
            for (let point of data) {
                sum += kernelFunction2D(xRange[i], yRange[j], point.x, point.y, invH, detH, kernelType);
            }
            kde[j][i] = sum / data.length;
        }
    }
    return kde;
}

// Generate range function (same as before)
function generateRange(min, max, numPoints) {
    const range = [];
    const step = (max - min) / (numPoints - 1);
    for (let i = 0; i < numPoints; i++) {
        range.push(min + i * step);
    }
    return range;
}

document.getElementById('data-file').addEventListener('change', handleFileUpload);

let uploadedDataPoints = [];

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const contents = e.target.result;
        uploadedDataPoints = parseCSVData(contents);
        // Optionally, you can auto-populate the textarea or provide feedback to the user
        alert("Data loaded from CSV file.");
    };
    reader.readAsText(file);
}


function parseCSVData(csvContent) {
    const dataPoints = [];
    const lines = csvContent.trim().split('\n');
    for (let line of lines) {
        const values = line.split(',');
        if (values.length !== 2) {
            alert(`Invalid format in line "${line}". Expected two values separated by a comma.`);
            return [];
        }
        const x = parseFloat(values[0]);
        const y = parseFloat(values[1]);
        if (isNaN(x) || isNaN(y)) {
            alert(`Invalid numerical values in line "${line}".`);
            return [];
        }
        dataPoints.push({ x: x, y: y });
    }
    return dataPoints;
}


// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function clearUploadedData() {
    uploadedDataPoints = [];
    document.getElementById('data-file').value = ''; // Reset file input
    // alert("Uploaded data cleared. Using data from textarea.");
}

function generateRandomData() {
    const numPointsInput = document.getElementById('num-random-points');
    let numPoints = parseInt(numPointsInput.value);
    if (isNaN(numPoints) || numPoints <= 0) {
        alert("Please enter a valid number of data points.");
        return;
    }

    // Randomly choose a center within (-5, 5) for both x and y
    const centerX = Math.random() * 10 - 5;
    const centerY = Math.random() * 10 - 5;

    // Standard deviations for the noise
    const sigmaX = 2; // Adjust as needed
    const sigmaY = 2; // Adjust as needed

    const dataPoints = [];

    for (let i = 0; i < numPoints; i++) {
        const x = generateGaussianRandom(centerX, sigmaX);
        const y = generateGaussianRandom(centerY, sigmaY);
        dataPoints.push(`${x.toFixed(4)},${y.toFixed(4)}`);
    }

    // Update the data-points textarea
    document.getElementById('data-points').value = dataPoints.join(' ');
    // Clear any uploaded data
    clearUploadedData();
    // alert(`${numPoints} random data points generated around center (${centerX.toFixed(2)}, ${centerY.toFixed(2)}).`);
}


function generateGaussianRandom(mean = 0, standardDeviation = 1) {
    let u1 = Math.random();
    let u2 = Math.random();

    // Convert [0,1) to (0,1] to avoid log(0)
    u1 = u1 === 0 ? Number.MIN_VALUE : u1;

    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * standardDeviation + mean;
}

// Main function to generate 2-D KDE
function generateKDE2D() {
    const dataInput = document.getElementById('data-points').value;
    const kernelType = document.getElementById('kernel').value;
    const colorScale = document.getElementById('color-scale').value;
    const plotType = document.getElementById('plot-type').value;

    let dataPoints = [];

    if (uploadedDataPoints.length > 0) {
        // Use data from uploaded CSV file
        dataPoints = uploadedDataPoints;
    } else {
        // Parse data from textarea
        const dataInput = document.getElementById('data-points').value;
        dataPoints = parse2DData(dataInput);
        if (dataPoints.length === 0) return;
    }

    // Read bandwidth matrix elements
    const h11 = parseFloat(document.getElementById('h11').value);
    const h12 = parseFloat(document.getElementById('h12').value);
    const h21 = parseFloat(document.getElementById('h21').value);
    const h22 = parseFloat(document.getElementById('h22').value);

    // Ensure H is symmetric
    if (h12 !== h21) {
        alert("Bandwidth matrix H must be symmetric (h12 must equal h21).");
        return;
    }

    const H = [
        [h11, h12],
        [h21, h22]
    ];

    // Check if H is positive-definite
    const detH = h11 * h22 - h12 * h21;
    if (detH <= 0) {
        alert("Bandwidth matrix H must be positive-definite (determinant > 0).");
        return;
    }

    // Compute inverse of H
    const invH = [
        [h22 / detH, -h12 / detH],
        [-h21 / detH, h11 / detH]
    ];

    // Automatically determine plot ranges
    const xValues = dataPoints.map(p => p.x);
    const yValues = dataPoints.map(p => p.y);

    const xStdDev = Math.sqrt(H[0][0]);
    const yStdDev = Math.sqrt(H[1][1]);

    const xMin = Math.min(...xValues) - 3 * xStdDev;
    const xMax = Math.max(...xValues) + 3 * xStdDev;
    const yMin = Math.min(...yValues) - 3 * yStdDev;
    const yMax = Math.max(...yValues) + 3 * yStdDev;

    const adjustedXMin = isFinite(xMin) ? xMin : 0;
    const adjustedXMax = isFinite(xMax) ? xMax : 10;
    const adjustedYMin = isFinite(yMin) ? yMin : 0;
    const adjustedYMax = isFinite(yMax) ? yMax : 10;

    // Generate x and y ranges for the grid
    const numPoints = 100;
    const xRange = generateRange(adjustedXMin, adjustedXMax, numPoints);
    const yRange = generateRange(adjustedYMin, adjustedYMax, numPoints);

    // Compute 2-D KDE
    const kde = kernelDensityEstimate2D(dataPoints, invH, detH, xRange, yRange, kernelType);

    // Prepare traces and layout
    const zValues = kde.map(row => row);

    let traces = [];
    if (plotType === 'contour') {
        // Contour plot trace
        const contourTrace = {
            z: zValues,
            x: xRange,
            y: yRange,
            type: 'contour',
            colorscale: colorScale,
            contours: {
                coloring: 'heatmap',
                showlabels: true,
            },
            name: `KDE (${capitalizeFirstLetter(kernelType)})`,
            line: { width: 0.5 },
            opacity: 0.8,
            showscale: true,
            colorbar: {
                title: 'Density'
            }
        };

        traces.push(contourTrace);

        // Scatter trace for data points
        const scatterTrace = {
            x: dataPoints.map(p => p.x),
            y: dataPoints.map(p => p.y),
            mode: 'markers',
            type: 'scatter',
            name: 'Data Points',
            marker: { color: 'red', size: 6 },
            showlegend:false,
        };

        traces.push(scatterTrace);

        // 2D layout configuration
        var layout = {
            title: `2-D KDE with ${capitalizeFirstLetter(kernelType)} Kernel`,
            xaxis: { 
                title: 'X', 
                range: [adjustedXMin, adjustedXMax], 
                scaleanchor: "y", 
                scaleratio: 1,
                zeroline: false,
                showline: true,
                mirror: 'ticks',
            },
            yaxis: { 
                title: 'Y', 
                range: [adjustedYMin, adjustedYMax],
                zeroline: false,
                showline: true,
                mirror: 'ticks',
            },
            showlegend: true,
            margin: { l: 40, r: 40, t: 40, b: 40 },
            width: 700,
            height: 700,
        };
    } else if (plotType === 'surface') {
        // 3D surface plot trace
        const surfaceTrace = {
            z: zValues,
            x: xRange,
            y: yRange,
            type: 'surface',
            colorscale: colorScale,
            name: `KDE (${capitalizeFirstLetter(kernelType)})`,
            showscale: true,
            colorbar: {
                title: 'Density'
            },
            opacity: 0.9,
            contours: {
                z: {
                    show: true,
                    usecolormap: true,
                    highlightcolor: "#42f462",
                    project: { z: true }
                }
            }
        };

        traces.push(surfaceTrace);

        // Scatter trace for data points in 3D
        const scatter3DTrace = {
            x: dataPoints.map(p => p.x),
            y: dataPoints.map(p => p.y),
            z: Array(dataPoints.length).fill(0), // Place data points at z = 0
            mode: 'markers',
            type: 'scatter3d',
            name: 'Data Points',
            marker: { color: 'red', size: 4 }
        };

        traces.push(scatter3DTrace);

        // 3D layout configuration
        var layout = {
            title: `3-D KDE Surface Plot with ${capitalizeFirstLetter(kernelType)} Kernel`,
            scene: {
                xaxis: { title: 'X', range: [adjustedXMin, adjustedXMax] },
                yaxis: { title: 'Y', range: [adjustedYMin, adjustedYMax] },
                zaxis: { title: 'Density' },
            },
            margin: { l: 0, r: 0, t: 50, b: 0 },
            width: 700,
            height: 700,
        };
    }

    // Plot the selected type
    Plotly.newPlot('plot', traces, layout);
}
