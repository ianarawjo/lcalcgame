'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 *	Lambda Calc V3
 *  --------------
 * 	Foundation structures
 */

var EMPTY_EXPR_WIDTH = 50;
var DEFAULT_EXPR_HEIGHT = 50;
var DEFAULT_CORNER_RAD = 20;
var DEFAULT_RENDER_CTX = null;

/** A generic expression. Could be a lambda expression, could be an if statement, could be a for.
    In general, anything that takes in arguments and can reduce to some other value based on those arguments. */

var Expression = function (_RoundedRect) {
    _inherits(Expression, _RoundedRect);

    function Expression() {
        var holes = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

        _classCallCheck(this, Expression);

        var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(Expression).call(this, 0, 0, EMPTY_EXPR_WIDTH, DEFAULT_EXPR_HEIGHT, DEFAULT_CORNER_RAD));

        _this2.holes = holes;
        _this2.padding = { left: 10, inner: 10, right: 10 };
        _this2._size = { w: EMPTY_EXPR_WIDTH, h: DEFAULT_EXPR_HEIGHT };

        if (_this2.holes) {
            var _this = _this2;
            _this2.holes.forEach(function (hole) {
                _this.addChild(hole);
            });
        }
        return _this2;
    }

    _createClass(Expression, [{
        key: 'equals',
        value: function equals(otherNode) {
            if (otherNode instanceof Expression && this.holes.length === otherNode.holes.length) {
                if (this.holes.length === 0) return this.value === otherNode.value;else {
                    var b = true;
                    for (var i = 0; i < this.holes.length; i++) {
                        b &= this.holes[i].value === otherNode[i].value;
                    }return b;
                }
            }
            return false;
        }
    }, {
        key: 'clone',
        value: function clone() {
            var parent = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

            var c = _get(Object.getPrototypeOf(Expression.prototype), 'clone', this).call(this, parent);
            var children = c.children;
            c.children = [];
            c.holes = [];
            c.stroke = null;
            children.forEach(function (child) {
                return c.addArg(child);
            });
            return c;
        }

        // Makes all inner expressions undraggable, 'binding' them permanently.

    }, {
        key: 'bindSubexpressions',
        value: function bindSubexpressions() {
            this.holes.forEach(function (hole) {
                if (hole instanceof Expression && !(hole instanceof MissingExpression)) {
                    if (hole instanceof VarExpr || hole instanceof BooleanPrimitive) hole.lock();
                    hole.bindSubexpressions();
                }
            });
        }
    }, {
        key: 'addArg',
        value: function addArg(arg) {
            this.holes.push(arg);
            this.addChild(arg);
        }
    }, {
        key: 'removeArg',
        value: function removeArg(arg) {
            var idx = this.holes.indexOf(arg);
            if (idx > -1) {
                this.holes.splice(idx, 1); // remove 1 elem @ idx
                this.update();
                //this.stage.draw();
            } else console.error('@ removeArg: Could not find arg ', arg, ' in expression.');
        }
    }, {
        key: 'swap',
        value: function swap(arg, anotherArg) {
            if (!arg || anotherArg === undefined) return;
            var i = this.holes.indexOf(arg);
            if (i > -1) {

                this.holes.splice(i, 1, anotherArg);

                if (anotherArg) {
                    anotherArg.pos = arg.pos;
                    anotherArg.dragging = false;
                    anotherArg.parent = this;
                    anotherArg.scale = { x: 0.85, y: 0.85 };
                    anotherArg.onmouseleave();
                    anotherArg.onmouseup();
                }

                arg.parent = null;
                this.update();
            } else console.log('Cannot swap: Argument ', arg, ' not found in parent.');
        }
    }, {
        key: 'getHoleSizes',
        value: function getHoleSizes() {
            if (!this.holes || this.holes.length === 0) return [];
            var sizes = [];
            this.holes.forEach(function (expr) {
                var size = expr ? expr.size : { w: EMPTY_EXPR_WIDTH, h: DEFAULT_EXPR_HEIGHT };
                size.w *= expr.scale.x;
                sizes.push(size);
            });
            return sizes;
        }
    }, {
        key: 'update',
        value: function update() {
            var padding = this.padding.inner;
            var x = this.padding.left;
            var y = this.size.h / 2.0 + (this.exprOffsetY ? this.exprOffsetY : 0);
            var _this = this;
            this.children = [];
            this.holes.forEach(function (expr) {
                return _this.addChild(expr);
            });
            this.holes.forEach(function (expr) {
                // Update hole expression positions.
                expr.anchor = { x: 0, y: 0.5 };
                expr.pos = { x: x, y: y };
                expr.scale = { x: 0.85, y: 0.85 };
                expr.update();
                x += expr.size.w * expr.scale.x + padding;
            });
            this.children = this.holes; // for rendering
        }

        // Apply arguments to expression

    }, {
        key: 'apply',
        value: function apply(args) {}
        // ... //


        // Apply a single argument at specified arg index

    }, {
        key: 'applyAtIndex',
        value: function applyAtIndex(idx, arg) {}
        // ... //


        // Reduce this expression to another.
        // * Returns the newly built expression. Leaves this expression unchanged.

    }, {
        key: 'reduce',
        value: function reduce() {
            var options = arguments.length <= 0 || arguments[0] === undefined ? undefined : arguments[0];

            return this;
        }

        // * Swaps this expression for its reduction (if one exists) in the expression hierarchy.

    }, {
        key: 'performReduction',
        value: function performReduction() {
            var reduced_expr = this.reduce();
            if (reduced_expr !== undefined && reduced_expr != this) {
                // Only swap if reduction returns something > null.

                console.warn('performReduction with ', this, reduced_expr);

                this.stage.saveState();
                Logger.log('state-save', this.stage.toString());

                // Log the reduction.
                var reduced_expr_str = void 0;
                if (reduced_expr === null) reduced_expr_str = '()';else if (Array.isArray(reduced_expr)) reduced_expr_str = reduced_expr.reduce(function (prev, curr) {
                    return prev + curr.toString() + ' ';
                }, '').trim();else reduced_expr_str = reduced_expr.toString();
                Logger.log('reduction', { 'before': this.toString(), 'after': reduced_expr_str });

                var parent = this.parent ? this.parent : this.stage;
                if (reduced_expr) reduced_expr.ignoreEvents = this.ignoreEvents; // the new expression should inherit whatever this expression was capable of as input
                parent.swap(this, reduced_expr);

                if (reduced_expr && reduced_expr.parent) {
                    var try_reduce = reduced_expr.parent.reduceCompletely();
                    if (try_reduce != reduced_expr.parent && try_reduce !== null) {
                        Animate.blink(reduced_expr.parent, 400, [0, 1, 0]);
                    }
                }

                return reduced_expr;
            }
        }
    }, {
        key: 'reduceCompletely',
        value: function reduceCompletely() {
            // Try to reduce this expression and its subexpressions as completely as possible.
            var e = this;
            var prev_holes = e.holes;
            //e.parent = this.parent;
            if (e.children.length === 0) return e.reduce();else {
                e.holes = e.holes.map(function (hole) {
                    if (hole instanceof Expression) return hole.reduceCompletely();else return hole;
                });
                //console.warn('Reduced: ', e, e.holes);
                e.children = [];
                e.holes.forEach(function (hole) {
                    return e.addChild(hole);
                });
                var red = e.reduce();
                e.children = [];
                e.holes = prev_holes;
                e.holes.forEach(function (hole) {
                    return e.addChild(hole);
                });
                return red;
            }
        }
    }, {
        key: 'detach',
        value: function detach() {
            if (this.parent) {
                var ghost_expr;
                if (this.droppedInClass) ghost_expr = new this.droppedInClass(this);else ghost_expr = new MissingExpression(this);
                var _this = this;
                var stage = this.parent.stage;
                this.parent.swap(this, ghost_expr);
                stage.add(this);
                stage.bringToFront(this);
                this.shell = ghost_expr;
            }
            if (this.toolbox) {
                this.toolbox.removeExpression(this); // remove this expression from the toolbox
            }
        }
    }, {
        key: 'lock',
        value: function lock() {
            this.shadowOffset = 0;
            this.ignoreEvents = true;
            this.locked = true;
        }
    }, {
        key: 'unlock',
        value: function unlock() {
            this.shadowOffset = 2;
            this.ignoreEvents = false;
            this.locked = false;
        }
    }, {
        key: 'lockSubexpressions',
        value: function lockSubexpressions() {
            var filterFunc = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

            this.holes.forEach(function (child) {
                if (child instanceof Expression) {
                    if (!filterFunc || filterFunc(child)) child.lock();
                    child.lockSubexpressions(filterFunc);
                }
            });
        }
    }, {
        key: 'unlockSubexpressions',
        value: function unlockSubexpressions() {
            var filterFunc = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

            this.holes.forEach(function (child) {
                if (child instanceof Expression) {
                    if (!filterFunc || filterFunc(child)) child.unlock();
                    child.unlockSubexpressions(filterFunc);
                }
            });
        }
    }, {
        key: 'hits',
        value: function hits(pos) {
            var options = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];

            if (this.locked) return this.hitsChild(pos, options);else return _get(Object.getPrototypeOf(Expression.prototype), 'hits', this).call(this, pos, options);
        }
    }, {
        key: 'onmousedrag',
        value: function onmousedrag(pos) {
            _get(Object.getPrototypeOf(Expression.prototype), 'onmousedrag', this).call(this, pos);
            var rightX = pos.x + this.absoluteSize.w;
            //if (rightX < GLOBAL_DEFAULT_SCREENSIZE.width) { // Clipping to edges
            this.pos = pos;
            //} else this.pos = { x:GLOBAL_DEFAULT_SCREENSIZE.width - this.absoluteSize.w, y:pos.y };

            if (!this.dragging) {
                this.detach();
                this.stage.bringToFront(this);
                this.dragging = true;
            }
        }
    }, {
        key: 'onmouseup',
        value: function onmouseup(pos) {
            if (this.dragging && this.shell) {
                if (!this.parent) this.scale = { x: 1, y: 1 };
                this.shell = null;
                //this.shell.stage.remove(this);
                //this.shell.stage = null;
                //this.shell.parent.swap(this.shell, this); // put it back
                //this.shell = null;
            }
            this.dragging = false;
        }

        // The value (if any) this expression represents.

    }, {
        key: 'value',
        value: function value() {
            return undefined;
        }
    }, {
        key: 'toString',
        value: function toString() {
            if (this.holes.length === 1) return this.holes[0].toString();
            var s = '(';
            for (var i = 0; i < this.holes.length; i++) {
                if (i > 0) s += ' ';
                s += this.holes[i].toString();
            }
            return s + ')';
        }
    }, {
        key: 'holeCount',
        get: function get() {
            return this.holes ? this.holes.length : 0;
        }

        // Sizes to match its children.

    }, {
        key: 'size',
        get: function get() {

            var padding = this.padding;
            var width = 0;
            var sizes = this.getHoleSizes();
            var scale_x = this.scale.x;

            if (sizes.length === 0) return { w: this._size.w, h: this._size.h };

            sizes.forEach(function (s) {
                width += s.w + padding.inner;
            });
            width += padding.right; // the end

            //if(this.color === 'red') width *= 0.8;
            return { w: width, h: DEFAULT_EXPR_HEIGHT };
        }
    }]);

    return Expression;
}(RoundedRect);

