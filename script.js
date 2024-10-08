var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d', { willReadFrequently: true });

const BACKGROUND_COLOR = '#000000';
let PHOTON_HEAD_SIZE = 1.30;
let PHOTON_TAIL_SIZE = 0.50;
let MAG_HEAD_SIZE = 3.00;
let MAG_TAIL_SIZE = 1.00;
const ORIGIN = [400, 400]; // The light source
const MAG = ORIGIN; // The point to be magnified
let THETA = (Math.PI) / 6;
let NUMBER_LIGHT_RAYS = 360;
let ANGLE = 360;
let RENDER_INTERVAL_TIME = 33;
let PRECISION = 0.3;
let SCREEN_ZOOM = 0.97 * (window.innerWidth / 1850);

//Screen Zoom
function setZoom() {
  SCREEN_ZOOM = 0.97 * (window.innerWidth / 1850);
  document.body.style.transform = `scale(${SCREEN_ZOOM})`;
  document.body.style.transformOrigin = "0 0"; // Set the origin to top-left
}
setZoom();

// Add an event listener to resize the zoom when the window is resized
window.addEventListener('resize', setZoom);

// Version toggle
function toggleVersion() {
  if (customAngle.checked) {
    angleDiv.style.display = 'block';
    rayDiv.style.display = 'none';
    addPhotonButton.style.display = 'block';
  } else {
    angleDiv.style.display = 'none';
    rayDiv.style.display = 'block';
    addPhotonButton.style.display = 'none';
  }
}

function applyColors() {
  WALL_COLOR = document.getElementById("wallColorInput").value;
  PHOTON_HEAD_COLOR = document.getElementById("photonHeadColorInput").value;
  PHOTON_TAIL_COLOR = document.getElementById("photonTailColorInput").value;
  MAG_COLOR = document.getElementById("magnifierColorInput").value;
  ORIGIN_COLOR = document.getElementById("magnifierColorInput").value;
  draw(); // Update canvas with new colors
}

// Function to change THETA value
function changeTheta() {
    NUMBER_TRIANGLES = document.getElementById("triangleInput").value
    if (NUMBER_TRIANGLES % 25 === 0){
      THETA = Math.PI / (NUMBER_TRIANGLES - (-0.00000001))
    }
    else {
      THETA = Math.PI / NUMBER_TRIANGLES
    }
    //testing: THETA = Math.PI / document.getElementById("triangleInput").value;
    calculateCoords(); // Recalculate coordinates
    draw(); // Update canvas
}

// Function to change number of light rays
function changeNumRays() {
    NUMBER_LIGHT_RAYS = parseInt(document.getElementById("numRaysInput").value);
}

// Function to change the angle of the light ray
function changeAngle() {
  ANGLE = parseFloat(document.getElementById("angleInput").value);
}

// Function to change rendering speed
function changeSpeed() {
    RENDER_INTERVAL_TIME = parseInt(document.getElementById("speedInput").value);
}

// Changes Epsilon Value
function changeEpsilon() {
  PRECISION = parseFloat(document.getElementById("epsilonInput").value);
  //console.log(PRECISION);
}

// Changes the Thickness
function changeThickness() {
  PHOTON_HEAD_SIZE = parseFloat(document.getElementById("headSizeInput").value);
  PHOTON_TAIL_SIZE = parseFloat(document.getElementById("tailSizeInput").value);
  MAG_HEAD_SIZE = parseFloat(document.getElementById("magHeadSizeInput").value);
  MAG_TAIL_SIZE = parseFloat(document.getElementById("magTailSizeInput").value);
}

const MAG_SIDE = 20; // Side length of the `MAG` box.
// The centre of the magnifier.
const MAG_VIEW = [
  850,
  150
];
const MAG_VIEW_SIDE = 200; // Side length of the `MAX_VIEW` box.

// Do not change: to alter these polygons, change `MAG`.
const MAG_SQUARE = new Square(
  MAG[0] - MAG_SIDE / 2,
  MAG[1] - MAG_SIDE / 2,
  MAG_SIDE
);
const MAG_BOX = [
  [MAG[0] - MAG_SIDE / 2, MAG[1] - MAG_SIDE / 2],
  [MAG[0] - MAG_SIDE / 2, MAG[1] + MAG_SIDE / 2],
  [MAG[0] + MAG_SIDE / 2, MAG[1] + MAG_SIDE / 2],
  [MAG[0] + MAG_SIDE / 2, MAG[1] - MAG_SIDE / 2],
]

