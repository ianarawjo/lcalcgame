'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var primitives = [{ opname: 'star', description: 'A star.' }, { opname: 'rect', description: 'A rectangle.' }, { opname: 'diamond', description: 'A rectangle (tilt your head 45 degrees).' }, { opname: 'triangle', description: 'A triangle.' }, { opname: 'circle', description: 'A circle.' }, { opname: 'true', description: 'A primitive boolean representing TRUE.' }, { opname: 'false', description: 'A primitive boolean representing FALSE.' }, { opname: '_', example: '(== _ _) yields a test for equality with both arguments e1 and e2 as empty spaces.', description: 'An empty space for an expression.' }];
var operators = [{ opname: 'if', usage: '(if <condition> <branch>)', example: '(if true star) gives (star).', description: 'Basic conditional. Returns nothing if condition evals to FALSE, the branch if condition evals to TRUE.' }, { opname: 'ifelse', usage: '(ifelse <condition> <branch> <else_branch>)', example: '(ifelse false star triangle) gives (triangle).', description: 'True conditional. Reduces to else_branch if condition evals to FALSE, the branch if condition evals to TRUE.' }, { opname: '==', usage: '(== <e1> <e2>)', example: '(== star star) gives (true).', description: 'Test for equality between two expressions.' }, { opname: '!=', usage: '(!= <e1> <e2>)', example: '(!= star star) gives (false).', description: 'Negated test for equality between two expressions.' }, { opname: 'map', usage: '(map <oneParamFunc> <iterable>)', example: '(map /(λx /star) __) yields a map with an empty spot for a bag, and a constant function that yields a (star).', description: 'Map <func> over all the expressions in <iterable>, return all the mapped expressions.' }, { opname: 'reduce', usage: '(reduce <twoParamFunc> <iterable> <initializer>)', example: '(reduce /(λx /(λx /(== #x /star))) (bag star star star) (star)) yields, basically, star is star is star is star...', description: 'Reduce from Python.' }, { opname: 'put', usage: '(put <e> <iterable>)', example: '(put star (bag rect)) gives (bag star rect).', description: 'Puts the expression inside the iterable, e.g. a star inside a bag.' }, { opname: 'pop', usage: '(pop <iterable>)', example: '(pop (bag star rect)) gives either a star or a rect.', description: 'Pops an item from the iterable. If this is a bag, the item returned is random.' }];
var iterables = [{ opname: 'bag', usage: '(bag item1 item2 ... itemN)', example: '(bag star rect triangle) spawns a bag with three primitives in it.', description: 'An unordered multiset.' }, { opname: '__', example: '(== __ __) yields a test for equality between two bags and only two bags.', description: 'Similar to "_". An empty space that only takes an iterable (or a defined function like put which yields an iterable).' }];
var lambdas = [{ opname: 'λx', usage: '(λx <e1> ... <eN>)', example: '(λx #x #x) is the replicator.', description: 'A hole for a variable definition in a lambda expression.' }, { opname: '#x', usage: '(#x)', example: '(λx #x) is identity.', description: 'A pipe representing a binding to the name "x". You can also use y, z, w, etc.' }, { opname: '#_x', usage: '(#_x)', example: '(λx #_x) is identity with a movable pipe.', description: 'Same as #x except you can move it out of the expression.' }];

function cleanTags(str) {
    if (!str) return str;
    return str.replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
}

/**
 * A programmatically-generated Gannt chart for the current progression of the game,
 * similar to the progression table presented in our CHI 2017 paper.
 * @param  {[type]} table  A <table> DOM element.
 * @param  {[type]} chapters A sequential list of game chapters, parsed from their JSON descriptions.
 */
