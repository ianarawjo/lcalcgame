'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// The panel at the bottom of the screen.

var Toolbox = function (_mag$ImageRect) {
    _inherits(Toolbox, _mag$ImageRect);

    function Toolbox(x, y, w, h) {
        var exprs = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];

        _classCallCheck(this, Toolbox);

        var _this = _possibleConstructorReturn(this, (Toolbox.__proto__ || Object.getPrototypeOf(Toolbox)).call(this, x, y, w, h, 'toolbox-bg'));

        _this.items = exprs;
        _this.padding = 20;
        return _this;
    }

    _createClass(Toolbox, [{
        key: 'addExpression',


        // Adds an expression to the toolbox. Animates to new position.
        value: function addExpression(e) {
            var animated = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;


            // Add expression to toolbox.
            var toolbox = this;
            this.items.push(e);
            e.toolbox = this;
            //e.onmousedrag = function (pos) {
            //    super.onmousedrag(pos); // perform whatever the drag event is on this expression
            //    toolbox.removeExpression(e); // remove this expression from the toolbox
            //};

            // Disable the onclick handler so that you can't reduce things
            // in the toolbox
            e._origonmouseclick = e.onmouseclick;
            e.onmouseclick = function () {};

            // Animate new expression to toolbox position.
            this.setLayout(animated);
        }

        // Removes an expression from toolbox.

    }, {
        key: 'removeExpression',
        value: function removeExpression(e) {
            var animated = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

            var idx = this.items.indexOf(e);
            if (idx > -1) {
                this.items.splice(idx, 1);
                this.setLayout(animated); // rearrange remaining items
                e.scale = { x: 1, y: 1 };
                // Restore the onclick handler
                e.onmouseclick = e._origonmouseclick;
            }
        }

        // Set expression positions in toolbox.

    }, {
        key: 'setLayout',
        value: function setLayout() {
            var _this2 = this;

            var animated = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            var pos = this.leftEdgePos;
            this.items.forEach(function (e) {
                e.update();
                e.anchor = { x: 0, y: 0.5 };
                if (animated) Animate.tween(e, { pos: pos }, 300, function (elapsed) {
                    return Math.pow(elapsed, 0.5);
                });else e.pos = pos;
                pos = addPos(pos, { x: e.size.w + _this2.padding, y: 0 });
            });
        }
    }, {
        key: 'ondropped',
        value: function ondropped(node, pos) {

            if (!node.toolbox) {
                // Can't drag nodes onto toolbox that aren't already elements --
                // once it's placed on the board, you can't drag it back.
                Logger.log('toolbox-reject', node.toString());
                Animate.tween(node, { pos: { x: node.pos.x, y: this.pos.y - node.size.h * 1.2 } }, 200, function (elapsed) {
                    return Math.pow(elapsed, 2);
                });
                return;
            } else if (node.toolbox && node.toolbox != this) {
                console.error('@ Toolbox.ondropped: Node toolbox does not match current toolbox instance.');
                return;
            }

            // User changed their minds about removing item from toolbox.
            // Add item back to the toolbox.
            this.addExpression(node);
            Logger.log('toolbox-addback', node.toString());
        }
    }, {
        key: 'leftEdgePos',
        get: function get() {
            return { x: this.padding * 2 + this.pos.x, y: this.size.h / 2.0 + this.pos.y };
        }
    }]);

    return Toolbox;
}(mag.ImageRect);