// Function to update the correlation display
function updateRhoDisplay(value) {
  document.getElementById('rhoDisplay').textContent = value;
}

// Function to show or hide copula parameters based on selection
document.getElementById('copulaType').addEventListener('change', function() {
  const copula = this.value;
  if (copula === 't') {
      document.getElementById('df-group').style.display = 'flex';
  } else {
      document.getElementById('df-group').style.display = 'none';
  }
});

function updateMarginalParams(varName) {
  const marginal = document.getElementById('marginal' + varName).value;
  const paramsDiv = document.getElementById('params' + varName);
  paramsDiv.innerHTML = '';

  if (marginal === 'normal' || marginal === 'lognormal') {
      paramsDiv.innerHTML += `
          <div class="input-group">
              <label>Mean μ<sub>${varName.toLowerCase()}</sub>:</label>
              <input type="number" id="mu${varName}" value="0" step="0.1">
          </div>
          <div class="input-group">
              <label>Std Dev σ<sub>${varName.toLowerCase()}</sub>:</label>
              <input type="number" id="sigma${varName}" value="1" min="0.0001" step="0.1">
          </div>
      `;
  } else if (marginal === 'exponential') {
      paramsDiv.innerHTML += `
          <div class="input-group">
              <label>Rate λ<sub>${varName.toLowerCase()}</sub>:</label>
              <input type="number" id="lambda${varName}" value="1" min="0.0001" step="0.1">
          </div>
      `;
  } else if (marginal === 'uniform') {
      paramsDiv.innerHTML += `
          <div class="input-group">
              <label>Min a<sub>${varName.toLowerCase()}</sub>:</label>
              <input type="number" id="min${varName}" value="0" step="0.1">
          </div>
          <div class="input-group">
              <label>Max b<sub>${varName.toLowerCase()}</sub>:</label>
              <input type="number" id="max${varName}" value="1" step="0.1">
          </div>
      `;
  } else if (marginal === 'gamma') {
      paramsDiv.innerHTML += `
          <div class="input-group">
              <label>Shape α<sub>${varName.toLowerCase()}</sub>:</label>
              <input type="number" id="shape${varName}" value="2" min="0.0001" step="0.1">
          </div>
          <div class="input-group">
              <label>Scale θ<sub>${varName.toLowerCase()}</sub>:</label>
              <input type="number" id="scale${varName}" value="2" min="0.0001" step="0.1">
          </div>
      `;
  } else if (marginal === 'beta') {
      paramsDiv.innerHTML += `
          <div class="input-group">
              <label>Alpha α<sub>${varName.toLowerCase()}</sub>:</label>
              <input type="number" id="alpha${varName}" value="2" min="0.0001" step="0.1">
          </div>
          <div class="input-group">
              <label>Beta β<sub>${varName.toLowerCase()}</sub>:</label>
              <input type="number" id="beta${varName}" value="2" min="0.0001" step="0.1">
          </div>
      `;
  } else if (marginal === 'laplace') {
    paramsDiv.innerHTML += `
        <div class="input-group">
            <label>Location μ<sub>${varName.toLowerCase()}</sub>:</label>
            <input type="number" id="mu${varName}" value="0" step="0.1">
        </div>
        <div class="input-group">
            <label>Scale b<sub>${varName.toLowerCase()}</sub>:</label>
            <input type="number" id="b${varName}" value="1" min="0.0001" step="0.1">
        </div>
    `;
} else if (marginal === 'binomial') {
    paramsDiv.innerHTML += `
        <div class="input-group">
            <label>Number of Trials n<sub>${varName.toLowerCase()}</sub>:</label>
            <input type="number" id="n${varName}" value="10" min="1" step="1">
        </div>
        <div class="input-group">
            <label>Probability p<sub>${varName.toLowerCase()}</sub>:</label>
            <input type="number" id="p${varName}" value="0.5" min="0" max="1" step="0.01">
        </div>
    `;
} else if (marginal === 'negative_binomial') {
    paramsDiv.innerHTML += `
        <div class="input-group">
            <label>Number of Failures r<sub>${varName.toLowerCase()}</sub>:</label>
            <input type="number" id="r${varName}" value="5" min="1" step="1">
        </div>
        <div class="input-group">
            <label>Probability p<sub>${varName.toLowerCase()}</sub>:</label>
            <input type="number" id="p${varName}" value="0.5" min="0" max="1" step="0.01">
        </div>
    `;
} else if (marginal === 'poisson') {
    paramsDiv.innerHTML += `
        <div class="input-group">
            <label>Rate λ<sub>${varName.toLowerCase()}</sub>:</label>
            <input type="number" id="lambda${varName}" value="3" min="0.0001" step="0.1">
        </div>
    `;
} else if (marginal === 'beta_prime') {
    paramsDiv.innerHTML += `
        <div class="input-group">
            <label>Alpha α<sub>${varName.toLowerCase()}</sub>:</label>
            <input type="number" id="alpha${varName}" value="2" min="0.0001" step="0.1">
        </div>
        <div class="input-group">
            <label>Beta β<sub>${varName.toLowerCase()}</sub>:</label>
            <input type="number" id="beta${varName}" value="2" min="0.0001" step="0.1">
        </div>
    `;
}
}


