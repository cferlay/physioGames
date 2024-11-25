/// MAIN FUNCTIONALITIES

// - Generate crossword
// - Selecting cell & corresponding line + line switching (intersections)
// - Getting written letter and moving to next letter
// - Verification & Scoring

/// GENERAL ALL PURPOSE & TECHNICAL FUNCTIONS ///////////////////////////////////////////////////

function shuffleArray(array) {
    //Randomly shuffles a given array
    for (let i = array.length - 1; i > 0; i--) {
      //Starting from the last element, swap it with a previous element
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

function argMin(array) {
    //From github.com/engelen
    return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] < r[0] ? a : r))[1];
  }

/// RELEVANT HTML ELEMENTS ////////////////////////////////////////////////////////////////////

let gridDiv = document.getElementById("grid");

/// VARIABLE DEFINITIONS //////////////////////////////////////////////////////////////////////

let grid = [];                                                          //Array containing information about the whole grid
let gridPhantom = [];
let cellDivs = [];

let wordList = [];
let hintList = [];

wordList.push("HELLO");
hintList.push("Common English Greeting");

wordList.push("ALOHA");
hintList.push("Common Greeting in Hawai");

wordList.push("CHERRY");
hintList.push("Summer fruit");

wordList.push("SPLEEN");
hintList.push("Les Fleurs du Mal");

wordList.push("SMARTPHONE");
hintList.push("Portable device to communicate");

wordList.push("KALADIN");
hintList.push("Leader of Bridge Four");

wordList.push("MISTBORN");
hintList.push("Person being able to burn all allomantic metals");

let VHints = [];
let HHints = [];

let placementList = [];                                                 //List of placements [Word, x, y, orientation]
let selPlacement = [];
let selID = 0;

[grid, placementList] = createBestGrid(wordList, 1000);                 //Create a grid from 1000 samples (working value)
generateGrid(grid);                                                     //Generate the html element

/// EVENT LISTENERS //////////////////////////////////////////////////////////////////////////

cellDivs.forEach((cell, i) => {
    if (gridPhantom[i] != ' '){
        cell.onclick = function(){cellSel(i, '')};
    }
    else{
        cell.onclick = deselect;
    }
})

document.getElementById("gridContainer").addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
        deselect();
    }
  });

document.addEventListener('keydown', (event) => {
    if (event.key.length === 1 && event.key.match(/[a-zA-Z]/)) {
        cellDivs[selID].innerHTML = event.key.toUpperCase() + cellDivs[selID].innerHTML.slice(1);
        let ids = placementToID(selPlacement);
        const nextID = ids[Math.min(ids.indexOf(selID) + 1, ids.length - 1)];
        cellSel(nextID, selPlacement[3]);
    }
    else if (event.key === 'Backspace') {
        cellDivs[selID].innerHTML = ' ' + cellDivs[selID].innerHTML.slice(1);
        let ids = placementToID(selPlacement);
        const previousID = ids[Math.max(ids.indexOf(selID) - 1, 0)];
        cellSel(previousID, selPlacement[3]);
    }
    switch (event.key) {
        case 'ArrowUp':
            [x,y] = switchCoords(selID);
            if(x > 0 && grid[x-1][y] != ' '){
                cellSel(switchCoords([x-1, y]), 'V');
            }
            break;
        case 'ArrowDown':
            [x,y] = switchCoords(selID);
            if(x < grid.length - 1 && grid[x+1][y] != ' '){
                cellSel(switchCoords([x+1, y]), 'V');
            }
            break;
        case 'ArrowLeft':
            [x,y] = switchCoords(selID);
            if(y > 0 && grid[x][y - 1] != ' '){
                cellSel(switchCoords([x, y - 1]), 'H');
            }
            break;
        case 'ArrowRight':
            [x,y] = switchCoords(selID);
            if(y < grid[0].length - 1 && grid[x][y + 1] != ' '){
                cellSel(switchCoords([x, y + 1]), 'H');
            }
            break;
      }
  });

/// CROSSWORD CREATION //////////////////////////////////////////////////////////////////////

function createBestGrid(wL, n){                                         //Creates n grids, scores them, then chooses the best one
    let grids = [];                                                     //Store grids, placements, entropies
    for (let i = 0; i < n; i++){                                        
        let [grid, pL] = createGrid(wL);                                //Create a grid randomly
        let entropy = gridEntropy(grid, pL, wL);                        //Score it 
        grids.push([grid, pL, entropy]);                                //Register
    }
    grids.sort((a, b) => a[2] - b[2]);                                  //Sort grids in increasing order of entropy
    [grid, pL] = grids[Math.floor(Math.random() * 1)];                  //Get the first element (note: change 1 to x to choose among x first elements)
    if (grid.length > grid[0].length){
        return [grid, pL] = flipGrid(grid, pL);                         //If grid is vertical, flip it to fit the screen
    }
    return [grid, pL];
}

