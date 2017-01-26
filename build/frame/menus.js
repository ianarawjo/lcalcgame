'use strict';

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _set = function set(object, property, value, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent !== null) { set(parent, property, value, receiver); } } else if ("value" in desc && desc.writable) { desc.value = value; } else { var setter = desc.set; if (setter !== undefined) { setter.call(receiver, value); } } return value; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MenuButton = function (_mag$RoundedRect) {
    _inherits(MenuButton, _mag$RoundedRect);

    function MenuButton(x, y, w, h, text, onclick) {
        var color = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 'gold';
        var textColor = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 'orange';
        var shadowColor = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : 'orange';
        var onDownShadowColor = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : 'red';

        _classCallCheck(this, MenuButton);

        var _this2 = _possibleConstructorReturn(this, (MenuButton.__proto__ || Object.getPrototypeOf(MenuButton)).call(this, x, y, w, h, 10));

        var t = new TextExpr(text, 'Futura');
        t.color = textColor;
        t.anchor = { x: 0.5, y: 0.5 };
        t.pos = { x: w / 2, y: h / 2 };
        _this2.text = t;
        _this2.addChild(t);

        _this2.origShadowOffset = 14;
        _this2.shadowOffset = 14;
        _this2.hoverIndent = -4;
        _this2.downIndent = 4;
        _this2.shadowColor = shadowColor;
        _this2.onDownColor = shadowColor;
        _this2.onDownShadowColor = onDownShadowColor;
        _this2.onUpShadowColor = shadowColor;
        _this2.onUpColor = color;
        _this2.textColor = textColor;
        _this2.color = color;

        _this2.clickFunc = onclick;

        _this2.pos = { x: x, y: y };
        return _this2;
    }

    _createClass(MenuButton, [{
        key: 'runButtonClickEffect',
        value: function runButtonClickEffect() {
            var _this3 = this;

            var rr = new mag.RoundedRect(this.absolutePos.x, this.absolutePos.y, this.absoluteSize.w, this.absoluteSize.h, this.radius);
            rr.color = null;
            rr.shadowOffset = 0;
            rr.anchor = this.anchor;
            rr.ignoreEvents = true;
            rr.stroke = { color: 'white', lineWidth: 4, opacity: 1.0 };
            this.stage.add(rr);

            Animate.chain(function (elapsed) {
                var c = colorTween(elapsed, [1, 215 / 255.0, 0], [1, 1, 1]);
                var sc = colorTween(elapsed, [1, 0, 0], [0.8, 0.8, 0.8]);
                _this3.color = c;
                _this3.text.color = c;
                _this3.shadowColor = sc;
                _this3.stage.draw();
            }, 200, null, function (elapsed) {
                //elapsed = elapsed * elapsed;
                rr.scale = { x: 1 + elapsed, y: 1 + elapsed };
                rr.stroke.opacity = 1 - elapsed;
                _this3.stage.draw();
            }, 160, function () {
                _this3.stage.remove(rr);
                _this3.onmouseleave();
                _this3.stage.draw();
                if (_this3.clickFunc) {
                    _this3.clickFunc();
                }
            });
        }
    }, {
        key: 'onmouseenter',
        value: function onmouseenter(pos) {
            this.color = this.onDownColor;
            this.shadowColor = this.onDownShadowColor;
            this.shadowOffset = this.origShadowOffset - this.hoverIndent;
            this.text.color = 'white';
            this._pos.y += this.hoverIndent;
        }
    }, {
        key: 'onmouseleave',
        value: function onmouseleave(pos) {
            this.color = this.onUpColor;
            this.shadowColor = this.onUpShadowColor;
            this.text.color = this.textColor;
            this._pos.y = this._origpos.y;
            this.shadowOffset = this.origShadowOffset;
        }
    }, {
        key: 'onmousedrag',
        value: function onmousedrag(pos) {
            var hits = this.hits(pos);
            if (!hits && this.color !== this.onUpColor) {
                this.onmouseleave(pos);
            } else if (this.color === this.onUpColor && hits) {
                this.onmouseenter(pos);
                this.onmousedown(pos);
            }
        }
    }, {
        key: 'onmousedown',
        value: function onmousedown(pos) {
            this._prevy = this._pos.y;
            this._pos.y += this.shadowOffset - this.downIndent;
            this.shadowOffset = this.downIndent;
            //this.color = this.onUpColor;
            Resource.play('fatbtn-click');
        }
    }, {
        key: 'onmouseup',
        value: function onmouseup(pos) {
            if (!this.hits(pos)) return;
            this._pos.y = this._origpos.y;
            this.shadowOffset = this.origShadowOffset;
            this.runButtonClickEffect();
            Animate.wait(50).after(function () {
                return Resource.play('fatbtn-beep');
            });
        }
    }, {
        key: 'pos',
        get: function get() {
            return { x: this._pos.x, y: this._pos.y };
        },
        set: function set(p) {
            _set(MenuButton.prototype.__proto__ || Object.getPrototypeOf(MenuButton.prototype), 'pos', p, this);
            this._origpos = { x: p.x, y: p.y };
        }
    }]);

    return MenuButton;
}(mag.RoundedRect);

var MenuStar = function (_mag$ImageRect) {
    _inherits(MenuStar, _mag$ImageRect);

    function MenuStar() {
        _classCallCheck(this, MenuStar);

        return _possibleConstructorReturn(this, (MenuStar.__proto__ || Object.getPrototypeOf(MenuStar)).call(this, 'mainmenu-star' + Math.floor(Math.random() * 14 + 1)));
    }

    _createClass(MenuStar, [{
        key: 'twinkle',
        value: function twinkle() {
            var dur = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 350;

            var blinkDur = dur + Math.random() * 100;
            var _this = this;
            var blink = function blink() {
                if (_this.cancelBlink) return;
                Animate.tween(_this, { opacity: 0.4 }, blinkDur, function (e) {
                    return Math.pow(e, 2);
                }).after(function () {
                    if (_this.cancelBlink) return;
                    Animate.tween(_this, { opacity: 1 }, blinkDur, function (e) {
                        return Math.pow(e, 2);
                    }).after(blink);
                });
            };
            blink();
        }
    }]);

    return MenuStar;
}(mag.ImageRect);

