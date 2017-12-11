'use strict';

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MissingExpression = function (_Expression) {
    _inherits(MissingExpression, _Expression);

    function MissingExpression(expr_to_miss) {
        _classCallCheck(this, MissingExpression);

        var _this = _possibleConstructorReturn(this, (MissingExpression.__proto__ || Object.getPrototypeOf(MissingExpression)).call(this, []));

        if (!expr_to_miss) expr_to_miss = new Expression();
        _this.shadowOffset = -1; // inner
        _this.color = '#555555';
        _this._size = { w: expr_to_miss.size.w, h: expr_to_miss.size.h };
        _this.ghost = expr_to_miss;
        return _this;
    }

    _createClass(MissingExpression, [{
        key: 'isPlaceholder',
        value: function isPlaceholder() {
            return true;
        }
    }, {
        key: 'getClass',
        value: function getClass() {
            return MissingExpression;
        }
    }, {
        key: 'accepts',
        value: function accepts(expr) {
            // Never accept special exprs in normal holes. Subclass to accept these types of exprs...
            return !(expr instanceof OpLiteral || expr instanceof ChoiceExpr || expr instanceof Snappable);
        }
    }, {
        key: 'onmousedrag',
        value: function onmousedrag(pos) {
            // disable drag
            // forward it to parent
            if (this.parent) {
                pos = addPos(pos, fromTo(this.absolutePos, this.parent.absolutePos));
                this.parent.onmousedrag(pos);
            }
        }
    }, {
        key: 'onmouseup',
        value: function onmouseup(pos) {
            if (this.parent && this.parent.dragging) {
                pos = addPos(pos, fromTo(this.absolutePos, this.parent.absolutePos));
                this.parent.onmouseup(pos);
            }
        }
    }, {
        key: 'ondropenter',
        value: function ondropenter(node, pos) {
            if (!this.accepts(node)) return;
            this.onmouseenter(pos);
        }
    }, {
        key: 'ondropexit',
        value: function ondropexit(node, pos) {
            if (!this.accepts(node)) return;
            this.onmouseleave(pos);
        }
    }, {
        key: 'ondropped',
        value: function ondropped(node, pos) {
            // Forward drop events from dragged MissingExpression's to their root exprs.
            // (so you can still drag a parent by its hole...)
            if (node instanceof MissingExpression) node = node.rootParent;

            if (!this.accepts(node)) return;

            if (node.dragging) {
                // Reattach node.

                // Should not be able to stick lambdas in MissingExpression holes (exception of Map and Define)
                // if (node instanceof LambdaExpr && !(this.parent instanceof MapFunc)
                //     && !(this.parent instanceof DefineExpr) && !(this.parent instanceof ObjectExtensionExpr))
                //     return;

                // Should not be able to use choice exprs or snappables, ever
                if (node instanceof ChoiceExpr || node instanceof Snappable) return;

                var stage = this.stage;
                var beforeNode = this.rootParent.toJavaScript();
                var droppedExp = node.toJavaScript();
                var parent = this.parent;

                // Unset toolbox flag even when dragging directly to a hole
                if (node.toolbox) {
                    node.toolbox.removeExpression(node);
                    node.toolbox = null;
                }

                Resource.play('pop');
                node.stage.remove(node);
                node.droppedInClass = this.getClass();
                node.shadowOffset = 2;
                parent.swap(this, node);

                ShapeExpandEffect.run(node, 300, function (e) {
                    return Math.pow(e, 0.5);
                }, 'white', 1.5);

                var root = parent.rootParent || parent;
                if (__ACTIVE_LEVEL_VARIANT === "verbatim_variant" && root.forceTypingOnFill) {

                    var hasMissing = false;
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = root.getPlaceholderChildren()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var placeholder = _step.value;

                            if (placeholder instanceof MissingExpression || placeholder instanceof TypeInTextExpr) {
                                hasMissing = true;
                                break;
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

                    if (!hasMissing) {
                        var challenge = new TypeInTextExpr();
                        var code = root.toJavaScript();
                        if (window.escodegen) {
                            code = window.escodegen.generate(window.esprima.parse(code, {
                                raw: true,
                                tokens: true,
                                range: true
                            }), {
                                comment: false,
                                format: {
                                    // Have it preserve spaces, but don't
                                    // put things across multiple lines.
                                    compact: false,
                                    indent: {
                                        style: ""
                                    },
                                    newline: "",
                                    // Remove trailing semicolon
                                    semicolons: false,
                                    quotes: "double"
                                }
                            });
                        }
                        if (code.indexOf('=>') > -1) {
                            // Patch in parens for arrow functions...
                            var varname = code.split('=>')[0].trim();
                            code = '(' + varname + ') =>' + code.split('=>')[1];
                        }
                        challenge.enforceHint(code);
                        challenge.typeBox.update();
                        var wrapper = new Expression([challenge]);
                        var _pos = root.pos;
                        var anchor = root.anchor;
                        wrapper.holes[0].emptyParent = true;

                        stage.saveState({ name: "placed-expr", before: beforeNode, item: droppedExp, after: root.toJavaScript() });

                        root.stage.swap(root, wrapper);
                        wrapper.pos = _pos;
                        wrapper.anchor = anchor;
                        //wrapper.color = 'magenta';

                        showHelpText("Press ENTER when finished typing.");

                        stage.saveState({ name: "verbatim-prompt", text: code });
                        Logger.log('verbatim-prompt', { text: code });

                        ShapeExpandEffect.run(wrapper, 500, function (e) {
                            return Math.pow(e, 0.5);
                        }, __VERBATIM_COLOR, 1.5);

                        challenge.focus();
                        return;
                    }
                }
                // Logger.log('placed-expr', {'before':beforeNode, 'after':afterState, 'item':droppedExp });

                stage.saveState({ name: "placed-expr", before: beforeNode, item: droppedExp, after: parent.rootParent.toJavaScript() });

                // Blink red if total reduction is not possible with this config.
                /*var try_reduce = node.parent.reduceCompletely();
                if (try_reduce == node.parent || try_reduce === null) {
                    Animate.blink(node.parent, 400, [1,0,0]);
                }*/

                // Blink blue if reduction is possible with this config.
                //var try_reduce = node.parent.reduceCompletely();
                /*if ((try_reduce != node.parent && try_reduce !== undefined) || node.parent.isComplete()) {
                    Animate.blink(node.parent, 1000, [1,1,0], 1);
                }*/
            }
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '_';
        }
    }, {
        key: 'toJavaScript',
        value: function toJavaScript() {
            return this.toString();
        }
    }]);

    return MissingExpression;
}(Expression);

var MissingTypedExpression = function (_MissingExpression) {
    _inherits(MissingTypedExpression, _MissingExpression);

    function MissingTypedExpression(expr_to_miss) {
        _classCallCheck(this, MissingTypedExpression);

        var _this2 = _possibleConstructorReturn(this, (MissingTypedExpression.__proto__ || Object.getPrototypeOf(MissingTypedExpression)).call(this, expr_to_miss));

        _this2.acceptedClasses = [];
        if (expr_to_miss && expr_to_miss.equivalentClasses) {
            _this2.acceptedClasses = expr_to_miss.equivalentClasses;
        }
        return _this2;
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
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this.acceptedClasses[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var c = _step2.value;

                    if (expr instanceof c) return true;
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
        key: 'ondropenter',
        value: function ondropenter(node, pos) {
            if (this.accepts(node)) _get(MissingTypedExpression.prototype.__proto__ || Object.getPrototypeOf(MissingTypedExpression.prototype), 'ondropenter', this).call(this, node, pos);
        }
    }, {
        key: 'ondropexit',
        value: function ondropexit(node, pos) {
            if (this.accepts(node)) _get(MissingTypedExpression.prototype.__proto__ || Object.getPrototypeOf(MissingTypedExpression.prototype), 'ondropexit', this).call(this, node, pos);
        }
    }, {
        key: 'ondropped',
        value: function ondropped(node, pos) {
            if (this.accepts(node)) _get(MissingTypedExpression.prototype.__proto__ || Object.getPrototypeOf(MissingTypedExpression.prototype), 'ondropped', this).call(this, node, pos);
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '_';
        }
    }, {
        key: 'toJavaScript',
        value: function toJavaScript() {
            return this.toString();
        }
    }]);

    return MissingTypedExpression;
}(MissingExpression);