var MissingExpression = function (_Expression) {
    _inherits(MissingExpression, _Expression);

    function MissingExpression(expr_to_miss) {
        _classCallCheck(this, MissingExpression);

        var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(MissingExpression).call(this, []));

        if (!expr_to_miss) expr_to_miss = new Expression();
        _this3.shadowOffset = -1; // inner
        _this3.color = '#555555';
        _this3._size = { w: expr_to_miss.size.w, h: expr_to_miss.size.h };
        _this3.ghost = expr_to_miss;
        return _this3;
    }

    _createClass(MissingExpression, [{
        key: 'getClass',
        value: function getClass() {
            return MissingExpression;
        }
    }, {
        key: 'onmousedrag',
        value: function onmousedrag(pos) {} // disable drag

    }, {
        key: 'ondropenter',
        value: function ondropenter(node, pos) {
            this.onmouseenter(pos);
        }
    }, {
        key: 'ondropexit',
        value: function ondropexit(node, pos) {
            this.onmouseleave(pos);
        }
    }, {
        key: 'ondropped',
        value: function ondropped(node, pos) {
            _get(Object.getPrototypeOf(MissingExpression.prototype), 'ondropped', this).call(this, node, pos);
            if (node.dragging) {
                // Reattach node.
                Resource.play('pop');
                node.stage.remove(node);
                node.droppedInClass = this.getClass();
                this.parent.swap(this, node); // put it back

                // Blink red if total reduction is not possible with this config.
                /*var try_reduce = node.parent.reduceCompletely();
                if (try_reduce == node.parent || try_reduce === null) {
                    Animate.blink(node.parent, 400, [1,0,0]);
                }*/

                // Blink blue if reduction is possible with this config.
                var try_reduce = node.parent.reduceCompletely();
                if (try_reduce != node.parent && try_reduce !== null) {
                    Animate.blink(node.parent, 400, [0, 1, 0]);
                }
            }
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '_';
        }
    }]);

    return MissingExpression;
}(Expression);