var MainMenu = function (_mag$Stage) {
    _inherits(MainMenu, _mag$Stage);

    function MainMenu() {
        var canvas = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
        var onClickPlay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var onClickSettings = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

        _classCallCheck(this, MainMenu);

        var _this5 = _possibleConstructorReturn(this, (MainMenu.__proto__ || Object.getPrototypeOf(MainMenu)).call(this, canvas));

        var bg = new mag.Rect(0, 0, GLOBAL_DEFAULT_SCREENSIZE.width, GLOBAL_DEFAULT_SCREENSIZE.height);
        bg.color = '#594764';
        bg.pos = zeroPos();
        bg.ignoreEvents = true;
        _this5.add(bg);
        _this5.bg = bg;

        _this5.showStars();
        _this5.showStarboy(onClickPlay);
        _this5.showTitle();
        //this.showPlayButton(onClickPlay);
        //this.showSettingsButton(onClickSettings);
        return _this5;
    }

    _createClass(MainMenu, [{
        key: 'showStars',
        value: function showStars() {
            var _this6 = this;

            var NUM_STARS = 70;
            var STARBOY_RECT = { x: GLOBAL_DEFAULT_SCREENSIZE.width / 2.0 - 298 / 1.8 / 2, y: GLOBAL_DEFAULT_SCREENSIZE.height / 2.1 - 385 / 1.8 / 2, w: 298 / 1.8, h: 385 / 1.8 };
            var genRandomPt = function genRandomPt() {
                return randomPointInRect({ x: 0, y: 0, w: GLOBAL_DEFAULT_SCREENSIZE.width, h: GLOBAL_DEFAULT_SCREENSIZE.height });
            };
            var stars = [];
            var n = NUM_STARS;

            var _loop = function _loop() {

                // Create an instance of a star illustration.
                var star = new MenuStar();
                //star.anchor = { x:0.5, y:0.5 };

                // Find a random position that doesn't intersect other previously created stars.
                var p = genRandomPt();
                for (var i = 0; i < stars.length; i++) {
                    var s = stars[i];
                    var prect = { x: p.x, y: p.y, w: star.size.w, h: star.size.h };
                    var srect = { x: s._pos.x, y: s._pos.y, w: s.size.w, h: s.size.h };
                    if (intersects(STARBOY_RECT, prect) || intersects(prect, srect)) {
                        p = genRandomPt();
                        i = 0;
                    }
                }

                // Set star properties
                star.pos = p;
                star.opacity = 0.4;
                var scale = Math.random() * 0.3 + 0.3;
                star.scale = { x: scale, y: scale };
                _this6.add(star);
                stars.push(star);

                // Twinkling effect
                Animate.wait(1000 * Math.random()).after(function () {
                    return star.twinkle();
                });

                // "Zoom"
                var screenCenter = { x: GLOBAL_DEFAULT_SCREENSIZE.width / 2.0, y: GLOBAL_DEFAULT_SCREENSIZE.height / 2.0 };
                var fromCenter = fromTo(screenCenter, star.pos);
                var offscreenDest = addPos(screenCenter, rescalePos(fromCenter, screenCenter.x * 1.6));
                var comebackDest = addPos(screenCenter, rescalePos(fromCenter, 120));
                var zoom = function zoom() {
                    Animate.tween(star, { pos: offscreenDest, scale: { x: 0.6, y: 0.6 } }, 3000 * distBetweenPos(star.pos, screenCenter) / distBetweenPos(offscreenDest, screenCenter), function (e) {
                        return Math.pow(e, 0.8);
                    }).after(function () {
                        star.pos = comebackDest;
                        star.scale = { x: scale, y: scale };
                        star.opacity = 0;
                        zoom();
                    });
                };
                star.zoomAnimation = function () {

                    zoom();
                    //Animate.wait(distBetweenPos(p, screenCenter) / distBetweenPos(offscreenDest, screenCenter) * 1000).after(zoom);
                };
            };

            while (n-- > 0) {
                _loop();
            }
            this.stars = stars;
        }
    }, {
        key: 'zoom',
        value: function zoom() {
            this.stars.forEach(function (star) {
                star.zoomAnimation();
            });
        }
    }, {
        key: 'showStarboy',
        value: function showStarboy(onclick) {
            var _this7 = this;

            var bg = this.bg;
            var _this = this;
            var starboy = new mag.Button(0, 0, 298 / 1.8, 385 / 1.8, { default: 'mainmenu-starboy', hover: 'mainmenu-starboy-glow', down: 'mainmenu-starboy-glow' }, function () {
                if (_this.title) _this.remove(_this.title);
                Resource.play('mainmenu-enter');
                starboy.cancelFloat = true;
                starboy.ignoreEvents = true;
                Animate.tween(starboy, { scale: { x: 0.0, y: 0.0 } }, 2500, function (e) {
                    return Math.pow(e, 2);
                });
                Animate.wait(2000).after(function () {
                    Animate.run(function (e) {
                        bg.color = colorTween(e, [89 / 255.0, 71 / 255.0, 100 / 255.0], [0, 0, 0]);
                        _this.stars.forEach(function (s) {
                            s.opacity = 1 - e;
                            s.cancelBlink = true;
                        });
                        _this.draw();
                    }, 700).after(function () {
                        _this.stars.forEach(function (s) {
                            _this.remove(s);
                        });
                        _this.stars = [];
                        _this.remove(starboy);
                        _this.starboy = null;
                        _this.draw();
                        onclick();
                    });
                });
                _this7.zoom();
            });
            starboy.anchor = { x: 0.5, y: 0.5 };
            starboy.pos = { x: GLOBAL_DEFAULT_SCREENSIZE.width / 2.0, y: GLOBAL_DEFAULT_SCREENSIZE.height / 2.1 };
            this.add(starboy);

            var y = starboy._pos.y;
            var float = 0;
            var twn = new mag.IndefiniteTween(function (delta) {
                float += delta / 600;
                starboy.pos = { x: starboy.pos.x, y: y + Math.cos(float) * 14 };
                if (starboy.cancelFloat) twn.cancel();
            });
            twn.run();
        }
    }, {
        key: 'showTitle',
        value: function showTitle() {
            var title = new TextExpr('R   E   D   U   C   T', 'Consolas', 30);
            title.color = 'white';
            title.anchor = { x: 0.5, y: 0.5 };
            title.pos = { x: GLOBAL_DEFAULT_SCREENSIZE.width / 2.0, y: GLOBAL_DEFAULT_SCREENSIZE.height / 1.2 };
            this.add(title);
            this.title = title;
        }
    }, {
        key: 'showPlayButton',
        value: function showPlayButton(onClickPlay) {
            var b = new MenuButton(GLOBAL_DEFAULT_SCREENSIZE.width / 2.0, GLOBAL_DEFAULT_SCREENSIZE.height / 2.0 + 80, 140, 100, 'Play', onClickPlay);
            b.anchor = { x: 0.5, y: 0.5 };
            this.add(b);
        }
    }, {
        key: 'showSettingsButton',
        value: function showSettingsButton(onClickSettings) {
            var b = new MenuButton(GLOBAL_DEFAULT_SCREENSIZE.width / 2.0, GLOBAL_DEFAULT_SCREENSIZE.height / 2.0 + 80 + 120, 140, 60, 'Settings', onClickSettings, 'Purple', 'lightgray', 'Indigo', 'Purple');
            b.anchor = { x: 0.5, y: 0.5 };
            this.add(b);
        }
    }]);

    return MainMenu;
}(mag.Stage);

