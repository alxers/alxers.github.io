var canvas;
var ctx;
var secondsPassed;
var oldTimeStamp;

var DEBUG_MODE = true;

// Obstacle avoidance params
var MIN_DETECTION_BOX_LEN = 40; // 40 by default
// Used for debugging
var DETECTION_BOX_LEN = 0;
var AGENT_HEADING = { x: 0, y: 0 };

// Circles variables
var circleRadius = 10;
// var maxCircles = 30;
var maxCircles = 20;
var existingCircles = [];
var BAD = 1;
var GOOD = 2;
var AT_LEAST_ONE_GOOD = false;
// end Circles variables

// Vehicle object
var vehicle = {
  x: 0,
  y: 0,
  width: 20,
  height: 20,
  velocity: {
    x: 0,
    y: 0
  },
  acceleration: {
    x: 0,
    y: 0
  },
  mass: 1,
  maxSpeed: 50,
  maxAcceleration: 50,
  rotation: 0,
  // Approximate radius for obstacle avoidance
  radius: 10,
  collidedWithGood: 0,
  collidedWithBad: 0
};
// end Vehicle object

// Listen to the onLoad event
window.onload = init;

// Trigger init function when the page has loaded
function init() {
  canvas = document.getElementById('ai');
  ctx = canvas.getContext('2d');

  if (!DEBUG_MODE) {
    vehicle.x = randFromTo(20, canvas.width - 20);
    vehicle.y = randFromTo(20, canvas.height - 20);
  }

  vehicle.x = 41;
  vehicle.y = 24;
  existingCircles.push({
    x: 109,
    y: 28,
    lifetime: 1000,
    tStart: 0,
    radius: 10,
    type: BAD
  });
  existingCircles.push({
    x: 125,
    y: 63,
    lifetime: 1000,
    tStart: 0,
    radius: 10,
    type: BAD
  });
  existingCircles.push({
    x: 140,
    y: 97,
    lifetime: 1000,
    tStart: 0,
    radius: 10,
    type: BAD
  });
  existingCircles.push({
    x: 86,
    y: 24,
    lifetime: 1000,
    tStart: 0,
    radius: 10,
    type: BAD
  });
  existingCircles.push({
    x: 158,
    y: 156,
    lifetime: 1000,
    tStart: 0,
    radius: 10,
    type: BAD
  });
  // Second row
  existingCircles.push({
    x: 228,
    y: 137,
    lifetime: 1000,
    tStart: 0,
    radius: 10,
    type: BAD
  });
  existingCircles.push({
    x: 270,
    y: 100,
    lifetime: 1000,
    tStart: 0,
    radius: 10,
    type: BAD
  });
  existingCircles.push({
    x: 305,
    y: 113,
    lifetime: 1000,
    tStart: 0,
    radius: 10,
    type: BAD
  });
  existingCircles.push({
    x: 307,
    y: 131,
    lifetime: 1000,
    tStart: 0,
    radius: 10,
    type: BAD
  });

  existingCircles.push({
    x: canvas.width/2 + 100,
    y: canvas.height/2,
    lifetime: 1000,
    tStart: 0,
    radius: 10,
    type: GOOD
  });

  window.requestAnimationFrame(gameLoop);
}
