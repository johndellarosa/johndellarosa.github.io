document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('brownianChart').getContext('2d');
    let chart;
    const driftFormSelect = document.getElementById('driftForm');
    const volatilityFormSelect = document.getElementById('volatilityForm');
    const driftCoefficientInput = document.getElementById('driftCoeff');
    const volatilityCoefficientInput = document.getElementById('volatilityCoeff');
    const longTermMeanInput = document.getElementById('longTermMean');
    const meanReversionRateInput = document.getElementById('meanReversionRate');
    const sdeEquation = document.getElementById('sde-equation');
    const meanReversionOptions = document.getElementById('meanReversionFields');

    const pathColorInput = document.getElementById('path-color');
    // const addPathBtn = document.getElementById('add-path-btn');
    const numPathsInput = document.getElementById('num-paths');
    const pathColorsDiv = document.getElementById('path-colors');
    // Store selected colors
    const pathColors = [];
    const generatePathsBtn = document.getElementById('generate-paths-btn');
    function updateSDE() {

      if (typeof MathJax === 'undefined') {
          // Wait for MathJax to be available
          setTimeout(updateSDE, 100);
          return;
      }

      const driftForm = driftFormSelect.value;
      const volatilityForm = volatilityFormSelect.value;
      const driftCoeff = driftCoefficientInput.value;
      const volatilityCoeff = volatilityCoefficientInput.value;
      const longTermMean = longTermMeanInput.value;
      const meanReversionRate = meanReversionRateInput.value;

      let driftFunction = '';
      let volatilityFunction = '';

      switch (driftForm) {
          case '1':
              driftFunction = `${driftCoeff}`;
              break;
          case 'x':
              driftFunction = `${driftCoeff}X_t`;
              break;
          case '1/x':
              driftFunction = `\\frac{${driftCoeff}}{X_t}`;
              break;
          case 'sqrt':
              driftFunction = `${driftCoeff}\\sqrt{X_t}`;
              break;
          case 'meanReversion':
              driftFunction = `${meanReversionRate}(${longTermMean} - X_t)`;
              break;
      }

      switch (volatilityForm) {
          case '1':
              volatilityFunction = `${volatilityCoeff}`;
              break;
          case 'x':
              volatilityFunction = `${volatilityCoeff}X_t`;
              break;
          case '1/x':
              volatilityFunction = `\\frac{${volatilityCoeff}}{X_t}`;
              break;
          case 'sqrt':
              volatilityFunction = `${volatilityCoeff}\\sqrt{X_t}`;
              break;
      }

      const sdeText = `dX_t = ${driftFunction} \\, dt + ${volatilityFunction} \\, dW_t`;
      sdeEquation.innerHTML = `\\(${sdeText}\\)`;
      // MathJax.Hub.Queue(["Typeset", MathJax.Hub, sdeEquation]);

      MathJax.typesetPromise([sdeEquation]).catch(function(err) {
          console.error('MathJax typeset error:', err);
      });
  }

      // Add event listeners to update SDE when any input changes
      driftFormSelect.addEventListener('change', updateSDE);
      volatilityFormSelect.addEventListener('change', updateSDE);
      driftCoefficientInput.addEventListener('input', updateSDE);
      volatilityCoefficientInput.addEventListener('input', updateSDE);
      longTermMeanInput.addEventListener('input', updateSDE);
      meanReversionRateInput.addEventListener('input', updateSDE);
  

  //   function addColorPickers(numPaths) {
  //     pathColorsDiv.innerHTML = ''; // Clear previous color pickers
  //     for (let i = 0; i < numPaths; i++) {
  //         const colorPicker = document.createElement('input');
  //         colorPicker.type = 'color';
  //         colorPicker.id = `path-color-${i + 1}`;
  //         colorPicker.value = `#${Math.floor(Math.random()*16777215).toString(16)}`; // Random color
  //         const label = document.createElement('label');
  //         label.textContent = `Color for Path ${i + 1}:`;
  //         pathColorsDiv.appendChild(label);
  //         pathColorsDiv.appendChild(colorPicker);
  //         pathColorsDiv.appendChild(document.createElement('br'));
  //     }
  // }

    // Function to create color pickers dynamically
  function updateColorPickers(numPaths) {
    const container = document.getElementById('color-picker-list');
    const currentPickers = container.getElementsByTagName('input');
    const newColors = [];
      // Collect existing colors
      for (let i = 0; i < currentPickers.length; i++) {
        newColors[i] = currentPickers[i].value;
    }
    
    container.innerHTML = ''; // Clear existing color pickers


    for (let i = 0; i < numPaths; i++) {
      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.id = `path-color-${i + 1}`;
      colorInput.value = newColors[i] || getRandomColor(); // Use stored color or generate a random one

      const label = document.createElement('label');
      label.textContent = `Path ${i + 1}: `;
      label.appendChild(colorInput);

      container.appendChild(label);
      container.appendChild(document.createElement('br'));
    }

    // Show color picker container
    document.getElementById('color-picker-container').style.display = 'block';
  }

  
    function generateBrownianMotion(driftFunc, driftParams, volatilityFunc, volatilityCoeff, initialX, steps, dt = 0.01) {
      const data = [];
      let x = initialX;
      for (let i = 0; i < steps; i++) {
        const currentTime = i * dt;
        const drift = driftFunc(currentTime, x, ...driftParams);
        const volatility = volatilityCoeff * volatilityFunc(currentTime,x);
        x += drift * dt + volatility * Math.sqrt(dt) * (Math.random() - 0.5);
        data.push({ x: currentTime, y: x });
      }
      return data;
    }

    
  
    function createChart(driftFunc, driftParams, volatilityFunc, volatilityCoeff, initialX, dt) {
      if (chart) {
        chart.destroy();
      }
      // const lineColor = document.getElementById('lineColor').value;
      // const data = generateBrownianMotion(driftFunc, driftParams, volatilityFunc, volatilityCoeff, initialX, 1000, dt);
      
      const numPaths = parseInt(numPathsInput.value);
      const initialPosition = parseFloat(document.getElementById('initialX').value);
      // const timeIncrement = parseFloat(document.getElementById('timeIncrement').value);
        // Store selected colors
      //   for (let i = 0; i < numPaths; i++) {
      //     const colorPicker = document.getElementById(`path-color-${i + 1}`);
      //     pathColors[i] = colorPicker.value;
      // }
      // Generate paths
      const chartTitle = document.getElementById('chart-title').value;
      const lineWidth = parseInt(document.getElementById('line-width').value);
      const pointRadius = parseInt(document.getElementById('point-radius').value);
      // const backgroundColor = document.getElementById('background-color').value;
  
      const pathColors = [];
      const datasets = [];
      for (let i = 0; i < numPaths; i++) {
        const path = [];
        let x = initialPosition;
        // const data = [];
        const colorPicker = document.getElementById(`path-color-${i + 1}`);
        const color = colorPicker ? colorPicker.value : '#ff0000'; // Default to red if no color picker
        const data = generateBrownianMotion(driftFunc, driftParams, volatilityFunc, volatilityCoeff, initialX, 1000, dt);
        // console.log(data);
        datasets.push({
          label: `Path ${i + 1}`,
          data: data,
          borderColor: color,

          fill: false,
          borderWidth: lineWidth,
          pointRadius: pointRadius
      });
      }

      console.log(datasets);
      // chart = new Chart(ctx, {
      //   type: 'line',
      //   data: {
      //     datasets: [{
      //       label: 'Brownian Motion Path',
      //       data: {
      //         datasets: datasets
      //     },
      //       borderColor: lineColor,
      //       borderWidth: 1,
      //       fill: false,
      //       pointRadius: 1 
      //     }]
      //   },
      //   options: {
      //     scales: {
      //       x: { 
      //         type: 'linear', 
      //         position: 'bottom',
      //         title: { display: true, text: 'Time' },
      //         grid: {
      //           display: true
      //         }
      //       },
      //       y: { 
      //         title: { display: true, text: 'Position' },
      //         grid: {
      //           display: true
      //         }
      //       }
      //     }
      //   },
      //   plugins: {
      //       tooltip: {
      //         callbacks: {
      //           label: function(context) {
      //             return `Time: ${context.raw.x}, Position: ${context.raw.y}`;
      //           }
      //         }
      //       },
      //       legend: {
      //         display: true
      //       }
      //     }
      // });

    //   chart = new Chart(ctx, {
    //     type: 'line',
    //     data: {
    //         datasets: datasets
    //     },
    //     options: {
    //         scales: {
    //             x: { title: { display: true, text: 'Time' } },
    //             y: { title: { display: true, text: 'X_t' } }
    //         }
    //     }
    // });

    chart = new Chart(ctx, {
      type: 'line',
      data: {
          datasets: datasets
      },
      options: {
          responsive: true,
          plugins: {
              legend: {
                  display: true,
                  position: 'top'
              },
              tooltip: {
                  mode: 'index',
                  intersect: false
              },
              title: {
                display: true,
                text: chartTitle
            }
          },
          scales: {
              x: {
                  type: 'linear',
                  position: 'bottom',
                  title: {
                      display: true,
                      text: 'Time'
                  }
              },
              y: {
                  title: {
                      display: true,
                      text: 'X_t'
                  }
              }
          },
          elements: {
            // line: {
            //     backgroundColor: 'rgba(0,0,0,0)',
            // }
        }
      },
      plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `Time: ${context.raw.x}, Position: ${context.raw.y}`;
                  }
                }
              },
              legend: {
                display: true
              }
            }
  });
    }

    // generatePathsBtn.addEventListener('click', () => {
    //   const numPaths = parseInt(numPathsInput.value);
    //   addColorPickers(numPaths);
    //   generatePaths();
    // });
