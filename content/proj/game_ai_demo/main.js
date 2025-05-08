var canvas;
var ctx;
var secondsPassed;
var oldTimeStamp;

var DEBUG_MODE = false;

// Obstacle avoidance params
var MIN_DETECTION_BOX_LEN = 40; // 40 by default
// Used for debugging
var DETECTION_BOX_LEN = 0;
var AGENT_HEADING = { x: 0, y: 0 };

// Circles variables
var circleRadius = 10;
var maxCircles = 8; // 10
var existingCircles = [];
var maxTargets = 2; // 2
var existingTargets = [];
var BAD = 1;
var GOOD = 2;
var AT_LEAST_ONE_GOOD = false;
// end Circles variables

// Walls
var existingWalls = [];
var maxWalls = 3; // 3
var wallSize = 10;
// end Walls

// Sprites
var SPRITE = new Image();
var CAR_SPRITE_WIDTH = 110;
var CAR_SPRITE_HEIGHT = 210;
// end Sprites

// Vehicle object
var vehicle = {
  x: 0,
  y: 0,
  width: 20,
  height: 20,
  velocity: {
    x: 2,
    y: 2
  },
  acceleration: {
    x: 0,
    y: 0
  },
  force: {
    x: 0,
    y: 0
  },
  heading: {
    x: 0,
    y: 0
  },
  mass: 1,
  maxSpeed: 30,
  maxAcceleration: 50,
  rotation: 0,
  // Approximate radius for obstacle avoidance
  radius: 10,
  collidedWithGood: 0,
  collidedWithBad: 0,
  visibilityRange: 100,
  type: 'vehicle',
  // Wander behavior
  wanderTheta: Math.PI / 2
};
// end Vehicle object

// Listen to the onLoad event
window.onload = init;

// Trigger init function when the page has loaded
function init() {
  canvas = document.getElementById('ai');
  ctx = canvas.getContext('2d');

  // Load sprites
  SPRITE.src = './game_elements2.png';

  if (!DEBUG_MODE) {
    vehicle.x = randFromTo(20, canvas.width - 20);
    vehicle.y = randFromTo(20, canvas.height - 20);
  }

  // vehicle.x = 41;
  // vehicle.y = 24;
  vehicle.x = 0;
  vehicle.y = canvas.height/2 + 40;
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

  existingWalls.push({
    x: 100,
    y: canvas.height/2 + 20,
    lifetime: 1000,
    tStart: 0,
    type: 'wall',
    size: 10,
    width: 60,
    height: 10,
    horizontal: true,
    isTagged: false
  });

  window.requestAnimationFrame(gameLoop);
}

function gameLoop(timeStamp) {

  // Calculate the number of seconds passed since the last frame
  oldTimeStamp ||= 0; // First frame
  secondsPassed = (timeStamp - oldTimeStamp) / 1000;
  oldTimeStamp = timeStamp;


  // Perform the drawing operation
  draw(timeStamp, secondsPassed);

  // The loop function has reached it's end
  // Keep requesting new frames
  window.requestAnimationFrame(gameLoop);
}

function draw(timeStamp, secondsFromLastFrame) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var ts = timeStamp / 1000;

  drawCircles(ts);
  drawWalls(ts);
  updateVehicle(secondsFromLastFrame, ts);
  drawVehicle(ts);
  updateTargets(secondsFromLastFrame, ts);
  drawTargets(ts);
  collisionDetection();
}

