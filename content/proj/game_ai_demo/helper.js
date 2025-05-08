function drawVehicle2(ts) {
  ctx.fillStyle = '#ff8080';
  ctx.fillRect(vehicle.x, vehicle.y, vehicle.width, vehicle.height);
}

function drawVehicle(ts) {
  ctx.save();
  ctx.translate(vehicle.x, vehicle.y);
  // vehicle.rotation doesn't give a valid result because sprite is rotated 90 dergees?
  // ctx.rotate(vehicle.rotation);
  ctx.rotate(Math.atan2(vehicle.heading.x, -vehicle.heading.y));
  var scaledWidth = CAR_SPRITE_WIDTH / 5;
  var scaledHeight = CAR_SPRITE_HEIGHT / 5;
  ctx.drawImage(SPRITE,
    // Sprite offset
    120, 450,
    // Dimensions of a sprite
    CAR_SPRITE_WIDTH, CAR_SPRITE_HEIGHT,
    // Position on canvas
    -scaledWidth/2, -scaledHeight/2,
    // The size of an image
    CAR_SPRITE_WIDTH / 5, CAR_SPRITE_HEIGHT / 5
  );
  ctx.restore();
}

function drawDetectionBox(obj) {
  var clr = 'rgba(61, 48, 48, 0.1)';

  if (DEBUG_MODE) {
    drawCircle(vehicle, '#abc');
    clr = 'rgba(61, 48, 48, 0.5)';
  }
  ctx.save();
  ctx.translate(obj.x, obj.y);
  ctx.rotate(obj.rotation);
  ctx.fillStyle = clr;
  ctx.fillRect(-10, -10, DETECTION_BOX_LEN, 2*obj.radius);
  ctx.restore();
}

function drawLine(sx, sy, fx, fy) {
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(fx, fy);
  ctx.stroke();
}

function drawTarget(target) {
  ctx.save();
  ctx.translate(target.x, target.y);
  // target.rotation doesn't give a valid result because sprite is rotated 90 dergees?
  // ctx.rotate(target.rotation);
  ctx.rotate(Math.atan2(target.heading.x, -target.heading.y));
  var scaledWidth = CAR_SPRITE_WIDTH / 5;
  var scaledHeight = CAR_SPRITE_HEIGHT / 5;
  ctx.drawImage(SPRITE,
    0, 230,
    // Position of a sprite
    CAR_SPRITE_WIDTH, CAR_SPRITE_HEIGHT,
    // Position on canvas
    -scaledWidth/2, -scaledHeight/2,
    // The size of an image
    scaledWidth, scaledHeight
  );
  ctx.restore();
}

function drawCircle(circle, clr) {
  // Tree
  var offsetX = 625;
  var offsetY = 555;
  var imageWidth = 115;
  var imageHeight = 105;
  if (circle.type == GOOD) {
    // Fuel
    offsetX = 660;
    offsetY = 270;

    imageWidth = 85;
    imageHeight = 100;
  }
  var scaledWidth = (imageWidth / 5) * (circle.radius * 0.15);
  var scaledHeight = imageHeight / 5 * (circle.radius * 0.15);

  ctx.drawImage(SPRITE,
    offsetX, offsetY,
    // Position of a sprite
    imageWidth, imageHeight,
    // Position on canvas
    circle.x - scaledWidth / 2, circle.y - scaledHeight / 2,
    // The size of an image
    scaledWidth, scaledHeight
  );
}

function drawWall(wall) {
  var offsetX = 595;
  var offsetY = 265;

  var imageWidth = 50;
  var imageHeight = 205;

  if (wall.horizontal) {
    ctx.save();
    // TODO: Does not exactly fit the actual rectangle
    ctx.translate(wall.x + wall.width, wall.y - wall.height / 3);
    ctx.rotate(90 * Math.PI / 180);
    ctx.drawImage(SPRITE,
      offsetX, offsetY,
      // Position of a sprite
      imageWidth, imageHeight,
      // Position on canvas
      // -wall.width / 2, -wall.height / 2,
      0, 0,
      // The size of an image
      // wall.width, wall.height
      wall.height, wall.width
    );
    ctx.restore();
  } else {
    ctx.drawImage(SPRITE,
      offsetX, offsetY,
      // Position of a sprite
      imageWidth, imageHeight,
      // Position on canvas
      wall.x, wall.y,
      // The size of an image
      wall.width, wall.height
    );
  }

  // Draw actuall rectangles
  // ctx.rect(wall.x, wall.y, wall.width, wall.height);
  // ctx.fill();
}