//     function generatePaths() {
//       const numPaths = parseInt(numPathsInput.value);
//       const initialPosition = parseFloat(document.getElementById('initialX').value);
//       const timeIncrement = parseFloat(document.getElementById('timeIncrement').value);

//       // Generate paths
//       const datasets = [];
//       for (let i = 0; i < numPaths; i++) {
//           const path = [];
//           let x = initialPosition;
//           const data = [];
//           const colorPicker = document.getElementById(`path-color-${i + 1}`);
//           const color = colorPicker ? colorPicker.value : '#ff0000'; // Default to red if no color picker

//           for (let t = 0; t <= 1; t += timeIncrement) {
//               const dt = timeIncrement;
//               const dW = Math.sqrt(dt) * Math.random(); // Simulate dW
//               let drift = 1;
//               let volatility = 1;

//               if (driftFormSelect.value === 'x') {
//                   drift = x;
//               } else if (driftFormSelect.value === '1/x') {
//                   drift = 1 / x;
//               } else if (driftFormSelect.value === 'mean-reversion') {
//                   drift = meanReversionRateInput.value * (longTermMeanInput.value - x);
//               }

//               if (volatilityFormSelect.value === 'x') {
//                   volatility = x;
//               } else if (volatilityFormSelect.value === '1/x') {
//                   volatility = 1 / x;
//               }