function updateVehicle(secondsFromLastFrame, timeStamp) {
  drawDetectionBox(vehicle);
  var vehicleBehaviourForce = { x: 0, y: 0 };
  var wallAvoidanceForce = { x: 0, y: 0 };
  var target = findClosest();

  if (!target.x && !target.y) {
    vehicleBehaviourForce = wander(vehicle, timeStamp);
  } else {
    if (target.type == 'target') {
      vehicleBehaviourForce = pursuit(vehicle, target);
    } else {
      vehicleBehaviourForce = seek(vehicle, target);
    }
    // wallAvoidanceForce = wallAvoidance(vehicle);
  }
  var angle = Math.atan2(vehicle.heading.y, vehicle.heading.x);
  vehicle.rotation = angle;

  var obstacleAvoidanceForce = obstacleAvoidanceForVehicle(vehicle);
  var wallAvoidanceForce = wallAvoidance(vehicle);
  var forceSum = {
    x: vehicleBehaviourForce.x + obstacleAvoidanceForce.x + wallAvoidanceForce.x,
    y: vehicleBehaviourForce.y + obstacleAvoidanceForce.y + wallAvoidanceForce.y
  };

  if (vehicle.feelers) {
    drawLine(vehicle.x, vehicle.y, vehicle.feelers[0].x, vehicle.feelers[0].y);
    drawLine(vehicle.x, vehicle.y, vehicle.feelers[1].x, vehicle.feelers[1].y);
    drawLine(vehicle.x, vehicle.y, vehicle.feelers[2].x, vehicle.feelers[2].y);
  }

  vehicle.force = forceSum;
  vehicle.acceleration.x = vehicle.force.x / vehicle.mass;
  vehicle.acceleration.y = vehicle.force.y / vehicle.mass;
  vehicle.velocity.x += vehicle.acceleration.x * secondsFromLastFrame;
  vehicle.velocity.y += vehicle.acceleration.y * secondsFromLastFrame;
  vehicle.velocity = truncate(vehicle.velocity, vehicle.maxSpeed);
  // Update position
  vehicle.x += vehicle.velocity.x * secondsFromLastFrame;
  vehicle.y += vehicle.velocity.y * secondsFromLastFrame;

  // Do not allow to leave canvas
  if (vehicle.x > canvas.width) {
    vehicle.x = 0;
  }

  if (vehicle.x < 0) {
    vehicle.x = canvas.width;
  }

  if (vehicle.y > canvas.height) {
    vehicle.y = 0;
  }

  if (vehicle.y < 0) {
    vehicle.y = canvas.height;
  }
}

function updateTargets(secondsFromLastFrame, timeStamp) {
  for (var i = 0; i < existingTargets.length; i++) {
    var currTarget = existingTargets[i];
    drawDetectionBox(currTarget);
    if (currTarget.feelers) {
      drawLine(currTarget.x, currTarget.y, currTarget.feelers[0].x, currTarget.feelers[0].y);
      drawLine(currTarget.x, currTarget.y, currTarget.feelers[1].x, currTarget.feelers[1].y);
      drawLine(currTarget.x, currTarget.y, currTarget.feelers[2].x, currTarget.feelers[2].y);
    }

    // A normalized vector pointing in the direction the entity is Heading.
    var agentPos = { x: currTarget.x, y: currTarget.y };
    currTarget.heading = normalize(currTarget.velocity.x, currTarget.velocity.y);
    var angle = Math.atan2(currTarget.heading.y, currTarget.heading.x);
    currTarget.rotation = angle;

    var currTargetBehaviourForce;
    var currDist = distanceSquared(vehicle.x, vehicle.y, currTarget.x, currTarget.y);
    if ((currTarget.visibilityRange * currTarget.visibilityRange) < currDist) {
      currTargetBehaviourForce = wander(currTarget, timeStamp);
    } else {
      currTargetBehaviourForce = evade(currTarget, vehicle);
    }

    var currObstacleAvoidanceForce = obstacleAvoidanceForTarget(currTarget);
    var currWallAvoidanceForce = wallAvoidance(currTarget);
    var forceSum = {
      x: currTargetBehaviourForce.x + currObstacleAvoidanceForce.x + currWallAvoidanceForce.x,
      y: currTargetBehaviourForce.y + currObstacleAvoidanceForce.y + currWallAvoidanceForce.y
    };

    currTarget.force = forceSum;
    currTarget.acceleration.x = currTarget.force.x / currTarget.mass;
    currTarget.acceleration.y = currTarget.force.y / currTarget.mass;
    currTarget.velocity.x += currTarget.acceleration.x * secondsFromLastFrame;
    currTarget.velocity.y += currTarget.acceleration.y * secondsFromLastFrame;
    currTarget.velocity = truncate(currTarget.velocity, currTarget.maxSpeed);
    // Update position
    currTarget.x += currTarget.velocity.x * secondsFromLastFrame;
    currTarget.y += currTarget.velocity.y * secondsFromLastFrame;

    // Do not allow to leave canvas
    if (currTarget.x > canvas.width) {
      currTarget.x = 0;
    }

    if (currTarget.x < 0) {
      currTarget.x = canvas.width;
    }

    if (currTarget.y > canvas.height) {
      currTarget.y = 0;
    }

    if (currTarget.y < 0) {
      currTarget.y = canvas.height;
    }

  }
}


// AI
function seek(obj, target) {
  var diffX = target.x - obj.x;
  var diffY = target.y - obj.y;
  var normalized = normalize(diffX, diffY);
  var desiredVelocityX = normalized.x * obj.maxSpeed;
  var desiredVelocityY = normalized.y * obj.maxSpeed;

  return {
    x: desiredVelocityX - obj.velocity.x,
    y: desiredVelocityY - obj.velocity.y
  };
}

