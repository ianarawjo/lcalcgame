'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/** Foundation of all other expressions in Reduct.
 *	@module expression
 */

var EMPTY_EXPR_WIDTH = 50;
var DEFAULT_EXPR_HEIGHT = 50;
var DEFAULT_CORNER_RAD = 20;
var DEFAULT_SUBEXPR_SCALE = 0.85;
var DEFAULT_RENDER_CTX = null;

/** A generic expression. Could be a lambda expression, could be an if statement, could be a for.
    In general, anything that takes in arguments and can reduce to some other value based on those arguments. */

var Expression = function (_mag$RoundedRect) {
    _inherits(Expression, _mag$RoundedRect);

    function Expression() {
        var holes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

        _classCallCheck(this, Expression);

        var _this2 = _possibleConstructorReturn(this, (Expression.__proto__ || Object.getPrototypeOf(Expression)).call(this, 0, 0, EMPTY_EXPR_WIDTH, DEFAULT_EXPR_HEIGHT, DEFAULT_CORNER_RAD));

        _this2.holes = holes;
        _this2.padding = { left: 10, inner: 10, right: 10 };
        _this2._size = { w: EMPTY_EXPR_WIDTH, h: DEFAULT_EXPR_HEIGHT };
        _this2.environment = null;
        _this2._layout = { 'direction': 'horizontal', 'align': 'vertical' };
        _this2.lockedInteraction = false;
        _this2._subexpScale = DEFAULT_SUBEXPR_SCALE;
        _this2._reducing = false;
        _this2.ignoreAutoResize = false;
        _this2.forceReducibilityIndicator = false;

        if (_this2.holes) {
            var _this = _this2;
            _this2.holes.forEach(function (hole) {
                _this.addChild(hole);
            });
        }

        // DEBUG
        //this.forceTypingOnFill = true;
        //this.stroke = { color:'magenta', lineWidth:4 };
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
            var parent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

            var c = _get(Expression.prototype.__proto__ || Object.getPrototypeOf(Expression.prototype), 'clone', this).call(this, parent);
            var children = c.children;
            var holes = c.holes;
            c.children = [];
            c.holes = [];
            c.stroke = null;
            c.toolbox = null;
            children.forEach(function (child) {
                return c.addArg(child);
            });
            //c.holes = [];
            //holes.forEach((hole) => c.addHole(hole));
            return c;
        }

        // Makes all inner expressions undraggable, 'binding' them permanently.

    }, {
        key: 'bindSubexpressions',
        value: function bindSubexpressions() {
            this.holes.forEach(function (hole) {
                if (hole instanceof Expression && !(hole instanceof MissingExpression)) {
                    if (hole instanceof ValueExpr || hole instanceof BooleanPrimitive) hole.lock();
                    hole.bindSubexpressions();
                }
            });
        }

        // Repel dropped nodes.

    }, {
        key: 'ondropped',
        value: function ondropped(node, pos) {
            if (node.pos.y > this.absolutePos.y) Animate.tween(node, { pos: { x: node.pos.x, y: this.centerPos().y + this.absoluteSize.h * 1.2 } }, 160, function (e) {
                return Math.pow(e, 0.5);
            });else Animate.tween(node, { pos: { x: node.pos.x, y: this.centerPos().y - this.absoluteSize.h * 1.2 } }, 160, function (e) {
                return Math.pow(e, 0.5);
            });
            _get(Expression.prototype.__proto__ || Object.getPrototypeOf(Expression.prototype), 'ondropped', this).call(this, node, pos);
        }
    }, {
        key: 'addHole',
        value: function addHole(hole) {
            this.holes.push(hole);
        }
    }, {
        key: 'addArg',
        value: function addArg(arg) {
            this.holes.push(arg);
            this.addChild(arg);
        }
    }, {
        key: 'insertArg',
        value: function insertArg(idx, arg) {
            this.holes.splice(idx, 0, arg);
            this.update();
        }
    }, {
        key: 'removeArg',
        value: function removeArg(arg) {
            var idx = this.holes.indexOf(arg);
            if (idx > -1) {
                this.holes.splice(idx, 1); // remove 1 elem @ idx
                this.update();
            } else console.error('@ removeArg: Could not find arg ', arg, ' in expression.');
        }
    }, {
        key: 'swap',
        value: function swap(arg, anotherArg) {
            if (!arg || anotherArg === undefined) return;
            var i = this.holes.indexOf(arg);

            if (i > -1) {

                if (anotherArg === null) {
                    arg.detach();
                    this.holes[i]._size = { w: 50, h: 50 };
                    arg.stage.remove(arg);
                } else {

                    this.holes.splice(i, 1, anotherArg);

                    if (anotherArg) {
                        anotherArg.pos = arg.pos;
                        anotherArg.dragging = false;
                        anotherArg.parent = this;
                        anotherArg.scale = { x: this._subexpScale, y: this._subexpScale };
                        anotherArg.onmouseleave();
                        anotherArg.onmouseup();
                    }

                    arg.parent = null;
                }
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
                size.h *= expr.scale.y;
                sizes.push(size);
            });
            return sizes;
        }
    }, {
        key: 'update',
        value: function update() {
            var _this3 = this;

            var _this = this;
            this.children = [];

            this.holes.forEach(function (expr) {
                return _this.addChild(expr);
            });
            // In the centering calculation below, we need this expr's
            // size to be stable. So we first set the scale on our
            // children, then compute our size once to lay out the
            // children.
            this.holes.forEach(function (expr) {
                expr.anchor = { x: 0, y: 0.5 };
                expr.scale = { x: _this._subexpScale, y: _this._subexpScale };
                expr.update();
            });
            var size = this.size;
            var padding = this.padding.inner;
            var x = this.padding.left;
            var y = this.size.h / 2.0 + (this.exprOffsetY ? this.exprOffsetY : 0);
            if (this._layout.direction == "vertical") {
                y = padding;
            }

            this.holes.forEach(function (expr) {
                // Update hole expression positions.
                expr.anchor = { x: 0, y: 0.5 };
                expr.pos = { x: x, y: y };
                expr.scale = { x: _this._subexpScale, y: _this._subexpScale };
                expr.update();

                if (_this3._layout.direction == "vertical") {
                    y += expr.anchor.y * expr.size.h * expr.scale.y;
                    var offset = x;

                    // Centering
                    if (_this3._layout.align == "horizontal") {
                        var innerWidth = size.w;
                        var scale = expr.scale.x;
                        offset = (innerWidth - scale * expr.size.w) / 2;
                    }

                    expr.pos = { x: offset, y: y };

                    y += (1 - expr.anchor.y) * expr.size.h * expr.scale.y;
                    if (_this3.padding.between) y += _this3.padding.between;
                } else {
                    x += expr.size.w * expr.scale.x + padding;
                }
            });

            this.children = this.holes; // for rendering

            this.updateReducibilityIndicator();
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


        // Get the containing environment for this expression

    }, {
        key: 'getEnvironment',
        value: function getEnvironment() {
            if (this.environment) return this.environment;

            if (this.parent) {
                var current = this.parent;
                while (current && !current.getEnvironment) {
                    current = current.parent;
                }if (current.getEnvironment) return current.getEnvironment();
            }

            if (this.stage) return this.stage.environment;

            return null;
        }

        // Can this expression step to a value?

    }, {
        key: 'canReduce',
        value: function canReduce() {
            return false;
        }

        // Is this expression already a value?

    }, {
        key: 'isValue',
        value: function isValue() {
            return false;
        }

        // Is this expression missing any subexpressions?

    }, {
        key: 'isComplete',
        value: function isComplete() {
            if (this.isPlaceholder()) return false;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.holes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var child = _step.value;

                    if (child instanceof Expression && !child.isComplete()) {
                        return false;
                    }
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

            return true;
        }

        // Is this expression a placeholder for something else?

    }, {
        key: 'isPlaceholder',
        value: function isPlaceholder() {
            return false;
        }

        // Play an animation to remind the user that this is a placeholder.

    }, {
        key: 'animatePlaceholderStatus',
        value: function animatePlaceholderStatus() {
            Animate.blink(this);
        }
    }, {
        key: 'hasPlaceholderChildren',
        value: function hasPlaceholderChildren() {
            return this.getPlaceholderChildren().length > 0;
        }
    }, {
        key: 'getPlaceholderChildren',
        value: function getPlaceholderChildren() {
            return mag.Stage.getAllNodes([this]).filter(function (e) {
                return e instanceof Expression && e.isPlaceholder();
            });
        }
    }, {
        key: 'animatePlaceholderChildren',
        value: function animatePlaceholderChildren() {
            var missing = this.getPlaceholderChildren();
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = missing[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var e = _step2.value;

                    e.animatePlaceholderStatus();
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
        }
    }, {
        key: 'hasTextbox',
        value: function hasTextbox() {
            var n = this;
            if (n && n.hasPlaceholderChildren()) {
                var placeholders = n.getPlaceholderChildren();
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = placeholders[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var placeholder = _step3.value;

                        // If the placeholder is filled and valid, lock it
                        if (placeholder instanceof TypeInTextExpr || placeholder instanceof TypeInStringValueExpr) {
                            if (placeholder.canReduce() && (!placeholder.typeBox || !placeholder.typeBox.hasIcon())) {
                                continue;
                            } else {
                                return true;
                            }
                        } else {
                            return false;
                        }
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }
            }
            return false;
        }

        // Disallow dropping if lambda body has missing expression.

    }, {
        key: 'hasPlaceholder',
        value: function hasPlaceholder() {
            var n = this;
            if (n && n.hasPlaceholderChildren()) {
                var placeholders = n.getPlaceholderChildren();
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    outer: for (var _iterator4 = placeholders[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var placeholder = _step4.value;

                        if (placeholder instanceof MissingExpression) {
                            // Check that it's not a child of a VarExpr
                            // (which would imply that it's a preview, not
                            // actually part of the lambda)
                            var current = placeholder;
                            while (current) {
                                if (current instanceof LambdaVarExpr || current instanceof VarExpr || current instanceof VtableVarExpr) {
                                    continue outer;
                                }
                                current = current.parent;
                            }
                            return true;
                        }
                    }
                } catch (err) {
                    _didIteratorError4 = true;
                    _iteratorError4 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion4 && _iterator4.return) {
                            _iterator4.return();
                        }
                    } finally {
                        if (_didIteratorError4) {
                            throw _iteratorError4;
                        }
                    }
                }
            }
            return false;
        }

        // Play an animation to remind the user that this is currently reducing.

    }, {
        key: 'animateReducingStatus',
        value: function animateReducingStatus() {
            var _this4 = this;

            this._reducingTime = 0;
            var twn = new mag.IndefiniteTween(function (t) {
                stage.draw();

                _this4._reducingTime += t;

                if (!_this4._reducing || !_this4.stage) twn.cancel();
            });
            twn.run();
        }
    }, {
        key: 'drawInternalAfterChildren',
        value: function drawInternalAfterChildren(ctx, pos, boundingSize) {
            _get(Expression.prototype.__proto__ || Object.getPrototypeOf(Expression.prototype), 'drawInternalAfterChildren', this).call(this, ctx, pos, boundingSize);
            this.drawReductionIndicator(ctx, pos, boundingSize);
        }
    }, {
        key: 'drawReductionIndicator',
        value: function drawReductionIndicator(ctx, pos, boundingSize) {
            if (this._reducing) {
                this.stroke = {
                    lineWidth: 3,
                    color: "lightblue",
                    lineDash: [5, 10],
                    lineDashOffset: this._reducingTime
                };
            }
        }

        // Wrapper for performReduction intended for interactive use

    }, {
        key: 'performUserReduction',
        value: function performUserReduction() {
            var _this5 = this;

            if (!this._reducing) {
                var _ret = function () {
                    // Text boxes simulate a user click, causing us to reduce
                    // twice. We temporarily set the reducing flag to prevent
                    // re-entrant reduction, which causes problems for
                    // expressions that have side effects upon reduction
                    // (e.g. Sequences).
                    _this5._reducing = true;
                    mag.Stage.getNodesWithClass(TypeInTextExpr, [], true, [_this5]).forEach(function (n) {
                        if (n.canReduce()) {
                            n.reduce();
                        }
                    });
                    if (!_this5.canReduce()) {
                        mag.Stage.getAllNodes([_this5]).forEach(function (n) {
                            if (n instanceof Expression && n.isPlaceholder()) {
                                // Something to do here
                                console.log(n);
                                n.animatePlaceholderStatus();
                            }
                        });
                        _this5._reducing = false;
                        return {
                            v: Promise.reject("Expression: expression cannot reduce")
                        };
                    }
                    console.log('Can reduce?: ', _this5.canReduce());

                    _this5.animateReducingStatus();

                    var stage = _this5.stage;

                    _this5._reducing = _this5.performReduction(true);
                    _this5._reducing.then(function () {
                        _this5._reducing = false;
                        if (stage) stage.saveState();
                    }, function () {
                        _this5._reducing = false;
                        if (stage) stage.saveState();
                    });
                }();

                if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            }
            return this._reducing;
        }

        // Reduce this expression to another.
        // * Returns the newly built expression. Leaves this expression unchanged.

    }, {
        key: 'reduce',
        value: function reduce() {
            var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

            return this;
        }

        // Try and reduce the given child expression before continuing with our reduction

    }, {
        key: 'performSubReduction',
        value: function performSubReduction(expr) {
            var _this6 = this;

            var animated = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

            return new Promise(function (resolve, reject) {
                if (expr.isValue() || !expr.canReduce()) {
                    after(300).then(function () {
                        return resolve(expr);
                    });
                    return;
                }
                var result = expr.performReduction(animated);
                if (result instanceof Promise) {
                    result.then(function (result) {
                        if (_this6.stage) _this6.stage.draw();
                        if (result instanceof Expression) result.lock();

                        after(1000).then(function () {
                            if (_this6.stage) _this6.stage.draw();
                            return resolve(result);
                        });
                    }, function (e) {
                        reject(e);
                    });
                } else {
                    if (_this6.stage) _this6.stage.draw();
                    if (result instanceof Expression && !(result instanceof MissingExpression)) result.lock();
                    after(1000).then(function () {
                        if (_this6.stage) _this6.stage.draw();
                        return resolve(result);
                    });
                }
            });
        }

        // * Swaps this expression for its reduction (if one exists) in the expression hierarchy.

    }, {
        key: 'performReduction',
        value: function performReduction() {
            var logChangeData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

            //console.log("called performReduction");
            var reduced_expr = this.reduce();
            if (reduced_expr !== undefined && reduced_expr != this) {
                // Only swap if reduction returns something > null.

                console.warn('performReduction with ', this, reduced_expr);

                if (!this.stage) return Promise.reject();

                var _stage = this.stage;

                // Before performing the reduction, save the state of the board...
                _stage.saveState();

                // Log the reduction.
                var reduced_expr_str = void 0;
                if (reduced_expr === null) reduced_expr_str = '()';else if (Array.isArray(reduced_expr)) reduced_expr_str = reduced_expr.reduce(function (prev, curr) {
                    return prev + curr.toJavaScript() + '; ';
                }, '').trim();else reduced_expr_str = reduced_expr.toJavaScript();
                Logger.log('reduction', { 'before': this.toJavaScript(), 'after': reduced_expr_str });

                if (logChangeData === null) logChangeData = { name: 'reduction', before: this.toJavaScript(), after: reduced_expr_str };

                var parent = this.parent ? this.parent : this.stage;
                if (reduced_expr) reduced_expr.ignoreEvents = this.ignoreEvents; // the new expression should inherit whatever this expression was capable of as input
                parent.swap(this, reduced_expr);

                // Check if parent expression is now reducable.
                if (reduced_expr && reduced_expr.parent) {
                    var try_reduce = reduced_expr.parent.reduceCompletely();
                    if (try_reduce != reduced_expr.parent && try_reduce !== null) {
                        //Animate.blink(reduced_expr.parent, 400, [0,1,0], 1);
                    }
                }

                if (reduced_expr) reduced_expr.update();

                // After performing the reduction, save the new state of the board.
                _stage.saveState(logChangeData);

                return Promise.resolve(reduced_expr);
            }
            return Promise.resolve(this);
        }
    }, {
        key: 'reduceCompletely',
        value: function reduceCompletely() {
            // Try to reduce this expression and its subexpressions as completely as possible.
            //console.log("called reduce completely");
            var e = this;
            e.update();
            var prev_holes = e.holes;
            var prev_children = e.children;
            if (e.children.length === 0) return e.reduce();else {
                e.holes = e.holes.map(function (hole) {
                    if (hole instanceof Expression) return hole.reduceCompletely();else return hole;
                });
                e.update();
                //e.children = [];
                //e.holes.forEach((hole) => e.addChild(hole));
                var red = e.reduce();
                e.children = prev_children;
                e.holes = prev_holes;
                //e.holes.forEach((hole) => e.addChild(hole));
                return red;
            }
        }
    }, {
        key: 'detach',
        value: function detach() {
            if (this.parent && !(this.parent instanceof PlayPen)) {
                // TODO: Make this not rely on class PlayPen.
                var ghost_expr;
                if (this.droppedInClass) ghost_expr = new this.droppedInClass(this);else ghost_expr = new MissingExpression(this);

                var _stage2 = this.parent.stage;
                var beforeState = _stage2 ? _stage2.toString() : null;
                var detachedExp = this.toString();
                var parent = this.parent;

                parent.swap(this, ghost_expr);

                this.shadowOffset = 4;

                this.parent = null;
                if (_stage2) {
                    _stage2.add(this);
                    _stage2.bringToFront(this);

                    var afterState = _stage2.toString();
                    Logger.log('detached-expr', { 'before': beforeState, 'after': afterState, 'item': detachedExp });
                    _stage2.saveState();
                }

                this.shell = ghost_expr;
            }

            var toplevel = this.rootParent;
            if (toplevel.toolbox) {

                if (this.stage) this.stage.saveState();

                this.toolbox.removeExpression(toplevel); // remove this expression from the toolbox
                Logger.log('toolbox-dragout', toplevel.toJavaScript());
            }

            if (this.lockedInteraction) {
                this.unlockInteraction();
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
            this.shadowOffset = 4;
            this.ignoreEvents = false;
            this.locked = false;
        }
    }, {
        key: 'lockSubexpressions',
        value: function lockSubexpressions() {
            var filterFunc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

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
            var filterFunc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

            this.holes.forEach(function (child) {
                if (child instanceof Expression) {
                    if (!filterFunc || filterFunc(child)) child.unlock();
                    child.unlockSubexpressions(filterFunc);
                }
            });
        }
    }, {
        key: 'updateReducibilityIndicator',
        value: function updateReducibilityIndicator() {
            // Replace TypeInTextExpr#canReduce to prevent auto-commit and
            // logging calls
            var fakeReduce = function fakeReduce() {
                return false;
                // if (this.typeBox) {
                //     if (this._origValidator) {
                //         // Logging calls slow down this drastically, so
                //         // avoid it if possible (event will get logged by
                //         // the normal keypress handler)
                //         return false && this._origValidator(this.typeBox.text);
                //     }
                //     return false && this.validator(this.typeBox.text);
                // }
                // else return true;
            };

            var patchup = [];
            mag.Stage.getNodesWithClass(TypeInTextExpr, [], true, [this]).forEach(function (n) {
                n.__origReduce = n.canReduce;
                n.canReduce = fakeReduce.bind(n);
                patchup.push(n);
            });
            mag.Stage.getNodesWithClass(ContextualTypeInTextExpr, [], true, [this]).forEach(function (n) {
                n.__origReduce = n.canReduce;
                n.canReduce = fakeReduce.bind(n);
                patchup.push(n);
            });

            // Apply green outline to reducable expressions:
            var placeholderChildren = this.getPlaceholderChildren().filter(function (n) {
                return !(n instanceof VarExpr || n instanceof TypeInTextExpr);
            });
            var placeholders = placeholderChildren && placeholderChildren.length > 0;
            if (!placeholders && this.canReduce && this.canReduce() && (!this.parent || this.forceReducibilityIndicator)) {
                this.baseStroke = { color: this.reducableStrokeColor ? this.reducableStrokeColor : "#00FF7F",
                    lineWidth: 4,
                    opacity: 0.5 };
            } else {
                this.baseStroke = null;
            }

            patchup.forEach(function (n) {
                n.canReduce = n.__origReduce.bind(n);
                delete n.__origReduce;
            });
        }
    }, {
        key: 'lockInteraction',
        value: function lockInteraction() {
            if (!this.lockedInteraction) {
                this.lockedInteraction = true;
                this._origonmouseclick = this.onmouseclick;
                this.onmouseclick = function (pos) {
                    if (this.parent) this.parent.onmouseclick(pos);
                }.bind(this);
                this.holes.forEach(function (child) {
                    if (child instanceof Expression) {
                        child.lockInteraction();
                    }
                });
            }
        }
    }, {
        key: 'unlockInteraction',
        value: function unlockInteraction() {
            if (this.lockedInteraction) {
                this.lockedInteraction = false;
                this.onmouseclick = this._origonmouseclick;
                this.holes.forEach(function (child) {
                    if (child instanceof Expression) {
                        child.unlockInteraction();
                    }
                });
            }
        }
    }, {
        key: 'hits',
        value: function hits(pos) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

            if (this.locked) return this.hitsChild(pos, options);else return _get(Expression.prototype.__proto__ || Object.getPrototypeOf(Expression.prototype), 'hits', this).call(this, pos, options);
        }
    }, {
        key: 'onmouseenter',
        value: function onmouseenter(pos) {
            if (this.forceTypingOnFill) this.stroke = { color: 'purple', lineWidth: 4 };else _get(Expression.prototype.__proto__ || Object.getPrototypeOf(Expression.prototype), 'onmouseenter', this).call(this, pos);

            if (this.baseStroke) {
                SET_CURSOR_STYLE(CONST.CURSOR.HAND);
                this.stroke = { color: this.reducableStrokeColor ? this.reducableStrokeColor : '#0f0', lineWidth: 4 };
            }
        }
    }, {
        key: 'onmouseleave',
        value: function onmouseleave(pos) {
            if (this.forceTypingOnFill) this.stroke = { color: 'magenta', lineWidth: 4 };else _get(Expression.prototype.__proto__ || Object.getPrototypeOf(Expression.prototype), 'onmouseleave', this).call(this, pos);

            if (this.baseStroke) SET_CURSOR_STYLE(CONST.CURSOR.DEFAULT);
        }
    }, {
        key: 'onmousedrag',
        value: function onmousedrag(pos) {
            var _this7 = this;

            if (this.ignoreEvents) return;

            if (this.parent instanceof PlayPen) pos = fromTo(this.parent.absolutePos, pos);

            _get(Expression.prototype.__proto__ || Object.getPrototypeOf(Expression.prototype), 'onmousedrag', this).call(this, pos);

            if (this.isSnapped()) {
                var UNSNAP_THRESHOLD = 30;
                if (distBetweenPos(this.pos, pos) >= UNSNAP_THRESHOLD) {
                    this.disconnectAllNotches();
                    this.onDisconnect();
                } else return;
            }

            var rightX = pos.x + this.absoluteSize.w;
            //if (rightX < GLOBAL_DEFAULT_SCREENSIZE.width) { // Clipping to edges
            this.pos = pos;
            //} else this.pos = { x:GLOBAL_DEFAULT_SCREENSIZE.width - this.absoluteSize.w, y:pos.y };

            if (!this.dragging) {
                this.detach();
                this.posBeforeDrag = this.absolutePos;
                if (this.stage) this.stage.bringToFront(this);
                this.dragging = true;
                SET_CURSOR_STYLE(CONST.CURSOR.GRABBING);
            }

            // Fire notch events
            if (!this._prev_notch_objs) this._prev_notch_objs = [];
            var notchEventObjs = this.findCompatibleNotches();
            if (notchEventObjs.length !== 0 || this._prev_notch_objs.length !== 0) {
                // If some notch has entered our field of view...
                // Determine which notches are hovering:
                notchEventObjs.forEach(function (o) {
                    // Prev intersects Curr
                    var hovering = _this7._prev_notch_objs.filter(function (a) {
                        return a.notch == o.notch;
                    });
                    hovering.forEach(function (h) {
                        return _this7.onNotchHover(h.otherNotch, h.otherExpr, h.notch);
                    });
                });
                // Determine which notches entered our view:
                var entering = notchEventObjs.filter(function (n) {
                    // Curr - Prev
                    return _this7._prev_notch_objs.filter(function (a) {
                        return a.notch == n.notch;
                    }).length === 0;
                });
                entering.forEach(function (h) {
                    return _this7.onNotchEnter(h.otherNotch, h.otherExpr, h.notch);
                });
                // Determine which notches left our view:
                var leaving = this._prev_notch_objs.filter(function (n) {
                    // Prev - Curr
                    return notchEventObjs.filter(function (a) {
                        return a.notch == n.notch;
                    }).length === 0;
                });
                leaving.forEach(function (h) {
                    return _this7.onNotchLeave(h.otherNotch, h.otherExpr, h.notch);
                });
                this._prev_notch_objs = notchEventObjs.slice();
            }
        }
    }, {
        key: 'onmouseup',
        value: function onmouseup(pos) {
            if (this.dragging && this.shell) {

                if (!this.parent) this.scale = { x: 1, y: 1 };
                this.shell = null;

                Logger.log('detach-commit', this.toString());
            }

            SET_CURSOR_STYLE(CONST.CURSOR.DEFAULT);

            var toplevel = this.rootParent;
            if (!toplevel) toplevel = this;
            if (this.dragging || toplevel.dragging) {
                if (toplevel.toolbox && !toplevel.toolbox.hits(pos)) {
                    toplevel.toolbox = null;

                    Logger.log('toolbox-remove', toplevel.toString());

                    ShapeExpandEffect.run(toplevel, 500, function (e) {
                        return Math.pow(e, 0.5);
                    }, 'white', 1.5);

                    if (toplevel.stage) toplevel.stage.saveState({ name: 'toolbox-remove', item: toplevel.toJavaScript() });
                }
            }
            if (this.dragging) {
                // Snap expressions together?
                if (this._prev_notch_objs && this._prev_notch_objs.length > 0) {
                    var closest = Array.minimum(this._prev_notch_objs, 'dist');
                    this.onSnap(closest.otherNotch, closest.otherExpr, closest.notch);
                }

                Logger.log('moved', { 'item': this.toString(), 'prevPos': JSON.stringify(this.posBeforeDrag), 'newPos': JSON.stringify(this.pos) });
            }

            this.dragging = false;
        }

        /*  Special Events */
        /*  Notch and Snapping events */

    }, {
        key: 'isSnapped',
        value: function isSnapped() {
            return this.notches && this.notches.some(function (n) {
                return n.connection;
            });
        }
    }, {
        key: 'disconnectAllNotches',
        value: function disconnectAllNotches() {
            if (!this.notches || this.notches.length === 0) return;
            this.notches.forEach(function (n) {
                return n.unpair();
            });
        }
    }, {
        key: 'getNotchPos',
        value: function getNotchPos(notch) {
            if (!this.notches) {
                console.error('@ Expression.getNotchPos: Notch is not on this expression.', notch);
                return null;
            }
            var side = notch.side;
            var pos = this.upperLeftPos(this.pos, this.size);
            if (side === 'left') return { x: pos.x, y: pos.y + this.radius + (this.size.h - this.radius) * (1 - notch.relpos) * this.scale.y };else if (side === 'right') return { x: pos.x + this.size.w * this.scale.x, y: pos.y + (this.radius + (this.size.h - this.radius * 2) * notch.relpos) * this.scale.y };else if (side === 'top') return { x: pos.x + this.radius + (this.size.w - this.radius * 2) * notch.relpos, y: pos.y };else if (side === 'bottom') return { x: pos.x + this.radius + (this.size.w - this.radius * 2) * (1 - notch.relpos), y: pos.y + this.size.h };
        }
        // Given another expression and one of its notches,
        // determine whether there's a compatible notch on this expression.

    }, {
        key: 'findNearestCompatibleNotch',
        value: function findNearestCompatibleNotch(otherExpr, otherNotch) {
            var _this8 = this;

            var notches = this.notches;
            if (!notches || notches.length === 0) {
                return null; // By default, expressions do not have notches.
            } else if (!otherExpr || !otherNotch) {
                    console.error('@ Expression.findNearestCompatibleNotch: Passed expression or notch is null.');
                    return null;
                } else if (!otherExpr.notches || otherExpr.notches.length === 0) {
                    return null;
                }

            // Loop through this expression's notches and
            // check for ones compatible to the passed notch.
            // Store the nearest candidate.
            var MINIMUM_ATTACH_THRESHOLD = 25;
            var otherPos = otherExpr.getNotchPos(otherNotch);
            var candidate = null;
            var prevDist = MINIMUM_ATTACH_THRESHOLD;
            notches.forEach(function (notch) {
                if (notch.isCompatibleWith(otherNotch)) {
                    var dist = distBetweenPos(_this8.getNotchPos(notch), otherPos);
                    if (dist < prevDist) {
                        candidate = notch;
                        prevDist = dist;
                    }
                }
            });

            if (candidate) {
                return {
                    notch: candidate,
                    dist: prevDist,
                    otherNotch: otherNotch,
                    otherExpr: otherExpr
                };
            } else {
                return null;
            }
        }
    }, {
        key: 'findCompatibleNotches',
        value: function findCompatibleNotches() {
            var _this9 = this;

            var stage = this.stage;
            if (!stage || !this.notches || this.notches.length === 0) return [];

            var notches = this.notches;
            var candidates = [];
            var dups = [];
            var exprs = stage.getRootNodesThatIncludeClass(Expression, [this]);
            exprs.forEach(function (e) {
                if (!e.notches || e.notches.length === 0) {
                    return;
                } else if (dups.indexOf(e) > -1) {
                    console.warn('@ Expression.findCompatibleNotches: Duplicate expression passed.', e);
                    return;
                } else {
                    (function () {
                        var nearest = [];
                        e.notches.forEach(function (eNotch) {
                            var n = _this9.findNearestCompatibleNotch(e, eNotch);
                            if (n) nearest.push(n);
                        });
                        if (nearest.length > 0) {
                            candidates.push(Array.minimum(nearest, 'dist'));
                            dups.push(e);
                        }
                    })();
                }
            });

            return candidates;
        }

        // Triggered after a nearest compatible notch is identified,
        // within some distance threshold.

    }, {
        key: 'onNotchEnter',
        value: function onNotchEnter(otherNotch, otherExpr, thisNotch) {
            otherExpr.stroke = { color: 'magenta', lineWidth: 4 };
        }
        // When a compatible notch has been identified and the user is
        // dragging this expression around within the other's snappable-zone,
        // this event keeps triggering.

    }, {
        key: 'onNotchHover',
        value: function onNotchHover(otherNotch, otherExpr, thisNotch) {}
        // Triggered when this expression is dragged away from
        // the nearest compatible notch's snappable-zone.

    }, {
        key: 'onNotchLeave',
        value: function onNotchLeave(otherNotch, otherExpr, thisNotch) {
            otherExpr.stroke = null; // TODO: Fix this to use prospectPriorStroke
        }

        // Triggered when the user released the mouse and
        // a nearest compatible notch is available
        // (i.e., onmouseup after onNotchEnter was called and before onNotchLeave)

    }, {
        key: 'onSnap',
        value: function onSnap(otherNotch, otherExpr, thisNotch) {
            var animated = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

            Notch.pair(thisNotch, this, otherNotch, otherExpr);

            this.anchor = { x: 0, y: 0 };
            var vec = fromTo(this.getNotchPos(thisNotch), otherExpr.getNotchPos(otherNotch));
            this.pos = addPos(this.pos, vec);

            //let notchPos = otherExpr.getNotchPos(otherNotch);
            //let nodeNotchDistY = this.getNotchPos(thisNotch).y - this.pos.y;
            //this.pos = { x:notchPos.x, y:notchPos.y - nodeNotchDistY };
            //this.stroke = null;
            if (animated) {
                Animate.blink(this, 500, [1, 0, 1], 1);
                Animate.blink(otherExpr, 500, [1, 0, 1], 1);
            }
        }
    }, {
        key: 'onDisconnect',
        value: function onDisconnect() {}

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
        key: 'toJavaScript',
        value: function toJavaScript() {
            if (this.holes.length === 1) return this.holes[0].toJavaScript();else return JSON.stringify(this.holes.map(function (e) {
                return e.toJavaScript();
            })); // this shouldn't happen, ideally...
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
            var _this10 = this;

            var padding = this.padding;
            var width = 0;
            var height = DEFAULT_EXPR_HEIGHT;
            var sizes = this.getHoleSizes();
            var scale_x = this.scale.x;

            if (this._layout.direction == "vertical") {
                width = EMPTY_EXPR_WIDTH;
                height = 0;
            }

            if (sizes.length === 0) return { w: this._size.w, h: this._size.h };

            sizes.forEach(function (s) {
                if (_this10._layout.direction == "vertical") {
                    height += s.h;
                    width = Math.max(width, s.w);
                } else {
                    height = Math.max(height, s.h);
                    width += s.w + padding.inner;
                }
            });

            if (this._layout.direction == "vertical" && this.padding.between) {
                height += this.padding.between * (sizes.length - 1);
            }

            if (this._layout.direction == "vertical") {
                height += 2 * padding.inner;
                width += padding.left + padding.right;
            } else {
                width += padding.right; // the end
            }

            return { w: width, h: height };
        }
    }]);

    return Expression;
}(mag.RoundedRect);

