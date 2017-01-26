'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// An if statement.
var IfStatement = function (_Expression) {
    _inherits(IfStatement, _Expression);

    function IfStatement(cond, branch) {
        _classCallCheck(this, IfStatement);

        var question_mark = new TextExpr('?');
        var else_text = new TextExpr(': null');
        question_mark.color = else_text.color = 'black';

        // OLD -- if ... then ...
        /*var if_text = new TextExpr('if');
        var then_text = new TextExpr('then');
        if_text.color = 'black';
        then_text.color = 'black';
        super([if_text, cond, then_text, branch]);*/
        var _this = _possibleConstructorReturn(this, (IfStatement.__proto__ || Object.getPrototypeOf(IfStatement)).call(this, [cond, question_mark, branch, else_text]));

        _this.color = 'LightBlue';
        return _this;
    }

    _createClass(IfStatement, [{
        key: 'onmouseclick',
        value: function onmouseclick(pos) {
            this.performReduction();
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            if (!this.cond || !this.branch) return this; // irreducible
            var cond_val = this.cond.value();
            if (cond_val === true && this.branch instanceof MissingExpression) return this; // true can't reduce to nothing but false can.
            if (cond_val === true) return this.branch; // return the inner branch
            else if (cond_val === false) return this.emptyExpr; // disappear
                else return this; // something's not reducable...
        }
    }, {
        key: 'playJimmyAnimation',
        value: function playJimmyAnimation(onComplete) {
            Resource.play('key-jiggle');
            this.opacity = 1.0;
            Animate.tween(this, { 'opacity': 0 }, 500).after(onComplete);
            //Animate.wait(Resource.getAudio('key-jiggle').duration * 1000).after(onComplete);
        }
    }, {
        key: 'playUnlockAnimation',
        value: function playUnlockAnimation(onComplete) {
            Resource.play('key-unlock');
            Animate.wait(150).after(onComplete);
        }
    }, {
        key: 'canReduce',
        value: function canReduce() {
            return this.cond && (this.cond.canReduce() || this.cond.isValue()) && this.branch && (this.branch.canReduce() || this.branch.isValue());
        }
    }, {
        key: 'performReduction',
        value: function performReduction() {
            var _this2 = this;

            var animated = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

            if (this.cond && this.cond.canReduce()) {
                return this.performSubReduction(this.cond, animated).then(function () {
                    return _this2.performReduction();
                });
            } else if (this.cond && !this.cond.isValue() && !this.cond.canReduce()) {
                // Try and play any animation anyways
                this.cond.performReduction();
                return null;
            }

            if (this.branch && this.branch.canReduce()) {
                return this.performSubReduction(this.branch, animated).then(function () {
                    return _this2.performReduction();
                });
            }

            if (this.branch && !this.branch.isValue()) {
                this.branch.performReduction();
                return Promise.reject("IfExpr: branch is not a value and not reducible");
            }

            return new Promise(function (resolve, reject) {
                var reduction = _this2.reduce();
                if (reduction != _this2) {
                    (function () {

                        var stage = _this2.stage;
                        var afterEffects = function afterEffects() {
                            _this2.ignoreEvents = false;
                            var rtn = _get(IfStatement.prototype.__proto__ || Object.getPrototypeOf(IfStatement.prototype), 'performReduction', _this2).call(_this2);
                            stage.update();
                            stage.draw();
                            if (rtn === null) {
                                rtn = new FadedNullExpr();
                            }
                            resolve(rtn);
                            return rtn;
                        };

                        if (reduction === null) {
                            _this2.playJimmyAnimation(afterEffects);
                        } else if (reduction instanceof FadedNullExpr) {
                            (function () {
                                var red = afterEffects();
                                red.ignoreEvents = true; // don't let them move a null.
                                Resource.play('pop');
                                Animate.blink(red, 1000, [1, 1, 1], 0.4).after(function () {
                                    red.poof();
                                });
                                //this.playJimmyAnimation(afterEffects);
                            })();
                        } else {
                            _this2.playUnlockAnimation(afterEffects);
                        }

                        _this2.ignoreEvents = true;
                        //var shatter = new ShatterExpressionEffect(this);
                        //shatter.run(stage, (() => {
                        //    super.performReduction();
                        //}).bind(this));
                    })();
                } else {
                    reject();
                }
            });
        }
    }, {
        key: 'value',
        value: function value() {
            return undefined;
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '(if ' + this.cond.toString() + ' ' + this.branch.toString() + ')';
        }
    }, {
        key: 'cond',
        get: function get() {
            return this.holes[0];
        }
    }, {
        key: 'branch',
        get: function get() {
            return this.holes[2];
        }
    }, {
        key: 'emptyExpr',
        get: function get() {
            return this.parent ? null : new FadedNullExpr();
        }
    }, {
        key: 'constructorArgs',
        get: function get() {
            return [this.cond.clone(), this.branch.clone()];
        }
    }]);

    return IfStatement;
}(Expression);

