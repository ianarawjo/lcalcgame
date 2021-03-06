'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Wrapper class to make arbitrary nodes into draggable expressions.
var ValueExpr = function (_Expression) {
    _inherits(ValueExpr, _Expression);

    function ValueExpr() {
        _classCallCheck(this, ValueExpr);

        return _possibleConstructorReturn(this, (ValueExpr.__proto__ || Object.getPrototypeOf(ValueExpr)).apply(this, arguments));
    }

    return ValueExpr;
}(Expression);

var GraphicValueExpr = function (_ValueExpr) {
    _inherits(GraphicValueExpr, _ValueExpr);

    function GraphicValueExpr(graphic_node) {
        _classCallCheck(this, GraphicValueExpr);

        var _this2 = _possibleConstructorReturn(this, (GraphicValueExpr.__proto__ || Object.getPrototypeOf(GraphicValueExpr)).call(this, [graphic_node]));

        _this2.color = 'gold';
        return _this2;
    }

    _createClass(GraphicValueExpr, [{
        key: 'reduceCompletely',
        value: function reduceCompletely() {
            return this;
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            return this;
        }

        //get size() { return this.holes[0].size; }

    }, {
        key: 'hits',
        value: function hits(pos, options) {
            if (this.ignoreEvents) return null;
            if (this.holes[0].hits(pos, options)) return this;else return null;
        }
    }, {
        key: 'onmouseenter',
        value: function onmouseenter(pos) {
            if (this.delegateToInner) this.holes[0].onmouseenter(pos);else _get(GraphicValueExpr.prototype.__proto__ || Object.getPrototypeOf(GraphicValueExpr.prototype), 'onmouseenter', this).call(this, pos);
        }
    }, {
        key: 'onmouseleave',
        value: function onmouseleave(pos) {
            if (!this.delegateToInner) _get(GraphicValueExpr.prototype.__proto__ || Object.getPrototypeOf(GraphicValueExpr.prototype), 'onmouseleave', this).call(this, pos);
            this.holes[0].onmouseleave(pos);
        }
    }, {
        key: 'drawInternal',
        value: function drawInternal(ctx, pos, boundingSize) {
            if (!this.delegateToInner) {
                this._color = '#777';
                _get(GraphicValueExpr.prototype.__proto__ || Object.getPrototypeOf(GraphicValueExpr.prototype), 'drawInternal', this).call(this, ctx, pos, boundingSize);
            }
        }
    }, {
        key: 'value',
        value: function value() {
            return this.holes[0].value();
        }
    }, {
        key: 'color',
        get: function get() {
            return _get(GraphicValueExpr.prototype.__proto__ || Object.getPrototypeOf(GraphicValueExpr.prototype), 'color', this);
        },
        set: function set(clr) {
            this.holes[0].color = clr;
        }
    }, {
        key: 'delegateToInner',
        get: function get() {
            return this.ignoreEvents || !this.parent || !(this.parent instanceof Expression);
        }
    }, {
        key: 'graphicNode',
        get: function get() {
            return this.holes[0];
        }
    }]);

    return GraphicValueExpr;
}(ValueExpr);

var StarExpr = function (_GraphicValueExpr) {
    _inherits(StarExpr, _GraphicValueExpr);

    function StarExpr(x, y, rad) {
        var pts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 5;

        _classCallCheck(this, StarExpr);

        return _possibleConstructorReturn(this, (StarExpr.__proto__ || Object.getPrototypeOf(StarExpr)).call(this, new mag.Star(x, y, rad, pts)));
    }

    _createClass(StarExpr, [{
        key: 'toString',
        value: function toString() {
            return 'star';
        }
    }]);

    return StarExpr;
}(GraphicValueExpr);

var CircleExpr = function (_GraphicValueExpr2) {
    _inherits(CircleExpr, _GraphicValueExpr2);

    function CircleExpr(x, y, rad) {
        _classCallCheck(this, CircleExpr);

        return _possibleConstructorReturn(this, (CircleExpr.__proto__ || Object.getPrototypeOf(CircleExpr)).call(this, new mag.Circle(x, y, rad)));
    }

    _createClass(CircleExpr, [{
        key: 'toString',
        value: function toString() {
            return 'circle';
        }
    }]);

    return CircleExpr;
}(GraphicValueExpr);

var PipeExpr = function (_GraphicValueExpr3) {
    _inherits(PipeExpr, _GraphicValueExpr3);

    function PipeExpr(x, y, w, h) {
        _classCallCheck(this, PipeExpr);

        return _possibleConstructorReturn(this, (PipeExpr.__proto__ || Object.getPrototypeOf(PipeExpr)).call(this, new mag.Pipe(x, y, w, h - 12)));
    }

    _createClass(PipeExpr, [{
        key: 'toString',
        value: function toString() {
            return 'pipe';
        }
    }]);

    return PipeExpr;
}(GraphicValueExpr);

