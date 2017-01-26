'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Node disappears and is replaced by a firework-like particle explosion.
var SplosionEffect = function () {
    function SplosionEffect() {
        _classCallCheck(this, SplosionEffect);
    }

    _createClass(SplosionEffect, null, [{
        key: 'run',
        value: function run(node) {

            if (!node.stage) {
                console.warn('@ SmashsplodeEffect: Node is not member of stage.');
                return;
            }

            // Store stage context.
            var stage = node.stage;
            var parts = [];

            // Remove node from stage.
            stage.remove(node);

            // Store node center pos.
            var center = node.centerPos();

            // Create particles at center.
            var PARTICLE_COUNT = 20;
            var PARTICLE_MIN_RAD = 2;
            var PARTICLE_MAX_RAD = 12;
            var EXPLOSION_RAD = 100;

            var _loop = function _loop(i) {

                // Create individual particle + add each to the stage.
                var part = new mag.Circle(center.x, center.y, Math.floor(PARTICLE_MIN_RAD + (PARTICLE_MAX_RAD - PARTICLE_MIN_RAD) * Math.random()));
                part.color = 'gold';
                part.shadowOffset = 0;
                parts.push(part);
                stage.add(part);

                // 'Explode' outward (move particle to outer edge of explosion radius).
                var theta = Math.random() * Math.PI * 2;
                var rad = EXPLOSION_RAD * (Math.random() / 2.0 + 0.5);
                var targetPos = addPos(part.pos, { x: rad * Math.cos(theta), y: rad * Math.sin(theta) });
                Animate.tween(part, { 'pos': targetPos, 'scale': { x: 0.0001, y: 0.0001 } }, 400, function (elapsed) {
                    return Math.pow(elapsed, 0.5);
                }, false).after(function () {
                    stage.remove(part); // self-delete for cleanup
                    stage.draw();
                });
            };

            for (var i = 0; i < PARTICLE_COUNT; i++) {
                _loop(i);
            }

            Animate.wait(400).after(function () {
                parts.forEach(function (p) {
                    return stage.remove(p);
                });
                parts = null;
                stage.draw();
            });

            Animate.drawUntil(stage, function () {
                return parts === null;
            });
        }
    }]);

    return SplosionEffect;
}();

var SparkleTrigger = function () {
    function SparkleTrigger() {
        _classCallCheck(this, SparkleTrigger);
    }

    _createClass(SparkleTrigger, null, [{
        key: 'run',
        value: function run(node, onTrigger) {

            if (!node.stage) {
                console.warn('@ SparkleTrigger: Node is not member of stage.');
                return;
            }

            // Store stage context.
            var stage = node.stage;
            node.update();

            // Store node center pos.
            var center = node.centerPos();
            var size = node.absoluteSize;
            if (size.w === 0) size = { w: 50, h: 50 };
            var triggered = false;
            var parts = [];
            var activeparts = 0;
            var cancelRenderLoop = false;

            // Create a bunch of floaty particles.
            var PARTICLE_COUNT = Math.min(100, 30 * (size.w / 50.0));
            var PARTICLE_MIN_RAD = 2;
            var PARTICLE_MAX_RAD = 8;

            var _loop2 = function _loop2(i) {

                var part = new mag.Star(center.x, center.y, Math.floor(PARTICLE_MIN_RAD + (PARTICLE_MAX_RAD - PARTICLE_MIN_RAD) * Math.random()));
                parts.push(part);
                //part.ignoreEvents = true;

                var ghostySparkle = function ghostySparkle() {
                    if (triggered) return;

                    size = node.absoluteSize;
                    if (size.w === 0) size = { w: 50, h: 50 };

                    var vec = { x: (Math.random() - 0.5) * size.w * 1.2,
                        y: (Math.random() - 0.5) * size.h * 1.2 - part.size.h / 2.0 };

                    //part.pos = addPos(center, vec);
                    part.pos = addPos(node.centerPos(), vec);
                    part.color = "#0F0";
                    part.shadowOffset = 0;
                    part.opacity = 1.0;
                    part.onmouseenter = function (pos) {
                        if (!triggered) {
                            onTrigger();
                            triggered = true;
                        }
                    };
                    stage.add(part);
                    activeparts++;
                    part.anim = Animate.tween(part, { opacity: 0.0 }, Math.max(3000 * Math.random(), 800), function (elapsed) {
                        return elapsed;
                    }, false).after(function () {
                        stage.remove(part);
                        activeparts--;
                        if (!triggered) ghostySparkle();else if (activeparts === 0) cancelRenderLoop = true;
                    });
                };
                ghostySparkle();

                // Whooosh!
                /*let flyFromCenter = () => {
                    part.pos = clonePos(center);
                    part.color = "blue";
                    part.shadowOffset = 0;
                    part.opacity = 1.0;
                    stage.add(part);
                    Animate.tween(part, { pos:addPos(center, rescalePos(vec, 200)), opacity:0.0 }, 400).after(() => {
                        stage.remove(part);
                        flyFromCenter();
                    });
                };
                flyFromCenter();*/
            };

            for (var i = 0; i < PARTICLE_COUNT; i++) {
                _loop2(i);
            }

            Animate.drawUntil(stage, function () {
                return cancelRenderLoop;
            });
        }
    }]);

    return SparkleTrigger;
}();