function drawWalls(ts) {
  if (randFromTo(0, 1000) > 987 && existingWalls.length < maxWalls && !DEBUG_MODE) {
    var r = randFromTo(8, 18);
    existingWalls.push(createWall(r));
  }

  var wallIndexesToRemove = [];

  for (var i = 0; i < existingWalls.length; i++) {
    var currWall = existingWalls[i];
    currWall.tStart ||= ts;
    if (ts - currWall.tStart <= currWall.lifetime) {
      drawWall(currWall);
    } else {
      wallIndexesToRemove.push(i);
    }
  }

  for (var j = 0; j < wallIndexesToRemove.length; j++) {
    existingWalls.splice(j, 1);
  }
}

function drawCircle2(obj, circle, clr) {
  var color = '#880000';
  if (circle.type == GOOD) {
    color = '#0095DD';
  }

  if (!circle.radius) {
    circle.radius = 3;
  }

  ctx.save();
  ctx.translate(obj.x, obj.y);
  ctx.beginPath();
  ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI*2);
  ctx.fillStyle = color;
  if (DEBUG_MODE) {
    ctx.fillStyle = clr;
  }
  ctx.fill();
  ctx.closePath();
  ctx.restore();
}

function drawCircleTransparant(obj, circle, clr) {
  var color = '#880000';
  if (circle.type == GOOD) {
    color = '#0095DD';
  }

  ctx.save();
  ctx.translate(obj.x, obj.y);
  ctx.beginPath();
  ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI*2);
  ctx.fillStyle = color;
  if (DEBUG_MODE) {
    ctx.fillStyle = clr;
  }
  ctx.stroke();
  ctx.closePath();
  ctx.restore();
}

function drawCircles(ts) {
  if (randFromTo(0, 1000) > 987 && existingCircles.length < maxCircles && !DEBUG_MODE) {
    if (AT_LEAST_ONE_GOOD) {
      var r = randFromTo(8, 18);
      existingCircles.push(createCircle(null, r));
    } else {
      existingCircles.push(createCircle(GOOD));
    }
  }
  AT_LEAST_ONE_GOOD = false;

  var circleIndexesToRemove = [];

  for (var i = 0; i < existingCircles.length; i++) {
    var currCircle = existingCircles[i];
    if (currCircle.type === GOOD) {
      AT_LEAST_ONE_GOOD = true;
    }
    currCircle.tStart ||= ts;
    if (ts - currCircle.tStart <= currCircle.lifetime) {
      drawCircle(currCircle);
    } else {
      circleIndexesToRemove.push(i);
    }
  }

  for (var j = 0; j < circleIndexesToRemove.length; j++) {
    existingCircles.splice(j, 1);
  }

}

function drawTargets(ts) {
  if (randFromTo(0, 1000) > 987 && existingTargets.length < maxTargets && !DEBUG_MODE) {
    // var r = randFromTo(8, 18);
    existingTargets.push(createTarget());
  }

  var targetIndexesToRemove = [];

  for (var i = 0; i < existingTargets.length; i++) {
    var currTarget = existingTargets[i];
    currTarget.tStart ||= ts;
    if (ts - currTarget.tStart <= currTarget.lifetime) {
      drawTarget(currTarget);
    } else {
      targetIndexesToRemove.push(i);
    }
  }

  for (var j = 0; j < targetIndexesToRemove.length; j++) {
    existingTargets.splice(j, 1);
  }
}

function drawPoint(x, y) {
  ctx.fillRect(x, y, 3, 3);
}

function findClosest() {
  if (!existingCircles.length && !existingTargets.length) {
    return { x: null, y: null };
  }

  var result;
  var currMin = Number.MAX_VALUE;
  var ind;
  var existingObjects = existingCircles.concat(existingTargets);
  for (var i = 0; i < existingObjects.length; i++) {
    if (existingObjects[i].type === GOOD || existingObjects[i].type === 'target') {
      var currDist = distanceSquared(vehicle.x, vehicle.y, existingObjects[i].x, existingObjects[i].y);
      if ((vehicle.visibilityRange * vehicle.visibilityRange) < currDist) {
        continue;
      }

      if (currDist < currMin) {
        currMin = currDist;
        ind = i;
        result = existingObjects[ind];
      }
    }
  }

  if (!result) {
    result = { x: null, y: null };
  }

  return result;
}