var MissingTypedExpression = function (_MissingExpression) {
    _inherits(MissingTypedExpression, _MissingExpression);

    function MissingTypedExpression() {
        _classCallCheck(this, MissingTypedExpression);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(MissingTypedExpression).apply(this, arguments));
    }

    _createClass(MissingTypedExpression, [{
        key: 'getClass',
        value: function getClass() {
            return MissingTypedExpression;
        }

        // Returns TRUE if this hole accepts the given expression.

    }, {
        key: 'accepts',
        value: function accepts(expr) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.acceptedClasses[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var c = _step.value;

                    if (expr instanceof c) return true;
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
        }
    }, {
        key: 'ondropenter',
        value: function ondropenter(node, pos) {
            if (this.accepts(node)) _get(Object.getPrototypeOf(MissingTypedExpression.prototype), 'ondropenter', this).call(this, node, pos);
        }
    }, {
        key: 'ondropexit',
        value: function ondropexit(node, pos) {
            if (this.accepts(node)) _get(Object.getPrototypeOf(MissingTypedExpression.prototype), 'ondropexit', this).call(this, node, pos);
        }
    }, {
        key: 'ondropped',
        value: function ondropped(node, pos) {
            if (this.accepts(node)) _get(Object.getPrototypeOf(MissingTypedExpression.prototype), 'ondropped', this).call(this, node, pos);
        }
    }, {
        key: 'drawInternal',
        value: function drawInternal(pos, boundingSize) {
            pos.x -= boundingSize.w / 1.2 - boundingSize.w;
            pos.y -= boundingSize.h / 1.14 - boundingSize.h; // aesthetic resizing
            boundingSize.w /= 1.2;
            this.graphicNode.ctx = this.ctx;
            this.graphicNode.stroke = this.stroke;
            this.graphicNode.color = this.color;
            this.graphicNode.shadowOffset = this.shadowOffset;
            this.graphicNode.drawInternal(pos, boundingSize);
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '_';
        }
    }]);

    return MissingTypedExpression;
}(MissingExpression);

var MissingBagExpression = function (_MissingTypedExpressi) {
    _inherits(MissingBagExpression, _MissingTypedExpressi);

    function MissingBagExpression(expr_to_miss) {
        _classCallCheck(this, MissingBagExpression);

        var _this5 = _possibleConstructorReturn(this, Object.getPrototypeOf(MissingBagExpression).call(this, expr_to_miss));

        _this5._size = { w: 50, h: 50 };
        _this5.graphicNode = new Bag(0, 0, 22, false);
        _this5.acceptedClasses = [BagExpr, PutExpr];
        return _this5;
    }

    _createClass(MissingBagExpression, [{
        key: 'getClass',
        value: function getClass() {
            return MissingBagExpression;
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '__';
        }
    }]);

    return MissingBagExpression;
}(MissingTypedExpression);

var MissingBooleanExpression = function (_MissingTypedExpressi2) {
    _inherits(MissingBooleanExpression, _MissingTypedExpressi2);

    function MissingBooleanExpression(expr_to_miss) {
        _classCallCheck(this, MissingBooleanExpression);

        var _this6 = _possibleConstructorReturn(this, Object.getPrototypeOf(MissingBooleanExpression).call(this, expr_to_miss));

        _this6._size = { w: 80, h: 50 };
        _this6.graphicNode = new HexaRect(0, 0, 44, 44);
        _this6.acceptedClasses = [BooleanPrimitive, CompareExpr];
        return _this6;
    }

    _createClass(MissingBooleanExpression, [{
        key: 'getClass',
        value: function getClass() {
            return MissingBooleanExpression;
        }
    }, {
        key: 'drawInternal',
        value: function drawInternal(pos, boundingSize) {
            this.graphicNode.ctx = this.ctx;
            this.graphicNode.stroke = this.stroke;
            this.graphicNode.color = this.color;
            this.graphicNode.shadowOffset = this.shadowOffset;
            this.graphicNode.drawInternal(pos, boundingSize);
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '_b';
        }
    }]);

    return MissingBooleanExpression;
}(MissingTypedExpression);

var TextExpr = function (_Expression2) {
    _inherits(TextExpr, _Expression2);

    function TextExpr(txt) {
        var font = arguments.length <= 1 || arguments[1] === undefined ? 'Consolas' : arguments[1];
        var fontSize = arguments.length <= 2 || arguments[2] === undefined ? 35 : arguments[2];

        _classCallCheck(this, TextExpr);

        var _this7 = _possibleConstructorReturn(this, Object.getPrototypeOf(TextExpr).call(this));

        _this7.text = txt;
        _this7.font = font;
        _this7.fontSize = fontSize; // in pixels
        _this7.color = 'black';
        return _this7;
    }

    _createClass(TextExpr, [{
        key: 'drawInternal',
        value: function drawInternal(pos, boundingSize) {
            var ctx = this.ctx;
            var abs_scale = this.absoluteScale;
            ctx.save();
            ctx.font = this.contextFont;
            ctx.scale(abs_scale.x, abs_scale.y);
            ctx.fillStyle = this.color;
            ctx.fillText(this.text, pos.x / abs_scale.x, pos.y / abs_scale.y + 2.2 * this.fontSize * this.anchor.y);
            ctx.restore();
        }
    }, {
        key: 'hits',
        value: function hits(pos, options) {
            return false;
        } // disable mouse events

    }, {
        key: 'value',
        value: function value() {
            return this.text;
        }
    }, {
        key: 'size',
        get: function get() {
            var ctx = this.ctx || GLOBAL_DEFAULT_CTX;
            if (!ctx || !this.text || this.text.length === 0) {
                console.error('Cannot size text: No context.');
                return { w: 4, h: this.fontSize };
            }
            ctx.font = this.contextFont;
            var measure = ctx.measureText(this.text);
            return { w: measure.width, h: DEFAULT_EXPR_HEIGHT };
        }
    }, {
        key: 'contextFont',
        get: function get() {
            return this.fontSize + 'px ' + this.font;
        }
    }]);

    return TextExpr;
}(Expression);

var BooleanPrimitive = function (_Expression3) {
    _inherits(BooleanPrimitive, _Expression3);

    function BooleanPrimitive(name) {
        _classCallCheck(this, BooleanPrimitive);

        var _this8 = _possibleConstructorReturn(this, Object.getPrototypeOf(BooleanPrimitive).call(this));

        var text = new TextExpr(name);
        text.pos = { x: 0, y: 0 };
        text.anchor = { x: -0.1, y: 1.5 }; // TODO: Fix this bug.
        _this8.color = "HotPink";
        _this8.addArg(text);
        return _this8;
    }

    _createClass(BooleanPrimitive, [{
        key: 'reduce',
        value: function reduce() {
            return this;
        }
    }, {
        key: 'reduceCompletely',
        value: function reduceCompletely() {
            return this;
        }
    }, {
        key: 'drawInternal',
        value: function drawInternal(pos, boundingSize) {
            this.ctx.fillStyle = 'black';
            setStrokeStyle(this.ctx, this.stroke);
            if (this.shadowOffset !== 0) {
                hexaRect(this.ctx, pos.x, pos.y + this.shadowOffset, boundingSize.w, boundingSize.h, true, this.stroke ? true : false); // just fill for now
            }
            this.ctx.fillStyle = this.color;
            hexaRect(this.ctx, pos.x, pos.y, boundingSize.w, boundingSize.h, true, this.stroke ? true : false); // just fill for now
        }
    }]);

    return BooleanPrimitive;
}(Expression);

