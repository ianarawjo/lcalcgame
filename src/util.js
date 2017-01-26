/**
 * Internal utils (author, me)
 */
var __IS_MOBILE = /Mobi/.test(navigator.userAgent);
 var CONST = {
     POS: {
         UNITSQUARE: {
             TOP: {
                 LEFT: () => ( {x:0, y:0} ),
                 MID: () => ( {x:0.5, y:0} ),
                 RIGHT: () => ( {x:1, y:0} )
             },
             LEFT: {
                 TOP: () => ( {x:0, y:0} ),
                 MID: () => ( {x:0, y:0.5} ),
                 BOTTOM: () => ( {x:0, y:1} )
             },
             RIGHT: {
                 TOP: () => ( {x:1, y:0} ),
                 MID: () => ( {x:1, y:0.5} ),
                 BOTTOM: () => ( {x:1, y:1} )
             },
             BOTTOM: {
                 LEFT: () => ( {x:0, y:1} ),
                 MID: () => ( {x:0.5, y:1} ),
                 RIGHT: () => ( {x:1, y:1} )
             },
             CENTER: () => ( {x:0.5, y:0.5} )
         }
     }
 };
 function clonePos(pos) {
     return { x:pos.x, y:pos.y };
 }
 function shiftPos(pos, offset) {
     return { x:pos.x+offset.x, y:pos.y+offset.y };
 }
 function addPos(p, q) {
     return { x:p.x+q.x, y:p.y+q.y };
 }
 function multiplyPos(p, q) {
     return { x:p.x*q.x, y:p.y*q.y };
 }
 function clipToRect(upperLeftPos, itemSize, clipOrigin, clipSize) {
     let q = clonePos(upperLeftPos);
     let right_boundary = clipOrigin.x + clipSize.w - itemSize.w;
     let left_boundary = clipOrigin.x;
     let top_boundary = clipOrigin.y;
     let bot_boundary = clipOrigin.y + clipSize.h - itemSize.h;
     if (q.x > right_boundary)
         q.x = right_boundary;
     else if (q.x < left_boundary)
        q.x = left_boundary;
     if (q.y > bot_boundary)
        q.y = bot_boundary;
     else if (q.y < top_boundary)
        q.y = top_boundary;
     return q;
 }
 function randomPointInRect(rect) {
     return { x:rect.x+rect.w*Math.random(),
              y:rect.y+rect.h*Math.random() };
 }

 function zeroPos() { return {x:0, y:0}; }
 function middleOf(p, q) {
     return { x:(p.x + q.x) / 2.0, y:(p.y + q.y) / 2.0 };
 }
 function fromTo(p, q) {
     return { x:q.x-p.x, y:q.y-p.y };
 }
 function rotateBy(p, theta) {
     return { x:p.x * Math.cos(theta) - p.y * Math.sin(theta),
              y:p.y * Math.cos(theta) + p.x * Math.sin(theta) };
 }
 function reversePos(p) {
     return { x:-p.x, y:-p.y };
 }
 function distBetweenPos(p, q) {
     return Math.sqrt(Math.pow(p.x-q.x, 2) + Math.pow(p.y-q.y, 2));
 }
 function lengthOfPos(p) {
     return Math.sqrt(Math.pow(p.x, 2) + Math.pow(p.y, 2));
 }
 function dotProduct(p, q) {
     return p.x*q.x + p.y*q.y;
 }
 function normalize(p) {
     let len = distBetweenPos(p, {x:0, y:0});
     if (len === 0) return { x:0, y:0 };
     else           return { x:p.x / len, y:p.y / len };
 }
 function scalarMultiply(p, scalar) {
     return { x:p.x * scalar, y:p.y * scalar };
 }
 function rescalePos(p, newLength) {
     return scalarMultiply( normalize(p), newLength );
 }
 function pointInRect(p, rect) {
     return p.x >= rect.x && p.x < rect.x + rect.w &&
            p.y >= rect.y && p.y < rect.y + rect.h;
 }
 function rectFromPosAndSize(pos, size) {
     return { x:pos.x, y:pos.y, w:size.w, h:size.h };
 }
 function intersects(r1, r2) {
     return !(r2.x > r1.x+r2.w ||
           r2.x+r2.w < r1.x ||
           r2.y > r1.y+r1.h ||
           r2.y+r2.h < r1.y);
 }
 function setStrokeStyle(ctx, stroke) {
     if (!stroke) ctx.strokeStyle = null;
     else {
         ctx.lineWidth = stroke.lineWidth;
         ctx.strokeStyle = stroke.color;
         if (stroke.lineDash)
             ctx.setLineDash(stroke.lineDash);
         else ctx.setLineDash([]);
     }
 }
 function strokeWithOpacity(ctx, opacity) {
     if (!opacity || opacity >= 1.0) ctx.stroke();
     else {
         let a = ctx.globalAlpha;
         ctx.globalAlpha = a * opacity;
         ctx.stroke();
         ctx.globalAlpha = a;
     }
 }
 function colorFrom255(val, colorWeights=[1,1,1]) {
     return 'rgb(' + Math.round(val*colorWeights[0]) + ',' + Math.round(val*colorWeights[1]) + ',' + Math.round(val*colorWeights[2]) + ')';
 }
 function colorTween(val, colorStartWeights=[0,0,0], colorEndWeights=[1,1,1]) {
     val = val * 255;
     return 'rgb(' + Math.round(val * colorEndWeights[0] + (255 - val) * colorStartWeights[0]) + ',' +
                     Math.round(val * colorEndWeights[1] + (255 - val) * colorStartWeights[1]) + ',' +
                     Math.round(val * colorEndWeights[2] + (255 - val) * colorStartWeights[2]) + ')';
 }
 function computeVariance(arr) {
     if (arr.length <= 1) return 0;
     let mean = arr.reduce((a,b) => a + b, 0) / arr.length;
     let dists = arr.map((a) => Math.pow(a - mean, 2));
     return dists.reduce((a, b) => a + b, 0) / (arr.length - 1);
 }

