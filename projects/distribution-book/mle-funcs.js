let dataPoints = [];
let chart = null;

function initializeChart() {
    const lambdaValues = Array.from({ length: 100 }, (_, i) => i / 10 + 0.1); // Precalculate lambda values
    const likelihoods = lambdaValues.map(lambda => 0); // Initialize with zeros

    const ctx = document.getElementById('likelihoodChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: lambdaValues,
            datasets: [{
                label: 'Likelihood',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgb(75, 192, 192)',
                data: likelihoods,
                fill: false,
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Lambda (λ)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Likelihood',
                    },
                    beginAtZero: true
                }
            },
            animation: {
                duration: 0 // Turn off animation to ensure instant updates
            }
        }
    });
}

let currentDistribution = 'poisson';

function updateDistributionType() {
    currentDistribution = document.getElementById('distributionSelect').value;
    updateChart();  // Recalculate likelihood with the new distribution
}

function calculateLikelihood(lambda) {
    if (dataPoints.length === 0) return 0;  // Handle case with no data points
    if (currentDistribution === 'exponential') {
        return dataPoints.reduce((prod, x) => prod * lambda * Math.exp(-lambda * x), 1);
    } else if (currentDistribution === 'poisson') {
        // For Poisson, lambda is the rate (mean number of events)
        return dataPoints.reduce((prod, x) => prod * (Math.pow(lambda, x) * Math.exp(-lambda) / factorial(x)), 1);
    }
}

function factorial(num) {
    if (num < 0) return 1;
    let fact = 1;
    for (let i = 1; i <= num; i++) {
        fact *= i;
    }
    return fact;
}

function updateChart() {
    const ctx = document.getElementById('likelihoodChart').getContext('2d');
    const xMin = parseFloat(document.getElementById('xMin').value);
    const xMax = parseFloat(document.getElementById('xMax').value);
    const numIntervals = parseInt(document.getElementById('intervalsSlider').value);

    const lambdaValues = Array.from({ length: numIntervals }, (_, i) => 
        ((xMax - xMin) / numIntervals) * i + xMin).map(val => parseFloat(val.toFixed(2)));
    const likelihoods = lambdaValues.map(lambda => calculateLikelihood(lambda));
    const maxLikelihood = Math.max(...likelihoods);

    if (dataPoints.length === 0) {
        // If there are no data points, clear or reset the chart
        if (chart) {
            chart.data.datasets.forEach((dataset) => {
                dataset.data = []; // Clear existing data points from the dataset
            });
            chart.update();
        }
        return; // Exit the function to avoid further processing
    }

    // If there are data points, proceed with updating the chart

    // Correctly generating lambda values for the labels
    // const lambdaValues = Array.from({ length: 100 }, (_, i) => (xMin + (xMax - xMin) * i / 99).toFixed(2));

    if (chart) {
        // Update the existing chart
        chart.data.labels = lambdaValues;
        chart.data.datasets.forEach((dataset) => {
            dataset.data = likelihoods;
        });
        chart.update();
    } else {
        // Initialize a new chart if it does not exist
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: lambdaValues,
                datasets: [{
                    label: 'Likelihood',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgb(75, 192, 192)',
                    data: lambdaValues.map(lambda => calculateLikelihood(parseFloat(lambda))),
                    fill: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Ensures the chart sizes dynamically
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Lambda (λ)'
                        },
                        ticks: {
                            // This callback is now correctly using lambda values
                            callback: function(value) {
                                return parseFloat(value).toFixed(2); // Format ticks to two decimal places
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Likelihood'
                        },
                        beginAtZero: true
                    }
                },
                animation: {
                    duration: 0 // Disable animation for instant updates
                }
            }
        });
    }

    updateModelStats(dataPoints.length, 1, maxLikelihood);  // Assuming 1 parameter for simplicity
}


function addDataPoint() {
    const dataPointValue = document.getElementById('dataPoint').value.trim();
    const dataPoint = parseFloat(dataPointValue);

    console.log("Adding data point:", dataPointValue); // Debug output

    if (!isNaN(dataPoint) && dataPoint > 0) {
        dataPoints.push(dataPoint);
        updateDataDisplay();
        updateChart();
        document.getElementById('dataPoint').value = ''; // Clear the input field after processing
    } else {
        console.error("Invalid data point entered:", dataPointValue); // Debug output
        alert("Please enter a valid positive number for the data point.");
    }
}

function updateDataDisplay() {
    const dataPointsList = document.getElementById('dataPointsList');
    dataPointsList.innerHTML = '';  // Clear existing content

    if (dataPoints.length > 0) {
        dataPoints.forEach((point, index) => {
            const pointButton = document.createElement('button');
            pointButton.textContent = point;
            pointButton.className = 'data-point-button'; // Class for styling
            pointButton.title = 'Click to remove this data point';
            pointButton.onclick = function() { removeDataPoint(index); }; // Attach event to remove data point
            dataPointsList.appendChild(pointButton);
        });
    } else {
        dataPointsList.textContent = 'None';
    }
}

function removeDataPoint(index) {
    dataPoints.splice(index, 1); // Remove the data point at the given index
    updateDataDisplay(); // Refresh the data display
    updateChart(); // Update the chart to reflect the new set of data points
}

document.addEventListener('DOMContentLoaded', () => {
    initializeChart(); // Set up the chart initially with no data
    document.getElementById('addDataButton').onclick = addDataPoint; // Attach event handler
});

function clearDataPoints() {
    dataPoints = []; // Clear the data array
    updateDataDisplay(); // Update the display to show no data points
    updateChart(); // Re-draw the chart with no data points
}

function updateIntervalDisplay(value) {
    document.getElementById('intervalsDisplay').textContent = value;
}

function updateModelStats(n, k, maxLikelihood) {
    const aic = 2 * k - 2 * Math.log(maxLikelihood);
    const bic = Math.log(n) * k - 2 * Math.log(maxLikelihood);
    document.getElementById('aicValue').textContent = `AIC: ${aic.toFixed(2)}`;
    document.getElementById('bicValue').textContent = `BIC: ${bic.toFixed(2)}`;
}