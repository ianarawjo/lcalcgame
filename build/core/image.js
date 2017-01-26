'use strict';

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var mag = function (_) {
    var ImageRect = function (_$Rect) {
        _inherits(ImageRect, _$Rect);

        function ImageRect(x, y, w, h, resource_key) {
            _classCallCheck(this, ImageRect);

            // Just passing resource_key as first argument
            // should set w, h to the image's pixel width and height.
            if (arguments.length === 1 && typeof x === 'string') {
                var img = Resource.getImage(x);
                if (!img) x = y = w = h = 0;else {
                    resource_key = x;
                    x = 0;y = 0;
                    w = img.naturalWidth;
                    h = img.naturalHeight;
                }
            }

            var _this = _possibleConstructorReturn(this, (ImageRect.__proto__ || Object.getPrototypeOf(ImageRect)).call(this, x, y, w, h));

            _this.image = resource_key;
            _this._offset = { x: 0, y: 0 };
            return _this;
        }

        _createClass(ImageRect, [{
            key: 'drawInternal',
            value: function drawInternal(ctx, pos, boundingSize) {
                if (!this.image) {
                    //console.error('@ ImageRect: Cannot draw image ', this.image, ' in context ', ctx);
                    ctx.fillStyle = 'pink';
                    ctx.fillRect(pos.x, pos.y, boundingSize.w, boundingSize.h);
                    return;
                } else if (!ctx) {
                    console.error('@ ImageRect: Cannot draw image ', this.image, ' in context ', ctx);
                    return;
                }
                var ri = Resource.getImage(this.image);
                if (!ri) {
                    console.error('@ ImageRect: Cannot find resource image named ', this.image);
                    return;
                }
                ctx.drawImage(ri, pos.x + this._offset.x, pos.y + this._offset.y, boundingSize.w, boundingSize.h);
            }
        }, {
            key: 'offset',
            get: function get() {
                return { x: this._offset.x, y: this._offset.y };
            },
            set: function set(o) {
                this._offset = { x: o.x, y: o.y };
            }
        }]);

        return ImageRect;
    }(_.Rect);

    var RotatableImageRect = function (_ImageRect) {
        _inherits(RotatableImageRect, _ImageRect);

        function RotatableImageRect(x, y, w, h, resource_key) {
            _classCallCheck(this, RotatableImageRect);

            if (typeof x === 'string') {
                ;

                var _this2 = _possibleConstructorReturn(this, (RotatableImageRect.__proto__ || Object.getPrototypeOf(RotatableImageRect)).call(this, x));
            } else {
                ;

                var _this2 = _possibleConstructorReturn(this, (RotatableImageRect.__proto__ || Object.getPrototypeOf(RotatableImageRect)).call(this, x, y, w, h, resource_key));
            }_this2.rotation = 0;
            return _possibleConstructorReturn(_this2);
        }

        _createClass(RotatableImageRect, [{
            key: 'draw',
            value: function draw(ctx) {
                var _this3 = this;

                if (!ctx) return;
                ctx.save();
                if (this.opacity !== undefined && this.opacity < 1.0) {
                    ctx.globalAlpha = this.opacity;
                }
                var boundingSize = this.absoluteSize;
                var upperLeftPos = this.upperLeftPos(this.absolutePos, boundingSize);

                ctx.translate(upperLeftPos.x + this._offset.x, upperLeftPos.y + this._offset.y);
                ctx.rotate(this.rotation);

                if (this._color || this.stroke) this.drawInternal(ctx, zeroPos(), boundingSize);

                this.children.forEach(function (child) {
                    var realpos = child.pos;
                    var scale = _this3.absoluteScale;
                    child.parent = _this3;
                    child.pos = { x: (-upperLeftPos.x - _this3._offset.x) / scale.x + realpos.x, y: (-upperLeftPos.y - _this3._offset.y) / scale.y + realpos.y };
                    child.draw(ctx);
                    child.pos = realpos;
                });

                if (this._color || this.stroke) this.drawInternalAfterChildren(ctx, upperLeftPos, boundingSize);

                ctx.restore();
            }
        }, {
            key: 'drawInternalAfterChildren',
            value: function drawInternalAfterChildren(ctx, pos, boundingSize) {
                _get(RotatableImageRect.prototype.__proto__ || Object.getPrototypeOf(RotatableImageRect.prototype), 'drawInternalAfterChildren', this).call(this, ctx, pos, boundingSize);
                ctx.restore();
            }
        }]);

        return RotatableImageRect;
    }(ImageRect);

    var PatternRect = function (_ImageRect2) {
        _inherits(PatternRect, _ImageRect2);

        function PatternRect() {
            _classCallCheck(this, PatternRect);

            return _possibleConstructorReturn(this, (PatternRect.__proto__ || Object.getPrototypeOf(PatternRect)).apply(this, arguments));
        }

        _createClass(PatternRect, [{
            key: 'drawInternal',
            value: function drawInternal(ctx, pos, boundingSize) {
                if (!ctx || !this.image) return;
                ctx.save();
                var ptrn = ctx.createPattern(Resource.getImage(this.image), 'repeat');
                ctx.fillStyle = ptrn;
                ctx.fillRect(pos.x + this._offset.x, pos.y + this._offset.y, boundingSize.w, boundingSize.h);
                ctx.restore();
            }
        }]);

        return PatternRect;
    }(ImageRect);

    var Button = function (_ImageRect3) {
        _inherits(Button, _ImageRect3);

        function Button(x, y, w, h, resource_map, onclick) {
            _classCallCheck(this, Button);

            if (arguments.length === 2) {
                var _this5 = _possibleConstructorReturn(this, (Button.__proto__ || Object.getPrototypeOf(Button)).call(this, x.default));

                resource_map = x;
                onclick = y;
            } else {
                ;

                var _this5 = _possibleConstructorReturn(this, (Button.__proto__ || Object.getPrototypeOf(Button)).call(this, x, y, w, h, resource_map.default));
            } // where resource_map properties are:
            //  { default, hover (optional), down (opt.) }
            _this5.images = resource_map;
            _this5.clickFunc = onclick;
            return _possibleConstructorReturn(_this5);
        }

        _createClass(Button, [{
            key: 'onmouseenter',
            value: function onmouseenter(pos) {
                if ('hover' in this.images) this.image = this.images.hover;
            }
        }, {
            key: 'onmouseleave',
            value: function onmouseleave(pos) {
                this.image = this.images.default;
            }
        }, {
            key: 'onmousedown',
            value: function onmousedown(pos) {
                if ('down' in this.images) this.image = this.images.down;
            }
        }, {
            key: 'onmouseup',
            value: function onmouseup(pos) {
                this.image = this.images.default;
                if (this.clickFunc) this.clickFunc();
            }
        }]);

        return Button;
    }(ImageRect);

    _.ImageRect = ImageRect;
    _.RotatableImageRect = RotatableImageRect;
    _.PatternRect = PatternRect;
    _.Button = Button;
    return _;
}(mag || {});