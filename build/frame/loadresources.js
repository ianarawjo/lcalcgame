'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/* For fast-switching between game progressions. */
var __ACTIVE_PROGRESSION = 'Typing Study 18';
var __PROGRESSIONS = {
    'Default': {
        dir: 'levels/',
        digraph: {
            'intro': ['booleans'],
            'booleans': ['strings'],
            'strings': ['confusing_strings'],
            'confusing_strings': ['conditionals'],
            'conditionals': ['bindings'],
            'bindings': ['map'],
            'map': []
        },
        settings: { // This sets global flags.
            '__ALLOW_PARTIAL_REPLICATION': false,
            '__ALLOW_SKIPPING': true,
            '__ALLOW_ARRAY_EVENTS': false
        }
    },
    'Typing Study': {
        dir: 'levels-typing/',
        digraph: {
            'intro': ['lambdas'],
            'lambdas': ['booleans'],
            'booleans': ['bindings'],
            'bindings': ['ternaries'],
            'ternaries': []
        },
        settings: { // This sets global flags.
            '__ALLOW_PARTIAL_REPLICATION': false,
            '__ALLOW_SKIPPING': true,
            '__ALLOW_ARRAY_EVENTS': false
        }
    },
    'Typing Study 18': {
        dir: 'levels-typing-3/',
        digraph: {
            'addition_blocks': ['addition_typing'],
            'addition_typing': ['booleans_blocks'],
            // 'lambdas_blocks': ['lambdas_typing'],
            // 'lambdas_typing': ['booleans_blocks'],
            'booleans_blocks': ['booleans_typing'],
            'booleans_typing': ['ternaries_blocks'],
            'ternaries_blocks': ['ternaries_typing'],
            'ternaries_typing': ['concat_blocks'],
            'concat_blocks': ['concat_typing'],
            'concat_typing': ['give_blocks'],
            'give_blocks': ['give_typing'],
            'give_typing': ['bindings_blocks'],
            'bindings_blocks': ['bindings_typing'],
            'bindings_typing': ['map_operators_blocks'],
            'map_operators_blocks': ['map_operators_typing'],
            'map_operators_typing': ['confusing_strings_blocks'],
            'confusing_strings_blocks': ['confusing_strings_typing'],
            'confusing_strings_typing': ['map_strings_typing'],
            'map_strings_typing': ['ternary_bindings_blocks'],
            'ternary_bindings_blocks': ['ternary_bindings_typing'],
            'ternary_bindings_typing': []
        },
        settings: { // This sets global flags.
            '__ALLOW_PARTIAL_REPLICATION': false,
            '__ALLOW_SKIPPING': true,
            '__ALLOW_ARRAY_EVENTS': false
        }
    },
    'Typing Study 18 - Blocks only': {
        dir: 'levels-typing-3/',
        digraph: {
            'addition_blocks': ['booleans_blocks'],
            'booleans_blocks': ['ternaries_blocks'],
            'ternaries_blocks': ['concat_blocks'],
            'concat_blocks': []
        },
        settings: { // This sets global flags.
            '__ALLOW_PARTIAL_REPLICATION': false,
            '__ALLOW_SKIPPING': true,
            '__ALLOW_ARRAY_EVENTS': false
        }
    },
    'Original Typing Study': {
        dir: 'levels-chi18-second-draft/',
        digraph: {
            'intro': ['booleans'],
            'booleans': ['strings'],
            'strings': ['bindings'],
            'bindings': ['confusing_strings'],
            'confusing_strings': ['conditionals'],
            'conditionals': ['map'],
            'map': []
        }
    },
    'Hour of Code': {
        dir: 'levels-hourofcode/',
        digraph: {
            'intro': ['booleans'],
            'booleans': ['conditionals'],
            'conditionals': ['bindings'],
            'bindings': ['bags'],
            'bags': ['combination'],
            'combination': ['map'],
            'map': ['variables'],
            'variables': ['sequence'],
            'sequence': ['typing_variables'],
            'typing_variables': []
        },
        settings: { // This sets global flags.
            '__ALLOW_PARTIAL_REPLICATION': true,
            '__ALLOW_SKIPPING': false,
            '__ALLOW_ARRAY_EVENTS': true
        }
    }
};