// Do not change: to alter this polygon, change `MAG_VIEW`.
const MAG_VIEW_BOX = [
  [MAG_VIEW[0] - MAG_VIEW_SIDE / 2, MAG_VIEW[1] - MAG_VIEW_SIDE / 2],
  [MAG_VIEW[0] - MAG_VIEW_SIDE / 2, MAG_VIEW[1] + MAG_VIEW_SIDE / 2],
  [MAG_VIEW[0] + MAG_VIEW_SIDE / 2, MAG_VIEW[1] + MAG_VIEW_SIDE / 2],
  [MAG_VIEW[0] + MAG_VIEW_SIDE / 2, MAG_VIEW[1] - MAG_VIEW_SIDE / 2],
]

function calculateCoords() {
  COORDS = [];
  if (THETA != (Math.PI)/4) {
    for (let i = 1; i <= (2 * Math.PI) / THETA; i++) {
      if (i % 2 === 0) {
        COORDS.push([
          400 + 350 * Math.sin(i * THETA),
          400 + 350 * Math.cos(i * THETA)
        ]);
      } else {
        COORDS.push([
          400 + (175 / Math.cos(THETA)) * Math.sin(i * THETA),
          400 + (175 / Math.cos(THETA)) * Math.cos(i * THETA)
        ]);
      }
    }
  } else {
    COORDS.push(
      [400+350*Math.sin(2*THETA), 400+350*Math.cos(2*THETA)],
      [400+350*Math.sin(4*THETA), 400+350*Math.cos(4*THETA)],
      [400+350*Math.sin(6*THETA), 400+350*Math.cos(6*THETA)],
      [400+350*Math.sin(8*THETA), 400+350*Math.cos(8*THETA)],
    );
  }
}

var boundaries = new Array(); // LineSegment instances representing walls.
var photons = new Array(); // Photon instances representing light.
var renderInterval;

// Streaks of light in the `MAG` box.
// Stores information in the form [Point1, Point2, Color].
var magLines = new Array(); // Streaks of light in the `MAG` box.

// Recording infrastructure.
var video = new Whammy.Video(RENDER_INTERVAL_TIME);
var currentlyRecording = false;
var recording = document.getElementById('recording');
var downloadButton = document.getElementById('downloadButton');
var statusElement = document.getElementById('status');
var startRecButton = document.getElementById('startRecButton');
var numCapturedFrames = 0;

function displayStatus(message) {
  statusElement.innerHTML = message;
}

function startRecording() {
  if (currentlyRecording) {
    return;
  }
  if (!confirm('This feature only works on Firefox right now. Proceed?')) {
    return;
  }
  currentlyRecording = true;
}

function stopRecording() {
  if (!currentlyRecording) {
    return;
  }
  currentlyRecording = false;
  startRecButton.disabled = true;
  startAllButton.disabled = true;
  displayStatus('Compiling video...');
  const timeStart = +new Date;
  video.compile(false, function(output) {
    var url = (window.URL ? URL : webkitURL).createObjectURL(output);
    console.log(url);
    recording.src = url;
    downloadButton.href = recording.src;
    const timeEnd = +new Date;
    console.log(output);
    displayStatus(`Video compile time: ${timeEnd - timeStart}ms. Size ` +
        `${Math.ceil(output.size / 1024)}KB.`);
  });
}

// Initialize the application
window.onload = function() {
  calculateCoords();
  applyColors();
  changeNumRays();
  changeSpeed();
};

function loadBoundaries() {
  boundaries = new Array();
  for (var i = 0; i < COORDS.length; ++i) {
    nxtIdx = (i + 1) % COORDS.length;
    boundaries.push(new LineSegment(
      COORDS[i][0],
      COORDS[i][1],
      COORDS[nxtIdx][0],
      COORDS[nxtIdx][1]
    ));
  }
}

function createPhotons() {
  photons = new Array();
  var photonRadius = 15;
  for (var i = 0; i < NUMBER_LIGHT_RAYS; ++i) {
    var fractionOfAngle = (i / NUMBER_LIGHT_RAYS) * Math.PI * 2;
    photons.push(new Photon(
      ORIGIN[0] + photonRadius * Math.cos(fractionOfAngle),
      ORIGIN[1] + photonRadius * Math.sin(fractionOfAngle),
      (i / NUMBER_LIGHT_RAYS) * 2 * Math.PI,
      (5*PRECISION*THETA)/Math.PI,
      (5*PRECISION*THETA)/Math.PI,
      PHOTON_HEAD_COLOR,
      PHOTON_TAIL_COLOR
    ));
  }
}

