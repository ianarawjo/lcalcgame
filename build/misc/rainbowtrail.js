'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RainbowTrail = function (_mag$Rect) {
    _inherits(RainbowTrail, _mag$Rect);

    function RainbowTrail(x, y, w, h) {
        _classCallCheck(this, RainbowTrail);

        var _this = _possibleConstructorReturn(this, (RainbowTrail.__proto__ || Object.getPrototypeOf(RainbowTrail)).call(this, x, y, w, h));

        _this.time = 0;
        return _this;
    }

    _createClass(RainbowTrail, [{
        key: 'drawInternal',
        value: function drawInternal(ctx, pos, boundingSize) {

            var x, y;
            var t = this.time;

            var gradient = ctx.createLinearGradient(boundingSize.w / 4.0, 0, boundingSize.w, 0);
            gradient.addColorStop(0, 'red');
            gradient.addColorStop(1 / 6, 'orange');
            gradient.addColorStop(2 / 6, 'yellow');
            gradient.addColorStop(3 / 6, 'green');
            gradient.addColorStop(4 / 6, 'blue');
            gradient.addColorStop(5 / 6, 'indigo');
            gradient.addColorStop(1, 'violet');
            this.gradient = gradient;

            // Save the state
            ctx.save();
            ctx.fillStyle = this.gradient;
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;

            ctx.translate(pos.x, pos.y);

            // Rainbow effect's animated contour
            var startY = boundingSize.h / 2.0;
            var dist = boundingSize.h;
            var amp = 8;
            ctx.beginPath();
            for (x = 0; x <= 360; x += 1) {
                y = startY - dist / 2 * (x / 360) - amp * Math.sin(x * Math.PI / 56 + t / 100) * (x / 360) * Math.pow((360 - x) / 360, 0.5);
                ctx.lineTo(x / 360 * boundingSize.w, y);
            }
            for (x = 360; x >= 0; x -= 1) {
                y = startY + dist / 2 * (x / 360) - amp * Math.sin(x * Math.PI / 56 + t / 80) * (x / 360) * Math.pow((360 - x) / 360, 0.5);
                ctx.lineTo(x / 360 * boundingSize.w, y);
            }
            ctx.fill();
            ctx.stroke();

            ctx.restore();
        }
    }]);

    return RainbowTrail;
}(mag.Rect);