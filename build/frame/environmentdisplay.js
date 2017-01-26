"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EnvironmentDisplay = function (_Expression) {
    _inherits(EnvironmentDisplay, _Expression);

    function EnvironmentDisplay(x, y, w, h) {
        _classCallCheck(this, EnvironmentDisplay);

        var _this = _possibleConstructorReturn(this, (EnvironmentDisplay.__proto__ || Object.getPrototypeOf(EnvironmentDisplay)).call(this, []));

        _this._pos = { x: x, y: y };
        _this._size = { w: w, h: h };
        _this.padding = { left: 0, inner: 20, between: 15, right: 0 };

        _this._layout = { direction: "vertical", align: "horizontal" };
        _this.bindings = {};
        _this._state = 'open';
        _this._height = 1.0;
        _this._animation = null;
        return _this;
    }

    _createClass(EnvironmentDisplay, [{
        key: "updateBinding",
        value: function updateBinding(name, expr) {
            var display = this.bindings[name];
            if (!display) {
                display = new (ExprManager.getClass('reference_display'))(name, new MissingExpression(new Expression()));
                this.bindings[name] = display;
            }
            display.ignoreEvents = true;
            if (expr) {
                expr = expr.clone();
                expr.scale = { x: 1, y: 1 };
                expr.anchor = { x: 0, y: 0.5 };
                expr.unlock();
                expr.update();
                display.setExpr(expr);
            }
        }
    }, {
        key: "getEnvironment",
        value: function getEnvironment() {
            return this.stage.environment;
        }
    }, {
        key: "updateBindings",
        value: function updateBindings() {
            var _this2 = this;

            if (this.stage) window.stage = this.stage;

            if (!this.stage) return;

            var env = this.getEnvironment();

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = Object.keys(env.bound)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var name = _step.value;

                    this.updateBinding(name, env.lookupDirect(name));
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

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = env.names()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _name = _step2.value;

                    this.updateBinding(_name, env.lookup(_name));
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

            this.holes = this.children = Object.keys(this.bindings).sort().map(function (name) {
                return _this2.bindings[name];
            });
        }
    }, {
        key: "update",
        value: function update() {
            this.updateBindings();
            _get(EnvironmentDisplay.prototype.__proto__ || Object.getPrototypeOf(EnvironmentDisplay.prototype), "update", this).call(this);
        }
    }, {
        key: "highlight",
        value: function highlight(name) {
            var display = this.bindings[name];
            if (display) {
                Animate.blink(display.getExpr());
            }
        }
    }, {
        key: "drawBackground",
        value: function drawBackground(ctx, pos, boundingSize) {
            ctx.fillStyle = '#FFF8DC';
            ctx.fillRect(pos.x, pos.y, boundingSize.w, boundingSize.h);
        }
    }, {
        key: "drawInternal",
        value: function drawInternal(ctx, pos, boundingSize) {
            this.drawBackground(ctx, pos, boundingSize);
        }

        // Show an animation in preparation for updating a binding

    }, {
        key: "prepareAssign",
        value: function prepareAssign(name) {
            if (this.bindings[name] && this.bindings[name].prepareAssign) {
                return this.bindings[name].prepareAssign();
            }
            return null;
        }
    }, {
        key: "getBinding",
        value: function getBinding(name) {
            return this.bindings[name];
        }
    }, {
        key: "pos",
        get: function get() {
            return this._pos;
        },
        set: function set(pos) {}
    }, {
        key: "size",
        get: function get() {
            return this._size;
        }
    }, {
        key: "_origPos",
        get: function get() {
            return _get(EnvironmentDisplay.prototype.__proto__ || Object.getPrototypeOf(EnvironmentDisplay.prototype), "pos", this);
        }
    }, {
        key: "_origSize",
        get: function get() {
            return _get(EnvironmentDisplay.prototype.__proto__ || Object.getPrototypeOf(EnvironmentDisplay.prototype), "size", this);
        }
    }]);

    return EnvironmentDisplay;
}(Expression);

var SpreadsheetEnvironmentDisplay = function (_EnvironmentDisplay) {
    _inherits(SpreadsheetEnvironmentDisplay, _EnvironmentDisplay);

    function SpreadsheetEnvironmentDisplay(x, y, w, h) {
        _classCallCheck(this, SpreadsheetEnvironmentDisplay);

        var _this3 = _possibleConstructorReturn(this, (SpreadsheetEnvironmentDisplay.__proto__ || Object.getPrototypeOf(SpreadsheetEnvironmentDisplay)).call(this, x, y, w, h));

        _this3._layout = { direction: "vertical", align: "none" };
        _this3.padding = { left: 0, inner: 0, between: 0, right: 0 };
        _this3.maxLabelSize = 30;
        return _this3;
    }

    _createClass(SpreadsheetEnvironmentDisplay, [{
        key: "updateBindings",
        value: function updateBindings(env) {
            var _this4 = this;

            _get(SpreadsheetEnvironmentDisplay.prototype.__proto__ || Object.getPrototypeOf(SpreadsheetEnvironmentDisplay.prototype), "updateBindings", this).call(this, env);

            this.holes = Object.keys(this.bindings).sort().map(function (name) {
                return _this4.bindings[name];
            });
            this.holes.forEach(function (e) {
                _this4.maxLabelSize = Math.max(_this4.maxLabelSize, e.nameLabel.pos.x + e.nameLabel.size.w);
            });
            this.holes.forEach(function (e) {
                e.valuePos = _this4.maxLabelSize + 5;
            });
        }
    }, {
        key: "drawInternal",
        value: function drawInternal(ctx, pos, boundingSize) {
            _get(SpreadsheetEnvironmentDisplay.prototype.__proto__ || Object.getPrototypeOf(SpreadsheetEnvironmentDisplay.prototype), "drawInternal", this).call(this, ctx, pos, boundingSize);
            this.drawGrid(ctx);
        }
    }, {
        key: "drawGrid",
        value: function drawGrid(ctx) {
            var _this5 = this;

            ctx.save();
            ctx.beginPath();
            ctx.lineWidth = 0.5;

            var y = this.absolutePos.y;
            this.holes.forEach(function (display) {
                y = display.absolutePos.y + display.absoluteSize.h / 2;
                ctx.moveTo(display.absolutePos.x, y);
                ctx.lineTo(display.absolutePos.x + _this5.absoluteSize.w, y);
            });

            var maxY = this.absolutePos.y + this.absoluteSize.h - 42.5;
            while (y < maxY) {
                y += 42.5;
                ctx.moveTo(this.absolutePos.x, Math.floor(y));
                ctx.lineTo(this.absolutePos.x + this.absoluteSize.w, Math.floor(y));
            }

            ctx.moveTo(this.absolutePos.x + this.maxLabelSize, this.absolutePos.y);
            ctx.lineTo(this.absolutePos.x + this.maxLabelSize, this.absolutePos.y + this.absoluteSize.h);
            ctx.stroke();
            ctx.restore();
        }
    }]);

    return SpreadsheetEnvironmentDisplay;
}(EnvironmentDisplay);