// Function to compute the bivariate normal PDF
function bivariateNormalPDF(x, y, muX, muY, sigmaX, sigmaY, rho) {
  const z = ((x - muX) / sigmaX) ** 2 - 2 * rho * ((x - muX) / sigmaX) * ((y - muY) / sigmaY) + ((y - muY) / sigmaY) ** 2;
  const denominator = 2 * Math.PI * sigmaX * sigmaY * Math.sqrt(1 - rho ** 2);
  return Math.exp(-z / (2 * (1 - rho ** 2))) / denominator;
}

function bivariateTPDF(x, y, muX, muY, sigmaX, sigmaY, rho, df = 4) {
  const z = ((x - muX) / sigmaX) ** 2 - 2 * rho * ((x - muX) / sigmaX) * ((y - muY) / sigmaY) + ((y - muY) / sigmaY) ** 2;
  
  // Prevent z from being negative due to floating-point errors
  const adjustedZ = Math.max(z, 0);
  
  const normalizationNumerator = jStat.gammafn((df + 2) / 2);
  const normalizationDenominator = jStat.gammafn(df / 2) * df * Math.PI * sigmaX * sigmaY * Math.sqrt(1 - rho ** 2);
  const normalization = normalizationNumerator / normalizationDenominator;
  
  // Log intermediate values for debugging
  // console.log(`bivariateTPDF - x: ${x}, y: ${y}, z: ${z}, adjustedZ: ${adjustedZ}, normalization: ${normalization}`);
  
  // Compute the PDF value
  const pdf = normalization * Math.pow(1 + adjustedZ / df, -(df + 2) / 2);
  
  // Log the final PDF value
  // console.log(`bivariateTPDF - PDF: ${pdf}`);
  
  // Handle potential numerical issues
  if (!isFinite(pdf) || pdf < 0) {
      console.warn(`Invalid PDF value encountered at x: ${x}, y: ${y}`);
      return 0;
  }
  
  return pdf;
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

function generateGrid(muX, muY, sigmaX, sigmaY, rho, distType, df = 4, xMin, xMax, yMin, yMax) {
  const numPoints = 100;

  // If bounds are not provided, set them based on distribution type
  if (xMin === undefined || xMax === undefined || yMin === undefined || yMax === undefined) {
      if (distType === 't') {
          // Calculate the t-quantile for 99% coverage
          const tQuantile = jStat.studentt.inv(0.995, df); // 99% coverage
          const rangeX = tQuantile * sigmaX;
          const rangeY = tQuantile * sigmaY;

          console.log(`t-quantile (99% coverage) for df=${df}: ${tQuantile}`);

          xMin = muX - rangeX;
          xMax = muX + rangeX;
          yMin = muY - rangeY;
          yMax = muY + rangeY;
      } else {
          // For normal and Laplace distributions, use 4 standard deviations
          const rangeX = 4 * sigmaX;
          const rangeY = 4 * sigmaY;

          xMin = muX - rangeX;
          xMax = muX + rangeX;
          yMin = muY - rangeY;
          yMax = muY + rangeY;
      }
  }

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
              z = bivariateTPDF(xValues[i], yValues[j], muX, muY, sigmaX, sigmaY, rho, df);
          } else if (distType === 'laplace') {
              z = bivariateLaplacePDF(xValues[i], yValues[j], muX, muY, sigmaX, sigmaY, rho);
          }
          row.push(z);
      }
      zValues.push(row);
  }

  // Log min and max z-values for debugging
  const flattenedZ = zValues.flat();
  const zMin = Math.min(...flattenedZ);
  const zMax = Math.max(...flattenedZ);
  console.log(`generateGrid - zMin: ${zMin}, zMax: ${zMax}`);

  return { x: xValues, y: yValues, z: zValues };
}



function updateRhoDisplay(value) {
  document.getElementById('rhoDisplay').textContent = value;
}
// Function to toggle the display of degrees of freedom input
function toggleDFInput() {
  const distType = document.getElementById('distType').value;
  const dfGroup = document.getElementById('df-group');
  if (distType === 't') {
      dfGroup.style.display = 'flex';
  } else {
      dfGroup.style.display = 'none';
  }
}