// A simpler graphical form of if.


var ArrowIfStatement = function (_IfStatement) {
    _inherits(ArrowIfStatement, _IfStatement);

    function ArrowIfStatement(cond, branch) {
        _classCallCheck(this, ArrowIfStatement);

        var _this3 = _possibleConstructorReturn(this, (ArrowIfStatement.__proto__ || Object.getPrototypeOf(ArrowIfStatement)).call(this, cond, branch));

        var arrow = new TextExpr('→');
        arrow.color = 'black';
        _this3.holes = [cond, arrow, branch];
        return _this3;
    }

    _createClass(ArrowIfStatement, [{
        key: 'emptyExpr',
        get: function get() {
            return null;
        }
    }, {
        key: 'cond',
        get: function get() {
            return this.holes[0];
        }
    }, {
        key: 'branch',
        get: function get() {
            return this.holes[2];
        }
    }]);

    return ArrowIfStatement;
}(IfStatement);

var IfElseStatement = function (_IfStatement2) {
    _inherits(IfElseStatement, _IfStatement2);

    function IfElseStatement(cond, branch, elseBranch) {
        _classCallCheck(this, IfElseStatement);

        var _this4 = _possibleConstructorReturn(this, (IfElseStatement.__proto__ || Object.getPrototypeOf(IfElseStatement)).call(this, cond, branch));

        var txt = new TextExpr('else');
        txt.color = 'black';
        _this4.addArg(txt);
        _this4.addArg(elseBranch);
        return _this4;
    }

    _createClass(IfElseStatement, [{
        key: 'reduce',
        value: function reduce() {
            if (!this.cond || !this.branch || !this.elseBranch) return this; // irreducible
            var cond_val = this.cond.value();
            console.log(this.cond, cond_val);
            if (cond_val === true) return this.branch; // return the inner branch
            else if (cond_val === false) return this.elseBranch; // disappear
                else return this; // something's not reducable...
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '(if ' + this.cond.toString() + ' ' + this.branch.toString() + ' ' + this.elseBranch.toString() + ')';
        }
    }, {
        key: 'elseBranch',
        get: function get() {
            return this.holes[4];
        }
    }, {
        key: 'constructorArgs',
        get: function get() {
            return [this.cond.clone(), this.branch.clone(), this.elseBranch.clone()];
        }
    }]);

    return IfElseStatement;
}(IfStatement);

// Lock and key metaphor for if.