/** Thanks to Gumbo @ SO:
    http://stackoverflow.com/a/10865042 */
function flatten(arr_of_arrays) {
    return [].concat.apply([], arr_of_arrays);
}

// Compares arrays like sets.
function setCompare(arr1, arr2, compareFunc) {
    if (arr1.length !== arr2.length) return false;

    let a1 = arr1.slice();
    let a2 = arr2.slice();

    while(a1.length > 0) {

        let e = a1.pop();

        let matching_idx = -1;
        for (let i = 0; i < a2.length; i++) {
            if (compareFunc(a2[i], e)) {
                matching_idx = i;
                break;
            }
        }

        if (matching_idx === -1) return false;
        else {
            a2.splice(matching_idx, 1); // remove this element
            continue;
        }
    }
    return true;
}

/** Thanks to tats_innit @ SO:
    http://stackoverflow.com/a/9716515 */
Number.isNumber = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

/**
   Thanks to Fabiano @ SO:
   http://stackoverflow.com/a/3364546 */
function removeOptions(selectbox) {
    let i;
    for(i = selectbox.options.length - 1 ; i >= 0 ; i--)
        selectbox.remove(i);
}

var isClass = function(cls) {
    return ((cls && cls.constructor) ? cls.constructor.name === 'Function' : false);
};
var isInstanceOfClass = function(ins, Class) {
    return ((ins && ins.constructor) ? (ins.constructor.name !== 'Function' && ins instanceof Class) : false);
};