function LOAD_REDUCT_GAMEAUDIO(Resource) {
    var loadAudio = Resource.loadAudio;
    var loadMusic = Resource.loadMusic;
    loadAudio('pop', 'pop.wav');
    loadAudio('poof', '208111__planman__poof-of-smoke.wav');
    loadAudio('fly-to', '60012__qubodup__swing-25.wav');
    loadAudio('fall-to', '202753__sheepfilms__slide-whistle-1.wav');
    loadAudio('come-out', '202753__sheepfilms__slide-whistle-2.wav');
    loadAudio('bag-spill', 'spill.wav');
    loadAudio('bag-addItem', 'putaway.wav');
    loadAudio('heatup', 'heatup.wav');
    loadAudio('shatter', 'shatter1.wav');
    loadAudio('mirror-shatter', 'shatter2.wav');
    loadAudio('splosion', 'firework1.wav');
    loadAudio('shootwee', 'firework-shooting.wav');
    loadAudio('swoop', 'swoop.wav');
    loadAudio('key-jiggle', 'key-jiggle.wav');
    loadAudio('key-unlock', 'key-unlock-fast.wav');
    loadAudio('victory', '325805__wagna__collect.wav');
    loadAudio('matching-goal', 'matching-the-goal2.wav');
    loadAudio('mutate', 'deflate.wav');
    loadAudio('game-complete', 'game-complete.wav');
    loadAudio('chest-open', '202092__spookymodem__chest-opening.wav');
    loadAudio('fatbtn-click', 'fatbtn_click.wav');
    loadAudio('fatbtn-beep', 'fatbtn_space.wav');
    loadAudio('fatbtn-beep2', 'fatbtn_space2.wav');
    loadAudio('goback', 'ui_back.wav');
    loadAudio('zoomin', 'zoom_planet.wav');
    loadAudio('define', 'define.wav');
    loadAudio('place', 'place_from_toolbox.wav');
    loadAudio('define-convert', 'convert.wav');
    loadAudio('drawer-open', 'drawer_close.wav');
    loadAudio('drawer-close', 'drawer_open.wav');
    loadAudio('carriage-return', 'carriage-return.wav');
    loadAudio('key-press-1', 'key-press-1.wav');
    loadAudio('key-press-2', 'key-press-2.wav');
    loadAudio('key-press-3', 'key-press-3.wav');
    loadAudio('key-press-4', 'key-press-4.wav');
    loadAudio('printer', '119556__vrodge__office-printer-printing.wav');
    loadAudio('stamp', '33310__queensize__stamp.wav');
    loadAudio('unlock-planet', '325112__fisch12345__success.wav');

    // Bg music
    // DISABLED for now... takes too long to load!
    // loadMusic('bg1', 'bg-night-owl-loop.mp3');
    // loadMusic('bg-menu', 'bg-zabriskie-cylinder-nine.mp3');
}

