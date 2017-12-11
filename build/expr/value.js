'use strict';

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

    _createClass(ValueExpr, [{
        key: 'canReduce',
        value: function canReduce() {
            return false;
        }
    }, {
        key: 'isValue',
        value: function isValue() {
            return true;
        }
    }]);

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
            var hits = this.graphicNode.hits(pos, options);
            if (hits == this.graphicNode) return this;else return hits;
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
            return (this.locked ? '/' : '') + 'star';
        }
    }, {
        key: 'toJavaScript',
        value: function toJavaScript() {
            return '__star';
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
            return (this.locked ? '/' : '') + 'circle';
        }
    }, {
        key: 'toJavaScript',
        value: function toJavaScript() {
            return '__circle';
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
            return (this.locked ? '/' : '') + 'pipe';
        }
    }, {
        key: 'toJavaScript',
        value: function toJavaScript() {
            return '__pipe';
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
            return (this.locked ? '/' : '') + 'triangle';
        }
    }, {
        key: 'toJavaScript',
        value: function toJavaScript() {
            return '__triangle';
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
            return (this.locked ? '/' : '') + 'rect';
        }
    }, {
        key: 'toJavaScript',
        value: function toJavaScript() {
            return '__rect';
        }
    }]);

    return RectExpr;
}(GraphicValueExpr);