var LockIfStatement = function (_IfStatement3) {
    _inherits(LockIfStatement, _IfStatement3);

    function LockIfStatement(cond, branch) {
        _classCallCheck(this, LockIfStatement);

        var _this5 = _possibleConstructorReturn(this, (LockIfStatement.__proto__ || Object.getPrototypeOf(LockIfStatement)).call(this, cond, branch));

        _this5.holes = [cond, branch];

        var bluebg = new mag.RoundedRect(0, 0, 25, 25);
        bluebg.color = "#2484f5";
        _this5._bg = bluebg;

        var top = new mag.ImageRect(0, 0, 112 / 2.0, 74 / 2.0, 'lock-top-locked');
        _this5._top = top;

        var shinewrap = new mag.PatternRect(0, 0, 24, 100, 'shinewrap');
        shinewrap.opacity = 0.8;
        _this5._shinewrap = shinewrap;
        return _this5;
    }

    _createClass(LockIfStatement, [{
        key: 'playJimmyAnimation',
        value: function playJimmyAnimation(onComplete) {
            var _this6 = this;

            Resource.play('key-jiggle');
            Animate.wait(Resource.getAudio('key-jiggle').duration * 1000).after(onComplete);
            if (this.stage) this.stage.draw();

            var pos = this.pos;
            Animate.tween(this, { 'pos': { x: pos.x + 16, y: pos.y } }, 100).after(function () {
                Animate.tween(_this6, { 'pos': { x: pos.x - 16, y: pos.y } }, 100).after(function () {
                    Animate.tween(_this6, { 'pos': { x: pos.x, y: pos.y } }, 100).after(function () {
                        Animate.wait(300).after(function () {
                            _this6.opacity = 1.0;
                            _this6._shinewrap.opacity = 0;
                            Animate.tween(_this6, { 'opacity': 0 }, 100).after(function () {
                                _this6.opacity = 0;
                                if (_this6.stage) {
                                    var stage = _this6.stage;
                                    stage.remove(_this6);
                                    stage.draw();
                                }
                            });
                        });
                    });
                });
            });
        }
    }, {
        key: 'playUnlockAnimation',
        value: function playUnlockAnimation(onComplete) {
            var _this7 = this;

            Resource.play('key-unlock');
            Animate.wait(600).after(onComplete);

            Animate.wait(200).after(function () {
                _this7._top.image = 'lock-top-unlocked';
                _this7._top.size = { w: _this7._top.size.w, h: 128 / 2 };
                _this7._shinewrap.opacity = 0;
                if (_this7.stage) _this7.stage.draw();
            });
        }
    }, {
        key: 'drawInternal',
        value: function drawInternal(ctx, pos, boundingSize) {
            _get(LockIfStatement.prototype.__proto__ || Object.getPrototypeOf(LockIfStatement.prototype), 'drawInternal', this).call(this, ctx, pos, boundingSize);

            var condsz = this.cond.absoluteSize;

            var bgsz = { w: condsz.w + 14, h: condsz.h + 16 };
            var bgpos = addPos(pos, { x: -(bgsz.w - condsz.w) / 2.0 + this.cond.pos.x, y: -(bgsz.h - condsz.h) / 2.0 + 3 });
            var topsz = this._top.size;
            var wrapsz = { w: boundingSize.w - condsz.w, h: boundingSize.h };
            var wrappos = { x: bgpos.x + bgsz.w, y: pos.y };

            this._shinewrap.size = wrapsz;
            this._shinewrap.pos = wrappos;

            this._bg.stroke = this.stroke;

            this._bg.drawInternal(ctx, bgpos, bgsz);
            this._top.drawInternal(ctx, addPos(bgpos, { x: bgsz.w / 2.0 - topsz.w / 2.0, y: -topsz.h }), topsz);
        }
    }, {
        key: 'drawInternalAfterChildren',
        value: function drawInternalAfterChildren(ctx, pos, boundingSize) {

            if ((!this.opacity || this.opacity > 0) && this._shinewrap.opacity > 0 && !(this.branch instanceof MissingExpression)) {
                ctx.save();
                roundRect(ctx, pos.x, pos.y, boundingSize.w, boundingSize.h, this.radius * this.absoluteScale.x, false, false);
                ctx.clip();

                ctx.globalCompositeOperation = "screen";
                ctx.globalAlpha = this._shinewrap.opacity;
                this._shinewrap.drawInternal(ctx, this._shinewrap.pos, this._shinewrap.size);
                ctx.restore();
            }
        }
    }, {
        key: 'emptyExpr',
        get: function get() {
            return null;
        }
    }, {
        key: 'cond',
        get: function get() {
            return this.holes[0];
        }
    }, {
        key: 'branch',
        get: function get() {
            return this.holes[1];
        }
    }]);

    return LockIfStatement;
}(IfStatement);

var InlineLockIfStatement = function (_IfStatement4) {
    _inherits(InlineLockIfStatement, _IfStatement4);

    function InlineLockIfStatement(cond, branch) {
        _classCallCheck(this, InlineLockIfStatement);

        var _this8 = _possibleConstructorReturn(this, (InlineLockIfStatement.__proto__ || Object.getPrototypeOf(InlineLockIfStatement)).call(this, cond, branch));

        var lock = new ImageExpr(0, 0, 56, 56, 'lock-icon');
        lock.lock();
        _this8.holes = [cond, lock, branch];
        return _this8;
    }

    _createClass(InlineLockIfStatement, [{
        key: 'playJimmyAnimation',
        value: function playJimmyAnimation(onComplete) {
            var _this9 = this;

            _get(InlineLockIfStatement.prototype.__proto__ || Object.getPrototypeOf(InlineLockIfStatement.prototype), 'playJimmyAnimation', this).call(this, onComplete);

            this.opacity = 1.0;
            Animate.tween(this, { 'opacity': 0 }, 100).after(function () {
                _this9.opacity = 0;
                if (_this9.stage) {
                    var stage = _this9.stage;
                    stage.remove(_this9);
                    stage.draw();
                }
            });
        }
    }, {
        key: 'playUnlockAnimation',
        value: function playUnlockAnimation(onComplete) {
            this.holes[1].image = 'lock-icon-unlocked';
            _get(InlineLockIfStatement.prototype.__proto__ || Object.getPrototypeOf(InlineLockIfStatement.prototype), 'playUnlockAnimation', this).call(this, onComplete);
        }
    }, {
        key: 'emptyExpr',
        get: function get() {
            return null;
        }
    }, {
        key: 'cond',
        get: function get() {
            return this.holes[0];
        }
    }, {
        key: 'branch',
        get: function get() {
            return this.holes[2];
        }
    }]);

    return InlineLockIfStatement;
}(IfStatement);