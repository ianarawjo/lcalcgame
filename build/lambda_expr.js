'use strict';

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Lambda calculus versions of Expression objects.
 * The LambdaHoleExpr performs substitution on LambdaVar subexpressions in its parent expression context.
 * -----------------------------------------------
 * */

var LambdaHoleExpr = function (_MissingExpression) {
    _inherits(LambdaHoleExpr, _MissingExpression);

    _createClass(LambdaHoleExpr, [{
        key: 'openImage',
        get: function get() {
            return this.name === 'x' ? 'lambda-hole' : 'lambda-hole-red';
        }
    }, {
        key: 'closedImage',
        get: function get() {
            return this.name === 'x' ? 'lambda-hole-closed' : 'lambda-hole-red-closed';
        }
    }, {
        key: 'openingAnimation',
        get: function get() {
            var anim = new Animation();
            anim.addFrame('lambda-hole-opening0', 50);
            anim.addFrame('lambda-hole-opening1', 50);
            anim.addFrame('lambda-hole', 50);
            return anim;
        }
    }, {
        key: 'closingAnimation',
        get: function get() {
            var anim = new Animation();
            anim.addFrame('lambda-hole-opening1', 50);
            anim.addFrame('lambda-hole-opening0', 50);
            anim.addFrame('lambda-hole-closed', 50);
            return anim;
        }
    }]);

    function LambdaHoleExpr(varname) {
        _classCallCheck(this, LambdaHoleExpr);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(LambdaHoleExpr).call(this, null));

        _this._name = varname;
        _this.color = _this.colorForVarName();
        _this.image = _this.openImage;
        _this.isOpen = true;
        return _this;
    }

    _createClass(LambdaHoleExpr, [{
        key: 'colorForVarName',
        //'IndianRed';

        // return {
        //
        //     'x':'orange',
        //     'y':'IndianRed',
        //     'z':'green',
        //     'w':'blue'
        //
        // }[v];
        value: function colorForVarName() {
            return LambdaHoleExpr.colorForVarName(this.name);
        }

        // Draw special circle representing a hole.

    }, {
        key: 'drawInternal',
        value: function drawInternal(pos, boundingSize) {
            var ctx = this.ctx;
            var rad = boundingSize.w / 2.0;
            setStrokeStyle(ctx, this.stroke);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(pos.x + rad, pos.y + rad, rad, 0, 2 * Math.PI);
            this.ctx.drawImage(Resource.getImage(this.image), pos.x, pos.y, boundingSize.w, boundingSize.h);
            if (this.stroke) ctx.stroke();
        }

        // Accessibility

    }, {
        key: 'open',
        value: function open() {
            var _this2 = this;

            if (!this.isOpen) {
                if (this.stage) {
                    Animate.play(this.openingAnimation, this, function () {
                        _this2.image = _this2.openImage;
                        if (_this2.stage) _this2.stage.draw();
                    });
                } else this.image = this.openImage;
                this.isOpen = true;
            }
        }
    }, {
        key: 'close',
        value: function close() {
            var _this3 = this;

            if (this.isOpen) {
                if (this.stage) {
                    Animate.play(this.closingAnimation, this, function () {
                        _this3.image = _this3.closedImage;
                        if (_this3.stage) _this3.stage.draw();
                    });
                } else this.image = this.closedImage;
                this.isOpen = false;
            }
        }
    }, {
        key: 'hits',
        value: function hits(pos) {
            var options = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];

            if (this.isOpen) return _get(Object.getPrototypeOf(LambdaHoleExpr.prototype), 'hits', this).call(this, pos, options);else return null;
        }
    }, {
        key: 'applyExpr',
        value: function applyExpr(node) {
            var _this4 = this;

            if (!this.parent) {
                console.error('@ LambdaHoleExpr.applyExpr: No parent LambdaExpr.');
                return false;
            }

            var parent = this.parent;
            var subvarexprs = Stage.getNodesWithClass(LambdaVarExpr, [], true, [parent]);
            subvarexprs.forEach(function (expr) {
                if (expr.name === _this4.name) {
                    var c = node.clone();
                    //c.bindSubexpressions();
                    c.stage = null;
                    expr.parent.swap(expr, c); // Swap the expression for a clone of the dropped node.
                    c.parent.bindSubexpressions();
                }
            });

            // Now remove this hole from its parent expression.
            parent.removeArg(this);

            // GAME DESIGN CHOICE: Automatically break apart parenthesized values.
            // * If we don't do this, the player can stick everything into one expression and destroy that expression
            // * to destroy as many expressions as they like with a single destruction piece. And that kind of breaks gameplay.
            return parent.performReduction();
        }

        // Events

    }, {
        key: 'onmousedrag',
        value: function onmousedrag(pos) {
            if (this.parent) {
                pos = addPos(pos, fromTo(this.absolutePos, this.parent.absolutePos));
                this.parent.onmousedrag(pos);
            }
        }
    }, {
        key: 'ondropenter',
        value: function ondropenter(node, pos) {
            var _this5 = this;

            if (node instanceof LambdaHoleExpr) node = node.parent;
            _get(Object.getPrototypeOf(LambdaHoleExpr.prototype), 'ondropenter', this).call(this, node, pos);
            node.opacity = 0.2;
            if (this.parent) {
                var subvarexprs = Stage.getNodesWithClass(LambdaVarExpr, [], true, [this.parent]);
                subvarexprs.forEach(function (e) {
                    if (e.name === _this5.name) {
                        var preview_node = node.clone();
                        preview_node.opacity = 1.0;
                        preview_node.bindSubexpressions();
                        e.open(preview_node);
                    }
                });
                this.opened_subexprs = subvarexprs;
                this.close_opened_subexprs = function () {
                    if (!_this5.opened_subexprs) return;
                    _this5.opened_subexprs.forEach(function (e) {
                        e.close();
                    });
                    _this5.opened_subexprs = null;
                };
            }
        }
    }, {
        key: 'ondropexit',
        value: function ondropexit(node, pos) {
            if (node instanceof LambdaHoleExpr) node = node.parent;
            _get(Object.getPrototypeOf(LambdaHoleExpr.prototype), 'ondropexit', this).call(this, node, pos);
            if (node) node.opacity = 1.0;
            this.close_opened_subexprs();
        }
    }, {
        key: 'ondropped',
        value: function ondropped(node, pos) {
            if (node instanceof LambdaHoleExpr) node = node.parent;
            if (node.dragging) {
                // Make sure node is being dragged by the user.

                // Cleanup
                node.opacity = 1.0;
                this.close_opened_subexprs();

                // User dropped an expression into the lambda hole.
                Resource.play('pop');

                // Clone the dropped expression.
                var dropped_expr = node.clone();

                // Save the current state of the board.
                var stage = node.stage;
                stage.saveState();

                Logger.log('state-save', stage.toString());

                // Remove the original expression from its stage.
                stage.remove(node);

                // If this hole is part of a larger expression tree (it should be!),
                // attempt recursive substitution on any found LambdaVarExpressions.
                if (this.parent) {
                    var parent = this.parent;
                    var orig_exp_str = this.parent.toString();
                    var dropped_exp_str = node.toString();

                    this.applyExpr(node);

                    // Log the reduction.
                    Logger.log('reduction-lambda', { 'before': orig_exp_str, 'applied': dropped_exp_str, 'after': parent.toString() });
                    Logger.log('state-save', stage.toString());

                    if (parent.children.length === 0) {

                        // This hole expression is a destructor token.
                        // (a) Play nifty 'POOF' animation.
                        Animate.poof(parent);

                        // (b) Remove expression from the parent stage.
                        (parent.parent || parent.stage).remove(parent);
                    } else stage.dumpState();
                } else {
                    console.warn('ERROR: Cannot perform lambda-substitution: Hole has no parent.');

                    // Hole is singular; acts as abyss. Remove it after one drop.
                    this.stage.remove(this);
                }
            }
        }
    }, {
        key: 'toString',
        value: function toString() {
            return 'λ' + this.name;
        }
    }, {
        key: 'name',
        get: function get() {
            return this._name;
        },
        set: function set(n) {
            this._name = n;
        }
    }], [{
        key: 'colorForVarName',
        value: function colorForVarName(v) {

            if (v === 'x') return 'lightgray';else return 'white';
        }
    }]);

    return LambdaHoleExpr;
}(MissingExpression);

