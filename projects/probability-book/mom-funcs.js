document.addEventListener('DOMContentLoaded', () => {
  const isMobile = window.matchMedia("only screen and (max-width: 767px)").matches;
  let chartInstance;
  
  
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
    const dataInput = document.getElementById("data").value;
    const selectedDistributions = Array.from(document.getElementById("distribution").selectedOptions).map(option => option.value);
    let minRange = parseFloat(document.getElementById("minRange").value);
    let maxRange = parseFloat(document.getElementById("maxRange").value);
    const numBins = parseInt(document.getElementById("numBins").value);
  
    const data = dataInput.split(",").map(val => parseFloat(val.trim()));
  
    if (data.some(isNaN) || isNaN(numBins)) {
      alert("Please enter valid numbers.");
      return;
    }
  
    // Default to sample min and max if fields are empty
    if (isNaN(minRange)) {
      minRange = Math.min(...data);
    }
    if (isNaN(maxRange)) {
      maxRange = Math.max(...data);
    }
  
    let paramsList = [];
    let resultText = '';
  
    selectedDistributions.forEach(distribution => {
      let result, params;
      switch (distribution) {
        case "normal":
          result = estimateNormal(data);
          params = { mean: result.mean, variance: result.variance };
          break;
        case "exponential":
          result = estimateExponential(data);
          params = { lambda: result.lambda };
          break;
        case "gamma":
          result = estimateGamma(data);
          params = { alpha: result.alpha, beta: result.beta };
          break;
        case "beta":
          result = estimateBeta(data);
          params = { alpha: result.alpha, beta: result.beta };
          break;
        case "uniform":
          result = estimateUniform(data);
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
  
    plotDataAndDistribution(data, selectedDistributions, paramsList, minRange, maxRange, numBins);
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
    
  document.getElementById('estimate-button').addEventListener('click', performMoM);

  });

