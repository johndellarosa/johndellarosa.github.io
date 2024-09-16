document.addEventListener('DOMContentLoaded', () => {
  const isMobile = window.matchMedia("only screen and (max-width: 767px)").matches;
  let chartInstance;
  let dataPoints = [];
  
  function calculateSampleMoments(data) {
    const n = data.length;
    const mean = data.reduce((acc, val) => acc + val, 0) / n;
    const variance = data.reduce((acc, val) => acc + (val - mean) ** 2, 0) / n;

    return {
      mean: mean,
      variance: variance
    };
  }

  function estimateNormal(data) {
    const { mean, variance } = calculateSampleMoments(data);
    return {
      parameters: `μ = ${mean.toFixed(4)}, σ² = ${variance.toFixed(4)}`,
      mean: mean,
      variance: variance
    };
  }

  function estimateExponential(data) {
    const { mean } = calculateSampleMoments(data);
    const lambda = 1 / mean;
    return {
      parameters: `λ = ${lambda.toFixed(4)}`,
      lambda: lambda
    };
  }

  function estimateGamma(data) {
    const { mean, variance } = calculateSampleMoments(data);
    const alpha = mean ** 2 / variance;
    const beta = variance / mean;
    return {
      parameters: `α = ${alpha.toFixed(4)}, β = ${beta.toFixed(4)}`,
      alpha: alpha,
      beta: beta
    };
  }


  function estimateBeta(data) {
    const { mean, variance } = calculateSampleMoments(data);
    const alpha = ((mean * (1 - mean)) / variance - 1) * mean;
    const beta = alpha * ((1 - mean) / mean);
    return {
      parameters: `α = ${alpha.toFixed(4)}, β = ${beta.toFixed(4)}`,
      alpha: alpha,
      beta: beta
    };
  }

  function estimateUniform(data) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    return {
      parameters: `a = ${min.toFixed(4)}, b = ${max.toFixed(4)}`,
      a: min,
      b: max
    };
  }

  function plotDataAndDistribution(data, selectedDistributions, paramsList, minRange, maxRange, numBins) {
    const binWidth = (maxRange - minRange) / numBins;
    const bins = Array(numBins).fill(0);
  
    data.forEach(value => {
      if (value >= minRange && value <= maxRange) {
        const binIndex = Math.min(Math.floor((value - minRange) / binWidth), numBins - 1);
        bins[binIndex]++;
      }
    });
  
    const histogramX = Array.from({ length: numBins }, (_, i) => minRange + i * binWidth + binWidth / 2);
    const histogramY = bins.map(count => count / (data.length * binWidth)); // Normalize by bin width
  
    // Collect datasets for each selected distribution
    const datasets = [{
      label: 'Empirical Histogram',
      data: histogramY,
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
      type: 'bar',
    }];
  
    selectedDistributions.forEach((distribution, i) => {
      let estimatedY = [];
      const params = paramsList[i];
  
      if (distribution === "normal") {
        const { mean, variance } = params;
        estimatedY = histogramX.map(x => (1 / Math.sqrt(2 * Math.PI * variance)) * Math.exp(-((x - mean) ** 2) / (2 * variance)));
      } else if (distribution === "exponential") {
        const { lambda } = params;
        estimatedY = histogramX.map(x => lambda * Math.exp(-lambda * x));
      } else if (distribution === "gamma") {
        const { alpha, beta } = params;
        estimatedY = histogramX.map(x => (Math.pow(x, alpha - 1) * Math.exp(-x / beta)) / (Math.pow(beta, alpha) * gammaFunc(alpha)));
      } else if (distribution === "beta") {
        const { alpha, beta } = params;
        estimatedY = histogramX.map(x => Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1) / betaFunc(alpha, beta));
      } else if (distribution === "uniform") {
        const { a, b } = params;
        estimatedY = histogramX.map(x => (x >= a && x <= b) ? 1 / (b - a) : 0);
      }
  
      datasets.push({
        label: `${distribution.charAt(0).toUpperCase() + distribution.slice(1)} PDF`, // Fixed legend label
        data: estimatedY,
        type: 'line',
        borderColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`,
        fill: false,
        tension: 0.4
      });
    });
  
    if (chartInstance) {
      chartInstance.destroy();
    }
  
    const ctx = document.getElementById('chart').getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: histogramX,
        datasets: datasets
      },
      options: {
        responsive: true,
          maintainAspectRatio: true,
          plugins: {
              legend: {
                  display: true,
                  position: 'right'
              }},
        scales: {
          x: {
            title: {
              display: true,
              text: 'Value'
            },
            ticks: {
              callback: function(value) {
                  return value.toFixed(3);  // Round x-axis ticks
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
  
  function performMoM() {
    // const dataInput = document.getElementById("data").value;
    const selectedDistributions = Array.from(document.getElementById("distribution").selectedOptions).map(option => option.value);
    let minRange = parseFloat(document.getElementById("minRange").value);
    let maxRange = parseFloat(document.getElementById("maxRange").value);
    const numBins = parseInt(document.getElementById("numBins").value);


  
    // const data = dataInput.split(",").map(val => parseFloat(val.trim()));
  
    // if (data.some(isNaN) || isNaN(numBins)) {
    //   alert("Please enter valid numbers.");
    //   return;
    // }
    if (dataPoints.length === 0 || isNaN(numBins)) {
      alert("Please enter some data points and a valid number of bins.");
      return;
  }
    // Default to sample min and max if fields are empty
    if (isNaN(minRange)) {
      minRange = Math.min(...dataPoints);
    }
    if (isNaN(maxRange)) {
      maxRange = Math.max(...dataPoints);
    }
  
    let paramsList = [];
    let resultText = '';
  
    selectedDistributions.forEach(distribution => {
      let result, params;
      switch (distribution) {
        case "normal":
          result = estimateNormal(dataPoints);
          params = { mean: result.mean, variance: result.variance };
          break;
        case "exponential":
          result = estimateExponential(dataPoints);
          params = { lambda: result.lambda };
          break;
        case "gamma":
          result = estimateGamma(dataPoints);
          params = { alpha: result.alpha, beta: result.beta };
          break;
        case "beta":
          result = estimateBeta(dataPoints);
          params = { alpha: result.alpha, beta: result.beta };
          break;
        case "uniform":
          result = estimateUniform(dataPoints);
          params = { a: result.a, b: result.b };
          break;
        default:
          alert("Unknown distribution.");
          return;
      }
      paramsList.push(params);
      resultText += `${distribution.charAt(0).toUpperCase() + distribution.slice(1)}: ${result.parameters};\n`;
 
    });
  
    document.getElementById("outputSection").style.display = "block";
    document.getElementById("outputLabel").textContent = resultText;
  
    plotDataAndDistribution(dataPoints, selectedDistributions, paramsList, minRange, maxRange, numBins);
  }

  // Gamma function approximation for Gamma distribution PDF
  function gammaFunc(n) {
    return Math.exp(gammaLn(n));
  }

  function gammaLn(n) {
    const p = [
      1.000000000190015,
      76.18009172947146,
      -86.50532032941677,
      24.01409824083091,
      -1.231739572450155,
      0.001208650973866179,
      -0.000005395239384953
    ];
    let x = n;
    let y = n;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 1; j <= 6; j++) {
      ser += p[j] / ++y;
    }
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }

  // Beta function for Beta distribution PDF
function betaFunc(alpha, beta) {
  return gammaFunc(alpha) * gammaFunc(beta) / gammaFunc(alpha + beta);
}


function addDataPoint() {
  const dataPointValue = document.getElementById('dataPoint').value.trim();
  const dataPoint = parseFloat(dataPointValue);

  console.log("Adding data point:", dataPointValue); // Debug output

  if (!isNaN(dataPoint)) {
      dataPoints.push(dataPoint);
      updateDataDisplay();
      updateChart();
      document.getElementById('dataPoint').value = ''; // Clear the input field after processing
  } else {
      console.error("Invalid data point entered:", dataPointValue); // Debug output
      alert("Please enter a valid number for the data point.");
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

function updateChart() {
  // Use dataPoints array instead of the whole data input from before
  if (dataPoints.length > 0) {
      performMoM(); // Perform MoM calculation and update the chart
  } else {
      if (chartInstance) chartInstance.destroy(); // Destroy the chart if no data points
  }
}

function clearDataPoints() {
  dataPoints = []; // Clear the data array
  updateDataDisplay(); // Update the display to show no data points
  updateChart(); // Re-draw the chart with no data points
}

updateDataDisplay(); // Initially show no data
document.getElementById('addDataButton').onclick = addDataPoint; // Attach event handler for adding data
document.getElementById('clearDataButton').onclick = clearDataPoints; // Attach event handler for clearing data
  document.getElementById('estimate-button').addEventListener('click', performMoM);



  
  });