var TrueExpr = function (_BooleanPrimitive) {
    _inherits(TrueExpr, _BooleanPrimitive);

    function TrueExpr() {
        _classCallCheck(this, TrueExpr);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(TrueExpr).call(this, 'true'));
    }

    _createClass(TrueExpr, [{
        key: 'value',
        value: function value() {
            return true;
        }
    }, {
        key: 'toString',
        value: function toString() {
            return 'true';
        }
    }]);

    return TrueExpr;
}(BooleanPrimitive);

var FalseExpr = function (_BooleanPrimitive2) {
    _inherits(FalseExpr, _BooleanPrimitive2);

    function FalseExpr() {
        _classCallCheck(this, FalseExpr);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(FalseExpr).call(this, 'false'));
    }

    _createClass(FalseExpr, [{
        key: 'value',
        value: function value() {
            return false;
        }
    }, {
        key: 'toString',
        value: function toString() {
            return 'false';
        }
    }]);

    return FalseExpr;
}(BooleanPrimitive);

var EmptyExpr = function (_Expression4) {
    _inherits(EmptyExpr, _Expression4);

    function EmptyExpr() {
        _classCallCheck(this, EmptyExpr);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(EmptyExpr).apply(this, arguments));
    }

    _createClass(EmptyExpr, [{
        key: 'value',
        value: function value() {
            return null;
        }
    }]);

    return EmptyExpr;
}(Expression);

// An if statement.