function pursuit(pursuer, evader) {
  var toEvader = { x: evader.x - pursuer.x, y: evader.y - pursuer.y };
  var relativeHeading = dotProduct(pursuer.heading, evader.heading);
  if ((dotProduct(toEvader, pursuer.heading) > 0) && relativeHeading < -0.95) { // acos(0.95) = 18 deg
    return seek(pursuer, evader);
  }

  var evaderSpeed = vecLength(evader.velocity.x, evader.velocity.y);
  var lookAheadTime = vecLength(toEvader.x, toEvader.y) / (pursuer.maxSpeed + evaderSpeed);
  // Seek the predicted future position
  var result = {
    x: evader.x + evader.velocity.x * lookAheadTime,
    y: evader.y + evader.velocity.y * lookAheadTime,
  };
  return seek(pursuer, result);
}

function flee(obj, target) {
  var diffX = obj.x - target.x;
  var diffY = obj.y - target.y;
  var normalized = normalize(diffX, diffY);
  var desiredVelocityX = normalized.x * target.maxSpeed;
  var desiredVelocityY = normalized.y * target.maxSpeed;

  return {
    x: desiredVelocityX - target.velocity.x,
    y: desiredVelocityY - target.velocity.y
  };
}

function evade(pursuer, evader) {
  var p = pursuit(pursuer, evader);
  return { x: p.x * (-1), y: p.y * (-1) };
}

// Working method
function obstacleAvoidanceForVehicle(target) {
  var targetSpeed = vecLength(target.velocity.x, target.velocity.y);
  var detectionBoxLen = MIN_DETECTION_BOX_LEN +
    (targetSpeed / target.maxSpeed) * 
    MIN_DETECTION_BOX_LEN;
  DETECTION_BOX_LEN = detectionBoxLen;

  // Tag all the obstacles within range
  tagObstaclesWithinViewRange(target, detectionBoxLen);

  // CIB
  var closestIntersectionObstacle = null;
  var distToCIB = Number.MAX_VALUE;

  // Transformed local coords of the CIB
  var localPosOfCIB = { x: null, y: null };

  // A normalized vector pointing in the direction the entity is Heading.
  var agentPos = { x: target.x, y: target.y };
  target.heading = normalize(target.velocity.x, target.velocity.y);
  // Side is perpendicular to the heading vector
  var agentSide = perpendicular(target.heading.x, target.heading.y);

  for (var i = 0; i < existingCircles.length; i++) {
    var currOb = existingCircles[i];
    currOb.isIntersect = false;
    if (currOb.isTagged) {
      // Calculate this obstacle position in local space
      var localPos = pointToLocalSpace(currOb, target.heading, agentSide, agentPos);
      // If local position has negative value,
      // then it's behind. We ignore it.
      if (localPos.x >= 0) {
        var expandedRadius = (currOb.radius + target.radius);
        if (Math.abs(localPos.y) < expandedRadius) {
          // Line/circle intersection test.
          // Intersection point x = circleX +/- sqrt(r^2 - circleY^2) for y = 0.
          var cX = localPos.x;
          var cY = localPos.y;

          var sqrtPart = Math.sqrt(expandedRadius*expandedRadius - cY*cY);
          var ip = cX - sqrtPart;

          if (ip <= 0) {
            ip = cX + sqrtPart;
          }

          // Test to check if it's closest so far
          if (currOb.isTagged && (ip < distToCIB)) {
            currOb.isIntersect = true;
            distToCIB = ip;
            closestIntersectionObstacle = currOb;
            localPosOfCIB = localPos;
          }
        }
      }
    }
  }

  // If intersection obstacle is found, calculate a steering force away from it.
  var steeringForce = { x: null, y: null };

  if (closestIntersectionObstacle) {
    // The closer to an obstacle, the stronger the steering force (1 + ...) by default
    var multiplier = 2 + (detectionBoxLen - localPosOfCIB.x) / detectionBoxLen;

    // Calculate the lateral force
    steeringForce.y = (closestIntersectionObstacle.radius - localPosOfCIB.y) * multiplier;
    // Apply breaking force (0.2 by default)
    var breakingWeight = 0.4;
    // var breakingWeight = 0.8;
    steeringForce.x = (closestIntersectionObstacle.radius - localPosOfCIB.x) * breakingWeight;
  }

  // Convert steering vector back to world space coords
  return vectorToWorldSpace(steeringForce, target.heading, agentSide);
}