function createGrid(wL){                                                //Creates a potential grid from a given word list
    let grid = [[]];                                                    //Initialize empty grid
    let placementList = [];                                             //Initialize empty placement grid
    let remainingWords = shuffleArray([...wL]);                         //Shuffle words
    //Place first word
    placeWord(grid, placementList, remainingWords[0], [0,0], Math.random() < 0.5 ? 'H':'V');
    remainingWords = remainingWords.splice(1);                          //Pop off first word
    let calls = 0;                                                      //Count number of calls to the while loop (avoid infinite loops)
    while (remainingWords.length > 0){                                  //While some words have not been placed
        calls += 1;                                                     //Increase count
        if (calls > 3*wL.length){                                       //If number of calls is too high
            return [grid, placementList];                               //Stop and return partial result
        }
        word = remainingWords[0];                                       //Get first word
        remainingWords = remainingWords.splice(1);                      //Pop it off
        let candidates = [];                                            //Record possible position where it could go
        placementList.forEach(placement => {
            candidates = candidates.concat(intersections(grid, placement, word));   //For each previously placed word, register possible intersections
        })
        if (candidates.length == 0){                                    //If word couldn't be placed
            remainingWords.push(word);                                  //Add it back to list of words, it may be placeable later
        }
        else{
            let [x, y, o] = candidates[Math.floor(Math.random() * candidates.length)];      //Choose a random position from all possibilities
            placeWord(grid, placementList, word, [x, y], o);            //Place the word
        }
    }      
    return [grid, placementList];
}

function intersections(grid, placement, word){                          //For a given placed word and candidate word, return all positions where they intersect without impeding on another word
    let candidates = [];                                                //Register all possible candidates
    let [ref_word, x, y, orientation] = placement;                      //Get input placement
    let ref_wordA = Array.from(ref_word);                               //Convert placed word to list of letters
    let wordA = Array.from(word);                                       //Convert new word to list of letters
    ref_wordA.forEach((ref_letter,i) =>{                                //Loop over all letters from both words
        wordA.forEach((letter,j) => {
            if (ref_letter == letter && i+j != 0){                      //If there are matching letters (that aren't both the first letter)
                position = [x + (orientation == 'V' ? i:-j), y + (orientation == 'H' ? i:-j)];  //Calculate where the new word would be placed (orthogonal to reference word)
                if (canPlace(grid, word, position, orientation == 'V' ? 'H' : 'V')){            //If it is a valid position (no overlap)
                    candidates.push([...position, orientation == 'V' ? 'H' : 'V']);             //Register position & orientation
                }
            }
        })
    })
    return candidates;
}

function canPlace(grid, word, position, orientation){                   //Returns a boolean on whether the new word can be placed here (no overlap with other words)
    let [x,y] = position;                                               //Unpack values
    let l = word.length;                                                //Word length
    let canPlaceBool = true;                                            //Boolean
    word = Array.from(word);                                            //Convert word to list of letters
    if (orientation == 'V'){                                            //Vertical case 
        if (x < 0){                                                     //If the word starts outside of grid
            word = word.splice(-x);                                     //Ignore the first few letters (no risk of overlap)
            x = 0;                                                      //Reset position for shortened word
        }
        word = word.splice(0, grid.length - x);                         //Ignore the last few letters if any are outside of grid (no risk of overlap)
        word.forEach((letter, i) => {
            canPlaceBool &= (grid[x+i][y] == ' ' || grid[x+i][y] == letter);    //Bool becomes false if a letter would be placed on top of another letter
            }
        )
    }
    if (orientation == 'H'){                                            //Horizontal case
        if (y < 0){                                                     //If word starts outside of grid
            word = word.splice(-y);                                     //Ignore first few letters (no risk of overlap)
            y = 0;                                                      //Reset position for shortened word
        }
        word = word.splice(0, grid[0].length - y);                      //Ignore last few letters if any are outside the grid (no risk of overlap)
        word.forEach((letter, i) => {
            canPlaceBool &= (grid[x][y+i] == ' ' || grid[x][y+i] == letter);    //Bool becomes false if a letter would be placed on top of another letter
            }
        )
    }
    return canPlaceBool;
}

