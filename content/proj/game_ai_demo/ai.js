// function seek(targetX, targetY) {
//   var diffX = targetX - vehicle.x;
//   var diffY = targetY - vehicle.y;
//   var normalized = normalize(diffX, diffY);
//   var desiredVelocityX = normalized.x * vehicle.maxSpeed;
//   var desiredVelocityY = normalized.y * vehicle.maxSpeed;

//   return {
//     x: desiredVelocityX - vehicle.velocity.x,
//     y: desiredVelocityY - vehicle.velocity.y
//   };
// }

// function obstacleAvoidance() {
//   var vehicleSpeed = vecLength(vehicle.velocity.x, vehicle.velocity.y);
//   var detectionBoxLen = MIN_DETECTION_BOX_LEN +
//     (vehicleSpeed / vehicle.maxSpeed) * 
//     MIN_DETECTION_BOX_LEN;
//   DETECTION_BOX_LEN = detectionBoxLen;

//   // Tag all the obstacles within range
//   tagObstaclesWithinViewRange(detectionBoxLen);

//   // CIB
//   var closestIntersectionObstacle = null;
//   var distToCIB = Number.MAX_VALUE;

//   // Transformed local coords of the CIB
//   var localPosOfCIB = { x: null, y: null };

//   // A normalized vector pointing in the direction the entity is Heading.
//   var agentPos = { x: vehicle.x, y: vehicle.y };
//   var agentHeading = normalize(vehicle.velocity.x, vehicle.velocity.y);
//   AGENT_HEADING = agentHeading;
//   // Side is perpendicular to the heading vector
//   var agentSide = perpendicular(agentHeading.x, agentHeading.y);

//   for (var i = 0; i < existingCircles.length; i++) {
//     var currOb = existingCircles[i];
//     currOb.isIntersect = false;
//     if (currOb.isTagged) {
//       // Calculate this obstacle position in local space
//       var localPos = pointToLocalSpace(currOb, agentHeading, agentSide, agentPos);
//       // If local position has negative value,
//       // then it's behind. We ignore it.
//       if (localPos.x >= 0) {
//         var expandedRadius = (currOb.radius + vehicle.radius);
//         if (Math.abs(localPos.y) < expandedRadius) {
//           // Line/circle intersection test.
//           // Intersection point x = circleX +/- sqrt(r^2 - circleY^2) for y = 0.
//           var cX = localPos.x;
//           var cY = localPos.y;

//           var sqrtPart = Math.sqrt(expandedRadius*expandedRadius - cY*cY);
//           var ip = cX - sqrtPart;

//           if (ip <= 0) {
//             ip = cX + sqrtPart;
//           }

//           // Test to check if it's closest so far
//           if (currOb.isTagged && (ip < distToCIB)) {
//             currOb.isIntersect = true;
//             distToCIB = ip;
//             closestIntersectionObstacle = currOb;
//             localPosOfCIB = localPos;
//           }
//         }
//       }
//     }
//   }

//   // If intersection obstacle is found, calculate a steering force away from it.
//   var steeringForce = { x: null, y: null };

//   if (closestIntersectionObstacle) {
//     // The closer to an obstacle, the stronger the steering force (1 + ...) by default
//     var multiplier = 2 + (detectionBoxLen - localPosOfCIB.x) / detectionBoxLen;

//     // Calculate the lateral force
//     steeringForce.y = (closestIntersectionObstacle.radius - localPosOfCIB.y) * multiplier;
//     // Apply breaking force (0.2 by default)
//     var breakingWeight = 0.4;
//     steeringForce.x = (closestIntersectionObstacle.radius - localPosOfCIB.x) * breakingWeight;
//   }

//   // Convert steering vector back to world space coords
//   return vectorToWorldSpace(steeringForce, agentHeading, agentSide);
// }

// function tagObstaclesWithinViewRange(radius) {
//   for (var i = 0; i < existingCircles.length; i++) {
//     currObj = existingCircles[i];
//     if (currObj.type === BAD) {
//       currObj.isTagged = false;

//       var to = { x: currObj.x - vehicle.x, y: currObj.y - vehicle.y };
//       var range = radius + currObj.radius;

//       // If within range, tag it
//       if (lengthSquared(to.x, to.y) < range*range) {
//         currObj.isTagged = true;
//       }
//     }
//   }
// }

// function wander() {
//   var wanderRadius = 5;
//   var wanderDistance = 10;

//   // Maximum amout of random displacement (how smooth the movement is, lower - smoother)
//   var wanderJitter = 3;

//   // Add a small random vector to the target's position
//   var randVec = { x: (randFromTo(-1, 1) * wanderJitter), y: (randFromTo(-1, 1) * wanderJitter) };

//   // Centered on the vehicle
//   var wanderTarget = { x: vehicle.x, y: vehicle.y };
//   debugger;
//   var wanderTarget.x += randVec.x;
//   var wanderTarget.y += randVec.y;

//   var wtNormalized = normalize(wanderTarget.x, wanderTarget.y);

//   // Increas the length to the size of the radius of the wander circle
//   wtNormalized.x *= wanderRadius;
//   wtNormalized.y *= wanderRadius;

//   // Move the target into a position WanderDist in front of the agent
//   var targetLocal = { x: 0, y: 0 };
//   targetLocal.x = wtNormalized.x + wanderDistance;
//   targetLocal.y = wtNormalized.y;

//   // Project target into world space
//   var targetWorld = { x: 0, y: 0 };
//   // var agentPos = { x: vehicle.x, y: vehicle.y };
//   var agentHeading = normalize(vehicle.velocity.x, vehicle.velocity.y);
//   // Side is perpendicular to the heading vector
//   var agentSide = perpendicular(agentHeading.x, agentHeading.y);
//   // TODO: should be point to world space?
//   targetWorld = vectorToWorldSpace(targetLocal, agentHeading, agentSide);

//   // Steer toward it
//   return { x: targetWorld.x - vehicle.x, y: targetWorld.y - vehicle.y };
// }
