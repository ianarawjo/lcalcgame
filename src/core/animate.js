/**
 * Handy-dandy animation operations over node arrays.
 * @module animate
 */
var Animate = null;
var mag = (function(_) {

    class _Animate {

        static wait(dur=1000) {
            var twn = new Tween(() => {}, dur);
            twn.run();
            return twn;
        }
        static drawUntil(stage, condition) {
            if (!stage) return null;
            var twn = new IndefiniteTween(() => {
                stage.draw();

                if (condition()) twn.cancel();
            });
            twn.run();
            return twn;
        }

        static run(func, dur=1000) {
            var twn = new Tween(func, dur);
            twn.run();
            return twn;
        }

        // Takes alternating sequence of func, dur, onComplete arguments and runs tweens in sequence.
        static chain(...args) {
            if (args.length % 3 !== 0 || args.length === 0) {
                console.error('Cannot chain even (or zero) number of arguments.');
                return;
            }

            let tweens = [];
            for (let i = 0; i < args.length; i+=3) {

                let f = args[i];
                let d = args[i+1];
                let o = args[i+2];

                let t = new Tween(f, d);
                if (o) t.after(o);
                if (tweens.length > 0)
                    tweens[tweens.length-1].after(() => t.run());
                tweens.push( t );
            }

            tweens[0].run();
            return tweens[0];
        }

        static blink(nodes, dur=1000, colorWeights=[1,1,1], blinkCount=2) {
            if (!Array.isArray(nodes)) nodes = [nodes];
            nodes = nodes.map((n) => {
                return n instanceof ValueExpr ? n.graphicNode : n;
            });
            nodes.forEach((n) => {
                var last_color = null;
                var twn = new Tween((elapsed) => {
                    let gray = (Math.sin(2*blinkCount*elapsed*Math.PI*3/4)+1) * 255 / 2;
                    let clr = colorFrom255(gray, colorWeights);
                    n.stroke = { color: clr,
                                 lineWidth:4,
                                 opacity:gray / 255 };
                    if (n.stage) n.stage.draw();
                }, dur).after(() => {
                    n.stroke = null;
                    if (n.stage) n.stage.draw();
                });
                twn.run();
            });
            var twn = new Tween(() => {}, dur);
            twn.run();
            return twn;
        }

        static followPath(node, path, dur=1000, smoothFunc=((elapsed) => elapsed)) {
            node.pos = addPos(path.absolutePos, path.posAlongPath(smoothFunc(0)));
            var twn = new Tween((elapsed) => {
                let nextpos = addPos(path.absolutePos, path.posAlongPath(smoothFunc(elapsed)));
                node.pos = addPos(scalarMultiply(node.pos, 0.5), scalarMultiply(nextpos, 0.5));
                if (node.stage) node.stage.draw();
            }, dur);
            twn.run();
            return twn;
        }

        static flyToTarget(node, targetPos, accMultiplier=1.0, initVelocity={x:0, y:0}, onReachingTarget=null, max_vel=700 ) {
            const MAX_VELOCITY = max_vel;
            var total_dist = lengthOfPos(fromTo(node.pos, targetPos));
            var vel = initVelocity;
            var acceleration = scalarMultiply(normalize(fromTo(node.pos, targetPos)), accMultiplier);

            console.warn('Initializing flyToTarget with node ', node);

            var twn = new IndefiniteTween((delta) => {

                node.pos = addPos(node.pos, scalarMultiply(vel, delta / 1000.0));

                let vec = fromTo(node.pos, targetPos);
                let unit = normalize(vec);
                acceleration = scalarMultiply(unit, accMultiplier); // always accelerate towards target
                vel = addPos(vel, scalarMultiply(acceleration, delta / 1000.0));

                if (lengthOfPos(vel) > MAX_VELOCITY) vel = rescalePos(vel, MAX_VELOCITY);

                let remaining_dist = lengthOfPos(vec);
                let strengthOfCorrection = (total_dist / Math.max(remaining_dist, 1.0)) / total_dist;
                strengthOfCorrection = Math.pow(strengthOfCorrection, 1.0);
                node.pos = addPos(scalarMultiply(node.pos, 1.0 - strengthOfCorrection), scalarMultiply(targetPos, strengthOfCorrection) );

                if (onReachingTarget && lengthOfPos(fromTo(node.pos, targetPos)) < 40.0) {
                    twn.cancel();
                }

                if (node.stage) node.stage.draw();

            }).after(onReachingTarget);
            twn.run();
            return twn;
        }

        static tween(node, targetValue, dur=1000, smoothFunc=((elapsed) => elapsed), autodraw=true, lerpFunc=null) {

            let deepCloneProperties = (obj, srcobj) => {
                let sourceValue = {};
                for (let prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        if (typeof obj[prop] === 'object')
                            sourceValue[prop] = deepCloneProperties(obj[prop], srcobj[prop]);
                        else
                            sourceValue[prop] = srcobj[prop];
                    }
                }
                return sourceValue;
            };
            let sourceValue = deepCloneProperties(targetValue, node);
            let finalValue = deepCloneProperties(targetValue, targetValue);

            let lerpVals = lerpFunc ? lerpFunc : (src, tgt, elapsed, chain) => {
                return (1.0 - elapsed) * src + elapsed * tgt;
            };
            // chain is passed to lerpVals so that a custom lerp
            // function can do different things based on what property
            // is actually being interpolated
            let lerpProps = (sourceObj, targetObj, elapsed, chain=[]) => {
                let rt = {};
                for (let prop in targetObj) {
                    if (targetObj.hasOwnProperty(prop)) {
                        if (typeof targetObj[prop] === 'object')
                            rt[prop] = lerpProps(sourceObj[prop], targetObj[prop], elapsed, chain.concat([prop])); // recursion into inner properties
                        else
                            rt[prop] = lerpVals(sourceObj[prop], targetObj[prop], elapsed, chain.concat([prop]));
                    }
                }
                return rt;
            };

            var twn = new Tween((elapsed) => {
                elapsed = smoothFunc(elapsed);
                let new_props = lerpProps(sourceValue, targetValue, elapsed);

                for (let prop in new_props) {
                    if (new_props.hasOwnProperty(prop)) {
                        node[prop] = new_props[prop];
                    }
                }

                if (autodraw && node.stage) node.stage.draw();
            }, dur);
            twn.run();
            twn.after(() => {
                // Make sure the final value is actually set by using
                // elapsed = 1.0; also, redraw the stage one last
                // time.
                let new_props = lerpProps(sourceValue, targetValue, 1.0);

                for (let prop in new_props) {
                    if (new_props.hasOwnProperty(prop)) {
                        node[prop] = new_props[prop];
                    }
                }

                if (autodraw && node.stage) node.stage.draw();
            });
            return twn;
        }

        static play(animation, imageRect, onComplete) {
            var startFrame = animation.frameAt(0);
            imageRect.image = startFrame.image;
            var stage = imageRect.stage;
            var dur = animation.totalDuration;
            var twn = new Tween((elapsed) => {
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

        static poof(expr, sfx='poof') {

            if (expr.stage) {

                let stg = expr.stage;
                let sz = expr.size;
                let len = sz.h;
                let pos = expr.centerPos();
                let scale = 1.4;
                let img = new mag.ImageRect(pos.x - len*1.4/2.0, pos.y - len*1.4/2.0,
                                        len*1.4, len*1.4, 'poof0');
                stg.add(img);

                let anim = Resource.getAnimation('poof');
                Animate.play(anim, img, () => {
                    stg.remove(img); // remove self from stage on animation end.
                    stg.update();
                    stg.draw();
                });

                if (sfx) Resource.play(sfx, 0.4);
            }
        }
    }

    /*
     * Storage class for sprite animations.
     */
    class Animation {
        static forImageSequence(seqname, range, dur) {
            var a = new mag.Animation();
            for (let i = range[0]; i <= range[1]; i++)
                a.addFrame(seqname + i, dur);
            return a;
        }
        constructor(frames=[]) {
            this.frames = frames;
            this.currentFrame = 0;
        }
        frameAt(idx) {
            if (idx < this.frames.length) return this.frames[idx];
            else return null;
        }
        addFrame(image_key, dur) {
            this.frames.push( {image:image_key, duration:dur} );
        }
        addFrames(frames) {
            frames.forEach((f) => {
                this.frames.push( {image:f.image, duration:f.duration} );
            });
        }
        get totalDuration() {
            return this.frames.reduce((prev,curr) => prev+curr.duration, 0);
        }
        frameAtTime(secs) {
            var a = 0;
            for (let f of this.frames) {
                a += f.duration;
                if (secs < a) return f;
            }
            return this.frames[this.frames.length-1];
        }
        clone() {
            var a = new mag.Animation();
            this.frames.forEach((f) => {
                a.addFrame( f.image, f.duration ); });
            return a;
        }
    }

    class _AnimationUpdateLoop {
        constructor() {
            this.tweens = [];
            this.fps = 60;
        }
        add(twn) {
            this.tweens.push(twn);
            if (this.tweens.length === 1)
                this.startUpdateLoop();
        }
        isRunning(twn) {
            return this.tweens.indexOf(twn) > -1;
        }
        clear() {
            this.tweens.forEach((tween) => tween.cancelWithoutFiringCallbacks());
            this.tweens = [];
            this.stopUpdateLoop();
        }
        remove(twn) {
            let i = this.tweens.indexOf(twn);
            if (i > -1) {
                this.tweens.splice(i, 1);
            }
            if (this.tweens.length === 0) this.stopUpdateLoop();
        }
        startUpdateLoop() {
            this.stopped = false;
            this.timeout();
        }
        timeout() {
            var _this = this;
            this.updateTimeout = setTimeout(function () {
                if (_this.stopped) return;
                _this.tweens.forEach((twn) => twn.timeout()); // update all tweens
                _this.timeout();
            }, 1000.0 / this.fps);
        }
        stopUpdateLoop() {
            this.stopped = true;
        }
    }
    var AnimationUpdateLoop = new _AnimationUpdateLoop(); // now we can treat the main update loop like a singleton

    class Tween {
        constructor(updateLoopFunc, duration, fps=30) {
            this.dur = duration;
            this.update = updateLoopFunc;
            this.fps = fps;
            this.onComplete = [];
            var _this = this;
            this.after = (onComplete) => { _this.onComplete.push(onComplete); return _this; };
            return this;
        }

        run() {
            if (this.dur && this.dur < 0.0001 && this.update) {
                this.update(0); // run once by default if duration is negligible
                return;
            }

            var _this = this;
            this.startTimeMS = (new Date()).getTime();
            this.cancelCallback = function() {
                _this.cancel();
            };

            AnimationUpdateLoop.add(this);
        }
        timeout() {
            let elapsed = Math.min(((new Date()).getTime() - this.startTimeMS) / this.dur, 1.0);
            if (elapsed >= 1.0) this.cancelCallback();
            else this.update(elapsed); // how much time has passed
        }

        cancelWithoutFiringCallbacks() {
            this.onComplete = [];
            AnimationUpdateLoop.remove(this);
        }
        cancel() {
            AnimationUpdateLoop.remove(this);
            if (this.onComplete.length > 0) {
                this.onComplete.forEach((f) => {
                    f();
                });
                this.onComplete = [];
            }
        }
    }

    class IndefiniteTween extends Tween {
        timeout() {
            let delta = ((new Date()).getTime() - this.startTimeMS);
            this.startTimeMS += delta;
            if (delta > 50) delta = 50; // cap it, just in case.
            this.update(delta); // how much time has passed _between frames_ (in ms)
        }
    }

    class StateGraph {
        constructor() {
            this.states = {};
            this.edges = [];
            this.currentState = null;
        }
        addState(name, onEnter=null, onExit=null, enterConditionFunc=null) {
            this.states[name] = {
                enterCondition:enterConditionFunc,
                onEnter:onEnter,
                onExit:onExit
            };
        }
        addEdge(stateA, stateB, directed=true) {
            this.edges.push([stateA, stateB]);
            if (!directed) this.edges.push([stateB, stateA]);
        }
        isEnterable(stateName) {
            if (!this.states[stateName].enterCondition) return true;
            else return this.states[stateName].enterCondition();
        }
        enter(stateName) {
            if (stateName in this.states) {
                if (this.states[stateName].onEnter)
                    this.states[stateName].onEnter();
                this.currentState = stateName;
            }
        }
        exit(stateName) {
            if (stateName in this.states) {
                if (this.states[stateName].onExit)
                    this.states[stateName].onExit();
            }
        }
        transition(stateA, stateB) {
            this.exit(stateA);
            this.enter(stateB);
        }
        getEnterableStatesFrom(startStateName) {
            var states = [];
            for (let edge of this.edges) {
                if (edge[0] === startStateName && this.isEnterable(edge[1]))
                    states.push(edge[1]);
            }
            return states;
        }
    }

    // Exports
    Animate = _Animate;
    _.Animate = _Animate;
    _.Animation = Animation;
    _.AnimationUpdateLoop = AnimationUpdateLoop;
    _.Tween = Tween;
    _.IndefiniteTween = IndefiniteTween;
    _.StateGraph = StateGraph;
    return _;
}(mag || {}));