// Initialize marginal parameters
updateMarginalParams('X');
updateMarginalParams('Y');

// Function to generate samples from copula and marginals
function generateSamples() {
  const copulaType = document.getElementById('copulaType').value;
  const rho = parseFloat(document.getElementById('rhoSlider').value);
  const numSamples = parseInt(document.getElementById('samples').value);
  const marginalX = document.getElementById('marginalX').value;
  const marginalY = document.getElementById('marginalY').value;

  let u = [];
  let v = [];

  // Generate samples from the selected copula
  if (copulaType === 'gaussian') {
      const normSamples = generateGaussianCopula(numSamples, rho);
      u = normSamples[0];
      v = normSamples[1];
  } else if (copulaType === 't') {
      const df = parseFloat(document.getElementById('df').value);
      const tSamples = generateTCopula(numSamples, rho, df);
      u = tSamples[0];
      v = tSamples[1];
  } else if (copulaType === 'clayton') {
      const claytonSamples = generateClaytonCopula(numSamples, rho);
      u = claytonSamples[0];
      v = claytonSamples[1];
  } else if (copulaType === 'gumbel') {
      const gumbelSamples = generateGumbelCopula(numSamples, rho);
      u = gumbelSamples[0];
      v = gumbelSamples[1];
  }

  // Apply inverse CDF (quantile function) of marginal distributions
  const samples = [];
  for (let i = 0; i < numSamples; i++) {
      const x = inverseCDF(u[i], marginalX, 'X');
      const y = inverseCDF(v[i], marginalY, 'Y');
      samples.push([x, y]);
  }

  return samples;
}

// Custom Cholesky decomposition for a 2x2 positive-definite matrix
function cholesky2x2(matrix) {
  const a = matrix[0][0];
  const b = matrix[0][1];
  const c = matrix[1][1];

  const L11 = Math.sqrt(a);
  const L21 = b / L11;
  const L22 = Math.sqrt(c - L21 * L21);

  return [
      [L11, 0],
      [L21, L22]
  ];
}