//               x += driftCoefficientInput.value * drift * dt + volatilityCoefficientInput.value * volatility * dW;
//               data.push({ x: t, y: x });
//           }

          

//           datasets.push({
//               label: `Path ${i + 1}`,
//               data: data,
//               borderColor: color,
//               fill: false,
//               borderWidth: 1,
//               pointRadius: 2
//           });
//       }
//       if (chart) {
//         chart.destroy();
//     }

//     chart = new Chart(ctx, {
//         type: 'line',
//         data: {
//             datasets: datasets
//         },
//         options: {
//             scales: {
//                 x: { title: { display: true, text: 'Time' } },
//                 y: { title: { display: true, text: 'X_t' } }
//             }
//         }
//     });

// updateSDE();
// }

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
  
    function updateChart() {
      const driftForm = document.getElementById('driftForm').value;
      const volatilityForm = document.getElementById('volatilityForm').value;
  
      const driftCoeff = parseFloat(document.getElementById('driftCoeff').value) || 0;
      const volatilityCoeff = parseFloat(document.getElementById('volatilityCoeff').value) || 1;
      const initialX = parseFloat(document.getElementById('initialX').value) || 0;
      const longTermMean = parseFloat(document.getElementById('longTermMean').value) || 0;
      const meanReversionRate = parseFloat(document.getElementById('meanReversionRate').value) || 0;
      const dt = parseFloat(document.getElementById('timeIncrement').value) || 0.01;
      
      const driftFunc = getFunction(driftForm, driftCoeff);
      const driftParams = driftForm === 'meanReversion' ? [longTermMean, meanReversionRate] : [];
      const volatilityFunc = getFunction(volatilityForm);
      const numPaths = parseInt(numPathsInput.value);
      // addColorPickers(numPaths);
      updateColorPickers(numPaths);
      createChart(driftFunc, driftParams, volatilityFunc, volatilityCoeff, initialX, dt);
      updateSDE();
    }
  
    function getFunction(form, coeff = 1) {
      switch (form) {
        case 'meanReversion':
          return (t, x, mean, kappa) => kappa * (mean - x);
        case 'x':
          return (t,x) => coeff * x; // Drift based on x, multiplied by coeff
        case '1/x':
          return (t, x) => coeff * (x === 0 ? 1 : 1 / x); // Drift based on 1/x, multiplied by coeff
        case 'sqrt':
            return (x) => coeff* Math.sqrt(x);
        case '1': // For basic Brownian motion
          return () => coeff; // Updated to return coeff for standard Brownian motion
        default:
          return () => 0; // Default to coeff if form is not recognized
      }
    }
  
    // Attach event listener to the button
    // document.getElementById('updateButton').addEventListener('click', updateChart);
  
    // Function to toggle mean reversion fields
    function toggleMeanReversionFields() {
        const driftForm = document.getElementById('driftForm').value;
        const meanReversionFields = document.getElementById('meanReversionFields');
        if (driftForm === 'meanReversion') {
        meanReversionFields.style.display = 'block';
        } else {
        meanReversionFields.style.display = 'none';
        }
    }
  // Attach event listener to the driftForm select element
  document.getElementById('driftForm').addEventListener('change', toggleMeanReversionFields);

    document.getElementById('updateButton').addEventListener('click', updateChart);

    // Save chart as an image
    document.getElementById('saveButton').addEventListener('click', () => {
        if (chart) {
            const url = chart.toBase64Image();
            const link = document.createElement('a');
            link.href = url;
            link.download = 'brownian_motion.png';
            link.click();
        } else {
            alert('No chart available to save.');
        }
        });

    document.getElementById('num-paths').addEventListener('change', () => {
      const numPaths = parseInt(numPathsInput.value);
      // addColorPickers(numPaths);
      updateColorPickers(numPaths);
    });

            // Initialize chart with default values
    updateChart();
    if (typeof MathJax !== 'undefined') {
      updateSDE();
  } else {
      document.addEventListener('mathjax-ready', updateSDE);
  }
  document.getElementById('resetButton').addEventListener('click', () => {
    document.getElementById('driftForm').value = '1';
    document.getElementById('volatilityForm').value = '1';
    document.getElementById('driftCoeff').value = 0;
    document.getElementById('volatilityCoeff').value = 1;
    document.getElementById('initialX').value = 0;
    document.getElementById('longTermMean').value = 0;
    document.getElementById('meanReversionRate').value = 0;
    updateChart();
});

