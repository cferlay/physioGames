let allLabels = document.querySelectorAll('.label');
const checkButton = document.getElementById('checkButton');
const gridContainer = document.getElementById('gridContainer');
const body = document.body;
const arrowInstruction = document.getElementById("arrowInstruction");

let arrows = [];
let connections = [];
let buttons = [];
let buttonsUpdate = [];

let connectionsVerif = [["lab00", "lab01"], ["lab01", "lab02"], ["lab02", "lab03"], ["lab02", "lab04"], ["lab02", "lab05"], ["lab04", "lab06"], ["lab04", "lab07"], ["lab04", "lab08"], ["lab04", "lab09"], ["lab10", "lab06"], ["lab10", "lab07"], ["lab08", "lab12"], ["lab09", "lab12"], ["lab12", "lab11"]];
let tutorial_connectionsVerif = [["labA", "labB"], ["labB", "labC"]];

let arrowMode = false;

function isMobile() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /android|ipad|iphone|ipod/i.test(userAgent);
}

let allLabels_0 = Array.from(document.querySelectorAll('.label')).slice(0,3);
let allLabels_1 = Array.from(document.querySelectorAll('.label')).slice(3);
allLabels_1.forEach(rec => rec.style.display = "none");

/// CLICK AND DRAG ////////////////////////////////////////////////////////////////////////////

var userX = 0;
var userY = 0;

let lastTrigger = 0;

let lastCreation = Date.now();

function removeAllEventListeners(element) {
  const newElement = element.cloneNode(true);
  element.parentNode.replaceChild(newElement, element);
  return newElement;
}

allLabels.forEach(label => {
  label.onmousedown = dragFunction(label);
  label.addEventListener('touchstart', dragFunction(label));
  label.ondragstart = function() {return false;};
  label.addEventListener("click", arrowCandidateFunction(label));
})

