'use strict';

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MultiLineSelectionRect = function (_mag$Rect) {
    _inherits(MultiLineSelectionRect, _mag$Rect);

    function MultiLineSelectionRect(x, y, lineWidth, lineHeight) {
        _classCallCheck(this, MultiLineSelectionRect);

        var _this2 = _possibleConstructorReturn(this, (MultiLineSelectionRect.__proto__ || Object.getPrototypeOf(MultiLineSelectionRect)).call(this, x, y, 1, 1));

        _this2.lineWidth = lineWidth;
        _this2.lineHeight = lineHeight;
        _this2.rects = [];

        _this2.color = null;
        _this2.ignoreEvents = true;
        return _this2;
    }

    _createClass(MultiLineSelectionRect, [{
        key: 'addRect',
        value: function addRect(x, y, w, h) {
            var r = new mag.Rect(x, y, w, h);
            r.color = "Cyan";
            r.opacity = 0.3;
            r.shadowOffset = 0;
            r.ignoreEvents = true;
            this.addChild(r);
            this.rects.push(r);
        }

        // Generates rectangles to cover highlighted area,
        // using lineWidth and lineHeight as guides for where to fill.

    }, {
        key: 'select',
        value: function select(x1, x2, lineStartIdx, lineEndIdx) {

            this.clear();

            var w = this.lineWidth;
            var h = this.lineHeight;

            if (lineStartIdx === lineEndIdx) {
                this.addRect(x1, lineStartIdx * h, x2 - x1, h);
            } else {

                // First line goes from x1 all the way to end of line
                this.addRect(x1, lineStartIdx * h, w - x1, h);

                // Middle lines (if any) select entire lines.
                if (lineEndIdx - lineStartIdx > 1) {
                    for (var i = lineStartIdx + 1; i < lineEndIdx; i++) {
                        this.addRect(0, i * h, w, h);
                    }
                }

                // Last line starts from left and ends at x2
                this.addRect(0, lineEndIdx * h, x2, h);
            }
        }
    }, {
        key: 'clear',
        value: function clear() {
            var _this3 = this;

            this.rects.forEach(function (r) {
                return _this3.removeChild(r);
            });
            this.rects = [];
        }
    }]);

    return MultiLineSelectionRect;
}(mag.Rect);

