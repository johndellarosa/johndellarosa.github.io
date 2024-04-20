function clamp(value, minNum=0,maxNum=100) {
  // First, ensure the value is not less than 0
  // Then, ensure the value is not more than 100

  return Math.min(maxNum, Math.max(minNum, value));
}

function GrabInputIntAndParse(id){
      // Get the value from the input field
      const entered = document.getElementById(id).value;

      // Validate or transform the input value if necessary
      // For example, convert the input value to a number
      const processedInput = parseInt(entered);
      // console.log(processedMergeBonus);
      // If the input value is not a number, display an error message
      if (isNaN(processedInput)) {
      alert('Please enter a valid number');
      return;
      }

      return processedInput;
}

function GrabInputFloatAndParse(id){
  // Get the value from the input field
  const entered = document.getElementById(id).value;

  // Validate or transform the input value if necessary
  // For example, convert the input value to a number
  const processedInput = parseFloat(entered);
  // console.log(processedMergeBonus);
  // If the input value is not a number, display an error message
  if (isNaN(processedInput)) {
  alert('Please enter a valid number');
  return;
  }

  return processedInput;
}


function getEffectiveATA(totalATA, attackType, comboStep) {
    const attackTypeModifier = { 'N': 1, 'H': 0.7, 'S': 0.5 }; // Example values
    const comboStepAccuracy = { 1: 1.0, 2: 1.3, 3: 1.69 }; // Example values
    
    if (!['N', 'H', 'S'].includes(attackType)) {
      throw new Error("Attack type must be in ['N', 'H', 'S']");
    }
    if (![1, 2, 3].includes(comboStep)) {
      throw new Error("Combo step must be in [1, 2, 3]");
    }
    return totalATA * attackTypeModifier[attackType] * comboStepAccuracy[comboStep];
  }
  
  function getEffectiveEVP(enemyEVP, statusEffect = null) {
    const statusEffectMod = {
      null: 1,
      'None': 1,
      'Paralyzed': 0.85,
      'Shocked': 0.85,
      'Frozen': 0.75,
      'Both': 0.595
    };
    
    return enemyEVP * statusEffectMod[statusEffect];
  }
  
  function accuracy(totalATA, attackType, comboStep, enemyEVP,  distance = 0,statusEffect = null) {
    let calcAccuracy =  getEffectiveATA(totalATA, attackType, comboStep) - 
      (0.2 * getEffectiveEVP(enemyEVP, statusEffect)) - 
      0.33 * distance;

      return clamp(calcAccuracy);
  }
  
  // // Usage example:
  // try {
  //   const acc = accuracy(100, 'N', 1, 50);
  //   console.log(acc);
  // } catch (error) {
  //   console.error(error);
  // }

  function generate_accuracy_matrix(enemy_stats,totalATA=100,distance=0,difficulty='Ep1 Normal',enemy_status='None'){



  // Assuming enemy_stats is an array of objects where each object is a row from your Excel file
  // For example: 
  // let enemy_stats = [{EVP: 50, ...}, {EVP: 60, ...}, ...];

  // Initialize an empty array for the equivalent of a DataFrame
  let accArray = [];

  // Loop through each enemy stat object
  enemy_stats[difficulty].forEach((row, index) => {
  let enemyEVP = row['EVP'];
  let accData = { 'Enemy': row['Enemy'] }; // Add the 'Enemy' as the first entry


  // Nested loops to go through attack types and combo steps
  ['N', 'H', 'S'].forEach(attackType => {
      [1, 2, 3].forEach(comboStep => {
      // Use the accuracy function to calculate and assign the value to the accData object
      let key = `${attackType} ${comboStep}`;
      accData[key] = accuracy(totalATA, attackType, comboStep, enemyEVP,distance,statusEffect=enemy_status);
      });
  });

  // Add the accData to accArray
  accArray.push(accData);
  });

  // Now accArray is an array of objects, each object is a row equivalent to the pandas DataFrame
  // console.log(accArray);

  // If you need to find a particular value later, you can filter or find it in accArray.
  // For example, to find the accuracy data for the first enemy:
  // console.log(accArray[0]);

  return accArray;
}