function createCircle(t, radius, xc, yc) {
  var lifetime = 20 + randFromTo(10, 50);
  var type = BAD;

  if (randFromTo(0, 100) > 70) {
    type = GOOD;
  }

  if (t) {
    type = t;
  }

  if (!radius) {
    radius = randFromTo(8, 18);
  }

  var x = xc || randFromTo(radius, canvas.width - radius);
  var y = yc || randFromTo(radius, canvas.height - radius);
  return {
    lifetime: lifetime,
    type: type,
    // if Current time - tStart > lifetime, then do not draw anymore
    tStart: null,
    // x and y coords
    x: x,
    y: y,
    // Used in obstacle avoidance
    radius: radius,
    isTagged: false
  }
}

function createTarget(radius, xc, yc) {
  var lifetime = 20 + randFromTo(10, 50);
  console.log('target created');
  if (!radius) {
    // radius = randFromTo(8, 18);
    radius = 15;
  }

  var x = xc || randFromTo(radius, canvas.width - radius);
  var y = yc || randFromTo(radius, canvas.height - radius);
  return {
    lifetime: lifetime,
    // if Current time - tStart > lifetime, then do not draw anymore
    tStart: null,
    // x and y coords
    x: x,
    y: y,
    // Used in obstacle avoidance
    radius: radius,
    // isTagged: false,
    velocity: {
      x: 1,
      y: 0
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
    visibilityRange: 80,
    type: 'target',
    // Wander behavior
    wanderTheta: Math.PI / 2
  }
}

function createWall(size, xc, yc) {
  var lifetime = 20 + randFromTo(10, 50);
  var horizontal = false;

  if (randFromTo(0, 100) >= 50) {
    horizontal = true;
  }

  if (!size) {
    size = randFromTo(8, 18);
  }

  var imageWidth = 50;
  var imageHeight = 205;

  var scaledWidth = (imageWidth / 5) * (size * 0.15);
  var scaledHeight = (imageHeight / 5) * (size * 0.15);

  if (horizontal) {
    var tmp = scaledHeight;
    scaledHeight = scaledWidth;
    scaledWidth = tmp;
  }

  var x = xc || randFromTo(size, canvas.width - size);
  var y = yc || randFromTo(size, canvas.height - size);
  return {
    lifetime: lifetime,
    // if Current time - tStart > lifetime, then do not draw anymore
    tStart: null,
    // x and y coords
    x: x,
    y: y,
    width: scaledWidth,
    height: scaledHeight,
    // Used in obstacle avoidance
    type: 'wall',
    horizontal: horizontal,
    size: size,
    isTagged: false
  }
}

function randFromTo(from, to) {
  var range = to - from;
  return Math.ceil(Math.random() * range) + from;
}

function floatRandFromTo(from, to) {
  var range = to - from;
  return Math.random() * range + from;
}

function collisionDetection() {
  for (var i = 0; i < existingCircles.length; i++) {
    var currCircle = existingCircles[i];
    if (circleToCircleColliding(vehicle, currCircle)) {
      if (existingCircles[i].type === GOOD) {
        vehicle.collidedWithGood += 1;
      }
      if (existingCircles[i].type === BAD) {
        vehicle.collidedWithBad += 1;
      }
      existingCircles.splice(i, 1);
    }
  }

  for (var j = 0; j < existingTargets.length; j++) {
    var currTarget = existingTargets[j];
    if (circleToCircleColliding(vehicle, currTarget)) {
      existingTargets.splice(j, 1);
    }
  }

  // TODO: Check all collisions in one loop?
  for (var j = 0; j < existingTargets.length; j++) {
    var currTarget = existingTargets[j];
    for (var k = 0; k < existingCircles.length; k++) {
      var currCircle = existingCircles[k];
      if (circleToCircleColliding(currCircle, currTarget)) {
        existingCircles.splice(k, 1);
      }
    }
  }
}

function circleToCircleColliding(c1, c2) {
  var diffX = Math.abs(c2.x - c1.x);
  var diffY = Math.abs(c2.y - c1.y);
  var dist = Math.sqrt(diffX * diffX + diffY * diffY);
  var delta = -0.8;
  var radiusSum = c1.radius + c2.radius + delta;
  return (dist <= radiusSum);
}

var debugFlag = false;
document.addEventListener('click', function(e) {
  if (!e.target) {
    return;
  }

  // If clicked on canvas
  if (e.target.id === 'ai') {
    console.log(`x: ${e.x}, y: ${e.y}`);
    existingCircles.push(createCircle(BAD, 10, e.x, e.y));
  }

  if (e.target.className === 'debug-btn' && !debugFlag) {
    // DEBUG_MODE = false;
    e.target.innerText = "Debug mode ON";
    // e.target.disabled = true;
    debugFlag = true;
  } else {
    e.target.innerText = "Debug mode OFF";
    debugFlag = false;
  }

  console.log(debugFlag);
});