var TypeBox = function (_mag$RoundedRect) {
    _inherits(TypeBox, _mag$RoundedRect);

    function TypeBox(x, y, w, h, onCarriageReturn, onTextChanged) {
        _classCallCheck(this, TypeBox);

        var _this4 = _possibleConstructorReturn(this, (TypeBox.__proto__ || Object.getPrototypeOf(TypeBox)).call(this, x, y, w, h));

        _this4.color = 'white'; // should be pure white
        _this4.shadowOffset = 0;
        _this4.padding = { left: 4, right: 4 };

        // Text
        var txt = new TextExpr('');
        txt.fontSize = 22;
        _this4._txtOffsetX = 6;
        txt.pos = { x: _this4._txtOffsetX, y: h - txt.size.h / 2 };
        // txt.wrap = 8;
        _this4.textExpr = txt;
        _this4.addChild(txt);

        // Blinking cursor
        var percentH = 0.8;
        var cursor = new BlinkingCursor(_this4.padding.left, h * (1 - percentH) / 2.0, 2, h * percentH);
        _this4.cursor = cursor;
        _this4._origWidth = w;

        // Selection highlight
        // let selection = new mag.Rect(0, cursor.pos.y, 2, cursor.size.h );
        // selection.color = "Cyan";
        // selection.opacity = 0.3;
        // selection.ignoreEvents = true;
        // selection.shadowOffset = 0;
        var selection = new MultiLineSelectionRect(0, cursor.pos.y, 2, cursor.size.h);
        _this4.selection = selection;

        _this4.onCarriageReturn = onCarriageReturn;
        _this4.onTextChanged = onTextChanged;
        _this4._origHeight = h;

        // 'Empty text' icon, to indicate this is a typing box.
        var icon = new ImageExpr(0, 0, 64, 64, 'empty-typebox');
        icon.pos = { x: _this4.size.w / 2, y: _this4.size.h / 2 };
        icon.anchor = { x: 0.5, y: 0.5 };
        icon.ignoreEvents = true;
        _this4.icon = icon;
        _this4.showEmptyIcon();

        _this4.update();

        // this.makeMultiline(10, 4);
        return _this4;
    }

    _createClass(TypeBox, [{
        key: 'hasHint',


        // HINTS
        value: function hasHint() {
            return this.hintTextExpr && this.hintTextExpr.text.length > 0;
        }
    }, {
        key: 'setHint',
        value: function setHint(str) {
            if (this.hintTextExpr) this.removeHint(); // remove any existing hint...
            var hint = new TextExpr(str);
            hint.pos = this.textExpr.pos;
            hint.color = "#bbb";
            this.addChildAt(0, hint);
            this.hintTextExpr = hint;
            this.hideEmptyIcon();
        }
    }, {
        key: 'removeHint',
        value: function removeHint() {
            if (this.hintTextExpr) {
                this.removeChild(this.hintTextExpr);
                this.hintTextExpr = null;
            }
        }

        // ICONS

    }, {
        key: 'hasIcon',
        value: function hasIcon() {
            return this.icon && this.icon.parent !== null;
        }
    }, {
        key: 'showEmptyIcon',
        value: function showEmptyIcon() {
            if (this.icon && !this.icon.parent && !this.hasHint()) {
                this.addChild(this.icon);
                this.update();
                if (this.stage) {
                    this.stage.update();
                    this.stage.draw();
                }
            }
        }
    }, {
        key: 'hideEmptyIcon',
        value: function hideEmptyIcon() {
            if (this.icon && this.icon.parent) {
                this.removeChild(this.icon);
                this.icon.parent = null;
                this.update();
                if (this.stage) {
                    this.stage.update();
                    this.stage.draw();
                }
            }
        }
    }, {
        key: 'makeMultiline',
        value: function makeMultiline(lineWidthInChars, maxNumLines) {
            this.textExpr.wrap = lineWidthInChars;
            this.multiline = { lineWidth: lineWidthInChars, lineHeight: maxNumLines };
        }
    }, {
        key: 'isPlaceholder',
        value: function isPlaceholder() {
            return true;
        }

        /* MOUSE EVENTS */

    }, {
        key: 'onmouseenter',
        value: function onmouseenter(pos) {
            //this.focus();
            this._logState('mouse-enter');
            this.stroke = { color: 'blue', lineWidth: 2 };
            SET_CURSOR_STYLE(CONST.CURSOR.TEXT);

            if (this.stage) this.stage.keyEventCandidate = this;
        }
    }, {
        key: 'onmousedown',
        value: function onmousedown(pos) {
            this._logState('mouse-down');
            _get(TypeBox.prototype.__proto__ || Object.getPrototypeOf(TypeBox.prototype), 'onmousedown', this).call(this, pos);
            this.clearSelection();
            var pos_idx = this.charIndexForCursorPos(pos);
            this.updateCursorPosition(pos_idx);
            this._prevMousePos = pos;
            this._prevCursorIdx = pos_idx;
            this._logState('after-mouse-down');
        }
    }, {
        key: 'onmousedrag',
        value: function onmousedrag(pos) {
            this._logState('mouse-drag');
            var pos_idx = this.charIndexForCursorPos(addPos(this._prevMousePos, fromTo(this.absolutePos, pos)));
            this.showSelection({ start: this._prevCursorIdx, end: pos_idx });
            this.updateCursorPosition(pos_idx);
            this._logState('after-mouse-drag');
        }
    }, {
        key: 'onmouseclick',
        value: function onmouseclick(pos) {
            this._logState('clicked');
            this.focus();
            var pos_idx = this.charIndexForCursorPos(pos);
            this.updateCursorPosition(pos_idx);
            this._logState('after-clicked');
        }
    }, {
        key: 'onmouseleave',
        value: function onmouseleave(pos) {
            //this.blur();
            this._logState('mouse-leave');
            this.stroke = null;
            SET_CURSOR_STYLE(CONST.CURSOR.DEFAULT);

            if (this.stage) this.stage.keyEventCandidate = null;
        }

        /* VIRTUAL CURSOR */
        // From an absolute position within this box,
        // calculate the index of the character that
        // the cursor should appear to the left of.

    }, {
        key: 'charIndexForCursorPos',
        value: function charIndexForCursorPos(pos) {
            var total_chars = this.textExpr.text.length;
            var shouldWrap = this.textExpr.shouldWrap();
            var chars_per_line = shouldWrap ? this.textExpr.wrap : total_chars;
            if (chars_per_line === 0) return 0;
            var x_pos = fromTo(this.textExpr.absolutePos, pos).x;
            var t_width = this.textExpr.absoluteSize.w;
            var char_w = t_width / chars_per_line;
            var char_col_idx = Math.min(chars_per_line, Math.round(x_pos / char_w));
            if (shouldWrap) {
                var char_h = this.charHeightPerLine();
                var y_pos = fromTo(this.textExpr.absolutePos, pos).y;
                var row_idx = Math.clamp(Math.round((y_pos + char_h * 0.5) / char_h), 0, this.textExpr.getNumLines() - 1);
                return char_col_idx + chars_per_line * row_idx;
            } else return char_col_idx;
        }
    }, {
        key: 'charWidthPerLine',
        value: function charWidthPerLine() {
            if (this.textExpr.text.length === 0) {
                this.textExpr.text = 'a';
                var w = this.textExpr.size.w;
                this.textExpr.text = '';
                return w;
            }
            return this.textExpr.size.w / (this.textExpr.shouldWrap() ? this.textExpr.wrap : this.textExpr.text.length);
        }
    }, {
        key: 'charHeightPerLine',
        value: function charHeightPerLine() {
            if (this.textExpr.text.length === 0) {
                this.textExpr.text = 'a';
                var h = this.textExpr.absoluteSize.h;
                this.textExpr.text = '';
                return h;
            }
            return this.textExpr.absoluteSize.h / this.textExpr.getNumLines();
        }
    }, {
        key: 'cursorPosForCharIdx',
        value: function cursorPosForCharIdx(charIdx) {
            var total_chars = this.textExpr.text.length;
            var width = this.textExpr.size.w;
            var y_offset = this.cursor.size.h * 0.1;
            if (total_chars === 0) return { x: width, y: y_offset };
            charIdx = Math.clamp(charIdx, 0, total_chars);
            var shouldWrap = this.textExpr.shouldWrap();
            var chars_per_line = shouldWrap ? this.textExpr.wrap : total_chars;
            var col_idx = shouldWrap ? charIdx % chars_per_line : charIdx;
            if (charIdx >= chars_per_line && col_idx === 0) col_idx = chars_per_line;
            var height_per_line = this.charHeightPerLine();
            var y_pos = (shouldWrap ? height_per_line * Math.trunc((charIdx - 1) / chars_per_line) : 0) + y_offset;
            return { x: width * col_idx / chars_per_line + this._txtOffsetX, y: y_pos };
        }
    }, {
        key: 'update',
        value: function update() {
            _get(TypeBox.prototype.__proto__ || Object.getPrototypeOf(TypeBox.prototype), 'update', this).call(this);

            this.size = this.makeSize();
        }
    }, {
        key: 'makeSize',
        value: function makeSize() {
            if (this.multiline) {
                return { w: this.multiline.lineWidth * this.charWidthPerLine() + this.padding.right + this._txtOffsetX,
                    h: this.multiline.lineHeight * this.charHeightPerLine() };
            } else {
                var dyn_w = Math.max(this.textExpr.size.w, this.hintTextExpr ? this.hintTextExpr.size.w : 0) + this.cursor.size.w + this.padding.right + this._txtOffsetX;
                if (!this.hasHint() && this.icon && this.icon.parent !== null) dyn_w = Math.max(dyn_w, 48);
                return { w: Math.max(this._origWidth, dyn_w),
                    h: Math.max(this._origHeight, this.textExpr.absoluteSize.h) };
            }
        }
    }, {
        key: 'updateCursorPosition',
        value: function updateCursorPosition(charIdx) {
            var num_chars = this.textExpr.text.length;
            if (typeof charIdx === 'undefined') charIdx = num_chars;
            charIdx = Math.max(0, Math.min(charIdx, num_chars));
            var cur_pos = this.cursorPosForCharIdx(charIdx);
            if ('charIdx' in this.cursor && this.cursor.charIdx === charIdx) return; // No need to update if there's been no change.
            this.update();
            this.cursor.pos = { x: cur_pos.x, y: cur_pos.y }; //this.cursor.pos.y };
            this.size = this.makeSize();
            this.cursor.resetBlinking();
            this.cursor.charIdx = charIdx;
        }
    }, {
        key: 'showSelection',


        /* SELECTION HIGHLIGHT */
        value: function showSelection(selrange) {
            if (selrange.start === selrange.end) {
                this.clearSelection();
                return; // no selection to show
            }
            if (selrange.start > selrange.end) {
                // Swap to ensure property start <= end.
                var temp = selrange.start;
                selrange.start = selrange.end;
                selrange.end = temp;
            }
            var selection = this.selection;
            var chars_per_line = this.textExpr.shouldWrap() ? this.textExpr.wrap : this.textExpr.text.length;
            var pos1 = this.cursorPosForCharIdx(selrange.start);
            var pos2 = this.cursorPosForCharIdx(selrange.end);
            var rowStartIdx = Math.trunc(selrange.start / chars_per_line);
            var rowEndIdx = Math.trunc((selrange.end - 1) / chars_per_line);
            selection.lineWidth = this.textExpr.size.w;
            selection.lineHeight = this.charHeightPerLine();
            selection.select(pos1.x, pos2.x, rowStartIdx, rowEndIdx);
            // selection.pos = { x:x1_pos, y:selection.pos.y };
            // selection.size = { w:x2_pos - x1_pos, h:selection.size.h };
            selection.range = selrange;
            if (!this.hasChild(selection)) this.addChild(selection);
            this.update();
        }
    }, {
        key: 'hasSelection',
        value: function hasSelection() {
            return this.hasChild(this.selection) && this.selection.range;
        }
    }, {
        key: 'deleteSelectedText',
        value: function deleteSelectedText() {
            if (this.hasSelection()) {
                var txt = this.text;
                var selrange = this.selection.range;
                if (selrange.start > 0) {
                    if (selrange.end < txt.length) this.text = txt.substring(0, selrange.start) + txt.substring(selrange.end);else this.text = txt.substring(0, selrange.start);
                    this.updateCursorPosition(selrange.start);
                } else if (selrange.end < txt.length) {
                    this.text = txt.substring(selrange.end);
                    this.updateCursorPosition(0);
                } else {
                    this.text = ''; // entire text was selected, so delete it all.
                    this.updateCursorPosition(0);
                }

                this.clearSelection();
            }
        }
    }, {
        key: 'clearSelection',
        value: function clearSelection() {
            if (this.hasChild(this.selection)) {
                this.removeChild(this.selection);
                this.selection.clear();
                this.selection.range = null;
                this.update();
            }
        }

        /* FOCUS AND BLUR */

    }, {
        key: 'isFocused',
        value: function isFocused() {
            return this.hasChild(this.cursor);
        }
    }, {
        key: 'focus',
        value: function focus() {
            if (this.isFocused()) return;
            var stage = this.stage;
            this.hideEmptyIcon();
            this.addChild(this.cursor);
            this.cursor.startBlinking();
            this.stroke = { color: 'cyan', lineWidth: 2 };
            if (stage) {
                stage.keyEventDelegate = this;
                stage.keyEventCandidate = null;
            }
            this._logState('focused');

            if (this.onFocus) this.onFocus();
        }
    }, {
        key: 'blur',
        value: function blur() {
            if (!this.isFocused()) return;
            var stage = this.stage;
            this.cursor.stopBlinking();
            this.removeChild(this.cursor);
            this.stroke = null;
            if (stage && stage.keyEventDelegate == this) {
                stage.keyEventDelegate = null;
            }
            if (this.text === '') this.showEmptyIcon();
            this._logState('blurred');

            if (this.onBlur) this.onBlur();
        }
    }, {
        key: 'animatePlaceholderStatus',
        value: function animatePlaceholderStatus() {
            if (this.stage && !this.stage.keyEventDelegate) this.focus();
        }

        // Artificially insert spaces in the text if
        // the player typed the next appropriate character,
        // so that players aren't forced to match the spacing of the code snippet.

    }, {
        key: 'attemptToAlignTextToHintText',
        value: function attemptToAlignTextToHintText() {
            if (!this.hasHint()) return false;

            // Verify text against hint text:
            var txt = this.text;
            var hint = this.hintTextExpr.text;
            var char_w = this.charWidthPerLine();
            for (var i = 0; i < txt.length && i < hint.length - 1; i++) {
                var c = txt[i];
                if (hint[i] === ' ' && c !== hint[i]) {
                    // Check if the typed character is actually the next
                    // character in the hint text.
                    if (c === hint[i + 1]) {
                        // artifically insert a space:
                        this.text = txt.substring(0, i) + ' ' + c + txt.substring(i + 1);
                        return true;
                    }
                }
            }

            return false;
        }
    }, {
        key: 'updateHintErrorBox',
        value: function updateHintErrorBox() {
            var _this5 = this;

            if (!this.hasHint()) return;

            if (this.hintErrorBoxes) {
                this.hintErrorBoxes.map(function (b) {
                    return _this5.removeChild(b);
                });
                this.hintErrorBoxes = null;
            }

            // Verify text against hint text:
            var txt = this.text;
            var hint = this.hintTextExpr.text;
            var char_w = this.charWidthPerLine();
            for (var i = 0; i < txt.length; i++) {
                var c = txt[i];
                if (i >= hint.length || c != hint[i]) {
                    // Create error box for this char.
                    var pos = this.cursorPosForCharIdx(i);
                    var box = new mag.Rect(pos.x, pos.y, char_w, 40);
                    box.color = 'red';
                    box.shadowOffset = 0;
                    box.opacity = 0.3;
                    this.addChild(box);
                    if (!this.hintErrorBoxes) this.hintErrorBoxes = [];
                    this.hintErrorBoxes.push(box);
                }
            }
        }

        /* KEY EVENTS */

    }, {
        key: 'type',
        value: function type(str) {
            this._logState('key-press', str);
            this.deleteSelectedText();
            var txt = this.text;
            var charIdx = this.cursorIndex;
            if (charIdx >= txt.length) // insert at end of text
                this.text += str;else if (charIdx > 0) // insert in between text
                this.text = txt.substring(0, charIdx) + str + txt.substring(charIdx);else // insert at beginning of text
                this.text = str + txt;
            if (this.attemptToAlignTextToHintText()) charIdx += 1;
            Resource.play('key-press-' + Math.floor(Math.random() * 4 + 1));
            this.updateCursorPosition(charIdx + 1);
            if (this.onTextChanged) this.onTextChanged();
            this.attemptToAlignTextToHintText();
            this.updateHintErrorBox();
            this.stage.update();
            this._logState('after-key-press', str);
        }
    }, {
        key: 'backspace',
        value: function backspace() {
            var num = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

            this._logState('backspace');
            if (this.hasSelection()) {
                this.deleteSelectedText();
                if (this.onTextChanged) this.onTextChanged();
                this.updateHintErrorBox();
                if (this.stage) this.stage.update();
                return;
            }
            var txt = this.text;
            var charIdx = this.cursorIndex;
            if (charIdx >= txt.length) {
                // backspace at end of text
                this.text = txt.substring(0, txt.length - 1);
                charIdx = txt.length - 1;
            } else if (charIdx > 0) {
                // backspace in between text
                this.text = txt.substring(0, charIdx - 1) + txt.substring(charIdx);
                charIdx--;
            }
            this.updateCursorPosition(charIdx);
            if (this.onTextChanged) this.onTextChanged();
            this.updateHintErrorBox();
            this.stage.update();
            this._logState('after-backspace');
        }
    }, {
        key: 'leftArrow',
        value: function leftArrow() {
            this._logState('left-arrow');
            this.updateCursorPosition(Math.max(0, this.cursorIndex - 1));
            this.clearSelection();
            this._logState('after-left-arrow');
        }
    }, {
        key: 'rightArrow',
        value: function rightArrow() {
            this._logState('right-arrow');
            this.updateCursorPosition(this.cursorIndex + 1);
            this.clearSelection();
            this._logState('after-right-arrow');
        }

        // Only call after the player has pressed ENTER when this box is focused.

    }, {
        key: 'carriageReturn',
        value: function carriageReturn() {
            var focusNext = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
            // Solidify block (if possible)
            this._logState('carriage-return');
            if (this.onCarriageReturn) this.onCarriageReturn(focusNext);
            if (this.stage) this.stage.update();
            this._logState('after-carriage-return');
        }

        // Simulates carriage return but without the logging of a CR,
        // which is reserved for actually pressing the ENTER key.

    }, {
        key: 'simulateCarriageReturn',
        value: function simulateCarriageReturn() {
            var focusNext = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

            if (this.onCarriageReturn) this.onCarriageReturn(focusNext);
            if (this.stage) this.stage.update();
        }
    }, {
        key: '_logState',
        value: function _logState(desc, extraDatum) {
            var rootParent = this.rootParent;
            var data = { 'text': this.text, 'rootParent': rootParent ? rootParent.toJavaScript() : 'UNKNOWN', 'isFocused': this.isFocused(), 'cursorIndex': this.cursorIndex };
            if (extraDatum) data['data'] = extraDatum;
            if (this.hasSelection()) data['selection'] = { start: this.selection.range.start, end: this.selection.range.end };else data['selection'] = 'none';
            Logger.log('tb-' + desc, data);
        }
    }, {
        key: 'text',
        get: function get() {
            return this.textExpr.text;
        },
        set: function set(txt) {
            this.textExpr.text = txt;
        }
    }, {
        key: 'fontSize',
        get: function get() {
            return this.textExpr.fontSize;
        },
        set: function set(fs) {
            this.textExpr.fontSize = fs;
        }
    }, {
        key: 'textColor',
        get: function get() {
            return this.textExpr.color;
        },
        set: function set(clr) {
            this.textExpr.color = clr;
        }
    }, {
        key: 'cursorIndex',
        get: function get() {
            return 'charIdx' in this.cursor ? this.cursor.charIdx : this.text.length;
        }
    }]);

    return TypeBox;
}(mag.RoundedRect);