var IfStatement = function (_Expression5) {
    _inherits(IfStatement, _Expression5);

    function IfStatement(cond, branch) {
        _classCallCheck(this, IfStatement);

        var if_text = new TextExpr('if');
        var then_text = new TextExpr('then');
        if_text.color = 'black';
        then_text.color = 'black';

        var _this12 = _possibleConstructorReturn(this, Object.getPrototypeOf(IfStatement).call(this, [if_text, cond, then_text, branch]));

        _this12.color = 'LightBlue';
        return _this12;
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
        key: 'performReduction',
        value: function performReduction() {
            var _this13 = this;

            if (this.reduce() != this) {
                var shatter = new ShatterExpressionEffect(this);
                shatter.run(stage, function () {
                    _get(Object.getPrototypeOf(IfStatement.prototype), 'performReduction', _this13).call(_this13);
                }.bind(this));
            }
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
            return this.holes[1];
        }
    }, {
        key: 'branch',
        get: function get() {
            return this.holes[3];
        }
    }, {
        key: 'emptyExpr',
        get: function get() {
            return null;
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

        var _this14 = _possibleConstructorReturn(this, Object.getPrototypeOf(ArrowIfStatement).call(this, cond, branch));

        var arrow = new TextExpr('→');
        arrow.color = 'black';
        _this14.holes = [cond, arrow, branch];
        return _this14;
    }

    _createClass(ArrowIfStatement, [{
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

        var _this15 = _possibleConstructorReturn(this, Object.getPrototypeOf(IfElseStatement).call(this, cond, branch));

        var txt = new TextExpr('else');
        txt.color = 'black';
        _this15.addArg(txt);
        _this15.addArg(elseBranch);
        return _this15;
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

// A boolean compare function like ==, !=, >, >=, <=, <.


var CompareExpr = function (_Expression6) {
    _inherits(CompareExpr, _Expression6);

    _createClass(CompareExpr, null, [{
        key: 'operatorMap',
        value: function operatorMap() {
            return { '==': 'is', '!=': '≠' };
        }
    }, {
        key: 'textForFuncName',
        value: function textForFuncName(fname) {
            var map = CompareExpr.operatorMap();
            if (fname in map) return map[fname];else return fname;
        }
    }]);

    function CompareExpr(b1, b2) {
        var compareFuncName = arguments.length <= 2 || arguments[2] === undefined ? '==' : arguments[2];

        _classCallCheck(this, CompareExpr);

        var compare_text = new TextExpr(CompareExpr.textForFuncName(compareFuncName));
        compare_text.color = 'black';

        var _this16 = _possibleConstructorReturn(this, Object.getPrototypeOf(CompareExpr).call(this, [b1, compare_text, b2]));

        _this16.funcName = compareFuncName;
        _this16.color = "HotPink";
        _this16.padding = { left: 20, inner: 10, right: 30 };
        return _this16;
    }

    _createClass(CompareExpr, [{
        key: 'onmouseclick',
        value: function onmouseclick(pos) {
            console.log('Expressions are equal: ', this.compare());
            this.performReduction();
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            var cmp = this.compare();
            if (cmp === true) return new TrueExpr();else if (cmp === false) return new FalseExpr();else return this;
        }
    }, {
        key: 'performReduction',
        value: function performReduction() {
            var _this17 = this;

            if (this.reduce() != this) {
                var shatter = new ShatterExpressionEffect(this);
                shatter.run(stage, function () {
                    _get(Object.getPrototypeOf(CompareExpr.prototype), 'performReduction', _this17).call(_this17);
                }.bind(this));
            }
        }
    }, {
        key: 'compare',
        value: function compare() {
            if (this.funcName === '==') {
                var lval = this.leftExpr.value();
                var rval = this.rightExpr.value();
                console.log('leftexpr', this.leftExpr.constructor.name, lval);
                console.log('rightexpr', this.rightExpr.constructor.name, rval);
                if (lval === undefined || rval === undefined) return undefined;else if (Array.isArray(lval) && Array.isArray(rval)) return setCompare(lval, rval, function (e, f) {
                    return e.toString() === f.toString();
                });else return lval === rval;
            } else if (this.funcName === '!=') {
                return this.leftExpr.value() !== this.rightExpr.value();
            } else {
                console.warn('Compare function "' + this.funcName + '" not implemented.');
                return false;
            }
        }
    }, {
        key: 'drawInternal',
        value: function drawInternal(pos, boundingSize) {
            this.ctx.fillStyle = 'black';
            setStrokeStyle(this.ctx, this.stroke);
            if (this.shadowOffset !== 0) {
                hexaRect(this.ctx, pos.x, pos.y + this.shadowOffset, boundingSize.w, boundingSize.h, true, this.stroke ? true : false); // just fill for now
            }
            this.ctx.fillStyle = this.color;
            hexaRect(this.ctx, pos.x, pos.y, boundingSize.w, boundingSize.h, true, this.stroke ? true : false); // just fill for now
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '(' + this.funcName + ' ' + this.leftExpr.toString() + ' ' + this.rightExpr.toString() + ')';
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
        key: 'rightExpr',
        get: function get() {
            return this.holes[2];
        }
    }]);

    return CompareExpr;
}(Expression);

// Integers


var NumberExpr = function (_Expression7) {
    _inherits(NumberExpr, _Expression7);

    function NumberExpr(num) {
        _classCallCheck(this, NumberExpr);

        var _this18 = _possibleConstructorReturn(this, Object.getPrototypeOf(NumberExpr).call(this, [new DiceNumber(num)]));

        _this18.number = num;
        _this18.color = 'Ivory';
        _this18.highlightColor = 'OrangeRed';
        return _this18;
    }

    _createClass(NumberExpr, [{
        key: 'value',
        value: function value() {
            return this.number;
        }
    }, {
        key: 'toString',
        value: function toString() {
            return this.number.toString();
        }
    }, {
        key: 'constructorArgs',
        get: function get() {
            return [this.number];
        }
    }]);

    return NumberExpr;
}(Expression);
// Draws the circles for a dice number inside its boundary.


var DiceNumber = function (_Rect) {
    _inherits(DiceNumber, _Rect);

    _createClass(DiceNumber, null, [{
        key: 'drawPositionsFor',
        value: function drawPositionsFor(num) {
            var L = 0.15;
            var T = L;
            var R = 1.0 - L;
            var B = R;
            var M = 0.5;
            var map = {
                0: [],
                1: [{ x: M, y: M }],
                2: [{ x: L, y: T }, { x: R, y: B }],
                3: [{ x: R, y: T }, { x: M, y: M }, { x: L, y: B }],
                4: [{ x: L, y: T }, { x: R, y: T }, { x: R, y: B }, { x: L, y: B }],
                5: [{ x: L, y: T }, { x: R, y: T }, { x: R, y: B }, { x: L, y: B }, { x: M, y: M }],
                6: [{ x: L, y: T }, { x: R, y: T }, { x: R, y: M }, { x: R, y: B }, { x: L, y: B }, { x: L, y: M }]
            };
            if (num in map) return map[num];else {
                console.error('Dice pos array does not exist for number ' + num + '.');
                return [];
            }
        }
    }]);

    function DiceNumber(num) {
        var radius = arguments.length <= 1 || arguments[1] === undefined ? 6 : arguments[1];

        _classCallCheck(this, DiceNumber);

        var _this19 = _possibleConstructorReturn(this, Object.getPrototypeOf(DiceNumber).call(this, 0, 0, 44, 44));

        _this19.number = num;
        _this19.circlePos = DiceNumber.drawPositionsFor(num);
        _this19.radius = radius;
        _this19.color = 'black';
        return _this19;
    }

    _createClass(DiceNumber, [{
        key: 'hits',
        value: function hits(pos, options) {
            return false;
        }
    }, {
        key: 'drawInternal',
        value: function drawInternal(pos, boundingSize) {
            var _this20 = this;

            if (this.circlePos && this.circlePos.length > 0) {
                (function () {

                    var ctx = _this20.ctx;
                    var rad = _this20.radius * boundingSize.w / _this20.size.w;
                    var fill = _this20.color;
                    var stroke = _this20.stroke;
                    _this20.circlePos.forEach(function (relpos) {
                        var drawpos = { x: pos.x + boundingSize.w * relpos.x - rad, y: pos.y + boundingSize.h * relpos.y - rad };
                        drawCircle(ctx, drawpos.x, drawpos.y, rad, fill, stroke);
                    });
                })();
            }
        }
    }, {
        key: 'constructorArgs',
        get: function get() {
            return [this.number, this.radius];
        }
    }]);

    return DiceNumber;
}(Rect);

// Wrapper class to make arbitrary nodes into draggable expressions.


var VarExpr = function (_Expression8) {
    _inherits(VarExpr, _Expression8);

    function VarExpr(graphic_node) {
        _classCallCheck(this, VarExpr);

        var _this21 = _possibleConstructorReturn(this, Object.getPrototypeOf(VarExpr).call(this, [graphic_node]));

        _this21.color = 'gold';
        return _this21;
    }

    _createClass(VarExpr, [{
        key: 'reduceCompletely',
        value: function reduceCompletely() {
            return this;
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            return this;
        }

        //get size() { return this.holes[0].size; }

    }, {
        key: 'hits',
        value: function hits(pos, options) {
            if (this.ignoreEvents) return null;
            if (this.holes[0].hits(pos, options)) return this;else return null;
        }
    }, {
        key: 'onmouseenter',
        value: function onmouseenter(pos) {
            if (this.delegateToInner) this.holes[0].onmouseenter(pos);else _get(Object.getPrototypeOf(VarExpr.prototype), 'onmouseenter', this).call(this, pos);
        }
    }, {
        key: 'onmouseleave',
        value: function onmouseleave(pos) {
            if (!this.delegateToInner) _get(Object.getPrototypeOf(VarExpr.prototype), 'onmouseleave', this).call(this, pos);
            this.holes[0].onmouseleave(pos);
        }
    }, {
        key: 'drawInternal',
        value: function drawInternal(pos, boundingSize) {
            if (!this.delegateToInner) {
                this._color = '#777';
                _get(Object.getPrototypeOf(VarExpr.prototype), 'drawInternal', this).call(this, pos, boundingSize);
            }
        }
    }, {
        key: 'value',
        value: function value() {
            return this.holes[0].value();
        }
    }, {
        key: 'color',
        get: function get() {
            return _get(Object.getPrototypeOf(VarExpr.prototype), 'color', this);
        },
        set: function set(clr) {
            this.holes[0].color = clr;
        }
    }, {
        key: 'delegateToInner',
        get: function get() {
            return this.ignoreEvents || !this.parent || !(this.parent instanceof Expression);
        }
    }, {
        key: 'graphicNode',
        get: function get() {
            return this.holes[0];
        }
    }]);

    return VarExpr;
}(Expression);

var StarExpr = function (_VarExpr) {
    _inherits(StarExpr, _VarExpr);

    function StarExpr(x, y, rad) {
        var pts = arguments.length <= 3 || arguments[3] === undefined ? 5 : arguments[3];

        _classCallCheck(this, StarExpr);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(StarExpr).call(this, new Star(x, y, rad, pts)));
    }

    _createClass(StarExpr, [{
        key: 'toString',
        value: function toString() {
            return 'star';
        }
    }]);

    return StarExpr;
}(VarExpr);

var CircleExpr = function (_VarExpr2) {
    _inherits(CircleExpr, _VarExpr2);

    function CircleExpr(x, y, rad) {
        _classCallCheck(this, CircleExpr);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(CircleExpr).call(this, new Circle(x, y, rad)));
    }

    _createClass(CircleExpr, [{
        key: 'toString',
        value: function toString() {
            return 'circle';
        }
    }]);

    return CircleExpr;
}(VarExpr);

var PipeExpr = function (_VarExpr3) {
    _inherits(PipeExpr, _VarExpr3);

    function PipeExpr(x, y, w, h) {
        _classCallCheck(this, PipeExpr);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(PipeExpr).call(this, new Pipe(x, y, w, h - 12)));
    }

    _createClass(PipeExpr, [{
        key: 'toString',
        value: function toString() {
            return 'pipe';
        }
    }]);

    return PipeExpr;
}(VarExpr);

var TriangleExpr = function (_VarExpr4) {
    _inherits(TriangleExpr, _VarExpr4);

    function TriangleExpr(x, y, w, h) {
        _classCallCheck(this, TriangleExpr);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(TriangleExpr).call(this, new Triangle(x, y, w, h)));
    }

    _createClass(TriangleExpr, [{
        key: 'toString',
        value: function toString() {
            return 'triangle';
        }
    }]);

    return TriangleExpr;
}(VarExpr);

var RectExpr = function (_VarExpr5) {
    _inherits(RectExpr, _VarExpr5);

    function RectExpr(x, y, w, h) {
        _classCallCheck(this, RectExpr);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(RectExpr).call(this, new Rect(x, y, w, h)));
    }

    _createClass(RectExpr, [{
        key: 'toString',
        value: function toString() {
            return 'diamond';
        }
    }]);

    return RectExpr;
}(VarExpr);

var ImageExpr = function (_VarExpr6) {
    _inherits(ImageExpr, _VarExpr6);

    function ImageExpr(x, y, w, h, resource_key) {
        _classCallCheck(this, ImageExpr);

        var _this27 = _possibleConstructorReturn(this, Object.getPrototypeOf(ImageExpr).call(this, new ImageRect(x, y, w, h, resource_key)));

        _this27._image = resource_key;
        return _this27;
    }

    _createClass(ImageExpr, [{
        key: 'toString',
        value: function toString() {
            return this._image;
        }
    }, {
        key: 'image',
        get: function get() {
            return this._image;
        },
        set: function set(img) {
            this._image = img;
            this.graphicNode.image = img;
        }
    }]);

    return ImageExpr;
}(VarExpr);

var NullExpr = function (_ImageExpr) {
    _inherits(NullExpr, _ImageExpr);

    function NullExpr(x, y, w, h) {
        _classCallCheck(this, NullExpr);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(NullExpr).call(this, x, y, w, h, 'null-circle'));
    }

    _createClass(NullExpr, [{
        key: 'reduce',
        value: function reduce() {
            return null; // hmmmm
        }
    }, {
        key: 'performReduction',
        value: function performReduction() {
            Animate.poof(this);
            _get(Object.getPrototypeOf(NullExpr.prototype), 'performReduction', this).call(this);
        }
    }, {
        key: 'onmousehover',
        value: function onmousehover() {
            this.image = 'null-circle-highlight';
        }
    }, {
        key: 'onmouseleave',
        value: function onmouseleave() {
            this.image = 'null-circle';
        }
    }, {
        key: 'onmouseclick',
        value: function onmouseclick() {
            this.performReduction();
        }
    }, {
        key: 'toString',
        value: function toString() {
            return 'null';
        }
    }, {
        key: 'value',
        value: function value() {
            return null;
        }
    }]);

    return NullExpr;
}(ImageExpr);

