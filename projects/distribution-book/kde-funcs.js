let kdeCounter = 0;  // To track unique KDEs
let kdeDataSets = [];  // To store all KDE datasets
let dataPointsDataset = null;  // To store the dataset for the data points



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


// Function to generate and add KDE to the chart
function addKDE() {
    let bandwidth = parseFloat(document.getElementById('bandwidth').value);
    let data = document.getElementById('data-points').value.split(',').map(Number);
    let kernelType = document.getElementById('kernel').value;
    let xMin = parseFloat(document.getElementById('x-min').value);
    let xMax = parseFloat(document.getElementById('x-max').value);

    // Generate x values for KDE plot based on xMin and xMax range
    let xRange = generateXRange(xMin, xMax, 200);
    let kde = kernelDensityEstimate(data, bandwidth, xRange, kernelType);

    // Generate random color for KDE line
    const color = getRandomColor();

    // Add a unique KDE dataset with a unique ID
    let kdeId = `kde${kdeCounter++}`;  // Create unique ID for the KDE
    kdeDataSets.push({
        label: `KDE (h=${bandwidth}, ${kernelType})`,
        data: xRange.map((x, i) => ({ x: x, y: kde[i] })),
        borderColor: color,
        fill: false,
        tension: 0.1,
        type: 'line',  // Ensure this dataset is treated as a line plot
        id: kdeId,
        pointRadius: .5
    });

    // Update the chart with the new dataset
    updateChart();

    // Add the KDE to the list below the chart
    addKDEToList(kdeId, bandwidth, kernelType, color);
}

// Function to update the chart with the current KDE datasets and data points
function updateChart() {
    if (window.kdeChart instanceof Chart) {
        window.kdeChart.destroy();  // Destroy the old chart to avoid reuse
    }

    // Create dataset for data points if not already created
    if (!dataPointsDataset) {
        let data = document.getElementById('data-points').value.split(',').map(Number);
        dataPointsDataset = {
            label: 'Data Points',
            data: data.map(d => ({ x: d, y: 0 })),
            type: 'scatter',
            borderColor: 'red',
            backgroundColor: 'red',
            pointRadius: 5
        };
    }

    // Create new chart with all datasets (including data points)
    let ctx = document.getElementById('kdeChart').getContext('2d');
    window.kdeChart = new Chart(ctx, {
        type: 'scatter',  // Base type is scatter for data points
        data: {
            datasets: [dataPointsDataset, ...kdeDataSets]  // Add data points and all KDE datasets
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
                            return value.toFixed(2);  // Round x-axis ticks
                        }
                    }
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

// Function to add KDE info to the list below the chart (button and color selector)
function addKDEToList(kdeId, bandwidth, kernelType, color) {
    const kdeList = document.getElementById('kdeListItems');
    const listItem = document.createElement('li');
    
    // Create a button to remove the KDE
    const button = document.createElement('button');
    button.textContent = `Remove KDE (h=${bandwidth}, ${kernelType})`;
    button.classList.add('kde-remove-button');
    button.addEventListener('click', function () {
        removeKDE(kdeId);
    });
    
    // Create a color input to change the color of the KDE
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = color;
    colorInput.addEventListener('input', function () {
        changeKDEColor(kdeId, colorInput.value);
    });

    // Append the button and color input to the list item
    listItem.appendChild(button);
    listItem.appendChild(colorInput);
    listItem.setAttribute('data-id', kdeId);
    kdeList.appendChild(listItem);
}

// Function to remove a KDE from the chart and the list
function removeKDE(kdeId) {
    // Remove from kdeDataSets
    kdeDataSets = kdeDataSets.filter(dataset => dataset.id !== kdeId);

    // Remove the corresponding list item
    const kdeListItem = document.querySelector(`[data-id="${kdeId}"]`);
    if (kdeListItem) {
        kdeListItem.remove();
    }

    // Update the chart
    updateChart();
}

// Function to change the color of a KDE on the chart
function changeKDEColor(kdeId, newColor) {
    const kde = kdeDataSets.find(dataset => dataset.id === kdeId);
    if (kde) {
        kde.borderColor = newColor;  // Change the line color
        updateChart();  // Redraw the chart with the new color
    }
}

// Helper function to generate random colors for the KDE lines
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Function to update all existing KDEs with new data
function updateAllKDEsWithNewData(newData) {
    kdeDataSets.forEach(kde => {
        const bandwidthMatch = kde.label.match(/h=([0-9.]+)/);  // Extract bandwidth from the label
        const kernelMatch = kde.label.match(/\(([^,]+)\)$/);    // Extract kernel type from the label
        const bandwidth = parseFloat(bandwidthMatch ? bandwidthMatch[1] : 1.0);
        const kernelType = kernelMatch ? kernelMatch[1] : 'gaussian';

        // Recalculate the KDE with the new data
        const xMin = parseFloat(document.getElementById('x-min').value);
        const xMax = parseFloat(document.getElementById('x-max').value);
        const xRange = generateXRange(xMin, xMax, 200);
        const updatedKDE = kernelDensityEstimate(newData, bandwidth, xRange, kernelType);

        // Update the KDE dataset with new data
        kde.data = xRange.map((x, i) => ({ x: x, y: updatedKDE[i] }));
    });
}

// Function to refresh KDEs with manually entered data
function refreshKDEWithManualData() {
    // Read the manually entered data points
    const manualData = document.getElementById('data-points').value
        .split(',')
        .map(Number)
        .filter(num => !isNaN(num));  // Remove invalid entries

    // Update the data points dataset
    dataPointsDataset = {
        label: 'Data Points',
        data: manualData.map(d => ({ x: d, y: 0 })),
        type: 'scatter',
        borderColor: 'red',
        backgroundColor: 'red',
        pointRadius: 5
    };

    // Update all existing KDEs with the new data
    updateAllKDEsWithNewData(manualData);

    // Refresh the chart to show the updated data points and KDEs
    updateChart();
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

        // // Update the data points dataset
        // dataPointsDataset = {
        //     label: 'Data Points',
        //     data: uploadedData.map(d => ({ x: d, y: 0 })),
        //     type: 'scatter',
        //     borderColor: 'red',
        //     backgroundColor: 'red',
        //     pointRadius: 5
        // };

        // // Update existing KDEs with the new data
        // updateAllKDEsWithNewData(uploadedData);

        // // Refresh the chart to show the updated data points
        // updateChart();
        refreshKDEWithManualData();
    };

    reader.readAsText(file);  // Read the file as text
});
});