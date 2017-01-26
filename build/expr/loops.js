"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SCALE_FACTOR = 0.33;

var RepeatLoopExpr = function (_Expression) {
    _inherits(RepeatLoopExpr, _Expression);

    function RepeatLoopExpr(times, body) {
        _classCallCheck(this, RepeatLoopExpr);

        var _this = _possibleConstructorReturn(this, (RepeatLoopExpr.__proto__ || Object.getPrototypeOf(RepeatLoopExpr)).call(this, [times, body]));

        _this.markerAngle = 0;
        _this.color = "orange";
        return _this;
    }

    _createClass(RepeatLoopExpr, [{
        key: "update",
        value: function update() {
            _get(RepeatLoopExpr.prototype.__proto__ || Object.getPrototypeOf(RepeatLoopExpr.prototype), "update", this).call(this);
            var centerX = this.size.w / 2;
            var centerY = this.size.h / 2;
            var outerR = 0.9 * this.size.h / 2;
            if (this.timesExpr) {
                this.timesExpr.stroke = {
                    color: "#999",
                    width: 2
                };
                this.timesExpr.pos = {
                    x: centerX - outerR - this.timesExpr.size.w / 2,
                    y: centerY
                };
            }
            if (this.bodyExpr) {
                this.bodyExpr.stroke = {
                    color: "#999",
                    width: 2
                };
                this.bodyExpr.pos = {
                    x: centerX + outerR - Math.min(25, this.bodyExpr.size.w / 2),
                    y: centerY
                };
            }
        }
    }, {
        key: "drawInternal",
        value: function drawInternal(ctx, pos, boundingSize) {
            _get(RepeatLoopExpr.prototype.__proto__ || Object.getPrototypeOf(RepeatLoopExpr.prototype), "drawInternal", this).call(this, ctx, pos, boundingSize);

            var centerX = pos.x + boundingSize.w / 2;
            var centerY = pos.y + boundingSize.h / 2;
            var outerR = 0.9 * boundingSize.h / 2;

            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.strokeStyle = ctx.fillStyle = 'black';
            ctx.arc(centerX, centerY, outerR, 0, Math.PI * 2);
            ctx.closePath();
            ctx.stroke();

            // draw the arrows
            var dy = Math.abs(this.timesExpr.absolutePos.y + this.timesExpr.absoluteSize.h / 2 - centerY);
            var lowerTipAngle = Math.PI - Math.asin(dy / outerR);
            drawArrowOnArc(ctx, lowerTipAngle, -Math.PI / 10, centerX, centerY, outerR);

            dy = Math.abs(this.bodyExpr.absolutePos.y - this.bodyExpr.absoluteSize.h / 2 - centerY);
            var upperTipAngle = -Math.asin(dy / outerR);
            drawArrowOnArc(ctx, upperTipAngle, -Math.PI / 10, centerX, centerY, outerR);

            ctx.beginPath();
            ctx.moveTo(centerX - 5, centerY - 5);
            ctx.lineTo(centerX + 5, centerY + 5);
            ctx.moveTo(centerX + 5, centerY - 5);
            ctx.lineTo(centerX - 5, centerY + 5);
            ctx.stroke();
        }
    }, {
        key: "performReduction",
        value: function performReduction() {
            var _this2 = this;

            if (!this.bodyExpr.isComplete()) {
                Animate.blink(this.bodyExpr, 300, [1.0, 0.0, 0.0]);
                return Promise.reject("RepeatLoopExpr: missing body!");
            }

            this._cachedSize = this.size;
            this._animating = true;

            return this.performSubReduction(this.timesExpr).then(function (num) {
                if (!(num instanceof NumberExpr) || !_this2.bodyExpr || _this2.bodyExpr instanceof MissingExpression) {
                    _this2._animating = false;
                    return Promise.reject("RepeatLoopExpr incomplete!");
                }

                if (num.number <= 0) {
                    Animate.poof(_this2);
                    (_this2.parent || _this2.stage).swap(_this2, null);
                    return null;
                }

                var exprs = [];
                for (var i = 0; i < num.number; i++) {
                    exprs.push(_this2.bodyExpr.clone());
                }

                var result = new (Function.prototype.bind.apply(Sequence, [null].concat(exprs)))();
                (_this2.parent || _this2.stage).swap(_this2, result);
                result.update();
                return result;
            });
        }
    }, {
        key: "onmouseclick",
        value: function onmouseclick() {
            if (!this._animating) {
                this.performReduction();
            }
        }
    }, {
        key: "timesExpr",
        get: function get() {
            return this.holes[0];
        }
    }, {
        key: "bodyExpr",
        get: function get() {
            return this.holes[1];
        }
    }, {
        key: "size",
        get: function get() {
            if (this._animating) return this._cachedSize;
            var subSize = this.timesExpr.size;
            var subHeight = Math.max(this.timesExpr.size.h, this.bodyExpr.size.h);
            var w = subSize.w * 2.25;
            var h = subHeight * 1.5;
            if (w < h) w = h;
            return {
                w: w,
                h: h
            };
        }
    }]);

    return RepeatLoopExpr;
}(Expression);

function drawArrowOnArc(ctx, tipAngle, deltaAngle, centerX, centerY, radius) {
    var baseAngle = tipAngle + deltaAngle;
    ctx.beginPath();
    ctx.moveTo(centerX + 0.9 * radius * Math.cos(baseAngle), centerY + 0.9 * radius * Math.sin(baseAngle));
    ctx.lineTo(centerX + 1.1 * radius * Math.cos(baseAngle), centerY + 1.1 * radius * Math.sin(baseAngle));
    ctx.lineTo(centerX + radius * Math.cos(tipAngle), centerY + radius * Math.sin(tipAngle));
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
}