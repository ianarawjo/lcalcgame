'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/** A node representing a line-based path, ending in a pointed arrow.
 * Contains ArrowPath.
 * @module arrowpath
 */

var ArrowPath = function (_mag$Node) {
    _inherits(ArrowPath, _mag$Node);

    function ArrowPath() {
        var points = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
        var stroke = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { color: 'black', lineWidth: 1 };
        var arrowWidth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 8;
        var drawArrow = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

        _classCallCheck(this, ArrowPath);

        var _this = _possibleConstructorReturn(this, (ArrowPath.__proto__ || Object.getPrototypeOf(ArrowPath)).call(this, 0, 0));

        _this.stroke = stroke;
        _this.points = points;
        _this.arrowWidth = arrowWidth;
        _this.drawArrowHead = drawArrow;
        _this.percentDrawn = 1;
        return _this;
    }

    _createClass(ArrowPath, [{
        key: 'addPoint',
        value: function addPoint(pt) {
            if (!this.points) this.points = [];
            this.points.push({ x: pt.x, y: pt.y });
        }
    }, {
        key: 'pointAtIndex',
        value: function pointAtIndex(i) {
            return { x: this.points[i].x, y: this.points[i].y };
        }
    }, {
        key: 'posAlongPath',


        // Takes a number from 0.0 to 1.0, representing start to end, respectively,
        // and returns the corresponding position along the path if it were treated like a single line.
        value: function posAlongPath(elapsed) {
            if (elapsed < 0) return this.pointAtIndex(0);else if (elapsed > 1) return this.lastPoint;

            var totalLen = this.pathLength;
            var fraction = 0;
            for (var i = 1; i < this.points.length; i++) {
                var len = distBetweenPos(this.points[i - 1], this.points[i]);
                if (elapsed < fraction + len / totalLen) {
                    var seg_elapsed = elapsed - fraction;
                    var vec = fromTo(this.points[i - 1], this.points[i]);
                    var seg_len = lengthOfPos(vec) * seg_elapsed;
                    return addPos(this.points[i - 1], rescalePos(vec, seg_len));
                }
                fraction += len / totalLen;
            }

            return this.lastPoint;
        }
    }, {
        key: 'indexOfPointNearest',
        value: function indexOfPointNearest(elapsed) {
            if (elapsed < 0) return this.pointAtIndex(0);else if (elapsed > 1) return this.lastPoint;

            var totalLen = this.pathLength;
            var fraction = 0;
            for (var i = 1; i < this.points.length; i++) {
                var len = distBetweenPos(this.points[i - 1], this.points[i]);
                if (elapsed < fraction + len / totalLen) return i - 1;
                fraction += len / totalLen;
            }

            return this.points.length - 1;
        }
    }, {
        key: 'draw',
        value: function draw(ctx, offset) {
            this.drawInternal(ctx, this.absolutePos);
        }

        // Draw path.

    }, {
        key: 'drawInternal',
        value: function drawInternal(ctx, pos) {
            if (!this.points || this.points.length === 0) return;
            var abs_scale = this.parent.absoluteScale;
            var lastpt = this.lastPoint; //addPos( pos, this.lastPoint );

            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.scale(abs_scale.x, abs_scale.y);

            setStrokeStyle(ctx, this.stroke);
            ctx.fillStyle = null;

            // Draw lines.
            var startpt = this.points[0];
            ctx.beginPath();
            ctx.moveTo(startpt.x, startpt.y);

            if (this.percentDrawn > 0.999) {
                this.points.slice(1).forEach(function (pt) {
                    var p = pt;
                    ctx.lineTo(p.x, p.y);
                });
            } else {
                var idx = this.indexOfPointNearest(this.percentDrawn);
                if (idx > 1) {
                    this.points.slice(1, idx).forEach(function (pt) {
                        var p = pt;
                        ctx.lineTo(p.x, p.y);
                    });
                }
            }
            if (this.stroke) ctx.stroke();

            // Draw arrowhead.
            if (this.drawArrowHead) {
                var lastseg = reversePos(rescalePos(this.lastSegment, this.arrowWidth)); // Vector pointing from final point to 2nd-to-last point.
                var leftpt = addPos(rotateBy(lastseg, Math.PI / 4.0), lastpt);
                var rightpt = addPos(rotateBy(lastseg, -Math.PI / 4.0), lastpt);
                ctx.fillStyle = this.stroke ? this.stroke.color : null;
                setStrokeStyle(ctx, null);
                ctx.beginPath();
                ctx.moveTo(lastpt.x, lastpt.y);
                ctx.lineTo(leftpt.x, leftpt.y);
                ctx.lineTo(rightpt.x, rightpt.y);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
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
        key: 'color',
        get: function get() {
            return this.stroke.color;
        },
        set: function set(clr) {
            this.stroke.color = clr;
        }
    }, {
        key: 'pathLength',
        get: function get() {
            var len = 0;
            for (var i = 1; i < this.points.length; i++) {
                len += distBetweenPos(this.points[i - 1], this.points[i]);
            }return len;
        }
    }, {
        key: 'lastPoint',
        get: function get() {
            return this.pointAtIndex(this.points.length - 1);
        }
    }, {
        key: 'lastSegment',
        get: function get() {
            var p1 = this.pointAtIndex(this.points.length - 2);
            var p2 = this.pointAtIndex(this.points.length - 1);
            return fromTo(p1, p2);
        }
    }]);

    return ArrowPath;
}(mag.Node);