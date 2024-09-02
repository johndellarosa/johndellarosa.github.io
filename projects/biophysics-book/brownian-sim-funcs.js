document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('brownianChart').getContext('2d');
    let chart;
  
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
      const lineColor = document.getElementById('lineColor').value;
      const data = generateBrownianMotion(driftFunc, driftParams, volatilityFunc, volatilityCoeff, initialX, 1000, dt);
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [{
            label: 'Brownian Motion Path',
            data: data,
            borderColor: lineColor,
            borderWidth: 1,
            fill: false,
            pointRadius: 1 
          }]
        },
        options: {
          scales: {
            x: { 
              type: 'linear', 
              position: 'bottom',
              title: { display: true, text: 'Time' },
              grid: {
                display: true
              }
            },
            y: { 
              title: { display: true, text: 'Position' },
              grid: {
                display: true
              }
            }
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
  
      createChart(driftFunc, driftParams, volatilityFunc, volatilityCoeff, initialX, dt);
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



            // Initialize chart with default values
    updateChart();
  });
