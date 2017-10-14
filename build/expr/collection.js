'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CollectionExpr = function (_GraphicValueExpr) {
    _inherits(CollectionExpr, _GraphicValueExpr);

    function CollectionExpr() {
        _classCallCheck(this, CollectionExpr);

        return _possibleConstructorReturn(this, (CollectionExpr.__proto__ || Object.getPrototypeOf(CollectionExpr)).apply(this, arguments));
    }

    return CollectionExpr;
}(GraphicValueExpr);

var BagExpr = function (_CollectionExpr) {
    _inherits(BagExpr, _CollectionExpr);

    function BagExpr(x, y, w, h) {
        var holding = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];

        _classCallCheck(this, BagExpr);

        //super(new Bag(x, y, w, h));
        var radius = (w + h) / 4.0;

        var _this2 = _possibleConstructorReturn(this, (BagExpr.__proto__ || Object.getPrototypeOf(BagExpr)).call(this, new Bag(x, y, radius)));

        _this2._items = holding;
        _this2.bigScale = 4;

        if (_this2.graphicNode) {
            _this2.graphicNode.color = 'tan';
            _this2.graphicNode.anchor = { x: 0.5, y: 0.5 };
        }

        _this2.reducableStrokeColor = "#ddd";

        //this.graphicNode.clipChildren = true;
        //this.graphicNode.clipBackground = 'bag-background';

        _this2.anchor = { x: 0.5, y: 0.5 };
        return _this2;
    }

    _createClass(BagExpr, [{
        key: 'arrangeNicely',
        value: function arrangeNicely() {
            var _this3 = this;

            var dotpos = DiceNumber.drawPositionsFor(this.items.length);
            if (dotpos.length > 0) {
                (function () {
                    // Arrange items according to dot positions.
                    var sz = _this3.graphicNode.size;
                    var topsz = _this3.graphicNode.topSize(sz.w / 2.0);
                    _this3.graphicNode.children.slice(1).forEach(function (e, idx) {
                        e.pos = { x: dotpos[idx].x * sz.w * 0.4 + topsz.w / 3.4, y: dotpos[idx].y * sz.h * 0.4 + topsz.h * 1.9 };
                    });
                })();
            }
        }
    }, {
        key: 'lock',
        value: function lock() {
            _get(BagExpr.prototype.__proto__ || Object.getPrototypeOf(BagExpr.prototype), 'lock', this).call(this);
            this.graphicNode.shadowOffset = this.shadowOffset;
        }
    }, {
        key: 'lockSubexpressions',
        value: function lockSubexpressions() {
            var filterFunc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
        }
    }, {
        key: 'unlock',
        value: function unlock() {
            _get(BagExpr.prototype.__proto__ || Object.getPrototypeOf(BagExpr.prototype), 'unlock', this).call(this);
            this.graphicNode.shadowOffset = this.shadowOffset;
            if (this.graphicNode instanceof Expression) {
                this.graphicNode.unlock();
            }
        }
    }, {
        key: 'isValue',
        value: function isValue() {
            return true;
        }

        // Adds an item to the bag.

    }, {
        key: 'addItem',
        value: function addItem(item) {

            if (item.toolbox) {
                item.detach();
                item.toolbox = null;
            }

            var scale = 1.0 / this.bigScale;
            var center = this.graphicNode.size.w / 2.0;
            var x = (item.pos.x - this.pos.x) / (1.0 / scale) + center + item.size.w / 2.0 * scale;
            var y = (item.pos.y - this.pos.y) / (1.0 / scale) + center + item.size.h / 2.0 * scale;
            item.pos = { x: x, y: y };
            item.anchor = { x: 0.5, y: 0.5 };
            item.scale = { x: scale, y: scale };
            this._items.push(item);
            this.graphicNode.addItem(item);

            item.onmouseleave();

            this.arrangeNicely();
        }

        // Removes an item from the bag and returns it.

    }, {
        key: 'popItem',
        value: function popItem() {
            var _this4 = this;

            var item = this._items.pop();
            this.graphicNode.removeAllItems();
            this._items.forEach(function (item) {
                _this4.graphicNode.addItem(item);
            });
            return item;
        }

        // Applies a lambda function over every item in the bag and
        // returns a new bag containing the new items.

    }, {
        key: 'map',
        value: function map(lambdaExpr) {
            if (!(lambdaExpr instanceof LambdaExpr) || !lambdaExpr.takesArgument) {
                console.error('@ BagExpr.applyFunc: Func expr does not take argument.');
                return undefined;
            }

            var bag = new SmallStepBagExpr();
            bag.graphicNode.reset();

            var items = this.items.map(function (i) {
                return i.clone();
            });
            bag.items = [];
            var new_items = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = items[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var item = _step.value;

                    var c = item.clone();
                    var pos = item.pos;
                    var func = lambdaExpr.clone();
                    // Do not add the lambda to the stage - it should not need
                    // this global state, and it can cause problems if it
                    // tries to trigger a save point (since it may be in an
                    // inconsistent state)

                    // this.stage.add(func);
                    func.update();
                    var new_funcs = func.applyExpr(c);
                    if (!Array.isArray(new_funcs)) new_funcs = [new_funcs];

                    // Check for null values - this means the lambda could not reduce
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = new_funcs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var new_func = _step2.value;

                            if (new_func === null || typeof new_func === "undefined") {
                                WatEffect.run(lambdaExpr);
                                return undefined;
                            }
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
                        for (var _iterator3 = new_funcs[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var _new_func = _step3.value;

                            _new_func.pos = pos;
                            _new_func.unlockSubexpressions();
                            _new_func.lockSubexpressions(function (expr) {
                                return expr instanceof ValueExpr || expr instanceof FadedValueExpr || expr instanceof BooleanPrimitive || expr.isValue();
                            }); // lock primitives
                            bag.addItem(_new_func);
                            if (!_new_func.isValue()) {
                                _new_func.unlock();
                            }
                            this.stage.remove(_new_func);
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

            return bag;
        }
    }, {
        key: 'disableSpill',
        value: function disableSpill() {
            this._spillDisabled = true;
        }

        // Spills the entire bag onto the play field.

    }, {
        key: 'spill',
        value: function spill() {
            var _this5 = this;

            var logspill = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

            if (!this.stage) {
                console.error('@ BagExpr.spill: Bag is not attached to a Stage.');
                return;
            } else if (this.parent) {
                console.error('@ BagExpr.spill: Cannot spill a bag while it\'s inside of another expression.');
                return;
            } else if (this.toolbox) {
                console.warn('@ BagExpr.spill: Cannot spill bag while it\'s inside the toolbox.');
                return;
            } else if (!__ALLOW_ARRAY_EVENTS || this._spillDisabled) return;

            var stage = this.stage;
            var items = this.items;
            var pos = this.pos;

            // GAME DESIGN CHOICE:
            // Remove the bag from the stage.
            // stage.remove(this);

            var before_str = stage.toString();
            var bag_before_str = this.toString();
            stage.saveState();
            Logger.log('state-save', stage.toString());

            // Add back all of this bags' items to the stage.
            items.forEach(function (item, index) {
                item = item.clone();
                var theta = index / items.length * Math.PI * 2;
                var rad = _this5.size.w * 1.5;
                var targetPos = addPos(pos, { x: rad * Math.cos(theta), y: rad * Math.sin(theta) });

                targetPos = clipToRect(targetPos, item.absoluteSize, { x: 25, y: 0 }, { w: GLOBAL_DEFAULT_SCREENSIZE.width - 25,
                    h: GLOBAL_DEFAULT_SCREENSIZE.height - stage.toolbox.size.h });

                item.pos = pos;
                Animate.tween(item, { 'pos': targetPos }, 100, function (elapsed) {
                    return Math.pow(elapsed, 0.5);
                });
                //item.pos = addPos(pos, { x:rad*Math.cos(theta), y:rad*Math.sin(theta) });
                item.parent = null;
                _this5.graphicNode.removeItem(item);
                item.scale = { x: 1, y: 1 };
                stage.add(item);
            });

            // Set the items in the bag back to nothing.
            this.items = [];
            this.graphicNode.removeAllItems(); // just to be sure!
            console.warn(this.graphicNode);

            // Log changes
            if (logspill) Logger.log('bag-spill', { 'before': before_str, 'after': stage.toString(), 'item': bag_before_str });

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
            var parent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

            var c = _get(BagExpr.prototype.__proto__ || Object.getPrototypeOf(BagExpr.prototype), 'clone', this).call(this, parent);
            c._items = [];
            c.graphicNode.removeAllItems();
            this.items.forEach(function (i) {
                return c.addItem(i.clone());
            });
            c.graphicNode.update();
            return c;
        }
    }, {
        key: 'value',
        value: function value() {
            return '[' + this.items.reduce(function (str, curr) {
                return str += ' ' + curr.toString();
            }, '').trim() + ']'; // Arguably should be toString of each expression, but then comparison must be setCompare.
        }
    }, {
        key: 'toString',
        value: function toString() {
            return (this.locked ? '/' : '') + '(bag' + this.items.reduce(function (str, curr) {
                return str += ' ' + curr.toString().replace('/', '');
            }, '') + ')';
        }
    }, {
        key: 'toJavaScript',
        value: function toJavaScript() {
            var itemsJS = this.items.map(function (x) {
                return x.toJavaScript();
            }).join(', ');
            return '[' + itemsJS + ']';
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
            if (node instanceof FunnelMapFunc) return;

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
            if (node instanceof FunnelMapFunc) return;

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
            if (node instanceof FunnelMapFunc) return;

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
            var before_str = this.toString();
            n.pos.x = 100; //(n.absolutePos.x - this.graphicNode.absolutePos.x + this.graphicNode.absoluteSize.w / 2.0) / this.graphicNode.absoluteSize.w;
            this.addItem(n);

            Logger.log('bag-add', { 'before': before_str, 'after': this.toString(), 'item': n.toString() });

            if (this.stage) {
                this.stage.saveState();
                Logger.log('state-save', this.stage.toString());
            } else {
                console.warn('@ BagExpr.ondroppped: Item dropped into bag which is not member of a Stage.');
            }

            Resource.play('bag-addItem');
        }
    }, {
        key: 'items',
        get: function get() {
            return this._items.slice();
        },
        set: function set(items) {
            var _this6 = this;

            this._items.forEach(function (item) {
                return _this6.graphicNode.removeItem(item);
            });
            this._items = [];
            items.forEach(function (item) {
                _this6.addItem(item);
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

var BracketBag = function (_Expression) {
    _inherits(BracketBag, _Expression);

    function BracketBag() {
        _classCallCheck(this, BracketBag);

        var _this7 = _possibleConstructorReturn(this, (BracketBag.__proto__ || Object.getPrototypeOf(BracketBag)).call(this));

        _this7.l_brak = new TextExpr('[');
        _this7.r_brak = new TextExpr(']');
        _this7.addArg(_this7.l_brak);
        _this7.addArg(_this7.r_brak);

        _this7.padding = { left: 10, inner: 0, right: 20 };
        return _this7;
    }

    _createClass(BracketBag, [{
        key: 'reset',
        value: function reset() {
            this.holes = [this.l_brak, this.r_brak];
            this.children = [this.l_brak, this.r_brak];
        }
    }, {
        key: 'swap',
        value: function swap(arg, otherArg) {
            if (this.parent) {
                var items = this.parent.items.slice();
                for (var i = 0; i < items.length; i++) {
                    if (items[i] == arg) {
                        items[i] = otherArg;
                    }
                }
                this.parent.items = items;
            }

            _get(BracketBag.prototype.__proto__ || Object.getPrototypeOf(BracketBag.prototype), 'swap', this).call(this, arg, otherArg);
        }
    }]);

    return BracketBag;
}(Expression);

/** "Faded" variant of a BagExpr. */


var BracketArrayExpr = function (_BagExpr) {
    _inherits(BracketArrayExpr, _BagExpr);

    function BracketArrayExpr(x, y, w, h) {
        var holding = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];

        _classCallCheck(this, BracketArrayExpr);

        var _this8 = _possibleConstructorReturn(this, (BracketArrayExpr.__proto__ || Object.getPrototypeOf(BracketArrayExpr)).call(this, x, y, w, h, holding));

        _this8.holes = [];
        _this8.children = [];

        // This becomes graphicNode.
        _this8.addArg(new BracketBag());

        _this8._items = holding;
        //this.color = "tan";
        return _this8;
    }

    _createClass(BracketArrayExpr, [{
        key: 'arrangeNicely',
        value: function arrangeNicely() {}
    }, {
        key: 'clone',
        value: function clone() {
            var parent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

            var c = new BracketArrayExpr(this.pos.x, this.pos.y, this.size.w, this.size.h);
            c.graphicNode.reset();
            this.items.forEach(function (i) {
                if (!(i instanceof TextExpr)) c.addItem(i.clone());
            });
            c.graphicNode.update();
            if (this.locked) c.lock();
            return c;
        }

        // Adds an item to the bag.

    }, {
        key: 'addItem',
        value: function addItem(item) {
            if (item instanceof VarExpr || item instanceof VtableVarExpr) {
                // Reduce variables in our context. This is technically
                // not correct, but at this point, we have no idea what
                // the variable's original context was anymore.
                item.parent = this;
                item = item.reduce();
            }

            item.onmouseleave();
            item.lock();

            this._items.push(item);

            if (this._items.length > 1) {
                var comma = new TextExpr(',');
                this.graphicNode.holes.splice(this.graphicNode.holes.length - 1, 0, comma);
            }

            this.graphicNode.holes.splice(this.graphicNode.holes.length - 1, 0, item);

            this.graphicNode.update();
        }

        // Removes an item from the bag and returns it.

    }, {
        key: 'popItem',
        value: function popItem() {
            var item = this._items.pop();;
            this.graphicNode.removeArg(item);
            if (this._items.length >= 1) {
                var last_comma_idx = this.graphicNode.holes.length - 2;
                this.graphicNode.holes.splice(last_comma_idx, 1);
            }
            return item;
        }

        // Spills the entire bag onto the play field.

    }, {
        key: 'spill',
        value: function spill() {
            var _this9 = this;

            var logspill = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;


            if (!this.stage) {
                console.error('@ BracketArrayExpr.spill: Array is not attached to a Stage.');
                return;
            } else if (this.parent) {
                console.error('@ BracketArrayExpr.spill: Cannot spill array while it\'s inside of another expression.');
                return;
            } else if (this.toolbox) {
                console.warn('@ BracketArrayExpr.spill: Cannot spill array while it\'s inside the toolbox.');
                return;
            } else if (!__ALLOW_ARRAY_EVENTS || this._spillDisabled) {
                // alert('You can no longer spill collections onto the board.\n\nInstead, try .pop().');
                return;
            }

            var stage = this.stage;
            var items = this.items;
            var pos = this.pos;

            // GAME DESIGN CHOICE:
            // Remove the bag from the stage.
            // stage.remove(this);

            var before_str = stage.toString();
            var bag_before_str = this.toString();
            stage.saveState();
            Logger.log('state-save', stage.toString());

            // Add back all of this bags' items to the stage.
            items.forEach(function (item, index) {

                item = item.clone();
                var theta = index / items.length * Math.PI * 2;
                var rad = _this9.size.h * 2.0;
                var targetPos = addPos(pos, { x: rad * Math.cos(theta), y: rad * Math.sin(theta) });

                targetPos = clipToRect(targetPos, item.absoluteSize, { x: 25, y: 0 }, { w: GLOBAL_DEFAULT_SCREENSIZE.width - 25,
                    h: GLOBAL_DEFAULT_SCREENSIZE.height - stage.toolbox.size.h });

                item.pos = pos;
                Animate.tween(item, { 'pos': targetPos }, 100, function (elapsed) {
                    return Math.pow(elapsed, 0.5);
                });
                //item.pos = addPos(pos, { x:rad*Math.cos(theta), y:rad*Math.sin(theta) });
                item.parent = null;
                _this9.graphicNode.removeChild(item);
                item.scale = { x: 1, y: 1 };
                stage.add(item);
            });

            // Set the items in the bag back to nothing.
            this.items = [];
            this.graphicNode.reset(); // just to be sure!
            this.graphicNode.update();

            // Log changes
            if (logspill) Logger.log('bag-spill', { 'before': before_str, 'after': stage.toString(), 'item': bag_before_str });

            // Play spill sfx
            Resource.play('bag-spill');
        }
    }, {
        key: 'ondropenter',
        value: function ondropenter(node, pos) {
            if (!__ALLOW_ARRAY_EVENTS) return;

            this.onmouseenter(pos);
        }
    }, {
        key: 'ondropexit',
        value: function ondropexit(node, pos) {
            if (!__ALLOW_ARRAY_EVENTS) return;

            this.onmouseleave(pos);
        }
    }, {
        key: 'ondropped',
        value: function ondropped(node, pos) {
            this.ondropexit(node, pos);

            if (!__ALLOW_ARRAY_EVENTS) return;

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
            var before_str = this.toString();
            this.addItem(n);

            Logger.log('bag-add', { 'before': before_str, 'after': this.toString(), 'item': n.toString() });

            if (this.stage) {
                this.stage.saveState();
                Logger.log('state-save', this.stage.toString());
            } else {
                console.warn('@ BracketArrayExpr.ondroppped: Item dropped into bag which is not member of a Stage.');
            }

            Resource.play('bag-addItem');
        }
    }, {
        key: 'items',
        get: function get() {
            return this._items.slice();
        },
        set: function set(items) {
            var _this10 = this;

            this._items.forEach(function (item) {
                return _this10.graphicNode.removeArg(item);
            });
            this._items = [];
            items.forEach(function (item) {
                _this10.addItem(item);
            });
        }
    }, {
        key: 'delegateToInner',
        get: function get() {
            return true;
        }
    }]);

    return BracketArrayExpr;
}(BagExpr);

/** Collections */


var PutExpr = function (_Expression2) {
    _inherits(PutExpr, _Expression2);

    function PutExpr(item, collection) {
        _classCallCheck(this, PutExpr);

        var txt_put = new TextExpr('put');
        var txt_in = new TextExpr('in');
        txt_put.color = 'black';
        txt_in.color = 'black';

        var _this11 = _possibleConstructorReturn(this, (PutExpr.__proto__ || Object.getPrototypeOf(PutExpr)).call(this, [txt_put, item, txt_in, collection]));

        _this11.color = 'violet';
        return _this11;
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

var PopExpr = function (_Expression3) {
    _inherits(PopExpr, _Expression3);

    function PopExpr(collection) {
        _classCallCheck(this, PopExpr);

        var txt_pop = new TextExpr('pop');
        txt_pop.color = 'black';

        var _this12 = _possibleConstructorReturn(this, (PopExpr.__proto__ || Object.getPrototypeOf(PopExpr)).call(this, [txt_pop, collection]));

        _this12.color = 'violet';
        return _this12;
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

var SmallStepBagExpr = function (_BracketArrayExpr) {
    _inherits(SmallStepBagExpr, _BracketArrayExpr);

    function SmallStepBagExpr(x, y, w, h) {
        var holding = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];

        _classCallCheck(this, SmallStepBagExpr);

        var _this13 = _possibleConstructorReturn(this, (SmallStepBagExpr.__proto__ || Object.getPrototypeOf(SmallStepBagExpr)).call(this, x, y, w, h, holding));

        _this13.overlay = false;
        _this13.finished = false;
        _this13.ignoreAutoResize = true;
        return _this13;
    }

    _createClass(SmallStepBagExpr, [{
        key: 'start',
        value: function start() {
            if (!this.overlay && !this.finished) {
                this.overlay = true;
                var overlay = this.stage.showOverlay(0.5);
                var stage = this.stage;
                stage.remove(this);
                stage.add(this);
                this.overlayNode = overlay;
            }
        }
    }, {
        key: 'onmouseenter',
        value: function onmouseenter() {}
    }, {
        key: 'onmousedrag',
        value: function onmousedrag() {}
    }, {
        key: 'finish',
        value: function finish() {
            var _this14 = this;

            if (!this.finished) {
                (function () {
                    var stage = _this14.stage;
                    var clone = new BracketArrayExpr();
                    _this14.items.forEach(clone.addItem.bind(clone));
                    (_this14.parent || _this14.stage).swap(_this14, clone);
                    if (_this14.overlayNode) {
                        Animate.tween(_this14.overlayNode, {
                            opacity: 0
                        }, 1000).after(function () {
                            stage.remove(_this14.overlayNode);
                            stage.ranResetNotifier = false;
                            stage.update();
                        });
                    }
                    _this14.finished = true;
                    _this14.overlay = false;
                })();
            }
        }
    }, {
        key: 'update',
        value: function update() {
            // Fix the position
            if (this.stage) {
                var pos = clonePos(this.pos);
                this.anchor = { x: 0, y: 0.5 };
                if (this.absoluteSize.w < this.stage.boundingSize.w) {
                    pos.x = (this.stage.boundingSize.w - this.absoluteSize.w) / 2;
                } else {
                    var offset = 0;
                    var _iteratorNormalCompletion4 = true;
                    var _didIteratorError4 = false;
                    var _iteratorError4 = undefined;

                    try {
                        for (var _iterator4 = this._items[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                            var item = _step4.value;

                            if (!item.isValue() || item.canReduce()) {
                                pos.x = -offset + 50;
                                break;
                            }
                            offset += item.absoluteSize.w;
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

                this.pos = pos;
            }

            _get(SmallStepBagExpr.prototype.__proto__ || Object.getPrototypeOf(SmallStepBagExpr.prototype), 'update', this).call(this);

            if (this._items.every(function (n) {
                return n.isValue() || !n.canReduce();
            })) {
                this.finish();
            }

            if (this.stage && !this.overlay && !this.finished) {
                this.start();
            }
        }
    }, {
        key: 'addItem',
        value: function addItem(item) {
            item.onmousedrag = function () {};
            item.forceReducibilityIndicator = true;
            _get(SmallStepBagExpr.prototype.__proto__ || Object.getPrototypeOf(SmallStepBagExpr.prototype), 'addItem', this).call(this, item);
        }
    }, {
        key: 'isValue',
        value: function isValue() {
            return false;
        }
    }, {
        key: 'items',
        get: function get() {
            return this._items.slice();
        },
        set: function set(items) {
            var _this15 = this;

            this._items.forEach(function (item) {
                return _this15.graphicNode.removeArg(item);
            });
            this.graphicNode.reset();
            this._items = [];
            items.forEach(function (item) {
                _this15.addItem(item);
                item.onmousedrag = function () {};
                if (!item.isValue()) {
                    item.unlock();
                    item.forceReducibilityIndicator = true;
                }
            });
            this.graphicNode.update();
            if (this.stage) _get(SmallStepBagExpr.prototype.__proto__ || Object.getPrototypeOf(SmallStepBagExpr.prototype), 'update', this).call(this);
        }
    }]);

    return SmallStepBagExpr;
}(BracketArrayExpr);