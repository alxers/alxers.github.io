function pointToWorldSpace(vec, agentHeading, agentSide, agentPos) {
  var matTransform = createRotationMatr(agentHeading, agentSide);
  var translated = translate(matTransform, agentPos.x, agentPos.y);
  // Transform vertices
  var res = transformVector2Ds(translated, vec);
  return res;
}

function vectorToWorldSpace(vec, agentHeading, agentSide) {
  var matTransform = createRotationMatr(agentHeading, agentSide);

  // Transform vertices
  var res = transformVector2Ds(matTransform, vec);
  return res;
}

function pointToLocalSpace(obstacle, agentHeading, agentSide, agentPos) {
  var tX = -dotProduct(agentPos, agentHeading);
  var tY = -dotProduct(agentPos, agentSide);

  // Transformation matrix
  var matTransform = [
    [agentHeading.x, agentSide.x],
    [agentHeading.y, agentSide.y],
    [tX, tY]
  ];
  var transPoint = transformVector2Ds(matTransform, { x: obstacle.x, y: obstacle.y });

  return transPoint;
}

function createRotationMatr(fwd, side) {
  //create a rotation matrix from a 2D vector
  var identityMatr = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ];

  var rotMatr = [
    [fwd.x, fwd.y, 0],
    [side.x, side.y, 0],
    [0, 0, 1]
  ];

  return matrMultiply(identityMatr, rotMatr);
}

//create a transformation matrix
function translate(mat, x, y) {
  var m = [
    [1, 0, 0],
    [0, 1, 0],
    [x, y, 1]
  ];

  return matrMultiply(mat, m);
}

function matrMultiply(m1, m2) {
  var result = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  result[0][0] = (m1[0][0] * m2[0][0]) + (m1[0][1] * m2[1][0]) + (m1[0][2] * m2[2][0]);
  result[0][1] = (m1[0][0] * m2[0][1]) + (m1[0][1] * m2[1][1]) + (m1[0][2] * m2[2][1]);
  result[0][2] = (m1[0][0] * m2[0][2]) + (m1[0][1] * m2[1][2]) + (m1[0][2] * m2[2][2]);

  result[1][0] = (m1[1][0] * m2[0][0]) + (m1[1][1] * m2[1][0]) + (m1[1][2] * m2[2][0]);
  result[1][1] = (m1[1][0] * m2[0][1]) + (m1[1][1] * m2[1][1]) + (m1[1][2] * m2[2][1]);
  result[1][2] = (m1[1][0] * m2[0][2]) + (m1[1][1] * m2[1][2]) + (m1[1][2] * m2[2][2]);

  result[2][0] = (m1[2][0] * m2[0][0]) + (m1[2][1] * m2[1][0]) + (m1[2][2] * m2[2][0]);
  result[2][1] = (m1[2][0] * m2[0][1]) + (m1[2][1] * m2[1][1]) + (m1[2][2] * m2[2][1]);
  result[2][2] = (m1[2][0] * m2[0][2]) + (m1[2][1] * m2[1][2]) + (m1[2][2] * m2[2][2]);

  return result;
}

function transformVector2Ds(matr, point) {
  var pointX = (matr[0][0] * point.x) + (matr[1][0] * point.y) + matr[2][0];
  var pointY = (matr[0][1] * point.x) + (matr[1][1] * point.y) + matr[2][1];

  return { x: pointX, y: pointY };
}

function dotProduct(vec1, vec2) {
  return vec1.x * vec2.x + vec1.y * vec2.y;
}

function perpendicular(x, y) {
  return { x: -y, y: x };
}

function distanceSquared(x1, y1, x2, y2) {
  return Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function lengthSquared(x, y) {
  return (x*x + y*y);
}

function vecLength(x, y) {
  return Math.sqrt(x*x + y*y);
}

function normalize(x, y) {
  if (x === 0 && y === 0) {
    return { x: 0, y: 0 };
  }
  var len = vecLength(x, y);
  return {
    x: x / len,
    y: y / len
  }
}

function truncate(vec, max) {
  var len = vecLength(vec.x, vec.y);
  var truncated;
  if (len > max) {
    truncated = normalize(vec.x, vec.y);
    truncated.x *= max;
    truncated.y *= max;

    return truncated;
  }
  return vec;
}

// cx, cy - center point around which the second point will be rotated
// x, y - point which is going to be rotated
// angle in degrees (positive - clockwise, negative - counterclockwise)
function rotateByAngle(cx, cy, x, y, angle) {
  var radians = (Math.PI / 180) * angle;
  // var radians = angle;
  var cos = Math.cos(radians);
  var sin = Math.sin(radians);
  var nx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
  var ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
  return { x: nx, y: ny };
}

//  Given 2 lines in 2D space AB, CD this returns true if an 
//  intersection occurs and sets dist to the distance the intersection
//  occurs along AB. Also sets the 2d vector point to the point of
//  intersection
function lineIntersection(A, B, C, D, distAndPoint) {
  var rTop = (A.y-C.y)*(D.x-C.x)-(A.x-C.x)*(D.y-C.y);
  var rBot = (B.x-A.x)*(D.y-C.y)-(B.y-A.y)*(D.x-C.x);

  var sTop = (A.y-C.y)*(B.x-A.x)-(A.x-C.x)*(B.y-A.y);
  var sBot = (B.x-A.x)*(D.y-C.y)-(B.y-A.y)*(D.x-C.x);

  if ((rBot == 0) || (sBot == 0))
  {
    //lines are parallel
    return false;
  }

  var r = rTop/rBot;
  var s = sTop/sBot;

  if((r > 0) && (r < 1) && (s > 0) && (s < 1)) {
    var dist = distance(A.x, A.y, B.x, B.y) * r;
    distAndPoint.distToThisIP = dist;
    distAndPoint.point.x = A.x + r * (B.x - A.x);
    distAndPoint.point.y = A.y + r * (B.y - A.y);

    return true;
  }

  else
  {
    distAndPoint.distToThisIP = 0;
    return false;
  }

}
