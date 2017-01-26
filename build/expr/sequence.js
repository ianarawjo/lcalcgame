"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Sequence = function (_Expression) {
    _inherits(Sequence, _Expression);

    function Sequence() {
        _classCallCheck(this, Sequence);

        var _this = _possibleConstructorReturn(this, (Sequence.__proto__ || Object.getPrototypeOf(Sequence)).call(this, []));

        for (var _len = arguments.length, exprs = Array(_len), _key = 0; _key < _len; _key++) {
            exprs[_key] = arguments[_key];
        }

        exprs.forEach(function (expr) {
            if (expr instanceof MissingExpression) {
                expr = new MissingSequenceExpression();
            }
            _this.holes.push(expr);
        });
        _this._layout = { direction: "vertical", align: "none" };
        _this._animating = false;
        return _this;
    }

    _createClass(Sequence, [{
        key: "canReduce",
        value: function canReduce() {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.holes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var expr = _step.value;

                    if (expr instanceof MissingExpression) return false;
                    if (!expr.isComplete()) return false;
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
    }, {
        key: "update",
        value: function update() {
            _get(Sequence.prototype.__proto__ || Object.getPrototypeOf(Sequence.prototype), "update", this).call(this);
            var width = 75;
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this.holes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var expr = _step2.value;

                    width = Math.max(width, expr.size.w);
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

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = this.holes[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var _expr = _step3.value;

                    if (_expr instanceof MissingExpression) {
                        _expr._size = { w: width, h: _expr.size.h };
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

            _get(Sequence.prototype.__proto__ || Object.getPrototypeOf(Sequence.prototype), "update", this).call(this);
        }
    }, {
        key: "performReduction",
        value: function performReduction() {
            var _this2 = this;

            if (!this.canReduce()) {
                mag.Stage.getNodesWithClass(MissingExpression, [], true, [this]).forEach(function (node) {
                    Animate.blink(node);
                });
                return null;
            }

            this._animating = true;

            this.holes.forEach(function (expr) {
                return expr.lock();
            });
            var reduced = [];
            return new Promise(function (resolve, reject) {
                var nextStep = function nextStep() {
                    if (_this2.holes.length === 0) {
                        Animate.poof(_this2);
                        (_this2.parent || _this2.stage).swap(_this2, null);
                        resolve(null);
                    } else {
                        (function () {
                            var expr = _this2.holes[0];
                            var result = expr.performReduction();
                            var delay = function delay(newExpr) {
                                _this2.holes.shift();
                                _this2.update();
                                reduced.push(newExpr);
                                if (newExpr instanceof Expression) newExpr.lock();
                                window.setTimeout(function () {
                                    nextStep();
                                }, delay);
                            };
                            if (result instanceof Promise) {
                                result.then(delay, function () {
                                    // Uh-oh, an error happened
                                    _this2._animating = false;
                                    while (_this2.holes.length > 0 && _this2.holes[0] instanceof MissingExpression) {
                                        _this2.holes.shift();
                                    }
                                    _this2.update();

                                    Animate.blink(_this2, 1000, [1.0, 0.0, 0.0]);
                                    reject();
                                });
                            } else {
                                delay(result || expr);
                            }
                        })();
                    }
                };
                nextStep();
            });
        }
    }, {
        key: "onmouseclick",
        value: function onmouseclick() {
            if (!this._animating) {
                this.performReduction();
            }
        }
    }]);

    return Sequence;
}(Expression);