// Summon ES6 expressions out of thin air!!


var SummoningTypeBox = function (_TypeBox) {
    _inherits(SummoningTypeBox, _TypeBox);

    function SummoningTypeBox(x, y, w, h) {
        _classCallCheck(this, SummoningTypeBox);

        var onCommit = function onCommit() {
            var _this7 = this;

            var txt = this.text.trim();
            var expr_desc = null;
            var input_map = {
                '==': '(== _ _)',
                '!=': '(!= _ _)',
                '?:': '(ifelse _b _ _)',
                '(x) => x': '(λx #x)',
                '(x) => x x': '(λx #x #x)',
                '(x) => x x x': '(λx #x #x #x)',
                '(x) =>': '(λx _)',
                'x': '(#_x)',
                'star': 'star',
                'rect': 'rect'
            };

            var block = void 0;
            if (txt in input_map) {
                expr_desc = input_map[txt];
                block = Level.parse(expr_desc)[0];
            } else {
                block = ES6Parser.parse(txt);
                if (!block) return;
            }

            block.update();
            block.pos = this.absolutePos;
            block.anchor = { x: 0, y: 0 };

            var fx = new ShatterExpressionEffect(block);
            fx.run(this.stage, function () {
                _this7.stage.add(block);
            }, function () {});
        };
        return _possibleConstructorReturn(this, (SummoningTypeBox.__proto__ || Object.getPrototypeOf(SummoningTypeBox)).call(this, x, y, w, h, onCommit));
    }

    _createClass(SummoningTypeBox, [{
        key: 'toJavaScript',
        value: function toJavaScript() {
            return '__summoning';
        }
    }]);

    return SummoningTypeBox;
}(TypeBox);