// A base Expression which does not equate .holes and .children.
// -> TODO: Remove the need for this by merging it with the base class.


var ExpressionPlus = function (_Expression) {
    _inherits(ExpressionPlus, _Expression);

    function ExpressionPlus() {
        _classCallCheck(this, ExpressionPlus);

        return _possibleConstructorReturn(this, (ExpressionPlus.__proto__ || Object.getPrototypeOf(ExpressionPlus)).apply(this, arguments));
    }

    _createClass(ExpressionPlus, [{
        key: 'swap',
        value: function swap(arg, anotherArg) {
            _get(ExpressionPlus.prototype.__proto__ || Object.getPrototypeOf(ExpressionPlus.prototype), 'swap', this).call(this, arg, anotherArg);

            // Now remove it from the children as well
            if (arg && anotherArg) {
                var i = this.children.indexOf(arg);
                if (i > -1) {
                    // Don't add it again: it was already added when
                    // Expression#swap called our #update().
                    this.children.splice(i, 1);
                    this.update();
                }
            }
        }
    }, {
        key: '_setHoleScales',
        value: function _setHoleScales() {
            var _this12 = this;

            this.holes.forEach(function (expr) {
                expr.anchor = { x: 0, y: 0.5 };
                expr.scale = { x: _this12._subexpScale, y: _this12._subexpScale };
                expr.update();
            });
        }
    }, {
        key: 'update',
        value: function update() {
            var _this13 = this;

            var _this = this;

            this.holes.forEach(function (expr) {
                if (!_this.hasChild(expr)) _this.addChild(expr);
            });
            // In the centering calculation below, we need this expr's
            // size to be stable. So we first set the scale on our
            // children, then compute our size once to lay out the
            // children.
            this._setHoleScales();
            var size = this.size;

            var padding = this.padding.inner;
            var x = this.padding.left;
            var y = this.size.h / 2.0 + (this.exprOffsetY ? this.exprOffsetY : 0);
            if (this._layout.direction == "vertical") {
                y = padding;
            }

            this.holes.forEach(function (expr) {
                // Update hole expression positions.
                expr.pos = { x: x, y: y };
                expr.update();

                if (_this13._layout.direction == "vertical") {
                    y += expr.anchor.y * expr.size.h * expr.scale.y;
                    var offset = x;

                    // Centering
                    if (_this13._layout.align == "horizontal") {
                        var innerWidth = size.w;
                        var scale = expr.scale.x;
                        offset = (innerWidth - scale * expr.size.w) / 2;
                    }

                    expr.pos = { x: offset, y: y };

                    y += (1 - expr.anchor.y) * expr.size.h * expr.scale.y;
                    if (_this13.padding.between) y += _this13.padding.between;
                } else {
                    x += expr.size.w * expr.scale.x + padding;
                }
            });
        }
    }, {
        key: 'clone',
        value: function clone() {
            var _this14 = this;

            var parent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

            if (this.drawer) {
                var _ret3 = function () {
                    var extras = [];
                    _this14.children.forEach(function (c) {
                        if (_this14.holes.indexOf(c) === -1) extras.push(c);
                    });
                    extras.forEach(function (c) {
                        return _this14.removeChild(c);
                    });
                    var cln = _get(ExpressionPlus.prototype.__proto__ || Object.getPrototypeOf(ExpressionPlus.prototype), 'clone', _this14).call(_this14, parent);
                    extras.forEach(function (c) {
                        return _this14.addChild(c);
                    });
                    return {
                        v: cln
                    };
                }();

                if ((typeof _ret3 === 'undefined' ? 'undefined' : _typeof(_ret3)) === "object") return _ret3.v;
            } else return _get(ExpressionPlus.prototype.__proto__ || Object.getPrototypeOf(ExpressionPlus.prototype), 'clone', this).call(this, parent);
        }
    }]);

    return ExpressionPlus;
}(Expression);