var TriangleExpr = function (_GraphicValueExpr4) {
    _inherits(TriangleExpr, _GraphicValueExpr4);

    function TriangleExpr(x, y, w, h) {
        _classCallCheck(this, TriangleExpr);

        return _possibleConstructorReturn(this, (TriangleExpr.__proto__ || Object.getPrototypeOf(TriangleExpr)).call(this, new mag.Triangle(x, y, w, h)));
    }

    _createClass(TriangleExpr, [{
        key: 'toString',
        value: function toString() {
            return 'triangle';
        }
    }]);

    return TriangleExpr;
}(GraphicValueExpr);

var RectExpr = function (_GraphicValueExpr5) {
    _inherits(RectExpr, _GraphicValueExpr5);

    function RectExpr(x, y, w, h) {
        _classCallCheck(this, RectExpr);

        return _possibleConstructorReturn(this, (RectExpr.__proto__ || Object.getPrototypeOf(RectExpr)).call(this, new mag.Rect(x, y, w, h)));
    }

    _createClass(RectExpr, [{
        key: 'toString',
        value: function toString() {
            return 'diamond';
        }
    }]);

    return RectExpr;
}(GraphicValueExpr);

var ImageExpr = function (_GraphicValueExpr6) {
    _inherits(ImageExpr, _GraphicValueExpr6);

    function ImageExpr(x, y, w, h, resource_key) {
        _classCallCheck(this, ImageExpr);

        var _this8 = _possibleConstructorReturn(this, (ImageExpr.__proto__ || Object.getPrototypeOf(ImageExpr)).call(this, new mag.ImageRect(x, y, w, h, resource_key)));

        _this8._image = resource_key;
        return _this8;
    }

    _createClass(ImageExpr, [{
        key: 'toString',
        value: function toString() {
            return this._image;
        }
    }, {
        key: 'image',
        get: function get() {
            return this._image;
        },
        set: function set(img) {
            this._image = img;
            this.graphicNode.image = img;
        }
    }]);

    return ImageExpr;
}(GraphicValueExpr);

var FunnelExpr = function (_ImageExpr) {
    _inherits(FunnelExpr, _ImageExpr);

    function FunnelExpr(x, y, w, h) {
        _classCallCheck(this, FunnelExpr);

        var _this9 = _possibleConstructorReturn(this, (FunnelExpr.__proto__ || Object.getPrototypeOf(FunnelExpr)).call(this, x, y, w, h, 'funnel'));

        _this9.graphicNode.anchor = { x: 0, y: 0.5 };
        return _this9;
    }

    _createClass(FunnelExpr, [{
        key: 'update',
        value: function update() {}
    }, {
        key: 'onmouseenter',
        value: function onmouseenter() {
            this.graphicNode.image = 'funnel-selected';
        }
    }, {
        key: 'onmouseleave',
        value: function onmouseleave() {
            this.graphicNode.image = 'funnel';
        }
    }, {
        key: 'drawInternal',
        value: function drawInternal(ctx, pos, boundingSize) {}
    }, {
        key: 'size',
        get: function get() {
            return this.graphicNode.size;
        }
    }]);

    return FunnelExpr;
}(ImageExpr);

var NullExpr = function (_ImageExpr2) {
    _inherits(NullExpr, _ImageExpr2);

    function NullExpr(x, y, w, h) {
        _classCallCheck(this, NullExpr);

        return _possibleConstructorReturn(this, (NullExpr.__proto__ || Object.getPrototypeOf(NullExpr)).call(this, x, y, w, h, 'null-circle'));
    }

    _createClass(NullExpr, [{
        key: 'reduce',
        value: function reduce() {
            return null; // hmmmm
        }
    }, {
        key: 'performReduction',
        value: function performReduction() {
            Animate.poof(this);
            _get(NullExpr.prototype.__proto__ || Object.getPrototypeOf(NullExpr.prototype), 'performReduction', this).call(this);
        }
    }, {
        key: 'onmousehover',
        value: function onmousehover() {
            this.image = 'null-circle-highlight';
        }
    }, {
        key: 'onmouseleave',
        value: function onmouseleave() {
            this.image = 'null-circle';
        }
    }, {
        key: 'onmouseclick',
        value: function onmouseclick() {
            this.performReduction();
        }
    }, {
        key: 'toString',
        value: function toString() {
            return 'null';
        }
    }, {
        key: 'value',
        value: function value() {
            return null;
        }
    }]);

    return NullExpr;
}(ImageExpr);