function obstacleAvoidanceForTarget(target) {
  var targetSpeed = vecLength(target.velocity.x, target.velocity.y);
  var detectionBoxLen = MIN_DETECTION_BOX_LEN +
    (targetSpeed / target.maxSpeed) * 
    MIN_DETECTION_BOX_LEN;
  DETECTION_BOX_LEN = detectionBoxLen;

  // Tag all the obstacles within range
  tagObstaclesWithinViewRange(target, detectionBoxLen);

  // CIB
  var closestIntersectionObstacle = null;
  var distToCIB = Number.MAX_VALUE;

  // Transformed local coords of the CIB
  var localPosOfCIB = { x: null, y: null };

  // A normalized vector pointing in the direction the entity is Heading.
  var agentPos = { x: target.x, y: target.y };
  target.heading = normalize(target.velocity.x, target.velocity.y);
  // Side is perpendicular to the heading vector
  var agentSide = perpendicular(target.heading.x, target.heading.y);

  var existingObstacles = existingCircles.concat(existingTargets);
  for (var i = 0; i < existingObstacles.length; i++) {
    var currOb = existingObstacles[i];
    if ((target.type === currOb.type) && (target.tStart === currOb.tStart)) {
      continue;
    }
    currOb.isIntersect = false;
    if (currOb.isTagged) {
      // Calculate this obstacle position in local space
      var localPos = pointToLocalSpace(currOb, target.heading, agentSide, agentPos);
      // If local position has negative value,
      // then it's behind. We ignore it.
      if (localPos.x >= 0) {
        var expandedRadius = (currOb.radius + target.radius);
        if (Math.abs(localPos.y) < expandedRadius) {
          // Line/circle intersection test.
          // Intersection point x = circleX +/- sqrt(r^2 - circleY^2) for y = 0.
          var cX = localPos.x;
          var cY = localPos.y;

          var sqrtPart = Math.sqrt(expandedRadius*expandedRadius - cY*cY);
          var ip = cX - sqrtPart;

          if (ip <= 0) {
            ip = cX + sqrtPart;
          }

          // Test to check if it's closest so far
          if (currOb.isTagged && (ip < distToCIB)) {
            currOb.isIntersect = true;
            distToCIB = ip;
            closestIntersectionObstacle = currOb;
            localPosOfCIB = localPos;
          }
        }
      }
    }
  }

  // If intersection obstacle is found, calculate a steering force away from it.
  var steeringForce = { x: null, y: null };

  if (closestIntersectionObstacle) {
    // The closer to an obstacle, the stronger the steering force (1 + ...) by default
    var multiplier = 2 + (detectionBoxLen - localPosOfCIB.x) / detectionBoxLen;

    // Calculate the lateral force
    steeringForce.y = (closestIntersectionObstacle.radius - localPosOfCIB.y) * multiplier;
    // Apply breaking force (0.2 by default)
    var breakingWeight = 0.4;
    steeringForce.x = (closestIntersectionObstacle.radius - localPosOfCIB.x) * breakingWeight;
  }

  // Convert steering vector back to world space coords
  return vectorToWorldSpace(steeringForce, target.heading, agentSide);
}

function tagObstaclesWithinViewRange(target, radius) {
  // Tag other vehicles as well
  var existingObstacles = existingCircles.concat(existingTargets);
  for (var i = 0; i < existingObstacles.length; i++) {
    var currObj = existingObstacles[i];
    if (target.type === 'target' && target.tStart === currObj.tStart) {
      continue;
    }
    if (currObj.type === BAD || currObj.type === 'target') {
      currObj.isTagged = false;
      var to = { x: currObj.x - target.x, y: currObj.y - target.y };
      var range = radius + currObj.radius;
      // If within range, tag it
      if (lengthSquared(to.x, to.y) < range*range) {
        currObj.isTagged = true;
      }
    }
  }
}

