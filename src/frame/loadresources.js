function LOAD_REDUCT_RESOURCES(Resource) {
    const __RESOURCE_PATH = Resource.path;
    const __LEVELS_PATH = __RESOURCE_PATH + 'levels/';

    var loadAudio = Resource.loadAudio;
    var loadImage = Resource.loadImage;
    var loadImageSequence = Resource.loadImageSequence;
    var loadAnimation = Resource.loadAnimation;

    var levels = [];
    var chapters = [];
    var markChapter = (json, prev_levels) => {
        var d = { name:json.chapterName, description:json.description, startIdx:prev_levels.length };
        if (json.resources) d.resources = json.resources;
        chapters.push(d);
    };
    var pushChapter = (json) => {
        markChapter(json, levels);
        json.levels.forEach((lvl) => {
            levels.push(lvl);
        });
    };
    var loadChapterFromFile = (json_filename) => {
        return new Promise(function(resolve, reject) {
            $.getJSON(__LEVELS_PATH + json_filename + '.json', function(json) {
                pushChapter(json);
                resolve();
            });
        });
    };
    var loadChaptersFromFiles = (files) => { // Loads all chapters from json files asynchronously.
        // Chain loading promises
        return files.reduce( (prev,curr) => prev.then(() => loadChapterFromFile(curr)), Promise.resolve());
    };

    Resource.markChapter = markChapter;
    Resource.pushChapter = pushChapter;
    Resource.loadChapterFromFile = loadChapterFromFile;
    Resource.loadChaptersFromFiles = loadChaptersFromFiles;

    // Add resources here:
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

    loadImage('bag-background', 'bg-stars.png');
    loadImage('lambda-hole', 'lambda-hole.png');
    loadImage('lambda-hole-opening0', 'lambda-hole-opening1.png');
    loadImage('lambda-hole-opening1', 'lambda-hole-opening2.png');
    loadImage('lambda-hole-closed', 'lambda-hole-closed.png');
    loadImage('lambda-hole-red', 'lambda-hole-white.png');
    loadImage('lambda-hole-red-closed', 'lambda-hole-white-closed.png');
    loadImage('lambda-pipe', 'lambda-pipe-closed.png');
    loadImage('lambda-pipe-open', 'lambda-pipe-open.png');
    loadImage('lambda-pipe-red', 'lambda-pipe-white-closed.png');
    loadImage('lambda-pipe-red-open', 'lambda-pipe-white-open.png');
    loadImage('lambda-pipe-opening0', 'lambda-pipe-opening0.png');
    loadImage('lambda-pipe-opening1', 'lambda-pipe-opening1.png');
    loadImage('null-circle', 'null1.png');
    loadImage('null-circle-highlight', 'null1-highlighted.png');
    loadImage('lock-icon', 'lock-icon.png');
    loadImage('lock-icon-unlocked', 'lock-icon-unlocked.png');
    loadImage('key-icon', 'key-icon.png');
    loadImage('broken-key-icon', 'broken-key-icon.png');
    loadImage('lock-keyhole', 'lock-keyhole.png');
    loadImage('lock-top-locked', 'lock-top-locked.png');
    loadImage('lock-top-unlocked', 'lock-top-unlocked.png');
    loadImage('shinewrap', 'stripeshine-wrap.png');
    loadImage('shinewrap-rightend', 'stripeshine-wrap-rightend.png');
    loadImage('mirror-icon', 'mirror.png');
    loadImage('mirror-icon-broken', 'mirror-broken.png');
    loadImage('mirror-icon-fade-true', 'mirror-fade-true.png');
    loadImage('mirror-icon-fade-false', 'mirror-fade-false.png');
    loadImage('mirror-icon-fade-false-lefthalf', 'mirror-fade-false-lefthalf.png');
    loadImage('mirror-icon-fade-false-righthalf', 'mirror-fade-false-righthalf.png');
    loadImage('funnel', 'funnel.png');
    loadImage('funnel-selected', 'funnel-selected.png');
    loadImage('chest-wood-base', 'chest-wood-base.png');
    loadImage('chest-wood-lid-open', 'chest-wood-lid-open.png');
    loadImage('chest-wood-lid-closed', 'chest-wood-lid-closed.png');
    loadImage('chest-metal-base', 'chest-metal-base.png');
    loadImage('chest-metal-lid-open', 'chest-metal-lid-open.png');
    loadImage('chest-metal-lid-closed', 'chest-metal-lid-closed.png');

    // UI.
    loadImage('btn-next-default', 'next-button.png');
    loadImage('btn-next-hover', 'next-button-hover.png');
    loadImage('btn-next-down', 'next-button-down.png');
    loadImage('btn-back-default', 'back-button.png');
    loadImage('btn-back-hover', 'back-button-hover.png');
    loadImage('btn-back-down', 'back-button-down.png');
    loadImage('btn-reset-default', 'reset-button.png');
    loadImage('btn-reset-hover', 'reset-button-hover.png');
    loadImage('btn-reset-down', 'reset-button-down.png');
    loadImage('btn-mute-default', 'mute-button.png');
    loadImage('btn-mute-hover', 'mute-button-hover.png');
    loadImage('btn-mute-down', 'mute-button-down.png');
    loadImage('btn-unmute-default', 'unmute-button.png');
    loadImage('btn-unmute-hover', 'unmute-button-hover.png');
    loadImage('btn-unmute-down', 'unmute-button-down.png');
    loadImage('toolbox-bg', 'toolbox-tiled-bg.png');
    loadImage('victory', 'you-win.png');

    // Concreteness faded images.
    loadImage('missing-bracket', 'missing-bracket.png');
    loadImage('missing-bracket-selected', 'missing-bracket-selected.png');
    loadImage('lambda-hole-x', 'lambda-hole-x.png');
    loadImage('lambda-hole-x-closed', 'lambda-hole-x-closed.png');
    loadImage('lambda-hole-x-es6', 'lambda-hole-x-es6.png');
    loadImage('lambda-hole-x-closed-es6', 'lambda-hole-x-closed-es6.png');
    loadImage('lambda-pipe-x', 'lambda-pipe-x-closed.png');
    loadImage('lambda-pipe-x-open', 'lambda-pipe-x-open.png');
    loadImage('lambda-pipe-x-opening0', 'lambda-pipe-x-opening0.png');
    loadImage('lambda-pipe-x-opening1', 'lambda-pipe-x-opening1.png');
    loadImage('lambda-hole-y', 'lambda-hole-y.png');
    loadImage('lambda-hole-y-closed', 'lambda-hole-y-closed.png');
    loadImage('lambda-pipe-y', 'lambda-pipe-y-closed.png');
    loadImage('lambda-hole-xside', 'lambda-hole-xside.png');
    loadImage('lambda-hole-xside-closed', 'lambda-hole-xside-closed.png');
    loadImage('lambda-pipe-xside-closed', 'lambda-pipe-xside-closed.png');

    // Main menu
    loadImage('mainmenu-starboy', 'starboy/starboy.png');
    loadImage('mainmenu-starboy-glow', 'starboy/starboy-glowing.png');

    loadImage('planet-variablana', 'starboy/planet_variablana.png');
    loadImage('planet-variablana-locked', 'starboy/planet_variablana-locked.png');
    loadImage('planet-binder', 'starboy/planet_binder.png');
    loadImage('planet-binder-locked', 'starboy/planet_binder-locked.png');
    loadImage('planet-mapa', 'starboy/planet_mapa.png');
    loadImage('planet-mapa-locked', 'starboy/planet_mapa-locked.png');
    loadImage('planet-bagbag', 'starboy/planet_bagbag.png');
    loadImage('planet-conditionabo', 'starboy/planet_conditionabo.png');
    loadImage('planet-boolili', 'starboy/planet_boolili.png');
    loadImage('planet-functiana', 'starboy/planet_functiana.png');
    loadImage('planet-functiana-locked', 'starboy/planet_functiana-locked.png');
    loadImage('planet-glow', 'starboy/planet-glow.png');
    loadImage('planet-bagbag-locked', 'starboy/planet_bagbag-locked.png');
    loadImage('planet-conditionabo-locked', 'starboy/planet_conditionabo-locked.png');
    loadImage('planet-boolili-locked', 'starboy/planet_boolili-locked.png');
    loadAudio('levelspot-activate', 'popin.wav');

    loadImage('ship-small', 'starboy/ship-small.png');
    loadImage('ship-crashed', 'starboy/ship-crashed1.png');
    loadImageSequence('mainmenu-star', 'starboy/stars/star.png', [1, 14]);
    loadAudio('mainmenu-enter', 'sci-fi-engine-startup.wav');

    // Loads poof0.png, poof1.png, ..., poof4.png (as poof0, poof1, ..., poof4, respectively).
    loadImageSequence('poof', 'poof.png', [0, 4]);

    // Load preset animations from image sequences.
    loadAnimation('poof', [0, 4], 120); // Cloud 'poof' animation for destructor piece.

    // Add levels here: (for now)
    var chapter_load_prom = loadChaptersFromFiles( ['intro', 'booleans', 'conditionals', 'bindings', 'bags', 'combination', 'map', 'assign', 'sequence'] );

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
    Resource.buildLevel = (level_desc, canvas) => {
        ExprManager.clearFadeLevels();
        if ('fade' in level_desc) {
            for (let key in level_desc.fade) {
                console.log(key);
                ExprManager.setFadeLevel(key, level_desc.fade[key]);
            }
        }

        if (!level_desc["globals"]) {
            level_desc.globals = {};
        }

        let fadedBorders = ExprManager.fadeBordersAt(level_idx);
        if (fadedBorders.length > 0) {

            ExprManager.fadesAtBorder = false;
            let unfaded = Level.make(level_desc.board, level_desc.goal, level_desc.toolbox, level_desc.globals).build(canvas);
            ExprManager.fadesAtBorder = true;
            let faded = Level.make(level_desc.board, level_desc.goal, level_desc.toolbox, level_desc.globals).build(canvas);

            let unfaded_exprs = unfaded.nodes;
            let faded_exprs   = faded.nodes;

            if (unfaded_exprs.length !== faded_exprs.length) {
                console.error('Cannot execute fade animation at fade border: Node arrays of unequal length.');
                return faded;
            }

            unfaded.invalidate();
            faded.validate();

            for (let border of fadedBorders) {

                let unfaded_roots = unfaded.getRootNodesThatIncludeClass(border.unfadedClass);
                let faded_roots   = faded.getRootNodesThatIncludeClass(border.fadedClass);

                if (unfaded_roots.length !== faded_roots.length) {
                    console.error('Cannot fade border ', border, ': Different # of root expressions.', unfaded_roots, faded_roots);
                    continue;
                }

                for (let r = 0; r < faded_roots.length; r++) {
                    let unfaded_root = unfaded_roots[r];
                    let root = faded_roots[r];

                    // DEBUG: This only works for level 50!
                    if (unfaded.uiGoalNodes.indexOf(unfaded_root) > -1) {
                        unfaded_root = unfaded_root.children[0];
                        root = root.children[0];
                    }

                    if (unfaded_root.fadingOut) {
                    //    console.log('sdasdads');
                        continue;
                    }

                    unfaded_root.fadingOut = true;
                    unfaded_root.opacity = 1.0;
                    unfaded_root._stage = null;
                    unfaded_root.pos = root.pos;
                    faded.add(unfaded_root);
                    root.opacity = 0;

                    if (ExprManager.isExcludedFromFadingAnimation(unfaded_root)) {
                        faded.remove(unfaded_root);
                        root.opacity = 1;
                        continue;
                    }

                    Animate.wait(500).after(() => {
                        SparkleTrigger.run(unfaded_root, () => {

                            Logger.log('faded-expr', { 'expr':unfaded_root.toString(), 'state':faded.toString() } );
                            Resource.play('mutate');

                            Animate.tween(root, { 'opacity':1.0 }, 2000).after(() => {
                                root.ignoreEvents = false;
                            });
                            Animate.tween(unfaded_root, { 'opacity':0.0 }, 1000).after(() => {
                                faded.remove(unfaded_root);
                            });
                        });
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
            return Level.make(level_desc.board, level_desc.goal, level_desc.toolbox, level_desc.globals).build(canvas);
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
}
