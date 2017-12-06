'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// A 'functional' wrapper to replication,
// for replacing x => xx and x => xxx.

var GiveExpr = function (_Expression) {
    _inherits(GiveExpr, _Expression);

    function GiveExpr(numExpr, exprToReplicate) {
        _classCallCheck(this, GiveExpr);

        var txt = new TextExpr('give');
        var txtof = new TextExpr('of');

        var _this = _possibleConstructorReturn(this, (GiveExpr.__proto__ || Object.getPrototypeOf(GiveExpr)).call(this, [txt, numExpr, txtof, exprToReplicate]));

        _this.padding = {
            left: 14,
            inner: 12,
            right: 14
        };

        // this.color = 'Plum';
        // this.reducableStrokeColor = 'Magenta';
        _this.color = 'YellowGreen';
        return _this;
    }

    _createClass(GiveExpr, [{
        key: 'canReduce',
        value: function canReduce() {
            return this.amountToGive > -1 && !this.exprToReplicate.isPlaceholder() && !(this.hasTextbox() || this.hasPlaceholder());
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            if (!this.canReduce()) return this;

            var n = this.amountToGive;
            if (n > 0) {
                var expr = this.exprToReplicate;
                var a = new Array(n);
                for (var i = 0; i < n; i++) {
                    a[i] = expr.clone();
                }return a;
            } else return [];
        }
    }, {
        key: 'onmouseclick',
        value: function onmouseclick() {
            this.performUserReduction();
        }
    }, {
        key: 'performReduction',
        value: function performReduction() {
            var _this2 = this;

            var animated = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
            var logChangeData = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;


            if (this.hasTextbox() || this.hasPlaceholder()) {
                this.animatePlaceholderChildren();
                Promise.reject("Has placeholder");
            }

            var reduced_exprs = this.reduce();
            if (reduced_exprs != this) {

                var swap = function swap() {
                    if (!_this2.stage) return Promise.reject();

                    var stage = _this2.stage;

                    // Layout the reduced exprs horizontally:
                    var pos = _this2.upperLeftPos();
                    var padding = 4;
                    var give_sz = _this2.absoluteSize;
                    var full_w = reduced_exprs.reduce(function (acc, e) {
                        return e.absoluteSize.w + padding + acc;
                    }, 0);
                    var x = pos.x;var y = pos.y;
                    reduced_exprs.forEach(function (e) {
                        e.pos = { x: x + (give_sz.w - full_w) / 2.0, y: y + (give_sz.h - e.absoluteSize.h) / 2.0 };
                        e.anchor = { x: 0, y: 0 };
                        e.shadowOffset = 4;
                        e.scale = { x: 1, y: 1 };
                        x += e.absoluteSize.w + padding;
                    });

                    // Before performing the reduction, save the state of the board...
                    stage.saveState();

                    // Log this reduction:
                    var js = _this2.toJavaScript();
                    var reduced_js = reduced_exprs.map(function (e) {
                        return e.toJavaScript();
                    }).join('; ');
                    Logger.log('give-replication', { 'before': js, 'after': reduced_js });
                    if (logChangeData === null) logChangeData = { name: 'give-replication',
                        before: js,
                        after: reduced_js };

                    // Remove this and replace with replicated expressions.
                    var parent = _this2.parent || stage;
                    parent.remove(_this2);
                    reduced_exprs.forEach(function (e) {
                        stage.add(e);
                        e.lockSubexpressions(function (e) {
                            return !(e instanceof LambdaHoleExpr);
                        });
                    });

                    // Call update() on the new exprs.
                    stage.update();

                    // After performing the reduction, save the new state of the board.
                    stage.saveState(logChangeData);

                    return Promise.resolve();
                };

                if (animated) return new Promise(function (resolve, _reject) {
                    var shatter = new ShatterExpressionEffect(_this2);
                    shatter.run(stage, function () {
                        _this2.ignoreEvents = false;
                        resolve();
                    }.bind(_this2));
                    _this2.ignoreEvents = true;
                }).then(swap);else return swap();
            }
            return Promise.reject("Cannot reduce!");
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
            return 'give(' + this.numExpr.toJavaScript() + ', ' + this.exprToReplicate.toJavaScript() + ')';
        }
    }, {
        key: 'exprToReplicate',
        get: function get() {
            return this.holes[3];
        }
    }, {
        key: 'numExpr',
        get: function get() {
            return this.holes[1];
        }
    }, {
        key: 'amountToGive',
        get: function get() {
            if (this.numExpr.isPlaceholder()) return -1;else if (this.numExpr instanceof NumberExpr) {
                var amount = this.numExpr.value();
                if (amount >= 0) return amount;else return -1;
            } else {
                console.warn('Cannot get amount.\n\
                First try reducing the number expr;\ it\'s a ', this.numExpr.constructor.name, ' type.');
                return -1;
            }
        }
    }]);

    return GiveExpr;
}(Expression);