function wallAvoidance(target) {
  var feelers = createFeelers(target);
  // for debugging
  target.feelers = feelers;
  // end

  var distAndPoint = {
    distToThisIP: 0,
    point: {
      x: 0, y: 0
    }
  };

  var distToClosestIP = Number.MAX_VALUE;

  // This will hold an index into the vector of walls
  var closestWall = -1;

  var steeringForce = { x: 0, y: 0 };
  var closestPoint = { x: 0, y: 0 };
  // Which side of the wall has been hit
  var currWallSideNorm = { x: 0, y: 0 };

  for (var f = 0; f < feelers.length; f++) {
    for (var w = 0; w < existingWalls.length; w++) {
      var currWall = existingWalls[w];

      // Dot 1, 2, 3, 4
      // Side I, II, III, IV
      //
      //      I
      //    1---2
      // II |   | IV
      //    |   |
      //    3---4
      //      III

      // First side (between dot 1 and dot 2)
      var intersect1 = lineIntersection(
          { x: target.x, y: target.y },
          feelers[f],
          { x: currWall.x, y: currWall.y },
          { x: currWall.x + currWall.width, y: currWall.y },
          distAndPoint
        )
      // Second side (between dot 1 and dot 3)
      var intersect2 = lineIntersection(
          { x: target.x, y: target.y },
          feelers[f],
          { x: currWall.x, y: currWall.y },
          { x: currWall.x, y: currWall.y + currWall.height },
          distAndPoint
        )
      // Third side (between dot 3 and dot 4)
      var intersect3 = lineIntersection(
          { x: target.x, y: target.y },
          feelers[f],
          { x: currWall.x, y: currWall.y + currWall.height },
          { x: currWall.x + currWall.width, y: currWall.y + currWall.height },
          distAndPoint
        )
      // Fourth side (between dot 2 and dot 4)
      var intersect4 = lineIntersection(
          { x: target.x, y: target.y },
          feelers[f],
          { x: currWall.x + currWall.width, y: currWall.y },
          { x: currWall.x + currWall.width, y: currWall.y + currWall.height },
          distAndPoint
        )

      if (intersect1) {
        currWallSideNorm = { x: 0, y: -1 };
      };

      if (intersect2) {
        currWallSideNorm = { x: -1, y: 0 };
      }

      if (intersect3) {
        currWallSideNorm = { x: 0, y: 1 };
      }

      if (intersect4) {
        currWallSideNorm = { x: 1, y: 0 };
      }

      var result = intersect1 || intersect2 || intersect3 || intersect4;
      if (result) {
        if (distAndPoint.distToThisIP < distToClosestIP) {
          distToClosestIP = distAndPoint.distToThisIP;
          closestWall = w;
          closestPoint.x = distAndPoint.point.x;
          closestPoint.y = distAndPoint.point.y;
        }
      }
    } // next wall

    // If an intersection point has been detected, calculate a force
    // that will direct the agent away
    if (closestWall >= 0) {
      var overshoot = { x: feelers[f].x - closestPoint.x, y: feelers[f].y - closestPoint.y };

      // Create a force in the direction of the wall normal, with a
      // magnitude of the overshoot
      overshootLen = vecLength(overshoot.x, overshoot.y);

      steeringForce = {
        x: currWallSideNorm.x * overshootLen * 5,
        y: currWallSideNorm.y * overshootLen * 5
      };
    }
  } // next feeler

  return steeringForce;
}

function createFeelers(target) {
  // 40 by default
  var wallDetectionFeelerLength = 50;
  var feelers = [];

  // Feeler pointing straight in front
  feelers[0] = {
    x: target.x + wallDetectionFeelerLength * target.heading.x,
    y: target.y + wallDetectionFeelerLength * target.heading.y
  };

  var left = rotateByAngle(
    0,
    0,
    target.heading.x,
    target.heading.y,
    45
  );

  feelers[1] = {
    x: target.x + wallDetectionFeelerLength / 2 * left.x,
    y: target.y + wallDetectionFeelerLength / 2 * left.y
  };

  var right = rotateByAngle(
    0,
    0,
    target.heading.x,
    target.heading.y,
    -45
  );

  feelers[2] = {
    x: target.x + wallDetectionFeelerLength / 2 * right.x,
    y: target.y + wallDetectionFeelerLength / 2 * right.y,
  };

  return feelers;
}

function wander(obj, ts) {
  obj.wanderTheta ||= (Math.PI / 2);
  var wanderDist = 80;
  var wanderRadius = 30;
  var velocity = { x: obj.velocity.x, y: obj.velocity.y };
  var wanderPointCenter = {};
  var norm = normalize(velocity.x, velocity.y);
  wanderPointCenter.x = norm.x * wanderDist;
  wanderPointCenter.y = norm.y * wanderDist;

  var theta = obj.wanderTheta + obj.rotation;
  var xOffset = wanderRadius * Math.cos(theta);
  var yOffset = wanderRadius * Math.sin(theta);

  var wanderPoint = {};
  wanderPoint.x = wanderPointCenter.x + xOffset;
  wanderPoint.y = wanderPointCenter.y + yOffset;

  var displaceRange = 0.3;
  obj.wanderTheta += floatRandFromTo(-displaceRange, displaceRange);

  // For debuggin
  drawCircle2(obj, wanderPointCenter);
  drawCircleTransparant(obj, {x: wanderPointCenter.x, y: wanderPointCenter.y, radius: wanderRadius});
  drawCircle2(obj, { x: wanderPoint.x, y: wanderPoint.y, radius: 3 }, '#009500');

  return { x: wanderPoint.x, y: wanderPoint.y };
}