/** Collections */


var PutExpr = function (_Expression9) {
    _inherits(PutExpr, _Expression9);

    function PutExpr(item, collection) {
        _classCallCheck(this, PutExpr);

        var txt_put = new TextExpr('put');
        var txt_in = new TextExpr('in');
        txt_put.color = 'black';
        txt_in.color = 'black';

        var _this29 = _possibleConstructorReturn(this, Object.getPrototypeOf(PutExpr).call(this, [txt_put, item, txt_in, collection]));

        _this29.color = 'violet';
        return _this29;
    }

    _createClass(PutExpr, [{
        key: 'onmouseclick',
        value: function onmouseclick() {
            this.performReduction();
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            if (!this.item || !this.collection || this.item instanceof MissingExpression || this.item instanceof LambdaVarExpr || // You can't put a pipe into a bag with PUT; it's confusing...
            this.collection instanceof MissingExpression) return this;else if (!(this.collection instanceof CollectionExpr)) {
                console.error('@ PutExpr.reduce: Input is not a Collection.', this.collection);
                return this;
            } else {
                var new_coll = this.collection.clone();
                new_coll.addItem(this.item.clone()); // add item to bag
                return new_coll; // return new bag with item appended
            }
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '(put ' + this.item.toString() + ' ' + this.collection.toString() + ')';
        }
    }, {
        key: 'item',
        get: function get() {
            return this.holes[1];
        }
    }, {
        key: 'collection',
        get: function get() {
            return this.holes[3];
        }
    }, {
        key: 'constructorArgs',
        get: function get() {
            return [this.item.clone(), this.collection.clone()];
        }
    }]);

    return PutExpr;
}(Expression);

var PopExpr = function (_Expression10) {
    _inherits(PopExpr, _Expression10);

    function PopExpr(collection) {
        _classCallCheck(this, PopExpr);

        var txt_pop = new TextExpr('pop');
        txt_pop.color = 'black';

        var _this30 = _possibleConstructorReturn(this, Object.getPrototypeOf(PopExpr).call(this, [txt_pop, collection]));

        _this30.color = 'violet';
        return _this30;
    }

    _createClass(PopExpr, [{
        key: 'onmouseclick',
        value: function onmouseclick() {
            this.performReduction();
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            if (!this.collection || this.collection instanceof MissingExpression) return this;else {
                var item = this.collection.items[0].clone();
                return item;
            }
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '(pop ' + this.collection.toString() + ')';
        }
    }, {
        key: 'collection',
        get: function get() {
            return this.holes[1];
        }
    }, {
        key: 'constructorArgs',
        get: function get() {
            return [this.collection.clone()];
        }
    }]);

    return PopExpr;
}(Expression);

// Analogous to 'define' in Scheme.


var DefineExpr = function (_Expression11) {
    _inherits(DefineExpr, _Expression11);

    function DefineExpr(expr) {
        _classCallCheck(this, DefineExpr);

        var txt_define = new TextExpr('define');
        txt_define.color = 'black';

        var _this31 = _possibleConstructorReturn(this, Object.getPrototypeOf(DefineExpr).call(this, [txt_define, expr]));

        _this31.color = 'OrangeRed';
        return _this31;
    }

    _createClass(DefineExpr, [{
        key: 'onmouseclick',
        value: function onmouseclick() {
            this.performReduction();
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            if (!this.expr || this.expr instanceof MissingExpression) return this;else {

                // For now, prompt the user for a function name:
                var funcname = window.prompt("What do you want to call it?", "foo");
                if (funcname) {
                    funcname = funcname.trim(); // remove trailing whitespace

                    // Check that name has no spaces etc...
                    if (funcname.indexOf(/\s+/g) === -1) {

                        var args = [];
                        var numargs = 0;
                        if (this.expr instanceof LambdaExpr) numargs = this.expr.numOfNestedLambdas();
                        for (var i = 0; i < numargs; i++) {
                            args.push(new MissingExpression());
                        } // Return named function (expression).
                        return new NamedExpr(funcname, this.expr.clone(), args);
                    } else {
                        window.alert("Name can't have spaces. Try again with something simpler."); // cancel
                    }
                }

                return this; // cancel
            }
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '(define ' + this.expr.toString() + ')';
        }
    }, {
        key: 'expr',
        get: function get() {
            return this.holes[1];
        }
    }, {
        key: 'constructorArgs',
        get: function get() {
            return [this.expr.clone()];
        }
    }]);

    return DefineExpr;
}(Expression);

// Acts as a named wrapper for a def'd expression.