var DraggableRect = function (_mag$Rect) {
    _inherits(DraggableRect, _mag$Rect);

    function DraggableRect() {
        _classCallCheck(this, DraggableRect);

        return _possibleConstructorReturn(this, (DraggableRect.__proto__ || Object.getPrototypeOf(DraggableRect)).apply(this, arguments));
    }

    _createClass(DraggableRect, [{
        key: 'constrainX',
        value: function constrainX() {
            this.cX = true;
        }
    }, {
        key: 'constrainY',
        value: function constrainY() {
            this.cY = true;
        }
    }, {
        key: 'snapEvery',
        value: function snapEvery(step, offset) {
            this.snapStep = step;this.snapOffset = offset;
        }
    }, {
        key: 'onmousedrag',
        value: function onmousedrag(pos) {
            if (this.cX) pos.x = this.pos.x;
            if (this.cY) pos.y = this.pos.y;
            this.pos = pos;
        }
    }, {
        key: 'onmouseup',
        value: function onmouseup(pos) {
            if (!this.snapStep) {
                _get(DraggableRect.prototype.__proto__ || Object.getPrototypeOf(DraggableRect.prototype), 'onmouseup', this).call(this, pos);
                return;
            }

            var targetPos = { x: Math.round(this.pos.x / this.snapStep) * this.snapStep + this.snapOffset, y: this.pos.y };
            Animate.tween(this, { pos: targetPos }, 200, function (elapsed) {
                return Math.pow(elapsed, 0.5);
            });
        }
    }]);

    return DraggableRect;
}(mag.Rect);

var LevelCell = function (_MenuButton) {
    _inherits(LevelCell, _MenuButton);

    function LevelCell() {
        _classCallCheck(this, LevelCell);

        return _possibleConstructorReturn(this, (LevelCell.__proto__ || Object.getPrototypeOf(LevelCell)).apply(this, arguments));
    }

    _createClass(LevelCell, [{
        key: 'lock',
        value: function lock() {
            this.text.text = '🔒';
            this.color = '#666';
            this.shadowColor = 'gray';
            this.pos = { x: this.pos.x, y: this.pos.y + this.shadowOffset - 8 };
            this.shadowOffset = 8;
            this.ignoreEvents = true;
        }
    }]);

    return LevelCell;
}(MenuButton);

var LevelSelectGrid = function (_mag$Rect2) {
    _inherits(LevelSelectGrid, _mag$Rect2);

    function LevelSelectGrid(chapterName, onLevelSelect) {
        _classCallCheck(this, LevelSelectGrid);

        var _this10 = _possibleConstructorReturn(this, (LevelSelectGrid.__proto__ || Object.getPrototypeOf(LevelSelectGrid)).call(this, 0, 0, 0, 0));

        _this10.color = null;
        _this10.showGrid(chapterName, onLevelSelect);
        return _this10;
    }

    _createClass(LevelSelectGrid, [{
        key: 'hide',
        value: function hide(dur) {
            var _this11 = this;

            var len = this.children.length;
            this.children.forEach(function (c, i) {
                c.opacity = 1;
                Animate.tween(c, { scale: { x: 0, y: 0 }, opacity: 0 }, (len - i - 1) * 30).after(function () {
                    _this11.removeChild(c);
                });
            });
            return Animate.wait((len - 1) * 30);
        }
    }, {
        key: 'gridSizeForLevelCount',
        value: function gridSizeForLevelCount(n) {
            if (n <= 8) return 124;else if (n <= 14) return 100;else return 84;
        }
    }, {
        key: 'showGrid',
        value: function showGrid(chapterName, onselect) {
            var _this12 = this;

            // Layout measurement
            var levels = Resource.levelsForChapter(chapterName);
            var NUM_CELLS = levels[0].length; // total number of cells to fit on the grid
            var CELL_SIZE = this.gridSizeForLevelCount(NUM_CELLS); // width and height of each cell square, in pixels
            var SCREEN_WIDTH = GLOBAL_DEFAULT_SCREENSIZE.width; // the width of the screen to work with
            var PADDING = 20; // padding between cells
            var TOP_MARGIN = 20;
            var GRID_MARGIN = 80; // margin bounding grid on top, left, and right sides
            var NUM_COLS = Math.trunc((SCREEN_WIDTH - GRID_MARGIN * 2) / (CELL_SIZE + PADDING)); // number of cells that fit horizontally on the screen
            var NUM_ROWS = Math.trunc(NUM_CELLS / NUM_COLS + 1); // number of rows
            var GRID_LEFTPAD = (SCREEN_WIDTH - ((CELL_SIZE + PADDING) * NUM_COLS + GRID_MARGIN * 2)) / 2.0;

            console.log(levels);
            console.log(SCREEN_WIDTH - GRID_MARGIN * 2, CELL_SIZE + PADDING, NUM_CELLS, NUM_COLS, NUM_ROWS);

            var genClickCallback = function genClickCallback(level_idx) {
                return function () {
                    return onselect(levels[0][level_idx], levels[1] + level_idx);
                };
            };

            var leftmost = GRID_LEFTPAD + GRID_MARGIN;
            var x = leftmost;
            var y = TOP_MARGIN;

            for (var r = 0; r < NUM_ROWS; r++) {

                var i = r * NUM_COLS;

                var _loop2 = function _loop2(c) {

                    // Create a level cell and add it to the grid.
                    var cell = new LevelCell(x + CELL_SIZE / 2.0, y + CELL_SIZE / 2.0, CELL_SIZE, CELL_SIZE, i.toString(), genClickCallback(i), r === 0 ? 'LightGreen' : 'Gold', 'white', r === 0 ? 'Green' : 'Teal', r === 0 ? 'DarkGreen' : 'DarkMagenta');
                    cell.onDownColor = r === 0 ? 'YellowGreen' : 'Orange';
                    cell.anchor = { x: 0.5, y: 0.5 };
                    //if (i > 5) cell.lock();
                    _this12.addChild(cell);

                    // Animate cell into position.
                    cell.scale = { x: 0.0, y: 0 };
                    Animate.wait(i * 50).after(function () {
                        Animate.tween(cell, { scale: { x: 1, y: 1 } }, 300, function (elapsed) {
                            return Math.pow(elapsed, 0.5);
                        });
                    });

                    // Increment x-position.
                    x += CELL_SIZE + PADDING;

                    // The level index, calculated from the row and column indices.
                    i++;
                    if (i >= NUM_CELLS) return 'break';
                };

                for (var c = 0; c < NUM_COLS; c++) {
                    var _ret2 = _loop2(c);

                    if (_ret2 === 'break') break;
                }

                if (i >= NUM_CELLS) break;

                // Increment y-position and set x-position left.
                y += CELL_SIZE + PADDING;
                x = leftmost;
            }
        }
    }]);

    return LevelSelectGrid;
}(mag.Rect);

