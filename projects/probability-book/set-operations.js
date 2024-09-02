let sets = {};
let sigmaAlgebra = new Set();

function createSet() {
    const setName = document.getElementById('newSetName').value.trim();
    if (setName && !sets[setName]) {
        sets[setName] = new Set([setName]);  // Start each set with an identifier or examples
        updateSetSelectors();
        sigmaAlgebra.add(setName);
        updateSigmaAlgebraDisplay();
        document.getElementById('newSetName').value = ''; // Clear input after adding
    } else {
        alert("Please enter a unique set name or a non-empty name.");
    }
}

function performOperation() {
    let newSet; // Declare once at the top of the function

    const set1Name = document.getElementById('setSelect1').value;
    const set2Name = document.getElementById('setSelect2').value;
    const operation = document.getElementById('operationSelect').value;

    // Debugging output to console to check what values are being read
    console.log("Set 1:", set1Name);
    console.log("Set 2:", set2Name);
    console.log("Operation:", operation);

    if (!set1Name || !set2Name || operation === "Select an operation") {
        alert("Please select two sets and an operation.");
        return;
    }

    const resultName = `(${set1Name} ${operation} ${set2Name})`;


    switch (operation) {
        case 'union':
            newSet = new Set([...sets[set1Name], ...sets[set2Name]]);
            break;
        case 'intersection':
            newSet = new Set([...sets[set1Name]].filter(x => sets[set2Name].has(x)));
            break;
        case 'complement':
            newSet = new Set([...sets[set1Name]].filter(x => !sets[set2Name].has(x)));
            break;
        case 'symmetricDifference':
            newSet = symmetricDifference(sets[set1Name], sets[set2Name]);
            break;
        case 'cartesianProduct':
            //resultName = `(${set1Name} x ${set2Name})`;
            newSet = cartesianProduct(sets[set1Name], sets[set2Name]);
            break;
        case 'powerSet':
            //resultName = `P(${set1Name})`;
            newSet = powerSet(sets[set1Name]);
            break;
        default:
            alert("Please select a valid operation.");
            return;
    }

    if (newSet) {
        const resultName = `${set1Name} ${operation} ${set2Name}`;
        sets[resultName] = newSet;
        sigmaAlgebra.add(resultName);
        updateSetSelectors();
        updateSigmaAlgebraDisplay();
    } else {
        alert("Invalid operation or sets not defined");
    }

    // sets[resultName] = newSet;
    // sigmaAlgebra.add(resultName);
    // updateSetSelectors();
    // updateSigmaAlgebraDisplay();
}


function updateSetSelectors() {
    const selectors = [document.getElementById('setSelect1'), document.getElementById('setSelect2')];
    selectors.forEach(selector => {
        selector.innerHTML = '<option selected disabled>Select a set</option>';
        Object.keys(sets).forEach(setName => {
            const option = document.createElement('option');
            option.value = setName;
            option.textContent = `Set ${setName}`;
            selector.appendChild(option);
        });
    });
}

function validateAndSanitizeInput(input) {
    if (typeof input !== 'number' && typeof input !== 'string') {
        console.error("Invalid input type");
        return null;
    }
    return input.toString().trim(); // Convert everything to string and trim spaces
}

function addElementToSet(set, element) {
    const sanitizedElement = validateAndSanitizeInput(element);
    if (sanitizedElement !== null) {
        set.add(sanitizedElement);
    }
}

function updateSigmaAlgebraDisplay() {
    const sigmaList = document.getElementById('sigmaList');
    sigmaList.innerHTML = '';
    sigmaAlgebra.forEach(setName => {
        const button = document.createElement('button');
        button.textContent = setName + ' = ' + formatSet(sets[setName]);
        button.className = 'set-button';
        button.addEventListener('click', function() { removeSet(setName); });
        sigmaList.appendChild(button);
    });
}

function removeSet(setName) {
    // Removes the set from both the sigmaAlgebra and the sets object
    sigmaAlgebra.delete(setName);
    delete sets[setName];
    updateSigmaAlgebraDisplay(); // Refresh display
    updateSetSelectors(); // Update selectors if you have dropdowns or lists elsewhere that use set names
}

function formatSet(set) {
    // This function converts a set to a string, properly handling nested sets
    const formatElement = element => {
        if (element instanceof Set) {
            // Recursively format each element of the set if it's also a set
            return `{${Array.from(element, formatElement).join(', ')}}`;
        } else {
            // Convert non-set elements directly to their string representation
            return element.toString();
        }
    };

    // Start the recursive formatting from the top-level set
    return `{${Array.from(set, formatElement).join(', ')}}`;
}

function updateSigmaAlgebraDisplay() {
    const sigmaList = document.getElementById('sigmaList');
    sigmaList.innerHTML = '';  // Clear existing content

    sigmaAlgebra.forEach(setName => {
        const set = sets[setName];
        const formattedSet = formatSet(set);
        const button = document.createElement('button');
        button.textContent = `${setName} = ${formatSet(sets[setName])}`;
        button.className = 'set-button';
        button.onclick = function() { removeSet(setName); };
        sigmaList.appendChild(button);
    });
}

// function formatSet(set) {
//     // Converts the set elements into a readable string format
//     return `{${Array.from(set).join(', ')}}`;
// }

function symmetricDifference(setA, setB) {
    let diff = new Set(setA);
    for (let elem of setB) {
        if (diff.has(elem)) {
            diff.delete(elem);
        } else {
            diff.add(elem);
        }
    }
    return diff;
}
function cartesianProduct(setA, setB) {
    let product = new Set();
    // console.log("Set A:", Array.from(sets[set1Name]));
    // console.log("Set B:", Array.from(sets[set2Name]));

    setA.forEach(a => {
        setB.forEach(b => {
            product.add(`(${a}, ${b})`); // Ensure correct format for pairs
        });
    });
    return product;
}


function powerSet(set) {
    const powerSet = new Set([new Set()]); // Start with the empty set

    set.forEach(value => {
        const newSubsets = new Set();
        powerSet.forEach(subset => {
            const newSubset = new Set(subset);
            newSubset.add(value);
            newSubsets.add(newSubset);
        });
        newSubsets.forEach(subset => powerSet.add(subset));
    });

    return powerSet;
}