function constructGanttChart(table, chapters) {

    // A color object, to color the cells and interpolate between colors.
    var rgb = function rgb(r, g, b) {
        return { r: r, g: g, b: b };
    };
    var rgbToCSS = function rgbToCSS(c) {
        return 'rgb(' + Math.round(c.r) + ',' + Math.round(c.g) + ',' + Math.round(c.b) + ')';
    };
    var mixColors = function mixColors(c1, c2, ratio) {
        return { r: c1.r * (1 - ratio) + c2.r * ratio, g: c1.g * (1 - ratio) + c2.g * ratio, b: c1.b * (1 - ratio) + c2.b * ratio };
    };

    var concepts = {
        'Lambda': {
            'color': rgb(200, 200, 200),
            'matches': ['λ', 'lambda', '=>']
        },
        'Numbers': {
            'color': rgb(160, 160, 160),
            'matches': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+']
        },
        'Boolean': {
            'color': rgb(255, 105, 180),
            'matches': ['==', '!=', 'true', 'false']
        },
        'Equality': {
            'color': rgb(255, 182, 193),
            'matches': ['==', '!=']
        },
        'Give': {
            'color': rgb(120, 200, 120),
            'matches': ['give']
        },
        'Typing Verb.': {
            'color': rgb(255, 228, 181),
            'matches': [],
            'matcher': function matcher(lvl) {
                return 'typing_hints' in lvl;
            }
        },
        'Typing Free': {
            'color': rgb(255, 165, 0),
            'matches': ['_t_', '>>>'],
            'excluding': function excluding(lvl, exprs) {
                return 'typing_hints' in lvl || exprs.some(function (e) {
                    return (/_t_string|_t_fullstring/.test(e)
                    );
                });
            }
        },
        'Typing Str.': {
            'color': rgb(255, 239, 0),
            'matches': ['_t_string', '_t_fullstring'],
            'matcher': function matcher(lvl, exprs) {
                return 'typing_solution' in lvl && lvl['typing_solution'].some(function (e) {
                    return (/.*('.*'|".*").*/.test(e)
                    );
                });
            }
        },
        'Conditional': {
            'color': rgb(0, 206, 209),
            'matches': ['if', 'ifelse', /([^?]*)\?([^:]*):([^;]*)/] // matches the ternary op, thanks https://stackoverflow.com/a/26739863
        },
        'Map': {
            'color': rgb(120, 200, 120),
            'matches': ['map']
        },
        'L. Operators': {
            'color': rgb(255, 182, 213),
            'matches': ['&&', '||', '!', ' > ', ' < ']
        },
        'Bags': {
            'color': rgb(255, 239, 0),
            'matches': ['bag']
        },
        'Array Objects': {
            'color': rgb(40, 200, 40),
            'matches': ['arrayobj', '[]', '__', "_t_array"]
        },
        'Object define': {
            'color': rgb(154, 205, 50),
            'matches': ['class']
        },
        'Define': {
            'color': rgb(255, 40, 40),
            'matches': ['define']
        },
        'Variables': {
            'color': rgb(80, 120, 244),
            'matches': ['$']
        },
        'Assignment': {
            'color': rgb(120, 120, 204),
            'matches': ['assign']
        },
        'Sequences': {
            'color': rgb(140, 200, 244),
            'matches': ['sequence']
        },
        'Loops': {
            'color': rgb(240, 200, 144),
            'matches': ['repeat']
        },
        'Snappables': {
            'color': rgb(230, 230, 250),
            'matches': ['snappable']
        },
        'Choice Block': {
            'color': rgb(216, 191, 216),
            'matches': ['choice']
        }
    };

    // Rows are concepts,
    // columns are levels.
    // * A table cell is specified by an object w/ properties { 'text', (OPTIONAL)'color' } *
    //var level_name_cell = { 'text':'Level #' };
    var row_names = []; // we'll take the transpose of this
    Object.keys(concepts).forEach(function (concept) {
        return row_names.push({
            'text': concept,
            'color': concepts[concept].color
        });
    });

    var conceptContainsExpr = function conceptContainsExpr(concept, e) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = concept.matches[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var match = _step.value;

                if (match instanceof RegExp) {
                    // Concepts can be expressed as regex patterns.
                    if (match.test(e)) return true;
                } else if ((typeof e === 'undefined' ? 'undefined' : _typeof(e)) === 'object') {} else if (e.indexOf(match) > -1) {
                    // We have a match.
                    return true;
                }
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

        return false;
    };
    var levelContainsConcept = function levelContainsConcept(level, concept) {

        // First, get all the expressions in one place:
        var exprs = [];
        var merge = function merge(e, es) {
            if (Array.isArray(e)) return es.concat(e);else if ((typeof e === 'undefined' ? 'undefined' : _typeof(e)) === 'object') return es.concat(Object.keys(e).map(function (k) {
                return e[k];
            }));else return es.concat([e]);
        };
        if (level.board) exprs = merge(level.board, exprs);
        if (level.toolbox) exprs = merge(level.toolbox, exprs);
        if (level.goal) exprs = merge(level.goal, exprs);
        if (level.globals) exprs = merge(level.globals, exprs);

        // This info is useful in typing-based
        // levels where it's hard to determine what
        // concepts are needed to solve the problem.
        var typing_verbatim = [];
        var typing_free = [];
        if (level.typing_hints) typing_verbatim = merge(level.typing_hints, typing_verbatim);
        if (level.typing_solution) typing_free = merge(level.typing_solution, typing_free);

        // Now iterate through and check for concept matches:
        var match = false;
        var conceptMatch = function conceptMatch(exprs) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = exprs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var e = _step2.value;

                    if (conceptContainsExpr(concept, e)) {
                        if (!('excluding' in concept) || !concept.excluding(level, exprs)) {
                            // We have a match.
                            return true;
                        }
                    }
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

            if ('matcher' in concept && concept.matcher(level, exprs)) {
                return true;
            }
            return false;
        };
        if (conceptMatch(typing_verbatim)) return 'typed-verbatim';
        if (conceptMatch(typing_free)) return 'typed-free';
        if (conceptMatch(exprs)) return true;

        // No match found!
        return false;
    };

    // Checks whether level contains a given concept,
    // and creates a table cell out of it.
    var toCell = function toCell(level, lvl_idx, concept, conceptName) {
        var url = 'index.html?level=' + lvl_idx;
        var contains = levelContainsConcept(level, concept);
        if (contains !== false) {
            var color = concept.color;

            if (false && conceptName.indexOf('Typing') === -1) {
                if (contains === 'typed-verbatim') // Make typed expressions appear darker in the chart.
                    color = mixColors(color, rgb(100, 0, 255), 0.25);else if (contains === 'typed-free') // Make typed-free expressions appear even darker in the chart.
                    color = mixColors(color, rgb(0, 0, 255), 0.5);
            }

            if (level.fade && !('showFade' in level && level.showFade === false)) {
                for (var e in level.fade) {
                    if (conceptContainsExpr(concept, e)) {
                        color = rgb(60, 60, 90);
                        break;
                    }
                }
            }
            return { 'text': '', 'color': color, 'url': url };
        } else return { 'text': '', 'color': rgb(255, 255, 255), 'url': url };
    };

    // Fill in the table data
    var cells = []; // In format: [ [..row0..], [..row1..], ..., [..rowN..] ]
    var total_num_lvls = Resource.level.length;
    var curr_lvl_count = 0;
    var rows = row_names.map(function (cell) {
        return [cell];
    });
    var heading_row = [{ 'text': '', 'border': 'none' }];
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        var _loop = function _loop() {
            var chapter = _step3.value;

            var levels = Resource.level.slice(chapter.startIdx, chapter.endIdx + 1);
            levels.forEach(function (level, idx) {
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    for (var _iterator4 = rows[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var _row = _step4.value;

                        var concept = concepts[_row[0].text];
                        _row.push(toCell(level, curr_lvl_count + idx, concept, _row[0].text));
                    } // for each row, # of cells == # of levels + 1
                } catch (err) {
                    _didIteratorError4 = true;
                    _iteratorError4 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion4 && _iterator4.return) {
                            _iterator4.return();
                        }
                    } finally {
                        if (_didIteratorError4) {
                            throw _iteratorError4;
                        }
                    }
                }

                if (idx === 0) {
                    heading_row.push({ 'text': chapter.name, 'width': chapter.name === 'Defining Objects' ? '40px' : '10px', 'border': 'left' });
                } else heading_row.push({ 'text': '', 'border': 'none' });
            });
            curr_lvl_count += levels.length;
        };

        for (var _iterator3 = chapters[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            _loop();
        }

        // Create chapter heading row
    } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
            }
        } finally {
            if (_didIteratorError3) {
                throw _iteratorError3;
            }
        }
    }

    rows.splice(0, 0, heading_row);

    // Create DOM table from data
    var setupDOMCell = function setupDOMCell(DOMcell, cell_desc) {
        var url = cell_desc.url;
        var clr = 'color' in cell_desc ? cell_desc.color : rgb(255, 255, 255);
        $(DOMcell).css('background-color', rgbToCSS(clr));
        var div = document.createElement('div');
        $(div).text(cell_desc.text);
        if (cell_desc.text.trim().length === 0) {
            $(div).css('width', '1px');
            $(div).css('margin', '0px');
            $(div).css('padding', '0px');
        } else if ('width' in cell_desc) $(div).css('width', cell_desc.width);else $(div).css('width', '100px');
        $(div).css('padding', '5px');
        $(DOMcell).append(div);
        if ('border' in cell_desc) {
            if (cell_desc.border === 'left') {
                $(DOMcell).css({
                    'border-style': 'none',
                    'border-left-style': 'solid'
                });
            } else if (cell_desc.border === 'right') {
                $(DOMcell).css({
                    'border-style': 'none',
                    'border-right-style': 'solid'
                });
            } else $(DOMcell).css('border-style', cell_desc.border);
        }
        if (url) {
            $(DOMcell).attr('title', 'Level ' + url.replace('index.html?level=', ''));
            $(DOMcell).addClass('cell');
            $(DOMcell).on('click', function () {
                window.open(url, '_blank');
            });
            $(DOMcell).mouseenter(function () {
                var c = rgbToCSS(mixColors(clr, rgb(255, 255, 255), 0.6));
                $(this).css('background-color', c);
            });
            $(DOMcell).mouseleave(function () {
                $(this).css('background-color', rgbToCSS(clr));
            });
        }
        //$(DOMcell).innerHTML = '<p>' + ('text' in cell_desc ? cell_desc.text : ' ') + '</p>';
        //$(DOMcell).css('width','50px');
        //$(DOMcell).css('height','50px');
    };
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var DOMrow = table.insertRow(i);
        for (var j = 0; j < row.length; j++) {
            setupDOMCell(DOMrow.insertCell(j), row[j]);
        }
    }
}