function generate_enemy_damage_matrix(enemy_stats,total_DFP=100,difficulty='Ep1 Normal'){



  // Assuming enemy_stats is an array of objects where each object is a row from your Excel file
  // For example: 
  // let enemy_stats = [{EVP: 50, ...}, {EVP: 60, ...}, ...];

  // Initialize an empty array for the equivalent of a DataFrame
  let damage_array = [];

  // Loop through each enemy stat object
  enemy_stats[difficulty].forEach((row, index) => {
  let enemy_atp = row['ATP'];
  let accData = { 'Enemy': row['Enemy'] }; // Add the 'Enemy' as the first entry


  // // Nested loops to go through attack types and combo steps
  // ['N', 'H', 'S'].forEach(attackType => {
  //     [1, 2, 3].forEach(comboStep => {
  //     // Use the accuracy function to calculate and assign the value to the accData object
  //     let key = `${attackType} ${comboStep}`;
  //     accData[key] = accuracy(total_DFP, attackType, comboStep, enemy_atp,distance);
  //     });


  // });

  accData['Normal'] = Math.max(0,(enemy_atp-total_DFP)/5);
  accData['Crit'] = accData['Normal']*1.5;

  // Add the accData to accArray
  damage_array.push(accData);
  });

  // Now accArray is an array of objects, each object is a row equivalent to the pandas DataFrame
  // console.log(accArray);

  // If you need to find a particular value later, you can filter or find it in accArray.
  // For example, to find the accuracy data for the first enemy:
  // console.log(accArray[0]);

  return damage_array;
}