function LOAD_REDUCT_RESOURCES(Resource) {
    var __PROG = __PROGRESSIONS[__ACTIVE_PROGRESSION];
    var __RESOURCE_PATH = Resource.path;
    var __LEVELS_PATH = __RESOURCE_PATH + __PROG.dir;
    var chapterDigraph = __PROG.digraph;

    if ('settings' in __PROG) {
        var settings = __PROG.settings;
        for (var s in settings) {
            if (s in window) window[s] = settings[s];else console.warn('Setting "' + s + '" is not a member of window object. Skipping...');
        }
    }

    var loadAudio = Resource.loadAudio;
    var loadImage = Resource.loadImage;
    var loadImageSequence = Resource.loadImageSequence;
    var loadAnimation = Resource.loadAnimation;

    var levels = [];
    var chapters = [];
    var digraph = void 0;
    var markChapter = function markChapter(json, json_filename, prev_levels) {
        var d = {
            name: json.chapterName,
            description: json.description,
            language: json.language || "reduct-scheme",
            startIdx: prev_levels.length,
            endIdx: prev_levels.length + json.levels.length - 1,
            key: json_filename
        };
        if (json.resources) d.resources = json.resources;
        chapters.push(d);
    };
    var pushChapter = function pushChapter(json, json_filename) {
        markChapter(json, json_filename, levels);
        var lang = json.language || "reduct-scheme";
        var macros = json.macros;
        json.levels.forEach(function (lvl) {
            lvl.language = lang;
            if (macros) lvl.macros = macros;
            if (lvl.fade && 'ExprManager' in window) {
                // Shorthand: specify "lambda" to fade both var and
                // hole. If one has fewer fade levels than the other,
                // saturate the fade level.
                if (lvl.fade["lambda"]) {
                    lvl.fade["var"] = Math.min(lvl.fade["lambda"], ExprManager.getNumOfFadeLevels("var"));
                    lvl.fade["hole"] = Math.min(lvl.fade["lambda"], ExprManager.getNumOfFadeLevels("hole"));
                    delete lvl.fade["lambda"];
                }
            }
            levels.push(lvl);
        });
    };
    var loadChapterFromFile = function loadChapterFromFile(json_filename) {
        return new Promise(function (resolve, reject) {
            $.getJSON(__LEVELS_PATH + json_filename + '.json', function (json) {

                console.log(json_filename);

                // Copy the planet's aliens to the individual level
                // definitions, so that buildLevel has access to
                // them. Provide a default alien when not specified.
                var aliens = json.resources && json.resources.aliens ? json.resources.aliens : ["alien-function-1"];
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = json.levels[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var level = _step.value;

                        level.resources = level.resources || {
                            aliens: aliens
                        };
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

                pushChapter(json, json_filename);
                resolve();
            }).fail(function (jqXHR, textStatus, errorThrown) {
                console.error('getJSON request failed! ' + textStatus + ' @ ' + json_filename, errorThrown);
            });
        });
    };
    var loadChaptersFromFiles = function loadChaptersFromFiles(files) {
        // Loads all chapters from json files asynchronously.
        // Chain loading promises
        return files.reduce(function (prev, curr) {
            return prev.then(function () {
                return loadChapterFromFile(curr);
            });
        }, Promise.resolve());
    };

    var loadChaptersFromDigraph = function loadChaptersFromDigraph(definition) {
        var filenames = Object.keys(definition);
        var load = filenames.reduce(function (prev, curr) {
            return prev.then(function () {
                return loadChapterFromFile(curr);
            });
        }, Promise.resolve());
        return load.then(function () {
            // Chapters are in the same order as filenames
            for (var i = 0; i < chapters.length; i++) {
                chapters[i].transitions = definition[filenames[i]];
                chapters[i].filename = filenames[i];
            }

            // Construct the dependencies list as well
            var dependencies = {};
            for (var _i = 0; _i < chapters.length; _i++) {
                dependencies[_i] = {};
            }
            for (var _i2 = 0; _i2 < chapters.length; _i2++) {
                var dsts = definition[filenames[_i2]];
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = dsts[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var dst = _step2.value;

                        dependencies[filenames.indexOf(dst)][_i2] = true;
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
            }

            digraph = {
                chapters: chapters,
                transitions: definition,
                dependencies: dependencies
            };
            return digraph;
        });
    };

    Resource.markChapter = markChapter;
    Resource.pushChapter = pushChapter;
    Resource.loadChapterFromFile = loadChapterFromFile;
    Resource.loadChaptersFromFiles = loadChaptersFromFiles;

    // This is used as a tiled texture, thus it can't be part of the spritesheet
    loadImage('shinewrap', 'shinewrap.png');
    loadImage('shinewrap-rightend', 'shinewrap-rightend.png');
    // This is used as a stretched texture, and can't be part of the
    // spritesheet without some sort of border
    loadImage('toolbox-bg', 'toolbox-bg.png');

    Resource.loadImageAtlas('assets', 'assets.json');
    //loadImage('die', 'die.png');

    //loadImage('apply-arrow', 'apply_arrow.png');
    //loadImage('handle', 'pullout-drawer-handle.png');
    //loadImage('drag-patch', 'name-drag-patch.png');

    // Main menu
    Resource.loadImageAtlas('menu', 'starboy/menu-assets.json');
    loadAudio('levelspot-activate', 'popin.wav');
    loadAudio('levelspot-scan', '361922__lacimarsik__tuning-fork-a4-440hz.wav');
    loadAudio('mainmenu-enter', 'sci-fi-engine-startup.wav');

    // Load preset animations from image sequences.
    loadAnimation('poof', [0, 4], 120); // Cloud 'poof' animation for destructor piece.

    // const chapterDigraph = {                     // BEFORE CHI '18.
    //     'intro': ['booleans'],
    //     'booleans': ['conditionals'],
    //     'conditionals': ['bindings', 'bags'],
    //     'bindings': ['combination'],
    //     'bags': ['combination'],
    //     'combination': ['map-chi'],
    //     'map-chi': ['intro_obj'],
    //     'intro_obj': ['intro_typing'],
    //     'intro_typing': ['logicalops'],
    //     'logicalops' : ['assign-chi'],
    //     'assign-chi': ['logicalops_vars'],
    //     'logicalops_vars': ['sequence'],
    //     'sequence': ['loops'],
    //     'loops': ['mystery'],
    //     'mystery': ['modulo'],
    //     'modulo': ['variables_obj'],
    //     'variables_obj': ['concat'],
    //     'concat': ['ifelse'],
    //     'ifelse': ['ifelse_define'],
    //     'ifelse_define': ['intro_string'],
    //     'intro_string': ['more_array'],
    //     'more_array': ['intro_string_obj'],
    //     'intro_string_obj': ['variable_obj_methods'],
    //     'variable_obj_methods': ['reverse_string'],
    //     'reverse_string': ['recursion-js'],
    //     'recursion-js': []
    // };

    var chapter_load_prom = loadChaptersFromDigraph(chapterDigraph);

    Resource.startChapter = function (chapterName, canvas) {
        for (var i = 0; i < chapters.length; i++) {
            if (chapters[i].name === chapterName) return Resource.buildLevel(levels[chapters[i].startIdx], canvas);
        }
        return null;
    };
    Resource.levelsForChapter = function (chapterName) {
        for (var i = 0; i < chapters.length; i++) {
            if (chapters[i].name === chapterName) {
                if (i + 1 < chapters.length) return [levels.slice(chapters[i].startIdx, chapters[i + 1].startIdx), chapters[i].startIdx];else return [levels.slice(chapters[i].startIdx), chapters[i].startIdx];
            }
        }
        return [];
    };
    Resource.chapterForLevelIdx = function (idx) {
        for (var i = 0; i < chapters.length; i++) {
            if (chapters[i].startIdx <= idx && (!chapters[i + 1] || chapters[i + 1].startIdx > idx)) return chapters[i];
        }
        return null;
    };
    Resource.chaptersWithLanguage = function (lang) {
        return chapters.filter(function (c) {
            return c.language === lang;
        });
    };
    Resource.compileFadeLevels = function () {
        var progression = {};
        for (var i = 0; i < levels.length; i++) {
            var level_desc = levels[i];
            if ('fade' in level_desc) {
                for (var ename in level_desc.fade) {
                    var o = {
                        level_idx: i,
                        fade_level: level_desc.fade[ename]
                    };
                    if (ename in progression) progression[ename].push(o);else progression[ename] = [o];
                }
            }
        }
        ExprManager.clearFadeLevels();
        ExprManager.setFadeLevelMap(progression);
    };
    Resource.buildLevel = function (level_desc, canvas, priorStateGraph) {
        Resource.compileFadeLevels();

        // if ('fade' in level_desc) {
        //     for (let key in level_desc.fade) {
        //         ExprManager.setFadeLevel(key, level_desc.fade[key]);
        //     }
        // }

        if (!level_desc["globals"]) {
            level_desc.globals = {};
        }

        var fadedBorders = ExprManager.fadeBordersAt(level_idx);
        if (fadedBorders.length > 0 && (!('showFade' in level_desc) || level_desc.showFade === true)) {
            var _ret = function () {

                ExprManager.fadesAtBorder = false;
                console.log('Making unfaded level...');
                var unfaded = Level.make(level_desc).build(canvas);
                ExprManager.fadesAtBorder = true;
                console.log('Making faded level...');
                var faded = Level.make(level_desc).build(canvas, priorStateGraph);

                var unfaded_exprs = unfaded.nodes;
                var faded_exprs = faded.nodes;

                if (unfaded_exprs.length !== faded_exprs.length) {
                    console.error('Cannot execute fade animation at fade border: Node arrays of unequal length.');
                    return {
                        v: faded
                    };
                }

                unfaded.invalidate();
                faded.validate();

                // Don't add roots that have already been processed. When
                // fading things that are nested, we can get confused
                // (causing us to hit the error condition below) because
                // we will try and fade a root twice.
                var already_faded = [];

                var sparkleTriggers = [];
                var triggerFired = false;

                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = fadedBorders[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var border = _step3.value;


                        var unfaded_roots = unfaded.getRootNodesThatIncludeClass(border.unfadedClass).filter(function (x) {
                            return already_faded.indexOf(x) === -1;
                        });
                        var faded_roots = faded.getRootNodesThatIncludeClass(border.fadedClass).filter(function (x) {
                            return already_faded.indexOf(x) === -1;
                        });

                        if (unfaded_roots.length !== faded_roots.length) {
                            console.error('Cannot fade border ', border, ': Different # of root expressions.', unfaded_roots, faded_roots, unfaded.nodes, faded.nodes);
                            continue;
                        }

                        var _loop = function _loop(r) {
                            var unfaded_root = unfaded_roots[r];
                            var root = faded_roots[r];

                            already_faded.push(unfaded_root);
                            already_faded.push(root);

                            // DEBUG: This only works for level 50!
                            if (unfaded.uiGoalNodes.indexOf(unfaded_root) > -1) {
                                unfaded_root = unfaded_root.children[0];
                                root = root.children[0];
                            }

                            if (unfaded_root.fadingOut) {
                                //    console.log('sdasdads');
                                return 'continue';
                            }

                            if (ExprManager.isExcludedFromFadingAnimation(unfaded_root)) {
                                faded.remove(unfaded_root);
                                root.opacity = 1;
                                return 'continue';
                            }

                            unfaded_root.fadingOut = true;
                            unfaded_root.opacity = 1.0;
                            unfaded_root._stage = null;
                            unfaded_root.pos = root.pos;
                            faded.add(unfaded_root);
                            root.opacity = 0;

                            var afterSparkle = function afterSparkle() {

                                Logger.log('faded-expr', { 'expr': unfaded_root.toString(), 'state': faded.toString() });
                                Resource.play('mutate');

                                Animate.tween(root, { 'opacity': 1.0 }, 2000).after(function () {
                                    var inGoal = root.stage && root.stage.goalNodes.indexOf(root) > -1;
                                    if (inGoal) {
                                        root.lockInteraction();
                                    } else {
                                        root.ignoreEvents = false;
                                    }
                                });
                                Animate.tween(unfaded_root, { 'opacity': 0.0 }, 1000).after(function () {
                                    faded.remove(unfaded_root);
                                });

                                // Fire all remaining triggers.
                                if (!triggerFired) {
                                    triggerFired = true;
                                    sparkleTriggers.forEach(function (trigger) {
                                        trigger();
                                    });
                                }
                            };
                            Animate.wait(500).after(function () {
                                var cancelCb = SparkleTrigger.run(unfaded_root, afterSparkle);
                                sparkleTriggers.push(cancelCb);
                            });

                            // Cross-fade old expression to new.
                            root.ignoreEvents = true;
                            unfaded_root.ignoreEvents = true;

                            /*Animate.tween(root, { 'opacity':1.0 }, 3000).after(() => {
                                root.ignoreEvents = false;
                            });
                            Animate.tween(unfaded_root, { 'opacity':0.0 }, 2000).after(() => {
                                faded.remove(unfaded_root);
                            });*/
                        };

                        for (var r = 0; r < faded_roots.length; r++) {
                            var _ret2 = _loop(r);

                            if (_ret2 === 'continue') continue;
                        }
                    }
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

                return {
                    v: faded
                };
            }();

            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        } else {
            return Level.make(level_desc).build(canvas, priorStateGraph);
        }
    };
    Resource.level = levels;
    Resource.getChapters = function () {
        if (chapter_load_prom) return chapter_load_prom.then(function () {
            chapter_load_prom = null;
            return new Promise(function (resolve, reject) {
                resolve(chapters.slice());
            });
        });else return new Promise(function (resolve, reject) {
            resolve(chapters.slice());
        });
    };
    Resource.getChapter = function (name) {
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
            for (var _iterator4 = chapters[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var c = _step4.value;

                if (c.name === name) return c;
            }
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

        return undefined;
    };
    Resource.getChapterGraph = function () {
        if (chapter_load_prom) return chapter_load_prom.then(function () {
            chapter_load_prom = null;
            return new Promise(function (resolve, reject) {
                resolve({
                    chapters: chapters.slice(),
                    transitions: digraph.transitions,
                    dependencies: digraph.dependencies
                });
            });
        });else return new Promise(function (resolve, reject) {
            resolve({
                chapters: chapters.slice(),
                transitions: digraph.transitions,
                dependencies: digraph.dependencies
            });
        });
    };

    Resource.isLevelStartOfChapter = function (idx) {
        var chap = Resource.chapterForLevelIdx(idx);
        return chap != null && chap.startIdx === idx;
    };

    Resource.isChapterUnlocked = function (idx) {
        return ProgressManager.isLevelUnlocked(chapters[idx].startIdx);
        // for (let depIdx of Object.keys(digraph.dependencies[idx])) {
        //     if (!ProgressManager.isLevelUnlocked(chapters[depIdx].endIdx)) {
        //         return false;
        //     }
        // }
        // return true;
    };
}