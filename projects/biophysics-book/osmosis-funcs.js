let particles = [];
    let membraneX;
    let canvasWidth = 800;
    let canvasHeight = 400;

    // GUI elements
    let leftSoluteSlider, rightSoluteSlider, waterMoleculeSlider;
    let waterPermeabilitySlider, solutePermeabilitySlider, temperatureSlider;
    let resetButton;

    // Value display elements
    let leftSoluteValue, rightSoluteValue, waterMoleculeValue;
    let waterPermeabilityValue, solutePermeabilityValue, temperatureValue;

    let soluteLeftCountIndicator, soluteRightCountIndicator;

    // Membrane properties
    let membraneThickness = 4;
    let membraneShiftSpeed = 2; // Increased shift speed for visibility
    let membraneXInitial;
    let membraneShift = 0; // Current shift

    // Pressure indicators
    let pressureLeftIndicator, pressureRightIndicator;

    // Water molecule count indicators
    let waterLeftCountIndicator, waterRightCountIndicator;

    // Trail Graphics (Optional for Particle Trails)
    let trailGraphics;

    // Osmotic Pressure Constants
    const PRESSURE_SCALING_FACTOR = 10; // Adjust as needed for visualization

    function setup() {
      // Create canvas and attach to canvasContainer
      let canvas = createCanvas(windowWidth*.9, windowHeight*.5);
      canvas.parent('canvasContainer');
      membraneXInitial = width / 2;
      membraneX = membraneXInitial;

      // Create graphics buffer for trails
      trailGraphics = createGraphics(width, height);
      trailGraphics.clear(); // Start with a transparent buffer

      // Get sliders and display elements
      leftSoluteSlider = select('#leftSoluteSlider');
      rightSoluteSlider = select('#rightSoluteSlider');
      waterMoleculeSlider = select('#waterMoleculeSlider');
      waterPermeabilitySlider = select('#waterPermeabilitySlider');
      solutePermeabilitySlider = select('#solutePermeabilitySlider');
      temperatureSlider = select('#temperatureSlider');

      // Get value display elements
      leftSoluteValue = select('#leftSoluteValue');
      rightSoluteValue = select('#rightSoluteValue');
      soluteLeftCountIndicator = select('#soluteLeftCount');
      soluteRightCountIndicator = select('#soluteRightCount');
      

      waterMoleculeValue = select('#waterMoleculeValue');
      waterPermeabilityValue = select('#waterPermeabilityValue');
      solutePermeabilityValue = select('#solutePermeabilityValue');
      temperatureValue = select('#temperatureValue');

      // Get pressure indicators
      pressureLeftIndicator = select('#pressureLeft');
      pressureRightIndicator = select('#pressureRight');

      // Get water molecule count indicators
      waterLeftCountIndicator = select('#waterLeftCount');
      waterRightCountIndicator = select('#waterRightCount');

      // Update display values when sliders change
      leftSoluteSlider.input(() => {
        leftSoluteValue.html(leftSoluteSlider.value());
      });
      rightSoluteSlider.input(() => {
        rightSoluteValue.html(rightSoluteSlider.value());
      });
      waterMoleculeSlider.input(() => {
        waterMoleculeValue.html(waterMoleculeSlider.value());
      });
      waterPermeabilitySlider.input(() => {
        waterPermeabilityValue.html((waterPermeabilitySlider.value()/100).toFixed(2));
      });
      solutePermeabilitySlider.input(() => {
        solutePermeabilityValue.html((solutePermeabilitySlider.value()/100).toFixed(2));
      });
      temperatureSlider.input(() => {
        temperatureValue.html(temperatureSlider.value());
      });

      // Reset button
      resetButton = select('#resetButton');
      resetButton.mousePressed(resetSim);

      resetSim();
    }

    // function windowResized() {
    //   resizeCanvas(windowWidth, windowHeight);
      
    //   // // Recalculate the initial membrane position based on new canvas size
    //   // membraneXInitial = width / 2;
      
    //   // // Optional: Reset membrane position to initial after resizing
    //   // membraneX = membraneXInitial;
    // }

    function draw() {
      // Fade the trails slightly to create a fading effect
      trailGraphics.fill(220, 220, 220, 10); // Light fade
      trailGraphics.noStroke();
      trailGraphics.rect(0, 0, width, height);

      // Draw trails for water molecules
      for (let p of particles) {
        if (!p.isSolute) {
          trailGraphics.fill(p.color.levels[0], p.color.levels[1], p.color.levels[2], 50); // Semi-transparent
          trailGraphics.ellipse(p.x, p.y, p.radius * 2, p.radius * 2);
        }
      }

      // Draw the trails onto the main canvas
      image(trailGraphics, 0, 0);

      // Clear the main canvas with transparent background to show trails
      background(220, 220, 220, 0); // Transparent background

      // Update parameters from sliders
      let waterPermeability = waterPermeabilitySlider.value() / 100;
      let solutePermeability = solutePermeabilitySlider.value() / 100;
      let temperature = temperatureSlider.value();

      // Calculate water molecule counts first to avoid ReferenceError
      let currentLeftWater = particles.filter(p => p.side === 'left' && !p.isSolute).length;
      let currentRightWater = particles.filter(p => p.side === 'right' && !p.isSolute).length;
      let totalWater = currentLeftWater+currentRightWater;
      // Calculate solute concentrations
      let currentLeftSolute = particles.filter(p => p.side === 'left' && p.isSolute).length;
      let currentRightSolute = particles.filter(p => p.side === 'right' && p.isSolute).length;
      let totalSolute = currentLeftSolute+currentRightSolute;
      let concentrationLeft = currentLeftSolute / (currentLeftWater || 1); // Prevent division by zero
      let concentrationRight = currentRightSolute / (currentRightWater || 1); // Prevent division by zero

      // Calculate osmotic pressure using a simplified Van't Hoff equation
      // π = M * T * scaling_factor
      let osmoticPressureLeft = (concentrationLeft * temperature) * PRESSURE_SCALING_FACTOR;
      let osmoticPressureRight = (concentrationRight * temperature) * PRESSURE_SCALING_FACTOR;

      // Display osmotic pressures with two decimal places
      pressureLeftIndicator.html(`Osmotic Pressure: ${osmoticPressureLeft.toFixed(2)}`);
      pressureRightIndicator.html(`Osmotic Pressure: ${osmoticPressureRight.toFixed(2)}`);

      // Display water counts
      waterLeftCountIndicator.html(`Left Water: ${currentLeftWater}`);
      waterRightCountIndicator.html(`Right Water: ${currentRightWater}`);
      soluteLeftCountIndicator.html(`Left Solute: ${currentLeftSolute}`);
      soluteRightCountIndicator.html(`Right Solute: ${currentRightSolute}`);
      // Display solute concentrations
      fill(0);
      noStroke();
      textSize(16);
      textAlign(CENTER);
      // text(`Left Solute: ${currentLeftSolute}`, width * 0.25, 20);
      // text(`Right Solute: ${currentRightSolute}`, width * 0.75, 20);

      // Calculate net osmotic pressure difference
      let pressureDifference = osmoticPressureLeft - osmoticPressureRight;

      // Adjust membrane position based on osmotic pressure difference
      // Positive pressureDifference: more pressure on left, shift membrane to left
      // Negative pressureDifference: more pressure on right, shift membrane to right
      let shiftFactor = pressureDifference * 0.01; // Scaling factor for smooth movement
      //shiftFactor = ((currentLeftSolute)/totalSolute-membraneX/width)
      shiftFactor = ((currentLeftWater)/totalWater-membraneX/width)
      
      
      
      // console.log(membraneX/width);
      membraneX += shiftFactor * membraneShiftSpeed; // Subtract to move towards higher pressure
            // Constrain membraneX to prevent it from moving out of bounds
      membraneX = constrain(membraneX, width * 0.1, width * 0.9); // Adjust limits as needed

      // Draw semi-permeable membrane with possible expansion
      stroke(0);
      strokeWeight(membraneThickness);
      line(membraneX, 0, membraneX, height);

      // Update and display particles
      for (let p of particles) {
        p.move(waterPermeability, solutePermeability, temperature, membraneX);
        p.display();
      }

      // // Optional: Check for Osmotic Pressure Equilibrium
      // if (abs(osmoticPressureLeft - osmoticPressureRight) < 0.1) {
      //   noLoop(); // Stop the simulation when pressures are balanced
      //   fill(0);
      //   textSize(24);
      //   textAlign(CENTER);
      //   text("Osmotic Equilibrium Achieved!", width / 2, height / 2);
      // }
    }

    function resetSim() {
      particles = [];
      membraneX = membraneXInitial;

      // Read values from sliders
      let leftSoluteCount = parseInt(leftSoluteSlider.value());
      let rightSoluteCount = parseInt(rightSoluteSlider.value());
      let waterMoleculeCount = parseInt(waterMoleculeSlider.value());
      let temperature = parseFloat(temperatureSlider.value());

      // Initialize particles based on user-defined parameters
      for (let i = 0; i < leftSoluteCount; i++) {
        particles.push(new Particle('left', true, temperature));
      }
      for (let i = 0; i < rightSoluteCount; i++) {
        particles.push(new Particle('right', true, temperature));
      }
      for (let i = 0; i < waterMoleculeCount; i++) {
        particles.push(new Particle(random(['left', 'right']), false, temperature));
      }

      // Reset pressure and water counts
      pressureLeftIndicator.html(`Osmotic Pressure: 0`);
      pressureRightIndicator.html(`Osmotic Pressure: 0`);
      waterLeftCountIndicator.html(`Left Water: 0`);
      waterRightCountIndicator.html(`Right Water: 0`);

      // Restart the simulation if it was stopped
      loop();
    }

    class Particle {
      constructor(side, isSolute, temperature) {
        this.side = side; // Initial side assignment
        this.isSolute = isSolute;
        this.radius = this.isSolute ? 5 : 3;
        this.color = this.isSolute ? color(255, 0, 0) : color(0, 0, 255);

        if (this.side === 'left') {
          this.x = random(this.radius, membraneXInitial - this.radius);
        } else {
          this.x = random(membraneXInitial + this.radius, width - this.radius);
        }
        this.y = random(this.radius, height - this.radius);

        // Random initial velocity based on temperature
        let angle = random(TWO_PI);
        let speed = random(0.5, 1.5) * temperature;
        this.vx = cos(angle) * speed;
        this.vy = sin(angle) * speed;
      }

      move(waterPermeability, solutePermeability, temperature, membraneX) {
        // Move particle
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off top and bottom walls
        if (this.y < this.radius || this.y > height - this.radius) {
          this.vy *= -1;
          this.y = constrain(this.y, this.radius, height - this.radius);
        }

        // Bounce off side walls
        if (this.side === 'left' && this.x < this.radius) {
          this.vx *= -1;
          this.x = this.radius;
        }
        if (this.side === 'right' && this.x > width - this.radius) {
          this.vx *= -1;
          this.x = width - this.radius;
        }

        // Determine current side based on membraneX
        let currentSide = this.x < membraneX ? 'left' : 'right';

        // If side has changed due to membrane shift, update it
        if (currentSide !== this.side) {
          this.side = currentSide;
        }

        // Calculate solute concentrations
        let currentLeftSolute = particles.filter(p => p.side === 'left' && p.isSolute).length;
        let currentRightSolute = particles.filter(p => p.side === 'right' && p.isSolute).length;

        let soluteDiff = currentLeftSolute - currentRightSolute;
        let totalSolute = currentLeftSolute + currentRightSolute;

        let bias = 0;
        if (totalSolute > 0) {
          bias = soluteDiff / totalSolute; // Range from -1 to 1
        }

        // Determine net water molecule difference
        let waterLeft = particles.filter(p => p.side === 'left' && !p.isSolute).length;
        let waterRight = particles.filter(p => p.side === 'right' && !p.isSolute).length;
        let waterDifference = waterLeft - waterRight;
        let concentrationLeft = currentLeftSolute / (waterLeft || 1); // Prevent division by zero
        let concentrationRight = currentRightSolute / (waterRight || 1); // Prevent division by zero
        bias = concentrationRight - concentrationLeft;
        
        // Adjust waterPermeability based on bias
        let adjustedWaterPermeability = waterPermeability;
        if (this.side === 'left') {
          // Favor movement to the right if bias > 0
          adjustedWaterPermeability *= 0.5 + .5 * (bias > 0 ? bias : 0);
        } else {
          // Favor movement to the left if bias < 0
          adjustedWaterPermeability *= 0.5 + .5 * (-bias > 0 ? -bias : 0);
        }

        // Interact with membrane if near it
        if (this.side === 'left' && this.x > membraneX - this.radius) {
          if (!this.isSolute && random() < adjustedWaterPermeability) {
            // Water molecule passes through membrane towards right
            this.side = 'right';
            this.x = membraneX + this.radius;
          } else if (this.isSolute && random() < solutePermeability) {
            // Solute particle passes through membrane (if permeability > 0)
            this.side = 'right';
            this.x = membraneX + this.radius;
          } else {
            // Reflect back
            this.vx *= -1;
            this.x = membraneX - this.radius; // Prevent sticking
          }
        }

        if (this.side === 'right' && this.x < membraneX + this.radius) {
          if (!this.isSolute && random() < adjustedWaterPermeability) {
            // Water molecule passes through membrane towards left
            this.side = 'left';
            this.x = membraneX - this.radius;
          } else if (this.isSolute && random() < solutePermeability) {
            // Solute particle passes through membrane (if permeability > 0)
            this.side = 'left';
            this.x = membraneX - this.radius;
          } else {
            // Reflect back
            this.vx *= -1;
            this.x = membraneX + this.radius; // Prevent sticking
          }
        }
      }

      
      display() {
        noStroke();
        fill(this.color);
        ellipse(this.x, this.y, this.radius * 2, this.radius * 2);
      }
    }