function validateParameters() {
  const errors = [];

  // Validate number of samples
  const numSamples = parseInt(document.getElementById('samples').value);
  if (isNaN(numSamples) || numSamples <= 0) {
      errors.push('Number of samples must be a positive integer.');
  }

  // Validate copula parameters
  const copulaType = document.getElementById('copulaType').value;
  if (copulaType === 't') {
      const df = parseFloat(document.getElementById('df').value);
      if (isNaN(df) || df <= 0) {
          errors.push('Degrees of freedom ν must be positive.');
      }
  }

  // Validate marginals
  ['X', 'Y'].forEach(varName => {
      const marginal = document.getElementById('marginal' + varName).value;
      const params = getMarginalParams(varName);

      if (marginal === 'normal' || marginal === 'lognormal') {
          if (isNaN(params.sigma) || params.sigma <= 0) {
              errors.push(`Standard deviation σ of ${marginal} distribution for ${varName} must be positive.`);
          }
      } else if (marginal === 'exponential') {
          if (isNaN(params.lambda) || params.lambda <= 0) {
              errors.push(`Rate λ of Exponential distribution for ${varName} must be positive.`);
          }
      } else if (marginal === 'uniform') {
          if (isNaN(params.a) || isNaN(params.b) || params.a >= params.b) {
              errors.push(`For Uniform distribution of ${varName}, min (a) must be less than max (b).`);
          }
      } else if (marginal === 'gamma') {
          if (isNaN(params.shape) || params.shape <= 0 || isNaN(params.scale) || params.scale <= 0) {
              errors.push(`Shape α and Scale θ of Gamma distribution for ${varName} must be positive.`);
          }
      } else if (marginal === 'beta') {
          if (isNaN(params.alpha) || params.alpha <= 0 || isNaN(params.beta) || params.beta <= 0) {
              errors.push(`Alpha α and Beta β of Beta distribution for ${varName} must be positive.`);
          }
      } else if (marginal === 'laplace') {
        if (isNaN(params.b) || params.b <= 0) {
            errors.push(`Scale parameter b of Laplace distribution for ${varName} must be positive.`);
        }
    } else if (marginal === 'binomial') {
        if (isNaN(params.n) || params.n <= 0 || !Number.isInteger(params.n)) {
            errors.push(`Number of trials n of Binomial distribution for ${varName} must be a positive integer.`);
        }
        if (isNaN(params.p) || params.p < 0 || params.p > 1) {
            errors.push(`Probability p of Binomial distribution for ${varName} must be between 0 and 1.`);
        }
    } else if (marginal === 'negative_binomial') {
        if (isNaN(params.r) || params.r <= 0 || !Number.isInteger(params.r)) {
            errors.push(`Number of failures r of Negative Binomial distribution for ${varName} must be a positive integer.`);
        }
        if (isNaN(params.p) || params.p < 0 || params.p > 1) {
            errors.push(`Probability p of Negative Binomial distribution for ${varName} must be between 0 and 1.`);
        }
    } else if (marginal === 'poisson') {
        if (isNaN(params.lambda) || params.lambda <= 0) {
            errors.push(`Rate λ of Poisson distribution for ${varName} must be positive.`);
        }
    } else if (marginal === 'beta_prime') {
        if (isNaN(params.alpha) || params.alpha <= 0 || isNaN(params.beta) || params.beta <= 0) {
            errors.push(`Alpha α and Beta β of Beta Prime distribution for ${varName} must be positive.`);
        }
    }


  });

  if (errors.length > 0) {
      alert(errors.join('\n'));
      return false;
  }
  return true;
}

// Function to generate samples from Gaussian Copula
function generateGaussianCopula(n, rho) {
  const samplesU = [];
  const samplesV = [];

  const cov = [
      [1, rho],
      [rho, 1]
  ];

  // Cholesky decomposition
  const L = cholesky2x2(cov);

  for (let i = 0; i < n; i++) {
      // Standard normal samples
      const z = [randn(), randn()];
      // Correlated normals
      const x = L[0][0] * z[0];
      const y = L[1][0] * z[0] + L[1][1] * z[1];
      // Transform to uniform via CDF of standard normal
      samplesU.push(standardNormalCDF(x));
      samplesV.push(standardNormalCDF(y));
  }

  return [samplesU, samplesV];
}


// Function to generate samples from t-Copula
function generateTCopula(n, rho, df) {
  const samplesU = [];
  const samplesV = [];

  const cov = [
      [1, rho],
      [rho, 1]
  ];

  // Cholesky decomposition
  const L = cholesky2x2(cov);

  for (let i = 0; i < n; i++) {
      // Generate standard normal variables
      const z = [randn(), randn()];
      // Generate chi-squared distributed variable
      const w = jStat.chisquare.sample(df) / df;
      // Correlated t samples
      const x = (L[0][0] * z[0]) / Math.sqrt(w);
      const y = (L[1][0] * z[0] + L[1][1] * z[1]) / Math.sqrt(w);
      // Transform to uniform via CDF of t-distribution
      samplesU.push(jStat.studentt.cdf(x, df));
      samplesV.push(jStat.studentt.cdf(y, df));
  }

  return [samplesU, samplesV];
}