function processData(data, headerOrder=false, precision=1) {
    // Find the existing table by id, and if it exists, remove it
    const existingTable = document.getElementById('data-table');
    if (existingTable.firstChild) {
        existingTable.removeChild(existingTable.firstChild);
    }

    // Create a new table element
    let table = document.createElement('table');
    table.style.width = '100%';
    table.setAttribute('border', '1');

    // Generate table headers
    let thead = document.createElement('thead');
    let headerRow = document.createElement('tr');
    
    // Use the provided headerOrder if available, else fallback to the first item's keys
    let headers = headerOrder || Object.keys(data[0]);
    headers.forEach(header => {
        let th = document.createElement('th');
        th.textContent = header; // Column letters as headers
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Generate table body
    let tbody = document.createElement('tbody');
    data.forEach(row => {
        let tr = document.createElement('tr');
        headers.forEach(header => {
            let td = document.createElement('td');
            let value = row[header];
            if (!isNaN(value) && value !== null) {
                value = Math.round(value * (10 ** precision)) / (10 ** precision); // Rounds to 1 decimal place
            }
          td.textContent = value;
                  tr.appendChild(td);
              });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Append the table to the div with id="data-table"
    document.getElementById('data-table').appendChild(table);
}

function processDataEnemyHit(data,playerMaxHP,colorMode) {
  // Find the existing table by id, and if it exists, remove it
  const existingTable = document.getElementById('data-table');
  if (existingTable.firstChild) {
      existingTable.removeChild(existingTable.firstChild);
  }

  // Create a new table element
  let table = document.createElement('table');
  table.style.width = '100%';
  table.setAttribute('border', '1');

  // Generate table headers
  let thead = document.createElement('thead');
  let headerRow = document.createElement('tr');
  
  // Assuming the first object in data array has all the headers as keys
  let headers = Object.keys(data[0]);
  headers.forEach(header => {
      let th = document.createElement('th');
      th.textContent = header; // Column letters as headers
      headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Generate table body
  let tbody = document.createElement('tbody');
  data.forEach(row => {
      let tr = document.createElement('tr');
      headers.forEach(header => {
          let td = document.createElement('td');
          let value = row[header];
          if (!isNaN(value) && value !== null) {
                // Set cell background color based on value
              if (colorMode){
                  percentage = value/playerMaxHP;
                  if (percentage <= .25) {
                    td.style.backgroundColor = '#ccffcc';
                } else if (percentage < 1) {
                    td.style.backgroundColor = '#ffffb3';
                } else {
                    td.style.backgroundColor = '#ffb3b3';
                }
              }

          }
          if (!isNaN(value)){
            value = Math.floor(value);
            
          }
        td.textContent = value;
                tr.appendChild(td);
            });
      tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  // Append the table to the div with id="data-table"
  document.getElementById('data-table').appendChild(table);
}

function processDataLevelTable(data) {
    // Find the existing table by id, and if it exists, remove it
    const existingTable = document.getElementById('data-table');
    if (existingTable.firstChild) {
        existingTable.removeChild(existingTable.firstChild);
    }

    // Create a new table element
    let table = document.createElement('table');
    table.style.width = '100%';
    table.setAttribute('border', '1');

    // Generate table headers
    let thead = document.createElement('thead');
    let headerRow = document.createElement('tr');
    
    // Assuming the first object in data array has all the headers as keys
    let headers = Object.keys(['ATP', 'DFP', 'MST', 'ATA', 'EVP', 'LCK', 'HP']);
    headers.forEach(header => {
        let th = document.createElement('th');
        th.textContent = header; // Column letters as headers
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Generate table body
    let tbody = document.createElement('tbody');
    data.forEach(row => {
        let tr = document.createElement('tr');
        headers.forEach(header => {
            let td = document.createElement('td');
            let value = row[header];
    if (!isNaN(value) && value !== null) {
        value = Math.round(value * 10) / 10; // Rounds to 1 decimal place
    }
    td.textContent = value;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Append the table to the div with id="data-table"
    document.getElementById('data-table').appendChild(table);
}


function Tech_Damage(MST, tech_base_power, resistance = 0, class_bonus = 0, weapon_bonus = 0, merge_bonus = 0) {
    // console.log(typeof(MST));
    // console.log(typeof(tech_base_power));
    return Math.floor((((MST + tech_base_power) / 5) * (1.0 + class_bonus + weapon_bonus + merge_bonus)) * (1 - resistance / 100));
}

function calculateTechDamageForEnemies(enemy_stats, tech_powers, tech, mst, class_bonus, weapon_bonus, merge_bonus) {
    
    const resist_map = new Map([
        ['Foie','EFR'],
        ['Gifoie','EFR'],
        ['Rafoie','EFR'],
        ['Zonde','ETH'],
        ['Gizonde','ETH'],
        ['Razonde','ETH'],
        ['Barta','EIC'],
        ['Gibarta','EIC'],
        ['Rabarta','EIC'],
        ['Grants','ELT'],
        ['Megid','EDK']]
        );
    


    // const tech_power_at_level = tech_powers.find(tp => tp.Level === level);


    // Initialize an empty array to hold the results.
    let tech_df = [];
    let resistance_key = resist_map.get(tech);
    enemy_stats.forEach((row)=>{
        // console.log(row.Enemy);
        let enemy_resist = row[resistance_key] || 0; // Default to 0 if not defined
        // console.log(enemy_resist);
        let techDamage = { 0: row.Enemy};
        tech_powers.forEach((tech_row)=>{
            const floatDamage = parseFloat(tech_row[tech]);
            techDamage[tech_row.Level] = Tech_Damage(
                mst,
                floatDamage,
                enemy_resist,
                class_bonus,
                weapon_bonus,
                merge_bonus
              );
            // console.log(tech_row);
        });
        tech_df.push(techDamage);
    }
    )


    // Object.entries(enemy_stats).forEach(([enemyName, resistances]) => {
    //     // Create an object for the current enemy's tech damage.
    //     let techDamage = { Enemy: enemyName };
    
    //     // Iterate over each tech in tech_powers.
    //     Object.keys(tech_power_at_level).forEach(tech => {
    //         console.log(tech);
    //       if (tech !== 'Level') { // Skip the 'Level' property
    //         // Get the resistance for the current enemy and tech.
    //         let resistance_key = resist_map.get(tech);
    //         console.log(resistance_key);
    //         let enemy_resist = resistances[resistance_key] || 0; // Default to 0 if not defined
    
    //         // Calculate the tech damage and add it to the techDamage object with the tech as the key.
    //         techDamage[tech] = Tech_Damage(
    //           mst,
    //           tech_power_at_level[tech],
    //           enemy_resist,
    //           class_bonus,
    //           weapon_bonus,
    //           merge_bonus
    //         );
    //       }
    //     });


    // // Iterate over each enemy in enemy_stats.
    // enemy_stats.forEach((enemy, i) => {
    //   // Create an object for the current enemy's tech damage.
    //   let techDamage = { Enemy: enemy['Enemy'] }; // Assuming there is an 'Enemy' attribute.
  
    //   // Get the resistance for the current enemy.
    //   let enemy_resist = enemy[resist_map.get(tech)]; // Assuming the resistance property is named like 'tech_resist'.
    //   console.log(enemy_resist);
    //   // Iterate over each tech's power.
    //   Object.entries(tech_powers[tech]).forEach(([techName, basePower]) => {
    //     // Calculate the tech damage and add it to the techDamage object with the techName as the key.
    //     techDamage[techName] = Tech_Damage(mst, basePower, enemy_resist, class_bonus, weapon_bonus, merge_bonus);
    //   });
  
      // Add the current enemy's tech damage object to the results array.
    //   tech_df.push(techDamage);
    // });
  
    // Return the resulting array of tech damage objects.
    return tech_df;
  }

  function calculateTechHits(enemy_stats, tech_powers, tech, mst, class_bonus, weapon_bonus, merge_bonus,difficulty, minlevel,maxlevel) {
    
    const resist_map = new Map([
        ['Foie','EFR'],
        ['Gifoie','EFR'],
        ['Rafoie','EFR'],
        ['Zonde','ETH'],
        ['Gizonde','ETH'],
        ['Razonde','ETH'],
        ['Barta','EIC'],
        ['Gibarta','EIC'],
        ['Rabarta','EIC'],
        ['Grants','ELT'],
        ['Megid','EDK']]
        );
    


    // const tech_power_at_level = tech_powers.find(tp => tp.Level === level);


    // Initialize an empty array to hold the results.
    let tech_df = [];
    let resistance_key = resist_map.get(tech);
    enemy_stats[difficulty].forEach((row)=>{
        // console.log(row.Enemy);
        let enemy_resist = row[resistance_key] || 0; // Default to 0 if not defined
        let enemy_health = row['HP'];
        // console.log(enemy_resist);
        let techDamage = { 0: `${row.Enemy} ${row.HP}HP`};
        tech_powers.forEach((tech_row)=>{
            // check range
            let tech_level = tech_row.Level;

            if (tech_level < minlevel || tech_level > maxlevel){
              return;
            }


            const floatDamage = parseFloat(tech_row[tech]);
            let damageDealt = Tech_Damage(
                mst,
                floatDamage,
                enemy_resist,
                class_bonus,
                weapon_bonus,
                merge_bonus
              );
            if (damageDealt > 0){
                techDamage[tech_row.Level] = `${damageDealt} (${Math.ceil(enemy_health/damageDealt)})`;
            }
            else{
                techDamage[tech_row.Level] = '0 (-)'
            }
              
            // console.log(tech_row);
        });
        tech_df.push(techDamage);
    }
    )



    // Return the resulting array of tech damage objects.
    return tech_df;
  }

  function calculateTechV2(enemy_stats, tech_powers, mst, class_selection, weapon_bonus, merge_bonus,difficulty, levels_map) {
    
    const resist_map = new Map([
        ['Foie','EFR'],
        ['Gifoie','EFR'],
        ['Rafoie','EFR'],
        ['Zonde','ETH'],
        ['Gizonde','ETH'],
        ['Razonde','ETH'],
        ['Barta','EIC'],
        ['Gibarta','EIC'],
        ['Rabarta','EIC'],
        ['Grants','ELT'],
        ['Megid','EDK']]
        );
    // console.log(class_selection);


    // const tech_power_at_level = tech_powers.find(tp => tp.Level === level);


    // Initialize an empty array to hold the results.
    let tech_df = [];
    
    enemy_stats[difficulty].forEach((row)=>{
        // console.log(row.Enemy);
        let enemy_health = row['HP'];
        // console.log(enemy_resist);
        let techDamage = { 'Enemy': `${row.Enemy} ${row.HP}HP`};
        levels_map.forEach((lvl,tech)=>{
          // console.log(tech);
          // console.log(lvl);
          let resistance_key = resist_map.get(tech);
          let enemy_resist = row[resistance_key] || 0; // Default to 0 if not defined
          let tech_level_index = lvl-1;
          if (tech_level_index < 0 || tech_level_index >= 30){
            techDamage[tech] = '-';
          }
          else{
            // console.log('valid number');
            // console.log(tech_powers);
            //   console.log(tech_powers[lvl-1]);
              const floatDamage = parseFloat(tech_powers[tech_level_index][tech]);

              //handling class bonuses

              var class_bonus = 0;

              switch(class_selection){
                case "FOmar":
                  if (['Gifoie','Gizonde','Gibarta','Grants'].includes(tech)){
                    class_bonus=0.3;
                  }
                  break;
                case "FOmarl":
                  if (tech == 'Grants'){
                    class_bonnus = 0.5;
                    // console.log("Fomarl grants bonus");
                  }
                  break;
                case "FOnewm":
                  if (['Gifoie','Gizonde','Gibarta','Rafoie','Razonde','Rabarta'].includes(tech)){
                    class_bonus=0.3;
                    // console.log(`Fonewm bonus for ${tech}`);
                  }
                  break;

                case "FOnewearl":
                  if (['Foie','Zonde','Barta'].includes(tech)){
                    class_bonus=0.3;
                    // console.log(`Foney bonus for ${tech}`);
                  }
                  break;
                default:
                  // console.log(`No bonus for ${tech}`);
              }

              



            let damageDealt = Tech_Damage(
                mst,
                floatDamage,
                enemy_resist,
                class_bonus,
                weapon_bonus,
                merge_bonus
              );

              if (damageDealt > 0){
                techDamage[tech] = `${damageDealt} (${Math.ceil(enemy_health/damageDealt)})`;
            }
            else{
                techDamage[tech] = '0 (-)'
            }
          }
          

        })

        

        // tech_powers.forEach((tech_row)=>{
        //     // check range
        //     let tech_level = tech_row.Level;

        //     if (tech_level < minlevel || tech_level > maxlevel){
        //       return;
        //     }


        //     const floatDamage = parseFloat(tech_row[tech]);
        //     let damageDealt = Tech_Damage(
        //         mst,
        //         floatDamage,
        //         enemy_resist,
        //         class_bonus,
        //         weapon_bonus,
        //         merge_bonus
        //       );
        //     if (damageDealt > 0){
        //         techDamage[tech_row.Level] = `${damageDealt}HP (${Math.ceil(enemy_health/damageDealt)})`;
        //     }
        //     else{
        //         techDamage[tech_row.Level] = '0HP (-)'
        //     }
              
        //     // console.log(tech_row);
        // });
        tech_df.push(techDamage);
    }
    )



    // Return the resulting array of tech damage objects.
    return tech_df;
  }

function Special_Instant_Kill(level,enemy_dark,special_reduction_multiplier){
    dark_map = new Map(
        [['Dim',48],
    ['Shadow',66],
    ['Dark',78],
    ['Hell',93]]
    );
    // console.log(level);
    // console.log(dark_map.get(level));
    return Math.max((dark_map.get(level)-enemy_dark)*special_reduction_multiplier,0);
}

function calculateSpecial(enemy_stats, special_attack, special_reduction_multiplier,ATA) {
    
    const resist_map = new Map([
        ['Instant Kill','EDK'],
        ['Gifoie','EFR'],
        ['Rafoie','EFR'],
        ['Zonde','ETH'],
        ['Gizonde','ETH'],
        ['Razonde','ETH'],
        ['Barta','EIC'],
        ['Gibarta','EIC'],
        ['Rabarta','EIC'],
        ['Grants','ELT'],
        ['Megid','EDK']]
        );
    


    // const tech_power_at_level = tech_powers.find(tp => tp.Level === level);


    // Initialize an empty array to hold the results.
    let output_df = [];
    let resistance_key = resist_map.get(special_attack);
    enemy_stats.forEach((row)=>{
        // console.log(row.Enemy);
        let enemy_resist = row[resistance_key] || 0; // Default to 0 if not defined
        let enemyEVP = parseInt(row['EVP']);
        
        // console.log(enemy_resist);
        let rowData = { 'Enemy': row['Enemy'] }; // Add the 'Enemy' as the first entry

        if (special_attack == 'Instant Kill'){
            ['Dim','Shadow','Dark','Hell'].forEach((lvl) =>{
                let activation_rate = Special_Instant_Kill(lvl,enemy_resist,special_reduction_multiplier);
                
                rowData[`${lvl} Proc`] =`${Math.round(activation_rate * 10) / 10}%`;
                [1, 2, 3].forEach((comboStep) => {
                  // Use the accuracy function to calculate and assign the value to the accData object
                  let key = `${lvl} S${comboStep} Kill`;
                  let kill_chance = activation_rate*accuracy(ATA, 'S', comboStep, enemyEVP)/100;
                  // console.log(`kill chance: ${kill_chance}`);
                  // console.log(typeof(kill_chance));
                  kill_chance = Math.max(Math.round(kill_chance * 10) / 10,0);
                  rowData[key] = `${kill_chance}%`;
                })
            })
        }
        // Nested loops to go through attack types and combo steps

        output_df.push(rowData);
    }
    )


    // Object.entries(enemy_stats).forEach(([enemyName, resistances]) => {
    //     // Create an object for the current enemy's tech damage.
    //     let techDamage = { Enemy: enemyName };
    
    //     // Iterate over each tech in tech_powers.
    //     Object.keys(tech_power_at_level).forEach(tech => {
    //         console.log(tech);
    //       if (tech !== 'Level') { // Skip the 'Level' property
    //         // Get the resistance for the current enemy and tech.
    //         let resistance_key = resist_map.get(tech);
    //         console.log(resistance_key);
    //         let enemy_resist = resistances[resistance_key] || 0; // Default to 0 if not defined
    
    //         // Calculate the tech damage and add it to the techDamage object with the tech as the key.
    //         techDamage[tech] = Tech_Damage(
    //           mst,
    //           tech_power_at_level[tech],
    //           enemy_resist,
    //           class_bonus,
    //           weapon_bonus,
    //           merge_bonus
    //         );
    //       }
    //     });


    // // Iterate over each enemy in enemy_stats.
    // enemy_stats.forEach((enemy, i) => {
    //   // Create an object for the current enemy's tech damage.
    //   let techDamage = { Enemy: enemy['Enemy'] }; // Assuming there is an 'Enemy' attribute.
  
    //   // Get the resistance for the current enemy.
    //   let enemy_resist = enemy[resist_map.get(tech)]; // Assuming the resistance property is named like 'tech_resist'.
    //   console.log(enemy_resist);
    //   // Iterate over each tech's power.
    //   Object.entries(tech_powers[tech]).forEach(([techName, basePower]) => {
    //     // Calculate the tech damage and add it to the techDamage object with the techName as the key.
    //     techDamage[techName] = Tech_Damage(mst, basePower, enemy_resist, class_bonus, weapon_bonus, merge_bonus);
    //   });
  
      // Add the current enemy's tech damage object to the results array.
    //   tech_df.push(techDamage);
    // });
  
    // Return the resulting array of tech damage objects.
    return output_df;
  }

  function GetToolTable(player_level){
    if (player_level < 11){
      return 0;
    }
    else if (player_level < 26){
      return 1;
    }
    else if (player_level < 43){
      return 2;
    }
    else if (player_level < 61){
      return 3;
    }
    return 4;
  }

//   function clamp(value, min, max) {
//     return Math.max(min, Math.min(max, value));
// }

function createTableFromObject(data) {
  // Create table elements
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  // Create the header row
  const headerRow = document.createElement('tr');
  const th1 = document.createElement('th');
  th1.textContent = 'Disk';
  const th2 = document.createElement('th');
  th2.textContent = 'Probability (%)';
  headerRow.appendChild(th1);
  headerRow.appendChild(th2);
  thead.appendChild(headerRow);

  // Add the header to the table
  table.appendChild(thead);

  // Create and append rows to the table body
  Object.entries(data).forEach(([key, value]) => {
    if (value === 0) {
      return;
  }

      const row = document.createElement('tr');
      const cell1 = document.createElement('td');
      cell1.textContent = key;
      const cell2 = document.createElement('td');

      cell2.textContent = parseFloat(value).toFixed(2);
      row.appendChild(cell1);
      row.appendChild(cell2);
      tbody.appendChild(row);
  });

  // Add the body to the table
  table.appendChild(tbody);

  // Return the complete table
  return table;
}


function getProbSpecificRoll(dice1Roll, dice2Roll, dice1Min, dice1Max, dice2Min, dice2Max) {
  if (dice1Roll >= dice1Min && dice1Roll <= dice1Max && dice2Roll >= dice2Min && dice2Roll <= dice2Max) {
      return 1 / ((dice1Max - dice1Min + 1) * (dice2Max - dice2Min + 1));
  } else {
      return 0;
  }
}

function getProb(attack, defense, dice1Min = 1, dice1Max = 6, dice2Min = 1, dice2Max = 6, pref = 0) {
  if (pref === 1) {
      if (defense > attack) {
          return 0;
      } else if (attack > defense) {
          return getProbSpecificRoll(attack, defense, dice1Min, dice1Max, dice2Min, dice2Max) + getProbSpecificRoll(defense, attack, dice1Min, dice1Max, dice2Min, dice2Max);
      } else {
          return getProbSpecificRoll(attack, defense, dice1Min, dice1Max, dice2Min, dice2Max);
      }
  } else if (pref === 2) {
      if (defense < attack) {
          return 0;
      } else if (attack < defense) {
          return getProbSpecificRoll(attack, defense, dice1Min, dice1Max, dice2Min, dice2Max) + getProbSpecificRoll(defense, attack, dice1Min, dice1Max, dice2Min, dice2Max);
      } else {
          return getProbSpecificRoll(attack, defense, dice1Min, dice1Max, dice2Min, dice2Max);
      }
  } else {
      return getProbSpecificRoll(attack, defense, dice1Min, dice1Max, dice2Min, dice2Max);
  }
}


function generate_dice_matrix(dice1Min = 1, dice1Max = 6, dice2Min = 1, dice2Max = 6, pref = 0, dice_boost=false){



  // Assuming enemy_stats is an array of objects where each object is a row from your Excel file
  // For example: 
  // let enemy_stats = [{EVP: 50, ...}, {EVP: 60, ...}, ...];

  // Initialize an empty array for the equivalent of a DataFrame
  let accArray = [];
  let dice_range = [1,2,3,4,5,6,7,8,9];
  let normalization_factor = 0;
  // Loop through each enemy stat object
  dice_range.forEach((def) => {
    let accData = { 'Defense\\Attack': def }; // Add the 'Enemy' as the first entry
    

    // Nested loops to go through attack types and combo steps
    dice_range.forEach( att => {
        if (dice_boost & (att < 3) & (def < 3)){

            accData[att] = 0;
          
        }
        else{
          accData[att] = 100* getProb(att, def, dice1Min, dice1Max, dice2Min, dice2Max, pref);
       
        }
        // Use the accuracy function to calculate and assign the value to the accData object
      if (dice_boost){
          normalization_factor += accData[att];
        }

        // console.log(`${att},${def}: ${accData[att]}`);
    });

    // Add the accData to accArray
    accArray.push(accData);
  });

  // console.log(accArray);


  if (dice_boost){
    // accArray.forEach(row => {
    //   console.log(row);
    //   console.log(typeof(row));
    //   console.log(row[1]);
    //   for (const property in row){
    //     console.log(property);
    //     row[property] * 100 / normalization_factor;
    //   }
    // })

    for (const [index, row] of accArray.entries()){
      for (const [index_2, element] of accArray.entries()){
        // console.log(index,index_2);
        accArray[index][index_2] *= 100 ;
        accArray[index][index_2]/= normalization_factor;
      }
    }

  }

  // console.log(normalization_factor);

  return accArray;
}


function processDataDice(data, headerOrder=false, precision=1) {
  // Find the existing table by id, and if it exists, remove it
  const existingTable = document.getElementById('data-table');
  if (existingTable && existingTable.firstChild) {
      existingTable.removeChild(existingTable.firstChild);
  }

  // Create a new table element
  let table = document.createElement('table');
  table.style.width = '100%';
  table.setAttribute('border', '1');

  // Generate table headers
  let thead = document.createElement('thead');
  let headerRow = document.createElement('tr');

  // Use the provided headerOrder if available, else fallback to the first item's keys
  let headers = headerOrder || Object.keys(data[0]);
  headers.forEach(header => {
      let th = document.createElement('th');
      th.textContent = header; // Column letters as headers
      headerRow.appendChild(th);
  });
  // Add an extra header for the row sum
  let th = document.createElement('th');
  th.textContent = 'Row Sum (Prob Def Roll)';
  headerRow.appendChild(th);

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Generate table body and calculate sums, skipping the first column for summation
  let tbody = document.createElement('tbody');
  let columnSums = ['Column Sums (Prob Atk Roll)'].concat(new Array(headers.length - 1).fill(0));
  data.forEach(row => {
      let tr = document.createElement('tr');
      let rowSum = 0;
      headers.forEach((header, index) => {
          let td = document.createElement('td');
          let value = row[header];
          // Skip the first column for sum calculations
          if (index > 0 && typeof value === 'number') {
            rowSum += value;  
            value = Math.round(value * (10 ** precision)) / (10 **precision); // Rounds to 2 decimal places

              columnSums[index] += value; // Correct index for columnSums
          }
          td.textContent = value;
          tr.appendChild(td);
      });
      // Append row sum at the end of the row
      let sumTd = document.createElement('td');
      sumTd.textContent = Math.round(rowSum * 10**precision) / 10**precision; // Rounds to 2 decimal places
      tr.appendChild(sumTd);
      tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  // Add a row for column sums
  let sumRow = document.createElement('tr');
  columnSums.forEach((sum, index) => {
      let td = document.createElement('td');
      // Check if it's the label or a sum
      if (index === 0) {
          td.textContent = sum; // The label "Column Sums"
      } else {
          td.textContent = Math.round(sum * (10**precision)) / (10**precision); // Rounded sums for each column
      }
      sumRow.appendChild(td);
  });

  tbody.appendChild(sumRow);

  // Append the table to the div with id="data-table"
  document.getElementById('data-table').appendChild(table);
}