var MirrorExpr = function (_ImageExpr3) {
    _inherits(MirrorExpr, _ImageExpr3);

    function MirrorExpr(x, y, w, h) {
        _classCallCheck(this, MirrorExpr);

        var _this11 = _possibleConstructorReturn(this, (MirrorExpr.__proto__ || Object.getPrototypeOf(MirrorExpr)).call(this, x, y, w, h, 'mirror-icon'));

        _this11.lock();
        _this11.graphicNode.offset = { x: 0, y: -10 };
        _this11.innerExpr = null;
        _this11._broken = false;
        return _this11;
    }

    _createClass(MirrorExpr, [{
        key: 'drawInternalAfterChildren',
        value: function drawInternalAfterChildren(ctx, pos, boundingSize) {
            if (!this.innerExpr) return;

            ctx.save();
            ctx.globalCompositeOperation = "overlay";
            this.innerExpr.parent = this.graphicNode;
            this.innerExpr.pos = { x: this.graphicNode.size.w / 2.0, y: this.graphicNode.size.h / 2.0 };
            this.innerExpr.anchor = { x: 0.5, y: 0.8 };
            this.innerExpr.draw(ctx);
            ctx.restore();
        }
    }, {
        key: 'exprInMirror',
        set: function set(e) {
            this.innerExpr = e;

            if (e) {
                e.scale = { x: 1, y: 1 };
                e.parent = this.graphicNode;
                e.update();
            }
        },
        get: function get() {
            return this.innerExpr;
        }
    }, {
        key: 'broken',
        set: function set(b) {
            this._broken = b;
            if (b) this.graphicNode.image = 'mirror-icon-broken';else this.graphicNode.image = 'mirror-icon';
        },
        get: function get() {
            return this._broken;
        }
    }]);

    return MirrorExpr;
}(ImageExpr);

/** Faded variants. */


var FadedValueExpr = function (_Expression2) {
    _inherits(FadedValueExpr, _Expression2);

    function FadedValueExpr(name) {
        _classCallCheck(this, FadedValueExpr);

        var txt = new TextExpr(name);

        var _this12 = _possibleConstructorReturn(this, (FadedValueExpr.__proto__ || Object.getPrototypeOf(FadedValueExpr)).call(this, [txt]));

        txt.color = "OrangeRed";
        _this12.color = "gold";
        _this12.primitiveName = name;
        return _this12;
    }

    _createClass(FadedValueExpr, [{
        key: 'reduceCompletely',
        value: function reduceCompletely() {
            return this;
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            return this;
        }
    }, {
        key: 'toString',
        value: function toString() {
            return this.primitiveName;
        }
    }, {
        key: 'value',
        value: function value() {
            return this.toString();
        }
    }, {
        key: 'graphicNode',
        get: function get() {
            return this.holes[0];
        }
    }]);

    return FadedValueExpr;
}(Expression);

var FadedStarExpr = function (_FadedValueExpr) {
    _inherits(FadedStarExpr, _FadedValueExpr);

    function FadedStarExpr() {
        _classCallCheck(this, FadedStarExpr);

        return _possibleConstructorReturn(this, (FadedStarExpr.__proto__ || Object.getPrototypeOf(FadedStarExpr)).call(this, 'star'));
    }

    return FadedStarExpr;
}(FadedValueExpr);

var FadedRectExpr = function (_FadedValueExpr2) {
    _inherits(FadedRectExpr, _FadedValueExpr2);

    function FadedRectExpr() {
        _classCallCheck(this, FadedRectExpr);

        return _possibleConstructorReturn(this, (FadedRectExpr.__proto__ || Object.getPrototypeOf(FadedRectExpr)).call(this, 'rect'));
    }

    return FadedRectExpr;
}(FadedValueExpr);

var FadedTriangleExpr = function (_FadedValueExpr3) {
    _inherits(FadedTriangleExpr, _FadedValueExpr3);

    function FadedTriangleExpr() {
        _classCallCheck(this, FadedTriangleExpr);

        return _possibleConstructorReturn(this, (FadedTriangleExpr.__proto__ || Object.getPrototypeOf(FadedTriangleExpr)).call(this, 'tri'));
    }

    return FadedTriangleExpr;
}(FadedValueExpr);

var FadedCircleExpr = function (_FadedValueExpr4) {
    _inherits(FadedCircleExpr, _FadedValueExpr4);

    function FadedCircleExpr() {
        _classCallCheck(this, FadedCircleExpr);

        return _possibleConstructorReturn(this, (FadedCircleExpr.__proto__ || Object.getPrototypeOf(FadedCircleExpr)).call(this, 'dot'));
    }

    return FadedCircleExpr;
}(FadedValueExpr);