'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

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
        key: 'isComplete',
        value: function isComplete() {
            return false;
        }
    }, {
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
            _get(MissingExpression.prototype.__proto__ || Object.getPrototypeOf(MissingExpression.prototype), 'ondropped', this).call(this, node, pos);
            if (node.dragging) {
                // Reattach node.

                // Should not be able to stick lambdas in MissingExpression holes (exception of Map)
                if (node instanceof LambdaExpr && !(this.parent instanceof MapFunc)) return;

                var stage = this.stage;
                var beforeState = stage.toString();
                var droppedExp = node.toString();

                Resource.play('pop');
                node.stage.remove(node);
                node.droppedInClass = this.getClass();
                this.parent.swap(this, node); // put it back

                var afterState = stage.toString();
                Logger.log('placed-expr', { 'before': beforeState, 'after': afterState, 'item': droppedExp });

                stage.saveState();
                Logger.log('state-save', afterState);

                // Blink red if total reduction is not possible with this config.
                /*var try_reduce = node.parent.reduceCompletely();
                if (try_reduce == node.parent || try_reduce === null) {
                    Animate.blink(node.parent, 400, [1,0,0]);
                }*/

                // Blink blue if reduction is possible with this config.
                var try_reduce = node.parent.reduceCompletely();
                if (try_reduce != node.parent && try_reduce !== undefined) {
                    Animate.blink(node.parent, 1000, [1, 1, 0], 1);
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

        // graphicNode is undefined, don't use this
        // drawInternal(ctx, pos, boundingSize) {
        //     pos.x -= boundingSize.w / 1.2 - boundingSize.w;
        //     pos.y -= boundingSize.h / 1.14 - boundingSize.h; // aesthetic resizing
        //     boundingSize.w /= 1.2;
        //     this.graphicNode.stroke = this.stroke;
        //     this.graphicNode.color = this.color;
        //     this.graphicNode.shadowOffset = this.shadowOffset;
        //     this.graphicNode.drawInternal(ctx, pos, boundingSize);
        // }

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

        var _this3 = _possibleConstructorReturn(this, (MissingBagExpression.__proto__ || Object.getPrototypeOf(MissingBagExpression)).call(this, expr_to_miss));

        _this3._size = { w: 50, h: 50 };
        _this3.graphicNode = new Bag(0, 0, 22, false);
        _this3.acceptedClasses = [BagExpr, PutExpr];
        return _this3;
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

        var _this4 = _possibleConstructorReturn(this, (MissingBracketExpression.__proto__ || Object.getPrototypeOf(MissingBracketExpression)).call(this, expr_to_miss));

        _this4.graphicNode = new mag.ImageRect(0, 0, 22, 22, 'missing-bracket');
        return _this4;
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

var MissingBooleanExpression = function (_MissingTypedExpressi2) {
    _inherits(MissingBooleanExpression, _MissingTypedExpressi2);

    function MissingBooleanExpression(expr_to_miss) {
        _classCallCheck(this, MissingBooleanExpression);

        var _this5 = _possibleConstructorReturn(this, (MissingBooleanExpression.__proto__ || Object.getPrototypeOf(MissingBooleanExpression)).call(this, expr_to_miss));

        _this5._size = { w: 80, h: 50 };
        _this5.color = "#0c2c52";

        _this5.graphicNode = new mag.HexaRect(0, 0, 44, 44);

        _this5.acceptedClasses = [BooleanPrimitive, CompareExpr];
        return _this5;
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

        var _this6 = _possibleConstructorReturn(this, (MissingKeyExpression.__proto__ || Object.getPrototypeOf(MissingKeyExpression)).call(this, expr_to_miss));

        var keyhole = new mag.ImageRect(0, 0, 26 / 2, 42 / 2, 'lock-keyhole');
        _this6.graphicNode.addChild(keyhole);

        return _this6;
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

var MissingChestExpression = function (_MissingTypedExpressi3) {
    _inherits(MissingChestExpression, _MissingTypedExpressi3);

    function MissingChestExpression(expr_to_miss) {
        _classCallCheck(this, MissingChestExpression);

        var _this7 = _possibleConstructorReturn(this, (MissingChestExpression.__proto__ || Object.getPrototypeOf(MissingChestExpression)).call(this, expr_to_miss));

        _this7.label = new TextExpr("xy");
        _this7.holes.push(_this7.label);
        return _this7;
    }

    _createClass(MissingChestExpression, [{
        key: 'getClass',
        value: function getClass() {
            return MissingChestExpression;
        }
    }]);

    return MissingChestExpression;
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