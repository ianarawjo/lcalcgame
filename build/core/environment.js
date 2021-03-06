"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Environment = function () {
    function Environment() {
        var parent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

        _classCallCheck(this, Environment);

        this.parent = parent;
        this.bindings = {};
        this.observers = [];
        this.bound = {};
    }

    _createClass(Environment, [{
        key: "lookup",
        value: function lookup(key) {
            var value = this.bindings[key];
            if (value) return value;

            if (this.bound[key]) return null;

            if (this.parent) {
                return this.parent.lookup(key);
            }

            return null;
        }
    }, {
        key: "update",
        value: function update(key, value) {
            this.bindings[key] = value;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.observers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var observer = _step.value;

                    observer(key, value);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }
    }, {
        key: "names",
        value: function names() {
            var set = new Set([].concat(_toConsumableArray(Object.keys(this.bindings)), _toConsumableArray(this.parent ? this.parent.names() : [])));
            return Array.from(set);
        }
    }, {
        key: "observe",
        value: function observe(func) {
            this.observers.push(func);
        }
    }], [{
        key: "parse",
        value: function parse(desc) {
            var bindings = {};
            var env = new Environment();
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = Object.keys(desc)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var name = _step2.value;

                    var expr = Level.parse(desc[name]);
                    if (expr.length !== 1) {
                        throw "Invalid description of global value: " + name + "=" + desc[name];
                    }
                    env.update(name, expr[0]);
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            return env;
        }
    }]);

    return Environment;
}();