function placeWord(grid, placementList, word, position, orientation){
    let [x,y] = position;                                               //Get xy position
    let l = word.length;                                                //Get word length
    if (orientation == 'V'){                                            //Handle vertical placement
        if (x < 0){                                                     //If word starts outside of the grid
            for (let i = 0; i < -x; i++)                                
                {
                    grid.unshift(Array(grid[0].length).fill(' '));      //Add the right amount of empty rows above the grid
                }
            placementList.forEach(placement => {
                placement[1] -= x;                                      //Update all placements to new coordinate system
            })
            x = 0;                                                      //Reset position within new grid
        }
        if (x + l > grid.length){                                       //If word ends outside the grid
            let gl = grid.length;                                       //Get current number of rows
            for (let i = 0; i < x + l - gl; i++)    
            {
                grid.push(Array(grid[0].length).fill(' '));             //Add the right amount of empty rows below the grid
            }
        }
        Array.from(word).forEach((letter, i) => {
            grid[x+i][y] = letter;                                      //Write the word in its correct position
        })
    }
    if (orientation == 'H'){                                            //Handle horizontal placement
        if (y < 0){                                                     //If word starts outside of grid
            grid.forEach(row => {
                for (let i = 0; i < -y; i++)
                    {
                        row.unshift(' ');                               //Add the right amount of empty columns to the left of the grid
                    }
            })
            placementList.forEach(placement => {
                placement[2] -= y;                                      //Update all placements to new coordinate system
            })
            y = 0;                                                      //Reset position within new grid
        }
        if (y + l > grid[0].length){                                    //If word ends outside of grid
            let gl = grid[0].length;                                    //Get current amount of columns
            grid.forEach(row => {
                for (let i = 0; i < y + l - gl; i++)
                    {
                        row.push(' ');                                  //Add correct amount of empty columns to the right of the grid
                    }
            })
        }
        Array.from(word).forEach((letter, i) => {
            grid[x][y+i] = letter;                                      //Write the word in its correct position
        })
    }
    placementList.push([word, x, y, orientation]);                      //Register new word placement
}

function gridEntropy(grid, pL, wL){                                     //Compute "entropy" of a given grid. Higher entropies are undesirable
    missingWords = wL.length - pL.length;                               //Number of words that haven't been placed (highly undesirable)
    sizeRatio = 1 + Math.abs(Math.max(grid.length/grid[0].length, grid[0].length/grid.length) - 1.3);       //Ratio of longest dimension over the other, compared to a 1.3 ratio (working value)
    filledRatio = (grid.length*grid[0].length)/pL.reduce((r, a) => r+a[0].length, 0);       //Ratio of empty cells over filled cells. Lower ratio indicates more intersections, which is desirable
    deadEnds = 0;                                                       //Number of dead ends (word starting or ending right next to another one, leading to a confusing length)
    pL.forEach(placement => {                                           //Loop over all words to check for dead ends
        [word, x, y, o] = placement;                                    
        if (o == 'V' && x + word.length < grid.length && grid[x + word.length][y] != ' '){      //If there is a letter right after end of word (vertical)
            deadEnds += 1;
        }
        if (o == 'H' && y + word.length < grid[0].length && grid[x][y + word.length] != ' '){   //If there is a letter right after end of word (horizontal)
            deadEnds += 1;
        }
        if (o == 'V' && x > 0 && grid[x - 1][y] != ' '){                //If there is a letter right before start of word (vertical)
            deadEnds += 1;
        }
        if (o == 'H' && y > 0 && grid[x][y - 1] != ' '){                //If there is a letter right before start of word (horizontal)
            deadEnds += 1;
        }
    })
    fakeWords = 0;                                                      //Fake Words are sequences of aligned letters that do not belong to the same word
    grid.forEach(row => {
        words = row.join('').split(' ').filter(word => word.length > 1);    //Concatenate list into string, then separate the "word"s using spaces. Ignore all 1-letter "words"
        words.forEach(word => fakeWords += !wL.includes(word));         //Count up "words that don't exist"
    })
    let [flippedGrid, flippedPL] = flipGrid(grid, pL);                  //Flip the grid to do the same thing over columns
    flippedGrid.forEach(row => {
        words = row.join('').split(' ').filter(word => word.length > 1);
        words.forEach(word => fakeWords += !wL.includes(word));
    })
    //The weighting of the different values is arbitrary and may be changed
    //Missing words and dead ends are highly undesirable so have high weights, other issues are lower
    return missingWords * 1000 + sizeRatio * 50 + filledRatio * 50 + deadEnds * 250 + fakeWords * 100;
}