var LambdaVarExpr = function (_ImageExpr) {
    _inherits(LambdaVarExpr, _ImageExpr);

    function LambdaVarExpr(varname) {
        _classCallCheck(this, LambdaVarExpr);

        var _this6 = _possibleConstructorReturn(this, Object.getPrototypeOf(LambdaVarExpr).call(this, 0, 0, 54 * 1.2, 70 * 1.2, 'lambda-pipe'));

        _this6.graphicNode.offset = { x: 0, y: -8 };
        _this6.name = varname ? varname.replace('_', '') : undefined;
        _this6.ignoreEvents = true;
        _this6.handleOffset = -8;

        // Graphic animation.
        _this6.stateGraph.enter('closed');
        return _this6;
    }

    _createClass(LambdaVarExpr, [{
        key: 'clone',
        value: function clone() {
            var c = _get(Object.getPrototypeOf(LambdaVarExpr.prototype), 'clone', this).call(this);
            c._stateGraph = null;
            c.stateGraph.enter('closed');
            return c;
        }
    }, {
        key: 'open',
        value: function open() {
            var _this7 = this;

            var preview_expr = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

            if (this.stateGraph.currentState !== 'open') {
                (function () {
                    _this7.stateGraph.enter('opening');

                    var stage = _this7.stage;

                    if (preview_expr) {
                        setTimeout(function () {
                            if (_this7.stateGraph.currentState === 'opening') {
                                var scale = _this7.graphicNode.size.w / preview_expr.size.w * 0.8;
                                preview_expr.pos = { x: _this7.children[0].size.w / 2.0, y: -10 };
                                preview_expr.scale = { x: scale, y: scale };
                                preview_expr.anchor = { x: 0.5, y: 0 };
                                preview_expr.stroke = null;
                                _this7.graphicNode.addChild(preview_expr);
                                stage.draw();
                            }
                        }, 150);
                    }
                })();
            }
        }
    }, {
        key: 'close',
        value: function close() {
            if (this.stateGraph.currentState !== 'closed') {
                this.stateGraph.enter('closing');
                this.graphicNode.children = [];
            }
        }

        //onmousedrag() {}

    }, {
        key: 'drawInternal',
        value: function drawInternal(pos, boundingSize) {
            _get(Object.getPrototypeOf(LambdaVarExpr.prototype), 'drawInternal', this).call(this, pos, boundingSize);
            if (this.ctx && !this.parent) {
                this.scale = { x: 0.8, y: 0.8 };
                drawCircle(this.ctx, pos.x, pos.y + this.handleOffset + this.shadowOffset, boundingSize.w / 2.0, 'black', this.graphicNode.stroke);
                drawCircle(this.ctx, pos.x, pos.y + this.handleOffset, boundingSize.w / 2.0, 'lightgray', this.graphicNode.stroke);
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
            return '#' + (this.ignoreEvents ? '' : '_') + this.name;
        }
    }, {
        key: 'openImage',
        get: function get() {
            return this.name === 'x' ? 'lambda-pipe-open' : 'lambda-pipe-red-open';
        }
    }, {
        key: 'closedImage',
        get: function get() {
            return this.name === 'x' ? 'lambda-pipe' : 'lambda-pipe-red';
        }
    }, {
        key: 'openingAnimation',
        get: function get() {
            var anim = new Animation();
            anim.addFrame('lambda-pipe-opening0', 50);
            anim.addFrame('lambda-pipe-opening1', 50);
            anim.addFrame('lambda-pipe-open', 50);
            return anim;
        }
    }, {
        key: 'closingAnimation',
        get: function get() {
            var anim = new Animation();
            anim.addFrame('lambda-pipe-opening1', 50);
            anim.addFrame('lambda-pipe-opening0', 50);
            anim.addFrame('lambda-pipe', 50);
            return anim;
        }
    }, {
        key: 'stateGraph',
        get: function get() {
            var _this8 = this;

            if (!this._stateGraph) {
                var g = new StateGraph();
                g.addState('closed', function () {
                    _this8.image = _this8.closedImage;
                });
                if (this.stage) this.stage.draw();
                g.addState('opening', function () {
                    var anim = _this8.openingAnimation;
                    Animate.play(anim, _this8, function () {
                        g.enter('open');
                    });
                });
                g.addState('open', function () {
                    _this8.image = _this8.openImage;
                });
                if (this.stage) this.stage.draw();
                g.addState('closing', function () {
                    var anim = _this8.closingAnimation;
                    Animate.play(anim, _this8, function () {
                        g.enter('closed');
                    });
                });
                this._stateGraph = g;
            }
            return this._stateGraph;
        }
    }]);

    return LambdaVarExpr;
}(ImageExpr);

var LambdaExpr = function (_Expression) {
    _inherits(LambdaExpr, _Expression);

    function LambdaExpr(exprs) {
        _classCallCheck(this, LambdaExpr);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(LambdaExpr).call(this, exprs));

        /*let txt = new TextExpr('→');
        txt.color = 'gray'
        this.addArg(txt);*/
    }

    _createClass(LambdaExpr, [{
        key: 'applyExpr',
        value: function applyExpr(node) {
            if (this.takesArgument) {
                return this.holes[0].applyExpr(node);
            } else return this;
        }
    }, {
        key: 'numOfNestedLambdas',
        value: function numOfNestedLambdas() {
            if (!this.takesArgument || !this.fullyDefined) return 0;else if (this.holes.length < 2) return 1;else {
                return 1 + (this.holes[1] instanceof LambdaExpr ? this.holes[1].numOfNestedLambdas() : 0);
            }
        }
    }, {
        key: 'addChild',
        value: function addChild(c) {
            _get(Object.getPrototypeOf(LambdaExpr.prototype), 'addChild', this).call(this, c);

            // Color all subvarexpr's of child consistently with their names.
            if (this.takesArgument) {
                this.updateHole();

                var hole = this.holes[0];
                var lvars = Stage.getNodesWithClass(LambdaVarExpr, [], true, [this]);
                lvars.forEach(function (v) {
                    if (v.name === hole.name) {
                        v.color = hole.colorForVarName();
                    }
                });
            }
        }
    }, {
        key: 'updateHole',
        value: function updateHole() {
            // Determine whether this LambdaExpr has any MissingExpressions:
            if (this.holes[0].name !== 'x') this.color = this.holes[0].color;
            var missing = !this.fullyDefined;
            if (missing || this.parent && this.parent instanceof FuncExpr && !this.parent.isAnimating) // ||
                //this.parent instanceof LambdaExpr && this.parent.takesArgument)))
                this.holes[0].close();else this.holes[0].open();
        }

        // Close lambda holes appropriately.

    }, {
        key: 'swap',
        value: function swap(node, otherNode) {
            _get(Object.getPrototypeOf(LambdaExpr.prototype), 'swap', this).call(this, node, otherNode);
            if (this.takesArgument) {
                if (otherNode instanceof MissingExpression) {
                    // if expression was removed...
                    this.holes[0].close(); // close the hole, undoubtedly
                } else if (node instanceof MissingExpression) {
                        // if expression was placed...
                        this.updateHole();
                    }
            }
        }
    }, {
        key: 'onmouseclick',
        value: function onmouseclick(pos) {
            this.performReduction();
        }
    }, {
        key: 'hitsChild',
        value: function hitsChild(pos) {
            if (this.isParentheses) return null;
            return _get(Object.getPrototypeOf(LambdaExpr.prototype), 'hitsChild', this).call(this, pos);
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            // Remove 'parentheses':
            if (this.isParentheses) {
                return this.holes;
            } else return _get(Object.getPrototypeOf(LambdaExpr.prototype), 'reduce', this).call(this);
        }
    }, {
        key: 'performReduction',
        value: function performReduction() {
            var _this10 = this;

            var reduced_expr = this.reduce();
            if (reduced_expr && reduced_expr != this) {
                // Only swap if reduction returns something > null.

                if (this.stage) this.stage.saveState();

                var parent;
                if (Array.isArray(reduced_expr)) {
                    if (reduced_expr.length === 1) {
                        reduced_expr = reduced_expr[0];
                    } // reduce to single argument
                    else if (this.parent) return; // cannot reduce a parenthetical expression with > 1 subexpression.
                        else {
                                parent = this.stage;
                                reduced_expr.forEach(function (e) {
                                    if (_this10.locked) e.lock();else e.unlock();
                                });
                                parent.swap(this, reduced_expr); // swap 'this' (on the board) with an array of its reduced expressions
                                return reduced_expr;
                            }
                }

                parent = this.parent ? this.parent : this.stage;
                if (this.locked) reduced_expr.lock(); // the new expression should inherit whatever this expression was capable of as input
                else reduced_expr.unlock();
                //console.warn(this, reduced_expr);
                if (parent) parent.swap(this, reduced_expr);

                if (reduced_expr.parent) {
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

            // If the inner expression reduces to null when it takes an argument, this lambda expression itself should disappear.
            if (this.takesArgument && this.fullyDefined && this.holes.length === 2 && this.holes[1].reduceCompletely() === null) {

                console.error('HELLO');
                return null;
            } else return _get(Object.getPrototypeOf(LambdaExpr.prototype), 'reduceCompletely', this).call(this);
        }
    }, {
        key: 'toString',
        value: function toString() {
            if (this.holes.length === 1 && this.holes[0] instanceof LambdaHoleExpr) return '(' + _get(Object.getPrototypeOf(LambdaExpr.prototype), 'toString', this).call(this) + ')';else return _get(Object.getPrototypeOf(LambdaExpr.prototype), 'toString', this).call(this);
        }
    }, {
        key: 'isParentheses',
        get: function get() {
            return this.holes.length > 0 && !this.takesArgument;
        }
    }, {
        key: 'takesArgument',
        get: function get() {
            return this.holes.length > 0 && this.holes[0] instanceof LambdaHoleExpr;
        }
    }, {
        key: 'fullyDefined',
        get: function get() {
            // If one arg is MissingExpression, this will be false.
            if (this.holes.length < 2) return true;
            return this.holes.slice(1).reduce(function (prev, arg) {
                return prev && !(arg instanceof MissingExpression);
            }, true);
        }
    }, {
        key: 'body',
        get: function get() {
            return this.takesArgument ? this.holes[1] : null;
        }
    }]);

    return LambdaExpr;
}(Expression);