var LevelSpot = function (_mag$Circle) {
    _inherits(LevelSpot, _mag$Circle);

    function LevelSpot(x, y, r, onclick) {
        _classCallCheck(this, LevelSpot);

        var _this13 = _possibleConstructorReturn(this, (LevelSpot.__proto__ || Object.getPrototypeOf(LevelSpot)).call(this, x, y, r));

        _this13.color = 'gray';
        _this13.enabled = false;
        _this13.shadowOffset = 0;
        _this13.highlightColor = 'lime';
        _this13.disabledColor = 'gray';
        _this13.enabledColor = 'white';
        _this13.stroke = { color: 'black', lineWidth: 2 };
        _this13.onclick = onclick;
        return _this13;
    }

    _createClass(LevelSpot, [{
        key: 'flash',
        value: function flash() {
            var dur = 600;
            this.opacity = 1.0;
            var _this = this;
            var blink = function blink() {
                if (_this.cancelBlink) return;
                Animate.tween(_this, { opacity: 0.4 }, dur, function (e) {
                    return Math.pow(e, 2);
                }).after(function () {
                    if (_this.cancelBlink) return;
                    Animate.tween(_this, { opacity: 1 }, dur, function (e) {
                        return Math.pow(e, 0.5);
                    }).after(blink);
                });
            };
            this.enabledColor = 'cyan';
            this.color = 'cyan';
            blink();
        }
    }, {
        key: 'enable',
        value: function enable() {
            this.color = 'white';
            this.enabled = true;
            this.enabledColor = 'white';
        }
    }, {
        key: 'disable',
        value: function disable() {
            this.color = 'gray';
            this.enabled = false;
        }
    }, {
        key: 'onmouseenter',
        value: function onmouseenter(pos) {
            if (!this.enabled) return;
            this.stroke = { color: 'yellow', lineWidth: this.stroke.lineWidth };
            this.color = this.highlightColor;
        }
    }, {
        key: 'onmouseleave',
        value: function onmouseleave(pos) {
            if (!this.enabled) return;
            this.stroke = { color: 'black', lineWidth: this.stroke.lineWidth };
            this.color = this.enabledColor;
        }
    }, {
        key: 'onmouseclick',
        value: function onmouseclick(pos) {
            if (this.enabled && this.onclick) {
                this.onclick();
            }
        }
    }]);

    return LevelSpot;
}(mag.Circle);

