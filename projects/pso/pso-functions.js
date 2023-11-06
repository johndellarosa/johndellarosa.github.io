function getEffectiveATA(totalATA, attackType, comboStep) {
    const attackTypeModifier = { 'N': 1, 'H': 1.2, 'S': 1.5 }; // Example values
    const comboStepAccuracy = { 1: 0.9, 2: 0.8, 3: 0.7 }; // Example values
    
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
      'Paralyzed': 0.85,
      'Shocked': 0.85,
      'Frozen': 0.75,
      'Both': 0.595
    };
    
    return enemyEVP * statusEffectMod[statusEffect];
  }
  
  function accuracy(totalATA, attackType, comboStep, enemyEVP, statusEffect = null, distance = 0) {
    return getEffectiveATA(totalATA, attackType, comboStep) - 
      (0.2 * getEffectiveEVP(enemyEVP, statusEffect)) - 
      0.33 * distance;
  }
  
  // Usage example:
  try {
    const acc = accuracy(100, 'N', 1, 50);
    console.log(acc);
  } catch (error) {
    console.error(error);
  }

  function generateMatrix(enemy_stats){

  // Assuming total_ata is a constant value
  const totalATA = 100;

  // Assuming enemy_stats is an array of objects where each object is a row from your Excel file
  // For example: 
  // let enemy_stats = [{EVP: 50, ...}, {EVP: 60, ...}, ...];

  // Initialize an empty array for the equivalent of a DataFrame
  let accArray = [];

  // Loop through each enemy stat object
  enemy_stats.forEach((row, index) => {
  let enemyEVP = row['EVP'];
  let accData = {};

  // Nested loops to go through attack types and combo steps
  ['N', 'H', 'S'].forEach(attackType => {
      [1, 2, 3].forEach(comboStep => {
      // Use the accuracy function to calculate and assign the value to the accData object
      let key = `${attackType} ${comboStep}`;
      accData[key] = accuracy(totalATA, attackType, comboStep, enemyEVP);
      });
  });

  // Add the accData to accArray
  accArray.push(accData);
  });

  // Now accArray is an array of objects, each object is a row equivalent to the pandas DataFrame
  console.log(accArray);

  // If you need to find a particular value later, you can filter or find it in accArray.
  // For example, to find the accuracy data for the first enemy:
  console.log(accArray[0]);

  return accArray;
}