/**
 * Instantiates a new class instance by spreading an array of arguments over its constructor. */
 function constructClassInstance(Cls, args) {
     if (args) {
         if (Array.isArray(args)) args.splice(0, 0, null);
         else                     args = [args];
     }
     //console.log('Constructing instance of ', Cls.name, ' with args ', args);
     return new (Function.prototype.bind.apply(Cls, args));
 }

 /**
  * Seeded random number gen code from olsn @
  * http://indiegamr.com/generate-repeatable-random-numbers-in-js/
  */
 // the initial seed
 Math.seed = 6;

 // in order to work 'Math.seed' must NOT be undefined,
 // so in any case, you HAVE to provide a Math.seed
 Math.seededRandom = function(max, min) {
     max = max || 1;
     min = min || 0;

     Math.seed = (Math.seed * 9301 + 49297) % 233280;
     var rnd = Math.seed / 233280;

     return min + rnd * (max - min);
 };

/* Thanks to Anatolly @ SO: http://stackoverflow.com/a/1484514 */
 function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

 /**
  * GET params in URL field.
  ** Thanks to Quentin @ SO: http://stackoverflow.com/a/979995.
  */
  var __GET_PARAMS = function () {
    // This function is anonymous, is executed immediately and
    // the return value is assigned to QueryString!
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
      var pair = vars[i].split("=");
          // If first entry with this name
      if (typeof query_string[pair[0]] === "undefined") {
        query_string[pair[0]] = decodeURIComponent(pair[1]);
          // If second entry with this name
      } else if (typeof query_string[pair[0]] === "string") {
        var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
        query_string[pair[0]] = arr;
          // If third or later entry with this name
      } else {
        query_string[pair[0]].push(decodeURIComponent(pair[1]));
      }
    }
    return query_string;
  }();

/**
 * -- Cookies --
 ** Thanks to w3schools @
 ** http://www.w3schools.com/js/js_cookies.asp.
 */
 function setCookie(cname, cvalue, exdays) {
     var d = new Date();
     d.setTime(d.getTime() + (exdays*24*60*60*1000));
     var expires = "expires="+ d.toUTCString();
     if (typeof exdays === 'undefined')
        document.cookie = cname + '=' + cvalue;
     else
        document.cookie = cname + "=" + cvalue + "; " + expires;
 }
 function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ')
            c = c.substring(1);
        if (c.indexOf(name) === 0)
            return c.substring(name.length,c.length);
    }
    return "";
}

function stripParen(s) {
    if (s.length > 1 && s[0] === '(' && s[s.length-1] === ')')
        return s.substring(1, s.length - 1);
    else return s;
}
function isLambdaExpr(s) {
    return s.indexOf('#') > -1 || s.indexOf('λ') > -1;
}
function isComparisonExpr(s) {
    return s.indexOf('==') > -1 || s.indexOf('!=') > -1;
}

// Breaks a parenthesized expression into its top-level arguments.
function argsForExprString(s) {
    s = s.trim().replace(/\s+/g, ' '); // replace all extended whitespace with single spaces.
    let args = [];
    let len = s.length;
    let start_idx = 0;
    let depth = 0;
    for (let i = 0; i < len; i++) {
        if (s[i] === '(') depth++;
        else if (s[i] === ')') depth--;
        else if (depth === 0 && s[i] === ' ') {
            args.push( s.substring(start_idx, i + 1).trim() );
            start_idx = i + 1;
        }
    }
    args.push( s.substring(start_idx).trim() );
    return args;
}