function constructTable(table, descs) {
    var len = descs.length;

    var row = table.insertRow(0);
    row.insertCell(0).innerHTML = '<h4>Name</h4>';
    row.insertCell(1).innerHTML = '<h4>Description</h4>';
    row.insertCell(2).innerHTML = '<h4>Usage</h4>';
    row.insertCell(3).innerHTML = '<h4>Example</h4>';

    for (var i = 0; i < len; i++) {

        descs[i].description = cleanTags(descs[i].description);
        descs[i].usage = cleanTags(descs[i].usage);
        descs[i].example = cleanTags(descs[i].example);

        row = table.insertRow(i + 1);
        row.insertCell(0).innerHTML = descs[i].opname || '';
        row.insertCell(1).innerHTML = descs[i].description || '';
        row.insertCell(2).innerHTML = descs[i].usage || '';
        row.insertCell(3).innerHTML = descs[i].example || '';
    }
}
function constructLevelsTable(name, desc, table, levels, startIdx) {
    var num_levels = levels.length;
    table.className += 'levels';

    var row = table.insertRow(0);
    row.insertCell(0).innerHTML = '<h3>' + name + '</h3>';
    row.insertCell(1).innerHTML = '<h3>' + desc + '</h3>';

    var row = table.insertRow(1);
    row.insertCell(0).innerHTML = '<h4>Level</h4>';
    row.insertCell(1).innerHTML = '<h4>Goal</h4>';
    row.insertCell(2).innerHTML = '<h4>Toolbox</h4>';
    row.insertCell(3).innerHTML = '<h4>Description</h4>';

    for (var i = 0; i < num_levels; i++) {
        row = table.insertRow(i + 2);
        row.insertCell(0).innerHTML = '<a href="' + 'index.html?level=' + (i + startIdx) + '" target="_blank">' + levels[i].board + '</a>';
        row.insertCell(1).innerHTML = levels[i].goal;
        row.insertCell(2).innerHTML = levels[i].toolbox || '';
        row.insertCell(3).innerHTML = levels[i].description || '';
    }
}