var NamedExpr = function (_Expression12) {
    _inherits(NamedExpr, _Expression12);

    function NamedExpr(name, expr, args) {
        _classCallCheck(this, NamedExpr);

        var txt_name = new TextExpr(name);
        txt_name.color = 'black';
        var exprs = [txt_name];
        for (var i = 0; i < args.length; i++) {
            exprs.push(args[i].clone());
        }
        var _this32 = _possibleConstructorReturn(this, Object.getPrototypeOf(NamedExpr).call(this, exprs));

        _this32.color = 'orange';
        _this32.name = name;
        _this32._args = args.map(function (a) {
            return a.clone();
        });
        _this32._wrapped_expr = expr;
        return _this32;
    }

    _createClass(NamedExpr, [{
        key: 'onmouseclick',
        value: function onmouseclick() {
            this.performReduction();
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            if (!this.expr || this.expr instanceof MissingExpression) return this;else {

                // This should 'reduce' by applying the arguments to the wrapped expression.
                // First, let's check that we HAVE arguments...
                var isValidArgument = function isValidArgument(a) {
                    return a && a instanceof Expression && !(a instanceof MissingExpression);
                };
                var validateAll = function validateAll(arr, testfunc) {
                    return arr.reduce(function (prev, x) {
                        return prev && testfunc(x);
                    }, true);
                };
                var args = this.args;
                if (args.length === 0 || validateAll(args, isValidArgument)) {
                    // true if all args valid

                    // All the arguments check out. Now we need to apply them.
                    var expr = this.expr;
                    if (args.length > 0) expr = args.reduce(function (lambdaExpr, arg) {
                        return lambdaExpr.applyExpr(arg);
                    }, expr); // Chains application to inner lambda expressions.

                    return expr.clone(); // to be safe we'll clone it.
                }
            }

            return this;
        }

        // Whoa... meta.

    }, {
        key: 'toString',
        value: function toString() {
            var s = '(' + name; // e.g. '(length'
            var args = this.args;
            for (var i = 0; i < args.length; i++) {
                s += ' ' + args[i].toString();
            }s += ')';
            return s;
        }
    }, {
        key: 'expr',
        get: function get() {
            return this._wrapped_expr.clone();
        }
    }, {
        key: 'args',
        get: function get() {
            return this.holes.slice(1).map(function (a) {
                return a.clone();
            });
        }
    }, {
        key: 'constructorArgs',
        get: function get() {
            return [this.name, this.expr.clone(), this.args];
        }
    }]);

    return NamedExpr;
}(Expression);

var CollectionExpr = function (_VarExpr7) {
    _inherits(CollectionExpr, _VarExpr7);

    function CollectionExpr() {
        _classCallCheck(this, CollectionExpr);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(CollectionExpr).apply(this, arguments));
    }

    return CollectionExpr;
}(VarExpr);