// Converts string representation of lambda expression to
// its de Bruijn representation, making variable names invariant
// with respect to alpha conversion. Alpha equivalence is then
// the same as string equivalence.
function deBruijn(s, varindices={}) {
    //console.log('> deBruijn', s, varindices);

    let len = s.length;
    let depth = 0;
    let paren_idx = 0;
    let reading = null;
    let reading_idx = -1;
    for (let i = 0; i < len; i++) {
        if (depth > 0) {
            if (s[i] === '(') depth++;
            else if (s[i] === ')') depth--;
            if (depth === 0) { // we've surfaced

                // Clone the indices object, incrementing the index of each variable...
                let varindices_inner = {};
                for (let idx in varindices) {
                    if (varindices.hasOwnProperty(idx)) {
                        varindices_inner[idx] = varindices[idx] + 1;
                    }
                }

                // Convert the inner expression to de Bruijn.
                let subexpr = deBruijn(stripParen(s.substring(paren_idx, i + 1)), varindices_inner);

                // Replace previous expression in-line.
                s = s.substring(0, paren_idx) + '(' + subexpr + ')' + s.substring(i + 1);
                i = paren_idx + subexpr.length + 1;
                len = s.length;

            }
            continue;
        }

        if (reading && (s[i] === ' ' || i === len-1)) {
            let name = s.substring(reading_idx + 1, ((i===len-1) ? i+1 : i));
            if (name in varindices) {
                if (reading === '#') {

                    // Replace variable name after # with its index.
                    s = s.substring(0, reading_idx) + '#' + varindices[name].toString() + ((i===len-1) ? '' : s.substring(i));
                    i = reading_idx + varindices[name].toString().length + 1;
                    len = s.length;
                }
            }
            else {

                if (reading === '#')
                    console.error('Error @ deBruijn: Free variable ' + name + '. Behavior undefined.');
                else {
                    // Delete variable name after λ.
                    s = s.substring(0, reading_idx) + 'λ' + ((i===len-1) ? '' : s.substring(i));
                    i = reading_idx + 1;
                    len = s.length;
                }

                varindices[name] = 0;
            }
            reading = null;
            continue;
        }

        if (s[i] === '(') {
            paren_idx = i;
            depth++;
        }
        else if (s[i] === 'λ') {
            reading = 'λ';
            reading_idx = i;
        }
        else if (s[i] === '#') {
            reading = '#';
            reading_idx = i;
        }
    }

    return s;
}

/**
 * THANKS TO Juan Mendes @ SO: http://stackoverflow.com/a/3368118
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke, strokeOpacity) {
  if (typeof stroke == 'undefined') stroke = true;
  if (typeof radius === 'undefined') radius = 5;
  if (typeof radius === 'number') radius = {tl: radius, tr: radius, br: radius, bl: radius};
  else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) strokeWithOpacity(ctx, strokeOpacity);
}
function hexaRect(ctx, x, y, width, height, fill, stroke, strokeOpacity) {
  if (typeof stroke == 'undefined') stroke = true;
  var h2 = height / 2.0;
  ctx.beginPath();
  ctx.moveTo(x + h2, y);
  ctx.lineTo(x + width - h2, y);
  ctx.lineTo(x + width, y + h2);
  ctx.lineTo(x + width - h2, y + height);
  ctx.lineTo(x + h2, y + height);
  ctx.lineTo(x, y + h2);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) strokeWithOpacity(ctx, strokeOpacity);
}

/** Thanks to markE @ SO: http://stackoverflow.com/a/25840319 */
 function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, strokeStyle=null, fillStyle='white') {
     var rot = Math.PI / 2 * 3;
     var x = cx;
     var y = cy;
     var step = Math.PI / spikes;
     if (strokeStyle) setStrokeStyle(ctx, strokeStyle);
     ctx.beginPath();
     ctx.moveTo(cx, cy - outerRadius);
     for (var i = 0; i < spikes; i++) {
         x = cx + Math.cos(rot) * outerRadius;
         y = cy + Math.sin(rot) * outerRadius;
         ctx.lineTo(x, y);
         rot += step;

         x = cx + Math.cos(rot) * innerRadius;
         y = cy + Math.sin(rot) * innerRadius;
         ctx.lineTo(x, y);
         rot += step;
     }
     ctx.lineTo(cx, cy - outerRadius);
     ctx.closePath();
     ctx.lineWidth=5;
     if (strokeStyle) {
         strokeWithOpacity(ctx, strokeStyle.opacity);
     }
     if (fillStyle) {
         ctx.fillStyle=fillStyle;
         ctx.fill();
     }
}