// Function to generate samples and plot them within a dynamically determined grid
function generateSamplesAndPlot(muX, muY, sigmaX, sigmaY, rho, numSamples, distType, df = 4) {
  const samples = [];
  const cov = [
      [sigmaX ** 2, rho * sigmaX * sigmaY],
      [rho * sigmaX * sigmaY, sigmaY ** 2]
  ];

  // Cholesky decomposition for 2x2 matrix
  const L = [
      [Math.sqrt(cov[0][0]), 0],
      [
          cov[1][0] / Math.sqrt(cov[0][0]),
          Math.sqrt(cov[1][1] - (cov[1][0] ** 2) / cov[0][0])
      ]
  ];

  // Log the Cholesky matrix for debugging
  console.log('Cholesky Decomposition Matrix L:', L);

  // Clear the textarea before adding new samples
  document.getElementById('sampleOutput').value = '';

  for (let i = 0; i < numSamples; i++) {
      // Generate two independent standard normal random variables using Box-Muller transform
      let u1 = Math.random();
      let u2 = Math.random();
      let z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      let z2 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);

      let x, y;

      if (distType === 'normal') {
          // Transform for normal distribution
          x = L[0][0] * z1 + L[0][1] * z2 + muX;
          y = L[1][0] * z1 + L[1][1] * z2 + muY;
      } else if (distType === 't') {
          // Transform for t-distribution
          let chiSquared = jStat.chisquare.sample(df);
          let sqrtChi = Math.sqrt(chiSquared / df);
          // Prevent division by zero
          if (sqrtChi === 0) {
              console.warn(`Sample ${i + 1}: sqrtChi is zero. Adjusting to a small positive number.`);
              sqrtChi = 1e-10; // Adjusted to a small positive number
          }
          x = L[0][0] * z1 / sqrtChi + muX;
          y = L[1][0] * z1 / sqrtChi + L[1][1] * z2 / sqrtChi + muY;
      } else if (distType === 'laplace') {
          // Transform for Laplace distribution
          // Using symmetric Laplace distribution: difference of two independent exponential variables
          const e1 = Math.random() < 0.5 ? -Math.log(1 - Math.random()) : Math.log(1 - Math.random());
          const e2 = Math.random() < 0.5 ? -Math.log(1 - Math.random()) : Math.log(1 - Math.random());
          x = muX + e1;
          y = muY + e2;
      }

      // Debugging: Log x and y values
      console.log(`Sample ${i + 1}: x = ${x}, y = ${y}`);

      // Check if x and y are valid numbers
      if (isNaN(x) || isNaN(y)) {
          console.error(`Sample ${i + 1}: x or y is NaN. Skipping this sample.`);
          continue; // Skip this iteration and do not add to samples
      }

      samples.push([x, y]);

      // Add to text area
      document.getElementById('sampleOutput').value += `(${x.toFixed(4)}, ${y.toFixed(4)})\n`;
  }

  // Store samples globally for download
  generatedSamples = samples;

  // Determine the range of the samples
  const xValues = samples.map(s => s[0]);
  const yValues = samples.map(s => s[1]);
  const xMinSample = Math.min(...xValues);
  const xMaxSample = Math.max(...xValues);
  const yMinSample = Math.min(...yValues);
  const yMaxSample = Math.max(...yValues);

  // Add padding (10%) to the range
  const paddingX = (xMaxSample - xMinSample) * 0.1;
  const paddingY = (yMaxSample - yMinSample) * 0.1;

  const xMin = xMinSample - paddingX;
  const xMax = xMaxSample + paddingX;
  const yMin = yMinSample - paddingY;
  const yMax = yMaxSample + paddingY;

  console.log(`Sample Range: X [${xMinSample}, ${xMaxSample}], Y [${yMinSample}, ${yMaxSample}]`);
  console.log(`Grid Range with Padding: X [${xMin}, ${xMax}], Y [${yMin}, ${yMax}]`);

  // Generate grid data based on the sample range
  const gridData = generateGrid(muX, muY, sigmaX, sigmaY, rho, distType, df, xMin, xMax, yMin, yMax);

  // Plot heatmap and samples
  plotContour(gridData, samples);
}



// Function to generate samples
function generateSamples(muX, muY, sigmaX, sigmaY, rho, numSamples, distType, df = 4) {
  const samples = [];
  const cov = [
      [sigmaX ** 2, rho * sigmaX * sigmaY],
      [rho * sigmaX * sigmaY, sigmaY ** 2]
  ];

  // Cholesky decomposition for 2x2 matrix
  const L = [
      [Math.sqrt(cov[0][0]), 0],
      [
          cov[1][0] / Math.sqrt(cov[0][0]),
          Math.sqrt(cov[1][1] - (cov[1][0] ** 2) / cov[0][0])
      ]
  ];

  // Log the Cholesky matrix for debugging
  // console.log('Cholesky Decomposition Matrix L:', L);

  // Clear the textarea before adding new samples
  document.getElementById('sampleOutput').value = '';

  for (let i = 0; i < numSamples; i++) {
      // Generate two independent standard normal random variables using Box-Muller transform
      let u1 = Math.random();
      let u2 = Math.random();
      let z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      let z2 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);

      let x, y;

      if (distType === 'normal') {
          // Transform for normal distribution
          x = L[0][0] * z1 + L[0][1] * z2 + muX;
          y = L[1][0] * z1 + L[1][1] * z2 + muY;
      } else if (distType === 't') {
          // Transform for t-distribution
          let chiSquared = jStat.chisquare.sample(df);
          let sqrtChi = Math.sqrt(chiSquared / df);
          // Prevent division by zero
          if (sqrtChi === 0) {
              console.warn(`Sample ${i + 1}: sqrtChi is zero. Adjusting to a small positive number.`);
              sqrtChi = 1e-10; // Adjusted to a small positive number
          }
          x = L[0][0] * z1 / sqrtChi + muX;
          y = L[1][0] * z1 / sqrtChi + L[1][1] * z2 / sqrtChi + muY;
      } else if (distType === 'laplace') {
          // Transform for Laplace distribution
          // Using symmetric Laplace distribution: difference of two independent exponential variables
          const e1 = Math.random() < 0.5 ? -Math.log(1 - Math.random()) : Math.log(1 - Math.random());
          const e2 = Math.random() < 0.5 ? -Math.log(1 - Math.random()) : Math.log(1 - Math.random());
          x = muX + e1;
          y = muY + e2;
      }

      // Debugging: Log x and y values
      // console.log(`Sample ${i + 1}: x = ${x}, y = ${y}`);

      // Check if x and y are valid numbers
      if (isNaN(x) || isNaN(y)) {
          console.error(`Sample ${i + 1}: x or y is NaN. Skipping this sample.`);
          continue; // Skip this iteration and do not add to samples
      }

      samples.push([x, y]);

      // Add to text area
      document.getElementById('sampleOutput').value += `(${x.toFixed(4)}, ${y.toFixed(4)})\n`;
  }

  // Store samples globally for download
  generatedSamples = samples;

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
      colorbar: {
        title:'Density',
        orientation:'h',
        thickness:10,
    },
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
      margin:{
        l:isMobile? 40:60,
        r:isMobile? 20:40,
      }
  };

  Plotly.newPlot('plot', data, layout, { responsive: true });
}

