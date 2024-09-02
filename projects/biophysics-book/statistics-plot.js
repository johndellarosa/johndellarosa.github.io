let points = [];
let regressionChart;

function setupChart() {
    const ctx = document.getElementById('regressionChart').getContext('2d');
    regressionChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Data Points',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 1)',
                pointRadius: 5,
            }, {
                label: 'Regression Line',
                data: [],
                type: 'line',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                fill: false,
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: -10,  // Define your own min value
                    max: 10, // Define your own max value
                },
                y: {
                    type: 'linear',
                    min: -10,  // Define your own min value
                    max: 10, // Define your own max value
                }
            },
            onClick: chartClickEvent
        }
    });
}



let currentGranularity = 0.1;

function updateGranularity() {
    currentGranularity = parseFloat(document.getElementById('granularityInput').value);
}

function chartClickEvent(event) {
    var canvasPosition = Chart.helpers.getRelativePosition(event, regressionChart);

    var dataX = regressionChart.scales.x.getValueForPixel(canvasPosition.x);
    var dataY = regressionChart.scales.y.getValueForPixel(canvasPosition.y);

    // Round to the current granularity
    dataX = Math.round(dataX / currentGranularity) * currentGranularity;
    dataY = Math.round(dataY / currentGranularity) * currentGranularity;

    addDataPoint(dataX, dataY);
    updateRegressionLine();
}


function addDataPoint(x, y) {
    regressionChart.data.datasets[0].data.push({x: x, y: y});
    regressionChart.update();
}

function updateRegressionLine() {
    // Compute the regression line
    const data = regressionChart.data.datasets[0].data;
    const results = performOLS(data);
    regressionChart.data.datasets[1].data = [
        { x: Math.min(...data.map(pt => pt.x)), y: results.slope * Math.min(...data.map(pt => pt.x)) + results.intercept },
        { x: Math.max(...data.map(pt => pt.x)), y: results.slope * Math.max(...data.map(pt => pt.x)) + results.intercept }
    ];
    regressionChart.update();

        // Calculate residuals and update the residual plot
        const residuals = data.map(pt => ({
            x: pt.x * results.slope + results.intercept,
            y: pt.y - (pt.x * results.slope + results.intercept)
        }));
    
        if (residualChart) {
            residualChart.data.datasets[0].data = residuals;
            residualChart.update();
        }
}

function performOLS(data) {
    let xSum = 0, ySum = 0, xySum = 0, xxSum = 0, yySum = 0, n = data.length;
    
    data.forEach(point => {
        xSum += point.x;
        ySum += point.y;
        xySum += point.x * point.y;
        xxSum += point.x * point.x;
        yySum += point.y * point.y;
    });

    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;

    // Calculate R squared
    const ssTotal = yySum - ySum * ySum / n;
    const ssReg = slope * xySum + intercept * ySum - ySum * ySum / n;
    const rSquared = ssReg / ssTotal;

    updateRegressionInfo(slope, intercept, rSquared);

    return { slope, intercept, rSquared };
}

function updateRegressionInfo(slope, intercept, rSquared) {
    document.getElementById('regressionEquation').textContent = `Equation: y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`;
    document.getElementById('rSquaredValue').textContent = `R²: ${rSquared.toFixed(2)}`;
}



let residualChart;

function setupResidualChart() {
    const ctx = document.getElementById('residualChart').getContext('2d');
    residualChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Residuals',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 1)'
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Predicted Value'
                    }
                },
                y: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Residuals'
                    }
                }
            }
        }
    });
}