document.getElementById('basic-brownian-btn').addEventListener('click', () => {
  setProcessType('basic-brownian');
});

document.getElementById('gbm-btn').addEventListener('click', () => {
  setProcessType('gbm');
});

document.getElementById('bessel-btn').addEventListener('click', () => {
  setProcessType('bessel');
});

function setProcessType(type) {
  const driftFormSelect = document.getElementById('driftForm');
  const volatilityFormSelect = document.getElementById('volatilityForm');
  const meanReversionRateInput = document.getElementById('meanReversionRate');
  const longTermMeanInput = document.getElementById('longTermMean');
  const initialX = document.getElementById('initialX');
  const driftCoeff = document.getElementById('driftCoeff')
  const volatilityCoeff = document.getElementById('volatilityCoeff')
      
  switch (type) {
      case 'basic-brownian':
          driftFormSelect.value = '1';
          volatilityFormSelect.value = '1';
          meanReversionRateInput.value = '';
          longTermMeanInput.value = '';
          initialX.value = '0';
          driftCoeff.value = '0';
          volatilityCoeff.value = '1';
          break;
      case 'gbm':
          driftFormSelect.value = 'x';
          volatilityFormSelect.value = 'x';
          meanReversionRateInput.value = '';
          longTermMeanInput.value = '';
          initialX.value = '1';
          driftCoeff.value = '0.1';
          volatilityCoeff.value = '0.1';
          break;
      case 'bessel':
          driftFormSelect.value = '1/x';
          volatilityFormSelect.value = '1';
          meanReversionRateInput.value = ''; // Example value for Bessel
          longTermMeanInput.value = '';
          initialX.value = '1';
          driftCoeff.value = '0.5';
          volatilityCoeff.value = '1';
          break;
  }
}

document.getElementById('exportButton').addEventListener('click', () => {
  if (chart) {
    const data = chart.data.datasets[0].data;
    let csvContent = "data:text/csv;charset=utf-8," 
      + "Time,Position\n"
      + data.map(e => `${e.x},${e.y}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'brownian_motion_data.csv');
    link.click();
  } else {
    alert('No chart data available to export.');
  }
});
  });

  function exportData() {
    if (chart) {
        const datasets = chart.data.datasets;
        const csv = datasets.map(dataset => {
            const header = 'Time,X_t';
            const rows = dataset.data.map(point => `${point.x},${point.y}`);
            return [header, ...rows].join('\n');
        }).join('\n\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'brownian_motion.csv';
        link.click();
    }

}