function dragFunction(element){
    return function(event){
      if (arrowMode){
        return 0;
      }
      userX = event.clientX || event.targetTouches[0].pageX;
      userY = event.clientY || event.targetTouches[0].pageY;
      let shiftX = userX - element.getBoundingClientRect().left;
      let shiftY = userY - element.getBoundingClientRect().top;
    const parent = element.parentNode;
    if (parent != body){parent.style.zIndex = 0};
    document.body.appendChild(element);
    element.style.pointerEvents = "none";
    element.style.position = "fixed";
    element.style.zIndex = 5;
    clickCount++;
    moveAt(userX, userY);
    const startTime = Date.now();
  
    function moveAt(pageX, pageY) {
      element.style.left = pageX - shiftX + 'px';
      element.style.top = pageY - shiftY + 'px';
      if (arrows.length > 0) {
        arrows.forEach(line => {
          let A = line.start;
          let B = line.end;
          line.path =  d(A,B) < 1.5*A.getBoundingClientRect().width ? "straight" : "fluid";
          line.position()});
        buttonsUpdate.forEach(f => f());
      }
    }
  
    function onMouseMove(event) {
      userX = event.clientX || event.targetTouches[0].pageX;
      userY = event.clientY || event.targetTouches[0].pageY;
      moveAt(userX, userY);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchend', onMouseUp);
  
    function onMouseUp(event) {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',onMouseUp);
      document.removeEventListener('touchmove', onMouseMove);
      document.removeEventListener('touchend',onMouseUp);
      if (Date.now() - lastTrigger > 0){
        body.appendChild(element);
        let boolean = true;
        lastTrigger = Date.now();
        element.style.pointerEvents = "auto";
        element.onmouseup = null;
        if (element.getBoundingClientRect().left < gridContainer.getBoundingClientRect().left){
          element.style.left = gridContainer.getBoundingClientRect().left + "px";
        }
        if (element.getBoundingClientRect().top < gridContainer.getBoundingClientRect().top){
          element.style.top = gridContainer.getBoundingClientRect().top + "px";
        }
        if (element.getBoundingClientRect().right > gridContainer.getBoundingClientRect().right){
          element.style.left = element.getBoundingClientRect().left - (element.getBoundingClientRect().right - gridContainer.getBoundingClientRect().right + 50) + "px";
        }
        if (element.getBoundingClientRect().bottom > gridContainer.getBoundingClientRect().bottom){
          element.style.top = element.getBoundingClientRect().top - (element.getBoundingClientRect().bottom - gridContainer.getBoundingClientRect().bottom + 50) + "px";
        }
        if (arrows.length > 0) {
          arrows.forEach(line => {
            let A = line.start;
            let B = line.end;
            line.path =  d(A,B) < 1.5*A.getBoundingClientRect().width ? "straight" : "fluid";
            line.position()});
          buttonsUpdate.forEach(f => f());
        }
      }
      }
      }
  }

/// ARROW MODE /////////////////////////////////////////////////////////////////////////////////////

const newArrow = document.getElementById('newArrow');
newArrow.addEventListener("click",startArrowMode);

const trashButton = document.getElementById("trashButton");
trashButton.addEventListener("click",clickTrash);

document.getElementById("newArrowLabel").style.opacity = 0.9;

document.getElementById("arrowWrap").style.animation = "highlight 2s ease-in-out 0s infinite";

function startArrowMode(){
  let label = document.getElementById("newArrowLabel");
  if(label.style.opacity == 0.9){label.style.opacity = ""};
  label.textContent = "Enter build mode";
  document.getElementById("arrowWrap").style.animation = "";
  arrowMode = true;
  newArrow.removeEventListener("click", startArrowMode);
  newArrow.addEventListener("click",endArrowMode);
  newArrow.src = "../assets/build.png";
  document.getElementById("AMOverlay").style.display = "block";
  document.getElementById("BMOverlay").style.display = "none";
}

let arrowStart = "none";
arrowInstruction.textContent = "← Select arrow starting point →";

function arrowCandidateFunction(element){
  return function () {
    if (!arrowMode){
      return 0;
    }
    if (element.classList.contains("correctRectangle")){
      return 0;
    }
    if (arrowStart == "none"){
      arrowStart = element;
      arrowStart.classList.add("selected");
      arrowInstruction.textContent = "→ Select arrow end point ←";
    }
    else{
      if (!contains(connections,[arrowStart.id, element.id]) && arrowStart != element){
        createArrow(arrowStart, element);
      }
      arrowStart.classList.remove("selected");
      arrowStart = "none";
      arrowInstruction.textContent = "← Select arrow starting point →";
    }
  }
}

function contains(a,x){
  for (let i = 0; i < a.length; i++){
    if (a[i][0] == x[0] && a[i][1] == x[1]){
      return true;
    }
  }
  return false;
}

function d(A,B){
  return Math.sqrt(Math.pow(A.getBoundingClientRect().left - B.getBoundingClientRect().left,2) + Math.pow(A.getBoundingClientRect().top - B.getBoundingClientRect().top,2));
}

let firstTime = true;

async function createArrow(A,B){
  path =  d(A,B) < 1.5*A.getBoundingClientRect().width ? "straight" : "fluid";
  var line =  new LeaderLine(A,B,{color:"var(--pseudo-black)", size: 5, hide: true, path: path});
  line.show("draw", {duration: 500});
  arrows.push(line);
  let connector = [A.id, B.id];
  connections.push(connector);
  let i = arrows.length - 1;
  await delay(510);
  buttons.push(deleteButton(line, connector));
  if (firstTime){
    firstTime = false;
    document.getElementById("trashButtonLabel").style.opacity = 0.9;
  }
}


function endArrowMode(){
  document.getElementById("newArrowLabel").textContent = "Enter arrow mode";
  arrowMode = false;
  newArrow.removeEventListener("click", endArrowMode);
  newArrow.addEventListener("click", startArrowMode);
  newArrow.src = "../assets/NewArrow.png";
  document.getElementById("AMOverlay").style.display = "none";
  document.getElementById("BMOverlay").style.display = "block";
  if (arrowStart != "none") {arrowStart.classList.remove("selected");}
  arrowStart = "none";
  arrowInstruction.textContent = "← Select arrow starting point →";
}

function clickTrash(){
  document.querySelectorAll('.deleteElement').forEach(element => {element.style.display = (trashButton.style.opacity == 1) ? "none" : "block";});
  document.getElementById("trashButtonLabel").textContent = (trashButton.style.opacity == 1) ? "Show removal buttons" : "Hide removal buttons";
  trashButton.style.opacity = (trashButton.style.opacity == 1) ? 0.5 : 1;
  buttonsUpdate.forEach(f => f());
  if(document.getElementById("trashButtonLabel").style.opacity == 0.9){document.getElementById("trashButtonLabel").style.opacity = ""};
}

function deleteButton(line, connector){
  line.middleLabel = LeaderLine.captionLabel("X");
  let cap = document.querySelector('text:not(.deleteElement)');
  let x = parseFloat(cap.getBoundingClientRect().left) + parseFloat(cap.getBoundingClientRect().width)/2;
  let y = parseFloat(cap.getBoundingClientRect().top) + parseFloat(cap.getBoundingClientRect().height)/2;
  let box = document.createElement("div");
  box.classList.add('deleteButton');
  box.style.position = "absolute";
  box.style.left = (x-10)+'px';
  box.style.top = (y-10)+'px';
  box.style.width = 20+'px';
  box.style.height = 20+'px';
  document.body.appendChild(box);
  cap.classList.add('deleteElement');
  box.classList.add('deleteElement');
  document.querySelectorAll('.deleteElement').forEach(element => {element.style.display = (trashButton.style.opacity == 1) ? "block" : "none";});
  let uf = updateFunction(box, cap);
  buttonsUpdate.push(uf);
  box.addEventListener("click",function (){
    line.hide("draw", {duration: 500});
    buttons.splice(buttons.indexOf(box),1);
    box.remove();
    arrows.splice(arrows.indexOf(line),1);
    connections.splice(connections.indexOf(connector),1);
    buttonsUpdate.splice(buttonsUpdate.indexOf(uf),1);
  });
  box.addEventListener("hover", function (){
    line.outlineColor = "white";
  })
  return box;
  
}

function updateFunction(box, cap){
  return function(){
    let x = parseFloat(cap.getBoundingClientRect().left) + parseFloat(cap.getBoundingClientRect().width)/2;
    let y = parseFloat(cap.getBoundingClientRect().top) + parseFloat(cap.getBoundingClientRect().height)/2;
    box.style.left = (x-10)+'px';
    box.style.top = (y-10)+'px';
  }
}

/// ADDING TRANSPORTERS TO RECTANGLES //////////////////////////////////////////////////////////////

let counter = 0;

/// BUTTON ////////////////////////////////////////////////////////////////////////////////////

checkButton.addEventListener('click',verifyGrid_0);

let attempt = 0;
let currentScore = 0;
let highScore = 0;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let wrongConnections = 0;
let missingConnections = 0;
let correctConnections = 0;
let totalCorrect = 0;

async function verifyGrid_0(){
  let allGood = true;
  connections.forEach((connector,i) => {
    if (contains(tutorial_connectionsVerif, connector)){
      if (buttons[i].classList.contains('deleteElement')){
        arrows[i].middleLabel.remove();
      }
      buttons[i].classList.remove("deleteElement");
      buttons[i].style.display = 'none';
      arrows[i].color = "darkgreen";
    }
    else{
      allGood = false;
      arrows[i].color = "maroon";
    }
  })
  tutorial_connectionsVerif.forEach((connector,i) => {
    if (!contains(connections, connector)){
      allGood = false;
      console.log('check');
    }
  }) 

  if (allGood){
    arrows.forEach(line => line.remove());
    allLabels_0.forEach(lab => lab.style.display = "none");
    allLabels_1.forEach(lab => lab.style.display = "");
    checkButton.removeEventListener('click',verifyGrid_0);
    checkButton.addEventListener('click',verifyGrid);
    buttons.forEach(button => button.remove());
    endArrowMode();
    arrows = [];
    connections = [];
    buttons = [];
    buttonsUpdate = [];
    attempt = 0;
  }
  else{
    if (trashButton.style.opacity != 1){clickTrash()};
  }
}

async function verifyGrid() {
  attempt += 1;
  let allGood = true;
  connections.forEach((connector,i) => {
    if (contains(connectionsVerif, connector)){
      if (buttons[i].classList.contains('deleteElement')){
        correctConnections += 1;
        arrows[i].middleLabel.remove();
      }
      buttons[i].classList.remove("deleteElement");
      buttons[i].style.display = 'none';
      arrows[i].color = "darkgreen";
    }
    else{
      allGood = false;
      arrows[i].color = "maroon";
      wrongConnections += 1;
      if (trashButton.style.opacity != 1){clickTrash()};
    }
  })
  connectionsVerif.forEach((connector,i) => {
    if (!contains(connections, connector)){
      missingConnections += 1;
      allGood = false;
    }
  })

  allLabels.forEach(lab =>{
    let drawn = connections.filter(arrow => arrow.includes(lab.id));
    let expected = connectionsVerif.filter(arrow => arrow.includes(lab.id));
    console.log(lab.id, drawn, expected);
    if (arraysEqual(drawn, expected)){
      lab.classList.add("correctRectangle");
    }})  

  if (wrongConnections > 0 && trashButton.style.opacity < 1){
    clickTrash();
  }

  currentScore += correctConnections * (attempt == 1 ? 10 : attempt == 2 ? 5 : 1);
  currentScore -= wrongConnections * (attempt == 1 ? 1: attempt == 2 ? 2 : 3);
  currentScore -= missingConnections * (attempt == 1 ? 1: attempt == 2 ? 2 : 3);
  totalCorrect += correctConnections;
  document.getElementById('currentScore').textContent = currentScore;
  if (currentScore > highScore){
    highScore = currentScore;
    document.getElementById('highScore').textContent = highScore;
    localStorage.setItem('RAAS2_highScore',highScore);
  }
  if (allGood){
    attempt = 0;
    gameOver();
}
else{
  keepTrying();
}
wrongConnections = 0;
correctConnections = 0;
missingConnections = 0;
}

function arraysEqual(arr1, arr2) {
  // Check if both arrays are the same length
  if (arr1.length !== arr2.length) {
    return false;
  }

  // Sort both arrays and their sub-arrays
  const sortedArr1 = arr1.map(subArr => [...subArr]).sort();
  const sortedArr2 = arr2.map(subArr => [...subArr]).sort();

  // Compare each sub-array
  return sortedArr1.every((subArr1, index) => {
    const subArr2 = sortedArr2[index];

    // Check if each element in the sub-arrays is equal
    return subArr1.every((element, subIndex) => element === subArr2[subIndex]);
  });
}


/// LEVELS ////////////////////////////////////////////////////////////////////////////////


function gameOver(){
  const goWindow = document.getElementById("gameOverWindow");
  document.getElementById('gameOverScore').textContent = ' '+currentScore+' ';
  goWindow.style.display = "flex";
}

function keepTrying(){
  const kT = document.getElementById("keepTryingWindow");
  void kT.offsetWidth;
  document.getElementById('correct').textContent = totalCorrect;
  document.getElementById('wrong').textContent = wrongConnections;
  document.getElementById('missing').textContent = missingConnections;
  document.getElementById('connector').textContent = (wrongConnections * missingConnections == 0) ? " but " : " and ";
  document.getElementById('wrongGrammar').textContent = wrongConnections == 1 ? " connection is " : " connections are ";
  document.getElementById('missingGrammar').textContent = missingConnections == 1 ? " connection is " : " connections are ";
  kT.style.display = "flex";
}

let clickCount = 0;

// Function to update the counter
function updateClickCount() {
    clickCount++;
    document.getElementById('clicks').textContent = clickCount;
}

        // Add a click event listener to the whole document
document.addEventListener('click', updateClickCount);