'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// A boolean compare function like ==, !=, >, >=, <=, <.

var CompareExpr = function (_Expression) {
    _inherits(CompareExpr, _Expression);

    _createClass(CompareExpr, null, [{
        key: 'operatorMap',
        value: function operatorMap() {
            return { '==': 'is', '!=': 'is not', '>': '>', '<': '<' };
        }
    }, {
        key: 'textForFuncName',
        value: function textForFuncName(fname) {
            var map = CompareExpr.operatorMap();
            if (fname in map) return map[fname];else return fname;
        }
    }]);

    function CompareExpr(b1, b2) {
        var compareFuncName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '==';

        _classCallCheck(this, CompareExpr);

        var compare_text = new TextExpr(CompareExpr.textForFuncName(compareFuncName));
        compare_text.color = 'black';

        var _this = _possibleConstructorReturn(this, (CompareExpr.__proto__ || Object.getPrototypeOf(CompareExpr)).call(this, [b1, compare_text, b2]));

        _this.funcName = compareFuncName;
        _this.color = "HotPink";
        _this._origColor = "HotPink";
        _this.reducableStrokeColor = "DeepPink";
        _this.padding = { left: 20, inner: 10, right: 30 };
        return _this;
    }

    _createClass(CompareExpr, [{
        key: 'onmouseclick',
        value: function onmouseclick(pos) {
            console.log('Expressions are equal: ', this.compare());
            this.performUserReduction();
        }
    }, {
        key: 'update',
        value: function update() {
            _get(CompareExpr.prototype.__proto__ || Object.getPrototypeOf(CompareExpr.prototype), 'update', this).call(this);
            if (this.rightExpr instanceof BooleanPrimitive || this.rightExpr instanceof CompareExpr) this.rightExpr.color = '#ff99d1';
            if (this.leftExpr instanceof BooleanPrimitive || this.leftExpr instanceof CompareExpr) this.leftExpr.color = '#ff99d1';
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            var cmp = this.compare();
            if (cmp === true) return new (ExprManager.getClass('true'))();else if (cmp === false) return new (ExprManager.getClass('false'))();else if (this.funcName === "+" || this.funcName === "=") return true;else return this;
        }
    }, {
        key: 'canReduce',
        value: function canReduce() {
            // Allow comparisons with lambdas.
            return this.leftExpr && this.rightExpr && (this.operatorExpr.canReduce() || this.operatorExpr instanceof OpLiteral) && (this.leftExpr.canReduce() || this.leftExpr.isValue() || this.leftExpr instanceof LambdaExpr) && (this.rightExpr.canReduce() || this.rightExpr.isValue()) || this.rightExpr instanceof LambdaExpr;
        }
    }, {
        key: 'performReduction',
        value: function performReduction() {
            var _this2 = this;

            var animated = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

            if (this.operatorExpr instanceof OpLiteral) {
                var _ret = function () {
                    var op = _this2.operatorExpr.toString();
                    var locked = _this2.locked;
                    var _swap = function _swap(expr) {
                        var parent = _this2.parent || _this2.stage;
                        if (locked) expr.lock();
                        parent.swap(_this2, expr);
                        expr.lockSubexpressions();
                    };
                    if (op === '=') {
                        var assign = new (ExprManager.getClass('assign'))(_this2.leftExpr.clone(), _this2.rightExpr.clone());
                        _swap(assign);
                        return {
                            v: assign.performReduction()
                        };
                    } else if (op === '+') {
                        var add = new (ExprManager.getClass('+'))(_this2.leftExpr.clone(), _this2.rightExpr.clone());
                        _swap(add);
                        return {
                            v: add.performReduction()
                        };
                    } else {
                        _this2.operatorExpr = new TextExpr(op);
                        _this2.funcName = op;
                        _this2.lockSubexpressions();
                    }
                }();

                if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            } else if (this.operatorExpr instanceof TypeInTextExpr && !this.operatorExpr.isCommitted()) {
                this.operatorExpr.typeBox.carriageReturn();
            }

            if (this.leftExpr && this.rightExpr && !(this.leftExpr.isValue() && this.rightExpr.isValue())) {
                var animations = [];
                var genSubreduceAnimation = function genSubreduceAnimation(expr) {
                    var before = expr;
                    return _this2.performSubReduction(expr, true).then(function (result) {
                        if (result != before) return Promise.resolve();else return Promise.reject("@ CompareExpr.performReduction: Subexpression did not reduce!");
                    });
                };
                if (!this.leftExpr.isValue() && !(this.leftExpr instanceof LambdaExpr)) animations.push(genSubreduceAnimation(this.leftExpr));
                if (!this.rightExpr.isValue() && !(this.rightExpr instanceof LambdaExpr)) animations.push(genSubreduceAnimation(this.rightExpr));
                return Promise.all(animations).then(function () {
                    if (_this2.reduce() != _this2) {
                        return after(500).then(function () {
                            return _this2.performReduction(animated);
                        });
                    }
                    return Promise.reject("@ CompareExpr.performReduction: Subexpressions did not reduce!");
                });
            }
            if (this.reduce() != this) {
                if (animated) {
                    return new Promise(function (resolve, _reject) {
                        var shatter = new ShatterExpressionEffect(_this2);
                        Animate.wait(500).after(function () {
                            shatter.run(stage, function () {
                                _this2.ignoreEvents = false;
                                resolve(_get(CompareExpr.prototype.__proto__ || Object.getPrototypeOf(CompareExpr.prototype), 'performReduction', _this2).call(_this2));
                            }.bind(_this2));
                        });
                        _this2.ignoreEvents = true;
                    });
                } else _get(CompareExpr.prototype.__proto__ || Object.getPrototypeOf(CompareExpr.prototype), 'performReduction', this).call(this);
            }
            return Promise.reject("Cannot reduce!");
        }
    }, {
        key: 'compare',
        value: function compare() {
            if (this.operatorExpr instanceof OpLiteral) {
                this.funcName = this.operatorExpr.toString();
            } else if (!this.operatorExpr.canReduce()) return undefined;

            if (this.funcName === '==') {
                if (!this.rightExpr || !this.leftExpr) return undefined;

                var lval = this.leftExpr instanceof LambdaExpr ? this.leftExpr.toString() : this.leftExpr.value();
                var rval = this.rightExpr instanceof LambdaExpr ? this.rightExpr.toString() : this.rightExpr.value();

                // Variables that are equal reduce to TRUE, regardless of whether they are bound!!
                if (!lval && !rval && this.leftExpr instanceof LambdaVarExpr && this.rightExpr instanceof LambdaVarExpr) return this.leftExpr.name === this.rightExpr.name;

                //console.log('leftexpr', this.leftExpr.constructor.name, this.leftExpr instanceof LambdaVarExpr, lval);
                //console.log('rightexpr', this.rightExpr.constructor.name, rval);

                if (lval === undefined || rval === undefined) return undefined;else if (Array.isArray(lval) && Array.isArray(rval)) return setCompare(lval, rval, function (e, f) {
                    return e.toString() === f.toString();
                });else return lval === rval;
            } else if (this.funcName === '!=') {
                return this.leftExpr.value() !== this.rightExpr.value();
            } else if (this.funcName === 'and' || this.funcName === 'or' || this.funcName === 'and not' || this.funcName === 'or not') {
                if (!this.rightExpr || !this.leftExpr) return undefined;

                var lval = this.leftExpr.value();
                var rval = this.rightExpr.value();

                if (lval === undefined || rval === undefined) return undefined;

                //console.log('leftexpr', this.leftExpr.constructor.name, this.leftExpr instanceof LambdaVarExpr, lval);
                //console.log('rightexpr', this.rightExpr.constructor.name, rval);

                if (this.funcName === 'and') return lval === true && rval === true;else if (this.funcName === 'and not') return lval === true && !(rval === true);else if (this.funcName === 'or') return lval === true || rval === true;else if (this.funcName === 'or not') return lval === true || !(rval === true);else {
                    console.warn('Logical operator "' + this.funcName + '" not implemented.');
                    return undefined;
                }
            } else if (this.funcName === '>' || this.funcName === '<') {

                if (!this.rightExpr || !this.leftExpr) return undefined;

                var lval = this.leftExpr.value();
                var rval = this.rightExpr.value();

                if (lval === undefined || rval === undefined) return undefined;else if (typeof lval !== 'number' || typeof rval !== 'number') {
                    console.warn('Operand for ' + this.funcName + ' does not reduce to a number value.', lval, rval);
                    return undefined;
                } else if (this.funcName === '>') return lval > rval;else if (this.funcName === '<') return lval < rval;
            } else {
                //console.warn('Compare function "' + this.funcName + '" not implemented.');
                return undefined;
            }
        }
    }, {
        key: 'drawInternal',
        value: function drawInternal(ctx, pos, boundingSize) {
            ctx.fillStyle = 'black';
            setStrokeStyle(ctx, this.stroke);
            if (this.shadowOffset !== 0) this.drawBaseShape(ctx, { x: pos.x, y: pos.y + this.shadowOffset }, boundingSize);
            ctx.fillStyle = this.color;
            this.drawBaseShape(ctx, pos, boundingSize);
        }
    }, {
        key: 'drawBaseShape',
        value: function drawBaseShape(ctx, pos, boundingSize) {
            hexaRect(ctx, pos.x, pos.y, boundingSize.w, boundingSize.h, true, this.stroke ? true : false, this.stroke ? this.stroke.opacity : null);
        }
    }, {
        key: 'detach',
        value: function detach() {
            _get(CompareExpr.prototype.__proto__ || Object.getPrototypeOf(CompareExpr.prototype), 'detach', this).call(this);
            this.color = this._origColor;
        }
    }, {
        key: 'toString',
        value: function toString() {
            return (this.locked ? '/' : '') + '(' + this.funcName + ' ' + this.leftExpr.toString() + ' ' + this.rightExpr.toString() + ')';
        }
    }, {
        key: 'toJavaScript',
        value: function toJavaScript() {
            var _this3 = this;

            var js_forms = {
                '==': 'a == b',
                '!=': 'a != b',
                'and': 'a && b',
                'or': 'a || b',
                'or not': 'a || !b',
                'and not': 'a && !b',
                '>': 'a > b',
                '<': 'a < b',
                '>=': 'a >= b',
                '<=': 'a <= b',
                '>>>': 'a >>> b', // typing operator...
                '>>': 'a >> b', // missing op expr
                '+': 'a + b'
            };
            var opName = this.funcName;
            if (this.operatorExpr instanceof MissingOpExpression) opName = '>>';else if (this.operatorExpr instanceof TypeInTextExpr) opName = '>>>';else if (this.operatorExpr instanceof OpLiteral) opName = this.operatorExpr.toString();

            if (opName in js_forms) {
                var _ret2 = function () {
                    var template = js_forms[opName];
                    var inner_exprs = { 'a': _this3.leftExpr.toJavaScript(), 'b': _this3.rightExpr.toJavaScript() };
                    var isString = function isString(x) {
                        return (x.match(/\'/g) || []).length === 2 && x.indexOf("'") === 0 && x.lastIndexOf("'") === x.length - 1;
                    };
                    var final_expr = template.replace(/a|b/g, function (match) {
                        // Replaces a with leftExpr and b with rightExpr,
                        // adding parentheses if necessary.
                        var s = inner_exprs[match];
                        if (!isString(s) && /\s/g.test(s)) // if this value isn't a string and it has whitespace, we need to wrap it in parentheses...
                            return '(' + s + ')';else return s;
                    });
                    return {
                        v: final_expr
                    };
                }();

                if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
            } else {
                console.error('@ CompareExpr.toJavaScript: Operator name ' + this.funcName + ' not in mappings.');
                return '__ERROR()';
            }
        }
    }, {
        key: 'constructorArgs',
        get: function get() {
            return [this.holes[0].clone(), this.holes[2].clone(), this.funcName];
        }
    }, {
        key: 'leftExpr',
        get: function get() {
            return this.holes[0];
        }
    }, {
        key: 'operatorExpr',
        get: function get() {
            return this.holes[1];
        },
        set: function set(e) {
            this.holes[1] = e;
        }
    }, {
        key: 'rightExpr',
        get: function get() {
            return this.holes[2];
        }
    }]);

    return CompareExpr;
}(Expression);

/** Faded compare variants. */


var FadedCompareExpr = function (_CompareExpr) {
    _inherits(FadedCompareExpr, _CompareExpr);

    function FadedCompareExpr(b1, b2) {
        var compareFuncName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '==';

        _classCallCheck(this, FadedCompareExpr);

        var _this4 = _possibleConstructorReturn(this, (FadedCompareExpr.__proto__ || Object.getPrototypeOf(FadedCompareExpr)).call(this, b1, b2, compareFuncName));

        _this4.holes[1].text = compareFuncName;
        return _this4;
    }

    return FadedCompareExpr;
}(CompareExpr);

var GraphicFadedCompareExpr = function (_FadedCompareExpr) {
    _inherits(GraphicFadedCompareExpr, _FadedCompareExpr);

    function GraphicFadedCompareExpr(b1, b2) {
        var compareFuncName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '==';

        _classCallCheck(this, GraphicFadedCompareExpr);

        var _this5 = _possibleConstructorReturn(this, (GraphicFadedCompareExpr.__proto__ || Object.getPrototypeOf(GraphicFadedCompareExpr)).call(this, b1, b2, compareFuncName));

        _this5._color = _this5._origColor = "lightgray";
        _this5.operatorExpr.color = SyntaxColor.for('operator');
        _this5.baseShape = 'rounded';
        return _this5;
    }

    _createClass(GraphicFadedCompareExpr, [{
        key: 'drawBaseShape',
        value: function drawBaseShape(ctx, pos, size) {
            if (this.baseShape === 'hexa') _get(GraphicFadedCompareExpr.prototype.__proto__ || Object.getPrototypeOf(GraphicFadedCompareExpr.prototype), 'drawBaseShape', this).call(this, ctx, pos, size);else roundRect(ctx, pos.x, pos.y, size.w, size.h, this.radius * this.absoluteScale.x, this.color ? true : false, this.stroke ? true : false, this.stroke ? this.stroke.opacity : null, this.notches ? this.notches : null);
        }
    }]);

    return GraphicFadedCompareExpr;
}(FadedCompareExpr);

/* Defines the NOT unary operator, '!' */


var UnaryOpExpr = function (_Expression2) {
    _inherits(UnaryOpExpr, _Expression2);

    function UnaryOpExpr(b) {
        var unaryOpName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'not';

        _classCallCheck(this, UnaryOpExpr);

        var compare_text = new TextExpr(unaryOpName);
        compare_text.color = 'black';

        var _this6 = _possibleConstructorReturn(this, (UnaryOpExpr.__proto__ || Object.getPrototypeOf(UnaryOpExpr)).call(this, [compare_text, b]));

        _this6.funcName = unaryOpName;
        _this6.color = "HotPink";
        _this6.padding = { left: 20, inner: 10, right: 30 };
        return _this6;
    }

    _createClass(UnaryOpExpr, [{
        key: 'onmouseclick',
        value: function onmouseclick(pos) {
            if (!this._animating) {
                this.performReduction();
            }
        }
    }, {
        key: 'update',
        value: function update() {
            _get(UnaryOpExpr.prototype.__proto__ || Object.getPrototypeOf(UnaryOpExpr.prototype), 'update', this).call(this);
            if (this.rightExpr instanceof BooleanPrimitive || this.rightExpr instanceof CompareExpr) this.rightExpr.color = '#ff99d1';
        }
    }, {
        key: 'reduce',
        value: function reduce() {

            if (!this.rightExpr) return this;

            var rval = this.rightExpr.value();
            if (rval === undefined) return this;

            if (rval === true) return new (ExprManager.getClass('false'))();else if (rval === false) return new (ExprManager.getClass('true'))();else {
                console.log('@ UnaryOpExpr.reduce: Non-boolean values cannot be negated at this time.');
                return this;
            }
        }
    }, {
        key: 'canReduce',
        value: function canReduce() {
            return this.rightExpr && (this.rightExpr.canReduce() || this.rightExpr.isValue());
        }
    }, {
        key: 'performReduction',
        value: function performReduction() {
            var _this7 = this;

            var animated = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;


            if (this.rightExpr && !this.rightExpr.isValue() && !this._animating) {
                var _ret3 = function () {
                    _this7._animating = true;
                    var before = _this7.rightExpr;
                    return {
                        v: _this7.performSubReduction(_this7.rightExpr, true).then(function () {
                            _this7._animating = false;
                            if (_this7.rightExpr != before) {
                                return _this7.performReduction();
                            }
                        })
                    };
                }();

                if ((typeof _ret3 === 'undefined' ? 'undefined' : _typeof(_ret3)) === "object") return _ret3.v;
            }

            if (this.reduce() != this) {
                if (animated) {
                    return new Promise(function (resolve, _reject) {
                        var shatter = new ShatterExpressionEffect(_this7);
                        shatter.run(stage, function () {
                            _this7.ignoreEvents = false;
                            resolve(_get(UnaryOpExpr.prototype.__proto__ || Object.getPrototypeOf(UnaryOpExpr.prototype), 'performReduction', _this7).call(_this7));
                        }.bind(_this7));
                        _this7.ignoreEvents = true;
                    });
                } else _get(UnaryOpExpr.prototype.__proto__ || Object.getPrototypeOf(UnaryOpExpr.prototype), 'performReduction', this).call(this);
            }
            return null;
        }
    }, {
        key: 'drawInternal',
        value: function drawInternal(ctx, pos, boundingSize) {
            ctx.fillStyle = 'black';
            setStrokeStyle(ctx, this.stroke);
            if (this.shadowOffset !== 0) {
                hexaRect(ctx, pos.x, pos.y + this.shadowOffset, boundingSize.w, boundingSize.h, true, this.stroke ? true : false, this.stroke ? this.stroke.opacity : null);
            }
            ctx.fillStyle = this.color;
            hexaRect(ctx, pos.x, pos.y, boundingSize.w, boundingSize.h, true, this.stroke ? true : false, this.stroke ? this.stroke.opacity : null);
        }
    }, {
        key: 'toString',
        value: function toString() {
            return (this.locked ? '/' : '') + '(' + this.funcName + ' ' + this.rightExpr.toString() + ')';
        }
    }, {
        key: 'toJavaScript',
        value: function toJavaScript() {
            return '!(' + this.rightExpr.toJavaScript() + ')';
        }
    }, {
        key: 'constructorArgs',
        get: function get() {
            return [this.rightExpr.clone(), this.funcName];
        }
    }, {
        key: 'operatorExpr',
        get: function get() {
            return this.holes[0];
        }
    }, {
        key: 'rightExpr',
        get: function get() {
            return this.holes[1];
        }
    }]);

    return UnaryOpExpr;
}(Expression);

var MirrorCompareExpr = function (_CompareExpr2) {
    _inherits(MirrorCompareExpr, _CompareExpr2);

    function MirrorCompareExpr(b1, b2) {
        var compareFuncName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '==';

        _classCallCheck(this, MirrorCompareExpr);

        var _this8 = _possibleConstructorReturn(this, (MirrorCompareExpr.__proto__ || Object.getPrototypeOf(MirrorCompareExpr)).call(this, b1, b2, compareFuncName));

        _this8.children = [];
        _this8.holes = [];
        _this8.padding = { left: 20, inner: 0, right: 40 };

        _this8.addArg(b1);

        // Mirror graphic
        var mirror = new MirrorExpr(0, 0, 86, 86);
        mirror.exprInMirror = b2.clone();
        _this8.addArg(mirror);

        _this8.addArg(b2);
        return _this8;
    }

    _createClass(MirrorCompareExpr, [{
        key: 'expressionToMirror',
        value: function expressionToMirror() {
            var isMirrorable = function isMirrorable(expr) {
                return !(!expr || expr instanceof LambdaVarExpr || expr instanceof MissingExpression);
            };
            if (isMirrorable(this.leftExpr)) return this.leftExpr.clone();else if (isMirrorable(this.rightExpr)) return this.rightExpr.clone();else return null;
        }
    }, {
        key: 'update',
        value: function update() {
            _get(MirrorCompareExpr.prototype.__proto__ || Object.getPrototypeOf(MirrorCompareExpr.prototype), 'update', this).call(this);
            if (this.reduce() != this) {
                this.mirror.exprInMirror = new (ExprManager.getClass('true'))().graphicNode;
                this.mirror.broken = !this.compare();
            } else {
                this.mirror.exprInMirror = this.expressionToMirror();
                this.mirror.broken = false;
            }
        }

        // Animation effects

    }, {
        key: 'performReduction',
        value: function performReduction() {
            var _this9 = this;

            return new Promise(function (resolve, reject) {
                if (!_this9.isReducing && _this9.reduce() != _this9) {
                    var stage = _this9.stage;
                    var shatter = new MirrorShatterEffect(_this9.mirror);
                    shatter.run(stage, function () {
                        _this9.ignoreEvents = false;
                        resolve(_get(MirrorCompareExpr.prototype.__proto__ || Object.getPrototypeOf(MirrorCompareExpr.prototype), 'performReduction', _this9).call(_this9, false));
                    }.bind(_this9));
                    _this9.ignoreEvents = true;
                    _this9.isReducing = true;
                } else {
                    reject();
                }
            });
        }
    }, {
        key: 'constructorArgs',
        get: function get() {
            return [this.holes[0].clone(), this.holes[2].clone(), this.funcName];
        }
    }, {
        key: 'leftExpr',
        get: function get() {
            return this.holes[0];
        }
    }, {
        key: 'mirror',
        get: function get() {
            return this.holes[1];
        }
    }, {
        key: 'rightExpr',
        get: function get() {
            return this.holes[2];
        }
    }]);

    return MirrorCompareExpr;
}(CompareExpr);