// Function to compute the bivariate normal PDF
function bivariateNormalPDF(x, y, muX, muY, sigmaX, sigmaY, rho) {
  const z = ((x - muX) / sigmaX) ** 2 - 2 * rho * ((x - muX) / sigmaX) * ((y - muY) / sigmaY) + ((y - muY) / sigmaY) ** 2;
  const denominator = 2 * Math.PI * sigmaX * sigmaY * Math.sqrt(1 - rho ** 2);
  return Math.exp(-z / (2 * (1 - rho ** 2))) / denominator;
}

// Function to compute the bivariate t-distribution PDF
function bivariateTPDF(x, y, muX, muY, sigmaX, sigmaY, rho, df = 4) {
  const z = ((x - muX) / sigmaX) ** 2 - 2 * rho * ((x - muX) / sigmaX) * ((y - muY) / sigmaY) + ((y - muY) / sigmaY) ** 2;
  const normalization = Math.gamma((df + 2) / 2) / (Math.gamma(df / 2) * df * Math.PI * sigmaX * sigmaY * Math.sqrt(1 - rho ** 2));
  return normalization * Math.pow(1 + z / df, -(df + 2) / 2);
}

function updateMarkerSizeDisplay(value) {
  document.getElementById('markerSizeDisplay').textContent = value;
}

// Function to compute the bivariate Laplace PDF
function bivariateLaplacePDF(x, y, muX, muY, sigmaX, sigmaY, rho) {
  const z = ((x - muX) / sigmaX) ** 2 - 2 * rho * ((x - muX) / sigmaX) * ((y - muY) / sigmaY) + ((y - muY) / sigmaY) ** 2;
  const denominator = 2 * sigmaX * sigmaY * Math.sqrt(1 - rho ** 2);
  return Math.exp(-Math.sqrt(z)) / denominator;
}

// Function to generate grid data
function generateGrid(muX, muY, sigmaX, sigmaY, rho, distType) {
  const numPoints = 100;
  const rangeX = 4 * sigmaX;
  const rangeY = 4 * sigmaY;
  const xMin = muX - rangeX;
  const xMax = muX + rangeX;
  const yMin = muY - rangeY;
  const yMax = muY + rangeY;
  const xValues = [];
  const yValues = [];
  const zValues = [];

  for (let i = 0; i < numPoints; i++) {
      const x = xMin + (xMax - xMin) * i / (numPoints - 1);
      xValues.push(x);
  }

  for (let j = 0; j < numPoints; j++) {
      const y = yMin + (yMax - yMin) * j / (numPoints - 1);
      yValues.push(y);
  }

  for (let j = 0; j < numPoints; j++) {
      const row = [];
      for (let i = 0; i < numPoints; i++) {
          let z;
          if (distType === 'normal') {
              z = bivariateNormalPDF(xValues[i], yValues[j], muX, muY, sigmaX, sigmaY, rho);
          } else if (distType === 't') {
              z = bivariateTPDF(xValues[i], yValues[j], muX, muY, sigmaX, sigmaY, rho);
          } else if (distType === 'laplace') {
              z = bivariateLaplacePDF(xValues[i], yValues[j], muX, muY, sigmaX, sigmaY, rho);
          }
          row.push(z);
      }
      zValues.push(row);
  }

  return { x: xValues, y: yValues, z: zValues };
}

function updateRhoDisplay(value) {
  document.getElementById('rhoDisplay').textContent = value;
}


function generateSamples(muX, muY, sigmaX, sigmaY, rho, numSamples) {
  const samples = [];
  const cov = [
      [sigmaX ** 2, rho * sigmaX * sigmaY],
      [rho * sigmaX * sigmaY, sigmaY ** 2]
  ];

  // Cholesky decomposition
  const L = [
      [Math.sqrt(cov[0][0]), 0],
      [
          cov[1][0] / Math.sqrt(cov[0][0]),
          Math.sqrt(cov[1][1] - (cov[1][0] ** 2) / cov[0][0])
      ]
  ];

  let sampleText = '';

  for (let i = 0; i < numSamples; i++) {
      // Generate two independent standard normal random variables using Box-Muller transform
      let u1 = Math.random();
      let u2 = Math.random();
      let z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      let z2 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);

      // Transform
      let x = L[0][0] * z1 + L[0][1] * z2 + muX;
      let y = L[1][0] * z1 + L[1][1] * z2 + muY;
      samples.push([x, y]);

      // Add to text area
      sampleText += `(${x.toFixed(4)}, ${y.toFixed(4)})\n`;
  }

  // Update the text area with sample coordinates
  document.getElementById('sampleOutput').value = sampleText;

  return samples;
}