var BagExpr = function (_CollectionExpr) {
    _inherits(BagExpr, _CollectionExpr);

    function BagExpr(x, y, w, h) {
        var holding = arguments.length <= 4 || arguments[4] === undefined ? [] : arguments[4];

        _classCallCheck(this, BagExpr);

        //super(new Bag(x, y, w, h));
        var radius = (w + h) / 4.0;

        var _this34 = _possibleConstructorReturn(this, Object.getPrototypeOf(BagExpr).call(this, new Bag(x, y, radius)));

        _this34._items = holding;
        _this34.bigScale = 4;
        _this34.graphicNode.color = 'tan';
        _this34.graphicNode.anchor = { x: 0.5, y: 0.5 };
        //this.graphicNode.clipChildren = true;
        //this.graphicNode.clipBackground = 'bag-background';
        _this34.anchor = { x: 0.5, y: 0.5 };
        return _this34;
    }

    _createClass(BagExpr, [{
        key: 'arrangeNicely',
        value: function arrangeNicely() {
            var _this35 = this;

            var dotpos = DiceNumber.drawPositionsFor(this.items.length);
            if (dotpos.length > 0) {
                (function () {
                    // Arrange items according to dot positions.
                    var sz = _this35.graphicNode.size;
                    var topsz = _this35.graphicNode.topSize(sz.w / 2.0);
                    _this35.graphicNode.children.slice(1).forEach(function (e, idx) {
                        e.pos = { x: dotpos[idx].x * sz.w * 0.4 + topsz.w / 3.4, y: dotpos[idx].y * sz.h * 0.4 + topsz.h * 1.9 };
                    });
                })();
            }
        }
    }, {
        key: 'lock',
        value: function lock() {
            _get(Object.getPrototypeOf(BagExpr.prototype), 'lock', this).call(this);
            this.graphicNode.shadowOffset = this.shadowOffset;
        }
    }, {
        key: 'unlock',
        value: function unlock() {
            _get(Object.getPrototypeOf(BagExpr.prototype), 'unlock', this).call(this);
            this.graphicNode.shadowOffset = this.shadowOffset;
        }
    }, {
        key: 'addItem',


        // Adds an item to the bag.
        value: function addItem(item) {
            var scale = 1.0 / this.bigScale;
            var center = this.graphicNode.size.w / 2.0;
            var x = (item.pos.x - this.pos.x) / (1.0 / scale) + center + item.size.w / 2.0 * scale;
            var y = (item.pos.y - this.pos.y) / (1.0 / scale) + center + item.size.h / 2.0 * scale;
            item.pos = { x: x, y: y };
            item.anchor = { x: 0.5, y: 0.5 };
            item.scale = { x: scale, y: scale };
            item.onmouseleave();
            this._items.push(item);
            this.graphicNode.addItem(item);

            this.arrangeNicely();

            //Resource.play('pop');
            Resource.play('bag-addItem');
        }

        // Removes an item from the bag and returns it.

    }, {
        key: 'popItem',
        value: function popItem() {
            var _this36 = this;

            var item = this._items.pop();
            this.graphicNode.removeAllItems();
            this._items.forEach(function (item) {
                _this36.graphicNode.addItem(item);
            });
            return item;
        }

        // Applies a lambda function over every item in the bag and
        // returns a new bag containing the new items.

    }, {
        key: 'map',
        value: function map(lambdaExpr) {
            var _this37 = this;

            if (!(lambdaExpr instanceof LambdaExpr) || !lambdaExpr.takesArgument) {
                console.error('@ BagExpr.applyFunc: Func expr does not take argument.');
                return undefined;
            }
            var bag = this.clone();
            bag.graphicNode.children = [bag.graphicNode.children[0]];
            var items = bag.items;
            bag.items = [];
            var new_items = [];
            items.forEach(function (item) {
                var c = item.clone();
                var pos = item.pos;
                var func = lambdaExpr.clone();
                _this37.stage.add(func);
                func.update();
                var new_funcs = func.applyExpr(c);
                if (!Array.isArray(new_funcs)) new_funcs = [new_funcs];

                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = new_funcs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var new_func = _step2.value;

                        _this37.stage.remove(new_func);
                        new_func.pos = pos;
                        new_func.unlockSubexpressions();
                        new_func.lockSubexpressions(function (expr) {
                            return expr instanceof VarExpr || expr instanceof BooleanPrimitive;
                        }); // lock primitives
                        bag.addItem(new_func);
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
            });
            //bag.items = new_items;
            return bag;
        }

        // Spills the entire bag onto the play field.

    }, {
        key: 'spill',
        value: function spill() {
            var _this38 = this;

            if (!this.stage) {
                console.error('@ BagExpr.spill: Bag is not attached to a Stage.');
                return;
            } else if (this.parent) {
                console.error('@ BagExpr.spill: Cannot spill a bag while it\'s inside of another expression.');
                return;
            }

            var stage = this.stage;
            var items = this.items;
            var pos = this.pos;

            // GAME DESIGN CHOICE:
            // Remove the bag from the stage.
            // stage.remove(this);

            // Add back all of this bags' items to the stage.
            items.forEach(function (item, index) {
                item = item.clone();
                var theta = index / items.length * Math.PI * 2;
                var rad = _this38.size.w * 1.5;
                var targetPos = addPos(pos, { x: rad * Math.cos(theta), y: rad * Math.sin(theta) });
                item.pos = pos;
                Animate.tween(item, { 'pos': targetPos }, 100, function (elapsed) {
                    return Math.pow(elapsed, 0.5);
                });
                //item.pos = addPos(pos, { x:rad*Math.cos(theta), y:rad*Math.sin(theta) });
                item.parent = null;
                _this38.graphicNode.removeItem(item);
                item.scale = { x: 1, y: 1 };
                stage.add(item);
            });

            // Set the items in the bag back to nothing.
            this.items = [];
            this.graphicNode.removeAllItems(); // just to be sure!
            console.warn(this.graphicNode);

            // Play spill sfx
            Resource.play('bag-spill');
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            return this; // collections do not reduce!
        }
    }, {
        key: 'reduceCompletely',
        value: function reduceCompletely() {
            return this;
        }
    }, {
        key: 'clone',
        value: function clone() {
            var c = _get(Object.getPrototypeOf(BagExpr.prototype), 'clone', this).call(this);
            c._items = this.items;
            return c;
        }
    }, {
        key: 'value',
        value: function value() {
            return this.items.slice(); // Arguably should be toString of each expression, but then comparison must be setCompare.
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '(bag' + this.items.reduce(function (str, curr) {
                return str += ' ' + curr.toString();
            }, '') + ')';
        }
    }, {
        key: 'onmouseclick',
        value: function onmouseclick(pos) {
            this.spill();
        }
    }, {
        key: 'ondropenter',
        value: function ondropenter(node, pos) {

            if (this._tween) this._tween.cancel();
            if (this.parent) return;

            if (this.stage) {
                var _pos = this.pos;
                _pos.x -= (this.anchor.x - 0.5) * this.size.w;
                _pos.y -= (this.anchor.y - 0.5) * this.size.h;
                this.pos = _pos;
                this.anchor = { x: 0.5, y: 0.5 };
            }
            this._beforeScale = this.graphicNode.scale;
            var targetScale = { x: this.bigScale, y: this.bigScale };
            this._tween = Animate.tween(this.graphicNode, { 'scale': targetScale }, 600, function (elapsed) {
                return Math.pow(elapsed, 0.25);
            });
            this.onmouseenter(pos);

            //if (this.stage) this.stage.draw();
        }
    }, {
        key: 'ondropexit',
        value: function ondropexit(node, pos) {

            if (this.parent) return;

            this._tween.cancel();
            this._tween = Animate.tween(this.graphicNode, { 'scale': this._beforeScale }, 100, function (elapsed) {
                return Math.pow(elapsed, 0.25);
            });
            this.onmouseleave(pos);
        }
    }, {
        key: 'ondropped',
        value: function ondropped(node, pos) {
            this.ondropexit(node, pos);

            if (this.parent) return;

            if (!(node instanceof Expression)) {
                console.error('@ BagExpr.ondropped: Dropped node is not an Expression.', node);
                return;
            } else if (!node.stage) {
                console.error('@ BagExpr.ondropped: Dropped node is not attached to a Stage.', node);
                return;
            } else if (node.parent) {
                console.error('@ BagExpr.ondropped: Dropped node has a parent expression.', node);
                return;
            }

            // Remove node from the stage:
            var stage = node.stage;
            stage.remove(node);

            // Dump clone of node into the bag:
            var n = node.clone();
            n.pos.x = 100; //(n.absolutePos.x - this.graphicNode.absolutePos.x + this.graphicNode.absoluteSize.w / 2.0) / this.graphicNode.absoluteSize.w;
            this.addItem(n);
        }
    }, {
        key: 'items',
        get: function get() {
            return this._items.slice();
        },
        set: function set(items) {
            var _this39 = this;

            this._items.forEach(function (item) {
                return _this39.graphicNode.removeItem(item);
            });
            this._items = [];
            items.forEach(function (item) {
                _this39.addItem(item);
            });
        }
    }, {
        key: 'delegateToInner',
        get: function get() {
            return true;
        }
    }]);

    return BagExpr;
}(CollectionExpr);

var CountExpr = function (_Expression13) {
    _inherits(CountExpr, _Expression13);

    function CountExpr(collectionExpr) {
        _classCallCheck(this, CountExpr);

        if (typeof collectionExpr === 'undefined') {
            collectionExpr = new MissingExpression();
            collectionExpr.color = 'lightgray';
        }
        var txt = new TextExpr('count');

        var _this40 = _possibleConstructorReturn(this, Object.getPrototypeOf(CountExpr).call(this, [txt, collectionExpr]));

        _this40.color = 'DarkTurquoise';
        txt.color = 'white';
        return _this40;
    }

    _createClass(CountExpr, [{
        key: 'onmouseclick',
        value: function onmouseclick() {
            this.performReduction();
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            console.log(this.holes[1]);
            if (this.holes[1] instanceof MissingExpression) return this;else if (this.holes[1] instanceof BagExpr) return [new NumberExpr(this.holes[1].items.length), this.holes[1]];else return this;
        }
    }]);

    return CountExpr;
}(Expression);

// A while loop.
/* OLD -- class WhileLoop extends IfStatement {
    reduce() {
        if (!this.cond || !this.branch) return this; // irreducible
        else if (this.cond.value()) {
            this.branch.execute();
            return this; // step the branch, then return the same loop (irreducible)
        }
        else return this.emptyExpr;
    }
}

// A boolean expression. Can && or || or !.
class BooleanExpr extends Expression {
    constructor(b1, b2) {
        super(b1 || b2 ? [b1, b2] : [new TrueExpr(), new TrueExpr()]);
        this.OPTYPE = { AND:0, OR:1, NOT:2 };
        this.op = this.OPTYPE.AND;
    }

    // Change these when you subclass.
    get trueExpr() { return new TrueExpr(); }
    get falseExpr() { return new FalseExpr(); }

    // Reduces to TrueExpr or FalseExpr
    reduce() {
        var v = this.value();
        if (v) return this.trueExpr;
        else   return this.falseExpr;
    }

    value() {
        switch (this.op) {
            case this.OPTYPE.AND:
                return b1.value() && b2.value();
            case this.OPTYPE.OR:
                return b1.value() || b2.value();
            case this.OPTYPE.NOT:
                return !b1.value(); }
        console.error('Invalid optype.');
        return false;
    }
}*/