document.getElementById('plotBtn').addEventListener('click', () => {
  // Get user inputs
  const muX = parseFloat(document.getElementById('muX').value);
  const muY = parseFloat(document.getElementById('muY').value);
  const sigmaX = parseFloat(document.getElementById('sigmaX').value);
  const sigmaY = parseFloat(document.getElementById('sigmaY').value);
  const rho = parseFloat(document.getElementById('rhoSlider').value);
  const distType = document.getElementById('distType').value;
  const df = document.getElementById('dfSlider') ? parseInt(document.getElementById('dfSlider').value) : 4; // Default to 4 if not provided

  // Validate inputs
  if (sigmaX <= 0 || sigmaY <= 0) {
      alert('Standard deviations must be positive.');
      return;
  }
  if (rho <= -1 || rho >= 1) {
      alert('Correlation coefficient must be between -1 and 1 (exclusive).');
      return;
  }
  if (distType === 't' && (isNaN(df) || df <= 0)) {
      alert('Degrees of freedom must be a positive integer.');
      return;
  }

  // Determine default grid bounds based on distribution type
  let xMin, xMax, yMin, yMax;

  if (distType === 't') {
      const tQuantile = jStat.studentt.inv(0.995, df); // 99% coverage
      xMin = muX - tQuantile * sigmaX;
      xMax = muX + tQuantile * sigmaX;
      yMin = muY - tQuantile * sigmaY;
      yMax = muY + tQuantile * sigmaY;
      console.log(`Plot Grid Range for t-Distribution: X [${xMin}, ${xMax}], Y [${yMin}, ${yMax}]`);
  } else {
      const rangeX = 4 * sigmaX;
      const rangeY = 4 * sigmaY;
      xMin = muX - rangeX;
      xMax = muX + rangeX;
      yMin = muY - rangeY;
      yMax = muY + rangeY;
      console.log(`Plot Grid Range for ${distType.charAt(0).toUpperCase() + distType.slice(1)} Distribution: X [${xMin}, ${xMax}], Y [${yMin}, ${yMax}]`);
  }

  // Generate grid data
  const gridData = generateGrid(muX, muY, sigmaX, sigmaY, rho, distType, df, xMin, xMax, yMin, yMax);

  // Plot heatmap without samples
  plotContour(gridData, null);

  // Disable the download button since no samples are generated
  document.getElementById('downloadBtn').disabled = true;
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
  const df = document.getElementById('dfSlider') ? parseInt(document.getElementById('dfSlider').value) : 4; // Default to 4 if not provided

  // Validate inputs
  if (sigmaX <= 0 || sigmaY <= 0) {
      alert('Standard deviations must be positive.');
      return;
  }
  if (rho <= -1 || rho >= 1) {
      alert('Correlation coefficient must be between -1 and 1 (exclusive).');
      return;
  }
  if (numSamples <= 0 || !Number.isInteger(numSamples)) {
      alert('Number of samples must be a positive integer.');
      return;
  }
  if (distType === 't' && (isNaN(df) || df <= 0)) {
      alert('Degrees of freedom must be a positive integer.');
      return;
  }

  // Generate samples and plot
  generateSamplesAndPlot(muX, muY, sigmaX, sigmaY, rho, numSamples, distType, df);

  // Enable the download button
  if (generatedSamples.length > 0) {
      document.getElementById('downloadBtn').disabled = false;
  } else {
      document.getElementById('downloadBtn').disabled = true;
  }
});




// Initial plot
window.onload = () => {
  document.getElementById('plotBtn').click();
};


function downloadCSV(samples) {

  if (!samples || samples.length === 0) {
    alert('No samples available to download. Please generate samples first.');
    return;
}

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
  const samples = generateSamples(muX, muY, sigmaX, sigmaY, rho, numSamples,df);
  downloadCSV(samples);
});