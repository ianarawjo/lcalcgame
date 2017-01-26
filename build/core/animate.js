'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Handy-dandy animation operations over node arrays.
 * @module animate
 */
var Animate = null;
var mag = function (_) {
    var _Animate = function () {
        function _Animate() {
            _classCallCheck(this, _Animate);
        }

        _createClass(_Animate, null, [{
            key: 'wait',
            value: function wait() {
                var dur = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1000;

                var twn = new Tween(function () {}, dur);
                twn.run();
                return twn;
            }
        }, {
            key: 'drawUntil',
            value: function drawUntil(stage, condition) {
                if (!stage) return null;
                var twn = new IndefiniteTween(function () {
                    stage.draw();

                    if (condition()) twn.cancel();
                });
                twn.run();
                return twn;
            }
        }, {
            key: 'run',
            value: function run(func) {
                var dur = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1000;

                var twn = new Tween(func, dur);
                twn.run();
                return twn;
            }

            // Takes alternating sequence of func, dur, onComplete arguments and runs tweens in sequence.

        }, {
            key: 'chain',
            value: function chain() {
                var _arguments = arguments;

                if (arguments.length % 3 !== 0 || arguments.length === 0) {
                    console.error('Cannot chain even (or zero) number of arguments.');
                    return;
                }

                var tweens = [];

                var _loop = function _loop(i) {

                    var f = _arguments.length <= i + 0 ? undefined : _arguments[i + 0];
                    var d = _arguments.length <= i + 1 + 0 ? undefined : _arguments[i + 1 + 0];
                    var o = _arguments.length <= i + 2 + 0 ? undefined : _arguments[i + 2 + 0];

                    var t = new Tween(f, d);
                    if (o) t.after(o);
                    if (tweens.length > 0) tweens[tweens.length - 1].after(function () {
                        return t.run();
                    });
                    tweens.push(t);
                };

                for (var i = 0; i < arguments.length; i += 3) {
                    _loop(i);
                }

                tweens[0].run();
                return tweens[0];
            }
        }, {
            key: 'blink',
            value: function blink(nodes) {
                var dur = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1000;
                var colorWeights = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [1, 1, 1];
                var blinkCount = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 2;

                if (!Array.isArray(nodes)) nodes = [nodes];
                nodes = nodes.map(function (n) {
                    return n instanceof ValueExpr ? n.graphicNode : n;
                });
                nodes.forEach(function (n) {
                    var last_color = null;
                    var twn = new Tween(function (elapsed) {
                        var gray = (Math.sin(2 * blinkCount * elapsed * Math.PI * 3 / 4) + 1) * 255 / 2;
                        var clr = colorFrom255(gray, colorWeights);
                        n.stroke = { color: clr,
                            lineWidth: 4,
                            opacity: gray / 255 };
                        if (n.stage) n.stage.draw();
                    }, dur).after(function () {
                        n.stroke = null;
                        if (n.stage) n.stage.draw();
                    });
                    twn.run();
                });
                var twn = new Tween(function () {}, dur);
                twn.run();
                return twn;
            }
        }, {
            key: 'followPath',
            value: function followPath(node, path) {
                var dur = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1000;
                var smoothFunc = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : function (elapsed) {
                    return elapsed;
                };

                node.pos = addPos(path.absolutePos, path.posAlongPath(smoothFunc(0)));
                var twn = new Tween(function (elapsed) {
                    var nextpos = addPos(path.absolutePos, path.posAlongPath(smoothFunc(elapsed)));
                    node.pos = addPos(scalarMultiply(node.pos, 0.5), scalarMultiply(nextpos, 0.5));
                    if (node.stage) node.stage.draw();
                }, dur);
                twn.run();
                return twn;
            }
        }, {
            key: 'flyToTarget',
            value: function flyToTarget(node, targetPos) {
                var accMultiplier = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1.0;
                var initVelocity = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : { x: 0, y: 0 };
                var onReachingTarget = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
                var max_vel = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 700;

                var MAX_VELOCITY = max_vel;
                var total_dist = lengthOfPos(fromTo(node.pos, targetPos));
                var vel = initVelocity;
                var acceleration = scalarMultiply(normalize(fromTo(node.pos, targetPos)), accMultiplier);

                console.warn('Initializing flyToTarget with node ', node);

                var twn = new IndefiniteTween(function (delta) {

                    node.pos = addPos(node.pos, scalarMultiply(vel, delta / 1000.0));

                    var vec = fromTo(node.pos, targetPos);
                    var unit = normalize(vec);
                    acceleration = scalarMultiply(unit, accMultiplier); // always accelerate towards target
                    vel = addPos(vel, scalarMultiply(acceleration, delta / 1000.0));

                    if (lengthOfPos(vel) > MAX_VELOCITY) vel = rescalePos(vel, MAX_VELOCITY);

                    var remaining_dist = lengthOfPos(vec);
                    var strengthOfCorrection = total_dist / Math.max(remaining_dist, 1.0) / total_dist;
                    strengthOfCorrection = Math.pow(strengthOfCorrection, 1.0);
                    node.pos = addPos(scalarMultiply(node.pos, 1.0 - strengthOfCorrection), scalarMultiply(targetPos, strengthOfCorrection));

                    if (onReachingTarget && lengthOfPos(fromTo(node.pos, targetPos)) < 40.0) {
                        twn.cancel();
                    }

                    if (node.stage) node.stage.draw();
                }).after(onReachingTarget);
                twn.run();
                return twn;
            }
        }, {
            key: 'tween',
            value: function tween(node, targetValue) {
                var dur = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1000;
                var smoothFunc = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : function (elapsed) {
                    return elapsed;
                };
                var autodraw = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
                var lerpFunc = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;


                var deepCloneProperties = function deepCloneProperties(obj, srcobj) {
                    var sourceValue = {};
                    for (var prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            if (_typeof(obj[prop]) === 'object') sourceValue[prop] = deepCloneProperties(obj[prop], srcobj[prop]);else sourceValue[prop] = srcobj[prop];
                        }
                    }
                    return sourceValue;
                };
                var sourceValue = deepCloneProperties(targetValue, node);
                var finalValue = deepCloneProperties(targetValue, targetValue);

                var lerpVals = lerpFunc ? lerpFunc : function (src, tgt, elapsed, chain) {
                    return (1.0 - elapsed) * src + elapsed * tgt;
                };
                // chain is passed to lerpVals so that a custom lerp
                // function can do different things based on what property
                // is actually being interpolated
                var lerpProps = function lerpProps(sourceObj, targetObj, elapsed) {
                    var chain = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

                    var rt = {};
                    for (var prop in targetObj) {
                        if (targetObj.hasOwnProperty(prop)) {
                            if (_typeof(targetObj[prop]) === 'object') rt[prop] = lerpProps(sourceObj[prop], targetObj[prop], elapsed, chain.concat([prop])); // recursion into inner properties
                            else rt[prop] = lerpVals(sourceObj[prop], targetObj[prop], elapsed, chain.concat([prop]));
                        }
                    }
                    return rt;
                };

                var twn = new Tween(function (elapsed) {
                    elapsed = smoothFunc(elapsed);
                    var new_props = lerpProps(sourceValue, targetValue, elapsed);

                    for (var prop in new_props) {
                        if (new_props.hasOwnProperty(prop)) {
                            node[prop] = new_props[prop];
                        }
                    }

                    if (autodraw && node.stage) node.stage.draw();
                }, dur);
                twn.run();
                twn.after(function () {
                    // Make sure the final value is actually set by using
                    // elapsed = 1.0; also, redraw the stage one last
                    // time.
                    var new_props = lerpProps(sourceValue, targetValue, 1.0);

                    for (var prop in new_props) {
                        if (new_props.hasOwnProperty(prop)) {
                            node[prop] = new_props[prop];
                        }
                    }

                    if (autodraw && node.stage) node.stage.draw();
                });
                return twn;
            }
        }, {
            key: 'play',
            value: function play(animation, imageRect, onComplete) {
                var startFrame = animation.frameAt(0);
                imageRect.image = startFrame.image;
                var stage = imageRect.stage;
                var dur = animation.totalDuration;
                var twn = new Tween(function (elapsed) {
                    var currentImage = animation.frameAtTime(elapsed * dur).image;
                    if (currentImage !== imageRect.image) {
                        imageRect.image = currentImage;
                        //console.error('changed img to ' + currentImage + ', ' + (elapsed * dur));
                        stage.draw();
                    }
                }, animation.totalDuration).after(onComplete);
                twn.run();
                return twn;
            }
        }, {
            key: 'poof',
            value: function poof(expr) {
                var sfx = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'poof';


                if (expr.stage) {
                    (function () {

                        var stg = expr.stage;
                        var sz = expr.size;
                        var len = sz.h;
                        var pos = expr.centerPos();
                        var scale = 1.4;
                        var img = new mag.ImageRect(pos.x - len * 1.4 / 2.0, pos.y - len * 1.4 / 2.0, len * 1.4, len * 1.4, 'poof0');
                        stg.add(img);

                        var anim = Resource.getAnimation('poof');
                        Animate.play(anim, img, function () {
                            stg.remove(img); // remove self from stage on animation end.
                            stg.update();
                            stg.draw();
                        });

                        if (sfx) Resource.play(sfx, 0.4);
                    })();
                }
            }
        }]);

        return _Animate;
    }();

    /*
     * Storage class for sprite animations.
     */


    var Animation = function () {
        _createClass(Animation, null, [{
            key: 'forImageSequence',
            value: function forImageSequence(seqname, range, dur) {
                var a = new mag.Animation();
                for (var i = range[0]; i <= range[1]; i++) {
                    a.addFrame(seqname + i, dur);
                }return a;
            }
        }]);

        function Animation() {
            var frames = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

            _classCallCheck(this, Animation);

            this.frames = frames;
            this.currentFrame = 0;
        }

        _createClass(Animation, [{
            key: 'frameAt',
            value: function frameAt(idx) {
                if (idx < this.frames.length) return this.frames[idx];else return null;
            }
        }, {
            key: 'addFrame',
            value: function addFrame(image_key, dur) {
                this.frames.push({ image: image_key, duration: dur });
            }
        }, {
            key: 'addFrames',
            value: function addFrames(frames) {
                var _this2 = this;

                frames.forEach(function (f) {
                    _this2.frames.push({ image: f.image, duration: f.duration });
                });
            }
        }, {
            key: 'frameAtTime',
            value: function frameAtTime(secs) {
                var a = 0;
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = this.frames[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var f = _step.value;

                        a += f.duration;
                        if (secs < a) return f;
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                return this.frames[this.frames.length - 1];
            }
        }, {
            key: 'clone',
            value: function clone() {
                var a = new mag.Animation();
                this.frames.forEach(function (f) {
                    a.addFrame(f.image, f.duration);
                });
                return a;
            }
        }, {
            key: 'totalDuration',
            get: function get() {
                return this.frames.reduce(function (prev, curr) {
                    return prev + curr.duration;
                }, 0);
            }
        }]);

        return Animation;
    }();

    var _AnimationUpdateLoop = function () {
        function _AnimationUpdateLoop() {
            _classCallCheck(this, _AnimationUpdateLoop);

            this.tweens = [];
            this.fps = 60;
        }

        _createClass(_AnimationUpdateLoop, [{
            key: 'add',
            value: function add(twn) {
                this.tweens.push(twn);
                if (this.tweens.length === 1) this.startUpdateLoop();
            }
        }, {
            key: 'isRunning',
            value: function isRunning(twn) {
                return this.tweens.indexOf(twn) > -1;
            }
        }, {
            key: 'clear',
            value: function clear() {
                this.tweens.forEach(function (tween) {
                    return tween.cancelWithoutFiringCallbacks();
                });
                this.tweens = [];
                this.stopUpdateLoop();
            }
        }, {
            key: 'remove',
            value: function remove(twn) {
                var i = this.tweens.indexOf(twn);
                if (i > -1) {
                    this.tweens.splice(i, 1);
                }
                if (this.tweens.length === 0) this.stopUpdateLoop();
            }
        }, {
            key: 'startUpdateLoop',
            value: function startUpdateLoop() {
                this.stopped = false;
                this.timeout();
            }
        }, {
            key: 'timeout',
            value: function timeout() {
                var _this = this;
                this.updateTimeout = setTimeout(function () {
                    if (_this.stopped) return;
                    _this.tweens.forEach(function (twn) {
                        return twn.timeout();
                    }); // update all tweens
                    _this.timeout();
                }, 1000.0 / this.fps);
            }
        }, {
            key: 'stopUpdateLoop',
            value: function stopUpdateLoop() {
                this.stopped = true;
            }
        }]);

        return _AnimationUpdateLoop;
    }();

    var AnimationUpdateLoop = new _AnimationUpdateLoop(); // now we can treat the main update loop like a singleton

    var Tween = function () {
        function Tween(updateLoopFunc, duration) {
            var fps = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 30;

            _classCallCheck(this, Tween);

            this.dur = duration;
            this.update = updateLoopFunc;
            this.fps = fps;
            this.onComplete = [];
            var _this = this;
            this.after = function (onComplete) {
                _this.onComplete.push(onComplete);return _this;
            };
            return this;
        }

        _createClass(Tween, [{
            key: 'run',
            value: function run() {
                if (this.dur && this.dur < 0.0001 && this.update) {
                    this.update(0); // run once by default if duration is negligible
                    return;
                }

                var _this = this;
                this.startTimeMS = new Date().getTime();
                this.cancelCallback = function () {
                    _this.cancel();
                };

                AnimationUpdateLoop.add(this);
            }
        }, {
            key: 'timeout',
            value: function timeout() {
                var elapsed = Math.min((new Date().getTime() - this.startTimeMS) / this.dur, 1.0);
                if (elapsed >= 1.0) this.cancelCallback();else this.update(elapsed); // how much time has passed
            }
        }, {
            key: 'cancelWithoutFiringCallbacks',
            value: function cancelWithoutFiringCallbacks() {
                this.onComplete = [];
                AnimationUpdateLoop.remove(this);
            }
        }, {
            key: 'cancel',
            value: function cancel() {
                AnimationUpdateLoop.remove(this);
                if (this.onComplete.length > 0) {
                    this.onComplete.forEach(function (f) {
                        f();
                    });
                    this.onComplete = [];
                }
            }
        }]);

        return Tween;
    }();

    var IndefiniteTween = function (_Tween) {
        _inherits(IndefiniteTween, _Tween);

        function IndefiniteTween() {
            _classCallCheck(this, IndefiniteTween);

            return _possibleConstructorReturn(this, (IndefiniteTween.__proto__ || Object.getPrototypeOf(IndefiniteTween)).apply(this, arguments));
        }

        _createClass(IndefiniteTween, [{
            key: 'timeout',
            value: function timeout() {
                var delta = new Date().getTime() - this.startTimeMS;
                this.startTimeMS += delta;
                if (delta > 50) delta = 50; // cap it, just in case.
                this.update(delta); // how much time has passed _between frames_ (in ms)
            }
        }]);

        return IndefiniteTween;
    }(Tween);

    var StateGraph = function () {
        function StateGraph() {
            _classCallCheck(this, StateGraph);

            this.states = {};
            this.edges = [];
            this.currentState = null;
        }

        _createClass(StateGraph, [{
            key: 'addState',
            value: function addState(name) {
                var onEnter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
                var onExit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
                var enterConditionFunc = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

                this.states[name] = {
                    enterCondition: enterConditionFunc,
                    onEnter: onEnter,
                    onExit: onExit
                };
            }
        }, {
            key: 'addEdge',
            value: function addEdge(stateA, stateB) {
                var directed = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

                this.edges.push([stateA, stateB]);
                if (!directed) this.edges.push([stateB, stateA]);
            }
        }, {
            key: 'isEnterable',
            value: function isEnterable(stateName) {
                if (!this.states[stateName].enterCondition) return true;else return this.states[stateName].enterCondition();
            }
        }, {
            key: 'enter',
            value: function enter(stateName) {
                if (stateName in this.states) {
                    if (this.states[stateName].onEnter) this.states[stateName].onEnter();
                    this.currentState = stateName;
                }
            }
        }, {
            key: 'exit',
            value: function exit(stateName) {
                if (stateName in this.states) {
                    if (this.states[stateName].onExit) this.states[stateName].onExit();
                }
            }
        }, {
            key: 'transition',
            value: function transition(stateA, stateB) {
                this.exit(stateA);
                this.enter(stateB);
            }
        }, {
            key: 'getEnterableStatesFrom',
            value: function getEnterableStatesFrom(startStateName) {
                var states = [];
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = this.edges[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var edge = _step2.value;

                        if (edge[0] === startStateName && this.isEnterable(edge[1])) states.push(edge[1]);
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }

                return states;
            }
        }]);

        return StateGraph;
    }();

    // Exports


    Animate = _Animate;
    _.Animate = _Animate;
    _.Animation = Animation;
    _.AnimationUpdateLoop = AnimationUpdateLoop;
    _.Tween = Tween;
    _.IndefiniteTween = IndefiniteTween;
    _.StateGraph = StateGraph;
    return _;
}(mag || {});