var PlanetCard = function (_mag$ImageRect2) {
    _inherits(PlanetCard, _mag$ImageRect2);

    function PlanetCard(x, y, r, name, planet_image, onclick) {
        _classCallCheck(this, PlanetCard);

        var _this14 = _possibleConstructorReturn(this, (PlanetCard.__proto__ || Object.getPrototypeOf(PlanetCard)).call(this, x, y, r * 2, r * 2, planet_image + '-locked'));

        _this14.radius = r;
        _this14.name = name;
        _this14.onclick = onclick;

        // Backing Glow on Mouseover
        var glow = new mag.ImageRect(0, 0, r * 2.5, r * 2.5, 'planet-glow');
        glow.anchor = { x: 0.5, y: 0.5 };
        glow.pos = { x: r, y: r };
        glow.ignoreEvents = true;
        _this14.glow = glow;

        // Text
        var capitalize = function capitalize(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        };
        var t = new TextExpr(capitalize(name), 'Futura', 14);
        t.color = 'white';
        t.anchor = { x: 0.5, y: 0.5 };
        t.pos = { x: r, y: r * 2.25 };
        _this14.text = t;
        //this.addChild(t);

        // Level path
        var path = new ArrowPath();
        path.stroke.color = 'white';
        path.stroke.lineDash = [5 * _this14.radius / 120];
        path.stroke.lineWidth = r / 120;
        path.drawArrowHead = false;
        path.ignoreEvents = true;
        _this14.path = path;
        _this14.addChild(path);

        _this14.pts = [];
        _this14.unitpos = function (pos) {
            pos = clonePos(pos);
            pos.x -= _this14.absolutePos.x;
            pos.y -= _this14.absolutePos.y;
            pos.x /= _this14.absoluteSize.w / 2;
            pos.y /= _this14.absoluteSize.h / 2;
            return pos;
        };
        return _this14;
    }

    _createClass(PlanetCard, [{
        key: 'showText',
        value: function showText() {
            if (this.children.indexOf(this.text) === -1) this.addChild(this.text);
        }
    }, {
        key: 'hideText',
        value: function hideText() {
            if (this.children.indexOf(this.text) > -1) this.removeChild(this.text);
        }
    }, {
        key: 'showShip',
        value: function showShip(worldShip) {
            // Create ship graphic
            var ship = new mag.RotatableImageRect('ship-small');
            ship.anchor = worldShip.anchor;
            ship.scale = worldShip.absoluteScale;
            ship.rotation = -Math.PI / 2.0;
            //ship.scale = { x:0.5*r/120, y:0.5*r/120 };
            ship.pos = this.localLandingPoint;
            ship.ignoreEvents = true;
            this.ship = ship;
            this.addChild(ship);
        }
    }, {
        key: 'hideShip',
        value: function hideShip() {
            if (this.ship) {
                this.removeChild(this.ship);
                this.ship = null;
            }
        }
    }, {
        key: 'onmouseclick',
        value: function onmouseclick() {
            if (this.onclick) this.onclick();
            this.selected = false;
        }
    }, {
        key: 'onmouseenter',
        value: function onmouseenter() {
            var _this15 = this;

            this.selected = true;
            this.glow.opacity = 0;
            Animate.tween(this.glow, { opacity: 1.0 }, 100).after(function () {
                _this15.glow.opacity = 1;
            });
        }
    }, {
        key: 'onmouseleave',
        value: function onmouseleave(pos) {
            if (distBetweenPos(pos, this.pos) > this.absoluteSize.h / 4.0) this.selected = false;
        }
    }, {
        key: 'drawInternal',
        value: function drawInternal(ctx, pos, boundingSize) {
            if (this.selected && this.scale.x < 1.1) {
                this.glow.parent = this;
                this.glow.draw(ctx);
            }
            _get(PlanetCard.prototype.__proto__ || Object.getPrototypeOf(PlanetCard.prototype), 'drawInternal', this).call(this, ctx, pos, boundingSize);
        }

        // Uncomment for drawing curves directly on planets (DEBUG).

    }, {
        key: 'onmousedown',
        value: function onmousedown(pos) {
            pos = this.unitpos(pos);
            this.pts = [pos];
            console.warn(pos);
        }
    }, {
        key: 'onmousedrag',
        value: function onmousedrag(pos) {
            pos = this.unitpos(pos);
            if (this.pts.length > 0) {
                pos.y *= -1;
                pos.x *= -1;
                var relpos = fromTo(pos, this.pts[0]);
                this.pts.push(relpos);
            }
        }
    }, {
        key: 'onmouseup',
        value: function onmouseup(pos) {
            console.log(this.pts.reduce(function (prev, cur) {
                return prev + '{"x":' + cur.x + ', "y":' + cur.y + '},\n';
            }, ''));
            if (this.pts.length > 2) this.setCurve(this.pts);
            this.pts = [];
            this.stage.draw();
        }
    }, {
        key: 'activate',
        value: function activate() {
            this.image = this.image.replace('-locked', '');
            this.showText();
            this.active = true;
        }
    }, {
        key: 'activateSpots',
        value: function activateSpots() {
            var _this16 = this;

            if (!this.spots) return;

            this.addChild(this.path);

            // Make all spots invisible.
            this.spots.forEach(function (spot) {
                spot.opacity = 0;
                spot.ignoreEvents = true;
                _this16.addChild(spot);
            });

            // Animate-in how much of the path is drawn.
            var dur = 2000;
            this.path.percentDrawn = 0;
            Animate.tween(this.path, { percentDrawn: 1.0 }, dur);
            Animate.run(function (e) {
                _this16.spots.forEach(function (spot) {
                    if (spot.relPosAlongPath <= _this16.path.percentDrawn) {
                        if (spot.opacity === 0) Resource.play('levelspot-activate');
                        spot.opacity = 1.0;
                    }
                });
            }, dur).after(function () {
                _this16.spots.forEach(function (spot) {
                    if (spot.opacity === 0) Resource.play('levelspot-activate');
                    spot.opacity = 1.0;
                    spot.ignoreEvents = false;
                });
                _this16.path.percentDrawn = 1;
                _this16.spots[0].enable();
                _this16.spots[0].flash();
                Resource.play('fatbtn-beep');
            });
        }
    }, {
        key: 'updateLevelSpots',
        value: function updateLevelSpots() {
            if (!this.spots) return;
            var c = getCookie('level_idx');
            if (c) c = parseInt(c);
            this.spots.forEach(function (spot) {
                spot.opacity = 1.0;
                if (c > spot.levelId) spot.enable();else if (c === spot.levelId) {
                    spot.enable();
                    spot.flash();
                } else spot.disable();
            });
        }
    }, {
        key: 'setCurve',
        value: function setCurve(pts) {
            var _this17 = this;

            this.path.points = pts.map(function (p) {
                return { x: p.x * _this17.radius + _this17.radius, y: p.y * _this17.radius + _this17.radius };
            });
        }
    }, {
        key: 'setLevels',
        value: function setLevels(levels, onLevelSelect) {
            if (window.level_idx < levels[1]) {
                this.removeChild(this.path);
            } else {
                this.activate();
            }

            var NUM_LVLS = levels[0].length; // total number of cells to fit on the grid
            var genClickCallback = function genClickCallback(level_idx) {
                return function () {
                    Resource.play('fatbtn-beep');
                    onLevelSelect(levels[0][level_idx], levels[1] + level_idx);
                };
            };

            // Level spots
            this.spots = [];
            for (var i = 1; i <= NUM_LVLS; i++) {
                var spotpos = this.path.posAlongPath((i - 1) / (NUM_LVLS - 1));
                var spot = new LevelSpot(spotpos.x, spotpos.y, 6 * this.radius / 120, genClickCallback(i - 1));
                spot.anchor = { x: 0.5, y: 0.5 };
                spot.relPosAlongPath = i / NUM_LVLS;
                spot.levelId = levels[1] + i - 1;
                spot.stroke.lineWidth = Math.max(this.radius / 120 * 2, 1.5);
                spot.ignoreEvents = true;
                if (window.level_idx >= levels[1] + i - 1) {
                    spot.enable();
                    if (window.level_idx === levels[1] + i - 1) spot.flash();
                }
                this.spots.push(spot);

                if (window.level_idx >= levels[1]) this.addChild(spot);
            }
        }
    }, {
        key: 'landingPoint',
        get: function get() {
            var a = this.absolutePos;
            return { x: a.x, y: a.y - this.absoluteSize.h / 3 };
        }
    }, {
        key: 'localLandingPoint',
        get: function get() {
            return { x: this.size.w / 2.0, y: this.size.h / 2.0 / 3 };
        }
    }]);

    return PlanetCard;
}(mag.ImageRect);

