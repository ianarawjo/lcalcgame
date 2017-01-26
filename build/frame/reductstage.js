'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/** A subclass of Stage that assumes Nodes are Expressions
    and allows for saving state. */

var ReductStage = function (_mag$Stage) {
    _inherits(ReductStage, _mag$Stage);

    function ReductStage() {
        var canvas = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

        _classCallCheck(this, ReductStage);

        var _this = _possibleConstructorReturn(this, (ReductStage.__proto__ || Object.getPrototypeOf(ReductStage)).call(this, canvas));

        _this.stateStack = [];
        _this.environment = new Environment();
        return _this;
    }

    // Save state of game board and push onto undo stack.


    _createClass(ReductStage, [{
        key: 'saveState',
        value: function saveState() {
            // TODO: DML save and restore the environment as well.
            var board = this.expressionNodes().map(function (n) {
                return n.clone();
            });
            board = board.filter(function (n) {
                return !(n instanceof ExpressionEffect);
            });
            var toolbox = this.toolboxNodes().map(function (n) {
                return n.clone();
            });
            this.stateStack.push({ 'board': board, 'toolbox': toolbox });
        }

        // Restore previous state of game board.

    }, {
        key: 'restoreState',
        value: function restoreState() {
            var _this2 = this;

            if (this.stateStack.length > 0) {
                //this.nodes = this.stateStack.pop();

                this.expressionNodes().forEach(function (n) {
                    return _this2.remove(n);
                });
                this.toolboxNodes().forEach(function (n) {
                    return _this2.remove(n);
                });
                var restored_state = this.stateStack.pop();
                restored_state.board.forEach(function (n) {
                    return _this2.add(n);
                });
                restored_state.toolbox.forEach(function (n) {
                    n.toolbox = _this2.toolbox;
                    _this2.add(n);
                });

                this.update();
                this.draw();

                Logger.log('state-restore', this.toString());
            }
        }
    }, {
        key: 'dumpState',
        value: function dumpState() {
            if (this.stateStack.length > 0) {
                this.stateStack.pop();
            }
        }

        // Checks for level completion.

    }, {
        key: 'update',
        value: function update() {
            var _this3 = this;

            _get(ReductStage.prototype.__proto__ || Object.getPrototypeOf(ReductStage.prototype), 'update', this).call(this);

            if (this.isCompleted) {
                var level_complete = this.isCompleted();

                if (level_complete) {

                    // DEBUG TEST FLYTO ANIMATION.
                    if (!this.ranCompletionAnim) {
                        (function () {

                            Logger.log('victory', { 'final_state': _this3.toString(), 'num_of_moves': undefined });

                            var you_win = function you_win() {

                                if (level_idx < 1) {
                                    var cmp = new mag.ImageRect(GLOBAL_DEFAULT_SCREENSIZE.w / 2, GLOBAL_DEFAULT_SCREENSIZE.h / 2, 740 / 2, 146 / 2, 'victory');
                                    cmp.anchor = { x: 0.5, y: 0.5 };
                                    _this3.add(cmp);
                                    _this3.draw();

                                    Resource.play('victory');
                                    Animate.wait(1080).after(function () {
                                        next();
                                    });
                                } else {
                                    // Skip victory jingle on every level after first.
                                    next();
                                }
                            };

                            var pairs = level_complete;
                            var num_exploded = 0;
                            var playedSplosionAudio = false;

                            pairs.forEach(function (pair, idx) {
                                var node = pair[0];
                                var goalNode = pair[1];
                                node.ignoreEvents = true;

                                Resource.play('matching-goal');

                                var blinkCount = level_idx === 0 ? 2 : 1;
                                Animate.blink([node, goalNode], 2500 / 2.0 * blinkCount, [0, 1, 1], blinkCount).after(function () {
                                    //Resource.play('shootwee');

                                    _this3.playerWon = true;

                                    //Animate.flyToTarget(node, goalNode.absolutePos, 2500.0, { x:200, y:300 }, () => {
                                    SplosionEffect.run(node);
                                    SplosionEffect.run(goalNode);

                                    if (!playedSplosionAudio) {
                                        // Play sFx.
                                        Resource.play('splosion');
                                        playedSplosionAudio = true;
                                    }

                                    goalNode.parent.removeChild(goalNode);
                                    num_exploded++;
                                    if (num_exploded === pairs.length) {
                                        Animate.wait(500).after(you_win);
                                    }
                                    //});
                                });
                            });

                            _this3.ranCompletionAnim = true;
                        })();
                    }
                }
            }
        }
    }, {
        key: 'onmouseclick',
        value: function onmouseclick(pos) {

            // Let player click to continue.
            if (!__IS_MOBILE && this.playerWon) {
                Logger.log('clicked-to-continue', '');
                next();
            }

            _get(ReductStage.prototype.__proto__ || Object.getPrototypeOf(ReductStage.prototype), 'onmouseclick', this).call(this, pos);
        }
    }, {
        key: 'toString',
        value: function toString() {
            var stringify = function stringify(nodes) {
                return nodes.reduce(function (prev, curr) {
                    var s = curr.toString();
                    if (s === '()') return prev; // Skip empty expressions.
                    else return prev + curr.toString() + ' ';
                }, '').trim();
            };

            var board = this.expressionNodes();
            var toolbox = this.toolboxNodes();
            var exp = {
                'board': stringify(board),
                'toolbox': stringify(toolbox)
            };

            return JSON.stringify(exp);
        }
    }]);

    return ReductStage;
}(mag.Stage);