function drawCircle(ctx, x, y, rad, fill, stroke) {
    if (fill) ctx.fillStyle = fill;
    if (stroke) setStrokeStyle(ctx, stroke);
    ctx.beginPath();
    ctx.arc(x+rad, y+rad, rad, 0, 2*Math.PI);
    if (fill) ctx.fill();
    if (stroke) strokeWithOpacity(ctx, stroke.opacity);
}

/** Thanks to protonfish @ SO:
    http://stackoverflow.com/a/21098325 */
function drawCylinder(ctx, x, y, w, h) {
    'use strict';
    var i, xPos, yPos, pi = Math.PI, twoPi = 2 * pi;

    ctx.beginPath();

    for (i = 0; i < twoPi; i += 0.001) {
        xPos = (x + w / 2) - (w / 2 * Math.cos(i));
        yPos = (y + h / 8) + (h / 8 * Math.sin(i));

        if (i === 0) {
            ctx.moveTo(xPos, yPos);
        } else {
            ctx.lineTo(xPos, yPos);
        }
    }
    ctx.moveTo(x, y + h / 8);
    ctx.lineTo(x, y + h - h / 8);

    for (i = 0; i < pi; i += 0.001) {
        xPos = (x + w / 2) - (w / 2 * Math.cos(i));
        yPos = (y + h - h / 8) + (h / 8 * Math.sin(i));

        if (i === 0) {
            ctx.moveTo(xPos, yPos);
        } else {
            ctx.lineTo(xPos, yPos);
        }
    }
    ctx.moveTo(x + w, y + h / 8);
    ctx.lineTo(x + w, y + h - h / 8);

    ctx.stroke();
}

function drawPath(ctx, pathCoords, offset, scale) {
    let len = pathCoords.length;
    if (len === 0) return;
    ctx.moveTo(pathCoords[0][0] * scale[0] + offset[0], pathCoords[0][1] * scale[1] + offset[1]);
    for (let i = 1; i < len; i++)
        ctx.lineTo(pathCoords[i][0] * scale[0] + offset[0], pathCoords[i][1] * scale[1] + offset[1]);
}

function drawBag(ctx, x, y, w, h, bagRadius, fill, stroke) {
    'user strict';

    const top_of_bag = [
        [0.25, 1],
        [0, 0.5],
        [0, 0],
        [0.25, 0.5],
        [0.5, 0],
        [0.75, 0.5],
        [1, 0],
        [1, 0.5],
        [0.75, 1]
    ];

    let theta = Math.acos(w / (4 * bagRadius));
    let upperLeftTopX = x + (2 * bagRadius - w) / 2.0;

    ctx.fillStyle = fill;
    ctx.beginPath();
    drawPath(ctx, top_of_bag, [upperLeftTopX, y], [w, h]); // draw top of the bag
    ctx.arc(upperLeftTopX + w / 2.0, y + h + bagRadius, bagRadius, 2 * Math.PI - theta, Math.PI + theta, false); // draw the bottom which is just a circle.
    ctx.closePath();

    if (stroke) {
        setStrokeStyle(ctx, stroke);
        strokeWithOpacity(ctx, stroke.opacity);
    }
    if (fill) {
        ctx.fill();
    }
}

function reduceExprs(exprList, delay=300) {
    let exprs = exprList.slice();
    exprs.forEach((expr) => expr.lock());
    let reduced = [];
    return new Promise((resolve, reject) => {
        let nextStep = () => {
            if (exprs.length === 0) {
                resolve(reduced);
            }
            else {
                let expr = exprs.shift();
                let result = expr.performReduction();
                let delay = (newExpr) => {
                    reduced.push(newExpr);
                    if (newExpr instanceof Expression) newExpr.lock();
                    window.setTimeout(() => {
                        nextStep();
                    }, delay);
                };
                if (result instanceof Promise) {
                    result.then(delay, () => {
                        // Uh-oh, an error happened
                        reject();
                    });
                }
                else {
                    delay(result || expr);
                }
            }
        };

        nextStep();
    });
}