function flipGrid(grid, pL){                                            //Flip a grid in case of higher height than width (for better display)
    return [grid[0].map((_, colIndex) => grid.map(row => row[colIndex])), pL.map((p) => [p[0], p[2], p[1], p[3] == 'H' ? 'V': 'H'])];
}

function generateGrid(grid){                                            //Create the html element from the given grid
    grid.forEach(row => {
        let rowDiv = document.createElement('div');                     //Create each row
        rowDiv.classList.add('row');                                    //Style it
        row.forEach(cell => {
            let cellDiv = document.createElement('div');                //Create each cell in each row
            cellDiv.classList.add('cell');                              //Style it
            if (cell == ' '){                                           //If it shouldn't have a letter
                cellDiv.classList.add('hidden');                        //Style it
            }
            //cellDiv.textContent = cell;                               //Write the letter (only for testing)
            cellDiv.textContent = ' ';                                  
            cellDivs.push(cellDiv);                                     //Push cell to registering array
            gridPhantom.push(cell);                                     //Push value to grid horizontal phantom
            rowDiv.appendChild(cellDiv);                                //Append cell to row
        })
        gridDiv.appendChild(rowDiv);                                    //Append row to grid
    });
    generateLabels(placementList);
}

function generateLabels(placementList){
    const hPlacements = placementList.filter(item => item[3] === 'H').sort((a, b) => a[1] - b[1]);  // Sort by the second element
    const vPlacements = placementList.filter(item => item[3] === 'V').sort((a, b) => a[2] - b[2]);  // Sort by the third element
    placementList = [...hPlacements, ...vPlacements];
    hPlacements.forEach((placement,i) => {
        let [word, x, y, o] = placement;
        HHints.push(hintList[wordList.indexOf(word)]);
        let label = document.createElement("div");
        label.classList.add("label");
        label.textContent = (i+1);
        cellDivs[switchCoords([x,y])].appendChild(label);
        let hint = document.createElement("span");
        hint.textContent = (i+1).toString() + " - " + hintList[wordList.indexOf(word)];
        document.getElementById("HHints").appendChild(hint);
        hint.onclick = (()=>cellSel(switchCoords([x,y]), 'H'));
    })
    vPlacements.forEach((placement,i) => {
        let [word, x, y, o] = placement;
        VHints.push(hintList[wordList.indexOf(word)]);
        let label = document.createElement("div");
        label.classList.add("label");
        label.textContent = (i+1);
        cellDivs[switchCoords([x,y])].appendChild(label);
        let hint = document.createElement("span");
        hint.textContent = (i+1).toString() + " - " + hintList[wordList.indexOf(word)];
        document.getElementById("VHints").appendChild(hint);
        hint.onclick = (()=>cellSel(switchCoords([x,y]), 'V'));
    })
}

function switchCoords(coords){                                          //Switch between 1D and 2D coordinates
    let n = grid[0].length;
    return typeof coords == 'number' ? [Math.floor(coords/n), coords%n] : coords[0]*n + coords[1];
}

function placementToID(placement){
    [word, x, y, o] = placement;
    let ids = [];
    for (var i = 0; i < word.length; i++){
        ids.push(switchCoords([x + (o == 'V' ? i : 0), y + (o == 'H' ? i : 0)]))
    }
    return ids;
}

function IDtoPlacement(i){
    pls = [];
    placementList.forEach(placement => {
        let ids = placementToID(placement);
        if (ids.includes(i)){pls.push(placement)};
    })
    return pls;
}

/// CELL SELECTION ///////////////////////////////////////////////////////////////////

function cellSel(i, o){
    cellDivs.forEach(cell => {
        cell.classList.remove('main');
        cell.classList.remove('secondary');
    })
    let placements = IDtoPlacement(i);
    if (o != ''){
        placements = placements.filter((x) => x[3] == o);
    }
    let ids = [];
    if ((i != selID && placements.includes(selPlacement) && o == '')){
        ids = placementToID(selPlacement);
    }
    else if (i == selID && placements[0] == selPlacement && placements.length > 1){
        ids = placementToID(placements[1]);
        selPlacement = placements[1];
    } 
    else{
        ids = placementToID(placements[0]);
        selPlacement = placements[0];
    }
    ids.forEach(j => {
        cellDivs[j].classList.add('secondary');
    })
    cellDivs[i].classList.add('main');
    cellDivs[i].classList.remove('secondary');
    selID = i;
}

function deselect(){
    selID = -2;
    selPlacement = [];
    cellDivs.forEach(cell => {
        cell.classList.remove('main');
        cell.classList.remove('secondary');
    })
}