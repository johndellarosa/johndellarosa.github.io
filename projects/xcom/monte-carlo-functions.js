function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
  }


function simulateTrial(attack_min, attack_max, hit_chance, ammo,armor_shred, crit_bonus, crit_chance, instant_kill_chance, enemy_hp_initial, enemy_armor_initial) {
let enemy_armor = enemy_armor_initial;
let enemy_hp = enemy_hp_initial;
let ammo_remaining = ammo;

for (let i =0; i < ammo; i++ ){
    if (enemy_hp <= 0){
        break;
    }
    ammo_remaining--;
    let hit = Math.random() < hit_chance;
    if (hit){
        let instant_kill = Math.random < instant_kill_chance;
        if (instant_kill){
            enemy_armor = 0;
            enemy_hp = 0;
            break;
        }
        else{
            enemy_armor = Math.max(0, enemy_armor - armor_shred);
            let damage_roll = getRandomInt(attack_min, attack_max+1);
            let crit = Math.random < crit_chance;
            if (crit){
                damage_roll += crit_bonus;
            }
            let damage = Math.max(1,damage_roll-enemy_armor);

            enemy_hp = Math.max(0, enemy_hp - damage);
        }
    }
}

return [enemy_hp, ammo_remaining];
}

// Binomial distribution function
function binomial(n, p) {
let count = 0;
for (let i = 0; i < n; i++) {
if (Math.random() < p) count++;
}
return count;
}

function runMultipleTrials(attack_min, attack_max, hit_chance, ammo,armor_shred, crit_bonus, crit_chance, instant_kill_chance, enemy_hp_initial, enemy_armor_initial, num_trials = 1000) {


    let results = [];

    for (let i = 0; i < num_trials; i++) {
        let trialResult = simulateTrial(attack_min, attack_max, hit_chance, ammo,armor_shred, crit_bonus, crit_chance, instant_kill_chance, enemy_hp_initial, enemy_armor_initial);
        results.push({
            'Enemy HP': trialResult[0],
            'Ammo': trialResult[1],
        });
    }

    return results;
}


function createHistogram(data,binSize,x_title="Waves Required",y_title="Percentage (%)") {
    // Define the bin size
    // const binSize = 10;

    // Find the maximum wave number and calculate the number of bins needed
    let maxWave = Math.max(...data);
    let numBins = Math.ceil((maxWave + 1) / binSize);

    // Initialize an array to store counts for each bin
    let binCounts = new Array(numBins).fill(0);

    // Assign each wave number to a bin and count
    data.forEach(value => {
        let binIndex = Math.floor(value / binSize);
        binCounts[binIndex]++;
    });

    // Convert bin counts to percentages
    let totalTrials = data.length;
    let percentages = binCounts.map(count => (count / totalTrials) * 100);

    // Create the histogram
    const canvas = document.getElementById('wavesHistogram');
    const ctx = canvas.getContext('2d');

    // Destroy any existing chart instance associated with the context
    for (let key in Chart.instances) {
        if (Chart.instances[key].ctx === ctx) {
            Chart.instances[key].destroy();
            break;
        }
    }


    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: percentages.map((_, index) => `${index * binSize} - ${index * binSize + binSize - 1}`),
            datasets: [{
                label: 'Percentage',
                data: percentages,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // This will allow the chart to fill the container height
        
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: y_title
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: x_title
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function prepareCdfData(data) {
    // Sort the data
    let sortedData = [...data].sort((a, b) => a - b);

    // Calculate the CDF
    let cdfData = [];
    let uniqueValues = [...new Set(sortedData)]; // Get unique values

    uniqueValues.forEach(value => {
        let count = sortedData.filter(v => v <= value).length;
        let probability = count / sortedData.length;
        cdfData.push({ x: value, y: probability });
    });

    return cdfData;
}

function createCdfChart(data, x_title='Waves Required',y_title='Probability') {
    const ctx = document.getElementById('cdfChart').getContext('2d');

    // Destroy previous chart if it exists
    if (window.cdfChartInstance) {
        window.cdfChartInstance.destroy();
    }

    // Create new chart
    window.cdfChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'CDF',
                data: data,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 5,
                tension: 0.1
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: x_title
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: y_title
                    }
                }
            }
        }
    });
}


// function simulateTrialRareDrop(DESIRED_DROPS = 1, p_drop = .01) {
// let num_drops = 0;
// let enemies_seen = 0;




// while (num_drops < DESIRED_DROPS) {
// waves++; // increase # of waves
// enemies_seen += lilies_in_wave; // increase # of lilies seen
// let nar_lilies = binomial(lilies_in_wave, p_nar_lily); // calculate # of nar lilies in wave
// nar_lilies_killed += nar_lilies;
// timer += time_to_kill_lily * nar_lilies; // killing nar lily takes time

// let num_god_hp_drops_this_wave = nar_lilies ? binomial(nar_lilies, p_god_hp) : 0;
// num_drops += num_god_hp_drops_this_wave;

// lilies_in_wave -= nar_lilies; // killing nar lily reduces number in subsequent waves

// if (num_drops < DESIRED_DROPS) {
// if (lilies_in_wave <= LILY_THRESHOLD) {
// // reset quest
// timer += time_for_to_get_to_spot; // technically should be a bit longer since it takes time to quit
// lilies_in_wave = LILIES_AFTER_RESET;
// mission_resets++;
// } else {
// // continue piping
// timer += time_per_pipe;
// }
// }
// }

// return [waves, timer, enemies_seen, nar_lilies_killed, mission_resets];
// }