var MissingOpExpression = function (_MissingTypedExpressi) {
    _inherits(MissingOpExpression, _MissingTypedExpressi);

    function MissingOpExpression(expr_to_miss) {
        _classCallCheck(this, MissingOpExpression);

        var _this3 = _possibleConstructorReturn(this, (MissingOpExpression.__proto__ || Object.getPrototypeOf(MissingOpExpression)).call(this, expr_to_miss));

        _this3._size = { w: 50, h: 50 };
        _this3.acceptedClasses = [OpLiteral];
        _this3.radius = 26;
        return _this3;
    }

    _createClass(MissingOpExpression, [{
        key: 'getClass',
        value: function getClass() {
            return MissingOpExpression;
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '>>';
        }
    }]);

    return MissingOpExpression;
}(MissingTypedExpression);

var MissingBagExpression = function (_MissingTypedExpressi2) {
    _inherits(MissingBagExpression, _MissingTypedExpressi2);

    function MissingBagExpression(expr_to_miss) {
        _classCallCheck(this, MissingBagExpression);

        var _this4 = _possibleConstructorReturn(this, (MissingBagExpression.__proto__ || Object.getPrototypeOf(MissingBagExpression)).call(this, expr_to_miss));

        _this4._size = { w: 50, h: 50 };
        _this4.graphicNode = new Bag(0, 0, 22, false);
        _this4.acceptedClasses = [BagExpr, PutExpr];
        return _this4;
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

var MissingBracketExpression = function (_MissingBagExpression) {
    _inherits(MissingBracketExpression, _MissingBagExpression);

    function MissingBracketExpression(expr_to_miss) {
        _classCallCheck(this, MissingBracketExpression);

        var _this5 = _possibleConstructorReturn(this, (MissingBracketExpression.__proto__ || Object.getPrototypeOf(MissingBracketExpression)).call(this, expr_to_miss));

        _this5.graphicNode = new mag.ImageRect(0, 0, 22, 22, 'missing-bracket');
        return _this5;
    }

    _createClass(MissingBracketExpression, [{
        key: 'getClass',
        value: function getClass() {
            return MissingBracketExpression;
        }
    }, {
        key: 'onmouseenter',
        value: function onmouseenter(pos) {
            _get(MissingBracketExpression.prototype.__proto__ || Object.getPrototypeOf(MissingBracketExpression.prototype), 'onmouseenter', this).call(this, pos);
            this.graphicNode.image = 'missing-bracket-selected';
        }
    }, {
        key: 'onmouseleave',
        value: function onmouseleave(pos) {
            _get(MissingBracketExpression.prototype.__proto__ || Object.getPrototypeOf(MissingBracketExpression.prototype), 'onmouseleave', this).call(this, pos);
            this.graphicNode.image = 'missing-bracket';
        }
    }, {
        key: 'ondropenter',
        value: function ondropenter(node, pos) {
            if (this.accepts(node)) {
                this.graphicNode.image = 'missing-bracket-selected';
                _get(MissingBracketExpression.prototype.__proto__ || Object.getPrototypeOf(MissingBracketExpression.prototype), 'ondropenter', this).call(this, node, pos);
            }
        }
    }, {
        key: 'ondropexit',
        value: function ondropexit(node, pos) {
            if (this.accepts(node)) {
                this.graphicNode.image = 'missing-bracket';
                _get(MissingBracketExpression.prototype.__proto__ || Object.getPrototypeOf(MissingBracketExpression.prototype), 'ondropexit', this).call(this, node, pos);
            }
        }
    }, {
        key: 'ondropped',
        value: function ondropped(node, pos) {
            if (this.accepts(node)) {
                this.graphicNode.image = 'missing-bracket';
                _get(MissingBracketExpression.prototype.__proto__ || Object.getPrototypeOf(MissingBracketExpression.prototype), 'ondropped', this).call(this, node, pos);
            }
        }
    }, {
        key: 'drawInternal',
        value: function drawInternal(ctx, pos, boundingSize) {
            pos.x -= boundingSize.w / 1.1 - boundingSize.w;
            pos.y -= boundingSize.h / 1.05 - boundingSize.h;
            boundingSize.w /= 1.1;
            boundingSize.h /= 1.1;
            this.graphicNode.stroke = this.stroke;
            this.graphicNode.color = this.color;
            this.graphicNode.shadowOffset = this.shadowOffset;
            this.graphicNode.drawInternal(ctx, pos, boundingSize);
        }
    }]);

    return MissingBracketExpression;
}(MissingBagExpression);

var MissingBooleanExpression = function (_MissingTypedExpressi3) {
    _inherits(MissingBooleanExpression, _MissingTypedExpressi3);

    function MissingBooleanExpression(expr_to_miss) {
        _classCallCheck(this, MissingBooleanExpression);

        var _this6 = _possibleConstructorReturn(this, (MissingBooleanExpression.__proto__ || Object.getPrototypeOf(MissingBooleanExpression)).call(this, expr_to_miss));

        _this6._size = { w: 80, h: 50 };
        _this6.color = "#0c2c52";

        _this6.graphicNode = new mag.HexaRect(0, 0, 44, 44);

        _this6.acceptedClasses = [BooleanPrimitive, CompareExpr, UnaryOpExpr];
        return _this6;
    }

    _createClass(MissingBooleanExpression, [{
        key: 'getClass',
        value: function getClass() {
            return MissingBooleanExpression;
        }
    }, {
        key: 'drawInternal',
        value: function drawInternal(ctx, pos, boundingSize) {
            this.graphicNode.stroke = this.stroke;
            this.graphicNode.color = this.color;
            this.graphicNode.shadowOffset = this.shadowOffset;
            this.graphicNode.drawInternal(ctx, pos, boundingSize);
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '_b';
        }
    }]);

    return MissingBooleanExpression;
}(MissingTypedExpression);

var MissingKeyExpression = function (_MissingBooleanExpres) {
    _inherits(MissingKeyExpression, _MissingBooleanExpres);

    function MissingKeyExpression(expr_to_miss) {
        _classCallCheck(this, MissingKeyExpression);

        var _this7 = _possibleConstructorReturn(this, (MissingKeyExpression.__proto__ || Object.getPrototypeOf(MissingKeyExpression)).call(this, expr_to_miss));

        var keyhole = new mag.ImageRect(0, 0, 26 / 2, 42 / 2, 'lock-keyhole');
        _this7.graphicNode.addChild(keyhole);

        return _this7;
    }

    _createClass(MissingKeyExpression, [{
        key: 'drawInternal',
        value: function drawInternal(ctx, pos, boundingSize) {
            _get(MissingKeyExpression.prototype.__proto__ || Object.getPrototypeOf(MissingKeyExpression.prototype), 'drawInternal', this).call(this, ctx, pos, boundingSize);

            // Draw keyhole.
            var sz = this.graphicNode.children[0].size;
            this.graphicNode.children[0].drawInternal(ctx, addPos(pos, { x: boundingSize.w / 2.0 - sz.w / 2, y: boundingSize.h / 2.0 - sz.h / 2 }), sz);
        }
    }]);

    return MissingKeyExpression;
}(MissingBooleanExpression);

var MissingChestExpression = function (_MissingTypedExpressi4) {
    _inherits(MissingChestExpression, _MissingTypedExpressi4);

    function MissingChestExpression(expr_to_miss) {
        _classCallCheck(this, MissingChestExpression);

        var _this8 = _possibleConstructorReturn(this, (MissingChestExpression.__proto__ || Object.getPrototypeOf(MissingChestExpression)).call(this, expr_to_miss));

        _this8.initialize();
        _this8.acceptedClasses = [VarExpr, VtableVarExpr];
        return _this8;
    }

    _createClass(MissingChestExpression, [{
        key: 'initialize',
        value: function initialize() {
            this.image = new mag.ImageRect(0, 0, 48, 48, 'chest-silhouette');
            this.addArg(this.image);
        }
    }, {
        key: 'hitsChild',
        value: function hitsChild() {
            return null;
        }
    }, {
        key: 'getClass',
        value: function getClass() {
            return MissingChestExpression;
        }
    }, {
        key: 'accepts',
        value: function accepts(expr) {
            return expr instanceof VarExpr || expr instanceof VtableVarExpr && !expr.subReduceMethod;
        }
    }]);

    return MissingChestExpression;
}(MissingTypedExpression);

var MissingVariableExpression = function (_MissingChestExpressi) {
    _inherits(MissingVariableExpression, _MissingChestExpressi);

    function MissingVariableExpression() {
        _classCallCheck(this, MissingVariableExpression);

        return _possibleConstructorReturn(this, (MissingVariableExpression.__proto__ || Object.getPrototypeOf(MissingVariableExpression)).apply(this, arguments));
    }

    _createClass(MissingVariableExpression, [{
        key: 'getClass',
        value: function getClass() {
            return MissingVariableExpression;
        }
    }, {
        key: 'initialize',
        value: function initialize() {
            this.label = new TextExpr("xy");
            this.label.color = "#AAA";
            this.addArg(this.label);
        }
    }]);

    return MissingVariableExpression;
}(MissingChestExpression);

var MissingLambdaExpression = function (_MissingTypedExpressi5) {
    _inherits(MissingLambdaExpression, _MissingTypedExpressi5);

    _createClass(MissingLambdaExpression, [{
        key: 'getClass',
        value: function getClass() {
            return MissingLambdaExpression;
        }
    }, {
        key: 'hitsChild',
        value: function hitsChild() {
            return null;
        }
    }]);

    function MissingLambdaExpression(e) {
        _classCallCheck(this, MissingLambdaExpression);

        var _this10 = _possibleConstructorReturn(this, (MissingLambdaExpression.__proto__ || Object.getPrototypeOf(MissingLambdaExpression)).call(this, e));

        _this10.acceptedClasses = [LambdaExpr];
        _this10.label = new TextExpr("=>");
        _this10.label.color = "#000";
        _this10.addArg(_this10.label);
        return _this10;
    }

    return MissingLambdaExpression;
}(MissingTypedExpression);

var MissingSequenceExpression = function (_MissingExpression2) {
    _inherits(MissingSequenceExpression, _MissingExpression2);

    function MissingSequenceExpression() {
        _classCallCheck(this, MissingSequenceExpression);

        return _possibleConstructorReturn(this, (MissingSequenceExpression.__proto__ || Object.getPrototypeOf(MissingSequenceExpression)).call(this, new Expression()));
    }

    _createClass(MissingSequenceExpression, [{
        key: 'getClass',
        value: function getClass() {
            return MissingSequenceExpression;
        }
    }, {
        key: 'ondropped',
        value: function ondropped(node, pos) {
            _get(MissingSequenceExpression.prototype.__proto__ || Object.getPrototypeOf(MissingSequenceExpression.prototype), 'ondropped', this).call(this, node, pos);
            node.lockInteraction();
        }
    }]);

    return MissingSequenceExpression;
}(MissingExpression);

var InvisibleMissingExpression = function (_MissingExpression3) {
    _inherits(InvisibleMissingExpression, _MissingExpression3);

    function InvisibleMissingExpression() {
        _classCallCheck(this, InvisibleMissingExpression);

        return _possibleConstructorReturn(this, (InvisibleMissingExpression.__proto__ || Object.getPrototypeOf(InvisibleMissingExpression)).call(this, new Expression()));
    }

    _createClass(InvisibleMissingExpression, [{
        key: 'getClass',
        value: function getClass() {
            return InvisibleMissingExpression;
        }
    }, {
        key: 'drawInternal',
        value: function drawInternal(ctx, pos, boundingSize) {
            if (this.stroke) {
                ctx.fillStyle = this.stroke.color;
                ctx.globalAlpha = 0.5;
                ctx.fillRect(pos.x, pos.y, boundingSize.w, boundingSize.h);
            }
        }
    }]);

    return InvisibleMissingExpression;
}(MissingExpression);

var MissingNumberExpression = function (_MissingTypedExpressi6) {
    _inherits(MissingNumberExpression, _MissingTypedExpressi6);

    function MissingNumberExpression(expr_to_miss) {
        _classCallCheck(this, MissingNumberExpression);

        var _this13 = _possibleConstructorReturn(this, (MissingNumberExpression.__proto__ || Object.getPrototypeOf(MissingNumberExpression)).call(this, expr_to_miss));

        _this13.graphicNode = new mag.ImageRect(0, 0, 24, 32, ExprManager.getFadeLevel('number') > 0 ? 'missing-number' : 'die');

        _this13.acceptedClasses = [VarExpr, NumberExpr, ObjectExtensionExpr, NamedExpr];
        return _this13;
    }

    _createClass(MissingNumberExpression, [{
        key: 'getClass',
        value: function getClass() {
            return MissingNumberExpression;
        }
    }, {
        key: 'drawInternal',
        value: function drawInternal(ctx, pos, boundingSize) {
            _get(MissingNumberExpression.prototype.__proto__ || Object.getPrototypeOf(MissingNumberExpression.prototype), 'drawInternal', this).call(this, ctx, pos, boundingSize);
            this.graphicNode.color = '#111';
            this.graphicNode.shadowOffset = this.shadowOffset;
            var subPos = {
                x: pos.x + 0.1 * boundingSize.w,
                y: pos.y + 0.1 * boundingSize.h
            };
            var subSize = {
                w: 0.8 * boundingSize.w,
                h: 0.8 * boundingSize.h
            };
            this.graphicNode.drawInternal(ctx, subPos, subSize);
        }
    }]);

    return MissingNumberExpression;
}(MissingTypedExpression);