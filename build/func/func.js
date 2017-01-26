'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Special function expressions inside the game, like map, fold, etc.
 */

var FuncExpr = function (_Expression) {
    _inherits(FuncExpr, _Expression);

    function FuncExpr() {
        _classCallCheck(this, FuncExpr);

        return _possibleConstructorReturn(this, (FuncExpr.__proto__ || Object.getPrototypeOf(FuncExpr)).apply(this, arguments));
    }

    _createClass(FuncExpr, [{
        key: 'updateArrowPaths',
        value: function updateArrowPaths() {}
    }, {
        key: 'update',
        value: function update() {
            _get(FuncExpr.prototype.__proto__ || Object.getPrototypeOf(FuncExpr.prototype), 'update', this).call(this);
            this.updateArrowPaths();
        }
    }, {
        key: 'onmouseclick',
        value: function onmouseclick(pos) {
            this.performReduction();
        }
    }, {
        key: 'draw',
        value: function draw(ctx, offset) {
            _get(FuncExpr.prototype.__proto__ || Object.getPrototypeOf(FuncExpr.prototype), 'draw', this).call(this, ctx, offset);

            // Annoying hack until I divorce this.children from this.holes...
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.arrowPaths[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var arrow = _step.value;

                    arrow.parent = this;
                    arrow.draw(ctx, offset);
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
        key: 'arrowPaths',
        set: function set(paths) {
            this._arrows = paths;
        },
        get: function get() {
            return this._arrows.slice();
        }
    }], [{
        key: 'arrowPathColor',
        value: function arrowPathColor() {
            return 'DarkGreen';
        }
    }]);

    return FuncExpr;
}(Expression);

var MapFunc = function (_FuncExpr) {
    _inherits(MapFunc, _FuncExpr);

    function MapFunc(oneParamFunc, bag) {
        _classCallCheck(this, MapFunc);

        //let txt = new TextExpr('map');

        var returnBag = new BagExpr(0, 0, 54, 54);
        returnBag.lock();

        var _this3 = _possibleConstructorReturn(this, (MapFunc.__proto__ || Object.getPrototypeOf(MapFunc)).call(this, [returnBag, oneParamFunc, bag]));

        _this3._arrows = [];
        _this3.exprOffsetY = DEFAULT_EXPR_HEIGHT / 4.0;
        _this3.heightScalar = 1.5;
        _this3.animatedReduction = true;
        _this3.update();

        _this3.color = "YellowGreen";
        return _this3;
    }

    _createClass(MapFunc, [{
        key: 'updateArrowPaths',
        value: function updateArrowPaths() {
            // Arrow from func expr to left bag:
            function topMiddlePoint(expr) {
                return expr.posOnRectAt(CONST.POS.UNITSQUARE.TOP.MID());
            }
            function leftMiddlePoint(expr) {
                return expr.posOnRectAt(CONST.POS.UNITSQUARE.LEFT.MID());
            }
            function rightMiddlePoint(expr) {
                return expr.posOnRectAt(CONST.POS.UNITSQUARE.RIGHT.MID());
            }
            function topMiddleFuncHolePoint(func) {
                if (func.holes.length > 0) return func.posOnRectAt({ x: (func.holes[0].pos.x + func.holes[0].size.w) / func.absoluteSize.w, y: 0 });else return func.posOnRectAt({ x: 0.25, y: 0 });
            }

            // Create arrow paths.
            var funcToReturnBagArrowPath = new ArrowPath();
            var topY = this.func.pos.y - this.func.size.h / 2.0 - 12;
            var betweenReturnBagAndFunc = middleOf(rightMiddlePoint(this.returnBag), leftMiddlePoint(this.func));
            var betweenReturnBagAndFuncTop = { x: betweenReturnBagAndFunc.x, y: topY };
            var returnBagTopMid = topMiddlePoint(this.returnBag);
            var returnBagTopMidTop = { x: returnBagTopMid.x, y: topY };
            funcToReturnBagArrowPath.addPoint(leftMiddlePoint(this.func));
            funcToReturnBagArrowPath.addPoint(betweenReturnBagAndFunc);
            funcToReturnBagArrowPath.addPoint(betweenReturnBagAndFuncTop);
            funcToReturnBagArrowPath.addPoint(returnBagTopMidTop);
            funcToReturnBagArrowPath.addPoint(returnBagTopMid);
            funcToReturnBagArrowPath.parent = this;
            this.funcToReturnBagArrowPath = funcToReturnBagArrowPath;
            funcToReturnBagArrowPath.color = MapFunc.arrowPathColor();

            var bagToFuncArrowPath = new ArrowPath();
            var leftBag = topMiddlePoint(this.bag);
            var leftBagTop = { x: leftBag.x, y: topY };
            var funcHoleMid = topMiddleFuncHolePoint(this.func);
            var funcHoleMidTop = { x: funcHoleMid.x, y: topY };
            bagToFuncArrowPath.addPoint(leftBag);
            bagToFuncArrowPath.addPoint(leftBagTop);
            bagToFuncArrowPath.addPoint(funcHoleMidTop);
            bagToFuncArrowPath.addPoint(funcHoleMid);
            bagToFuncArrowPath.parent = this;
            this.bagToFuncArrowPath = bagToFuncArrowPath;
            bagToFuncArrowPath.color = MapFunc.arrowPathColor();

            this.arrowPaths = [bagToFuncArrowPath, funcToReturnBagArrowPath];
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '(map ' + this.func.toString() + ' ' + this.bag.toString() + ')';
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            this.update();
            if (!this.bag || !this.func) return this;else if (!(this.bag instanceof BagExpr)) {
                console.error('@ MapFunc.reduce: Bag param is not a BagExpr.');
                return this;
            } else if (this.func instanceof LambdaExpr && this.func.takesArgument && this.func.fullyDefined) {

                // Accepts at least one argument. Apply func over all items in the bag.
                console.log('@ MapFunc: Mapping', this.func, this.bag);
                return this.bag.map(this.func);
            } else return this;
        }
    }, {
        key: 'reduceCompletely',
        value: function reduceCompletely() {
            // A map's reduce function is the most complete reduction possible.
            return this.reduce();
        }
    }, {
        key: 'performReduction',
        value: function performReduction() {
            var _this4 = this;

            var reduced_expr = this.reduce();
            if (!this.isAnimating && reduced_expr && reduced_expr != this) {
                var superReduce;
                var bagAfterMap;
                var popCount;

                var _this;

                var bagToFuncArrowPath;
                var bag;
                var mapSize;
                var mapCenterPos;

                var _runNextAnim;

                var _ret = function () {

                    var stage = _this4.stage;
                    var func = _this4.func;
                    var bagCopy = _this4.bag.clone();

                    superReduce = function superReduce() {
                        _this4.bag = bagCopy;
                        _this4.update();
                        _this4.bag = _get(MapFunc.prototype.__proto__ || Object.getPrototypeOf(MapFunc.prototype), 'performReduction', _this4).call(_this4);
                        stage.draw();
                    };

                    // Run 'map' animation.


                    if (_this4.bag instanceof BagExpr) {

                        // debug
                        if (!_this4.animatedReduction) {
                            superReduce();
                            _this4.bag.spill(false); // don't log this spill
                            stage.remove(_this4.bag);
                            return {
                                v: void 0
                            };
                        } else _this4.bag.lock();

                        bagAfterMap = _this4.reduce();
                        popCount = bagAfterMap.items.length / _this4.bag.items.length; // in case ßthere was replication...ß

                        _this = _this4;
                        bag = _this4.bag;
                        mapSize = _this4.absoluteSize;
                        mapCenterPos = _this4.centerPos();

                        _runNextAnim = function runNextAnim(n) {

                            if (bag.items.length === 0) {

                                // Reached end of bag. Terminate animation.
                                _this4.isAnimating = false;
                                stage.remove(_this4);
                                stage.update();
                                stage.draw();
                            } else {
                                var itemsAfterMap;
                                var dropItem;

                                (function () {

                                    // Pop an item off the bag.
                                    var item = bag.popItem();
                                    itemsAfterMap = [];

                                    for (var i = 0; i < popCount; i++) {
                                        itemsAfterMap.push(bagAfterMap.popItem());
                                    } // TODO: Replicators...

                                    func.holes[0].open();

                                    // Add it to the stage, making it smaller
                                    // so that it can 'follow' the path of the arrow from bag into function.
                                    stage.add(item);
                                    stage.update();
                                    bagToFuncArrowPath = _this.bagToFuncArrowPath;

                                    item.scale = { x: 0.5, y: 0.5 };
                                    item.parent = null;

                                    var preview_item = item.clone();
                                    preview_item.parent = null;

                                    _this4.isAnimating = true;

                                    dropItem = function dropItem() {

                                        // Preview
                                        func.holes[0].ondropenter(preview_item);

                                        // Remove item (preview) from the stage when it reaches end of arrow path (enters 'function' hole).
                                        stage.remove(item);
                                        stage.update();

                                        mapCenterPos = _this.centerPos();

                                        var preview_duration = func.isConstantFunction ? 100 : 1000;

                                        Animate.wait(preview_duration).after(function () {

                                            func.holes[0].ondropexit();

                                            // Spill individial items onto stage as they are created.
                                            for (var _i = 0; _i < itemsAfterMap.length; _i++) {

                                                var itemAfterMap = itemsAfterMap[_i];
                                                var pos = func.body.absolutePos;

                                                itemAfterMap.pos = pos;
                                                itemAfterMap.scale = { x: 1.0, y: 1.0 };
                                                itemAfterMap.parent = null;
                                                stage.add(itemAfterMap);

                                                var theta = Math.random() * Math.PI * 2;
                                                //let radX = mapSize.w / 2.0;
                                                //let radY = mapSize.h / 2.0 * 2.0;
                                                var radX = bag.size.h * 1.5;
                                                var radY = radX;
                                                var sz = itemAfterMap.absoluteSize;
                                                var center = addPos(pos, { x: -sz.w, y: 0 });

                                                var targetPos = addPos(center, { x: radX * Math.cos(theta),
                                                    y: radY * Math.sin(theta) });
                                                //                                 y:radY + radY * Math.abs(Math.sin(theta)) / 2.0 } );

                                                targetPos = clipToRect(targetPos, itemAfterMap.absoluteSize, { x: 25, y: 0 }, { w: GLOBAL_DEFAULT_SCREENSIZE.width - 25,
                                                    h: GLOBAL_DEFAULT_SCREENSIZE.height - stage.toolbox.size.h });

                                                Animate.tween(itemAfterMap, { 'pos': targetPos }, 500, function (elapsed) {
                                                    return Math.pow(elapsed, 0.5);
                                                });
                                            }
                                            stage.draw();

                                            _runNextAnim(n + 1);
                                        });
                                    };

                                    if (bagToFuncArrowPath) Animate.followPath(item, bagToFuncArrowPath, 800).after(dropItem);else dropItem();
                                })();
                            }
                        };

                        _runNextAnim(0);
                    } else if (_this4.bag instanceof Expression) {

                        var expr = _this4.bag.clone();
                        _this4.stage.add(expr);
                        expr.parent = null;
                        Animate.followPath(expr, _this4.bagToFuncArrowPath);
                    } else {
                        console.error('@ MapFunc.performReduction: this.bag is not a valid expression.');
                        return {
                            v: _this4
                        };
                    }
                }();

                if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            }
        }

        // Sizes to match its children.

    }, {
        key: 'constructorArgs',
        get: function get() {
            return [this.func.clone(), this.bag.clone()];
        }
    }, {
        key: 'returnBag',
        get: function get() {
            return this.holes[0];
        }
    }, {
        key: 'func',
        get: function get() {
            return this.holes[1];
        }
    }, {
        key: 'bag',
        get: function get() {
            return this.holes[2];
        },
        set: function set(bg) {
            this.holes[2] = bg;
        }
    }, {
        key: 'size',
        get: function get() {
            var sz = _get(MapFunc.prototype.__proto__ || Object.getPrototypeOf(MapFunc.prototype), 'size', this);
            sz.h = DEFAULT_EXPR_HEIGHT * this.heightScalar;
            return sz;
        }
    }]);

    return MapFunc;
}(FuncExpr);

var SimpleMapFunc = function (_MapFunc) {
    _inherits(SimpleMapFunc, _MapFunc);

    function SimpleMapFunc(oneParamFunc, bag) {
        _classCallCheck(this, SimpleMapFunc);

        var _this5 = _possibleConstructorReturn(this, (SimpleMapFunc.__proto__ || Object.getPrototypeOf(SimpleMapFunc)).call(this, oneParamFunc, bag));

        _this5.holes = [];
        _this5.addArg(bag);
        _this5.addArg(oneParamFunc);
        _this5.update();

        _this5.color = "YellowGreen";
        return _this5;
    }

    _createClass(SimpleMapFunc, [{
        key: 'updateArrowPaths',
        value: function updateArrowPaths() {

            if (!this.bag || !this.func) return;

            // Arrow from func expr to left bag:
            function topMiddlePoint(expr) {
                return expr.posOnRectAt(CONST.POS.UNITSQUARE.TOP.MID());
            }
            function leftMiddlePoint(expr) {
                return expr.posOnRectAt(CONST.POS.UNITSQUARE.LEFT.MID());
            }
            function rightMiddlePoint(expr) {
                return expr.posOnRectAt(CONST.POS.UNITSQUARE.RIGHT.MID());
            }
            function topMiddleFuncHolePoint(func) {
                if (func.holes.length > 0) return func.posOnRectAt({ x: (func.holes[0].pos.x + func.holes[0].size.w) / func.absoluteSize.w, y: 0 });else return func.posOnRectAt({ x: 0.25, y: 0 });
            }

            // Create arrow paths.
            var bagToFuncArrowPath = new ArrowPath();
            var topY = this.func.pos.y - this.func.size.h / 2.0 - 12;
            var leftBag = topMiddlePoint(this.bag);
            var leftBagTop = { x: leftBag.x, y: topY };
            var funcHoleMid = topMiddleFuncHolePoint(this.func);
            var funcHoleMidTop = { x: funcHoleMid.x, y: topY };
            bagToFuncArrowPath.addPoint(leftBag);
            bagToFuncArrowPath.addPoint(leftBagTop);
            bagToFuncArrowPath.addPoint(funcHoleMidTop);
            bagToFuncArrowPath.addPoint(funcHoleMid);
            bagToFuncArrowPath.parent = this;
            bagToFuncArrowPath.color = MapFunc.arrowPathColor();
            this.bagToFuncArrowPath = bagToFuncArrowPath;

            this.arrowPaths = [bagToFuncArrowPath];
        }
    }, {
        key: 'returnBag',
        get: function get() {
            return null;
        }
    }, {
        key: 'func',
        get: function get() {
            return this.holes[1];
        }
    }, {
        key: 'bag',
        get: function get() {
            return this.holes[0];
        },
        set: function set(bg) {
            this.holes[0] = bg;
        }
    }]);

    return SimpleMapFunc;
}(MapFunc);

var ReduceFunc = function (_FuncExpr2) {
    _inherits(ReduceFunc, _FuncExpr2);

    function ReduceFunc(twoParamFunc, iterable, initializer) {
        _classCallCheck(this, ReduceFunc);

        console.log('constructing ReduceFunc with ', twoParamFunc, iterable, initializer);

        var _this6 = _possibleConstructorReturn(this, (ReduceFunc.__proto__ || Object.getPrototypeOf(ReduceFunc)).call(this, [iterable, initializer, twoParamFunc]));

        _this6.exprOffsetY = DEFAULT_EXPR_HEIGHT / 8.0;
        _this6.update();

        _this6.color = "YellowGreen";
        return _this6;
    }

    _createClass(ReduceFunc, [{
        key: 'step',


        // Reduce algorithm.
        // * Modifies the iterable and init properties to reflect a step in the algorithm.
        // * Returns TRUE if valid and iterable was empty, false if not.
        value: function step() {

            if (this.initializer instanceof MissingExpression || this.iterable instanceof MissingExpression) return false;else if (this.initializer.reduceCompletely() != this.initializer) {
                Animate.blink(this.initializer, 400, [0, 1, 0]);
                return false;
            } else if (this.iterable.items.length === 0) return true;

            var iter = this.iterable.clone();
            var item = iter.popItem();
            var init = this.initializer.clone();
            var func = this.func.clone();
            var partial = func.clone().applyExpr(init); // first apply the initializer, we'll get back a 1-param func.
            var reduced = partial.clone().applyExpr(item); // now apply the item from the collection.

            var _this = this;
            var stage = this.stage;
            var initToFuncArrowPath = this.initToFuncArrowPath;
            var bagToFuncArrowPath = this.bagToFuncArrowPath;
            var oldInit = this.initializer;
            oldInit.detach();
            stage.remove(oldInit);

            var previewItem = item.clone();
            var previewInit = init.clone();
            previewItem.scale = { x: 0.5, y: 0.5 };
            previewItem.anchor = { x: 0.5, y: 0.5 };
            previewItem.parent = null;
            previewInit.scale = { x: 0.5, y: 0.5 };
            previewInit.anchor = { x: 0.5, y: 0.5 };
            previewInit.parent = null;
            stage.add(previewInit);

            Animate.followPath(previewInit, initToFuncArrowPath, 1000).after(function () {
                stage.remove(previewInit);

                // Update bag graphic, showing removed item.
                _this.iterable = iter;
                //_this.func = partial.clone();
                //partial.parent = _this;
                stage.add(previewItem);
                _this.update();

                Animate.followPath(previewItem, bagToFuncArrowPath, 1000).after(function () {
                    stage.remove(previewItem);

                    _this.initializer = reduced;
                    _this.func = func;
                    reduced.parent = _this;
                    iter.parent = _this;
                    reduced.unlock();

                    _this.update();
                    stage.draw();
                });
            });

            return false;
            //return new ReduceFunc( this.func.clone(), iter, reduced );
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            if (this.step()) return this.initializer;else return this;
        }
    }, {
        key: 'reduceCompletely',
        value: function reduceCompletely() {
            return this;
        }
    }, {
        key: 'updateArrowPaths',
        value: function updateArrowPaths() {

            // Arrow from func expr to left bag:
            var _this = this;
            function topMiddlePoint(expr) {
                return expr.posOnRectAt(CONST.POS.UNITSQUARE.TOP.MID());
            }
            function bottomMiddlePoint(expr) {
                return expr.posOnRectAt(CONST.POS.UNITSQUARE.BOTTOM.MID());
            }
            function leftMiddlePoint(expr) {
                return expr.posOnRectAt(CONST.POS.UNITSQUARE.LEFT.MID());
            }
            function rightMiddlePoint(expr) {
                return expr.posOnRectAt(CONST.POS.UNITSQUARE.RIGHT.MID());
            }
            function topMiddleFuncHolePoint(func) {
                if (func.holes.length > 0) return { x: func.holes[0].pos.x + func.holes[0].absoluteSize.w / 2.0 + func.pos.x, y: func.pos.y - func.size.h / 2.0 };else return func.posOnRectAt({ x: 0.25, y: 0 });
            }
            function topMiddle2ndFuncHolePoint(func) {
                if (func.holes.length > 1 && func.holes[1].holes.length > 0) return { x: func.holes[1].holes[0].pos.x + func.pos.x + func.holes[1].pos.x, y: func.pos.y - func.size.h / 2.0 };else return func.posOnRectAt({ x: 0.25, y: 0 });
            }

            // Create arrow paths.
            var bagToFuncArrowPath = new ArrowPath();
            var topY = this.func.pos.y - this.func.size.h / 2.0 - 12;
            var firstTopY = topY - this.func.size.h / 4.0;
            var leftBag = topMiddlePoint(this.iterable);
            var leftBagTop = { x: leftBag.x, y: firstTopY };
            var funcHoleMid = topMiddleFuncHolePoint(this.func);
            var funcHole2ndMid = topMiddle2ndFuncHolePoint(this.func);
            var funcHoleMidFirstTop = { x: funcHoleMid.x, y: firstTopY };
            bagToFuncArrowPath.addPoint(leftBag);
            bagToFuncArrowPath.addPoint(leftBagTop);
            bagToFuncArrowPath.addPoint({ x: funcHole2ndMid.x, y: funcHoleMidFirstTop.y });
            bagToFuncArrowPath.addPoint({ x: funcHole2ndMid.x, y: funcHoleMid.y });
            bagToFuncArrowPath.parent = this;
            bagToFuncArrowPath.color = ReduceFunc.arrowPathColor();
            this.bagToFuncArrowPath = bagToFuncArrowPath;

            var initToFuncArrowPath = new ArrowPath();
            var initMid = topMiddlePoint(this.initializer);
            var initMidTop = { x: initMid.x, y: topY };
            var funcHoleMidTop = { x: funcHoleMid.x, y: topY };
            initToFuncArrowPath.addPoint(initMid);
            initToFuncArrowPath.addPoint(initMidTop);
            initToFuncArrowPath.addPoint(funcHoleMidTop);
            initToFuncArrowPath.addPoint(funcHoleMid);
            initToFuncArrowPath.color = ReduceFunc.arrowPathColor();
            initToFuncArrowPath.parent = this;
            this.initToFuncArrowPath = initToFuncArrowPath;

            var funcToInitArrowPath = new ArrowPath();
            var funcBotMid = bottomMiddlePoint(this.func);
            var botY = funcBotMid.y + this.func.size.h / 2.0 - 8;
            var funcBotBelow = { x: funcBotMid.x, y: botY };
            var initBotMid = bottomMiddlePoint(this.initializer);
            var initBotMidBelow = { x: initBotMid.x, y: botY };
            funcToInitArrowPath.addPoint(funcBotMid);
            funcToInitArrowPath.addPoint(funcBotBelow);
            funcToInitArrowPath.addPoint(initBotMidBelow);
            funcToInitArrowPath.addPoint(initBotMid);
            funcToInitArrowPath.color = ReduceFunc.arrowPathColor();

            this.arrowPaths = [bagToFuncArrowPath, initToFuncArrowPath, funcToInitArrowPath];
        }

        // Sizes to match its children.

    }, {
        key: 'toString',
        value: function toString() {
            return '(reduce ' + this.func.toString() + ' ' + this.iterable.toString() + ' ' + (this.initializer ? this.initializer.toString() : '()') + ')';
        }
    }, {
        key: 'constructorArgs',
        get: function get() {
            return [this.func.clone(), this.iterable.clone(), this.initializer.clone()];
        }

        // Accessors

    }, {
        key: 'initializer',
        get: function get() {
            return this.holes[1];
        },
        set: function set(e) {
            this.holes[1] = e;
        }
    }, {
        key: 'iterable',
        get: function get() {
            return this.holes[0];
        },
        set: function set(e) {
            this.holes[0] = e;
        }
    }, {
        key: 'func',
        get: function get() {
            return this.holes[2];
        },
        set: function set(e) {
            this.holes[2] = e;
        }
    }, {
        key: 'size',
        get: function get() {
            var sz = _get(ReduceFunc.prototype.__proto__ || Object.getPrototypeOf(ReduceFunc.prototype), 'size', this);
            sz.h = DEFAULT_EXPR_HEIGHT * 2.3;
            return sz;
        }
    }]);

    return ReduceFunc;
}(FuncExpr);