function initGantt() {
    Resource.setCurrentLoadSequence('init');
    LOAD_REDUCT_RESOURCES(Resource);
    Resource.afterLoadSequence('init', function () {
        var table_gannt = document.getElementById('gannt');
        Resource.getChapters().then(function (chapters) {
            constructGanttChart(table_gannt, chapters);
        });
    });
}

function init() {

    Resource.setCurrentLoadSequence('init');
    LOAD_REDUCT_RESOURCES(Resource);
    Resource.afterLoadSequence('init', function () {

        var table_primitives = document.getElementById('primitives');
        var table_operators = document.getElementById('operators');
        var table_iterables = document.getElementById('iterables');
        var table_lambdas = document.getElementById('lambdas');

        constructTable(table_primitives, primitives);
        constructTable(table_operators, operators);
        constructTable(table_iterables, iterables);
        constructTable(table_lambdas, lambdas);

        var div_levels = document.getElementById('level_tables');
        Resource.getChapters().then(function (chapters) {
            var all_levels = Resource.level;

            for (var c = 0; c < chapters.length; c++) {
                var name = chapters[c].name;
                var desc = chapters[c].description;
                var idx = chapters[c].startIdx;
                var next_idx = c < chapters.length - 1 ? chapters[c + 1].startIdx : all_levels.length;

                var table = document.createElement('table');
                constructLevelsTable(name, desc, table, all_levels.slice(idx, next_idx), idx);
                div_levels.appendChild(table);
                div_levels.appendChild(document.createElement('p'));
            }
        });
    });
}