var ImageExpr = function (_GraphicValueExpr6) {
    _inherits(ImageExpr, _GraphicValueExpr6);

    function ImageExpr(x, y, w, h, resource_key) {
        _classCallCheck(this, ImageExpr);

        if (arguments.length === 1 && typeof x === 'string') {
            ;

            var _this8 = _possibleConstructorReturn(this, (ImageExpr.__proto__ || Object.getPrototypeOf(ImageExpr)).call(this, new mag.ImageRect(x)));
        } else {
            ;

            var _this8 = _possibleConstructorReturn(this, (ImageExpr.__proto__ || Object.getPrototypeOf(ImageExpr)).call(this, new mag.ImageRect(x, y, w, h, resource_key)));
        }_this8._image = resource_key;
        return _possibleConstructorReturn(_this8);
    }

    _createClass(ImageExpr, [{
        key: 'toString',
        value: function toString() {
            return this._image;
        }
    }, {
        key: 'toJavaScript',
        value: function toJavaScript() {
            return '__IMAGE_EXPR()';
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
            return _get(NullExpr.prototype.__proto__ || Object.getPrototypeOf(NullExpr.prototype), 'performReduction', this).call(this);
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
        key: 'toJavaScript',
        value: function toJavaScript() {
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
        key: 'canReduce',
        value: function canReduce() {
            return true;
        }
    }, {
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
        key: 'size',
        get: function get() {
            var sz = _get(MirrorExpr.prototype.__proto__ || Object.getPrototypeOf(MirrorExpr.prototype), 'size', this);
            sz.h = 54;
            return sz;
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
        var primitiveName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        _classCallCheck(this, FadedValueExpr);

        var txt = new TextExpr(name);

        var _this12 = _possibleConstructorReturn(this, (FadedValueExpr.__proto__ || Object.getPrototypeOf(FadedValueExpr)).call(this, [txt]));

        txt.color = "OrangeRed";
        _this12.color = "gold";
        _this12.primitiveName = primitiveName || name;
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
        key: 'canReduce',
        value: function canReduce() {
            return false;
        }
    }, {
        key: 'isValue',
        value: function isValue() {
            return true;
        }
    }, {
        key: 'toString',
        value: function toString() {
            return this.primitiveName;
        }
    }, {
        key: 'toJavaScript',
        value: function toJavaScript() {
            return '__' + this.primitiveName;
        }
    }, {
        key: 'value',
        value: function value() {
            return (this.locked ? '/' : '') + this.toString();
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

        return _possibleConstructorReturn(this, (FadedTriangleExpr.__proto__ || Object.getPrototypeOf(FadedTriangleExpr)).call(this, 'tri', 'triangle'));
    }

    return FadedTriangleExpr;
}(FadedValueExpr);

var FadedCircleExpr = function (_FadedValueExpr4) {
    _inherits(FadedCircleExpr, _FadedValueExpr4);

    function FadedCircleExpr() {
        _classCallCheck(this, FadedCircleExpr);

        return _possibleConstructorReturn(this, (FadedCircleExpr.__proto__ || Object.getPrototypeOf(FadedCircleExpr)).call(this, 'dot', 'circle'));
    }

    return FadedCircleExpr;
}(FadedValueExpr);

var StringValueExpr = function (_Expression3) {
    _inherits(StringValueExpr, _Expression3);

    function StringValueExpr(name) {
        var primitiveName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        _classCallCheck(this, StringValueExpr);

        var text = new TextExpr('"' + name + '"');

        var _this17 = _possibleConstructorReturn(this, (StringValueExpr.__proto__ || Object.getPrototypeOf(StringValueExpr)).call(this, [text]));

        _this17.name = name;
        _this17.primitiveName = primitiveName || name;
        text.color = "OrangeRed";
        _this17.color = "gold";
        return _this17;
    }

    _createClass(StringValueExpr, [{
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
        key: 'canReduce',
        value: function canReduce() {
            return false;
        }
    }, {
        key: 'isValue',
        value: function isValue() {
            return true;
        }
    }, {
        key: 'onmouseclick',
        value: function onmouseclick(pos) {
            _get(StringValueExpr.prototype.__proto__ || Object.getPrototypeOf(StringValueExpr.prototype), 'onmouseclick', this).call(this, pos);
            // Bubble mouse clicks to parent.
            if (this.parent) this.parent.onmouseclick(pos);
        }
    }, {
        key: 'toString',
        value: function toString() {
            return (this.locked ? '/' : '') + '`' + this.primitiveName;
        }
    }, {
        key: 'toJavaScript',
        value: function toJavaScript() {
            return '\'' + this.primitiveName + '\'';
        }
    }, {
        key: 'value',
        value: function value() {
            return this.name;
        }
    }, {
        key: 'graphicNode',
        get: function get() {
            return this.holes[0];
        }
    }]);

    return StringValueExpr;
}(Expression);

var ColorlessStringValueExpr = function (_StringValueExpr) {
    _inherits(ColorlessStringValueExpr, _StringValueExpr);

    function ColorlessStringValueExpr(name) {
        var primitiveName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        _classCallCheck(this, ColorlessStringValueExpr);

        var _this18 = _possibleConstructorReturn(this, (ColorlessStringValueExpr.__proto__ || Object.getPrototypeOf(ColorlessStringValueExpr)).call(this, name, primitiveName));

        _this18.graphicNode.color = SyntaxColor.for('string');
        _this18.color = 'lightgray';
        return _this18;
    }

    return ColorlessStringValueExpr;
}(StringValueExpr);

var ContextualTypeInTextExpr = function (_Expression4) {
    _inherits(ContextualTypeInTextExpr, _Expression4);

    function ContextualTypeInTextExpr(left_text, right_text, type_expr_code, reduce_cb) {
        var defaultName = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "";
        var transformer = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;

        _classCallCheck(this, ContextualTypeInTextExpr);

        var left = new TextExpr(left_text);
        left.color = 'black';
        var right = left.clone();
        var mid = TypeInTextExpr.fromExprCode(type_expr_code, function (final_txt) {
            var parent = _this19.parent || _this19.stage;
            var stage = _this19.stage;
            var replace_expr = reduce_cb(final_txt);
            var locked = _this19.locked;
            parent.swap(_this19, replace_expr); // Swap this makeshift textbox expr for a real one...
            if (locked) replace_expr.lock();
            stage.update();
        }, transformer);

        var _this19 = _possibleConstructorReturn(this, (ContextualTypeInTextExpr.__proto__ || Object.getPrototypeOf(ContextualTypeInTextExpr)).call(this, [left, mid, right]));

        _this19.exprCode = type_expr_code;
        _this19.defaultName = defaultName;
        _this19.color = 'lightgray';
        return _this19;
    }

    _createClass(ContextualTypeInTextExpr, [{
        key: 'reduceCompletely',


        // clone() {
        //     let t = new ContextualTypeInTextExpr(this.defaultName);
        //     if (this.holes[1].typeBox)
        //         t.holes[1].typeBox.text = this.holes[1].typeBox.text;
        //     if (this.locked)
        //         t.lock();
        //     return t;
        // }

        value: function reduceCompletely() {
            return this;
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            this.holes[1].reduce();
            return this;
        }
    }, {
        key: 'performReduction',
        value: function performReduction() {
            return this.holes[1].performReduction();
        }
    }, {
        key: 'canReduce',
        value: function canReduce() {
            return this.holes[1].reduce() != this.holes[1];
        }
    }, {
        key: 'isValue',
        value: function isValue() {
            return false;
        }
    }, {
        key: 'toString',
        value: function toString() {
            return (this.locked ? '/' : '') + this.defaultName;
        }
    }, {
        key: 'toJavaScript',
        value: function toJavaScript() {
            return this.exprCode;
        }
    }, {
        key: 'value',
        value: function value() {
            return this.name;
        }
    }, {
        key: 'graphicNode',
        get: function get() {
            return this.holes[0];
        }
    }, {
        key: 'leftExpr',
        get: function get() {
            return this.holes[0];
        }
    }, {
        key: 'typeExpr',
        get: function get() {
            return this.holes[1];
        }
    }, {
        key: 'rightExpr',
        get: function get() {
            return this.holes[2];
        }
    }]);

    return ContextualTypeInTextExpr;
}(Expression);

var TypeInArrowFuncExpr = function (_ContextualTypeInText) {
    _inherits(TypeInArrowFuncExpr, _ContextualTypeInText);

    function TypeInArrowFuncExpr(bodyExpr) {
        _classCallCheck(this, TypeInArrowFuncExpr);

        var body = bodyExpr.toJavaScript();

        var _this20 = _possibleConstructorReturn(this, (TypeInArrowFuncExpr.__proto__ || Object.getPrototypeOf(TypeInArrowFuncExpr)).call(this, '', '', '_t_fullarrow', function (final_txt) {
            return __PARSER.parse(final_txt + body); // e.g. '(a) =>' + 'a + 1'
        }, "", function (txt) {
            return txt + ' ' + body;
        }));

        _this20.holes[2] = _this20.children[2] = bodyExpr;
        _this20.color = 'lightgray';
        return _this20;
    }

    _createClass(TypeInArrowFuncExpr, [{
        key: 'constructorArgs',
        get: function get() {
            return [this.holes[2].clone()];
        }
    }]);

    return TypeInArrowFuncExpr;
}(ContextualTypeInTextExpr);

var TypeInStringValueExpr = function (_ContextualTypeInText2) {
    _inherits(TypeInStringValueExpr, _ContextualTypeInText2);

    function TypeInStringValueExpr() {
        var defaultName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";

        _classCallCheck(this, TypeInStringValueExpr);

        var _this21 = _possibleConstructorReturn(this, (TypeInStringValueExpr.__proto__ || Object.getPrototypeOf(TypeInStringValueExpr)).call(this, '"', '"', '_t_innerstring', function (final_txt) {
            return new (ExprManager.getClass('string'))(final_txt);
        }, defaultName));

        var mid = _this21.typeExpr;
        mid.setDefaultWidth(22);
        mid.typeBox.color = '#FEFCB1';
        mid.typeBox.textColor = 'OrangeRed';
        mid.typeBox.icon.image = 'empty-typebox-string';

        _this21.leftExpr.color = "OrangeRed";
        _this21.rightExpr.color = "OrangeRed";
        _this21.color = 'gold';
        return _this21;
    }

    return TypeInStringValueExpr;
}(ContextualTypeInTextExpr);

var ColorlessTypeInStringValueExpr = function (_TypeInStringValueExp) {
    _inherits(ColorlessTypeInStringValueExpr, _TypeInStringValueExp);

    function ColorlessTypeInStringValueExpr() {
        var defaultName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";

        _classCallCheck(this, ColorlessTypeInStringValueExpr);

        var _this22 = _possibleConstructorReturn(this, (ColorlessTypeInStringValueExpr.__proto__ || Object.getPrototypeOf(ColorlessTypeInStringValueExpr)).call(this, defaultName));

        _this22.leftExpr.color = _this22.rightExpr.color = 'black';
        _this22.typeExpr.typeBox.color = "#eee";
        _this22.typeExpr.typeBox.textColor = 'black';
        _this22.color = 'lightgray';
        return _this22;
    }

    return ColorlessTypeInStringValueExpr;
}(TypeInStringValueExpr);

var TypeInArrayExpr = function (_ContextualTypeInText3) {
    _inherits(TypeInArrayExpr, _ContextualTypeInText3);

    function TypeInArrayExpr() {
        _classCallCheck(this, TypeInArrayExpr);

        var _this23 = _possibleConstructorReturn(this, (TypeInArrayExpr.__proto__ || Object.getPrototypeOf(TypeInArrayExpr)).call(this, '[', ']', '_t_innerarray', function (final_txt) {
            return __PARSER.parse('[' + final_txt + ']');
        }));

        _this23.leftExpr.text = '[';
        _this23.rightExpr.text = ']';
        return _this23;
    }

    _createClass(TypeInArrayExpr, [{
        key: 'update',
        value: function update() {
            var sz = this.size;
            _get(TypeInArrayExpr.prototype.__proto__ || Object.getPrototypeOf(TypeInArrayExpr.prototype), 'update', this).call(this);
            var sz_after = this.size;
        }
    }]);

    return TypeInArrayExpr;
}(ContextualTypeInTextExpr);

var StringStarExpr = function (_StringValueExpr2) {
    _inherits(StringStarExpr, _StringValueExpr2);

    function StringStarExpr() {
        _classCallCheck(this, StringStarExpr);

        return _possibleConstructorReturn(this, (StringStarExpr.__proto__ || Object.getPrototypeOf(StringStarExpr)).call(this, 'star'));
    }

    return StringStarExpr;
}(StringValueExpr);

var StringRectExpr = function (_StringValueExpr3) {
    _inherits(StringRectExpr, _StringValueExpr3);

    function StringRectExpr() {
        _classCallCheck(this, StringRectExpr);

        return _possibleConstructorReturn(this, (StringRectExpr.__proto__ || Object.getPrototypeOf(StringRectExpr)).call(this, 'rect'));
    }

    return StringRectExpr;
}(StringValueExpr);

var StringTriangleExpr = function (_StringValueExpr4) {
    _inherits(StringTriangleExpr, _StringValueExpr4);

    function StringTriangleExpr() {
        _classCallCheck(this, StringTriangleExpr);

        return _possibleConstructorReturn(this, (StringTriangleExpr.__proto__ || Object.getPrototypeOf(StringTriangleExpr)).call(this, 'tri', 'triangle'));
    }

    return StringTriangleExpr;
}(StringValueExpr);

var StringCircleExpr = function (_StringValueExpr5) {
    _inherits(StringCircleExpr, _StringValueExpr5);

    function StringCircleExpr() {
        _classCallCheck(this, StringCircleExpr);

        return _possibleConstructorReturn(this, (StringCircleExpr.__proto__ || Object.getPrototypeOf(StringCircleExpr)).call(this, 'dot', 'circle'));
    }

    return StringCircleExpr;
}(StringValueExpr);

var StringAddExpr = function (_Expression5) {
    _inherits(StringAddExpr, _Expression5);

    function StringAddExpr(left, right) {
        _classCallCheck(this, StringAddExpr);

        var op = new TextExpr("+");
        /*if (left instanceof MissingExpression && !(left instanceof MissingNumberExpression))
            left = new MissingNumberExpression();
        if (right instanceof MissingExpression && !(right instanceof MissingNumberExpression))
            right = new MissingNumberExpression();*/
        return _possibleConstructorReturn(this, (StringAddExpr.__proto__ || Object.getPrototypeOf(StringAddExpr)).call(this, [left, op, right]));
    }

    _createClass(StringAddExpr, [{
        key: 'canReduce',
        value: function canReduce() {
            return this.leftExpr && (this.leftExpr.isValue() || this.leftExpr.canReduce()) && this.rightExpr && (this.rightExpr.isValue() || this.rightExpr.canReduce());
        }
    }, {
        key: 'performReduction',
        value: function performReduction() {
            var _this29 = this;

            return this.performSubReduction(this.leftExpr).then(function (left) {
                if (!(left instanceof StringValueExpr)) {
                    return Promise.reject();
                }
                return _this29.performSubReduction(_this29.rightExpr).then(function (right) {
                    if (!(right instanceof StringValueExpr)) {
                        return Promise.reject();
                    }

                    var stage = _this29.stage;

                    var val = _get(StringAddExpr.prototype.__proto__ || Object.getPrototypeOf(StringAddExpr.prototype), 'performReduction', _this29).call(_this29);
                    stage.update();
                    return val;
                });
            });
        }
    }, {
        key: 'onmouseclick',
        value: function onmouseclick() {
            //this.performUserReduction();
            console.log("clicked Operator Expression!!");
            if (!this._animating) {
                this.performReduction();
            }
        }
    }, {
        key: 'toString',
        value: function toString() {
            return (this.locked ? '/(' : '(') + this.op.toString() + ' ' + this.leftExpr.toString() + ' ' + this.rightExpr.toString() + ')';
        }
    }, {
        key: 'toJavaScript',
        value: function toJavaScript() {
            return this.leftExpr.toJavaScript() + ' + ' + this.rightExpr.toJavaScript();
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            if (this.leftExpr instanceof StringValueExpr && this.rightExpr instanceof StringValueExpr) {
                return new (ExprManager.getClass('string'))(this.leftExpr.value() + this.rightExpr.value());
            } else {
                return this;
            }
        }
    }, {
        key: 'leftExpr',
        get: function get() {
            return this.holes[0];
        }
    }, {
        key: 'rightExpr',
        get: function get() {
            return this.holes[2];
        }
    }, {
        key: 'op',
        get: function get() {
            return this.holes[1];
        }
    }]);

    return StringAddExpr;
}(Expression);