// Function to generate standard normal random variables
function randn() {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // Avoid zero to prevent log(0)
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function binomialInv(u, n, p) {
  let cumulative = 0;
  for (let k = 0; k <= n; k++) {
      cumulative += jStat.binomial.pdf(k, n, p);
      if (u <= cumulative) {
          return k;
      }
  }
  return n; // Return n if not found due to floating-point errors
}

function negativeBinomialInv(u, r, p) {
  let cumulative = 0;
  let k = 0;
  while (true) {
      cumulative += jStat.negbin.pdf(k, r, p);
      if (u <= cumulative) {
          return k;
      }
      k++;
      if (k > 1000) break; // Prevent infinite loop
  }
  return k;
}
function poissonInv(u, lambda) {
  let cumulative = 0;
  let k = 0;
  while (true) {
      cumulative += jStat.poisson.pdf(k, lambda);
      if (u <= cumulative) {
          return k;
      }
      k++;
      if (k > 1000) break; // Prevent infinite loop
  }
  return k;
}


// Function to generate samples from Clayton Copula
function generateClaytonCopula(n, theta) {
  // For Clayton copula, theta > 0. Adjust rho to theta
  theta = (2 * rho) / (1 - rho);
  const samplesU = [];
  const samplesV = [];

  for (let i = 0; i < n; i++) {
      const u = Math.random();
      const w = Math.random();
      const v = Math.pow(Math.pow(w, -theta / (1 + theta)) * (Math.pow(u, -theta) - 1) + 1, -1 / theta);
      samplesU.push(u);
      samplesV.push(v);
  }

  return [samplesU, samplesV];
}

// Function to generate samples from Gumbel Copula
function generateGumbelCopula(n, theta) {
  // For Gumbel copula, theta ≥ 1. Adjust rho to theta
  theta = 1 / (1 - rho);
  const samplesU = [];
  const samplesV = [];

  for (let i = 0; i < n; i++) {
      const e1 = -Math.log(Math.random());
      const e2 = -Math.log(Math.random());
      const w = Math.pow(e1, 1 / theta) + Math.pow(e2, 1 / theta);
      const u = Math.exp(-Math.pow(e1 / w, theta));
      const v = Math.exp(-Math.pow(e2 / w, theta));
      samplesU.push(u);
      samplesV.push(v);
  }

  return [samplesU, samplesV];
}

function standardNormalCDF(x) {
  return jStat.normal.cdf(x, 0, 1);
}

function invStandardNormalCDF(p) {
  return jStat.normal.inv(p, 0, 1);
}


function studentTCDF(x, df) {
  return jStat.studentt.cdf(x, df);
}

function inverseCDF(u, marginal, varName) {
  const params = getMarginalParams(varName);

  if (marginal === 'normal') {
      return jStat.normal.inv(u, params.mu, params.sigma);
  } else if (marginal === 'exponential') {
      return jStat.exponential.inv(u, params.lambda);
  } else if (marginal === 'uniform') {
      return jStat.uniform.inv(u, params.a, params.b);
  } else if (marginal === 'gamma') {
      return jStat.gamma.inv(u, params.shape, params.scale);
  } else if (marginal === 'beta') {
      return jStat.beta.inv(u, params.alpha, params.beta);
  } else if (marginal === 'lognormal') {
      return jStat.lognormal.inv(u, params.mu, params.sigma);
  } else if (marginal === 'laplace') {
    // Inverse CDF of Laplace distribution
    const mu = params.mu;
    const b = params.b;
    if (u < 0.5) {
        return mu + b * Math.log(2 * u);
    } else {
        return mu - b * Math.log(2 * (1 - u));
    }
} else if (marginal === 'binomial') {
  return binomialInv(u, params.n, params.p);
} else if (marginal === 'negative_binomial') {
  return negativeBinomialInv(u, params.r, params.p);
} else if (marginal === 'poisson') {
  return poissonInv(u, params.lambda);
} else if (marginal === 'beta_prime') {
    // Implement inverse CDF for Beta Prime distribution
    // Beta Prime is the distribution of X/(1-X) where X ~ Beta(α, β)
    // So, if U ~ Uniform(0,1), then X = Beta_inv(U, α, β)
    // Then, BetaPrime_inv(U, α, β) = X / (1 - X)
    const alpha = params.alpha;
    const beta = params.beta;
    const x = jStat.beta.inv(u, alpha, beta);
    return x / (1 - x);
}
}

function getMarginalParams(varName) {
  const marginal = document.getElementById('marginal' + varName).value;
  const params = {};

  if (marginal === 'normal' || marginal === 'lognormal') {
      params.mu = parseFloat(document.getElementById('mu' + varName).value);
      params.sigma = parseFloat(document.getElementById('sigma' + varName).value);
  } else if (marginal === 'exponential') {
      params.lambda = parseFloat(document.getElementById('lambda' + varName).value);
  } else if (marginal === 'uniform') {
      params.a = parseFloat(document.getElementById('min' + varName).value);
      params.b = parseFloat(document.getElementById('max' + varName).value);
  } else if (marginal === 'gamma') {
      params.shape = parseFloat(document.getElementById('shape' + varName).value);
      params.scale = parseFloat(document.getElementById('scale' + varName).value);
  } else if (marginal === 'beta') {
      params.alpha = parseFloat(document.getElementById('alpha' + varName).value);
      params.beta = parseFloat(document.getElementById('beta' + varName).value);
  } else if (marginal === 'laplace') {
    params.mu = parseFloat(document.getElementById('mu' + varName).value);
    params.b = parseFloat(document.getElementById('b' + varName).value);
} else if (marginal === 'binomial') {
    params.n = parseInt(document.getElementById('n' + varName).value);
    params.p = parseFloat(document.getElementById('p' + varName).value);
} else if (marginal === 'negative_binomial') {
    params.r = parseInt(document.getElementById('r' + varName).value);
    params.p = parseFloat(document.getElementById('p' + varName).value);
} else if (marginal === 'poisson') {
    params.lambda = parseFloat(document.getElementById('lambda' + varName).value);
} else if (marginal === 'beta_prime') {
    params.alpha = parseFloat(document.getElementById('alpha' + varName).value);
    params.beta = parseFloat(document.getElementById('beta' + varName).value);
}

  return params;
}



document.getElementById('generateBtn').addEventListener('click', () => {
  if (!validateParameters()) {
      return;
  }
  const samples = generateSamples();
  plotSamples(samples);
  plotMarginalHistograms(samples);
  displaySamples(samples);
});


function plotSamples(samples) {
  const xData = samples.map(s => s[0]);
  const yData = samples.map(s => s[1]);

  const marginalX = document.getElementById('marginalX').value;
  const marginalY = document.getElementById('marginalY').value;

  // Apply jitter if both marginals are discrete
  let xPlotData = xData.slice();
  let yPlotData = yData.slice();

  if (isDiscrete(marginalX)) {
      xPlotData = xPlotData.map(x => x + (Math.random() - 0.5) * 0.2);
  }
  if (isDiscrete(marginalY)) {
      yPlotData = yPlotData.map(y => y + (Math.random() - 0.5) * 0.2);
  }

  const scatterTrace = {
      x: xPlotData,
      y: yPlotData,
      mode: 'markers',
      type: 'scatter',
      marker: { color: 'blue', size: 5 },
      name: 'Samples'
  };

  const data = [scatterTrace];

  // Existing code for contour plot...

  const layout = {
      title: 'Copula Samples',
      xaxis: { title: 'X' },
      yaxis: { title: 'Y' },
      showlegend: false,
      autosize:true,
  };

  Plotly.newPlot('plot', data, layout,{ responsive: true });
}

function isDiscrete(marginal) {
  return ['binomial', 'negative_binomial', 'poisson'].includes(marginal);
}


function plotMarginalHistograms(samples) {
  const xData = samples.map(s => s[0]);
  const yData = samples.map(s => s[1]);

  const traceX = {
      x: xData,
      type: 'histogram',
      name: 'X',
      marker: { color: 'blue' },
      opacity: 0.7,
      autobinx: true
  };

  const layoutX = {
      title: 'Histogram of X',
      xaxis: { title: 'X' },
      yaxis: { title: 'Frequency' },
      bargap: 0.05,
      autosize: true
  };

  const traceY = {
      x: yData,
      type: 'histogram',
      name: 'Y',
      marker: { color: 'green' },
      opacity: 0.7,
      autobinx: true
  };

  const layoutY = {
      title: 'Histogram of Y',
      xaxis: { title: 'Y' },
      yaxis: { title: 'Frequency' },
      bargap: 0.05,
      autosize: true
  };

  Plotly.newPlot('histogramX', [traceX], layoutX, { responsive: true });
  Plotly.newPlot('histogramY', [traceY], layoutY, { responsive: true });
}


// Display samples in textarea
function displaySamples(samples) {
  let sampleText = 'X, Y\n';
  samples.forEach(function(row) {
      sampleText += row.join(",") + "\n";
  });

  document.getElementById('sampleOutput').value = sampleText;
}

// Download CSV
document.getElementById('downloadBtn').addEventListener('click', () => {
  const samplesText = document.getElementById('sampleOutput').value;
  const csvContent = "data:text/csv;charset=utf-8," + samplesText;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'copula_samples.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Initialize correlation display
updateRhoDisplay(document.getElementById('rhoSlider').value);