var BlinkingCursor = function (_mag$Rect2) {
    _inherits(BlinkingCursor, _mag$Rect2);

    function BlinkingCursor(x, y, w, h) {
        _classCallCheck(this, BlinkingCursor);

        var _this8 = _possibleConstructorReturn(this, (BlinkingCursor.__proto__ || Object.getPrototypeOf(BlinkingCursor)).call(this, x, y, w, h));

        _this8.color = 'black';
        _this8.opacity = 1;
        _this8.ignoreEvents = true;
        return _this8;
    }

    _createClass(BlinkingCursor, [{
        key: 'startBlinking',
        value: function startBlinking() {
            var _this9 = this;

            var blink = function blink() {
                _this9.blinkTween = Animate.tween(_this9, { opacity: 0 }, 1000, function (e) {
                    return Math.pow(e, 2);
                }).after(function () {
                    _this9.blinkTween = Animate.tween(_this9, { opacity: 1 }, 400, function (e) {
                        return Math.pow(e, 2);
                    }).after(function () {
                        blink();
                    });
                });
            };
            blink();
        }
    }, {
        key: 'resetBlinking',
        value: function resetBlinking() {
            this.stopBlinking();
            this.opacity = 1;
            this.startBlinking();
        }
    }, {
        key: 'stopBlinking',
        value: function stopBlinking() {
            if (this.blinkTween) {
                this.blinkTween.cancelWithoutFiringCallbacks();
                this.blinkTween = null;
                this.opacity = 1;
            }
        }
    }]);

    return BlinkingCursor;
}(mag.Rect);