function createPhotons2() {
  photons = new Array();
  var photonRadius = 15;
  var fractionOfAngle = -(ANGLE / 360) * Math.PI * 2;
  photons.push(new Photon(
      ORIGIN[0] + photonRadius * Math.cos(fractionOfAngle),
      ORIGIN[1] + photonRadius * Math.sin(fractionOfAngle),
      Math.PI * (-ANGLE / 180), 
      (5*PRECISION*THETA)/Math.PI,
      (5*PRECISION*THETA)/Math.PI, 
      PHOTON_HEAD_COLOR, 
      PHOTON_TAIL_COLOR));
}

function addPhoton() {
  var photonRadius = 15;
  var fractionOfAngle = (ANGLE / 360) * Math.PI * 2;

  var newPhoton = new Photon(
    ORIGIN[0] + photonRadius * Math.cos(fractionOfAngle),
    ORIGIN[1] + photonRadius * Math.sin(fractionOfAngle),
    Math.PI * (-ANGLE / 180), 
    PRECISION,
    PRECISION, 
    PHOTON_HEAD_COLOR, 
    PHOTON_TAIL_COLOR);

  photons.push(newPhoton);
}


function drawCircle(x, y, radius, color) {
  ctx.beginPath();
  ctx.fillStyle = color; 
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
}

function drawSquare(x, y, sideLength, color) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.fillRect(x - sideLength / 2, y - sideLength / 2, sideLength, sideLength);
  ctx.closePath();
}

function drawLine(x1, y1, x2, y2, color, width = PHOTON_TAIL_SIZE) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawBackground() {
  ctx.beginPath();
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fill();
}

function drawRoom() {
  for (var i = 0; i < COORDS.length; ++i) {
    var nxtIdx = (i + 1) % COORDS.length;
    drawLine(COORDS[i][0], COORDS[i][1], COORDS[nxtIdx][0],
        COORDS[nxtIdx][1], WALL_COLOR, 10);
    drawCircle(COORDS[i][0], COORDS[i][1], 5, WALL_COLOR);
  }
  ctx.beginPath();
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.moveTo(COORDS[0][0], COORDS[0][1]);
  for (var i = 0; i < COORDS.length; ++i) {
    nxtIdx = (i + 1) % COORDS.length;
    ctx.lineTo(COORDS[nxtIdx][0], COORDS[nxtIdx][1]);
  }
  ctx.closePath();
  ctx.fill();
}

function drawPointsOfInterest() {
  drawCircle(ORIGIN[0], ORIGIN[1], 2, ORIGIN_COLOR);
  drawCircle(MAG[0], MAG[1], 2, MAG_COLOR);
  drawCircle(MAG[0], MAG[1], 0.7, BACKGROUND_COLOR);
}

function drawPhotons() {
  for (var i = 0; i < photons.length; ++i) {
    const len = photons[i].contactPoints.length;
    for (var j = 0; j < len - 1; ++j) {
      drawLine(
        photons[i].contactPoints[j][0],
        photons[i].contactPoints[j][1],
        photons[i].contactPoints[j + 1][0],
        photons[i].contactPoints[j + 1][1],
        photons[i].tailColor
      );
    }
    drawLine(
      photons[i].contactPoints[len - 1][0],
      photons[i].contactPoints[len - 1][1],
      photons[i].x,
      photons[i].y,
      photons[i].tailColor
    );
  }
  for (var i = 0; i < photons.length; ++i) {
    if (photons[i].active) {
      drawCircle(photons[i].x, photons[i].y, PHOTON_HEAD_SIZE, photons[i].headColor);
    }
  }
}

function drawMag() {
  // Draw the circle.
  drawCircle(MAG_VIEW[0], MAG_VIEW[1], 3, MAG_COLOR);
  drawCircle(MAG_VIEW[0], MAG_VIEW[1], 1.5, BACKGROUND_COLOR);
  // Draw lines from past photons.
  for (var i = 0; i < magLines.length; ++i) {
    drawLine(
      magLines[i][0][0],
      magLines[i][0][1],
      magLines[i][1][0],
      magLines[i][1][1],
      magLines[i][2],
      MAG_TAIL_SIZE
    );
  }
  // Draw the photons.
  for (var i = 0; i < photons.length; ++i) {
    if (MAG_SQUARE.contains(photons[i].x, photons[i].y)) {
      var dx = photons[i].x - MAG[0];
      var dy = photons[i].y - MAG[1];
      var viewerX = MAG_VIEW[0] + (MAG_VIEW_SIDE / MAG_SIDE) * dx;
      var viewerY = MAG_VIEW[1] + (MAG_VIEW_SIDE / MAG_SIDE) * dy;
      drawCircle(viewerX, viewerY, MAG_HEAD_SIZE, photons[i].headColor);
      drawLine(photons[i].magEntry[0], photons[i].magEntry[1], viewerX,
          viewerY, photons[i].tailColor, MAG_TAIL_SIZE);
    }
  }
  // Draw the box around the point in the room.
  for (var i = 0; i < MAG_BOX.length; ++i) {
    var nxtIdx = (i + 1) % MAG_BOX.length;
    drawLine(MAG_BOX[i][0], MAG_BOX[i][1], MAG_BOX[nxtIdx][0],
        MAG_BOX[nxtIdx][1], MAG_COLOR, 2);
    drawCircle(MAG_BOX[i][0], MAG_BOX[i][1], 1, MAG_COLOR);
  }
  // Draw the viewer bounds.
  for (var i = 0; i < MAG_VIEW_BOX.length; ++i) {
    var nxtIdx = (i + 1) % MAG_VIEW_BOX.length;
    drawLine(MAG_VIEW_BOX[i][0], MAG_VIEW_BOX[i][1],
        MAG_VIEW_BOX[nxtIdx][0], MAG_VIEW_BOX[nxtIdx][1], MAG_COLOR, 2);
    drawCircle(MAG_VIEW_BOX[i][0], MAG_VIEW_BOX[i][1], 1, MAG_COLOR);
  }
}