var ChapterSelectShip = function (_mag$RotatableImageRe) {
    _inherits(ChapterSelectShip, _mag$RotatableImageRe);

    function ChapterSelectShip() {
        _classCallCheck(this, ChapterSelectShip);

        var _this18 = _possibleConstructorReturn(this, (ChapterSelectShip.__proto__ || Object.getPrototypeOf(ChapterSelectShip)).call(this, 'ship-small'));

        _this18.pointing = { x: 1, y: 0 };
        _this18.velocity = { x: 0, y: 0 };

        var trailWidth = 140;
        var trail = new RainbowTrail(0, 0, trailWidth, 30);
        trail.pos = { x: -trailWidth + 20, y: 20 };
        //trail.anchor = { x:1, y:0 };
        _this18.trail = trail;
        _this18.addChild(trail);
        return _this18;
    }

    // Fly to another planet. (entire sequence)


    _createClass(ChapterSelectShip, [{
        key: 'flyToPlanet',
        value: function flyToPlanet(startPlanet, endPlanet) {
            var _this19 = this;

            // Hide the local ships and make the world ship
            // the only ship visible.
            this.pos = startPlanet.landingPoint;
            startPlanet.hideShip();
            endPlanet.hideShip();

            var endScale = endPlanet.radius / 120 / 2;
            var dest = endPlanet.landingPoint;
            var aboveOrbitDest = addPos(dest, { x: 0, y: -20 });
            var pointing = fromTo(this.pos, aboveOrbitDest);
            var pointAngle = Math.atan2(pointing.y, pointing.x);
            this.trail.opacity = 0;
            var _this = this;
            this.rotation = -Math.PI / 2.0; // make the ship face upright

            return this.launch().then(function () {
                _this19.rotateTo(pointAngle);
                return _this19.moveTo(addPos({ x: -20, y: -50 }, addPos(_this19.pos, scalarMultiply(pointing, 0.05))));
            }).then(function () {
                Animate.tween(_this19.trail, { opacity: 1.0 }, 100);
                return new Promise(function (resolve, reject) {
                    var dur = _this.flyTo(aboveOrbitDest, resolve);
                    Animate.tween(_this19, { scale: { x: endScale, y: endScale } }, dur);
                });
            }).then(function () {
                return _this.land(dest);
            }).then(function () {
                endPlanet.showShip(_this);
            });
        }
    }, {
        key: 'attachToPlanet',
        value: function attachToPlanet(planet) {
            this.pos = planet.landingPoint;
            planet.showShip(this);
        }

        // Launch the ship into the air.

    }, {
        key: 'launch',
        value: function launch() {
            var _this20 = this;

            return new Promise(function (resolve, reject) {
                _this20.moveTo(addPos(_this20.pos, { x: 0, y: -20 }), 1000).then(resolve);
            });
        }

        // Rotate to angle.

    }, {
        key: 'rotateTo',
        value: function rotateTo(angle) {
            var _this21 = this;

            var dur = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1000;
            var smoothFunc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function (e) {
                return e;
            };

            return new Promise(function (resolve, reject) {
                Animate.tween(_this21, { rotation: angle }, dur, smoothFunc).after(resolve);
            });
        }

        // Move to pos (without changing rotation).

    }, {
        key: 'moveTo',
        value: function moveTo(dest) {
            var _this22 = this;

            var dur = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1000;
            var smoothFunc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function (e) {
                return e;
            };

            return new Promise(function (resolve, reject) {
                Animate.tween(_this22, { pos: clonePos(dest) }, dur, smoothFunc).after(function () {
                    resolve();
                });
            });
        }

        // Execute landing sequence.

    }, {
        key: 'land',
        value: function land(dest) {
            var _this23 = this;

            this.trail.opacity = 0;
            return this.rotateTo(-Math.PI / 2.0, 500).then(function () {
                return _this23.moveTo(dest, 1000);
            });
        }
    }, {
        key: 'thrust',
        value: function thrust(force, delta) {
            var MAX_VEL = 1;
            var deltaForce = scalarMultiply(force, delta);
            var step = dotProduct(deltaForce, this.pointing);
            this.pointing = normalize(addPos(this.pointing, deltaForce));
            this.velocity = addPos(this.velocity, scalarMultiply(this.pointing, step));
            if (lengthOfPos(this.velocity) > MAX_VEL) this.velocity = rescalePos(this.velocity, MAX_VEL);
            this.pos = addPos(this.velocity, this.pos);
            this.rotation = Math.atan2(this.pointing.y, this.pointing.x);
            this.trail.time += delta * 400;
        }
    }, {
        key: 'flyTo',
        value: function flyTo(dest, onReachingDest) {
            var _this24 = this;

            var FORCE = 10;
            var travelDist = distBetweenPos(this.pos, dest);
            var pointing = fromTo(this.pos, dest);
            var DUR = travelDist / 100 * 1000; // 1 sec per 100 units.
            this.rotation = Math.atan2(pointing.y, pointing.x);

            var del = 0;
            Animate.run(function (e) {
                _this24.trail.opacity = Math.pow(e, 0.5);
                _this24.trail.time += (e - del) * 8000;
                del = e;
            }, DUR);
            this.moveTo(dest, DUR).then(onReachingDest);
            return DUR;

            // let twn = new mag.IndefiniteTween((delta) => {
            //     this.thrust( rescalePos( fromTo(this.pos, dest), distBetweenPos(this.pos, dest) / totalDist), delta / 1000.0 * 10);
            //
            //     let distleft = distBetweenPos(this.pos, dest);
            //     this.trail.opacity = Math.pow(distleft / totalDist, 0.5);
            //
            //     if (distleft <= 10) {
            //         if (onReachingDest) onReachingDest();
            //         twn.cancel();
            //     }
            //     //this.stage.draw();
            // });
            // twn.run();
        }
    }]);

    return ChapterSelectShip;
}(mag.RotatableImageRect);