/* A text expression that starts as a freeform text box (TypeBox). */


var TypeInTextExpr = function (_TextExpr) {
    _inherits(TypeInTextExpr, _TextExpr);

    _createClass(TypeInTextExpr, [{
        key: 'constructorArgs',
        value: function constructorArgs() {
            return [this.validator, this.afterCommit ? this.afterCommit : null, 1];
        }
    }, {
        key: 'clone',
        value: function clone() {
            var t = new TypeInTextExpr(this.validator, this.afterCommit);
            if (this.transformer) t.transformer = this.transformer;
            if (this.typeBox) {
                //console.log(t.typeBox);
                t.typeBox.text = this.typeBox.text;
                t.typeBox.color = this.typeBox.color;
                t.typeBox.textColor = this.typeBox.textColor;
                t.setDefaultWidth(this.typeBox._origWidth);
            } else {
                t.text = this.text;
                t.typeBox = null;
            }
            return t;
        }
    }, {
        key: 'toString',
        value: function toString() {
            if (!this.typeBox) return this.text; // finalized typebox returns its text
            var code = this._exprCode ? this._exprCode : '_t';
            if (this.typeBox && this.typeBox.text.length > 0) {
                var safe_text = this.typeBox.text.replace(/'/g, '"'); // convert all single-quotes to double for safety.
                return code + '(\'' + safe_text + '\')'; // records state as argument of a function call.
            } else return code;
        }
    }, {
        key: 'toJavaScript',
        value: function toJavaScript() {
            return this.toString();
        }

        // 'validator' is a function taking the text as an argument,
        // and returning true if valid and false if rejected.

    }], [{
        key: 'fromExprCode',


        /* Because there are many possible validators and contexts for typing,
        // and we need to write levels simply using an ES6 parser,
        // here we map predefined codes to special TypeInTextExpr's (+their validators).
        // Codes so far are:
        //      _t_string: Only accepts string values.
        //      _t_nonneg: Only accepts nonnegative integers.
        //      _t_int: Only accepts integers.
        //      _t_equiv: Only accepts comparison operators !=, ==, !==, ===.
        // There's also a special token, the operator >>>, which
        // means _t_equiv.
        */
        value: function fromExprCode(code, afterCommit) {
            var transformer = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

            code = code.replace('_t_', ''); // remove prepend

            // Special cases:
            // Entering strings without worry about quotes...
            if (code === 'string') return new (ExprManager.getClass('typing_str'))();
            // Entering arrays without brackets...
            else if (code === 'array') return new (ExprManager.getClass('typing_array'))();

            if (code === 'innerstring') transformer = function transformer(txt) {
                return '"' + txt + '"';
            };else if (code === 'innerarray') transformer = function transformer(txt) {
                return '[' + txt + ']';
            };

            var validators = {
                'arrow': function arrow(txt) {
                    return txt === '=>';
                },
                'fullarrow': function fullarrow(txt) {
                    return __PARSER.parse(transformer(txt)) instanceof LambdaExpr;
                },
                'fullstring': function fullstring(txt) {
                    return __PARSER.parse(txt) instanceof StringValueExpr;
                },
                'innerstring': function innerstring(txt) {
                    return __PARSER.parse(transformer(txt)) instanceof StringValueExpr;
                },
                'nonneg': function nonneg(txt) {
                    var i = Number.parseInt(txt, 10);
                    return !Number.isNaN(i) && i >= 0;
                },
                'innerarray': function innerarray(txt) {
                    return __PARSER.parse(transformer(txt)) instanceof BracketArrayExpr;
                },
                'int': function int(txt) {
                    return !Number.isNaN(Number.parseInt(txt, 10));
                },
                'equiv': function equiv(txt) {
                    return ['==', '!=', '===', '!==', 'or', 'and', 'or not', 'and not'].indexOf(txt) > -1;
                },
                'single': function single(txt) {
                    txt = txt.replace('return', '__return =');
                    var res = __PARSER.parse(txt);
                    return res && !(res instanceof Sequence);
                },
                'variable': function variable(txt) {
                    var result = __PARSER.parse(txt);
                    return result instanceof VarExpr || result instanceof VtableVarExpr;
                },
                'varname': function varname(txt) {
                    if (/^[a-z_]\w*$/g.test(txt)) {
                        // If it's a valid variable / function name...
                        // * Note that this doesn't actually check whether function with name 'txt' is defined.
                        // * If the player clicks on said undefined call, it should block them with a question mark effect.
                        return true;
                    } else {
                        return false;
                    }
                },
                'params': function params(txt) {
                    var dummy_call = 'foo' + txt;
                    if (__PARSER.parse(dummy_call)) {
                        // If it's a valid parameter list including parentheses, e.g. (0, 1, a, "georgia")
                        // * Similar to 'varname' above, doesn't type-check function to make sure call is valid.
                        // * This just verifies that the syntax is correct.
                        return true;
                    } else {
                        return false;
                    }
                }
            };
            if (code in validators) {
                var t = new TypeInTextExpr(validators[code], afterCommit);
                t._exprCode = '_t_' + code;
                if (transformer) t.transformer = transformer;
                return t;
            } else {
                console.error('@ TypeInTextExpr.fromExprCode: Code ' + code + ' doesn\'t match any known validator.');
                return null;
            }
        }
    }]);

    function TypeInTextExpr(validator, afterCommit) {
        var charLimit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

        _classCallCheck(this, TypeInTextExpr);

        var _this10 = _possibleConstructorReturn(this, (TypeInTextExpr.__proto__ || Object.getPrototypeOf(TypeInTextExpr)).call(this, " "));

        _this10._origValidator = validator;
        _this10.validator = function (txt) {
            var valid = validator(txt);
            Logger.log('check-validity', { 'text': txt, 'isValid': valid === true });
            return valid;
        };

        if (!afterCommit) {
            afterCommit = function afterCommit(txt) {
                txt = txt.replace('return', '__return =');
                var expr = __PARSER.parse(txt);
                if (!expr) return;
                var parent = void 0;
                var _this = _this10;
                if (_this10.emptyParent) {
                    _this = _this10.parent;
                    parent = _this10.parent.parent || _this10.parent.stage;
                } else {
                    parent = _this10.parent || _this10.stage;
                }
                var pos = _this.pos;
                var anchor = _this.anchor;
                parent.swap(_this, expr);
                if (parent instanceof mag.Stage) {
                    expr.pos = pos;
                    expr.anchor = anchor;
                }
                expr.lockSubexpressions(function (e) {
                    return !(e instanceof LambdaHoleExpr);
                });
                if (!(parent instanceof mag.Stage)) expr.lock();
                expr.update();
                // Make sure everything updates & everything gets laid out properly
                while (parent) {
                    parent.update();
                    parent = parent.parent;
                }
            };
        }
        _this10.afterCommit = afterCommit;

        var _thisTextExpr = _this10;
        var onCommit = function onCommit() {
            var focusNext = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

            var txt = this.text; // this.text is the TypeBox's text string, *not* the TextExpr's!
            console.log(txt);
            if (_thisTextExpr.validator(txt)) {
                (function () {
                    var rootParent = _thisTextExpr.rootParent;
                    var stage = _thisTextExpr.stage;
                    _thisTextExpr.commit(txt, focusNext);
                    Resource.play('carriage-return');

                    var prom = Promise.resolve();
                    if (_thisTextExpr._runOnCommitCb) {
                        // Delay for the callback animation.
                        prom = _thisTextExpr._runOnCommitCb();
                        delete _thisTextExpr._runOnCommitCb;
                    }

                    prom.then(function () {
                        if (afterCommit) afterCommit(txt);

                        Logger.log('after-commit-text', { 'text': txt, 'rootParent': rootParent ? rootParent.toJavaScript() : 'UNKNOWN' });
                        if (stage) stage.saveState();

                        // Also reduce the root parent if possible (removes
                        // need for redundant clicking). Don't reduce things
                        // that are already in the process of reducing,
                        // though.
                        if (rootParent && !rootParent.hasPlaceholderChildren() && !(rootParent instanceof LambdaExpr) && !rootParent._reducting) {
                            if (__AUTO_REDUCE_ON_TYPING_COMMIT) rootParent.performUserReduction();
                        }
                    });
                })();
            } else {
                Animate.blink(this, 1000, [1, 0, 0], 2); // blink red
            }
        };
        var onTextChanged = function onTextChanged() {
            if (_thisTextExpr.validator(this.text) === true) {
                //this.color = 'green';
                this.stroke = { color: '#0f0', lineWidth: 4 };
                if (_thisTextExpr.onTextChanged) _thisTextExpr.onTextChanged(this.text, true); // txt, validated?
            } else {
                    this.stroke = null;
                    if (_thisTextExpr.onTextChanged) _thisTextExpr.onTextChanged(this.text, false);
                }

            if (_thisTextExpr.stage) {
                _thisTextExpr.stage.saveSubstate();
            }
        };

        var box = new TypeBox(0, 0, 52, _this10.size.h, onCommit, onTextChanged);
        box.fontSize = _this10.fontSize;
        _this10.addChild(box);
        _this10.ignoreEvents = false;
        _this10.typeBox = box;
        return _this10;
    }

    _createClass(TypeInTextExpr, [{
        key: 'setDefaultWidth',
        value: function setDefaultWidth(w) {
            if (this.typeBox) {
                if (!this.typeBox.hasHint() && !this.typeBox.hasIcon()) this.typeBox.size = { w: w, h: this.typeBox.size.h };
                this.typeBox._origWidth = w;
            } else {
                this._size = { w: w, h: this._size.h };
            }
        }
    }, {
        key: 'setHint',
        value: function setHint(hintText) {
            this.typeBox.setHint(hintText);
        }
    }, {
        key: 'enforceHint',
        value: function enforceHint(hintText) {
            // Set the hint and changes the validator to only accept the hint text...
            this.validator = function (s) {
                return s === hintText;
            };
            this.setHint(hintText);
        }
    }, {
        key: 'runOnCommit',
        value: function runOnCommit(f) {
            this._runOnCommitCb = f.bind(this);
        }
    }, {
        key: 'parsedValue',
        value: function parsedValue() {
            if (this.typeBox) {
                var txt = this.typeBox.text;
                if (txt.length === 0) return null; // don't let null results at the moment...
                if (this.validator(txt)) {
                    if (this.transformer) txt = this.transformer(txt);
                    var result = __PARSER.parse(txt);
                    if (result) return result;
                }
            }
            return null;
        }
    }, {
        key: 'reduce',
        value: function reduce() {
            var value = this.parsedValue();
            if (value) {
                this.typeBox.simulateCarriageReturn();
                return value;
            }
            return this;
        }
    }, {
        key: 'performReduction',
        value: function performReduction() {
            var value = this.parsedValue();
            if (value) return Promise.resolve(value);
            return Promise.reject();
        }
    }, {
        key: 'commit',
        value: function commit(renderedText) {
            var focusNext = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

            var stage = this.stage;
            var rootParent = this.rootParent;
            this.blur();
            this.text = renderedText; // this is the underlying text in the TextExpr
            this.removeChild(this.typeBox);
            this.typeBox = null;
            this.update();

            if (focusNext) stage.focusFirstKeyDelegate(); // auto-enter the next TypeBox on screen, if one exists.

            ShapeExpandEffect.run(this, 200, function (e) {
                return Math.pow(e, 1);
            });
            ShapeExpandEffect.run(this, 350, function (e) {
                return Math.pow(e, 0.9);
            });
            ShapeExpandEffect.run(this, 500, function (e) {
                return Math.pow(e, 0.8);
            });

            Logger.log('commit-text', { 'text': renderedText, 'rootParent': rootParent ? rootParent.toJavaScript() : 'UNKNOWN' });
        }
    }, {
        key: 'isCommitted',
        value: function isCommitted() {
            return this.typeBox === null;
        }
    }, {
        key: 'hits',
        value: function hits(pos, options) {
            return this.hitsChild(pos, options);
        }
    }, {
        key: 'focus',
        value: function focus() {
            this.typeBox.focus();this.typeBox.onmouseleave();
        }
    }, {
        key: 'blur',
        value: function blur() {
            this.typeBox.blur();
        }
    }, {
        key: 'isValue',
        value: function isValue() {
            return false;
        }
    }, {
        key: 'isPlaceholder',
        value: function isPlaceholder() {
            return !this.isCommitted();
        }
    }, {
        key: 'animatePlaceholderStatus',
        value: function animatePlaceholderStatus() {
            if (this.typeBox) {
                Animate.blink(this.typeBox, 1000, [1, 0, 0], 2);
                this.typeBox.animatePlaceholderStatus();
            }
        }
    }, {
        key: 'canReduce',
        value: function canReduce() {
            if (this.typeBox) {
                var txt = this.typeBox.text;
                var valid = this.validator(txt);
                if (valid) {
                    this.reduce();
                    return true;
                }
                return false;
            } else return true;
        }
    }, {
        key: 'isComplete',
        value: function isComplete() {
            if (this.typeBox) {
                var txt = this.typeBox.text;
                return this.validator(txt);
            } else {
                return true;
            }
        }
    }, {
        key: 'value',
        value: function value() {
            return undefined;
        }
    }, {
        key: 'size',
        get: function get() {
            if (this.typeBox) {
                return this.typeBox.size;
            } else {
                return _get(TypeInTextExpr.prototype.__proto__ || Object.getPrototypeOf(TypeInTextExpr.prototype), 'size', this);
            }
        }
    }]);

    return TypeInTextExpr;
}(TextExpr);