function draw() {
  drawBackground();
  drawRoom();
  drawPhotons();
  drawPointsOfInterest();
  drawMag();
}

function updatePhotonCount() {
  const activePhotonCount = photons.filter(photon => photon.active).length;
  document.getElementById('activePhotonCount').innerText = activePhotonCount;
}

function updatePositions() {
  // Delete photons that hit corners.
  for (var i = photons.length - 1; i >= 0; --i) {
    for (var point = 0; point < COORDS.length; ++point) {
      if (photons[i].checkPointCollision(
            COORDS[point][0], COORDS[point][1])) {
        photons[i].deactivate();
        break;
      }
    }
  }
  // Bounce photons off edges.
  for (var i = 0; i < photons.length; ++i) {
    for (var edge = 0; edge < boundaries.length; ++edge) {
      if (edge !== photons[i].lastBounce &&
          photons[i].checkLineCollision(boundaries[edge])) {
        photons[i].lastBounce = edge;
        photons[i].bounceOffSegment(boundaries[edge]);
        hasBounced = true;
        break;
      }
    }
  }
  // Move the photons.
  for (var i = 0; i < photons.length; ++i) {
    photons[i].updatePosition();
  }

  // Update the active photon count.
  updatePhotonCount()
}

function updateMag() {
  for (var i = 0; i < photons.length; ++i) {
    if (MAG_SQUARE.contains(photons[i].x, photons[i].y)) {
      var dx = photons[i].x - MAG[0];
      var dy = photons[i].y - MAG[1];
      var viewerX = MAG_VIEW[0] + (MAG_VIEW_SIDE / MAG_SIDE) * dx;
      var viewerY = MAG_VIEW[1] + (MAG_VIEW_SIDE / MAG_SIDE) * dy;
      if (photons[i].magEntry === null) {
        // Just entered the square.
        photons[i].magEntry = [viewerX, viewerY];
      }
      photons[i].lastMagPoint = [viewerX, viewerY];
    } else if (!MAG_SQUARE.contains(photons[i].x, photons[i].y) &&
        photons[i].magEntry !== null) {
      // Just left the square.
      magLines.push([
        photons[i].magEntry,
        photons[i].lastMagPoint,
        photons[i].tailColor,
      ]);
      photons[i].magEntry = null;
      photons[i].lastMagPoint = null;
    }
  }
}

function updateScreen() {
  for (var i = 0; i < 10; ++i) {
    updatePositions();
    updateMag();
  }
  draw();
  if (currentlyRecording) {
    video.add(ctx);
    ++numCapturedFrames;
    if (numCapturedFrames % RENDER_INTERVAL_TIME == 0) {
      var secs = numCapturedFrames / RENDER_INTERVAL_TIME;
      displayStatus(`Recording: captured ${secs} second(s) of film so far...`);
    }
  }
}

function startAnimation() {
  clearInterval(renderInterval);
  magLines = new Array();
  loadBoundaries();
  if (customAngle.checked) {
    createPhotons2();
  } else {
    createPhotons();
  }
  renderInterval = setInterval(updateScreen, RENDER_INTERVAL_TIME);
}

function startAnimationAndRecording() {
  if (currentlyRecording) {
    return;
  }
  startRecording();
  if (!currentlyRecording) {
    // The user cancelled the operation
    return;
  }
  video.add(ctx);
  startAnimation();
}

function stopAnimation() {
  clearInterval(renderInterval);
}