var ChapterSelectMenu = function (_mag$Stage2) {
    _inherits(ChapterSelectMenu, _mag$Stage2);

    function ChapterSelectMenu(canvas, onLevelSelect, flyToChapIdx) {
        _classCallCheck(this, ChapterSelectMenu);

        var _this25 = _possibleConstructorReturn(this, (ChapterSelectMenu.__proto__ || Object.getPrototypeOf(ChapterSelectMenu)).call(this, canvas));

        _this25.showStarField();
        _this25.showChapters(onLevelSelect);

        var _this = _this25;
        _this.offset = { x: 0, y: 0 };
        Animate.wait(100).after(function () {

            var lastActivePlanet = _this.planets[0];
            _this.planets.forEach(function (p) {
                if (p.active) lastActivePlanet = p;
            });

            var ship = new ChapterSelectShip();
            var shipScale = lastActivePlanet.radius / 120 / 2;
            ship.scale = { x: shipScale, y: shipScale };
            //_this.bringToFront(ship);

            if (flyToChapIdx) {
                _this25.add(ship);
                ship.attachToPlanet(_this.planets[flyToChapIdx - 1]);
                ship.flyToPlanet(_this.planets[flyToChapIdx - 1], _this.planets[flyToChapIdx]).then(function () {
                    _this.planets[flyToChapIdx].activate();
                    return new Promise(function (resolve, reject) {
                        Animate.wait(600).after(function () {
                            _this.remove(ship);
                            resolve();
                        });
                    });
                }).then(_this.planets[flyToChapIdx].onclick).then(function () {
                    _this.planets[flyToChapIdx].activateSpots();
                    level_idx++;
                    saveProgress();
                });
            } else {
                ship.attachToPlanet(lastActivePlanet);
            }

            // Camera follow...
            //let twn = new mag.IndefiniteTween((delta) => {
            //    _this.planetNode.pos = { x:-ship.pos.x+GLOBAL_DEFAULT_SCREENSIZE.width/2.0, y:-ship.pos.y+GLOBAL_DEFAULT_SCREENSIZE.height/2.0 };
            //});
            //twn.run();
        });

        //$('body').css('background', '#333');
        return _this25;
    }

    _createClass(ChapterSelectMenu, [{
        key: 'updateLevelSpots',
        value: function updateLevelSpots() {
            if (this.planets) {
                this.planets.forEach(function (p) {
                    return p.updateLevelSpots();
                });
            }
        }
    }, {
        key: 'drawImpl',
        value: function drawImpl() {
            if (this.invalidated) return; // don't draw invalidated stages.
            this.ctx.save();
            this.ctx.scale(this._scale, this._scale);
            this.clear();
            this.ctx.translate(this.offset.x, this.offset.y);
            var len = this.nodes.length;
            for (var i = 0; i < len; i++) {
                this.nodes[i].draw(this.ctx);
            }
            //this.nodes.forEach((n) => n.draw(this.ctx));
            this.ctx.restore();
        }
    }, {
        key: 'showStarField',
        value: function showStarField() {
            var _this26 = this;

            var NUM_STARS = 100;
            var genRandomPt = function genRandomPt() {
                return randomPointInRect({ x: 0, y: 0, w: GLOBAL_DEFAULT_SCREENSIZE.width, h: GLOBAL_DEFAULT_SCREENSIZE.height });
            };
            var stars = [];
            var n = NUM_STARS;

            var _loop3 = function _loop3() {

                // Create an instance of a star illustration.
                var star = new MenuStar();
                //star.anchor = { x:0.5, y:0.5 };

                // Find a random position that doesn't intersect other previously created stars.
                var p = genRandomPt();
                // for (let i = 0; i < stars.length; i++) {
                //     let s = stars[i];
                //     let prect = {x:p.x, y:p.y, w:star.size.w, h:star.size.h};
                //     let srect = {x:s._pos.x, y:s._pos.y, w:s.size.w, h:s.size.h};
                //     if (intersects(STARBOY_RECT, prect) ||
                //         intersects(prect, srect)) {
                //         p = genRandomPt();
                //         i = 0;
                //     }
                // }

                // Set star properties
                star.pos = p;
                star.opacity = 0.4;
                var scale = Math.random() * 0.3 + 0.1;
                star.scale = { x: scale, y: scale };
                _this26.add(star);
                stars.push(star);

                // Twinkling effect
                Animate.wait(1000 * Math.random()).after(function () {
                    return star.twinkle(1000);
                });
            };

            while (n-- > 0) {
                _loop3();
            }
        }
    }, {
        key: 'getPlanetPos',
        value: function getPlanetPos() {
            return [{ x: 154, y: 124, r: 120 }, { x: 446, y: 86, r: 80 }, { x: 690, y: 208, r: 44 }, { x: 456, y: 324, r: 60 }, { x: 138, y: 388, r: 80 }, { x: 316, y: 480, r: 40 }, { x: 530, y: 492, r: 70 }, { x: 760, y: 580, r: 30 }];
        }
    }, {
        key: 'getPlanetImages',
        value: function getPlanetImages() {
            return {
                'Equality': 'planet-boolili',
                'Basics': 'planet-functiana',
                'Conditionals': 'planet-conditionabo',
                'Collections': 'planet-bagbag'
            };
        }
    }, {
        key: 'setPlanetsToDefaultPos',
        value: function setPlanetsToDefaultPos(dur) {
            var stage = this;
            var POS_MAP = this.getPlanetPos();
            stage.planets.forEach(function (p, i) {
                p.ignoreEvents = false;
                if (p.spots) p.spots.forEach(function (s) {
                    s.ignoreEvents = true;
                });
                if (p.expandFunc) p.onclick = p.expandFunc;
                if (!stage.has(p)) stage.add(p);
                var rad = POS_MAP[i].r;
                Animate.tween(p, { pos: { x: POS_MAP[i].x + 15, y: POS_MAP[i].y + 40 }, scale: { x: 1, y: 1 }, opacity: 1.0 }, dur).after(function () {
                    if (p.active) p.showText();
                });
            });
        }
    }, {
        key: 'clear',
        value: function clear() {
            this.ctx.save();
            this.ctx.fillStyle = '#594764';
            this.ctx.fillRect(0, 0, canvas.width, canvas.height);
            this.ctx.restore();
        }
    }, {
        key: 'showLevelSelectGrid',
        value: function showLevelSelectGrid(chapterName, onLevelSelect) {
            var _this27 = this;

            var grid = new LevelSelectGrid(chapterName, onLevelSelect);
            grid.pos = { x: 0, y: 40 };

            var btn_back = new mag.Button(10, 10, 50, 50, { default: 'btn-back-default', hover: 'btn-back-hover', down: 'btn-back-down' }, function () {
                grid.hide().after(function () {
                    return _this27.remove(grid);
                });
                _this27.remove(btn_back);
                _this27.setPlanetsToDefaultPos(500);
                Resource.play('goback');
            });
            btn_back.opacity = 0.7;

            //this.add(grid);
            this.add(btn_back);
        }
    }, {
        key: 'showChapters',
        value: function showChapters(onLevelSelect) {
            var _this28 = this;

            // For now, hardcore positions and radii per chapter:
            // TODO: Move to .json specs.
            var POS_MAP = this.getPlanetPos();
            var IMG_MAP = this.getPlanetImages();

            // Expand and disappear animations.
            var stage = this;
            var expand = function expand(planet) {
                planet.ignoreEvents = false;
                planet.expandFunc = planet.onclick;
                planet.onclick = null;
                planet.hideText();
                stage.bringToFront(planet);
                var r = GLOBAL_DEFAULT_SCREENSIZE.width / 3.0;
                var center = { x: GLOBAL_DEFAULT_SCREENSIZE.width / 2.0, y: GLOBAL_DEFAULT_SCREENSIZE.height / 2.0 };
                var scale = r / planet.radius;
                Animate.tween(planet, { scale: { x: scale, y: scale }, pos: center }, 1000, function (elapsed) {
                    return Math.pow(elapsed, 3);
                }).after(function () {
                    if (planet.spots) planet.spots.forEach(function (s) {
                        s.ignoreEvents = false;
                    });
                });
            };
            var hide = function hide(planet) {
                planet.opacity = 1.0;
                if (planet.spots) planet.spots.forEach(function (s) {
                    s.ignoreEvents = true;
                });
                Animate.tween(planet, { scale: { x: 1, y: 1 }, opacity: 0 }, 500).after(function () {
                    stage.remove(planet);
                });
            };

            // Each chapter is a 'Planet' in Starboy's Universe:
            //let planetNode = new mag.Rect(0,0,1,1);
            Resource.getChapters().then(function (chapters) {

                var planets = [];

                chapters.forEach(function (chap, i) {

                    var pos = i < POS_MAP.length ? POS_MAP[i] : { x: 0, y: 0, r: 10 };
                    var planet = new PlanetCard(pos.x + 15, pos.y + 40, pos.r, chap.name, chap.resources ? chap.resources.planet : 'planet-bagbag');
                    planet.color = 'white';
                    if (i === 1) planet.path.stroke.color = 'gray';
                    planet.anchor = { x: 0.5, y: 0.5 };
                    planet.shadowOffset = 0;
                    planet.onclick = function () {
                        for (var k = 0; k < planets.length; k++) {
                            planets[k].ignoreEvents = true;
                            if (k !== i) hide(planets[k]);else expand(planets[k]);
                        }
                        Resource.play('zoomin');
                        Animate.wait(500).after(function () {
                            stage.showLevelSelectGrid(planet.name, onLevelSelect);
                        });
                        return new Promise(function (resolve, reject) {
                            Animate.wait(1000).after(resolve);
                        });
                    };

                    if (chap.resources) {

                        var levels = Resource.levelsForChapter(chap.name);

                        // Set path curve on planet.
                        planet.setCurve(chap.resources.curve);

                        // Set levels along curve.
                        planet.setLevels(levels, onLevelSelect);
                    }

                    _this28.add(planet);
                    planets.push(planet);
                });

                _this28.planets = planets;
                //this.add(planetNode);
                //this.planetNode = planetNode;
            });
        }
    }]);

    return ChapterSelectMenu;
}(mag.Stage);