var ExpressionEffect = function (_mag$RoundedRect) {
    _inherits(ExpressionEffect, _mag$RoundedRect);

    function ExpressionEffect() {
        _classCallCheck(this, ExpressionEffect);

        return _possibleConstructorReturn(this, (ExpressionEffect.__proto__ || Object.getPrototypeOf(ExpressionEffect)).apply(this, arguments));
    }

    return ExpressionEffect;
}(mag.RoundedRect);

var ShatterExpressionEffect = function (_ExpressionEffect) {
    _inherits(ShatterExpressionEffect, _ExpressionEffect);

    function ShatterExpressionEffect(roundRectToShatter) {
        _classCallCheck(this, ShatterExpressionEffect);

        var size = roundRectToShatter.absoluteSize;
        var pos = roundRectToShatter.upperLeftPos(roundRectToShatter.absolutePos, size);
        //size.w -= 75;

        var _this3 = _possibleConstructorReturn(this, (ShatterExpressionEffect.__proto__ || Object.getPrototypeOf(ShatterExpressionEffect)).call(this, pos.x + size.w / 2.0, pos.y + size.h / 2.0, size.w, size.h, roundRectToShatter.radius));

        _this3.size = size;

        _this3.opacity = 0.0;
        _this3.stroke = { color: 'white', lineWidth: 3 };
        _this3.color = 'white';
        _this3._effectParent = roundRectToShatter;

        var _this = _this3;
        _this3.run = function (stage, afterFadeCb, afterShatterCb) {
            _this.anchor = { x: 0.5, y: 0.5 };
            _this.fadeCb = afterFadeCb;
            _this.shatterCb = afterShatterCb;
            stage.add(_this);
            _this.fadeIn().then(_this.shatter.bind(_this3)).then(function () {

                // Removes self after completion.
                var stage = _this.parent || _this.stage;
                stage.remove(_this);
                stage.update();
                stage.draw();
            });
        };
        return _this3;
    }

    _createClass(ShatterExpressionEffect, [{
        key: 'fadeIn',
        value: function fadeIn() {
            var _this = this;
            this.opacity = 0.0;
            return new Promise(function (resolve, reject) {
                Animate.tween(_this, { 'opacity': 1.0 }, 400, function (elapsed) {
                    return Math.pow(elapsed, 0.4);
                }).after(function () {
                    if (_this.fadeCb) _this.fadeCb();
                    resolve();
                });
                Resource.play('heatup');
            });
        }
    }, {
        key: 'shatter',
        value: function shatter() {
            var _this = this;
            _this.stroke = { color: 'white', lineWidth: 3 };
            return new Promise(function (resolve, reject) {
                Animate.tween(_this, { 'opacity': 0.0, 'scale': { x: 1.2, y: 1.4 } }, 300, function (elapsed) {
                    return Math.pow(elapsed, 0.4);
                }).after(function () {
                    if (_this.shatterCb) _this.shatterCb();
                    resolve();
                });
                Resource.play('shatter');
            });
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '';
        }
    }, {
        key: 'constructorArgs',
        get: function get() {
            return [this._effectParent.clone()];
        }
    }]);

    return ShatterExpressionEffect;
}(ExpressionEffect);

