let particles = [];
    let membraneX;

    // GUI elements
    let leftSoluteSlider, rightSoluteSlider, waterMoleculeSlider;
    let waterPermeabilitySlider, solutePermeabilitySlider, temperatureSlider;
    let resetButton;

    // Value display elements
    let leftSoluteValue, rightSoluteValue, waterMoleculeValue;
    let waterPermeabilityValue, solutePermeabilityValue, temperatureValue;

    function setup() {
      // Create canvas and let it append to the body by default
      createCanvas(800, 400);
      membraneX = width / 2;

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
      waterMoleculeValue = select('#waterMoleculeValue');
      waterPermeabilityValue = select('#waterPermeabilityValue');
      solutePermeabilityValue = select('#solutePermeabilityValue');
      temperatureValue = select('#temperatureValue');

      // Update display values when sliders change
      leftSoluteSlider.input(() => leftSoluteValue.html(leftSoluteSlider.value()));
      rightSoluteSlider.input(() => rightSoluteValue.html(rightSoluteSlider.value()));
      waterMoleculeSlider.input(() => waterMoleculeValue.html(waterMoleculeSlider.value()));
      waterPermeabilitySlider.input(() => waterPermeabilityValue.html((waterPermeabilitySlider.value()/100).toFixed(2)));
      solutePermeabilitySlider.input(() => solutePermeabilityValue.html((solutePermeabilitySlider.value()/100).toFixed(2)));
      temperatureSlider.input(() => temperatureValue.html(temperatureSlider.value()));

      // Reset button
      resetButton = select('#resetButton');
      resetButton.mousePressed(resetSim);

      resetSim();
    }

    function draw() {
      background(220);

      // Update parameters from sliders
      let waterPermeability = waterPermeabilitySlider.value() / 100;
      let solutePermeability = solutePermeabilitySlider.value() / 100;
      let temperature = temperatureSlider.value();

      // Draw semi-permeable membrane
      stroke(0);
      strokeWeight(2);
      line(membraneX, 0, membraneX, height);

      // Update and display particles
      for (let p of particles) {
        p.move(waterPermeability, solutePermeability, temperature);
        p.display();
      }

      // Display concentrations
      fill(0);
      noStroke();
      textSize(16);
      textAlign(CENTER);
      let leftSolute = particles.filter(p => p.side === 'left' && p.isSolute).length;
      let rightSolute = particles.filter(p => p.side === 'right' && p.isSolute).length;
      text(`Left Solute: ${leftSolute}`, width * 0.25, 20);
      text(`Right Solute: ${rightSolute}`, width * 0.75, 20);
    }

    function resetSim() {
      particles = [];
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
    }

    class Particle {
      constructor(side, isSolute, temperature) {
        this.side = side;
        this.isSolute = isSolute;
        this.radius = this.isSolute ? 5 : 3;
        this.color = this.isSolute ? color(255, 0, 0) : color(0, 0, 255);

        if (this.side === 'left') {
          this.x = random(this.radius, membraneX - this.radius);
        } else {
          this.x = random(membraneX + this.radius, width - this.radius);
        }
        this.y = random(this.radius, height - this.radius);

        // Random initial velocity based on temperature
        let angle = random(TWO_PI);
        let speed = random(0.5, 1.5) * temperature;
        this.vx = cos(angle) * speed;
        this.vy = sin(angle) * speed;
      }

      move(waterPermeability, solutePermeability, temperature) {
        // Adjust velocity based on temperature
        // Optional: Implement more sophisticated temperature effects if desired

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

        // Interact with membrane
        if (this.side === 'left' && this.x > membraneX - this.radius) {
          if (!this.isSolute && random() < waterPermeability) {
            // Water molecule passes through membrane
            this.side = 'right';
            this.x = membraneX + this.radius;
          } else if (this.isSolute && random() < solutePermeability) {
            // Solute particle passes through membrane (if permeability > 0)
            this.side = 'right';
            this.x = membraneX + this.radius;
          } else {
            this.vx *= -1;
            this.x = membraneX - this.radius; // Prevent sticking to membrane
          }
        }
        if (this.side === 'right' && this.x < membraneX + this.radius) {
          if (!this.isSolute && random() < waterPermeability) {
            // Water molecule passes through membrane
            this.side = 'left';
            this.x = membraneX - this.radius;
          } else if (this.isSolute && random() < solutePermeability) {
            // Solute particle passes through membrane (if permeability > 0)
            this.side = 'left';
            this.x = membraneX - this.radius;
          } else {
            this.vx *= -1;
            this.x = membraneX + this.radius; // Prevent sticking to membrane
          }
        }
      }

      display() {
        noStroke();
        fill(this.color);
        ellipse(this.x, this.y, this.radius * 2, this.radius * 2);
      }
    }