function plotContour(gridData, samples = null) {
  const heatmapColor = document.getElementById('heatmapColor').value;  // Get selected heatmap color
  const markerColor = document.getElementById('markerColor').value;    // Get selected marker color
  const markerSize = parseInt(document.getElementById('markerSize').value);  // Get marker size from slider
  let isMobile = window.matchMedia("only screen and (max-width: 767px)").matches;
  
  const contour = {
      x: gridData.x,
      y: gridData.y,
      z: gridData.z,
      type: 'contour',
      colorscale: heatmapColor,
      // showscale: isMobile? false:true,
      contours: {
          coloring: 'heatmap',
          showlegend:false,
      },
      legend:{
        showlegend:false,
      },

      name: 'PDF Contour'
  };

  const data = [contour];

  if (samples) {
      const sampleTrace = {
          x: samples.map(s => s[0]),
          y: samples.map(s => s[1]),
          mode: 'markers',
          type: 'scatter',
          name: 'Samples',
          marker: { color: markerColor, size: markerSize },
          showlegend:false,
      };
      data.push(sampleTrace);
  }

  const layout = {
      title: 'Multivariate Distribution',
      xaxis: { title: 'X' },
      yaxis: { title: 'Y' },
      showlegend: false,
      autosize:true,
  };

  Plotly.newPlot('plot', data, layout, { responsive: true });
}

// Event listeners for buttons
document.getElementById('plotBtn').addEventListener('click', () => {
  // Get user inputs
  const muX = parseFloat(document.getElementById('muX').value);
  const muY = parseFloat(document.getElementById('muY').value);
  const sigmaX = parseFloat(document.getElementById('sigmaX').value);
  const sigmaY = parseFloat(document.getElementById('sigmaY').value);
  const rho = parseFloat(document.getElementById('rhoSlider').value);
  const distType = document.getElementById('distType').value;

  // Validate inputs
  if (sigmaX <= 0 || sigmaY <= 0) {
      alert('Standard deviations must be positive.');
      return;
  }
  if (rho <= -1 || rho >= 1) {
      alert('Correlation coefficient must be between -1 and 1 (exclusive).');
      return;
  }

  // Generate grid data
  const gridData = generateGrid(muX, muY, sigmaX, sigmaY, rho, distType);

  // Plot contour without samples
  plotContour(gridData);
});

document.getElementById('sampleBtn').addEventListener('click', () => {
  // Get user inputs
  const muX = parseFloat(document.getElementById('muX').value);
  const muY = parseFloat(document.getElementById('muY').value);
  const sigmaX = parseFloat(document.getElementById('sigmaX').value);
  const sigmaY = parseFloat(document.getElementById('sigmaY').value);
  const rho = parseFloat(document.getElementById('rhoSlider').value);
  const numSamples = parseInt(document.getElementById('samples').value);
  const distType = document.getElementById('distType').value;

  // Validate inputs
  if (sigmaX <= 0 || sigmaY <= 0) {
      alert('Standard deviations must be positive.');
      return;
  }
  if (rho <= -1 || rho >= 1) {
      alert('Correlation coefficient must be between -1 and 1 (exclusive).');
      return;
  }
  if (numSamples <= 0) {
      alert('Number of samples must be a positive integer.');
      return;
  }

  // Generate grid data
  const gridData = generateGrid(muX, muY, sigmaX, sigmaY, rho, distType);

  // Generate samples
  const samples = generateSamples(muX, muY, sigmaX, sigmaY, rho, numSamples);

  // Plot contour with samples
  plotContour(gridData, samples);
});

// Initial plot
window.onload = () => {
  document.getElementById('plotBtn').click();
};


function downloadCSV(samples) {
  let csvContent = "data:text/csv;charset=utf-8,X,Y\n";
  
  samples.forEach(function(row) {
      csvContent += row.join(",") + "\n"; // Join X and Y with commas
  });

  // Create a hidden download link
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'samples.csv');

  // Append link to the document and trigger the download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Attach event listener to the download button
document.getElementById('downloadBtn').addEventListener('click', () => {
  // Trigger the CSV download with the current sample data
  const samples = generateSamples(muX, muY, sigmaX, sigmaY, rho, numSamples);
  downloadCSV(samples);
});