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
    loadMusic('bg1', 'bg-night-owl-loop.mp3');
    loadMusic('bg-menu', 'bg-zabriskie-cylinder-nine.mp3');
}

function LOAD_REDUCT_RESOURCES(Resource) {
    const __RESOURCE_PATH = Resource.path;
    const __LEVELS_PATH = __RESOURCE_PATH + 'levels-hourofcode/';

    // Add levels here:
    const chapterDigraph = {
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
    };

    var loadAudio = Resource.loadAudio;
    var loadImage = Resource.loadImage;
    var loadImageSequence = Resource.loadImageSequence;
    var loadAnimation = Resource.loadAnimation;

    var levels = [];
    var chapters = [];
    let digraph;
    var markChapter = (json, json_filename, prev_levels) => {
        var d = {
            name:json.chapterName,
            description:json.description,
            language:(json.language || "reduct-scheme"),
            startIdx:prev_levels.length,
            endIdx: prev_levels.length + json.levels.length - 1,
            key: json_filename,
        };
        if (json.resources) d.resources = json.resources;
        chapters.push(d);
    };
    var pushChapter = (json, json_filename) => {
        markChapter(json, json_filename, levels);
        var lang = json.language || "reduct-scheme";
        var macros = json.macros;
        json.levels.forEach((lvl) => {
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
    var loadChapterFromFile = (json_filename) => {
        return new Promise(function(resolve, reject) {
            $.getJSON(__LEVELS_PATH + json_filename + '.json', function(json) {

                console.log(json_filename);

                // Copy the planet's aliens to the individual level
                // definitions, so that buildLevel has access to
                // them. Provide a default alien when not specified.
                let aliens = (json.resources && json.resources.aliens) ?
                    json.resources.aliens : ["alien-function-1"];
                for (let level of json.levels) {
                    level.resources = level.resources || {
                        aliens: aliens,
                    };
                }

                pushChapter(json, json_filename);
                resolve();
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.error('getJSON request failed! ' + textStatus + ' @ ' + json_filename, errorThrown);
            });
        });
    };
    var loadChaptersFromFiles = (files) => { // Loads all chapters from json files asynchronously.
        // Chain loading promises
        return files.reduce( (prev,curr) => prev.then(() => loadChapterFromFile(curr)), Promise.resolve());
    };

    const loadChaptersFromDigraph = (definition) => {
        let filenames = Object.keys(definition);
        let load = filenames.reduce( (prev,curr) => prev.then(() => loadChapterFromFile(curr)), Promise.resolve());
        return load.then(() => {
            // Chapters are in the same order as filenames
            for (let i = 0; i < chapters.length; i++) {
                chapters[i].transitions = definition[filenames[i]];
                chapters[i].filename = filenames[i];
            }

            // Construct the dependencies list as well
            let dependencies = {};
            for (let i = 0; i < chapters.length; i++) {
                dependencies[i] = {};
            }
            for (let i = 0; i < chapters.length; i++) {
                let dsts = definition[filenames[i]];
                for (let dst of dsts) {
                    dependencies[filenames.indexOf(dst)][i] = true;
                }
            }

            digraph = {
                chapters: chapters,
                transitions: definition,
                dependencies: dependencies,
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

    let chapter_load_prom = loadChaptersFromDigraph(chapterDigraph);

    Resource.startChapter = (chapterName, canvas) => {
        for (let i = 0; i < chapters.length; i++) {
            if (chapters[i].name === chapterName)
                return Resource.buildLevel(levels[chapters[i].startIdx], canvas);
        }
        return null;
    };
    Resource.levelsForChapter = (chapterName) => {
        for (let i = 0; i < chapters.length; i++) {
            if (chapters[i].name === chapterName) {
                if (i + 1 < chapters.length) return [levels.slice(chapters[i].startIdx, chapters[i+1].startIdx), chapters[i].startIdx];
                else                         return [levels.slice(chapters[i].startIdx), chapters[i].startIdx];
            }
        }
        return [];
    };
    Resource.chapterForLevelIdx = (idx) => {
        for (let i = 0; i < chapters.length; i++) {
            if (chapters[i].startIdx <= idx && (!chapters[i+1] || chapters[i+1].startIdx > idx))
                return chapters[i];
        }
        return null;
    };
    Resource.chaptersWithLanguage = (lang) => {
        return chapters.filter((c) => c.language === lang);
    };
    Resource.compileFadeLevels = () => {
        let progression = {};
        for (let i = 0; i < levels.length; i++) {
            let level_desc = levels[i];
            if ('fade' in level_desc) {
                for (var ename in level_desc.fade) {
                    let o = {
                        level_idx: i,
                        fade_level: level_desc.fade[ename]
                    };
                    if (ename in progression)
                        progression[ename].push(o);
                    else
                        progression[ename] = [ o ];
                }
            }
        }
        ExprManager.clearFadeLevels();
        ExprManager.setFadeLevelMap(progression);
    };
    Resource.buildLevel = (level_desc, canvas, priorStateGraph) => {
        Resource.compileFadeLevels();

        // if ('fade' in level_desc) {
        //     for (let key in level_desc.fade) {
        //         ExprManager.setFadeLevel(key, level_desc.fade[key]);
        //     }
        // }

        if (!level_desc["globals"]) {
            level_desc.globals = {};
        }

        let fadedBorders = ExprManager.fadeBordersAt(level_idx);
        if (fadedBorders.length > 0 && (!('showFade' in level_desc) || level_desc.showFade === true)) {

            ExprManager.fadesAtBorder = false;
            console.log('Making unfaded level...');
            let unfaded = Level.make(level_desc).build(canvas);
            ExprManager.fadesAtBorder = true;
            console.log('Making faded level...');
            let faded = Level.make(level_desc).build(canvas, priorStateGraph);

            let unfaded_exprs = unfaded.nodes;
            let faded_exprs   = faded.nodes;

            if (unfaded_exprs.length !== faded_exprs.length) {
                console.error('Cannot execute fade animation at fade border: Node arrays of unequal length.');
                return faded;
            }

            unfaded.invalidate();
            faded.validate();

            // Don't add roots that have already been processed. When
            // fading things that are nested, we can get confused
            // (causing us to hit the error condition below) because
            // we will try and fade a root twice.
            let already_faded = [];

            let sparkleTriggers = [];
            let triggerFired = false;

            for (let border of fadedBorders) {

                let unfaded_roots = unfaded.getRootNodesThatIncludeClass(border.unfadedClass)
                    .filter((x) => already_faded.indexOf(x) === -1);
                let faded_roots   = faded.getRootNodesThatIncludeClass(border.fadedClass)
                    .filter((x) => already_faded.indexOf(x) === -1);

                if (unfaded_roots.length !== faded_roots.length) {
                    console.error('Cannot fade border ', border, ': Different # of root expressions.', unfaded_roots, faded_roots, unfaded.nodes, faded.nodes);
                    continue;
                }

                for (let r = 0; r < faded_roots.length; r++) {
                    let unfaded_root = unfaded_roots[r];
                    let root = faded_roots[r];

                    already_faded.push(unfaded_root);
                    already_faded.push(root);

                    // DEBUG: This only works for level 50!
                    if (unfaded.uiGoalNodes.indexOf(unfaded_root) > -1) {
                        unfaded_root = unfaded_root.children[0];
                        root = root.children[0];
                    }

                    if (unfaded_root.fadingOut) {
                    //    console.log('sdasdads');
                        continue;
                    }

                    if (ExprManager.isExcludedFromFadingAnimation(unfaded_root)) {
                        faded.remove(unfaded_root);
                        root.opacity = 1;
                        continue;
                    }

                    unfaded_root.fadingOut = true;
                    unfaded_root.opacity = 1.0;
                    unfaded_root._stage = null;
                    unfaded_root.pos = root.pos;
                    faded.add(unfaded_root);
                    root.opacity = 0;

                    const afterSparkle = () => {

                        Logger.log('faded-expr', { 'expr':unfaded_root.toString(), 'state':faded.toString() } );
                        Resource.play('mutate');

                        Animate.tween(root, { 'opacity':1.0 }, 2000).after(() => {
                            const inGoal = root.stage && root.stage.goalNodes.indexOf(root) > -1;
                            if (inGoal) {
                                root.lockInteraction();
                            }
                            else {
                                root.ignoreEvents = false;
                            }
                        });
                        Animate.tween(unfaded_root, { 'opacity':0.0 }, 1000).after(() => {
                            faded.remove(unfaded_root);
                        });

                        // Fire all remaining triggers.
                        if (!triggerFired) {
                            triggerFired = true;
                            sparkleTriggers.forEach((trigger) => {
                                trigger();
                            });
                        }
                    };
                    Animate.wait(500).after(() => {
                        const cancelCb = SparkleTrigger.run(unfaded_root, afterSparkle);
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
                }
            }

            return faded;
        }
        else {
            return Level.make(level_desc).build(canvas, priorStateGraph);
        }
    };
    Resource.level = levels;
    Resource.getChapters = () => {
        if (chapter_load_prom) return chapter_load_prom.then(() => {
            chapter_load_prom = null;
            return new Promise(function(resolve, reject) {
                resolve(chapters.slice());
            });
        });
        else return new Promise(function(resolve, reject) {
            resolve(chapters.slice());
        });
    };
    Resource.getChapter = (name) => {
        for (let c of chapters) {
            if (c.name === name) return c;
        }
        return undefined;
    };
    Resource.getChapterGraph = () => {
        if (chapter_load_prom) return chapter_load_prom.then(() => {
            chapter_load_prom = null;
            return new Promise(function(resolve, reject) {
                resolve({
                    chapters: chapters.slice(),
                    transitions: digraph.transitions,
                    dependencies: digraph.dependencies,
                });
            });
        });
        else return new Promise(function(resolve, reject) {
            resolve({
                chapters: chapters.slice(),
                transitions: digraph.transitions,
                dependencies: digraph.dependencies,
            });
        });
    };

    Resource.isLevelStartOfChapter = (idx) => {
        var chap = Resource.chapterForLevelIdx(idx);
        return chap != null && chap.startIdx === idx;
    };

    Resource.isChapterUnlocked = (idx) => {
        return ProgressManager.isLevelUnlocked(chapters[idx].startIdx);
        // for (let depIdx of Object.keys(digraph.dependencies[idx])) {
        //     if (!ProgressManager.isLevelUnlocked(chapters[depIdx].endIdx)) {
        //         return false;
        //     }
        // }
        // return true;
    };
}