// -- OLD --
// class LevelCell extends MenuButton {
// constructor(x, y, w, h, name, icon, onclick) {
//     super(x, y, w, h, name.toString(), onclick);
//
//     this.shadowOffset = 10;
//
//     // Visual icon
//     if (icon) {
//         let img = new mag.ImageRect(0, 0, w, h, icon);
//         img.ignoreEvents = true;
//         this.addChild(img);
//     } else { // Default to text displaying level index.
//         let txt = new TextExpr(name.toString(), 'Futura');
//         txt.color = 'white';
//         txt.anchor = { x:0.5, y:0.5 };
//         txt.pos = { x: w / 2.0, y: w / 2.0 };
//         this.addChild(txt);
//     }
//
//     this.name = name;
//     this.onclick = onclick;
// }
// onmouseclick(pos) {
//     if (this.onclick)
//         this.onclick();
// }
// }
// class ChapterCard extends mag.Rect {
//     constructor(x, y, w, h, name, desc, icon, onclick) {
//
//         const TXTPAD = 50;
//         super(x, y, w, h);
//
//         // Visual icon
//         let img = new mag.ImageRect(0, 0, w, h - TXTPAD, icon);
//         img.ignoreEvents = true;
//         this.addChild(img);
//
//         // Chapter name
//         let txt = new TextExpr(name, 'Futura');
//         txt.color = 'white';
//         txt.pos = { x:img.pos.x+img.size.w/2.0,
//                     y:img.pos.y+img.size.h+txt.fontSize };
//         txt.anchor = { x:0.5, y:0 };
//         this.addChild(txt);
//
//         this.name = name;
//         this.onclick = onclick;
//     }
//
//     onmouseclick(pos) {
//         if (this.onclick)
//             this.onclick(this.name);
//     }
// }
//
// class ChapterSelectMenu extends mag.Stage {
//     constructor(canvas, onChapterSelect) {
//         super(canvas);
//         this.showChapters(onChapterSelect);
//     }
//
//     showChapters(onselect) {
//
//         let W = 200; let P = 40; let X = 0;
//         let onChapterSelect = onselect;
//         console.log(onChapterSelect);
//         let container = new DraggableRect(GLOBAL_DEFAULT_SCREENSIZE.width / 2.0 - W / 2.0, 100, 1000, 300);
//         container.constrainY();
//         container.color = 'lightgray';
//         container.shadowOffset = 0;
//         container.snapEvery(W + P, W / 2.0 - P);
//         this.add(container);
//
//         Resource.getChapters().then((chapters) => {
//             container.size = { w:(W + P) * chapters.length, h:300 };
//             chapters.forEach((chap) => {
//
//                 let c = new ChapterCard(X, 0, W, 300, chap.name, chap.description, null, onChapterSelect);
//                 //c.ignoreEvents = true;
//                 c.color = 'HotPink';
//                 c.onmousedrag = (pos) => {
//                     pos.x -= c.pos.x;
//                     container.onmousedrag(pos);
//                 };
//                 c.onmouseup = (pos) => {
//                     pos.x -= c.pos.x;
//                     container.onmouseup(
//                         pos);
//                 };
//                 container.addChild(c);
//
//                 X += W + P;
//
//             });
//         });
//     }
// }