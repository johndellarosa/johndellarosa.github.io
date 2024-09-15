// Function to compute the Gaussian Kernel
function gaussianKernel(x, xi, h) {
    return (1 / (Math.sqrt(2 * Math.PI) * h)) * Math.exp(-0.5 * Math.pow((x - xi) / h, 2));
}

// Function to compute the Epanechnikov Kernel
function epanechnikovKernel(x, xi, h) {
    let u = (x - xi) / h;
    return Math.abs(u) <= 1 ? 0.75 * (1 - u * u) / h : 0;
}

// Function to compute the Uniform Kernel
function uniformKernel(x, xi, h) {
    let u = (x - xi) / h;
    return Math.abs(u) <= 1 ? 0.5 / h : 0;
}

// Kernel Density Estimation
function kernelDensityEstimate(data, bandwidth, xRange, kernelType) {
    let kde = [];
    for (let x of xRange) {
        let sum = 0;
        for (let xi of data) {
            sum += kernelFunction(x, xi, bandwidth, kernelType);
        }
        kde.push(sum / data.length);
    }
    return kde;
}

// Select the appropriate kernel function based on user input
function kernelFunction(x, xi, h, kernelType) {
    switch (kernelType) {
        case 'gaussian':
            return gaussianKernel(x, xi, h);
        case 'epanechnikov':
            return epanechnikovKernel(x, xi, h);
        case 'uniform':
            return uniformKernel(x, xi, h);
        default:
            return gaussianKernel(x, xi, h);
    }
}

// Generate range for x values with exactly `numPoints` between min and max
function generateXRange(min, max, numPoints) {
    let xRange = [];
    let step = (max - min) / (numPoints - 1);  // Correctly calculate step size to generate exactly numPoints
    for (let i = 0; i < numPoints; i++) {
        xRange.push(min + i * step);
    }
    return xRange;
}

// Main function to generate KDE and plot with Chart.js
function generateKDE() {
    let bandwidth = parseFloat(document.getElementById('bandwidth').value);
    let data = document.getElementById('data-points').value.split(',').map(Number);
    let kernelType = document.getElementById('kernel').value;

    // Get the user-defined x-axis bounds
    let xMin = parseFloat(document.getElementById('x-min').value);
    let xMax = parseFloat(document.getElementById('x-max').value);

    // Filter the data points to only include those within the x-axis bounds
    let filteredData = data.filter(d => d >= xMin && d <= xMax);

    // Generate x values for KDE plot based on xMin and xMax range
    let xRange = generateXRange(xMin, xMax, 200);

    // Generate KDE values for the computed xRange
    let kde = kernelDensityEstimate(data, bandwidth, xRange, kernelType);

    // Destroy previous chart if it exists
    if (window.kdeChart instanceof Chart) {
        window.kdeChart.destroy();
    }

    // Create a new Chart.js chart with filtered data points and KDE curve
    let ctx = document.getElementById('kdeChart').getContext('2d');
    window.kdeChart = new Chart(ctx, {
        type: 'scatter',  // Use scatter type for better synchronization
        data: {
            datasets: [
                {
                    label: 'KDE (' + kernelType.charAt(0).toUpperCase() + kernelType.slice(1) + ' Kernel)',
                    type: 'line',  // KDE is a line plot
                    data: xRange.map((x, i) => ({ x: x, y: kde[i] })),
                    borderColor: 'blue',
                    fill: false,
                    tension: 0.1,
                    pointRadius:.5,
                },
                {
                    label: 'Data Points',
                    type: 'scatter',  // Data points plotted separately
                    data: filteredData.map(d => ({ x: d, y: 0 })),  // Plot only filtered data points within bounds
                    borderColor: 'red',
                    backgroundColor: 'red',
                    pointRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'X'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2);  // Round x-axis ticks to 2 decimal places
                        }
                    },
                    min: xMin,  // Custom x-axis bounds from user input
                    max: xMax
                },
                y: {
                    title: {
                        display: true,
                        text: 'Density'
                    }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {

    
// Function to handle file upload and parse data points
document.getElementById('file-upload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;

        // Clean up the content by trimming whitespace and splitting by commas, spaces, or newlines
        const uploadedData = content
            .trim()  // Remove leading/trailing whitespace
            .split(/[\s,]+/)  // Split by any number of spaces, commas, or newlines
            .map(Number)  // Convert each item to a number
            .filter(num => !isNaN(num));  // Remove any invalid numbers

        // Populate the data points input field with the uploaded data
        document.getElementById('data-points').value = uploadedData.join(', ');

        // Optionally, generate the KDE immediately after upload
        generateKDE();
    };

    reader.readAsText(file);  // Read the file as text
});

});