var MirrorShatterEffect = function (_ImageExpr) {
    _inherits(MirrorShatterEffect, _ImageExpr);

    function MirrorShatterEffect(mirrorToShatter) {
        _classCallCheck(this, MirrorShatterEffect);

        var shouldBreak = mirrorToShatter.broken;
        var size = { w: 86, h: 86 };
        var pos = mirrorToShatter.upperLeftPos(mirrorToShatter.absolutePos, size);
        pos = addPos(pos, { x: size.w / 2.0 - 4, y: size.h / 2.0 - 11 });

        //this.size = size;
        var _this4 = _possibleConstructorReturn(this, (MirrorShatterEffect.__proto__ || Object.getPrototypeOf(MirrorShatterEffect)).call(this, pos.x, pos.y, size.w, size.h, shouldBreak ? 'mirror-icon-fade-false' : 'mirror-icon-fade-true'));

        _this4.pos = pos;
        _this4.scale = mirrorToShatter.absoluteScale;
        _this4.opacity = 0.0;
        _this4.stroke = { color: 'white', lineWidth: 3 };
        _this4.color = 'white';
        _this4._effectParent = mirrorToShatter;

        var _this = _this4;
        _this4.run = function (stage, afterFadeCb, afterShatterCb) {
            _this.anchor = { x: 0.5, y: 0.5 };
            _this.fadeCb = afterFadeCb;
            _this.shatterCb = afterShatterCb;
            stage.add(_this);

            _this4.lock();

            _this.fadeIn().then(_this.shatter.bind(_this4)).then(function () {

                // .. //
                stage.update();
            });
        };
        return _this4;
    }

    _createClass(MirrorShatterEffect, [{
        key: 'onmousedrag',
        value: function onmousedrag(pos) {
            debugger;
        }
    }, {
        key: 'fadeIn',
        value: function fadeIn() {
            var _this = this;
            this.opacity = 0.0;
            return new Promise(function (resolve, reject) {
                Animate.tween(_this, { 'opacity': 1.0 }, 400, function (elapsed) {
                    return Math.pow(elapsed, 0.4);
                }).after(function () {
                    if (_this.fadeCb) _this.fadeCb();
                    resolve();
                });
                Resource.play('heatup');
            });
        }
    }, {
        key: 'shatter',
        value: function shatter() {
            var _this = this;
            var stage = _this.parent || _this.stage;
            _this.stroke = { color: 'white', lineWidth: 3 };
            _this.ignoreEvents = true;

            if (this._effectParent.broken) {

                var lefthalf = _this.clone();
                var righthalf = _this.clone();
                lefthalf.graphicNode.image = 'mirror-icon-fade-false-lefthalf';
                righthalf.graphicNode.image = 'mirror-icon-fade-false-righthalf';
                lefthalf.ignoreEvents = true;
                righthalf.ignoreEvents = true;
                stage.add(lefthalf);
                stage.add(righthalf);

                Animate.tween(lefthalf, { pos: addPos(lefthalf.pos, { x: -50, y: 0 }), opacity: 0 }, 300, function (elapsed) {
                    return Math.pow(elapsed, 0.4);
                }).after(function () {
                    stage.remove(lefthalf);
                });

                // Removes self after completion.
                stage.remove(_this);
                stage.update();
                stage.draw();

                return new Promise(function (resolve, reject) {
                    Animate.tween(righthalf, { pos: addPos(righthalf.pos, { x: 50, y: 0 }), opacity: 0 }, 300, function (elapsed) {
                        return Math.pow(elapsed, 0.4);
                    }).after(function () {
                        if (_this.shatterCb) _this.shatterCb();
                        stage.remove(righthalf);
                        resolve();
                    });
                    Resource.play('mirror-shatter');
                });
            } else return new Promise(function (resolve, reject) {
                Animate.tween(_this, { 'opacity': 0.0, 'scale': { x: 1.2, y: 1.4 } }, 300, function (elapsed) {
                    return Math.pow(elapsed, 0.2);
                }).after(function () {
                    if (_this.shatterCb) _this.shatterCb();

                    // Removes self after completion.
                    stage.remove(_this);
                    stage.update();
                    stage.draw();

                    resolve();
                });
                Resource.play('shatter');
            });
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '';
        }
    }, {
        key: 'constructorArgs',
        get: function get() {
            return [this._effectParent.clone()];
        }
    }]);

    return MirrorShatterEffect;
}(ImageExpr);