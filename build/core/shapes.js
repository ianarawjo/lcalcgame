'use strict';

var _set = function set(object, property, value, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent !== null) { set(parent, property, value, receiver); } } else if ("value" in desc && desc.writable) { desc.value = value; } else { var setter = desc.set; if (setter !== undefined) { setter.call(receiver, value); } } return value; };

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/** Basic shapes as node objects.
 *	Rect, RoundedRect, HexaRect, Star, Triangle, Circle, Pipe.
 * @module shapes
 */
var mag = function (_) {
    var Rect = function (_$Node) {
        _inherits(Rect, _$Node);

        function Rect(x, y, w, h) {
            _classCallCheck(this, Rect);

            var _this = _possibleConstructorReturn(this, (Rect.__proto__ || Object.getPrototypeOf(Rect)).call(this, x, y));

            _this._size = { w: w, h: h };
            _this._anchor = { x: 0, y: 0 };
            _this._scale = { x: 1, y: 1 };
            _this._color = "lightgray";
            _this._highlightColor = 'yellow';
            _this.stroke = null;
            _this.shadowOffset = 2;
            _this.shadowColor = 'black';
            return _this;
        }

        _createClass(Rect, [{
            key: 'upperLeftPos',
            value: function upperLeftPos(pos, boundingSize) {
                return { x: pos.x - this.anchor.x * boundingSize.w, y: pos.y - this.anchor.y * boundingSize.h };
            }
        }, {
            key: 'centerPos',
            value: function centerPos() {
                var sz = this.absoluteSize;
                var pt = this.absolutePos;
                var left = this.upperLeftPos(pt, sz);
                return { x: left.x + sz.w * 0.5, y: left.y + sz.h * 0.5 };
            }
        }, {
            key: 'posOnRectAt',
            value: function posOnRectAt(unitPos) {
                // Given unit pos like 0, 1, returns position relative to Rect's this.pos and this.anchor properties.
                var sz = { w: this._size.w * this._scale.x, h: this._size.h * this._scale.y };
                var pt = this.upperLeftPos(this._pos, sz);
                var offset = { x: unitPos.x * sz.w, y: unitPos.y * sz.h };
                return addPos(pt, offset);
            }
        }, {
            key: 'draw',
            value: function draw(ctx) {
                var _this2 = this;

                if (!ctx) return;
                ctx.save();
                if (this.opacity !== undefined && this.opacity < 1.0) {
                    ctx.globalAlpha = this.opacity;
                }
                var boundingSize = this.absoluteSize;
                var upperLeftPos = this.upperLeftPos(this.absolutePos, boundingSize);
                if (this._color || this.stroke) this.drawInternal(ctx, upperLeftPos, boundingSize);
                this.children.forEach(function (child) {
                    child.parent = _this2;
                    child.draw(ctx);
                });
                if (this._color || this.stroke) this.drawInternalAfterChildren(ctx, upperLeftPos, boundingSize);
                ctx.restore();
            }
        }, {
            key: 'strokeRect',
            value: function strokeRect(ctx, x, y, w, h) {
                if (this.stroke) {
                    if (this.stroke.opacity && this.stroke.opacity < 1.0) {
                        ctx.save();
                        ctx.globalAlpha *= this.stroke.opacity;
                        ctx.strokeRect(x, y, w, h);
                        ctx.restore();
                    } else ctx.strokeRect(x, y, w, h);
                }
            }
        }, {
            key: 'drawInternal',
            value: function drawInternal(ctx, pos, boundingSize) {
                setStrokeStyle(ctx, this.stroke);
                ctx.fillStyle = this.shadowColor;
                ctx.fillRect(pos.x, pos.y, boundingSize.w, boundingSize.h + this.shadowOffset);
                this.strokeRect(ctx, pos.x, pos.y, boundingSize.w, boundingSize.h + this.shadowOffset);
                ctx.fillStyle = this.color;
                ctx.fillRect(pos.x, pos.y, boundingSize.w, boundingSize.h);
                this.strokeRect(ctx, pos.x, pos.y, boundingSize.w, boundingSize.h);
            }
        }, {
            key: 'drawInternalAfterChildren',
            value: function drawInternalAfterChildren(ctx, pos, boundingSize) {}

            // Events

        }, {
            key: 'hits',
            value: function hits(pos, options) {
                if (this.ignoreEvents) return null; // All children are ignored as well.

                if (typeof options !== 'undefined' && options.hasOwnProperty('exclude')) {
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = options.exclude[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var e = _step.value;

                            if (e == this) return null;
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

                var hitChild = this.hitsChild(pos, options);
                if (hitChild) return hitChild;

                // Hasn't hit any children, so test if the point lies on this node.
                return this.hitsWithin(pos);
            }
        }, {
            key: 'hitsWithin',
            value: function hitsWithin(pos) {
                var boundingSize = this.absoluteSize;
                var upperLeftPos = this.upperLeftPos(this.absolutePos, boundingSize);
                if (pointInRect(pos, rectFromPosAndSize(upperLeftPos, boundingSize))) return this;else return null;
            }
        }, {
            key: 'hitsChild',
            value: function hitsChild(pos, options) {
                // Depth-first hit test.
                if (this.children && this.children.length > 0) {
                    var hitChild = null;
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = this.children[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var child = _step2.value;

                            hitChild = child.hits(pos, options);
                            if (hitChild) break;
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

                    if (hitChild) return hitChild;
                }
                return null;
            }
        }, {
            key: 'onmousedown',
            value: function onmousedown(pos) {}
        }, {
            key: 'onmousedrag',
            value: function onmousedrag(pos) {
                //this.pos = pos;
            }
        }, {
            key: 'onmouseenter',
            value: function onmouseenter(pos) {
                this.stroke = { color: this.highlightColor, lineWidth: 2 };
            }
        }, {
            key: 'onmouseleave',
            value: function onmouseleave(pos) {
                this.stroke = null;
            }
        }, {
            key: 'onmouseup',
            value: function onmouseup(pos) {}
        }, {
            key: 'highlightColor',
            get: function get() {
                return this._highlightColor;
            },
            set: function set(clr) {
                this._highlightColor = clr;
            }
        }, {
            key: 'absolutePos',
            get: function get() {
                var pos = this.pos;
                if (this.parent) {
                    var abs_scale = this.parent.absoluteScale;

                    return addPos({ x: pos.x * abs_scale.x,
                        y: pos.y * abs_scale.y }, this.parent.upperLeftPos(this.parent.absolutePos, this.parent.absoluteSize));
                } else return pos;
            }
        }, {
            key: 'absoluteScale',
            get: function get() {
                if (this.parent) return multiplyPos(this.scale, this.parent.absoluteScale);else return this.scale;
            }
        }, {
            key: 'absoluteSize',
            get: function get() {
                var size = this.size;
                var scale = this.absoluteScale;
                return { w: size.w * scale.x, h: size.h * scale.y };
            }
        }, {
            key: 'absoluteBounds',
            get: function get() {
                var pos = this.absolutePos;
                var size = this.absoluteSize;
                return { x: pos.x, y: pos.y, w: size.w, h: size.h };
            }
        }, {
            key: 'color',
            get: function get() {
                return this._color;
            },
            set: function set(clr) {
                this._color = clr;
            }
        }, {
            key: 'size',
            get: function get() {
                return { w: this._size.w, h: this._size.h };
            },
            set: function set(sz) {
                this._size = sz;
            }
        }, {
            key: 'anchor',
            get: function get() {
                return { x: this._anchor.x, y: this._anchor.y };
            },
            set: function set(anch) {
                this._anchor = anch;
            }
        }, {
            key: 'scale',
            get: function get() {
                return { x: this._scale.x, y: this._scale.y };
            },
            set: function set(sc) {
                this._scale = sc;
            }
        }]);

        return Rect;
    }(_.Node);

    var RoundedRect = function (_Rect) {
        _inherits(RoundedRect, _Rect);

        function RoundedRect(x, y, w, h) {
            var rad = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 6;

            _classCallCheck(this, RoundedRect);

            var _this3 = _possibleConstructorReturn(this, (RoundedRect.__proto__ || Object.getPrototypeOf(RoundedRect)).call(this, x, y, w, h));

            _this3.radius = rad;
            return _this3;
        }

        _createClass(RoundedRect, [{
            key: 'drawInternal',
            value: function drawInternal(ctx, pos, boundingSize) {
                ctx.fillStyle = this.shadowColor;
                setStrokeStyle(ctx, this.stroke);
                if (this.shadowOffset !== 0) {
                    roundRect(ctx, pos.x, pos.y + this.shadowOffset, boundingSize.w, boundingSize.h, this.radius * this.absoluteScale.x, true, this.stroke ? true : false, this.stroke ? this.stroke.opacity : null); // just fill for now
                }
                if (this.color) ctx.fillStyle = this.color;
                roundRect(ctx, pos.x, pos.y, boundingSize.w, boundingSize.h, this.radius * this.absoluteScale.x, this.color !== null, this.stroke ? true : false, this.stroke ? this.stroke.opacity : null); // just fill for now
            }
        }]);

        return RoundedRect;
    }(Rect);

    var HexaRect = function (_Rect2) {
        _inherits(HexaRect, _Rect2);

        function HexaRect(x, y, w, h) {
            _classCallCheck(this, HexaRect);

            return _possibleConstructorReturn(this, (HexaRect.__proto__ || Object.getPrototypeOf(HexaRect)).call(this, x, y, w, h));
        }

        _createClass(HexaRect, [{
            key: 'drawInternal',
            value: function drawInternal(ctx, pos, boundingSize) {
                ctx.fillStyle = 'black';
                setStrokeStyle(ctx, this.stroke);
                if (this.shadowOffset !== 0) {
                    hexaRect(ctx, pos.x, pos.y + this.shadowOffset, boundingSize.w, boundingSize.h, true, this.stroke ? true : false); // just fill for now
                }
                ctx.fillStyle = this.color;
                hexaRect(ctx, pos.x, pos.y, boundingSize.w, boundingSize.h, true, this.stroke ? true : false); // just fill for now
            }
        }]);

        return HexaRect;
    }(Rect);

    var Star = function (_Rect3) {
        _inherits(Star, _Rect3);

        function Star(x, y, rad) {
            var points = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 5;

            _classCallCheck(this, Star);

            var _this5 = _possibleConstructorReturn(this, (Star.__proto__ || Object.getPrototypeOf(Star)).call(this, x, y, rad * 2, rad * 2));

            _this5.starPoints = points;
            return _this5;
        }

        _createClass(Star, [{
            key: 'drawInternal',
            value: function drawInternal(ctx, pos, boundingSize) {
                drawStar(ctx, pos.x + boundingSize.w / 2, pos.y + boundingSize.h / 2 + this.shadowOffset, this.starPoints, boundingSize.w / 2, boundingSize.w / 4, this.stroke, 'black');
                drawStar(ctx, pos.x + boundingSize.w / 2, pos.y + boundingSize.h / 2, this.starPoints, boundingSize.w / 2, boundingSize.w / 4, this.stroke, this.color);
            }
        }]);

        return Star;
    }(Rect);

    var Triangle = function (_Rect4) {
        _inherits(Triangle, _Rect4);

        function Triangle() {
            _classCallCheck(this, Triangle);

            return _possibleConstructorReturn(this, (Triangle.__proto__ || Object.getPrototypeOf(Triangle)).apply(this, arguments));
        }

        _createClass(Triangle, [{
            key: 'drawInternal',
            value: function drawInternal(ctx, pos, boundingSize) {
                setStrokeStyle(ctx, this.stroke);
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y + boundingSize.h + this.shadowOffset);
                ctx.lineTo(pos.x + boundingSize.w, pos.y + boundingSize.h + this.shadowOffset);
                ctx.lineTo(pos.x + boundingSize.w / 2.0, pos.y + this.shadowOffset);
                ctx.closePath();
                ctx.fill();
                if (this.stroke) ctx.stroke();
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y + boundingSize.h);
                ctx.lineTo(pos.x + boundingSize.w, pos.y + boundingSize.h);
                ctx.lineTo(pos.x + boundingSize.w / 2.0, pos.y);
                ctx.closePath();
                ctx.fill();
                if (this.stroke) strokeWithOpacity(ctx, this.stroke.opacity);
            }
        }]);

        return Triangle;
    }(Rect);

    var Circle = function (_Rect5) {
        _inherits(Circle, _Rect5);

        function Circle(x, y, rad) {
            _classCallCheck(this, Circle);

            var _this7 = _possibleConstructorReturn(this, (Circle.__proto__ || Object.getPrototypeOf(Circle)).call(this, x, y, rad * 2, rad * 2));

            _this7._radius = rad;
            _this7.clipChildren = false;
            return _this7;
        }

        _createClass(Circle, [{
            key: 'drawInternalAfterChildren',
            value: function drawInternalAfterChildren(ctx, pos, boundingSize) {
                if (this.clipChildren) {
                    ctx.restore();

                    var rad = boundingSize.w / 2.0;
                    drawCircle(ctx, pos.x, pos.y, rad, null, { color: 'black', lineWidth: 1 });
                }
            }
        }, {
            key: 'drawInternal',
            value: function drawInternal(ctx, pos, boundingSize) {
                var rad = boundingSize.w / 2.0;
                if (this.shadowOffset !== 0) drawCircle(ctx, pos.x, pos.y + this.shadowOffset, rad, 'black', this.stroke);
                drawCircle(ctx, pos.x, pos.y, rad, this.color, this.stroke);
                if (this.clipChildren) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(pos.x + rad, pos.y + rad, rad, 0, 2 * Math.PI);
                    ctx.clip();

                    if (this.clipBackground) {
                        ctx.drawImage(Resource.getImage(this.clipBackground), pos.x, pos.y);
                    }
                }
            }
        }, {
            key: 'size',
            get: function get() {
                return _get(Circle.prototype.__proto__ || Object.getPrototypeOf(Circle.prototype), 'size', this);
            },
            set: function set(sz) {
                _set(Circle.prototype.__proto__ || Object.getPrototypeOf(Circle.prototype), 'size', sz, this);
                this._radius = (sz.w + sz.h) / 4.0;
            }
        }, {
            key: 'radius',
            get: function get() {
                return this._radius;
            },
            set: function set(r) {
                this._radius = r;
                this._size = { w: r * 2, h: r * 2 };
            }
        }]);

        return Circle;
    }(Rect);

    var Pipe = function (_Rect6) {
        _inherits(Pipe, _Rect6);

        function Pipe(x, y, w, h) {
            var topColor = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 'green';
            var sideColor = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 'ForestGreen';

            _classCallCheck(this, Pipe);

            var _this8 = _possibleConstructorReturn(this, (Pipe.__proto__ || Object.getPrototypeOf(Pipe)).call(this, x, y, w, h));

            _this8.topColor = topColor;
            _this8.sideColor = sideColor;
            _this8.cylStroke = { color: 'blue', lineWidth: 1 };
            return _this8;
        }

        _createClass(Pipe, [{
            key: 'drawInternal',
            value: function drawInternal(ctx, pos, boundingSize) {
                var l = boundingSize.h / 4;
                var w = boundingSize.w / 2;
                var yoffset = -20;
                setStrokeStyle(ctx, this.cylStroke);

                // Draw side and bottom.
                ctx.fillStyle = this.sideColor;
                ctx.beginPath();
                ctx.ellipse(pos.x + w, pos.y + boundingSize.h + 10 + yoffset, w, l, 0, 0, Math.PI); // half ellipse
                ctx.lineTo(pos.x - w + w, pos.y + yoffset);
                ctx.lineTo(pos.x + w + w, pos.y + yoffset);
                ctx.closePath();
                ctx.fill();
                if (this.cylStroke) ctx.stroke();

                // Draw top circle.
                ctx.fillStyle = this.topColor;
                ctx.beginPath();
                ctx.ellipse(pos.x + w, pos.y + yoffset, w, l, 0, 0, 2 * Math.PI);
                ctx.fill();
                if (this.cylStroke) ctx.stroke();
            }
        }]);

        return Pipe;
    }(Rect);

    // Exports


    _.Rect = Rect;
    _.RoundedRect = RoundedRect;
    _.HexaRect = HexaRect;
    _.Star = Star;
    _.Triangle = Triangle;
    _.Circle = Circle;
    _.Pipe = Pipe;
    return _;
}(mag || {});