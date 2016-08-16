
// USAGE EXAMPLE: Resource.audio('pop');
var Resource = (() => {

    const __RESOURCE_PATH = 'resources/';
    const __AUDIO_PATH = __RESOURCE_PATH + 'audio/';
    const __GRAPHICS_PATH = __RESOURCE_PATH + 'graphics/';
    const __LEVELS_PATH = __RESOURCE_PATH + 'levels/';
    var audioRsc = {};
    var imageRsc = {};
    var animPresets = {};
    var levels = [];
    var chapters = [];
    var markChapter = (alias, desc, prev_levels) => {
        chapters.push({ name:alias, description:desc, startIdx:prev_levels.length });
    };
    var loadChapterFromFile = (json_filename) => {
        return new Promise(function(resolve, reject) {
            $.getJSON(__LEVELS_PATH + json_filename + '.json', function(json) {
                markChapter(json.chapterName, json.description, levels);
                json.levels.forEach((lvl) => {
                    levels.push([ lvl.board, lvl.goal, lvl.description ]); // TODO: load toolbox
                });
                resolve();
            });
        });
    };
    var loadChaptersFromFiles = (files) => { // Loads all chapters from json files asynchronously.
        // Chain loading promises
        return files.reduce( (prev,curr) => prev.then(() => loadChapterFromFile(curr)), Promise.resolve());
    };
    var loadAudio = (alias, filename) => {
        var audio = new Audio(__AUDIO_PATH + filename);
        audioRsc[alias] = audio;
    };
    var loadImage = (alias, filename) => {
        var img = new Image();
        img.src = __GRAPHICS_PATH + filename;
        img.alt = alias;
        imageRsc[alias] = img;
    };
    var loadImageSequence = (alias, filename, range) => {
        let a = filename.split('.');
        let name = a[0];
        let ext = a[1];
        for (let i = range[0]; i <= range[1]; i++)
            loadImage(alias + i, name + i + '.' + ext);
    };
    var loadAnimation = (imageSeqAlias, range, duration) => {
        try {
            animPresets[imageSeqAlias] = Animation.forImageSequence(imageSeqAlias, range, duration);
        } catch (e) {
            //
        }
    };

    // Add resources here:
    loadAudio('pop', 'pop.wav');
    loadAudio('poof', 'poof.wav');
    loadAudio('bag-spill', 'spill.wav');
    loadAudio('bag-addItem', 'putaway.wav');
    loadAudio('heatup', 'heatup.wav');
    loadAudio('shatter', 'shatter1.wav');
    loadAudio('splosion', 'firework1.wav');
    loadAudio('shootwee', 'firework-shooting.wav');
    loadAudio('victory', '325805__wagna__collect.wav');

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

    // UI Images.
    loadImage('btn-next-default', 'next-button.png');
    loadImage('btn-next-hover', 'next-button-hover.png');
    loadImage('btn-next-down', 'next-button-down.png');
    loadImage('btn-back-default', 'back-button.png');
    loadImage('btn-back-hover', 'back-button-hover.png');
    loadImage('btn-back-down', 'back-button-down.png');
    loadImage('btn-reset-default', 'reset-button.png');
    loadImage('btn-reset-hover', 'reset-button-hover.png');
    loadImage('btn-reset-down', 'reset-button-down.png');
    loadImage('toolbox-bg', 'toolbox-tiled-bg.png');
    loadImage('victory', 'you-win.png');

    // Concreteness faded images.
    loadImage('lambda-hole-x', 'lambda-hole-x.png');
    loadImage('lambda-hole-x-closed', 'lambda-hole-x-closed.png');
    loadImage('lambda-pipe-x', 'lambda-pipe-x-closed.png');
    loadImage('lambda-pipe-x-open', 'lambda-pipe-x-open.png');
    loadImage('lambda-pipe-x-opening0', 'lambda-pipe-x-opening0.png');
    loadImage('lambda-pipe-x-opening1', 'lambda-pipe-x-opening1.png');
    loadImage('lambda-hole-y', 'lambda-hole-y.png');
    loadImage('lambda-hole-y-closed', 'lambda-hole-y-closed.png');
    loadImage('lambda-pipe-y', 'lambda-pipe-y-closed.png');

    // Loads poof0.png, poof1.png, ..., poof4.png (as poof0, poof1, ..., poof4, respectively).
    loadImageSequence('poof', 'poof.png', [0, 4]);

    // Load preset animations from image sequences.
    loadAnimation('poof', [0, 4], 120); // Cloud 'poof' animation for destructor piece.

    // Add levels here: (for now)
    // * The '/' character makes the following expression ignore mouse events (can't be drag n dropped). *
    var chapter_load_prom = loadChaptersFromFiles( ['intro', 'booleans', 'bindings', 'conditionals', 'bags', 'map',     'posttest_v1', 'experimental'] );

/*
    function loadIntroToLambdaCalc(levels) {

        // Introduces concept: Identity.
        levels.push(['(λx #x) (star)', 'star', 'Introduces concept: Identity.']);
        levels.push(['(λx #x) (λx #x) (star) (star)', '(star) (star)', 'Introduces concept: Identity.']);
        levels.push(['(λx #x) (λx #x) (λx #x) (star)', 'star', 'Introduces concept: Identity.']);

        // Introduces concept: Deletion.
        levels.push(['(λx) (diamond) (star)', 'star', 'Introduces concept: Deletion. (FUTURE: This is where we should introduce the TOOLBOX.)']);

        // Furthers Deletion: Can delete multiple items.
        levels.push(['(λx) (λx) (diamond) (diamond) (star)', 'diamond', 'Furthers Deletion: Can delete multiple items. Also introduces objective other than Star.']);
        //levels.push(['(λx) (λx) (λx) (λx) (diamond) (diamond) (diamond) (star) (star)', 'diamond']);

        // Introduces concept: Replication.
        levels.push(['(λx #x #x) (star)', '(star) (star)', 'Introduces concept: Replication.']);
        levels.push(['(λx #x #x) (λx) (star) (diamond)', '(diamond) (diamond)', 'Introduces concept: Replication. Selective.']);

        // Introduces concept: Functions are first-class!
        // > also: Replication of expressions.
        levels.push(['(λx #x #x #x) (λx #x) (star)', 'star', 'Functions are first-class!']); // Only solution is to double the identity.

        // > furthers deletion: Can delete expressions.
        //levels.push(['(λx #x #x) (λx) (star)', 'star', 'furthers deletion: Can delete expressions.']);
        //levels.push(['(λx #x #x) (λx) (star) (diamond) (diamond)', 'diamond', 'furthers deletion: Can duplicate deletion tokens.']);
        levels.push(['(λx #x #x) (λx #x) (λx) (star) (diamond)', '(star) (diamond)', 'furthers deletion: Can delete expressions.']);

        // levels.push(['(λx (λx #x)) (star) (diamond)', 'star']);
        //levels.push(['(λx #x #x #x) (λx (λx #x)) (diamond) (diamond)', '(diamond) (diamond)']);
        levels.push(['(λx #x #x #x) (λx #x #x) (λx #x) (λx) (star) (diamond)', '(star) (star) (star)', 'A harder puzzle using prior concepts.']);
        //levels.push(['(λx #x #x #x) (λx #x #x) (λx #x) (λx) (star) (diamond)', 'star']); // T9* redundant
    }
    function loadIntroToBooleans(levels) {

        // Introduces concept: Reduction; Boolean comparison.
        levels.push(['(== /star /star)', 'true', 'Introduces concept: Reduction; Boolean comparison.']);

        // Introduces concept: Holes.
        levels.push(['(== _ /star) (star)', 'true', 'Introduces concept: Holes.']);
        // > mixes with deletion.
        levels.push(['(== /diamond _) (diamond) (star) (λx)', 'true', 'Introduces concept: Choice of true and false.']);
        // > mixes with replication.
        levels.push(['(star) (== /star _) (λx #x #x)', '(true) (true)', 'Binding on replication (application).']);
        levels.push(['(== /star /diamond)', 'false', 'Introduces false.']);
        levels.push(['(== _ /diamond) (star) (diamond) (λx)', 'false', 'Choice of false.']);
        levels.push(['(== _ _) (star) (diamond)', 'false', 'Introduces concept: More than one free slot.']);
        levels.push(['(== /star _) (λx #x #x) (diamond) (diamond)', '(false) (false)', 'Partial application.']);
        levels.push(['(== _ _) (λx #x #x) (λx #x #x) (star) (diamond)', '(true) (false)', 'Our favorite hard level :)']);
    }
    function loadIntroToConditionals(levels) {

        // -- INTRO TO IF --
        // Introduces concept: Conditional.
        levels.push(['(true) (if _b /star)', 'star', 'intro to if; true']); // T0
        levels.push(['(false) (if _b /star) (rect)', 'rect', 'intro to if; false']);

        // Furthers conditional concept with selective destruction.
        levels.push(['(if /false /star) (if /false _) (star) (rect)', 'rect', 'intro to if; if as selective destruction']); // T1
        levels.push(['(== /star _) (if _b star) (rect) (triangle)', 'star', 'intro to booleans with conditionals']); // this is here bc it's easier than the next two...
        levels.push(['(if _b _) (true) (false) (λx #x #x) (star)', 'star', 'intro to if; selective destruction + replication']); // T2
        levels.push(['(if _b /star) (if _b /triangle) (λx #x #x) (== /star /star) (== /false /true)', 'triangle', 'intro to if; selective destruction extended']); // T3

        // Conditionals + booleans.
        levels.push(['(if _b star) (== /triangle triangle) (== /star star)', 'star', 'counter-intuitive selective destruction']); // T5 (false -> false)
        levels.push(['(== /star _) (if _b /star) (true)', 'true', 'conditionals inside booleans; i.e. ternary operator']); // counter-intuitive

        // Conditions, booleans, and replication.
        levels.push(['(if _b _) (star) (triangle) (triangle) (== _ _) (λx #x #x)', 'star', 'Conditions, booleans, and replication. (Yes, this level is beatable.)']); // T4

        // Conditionals, booleans, and one-param functions.
        levels.push(['(star) (== #x /star) (λx /(if _b /triangle))', 'triangle', 'Conditionals, booleans, and one-param functions.']); // T6

        // Function replication. **Bag-less filter.**
        levels.push(['(star) (star) (diamond) (λx #x #x) (λx /(if (== #x _) #x))', '(star)', '**Loop-less, bag-less filter.**']); // T7

    }
    function loadIntroToMovablePipes(levels) {

        levels.push(['(λx /star) (diamond)', 'star', 'Introduces concept: Constant function.']);
        levels.push(['(λx diamond) (star)', 'star', 'Introduces concept: Constant function; selective.']);
        levels.push(['(λx /diamond) (λx /star)', 'diamond']);
        levels.push(['(λx /diamond) (λx /star) (λx /diamond) (diamond) (λx #x)', 'star']);
        levels.push(['(λx /star) (diamond) (diamond) (λx #x #x)', '(star) (star)']);
        levels.push(['(λx /diamond) (star) (star) (λx #x #x #x) (λx #x)', '(diamond) (star)']);
        levels.push(['(λx star) (diamond) (diamond) (λx #x #x)', '(rect) (rect) (rect)']);
        levels.push(['(λx _) (star) (#_x)', 'star']);
        levels.push(['(λx triangle) (star) (λx) (#_x)', 'star']);
        levels.push(['(λx _) (star) (#_x) (λx)', 'star']);

        // Make the replicator.
        levels.push(['(λx triangle star) (#_x) (#_x) (λx)', '(star) (star)']);

        // // many solutions //
        levels.push(['(λx #x #x #_x) (λx diamond) (star) (λx)', 'star']);

        // HARD: make the replicators + boundless explansion callback
        //levels.push(['(λx #_x #_x diamond) (λx star #x) (#_x) (#_x)', '(diamond) (diamond) (diamond) (star) (star) (star) (star) (star)']);

        levels.push(['(λx star) (== #x #x)', 'true']);
        levels.push(['(λx triangle) (star) (== #x _)', 'false']);

        levels.push(['(λx #x #x) (λx star) (== #x /diamond) (diamond)', '(true) (false)']);

        // Replication of partial lambda functions:
        // AAAAAAAHHHHHHHHHHH!!!!
        levels.push(['(λx #x #x) (λx star) (== #x /triangle)', 'false']);
    }
    function loadIntroToBags(levels) {

        // -- INTRO TO BAGS --
        levels.push(['(bag star) (star) (star)', '(bag star star star)', 'Can put items in a bag.']);
        levels.push(['(bag star star star) (λx) (λx) (λx)', 'star', 'Can spill items out of a bag.']);
        levels.push(['(bag triangle circle star) (λx)', 'star', 'Bags themselves can be destroyed, along with all items in them.']);
        levels.push(['(bag star) (λx) (== /triangle /triangle)', 'star', 'You can put expressions in bags.']);

        // Bag equivalence.
        levels.push(['(bag star star) (star) (== /(bag star star star) _)', 'true', 'You can compare bags (as multisets).']);

        // Conditions + bag-to-primitive comparison + deletion by false.
        levels.push(['(bag star) (== /triangle _) (if _b /star)', 'star', 'Conditionals + bag-to-primitive comparison + deletion with false.']);
    }
    function loadIntroToMap(levels) {

        // -- INTRO TO MAP --
        // Let player watch how it works
        levels.push(['(map /(λx #x) /(bag star star star))', '(star) (star) (star)', 'Identity with map']);
        levels.push(['(map /(λx #x) __) (bag triangle triangle triangle triangle)', '(triangle) (triangle) (triangle) (triangle)', 'Can place bag as initializer']);
        levels.push(['(map /(λx #x #x) __) (bag) (star) (star) (star)', '(star) (star) (star) (star) (star)', 'Replication with map']);
        levels.push(['(map /(λx /(== #x /rect)) __) (bag) (triangle) (rect) (λx)', '(true)', 'Pipes in map can come out of other types of expressions']);

        // Simple transform all expressions into stars.
        levels.push(['(map /(λx /star) __) (bag) (rect) (rect) (rect)', '(star) (star) (star)', 'Basic transform']);

        levels.push(['(map /(λx /triangle) __) (bag) (star) (rect) (circle)', '(star) (triangle) (triangle)', 'Basic transform, selective']);

        // Map + Replication.
        levels.push(['(map /(λx #x #x) __) (bag) (star) (star)', '(star) (star) (star) (star)', 'Duplication']);
        levels.push(['(map /(λx #x #x) __) (bag) (rect) (rect)', '(rect) (rect) (rect)', 'Selective duplication']);
        levels.push(['(map /(λx #x #x #x) __) (bag) (false) (false) (false) (circle) (if _b /rect)', '(circle)', 'Mapping expressions']);

        // Map + Conditional.
        // Keep all items in the bag.
        levels.push(['(map /(λx /(if /true #x)) __) (bag) (star) (star) (star)', '(star) (star) (star)', 'Conditional identity']);

        // Transform all the items into triangles.
        levels.push(['(map /(λx /(if /true _)) __) (bag) (triangle) (star) (circle) (rect)', '(triangle) (triangle) (triangle)', 'Player writes a constant transform.']);
        levels.push(['(map /(λx /(if /true /star)) __) (bag) (triangle) (triangle)', '(triangle) (triangle)', 'The Empty Bag applied to Map reduces to nothing.']);

        // Destroy select items in a bag.
        levels.push(['(map /(λx /(if /false #x)) __) (bag) (star) (rect) (rect) (star) (triangle) (star) (circle) (circle)', '(triangle) (circle) (rect)', 'Selective Destruction']);

        // Baby filter.
        levels.push(['(map /(λx /(if /(== #x _) #x)) __) (bag) (star) (diamond) (diamond) (star) (triangle) (triangle) (circle)', 'star', 'Filter with one line missing. Must understand function in order to win.']);

        // Teaser: Put bags in bags.
        levels.push(['(map /(λx /star) __) (bag star star star star star star) (bag star star star star star) (bag star star) (bag star) (bag star star star star)', 'star', 'Inception.']);

    }
    function loadPosttest(levels) {

        levels.push([ ' (λx _) (star) (#_x)' , '(star)',  'Binding variable and function application' ]);
        levels.push([ '(λx #x #x) (λx #x) (star)' , '(star)',  'Functions are first-class' ]);
        levels.push([ '(== _ /star) (star)' , '(true)',  'Boolean definition' ]);
        levels.push([ '(== /star _) (λx #x #x) (diamond)' , '(false) (false)',  'Applying function to Boolean' ]);
        levels.push([ '(λx /(== _ _))(star)(#_x)(star)' , '(true)',  'Boolean in the function body, binding variable' ]);
        levels.push([ '(== /rect _) (if _b /star) (rect)' , '(star)',  'Boolean in if-else' ]);
        levels.push([ '(λx /(if _b _)) (rect) (true)(#_x)' , '(rect)',  'if-else in function body, binding variable in if else branch' ]);
        levels.push([ '(λx _) (rect)(if _b /star)(== _ /rect)(#_x)' , '(star)',  'if-else in function body, binding variable in Boolean part of If-else' ]);
        levels.push([ '(λx _) (rect)(if _b _)(== _ /rect)(#_x)(#_x)' , '(rect)',  'if-else in function body, binding variable in both Boolean part and the if-else branch' ]);
        levels.push([ '(bag) (star) (λx #x)(== /rect /rect) (if (true) /(triangle))' , '(bag (star) (λx #x)(== /rect /rect) (if (true) /(triangle)))',  'Primitives, Boolean, If-else, Function (all expressions) can be put in the bag(collection)' ]);
        levels.push([ '(bag) (star) (λx #x)(== /(bag star) __) (if _b /(bag star))' , '(bag star)',  'bag can be in the boolean and if-else, a function can apply to a bag' ]);
        levels.push([ '(map /(λx #x #x) __) (bag) (star) (triangle)' , '(star) (star) (triangle) (triangle)',  'maps each item(expressions) of the collection (bag) through a function' ]);
        levels.push([ '(map /(λx _) __) (bag star star star triangle triangle) (== _ /star) (if _b _) (#_x) (#_x)' , '(star)(star)(star)',  'The filter question' ]);

    }

    // VERSION 0.2 LEVELS
    markChapter('Chapter 1', 'Identity, Destruction, and Replication', levels);
    loadIntroToLambdaCalc(levels);
    loadIntroToBooleans(levels);

    // Introduces concept: Boundless expansion.
    levels.push(['(λx #x #x #x) (λx #x #x) (star) (diamond)', '(diamond) (diamond) (diamond) (star) (star) (star) (star) (star)', 'Boundless expansion (from lambda calc).']);

    // CHAPTER 2: MOVING LAMBDA BINDINGS
    markChapter('Chapter 2', 'Constant and One-Parameter Functions', levels);
    loadIntroToMovablePipes(levels);

    // CHAPTER 3: CONDITIONALS AND MAP
    markChapter('Chapter 3', 'Conditionals', levels);
    loadIntroToConditionals(levels);
    markChapter('Chapter 4', 'Intro to Bags', levels);
    loadIntroToBags(levels);
    markChapter('Chapter 5', 'Intro to Map', levels);
    loadIntroToMap(levels);
    markChapter('Post-test', 'Post-test', levels);
    loadPosttest(levels);

    //levels.push(['(== /star _) (if _ /star) (true) (map /(λx _) _) (bag) (star) (#_x)', 'true']);
    //levels.push(['(== /star _) (if _ /1) (1) (1) (1) (1) (1)', 'true']);


    // DEBUG LEVEL(s)
    markChapter('Experimental', 'Experimental', levels);
    levels.push(['(ifelse _b /star /triangle) (true) (pop __) (define (λy (put #y (bag star star)))) (bag star star star)','star']);
    levels.push(['(reduce (λa (λb (reduce (λx (λy (put #y #x))) #a #b))) (reduce (λx (λy (put (bag (star) (star)) #x))) (bag (star) (star) (star)) (bag )) (bag ))', 'star']);

    //levels.push(['(λx #x #x) (λx /(λy #y #x))', 'star']);
    //levels.push(['(map /(λx /star) __) (bag star star star star star star) (bag star star star star star) (bag star star) (bag star) (bag star star star star)', 'star']);

    // Must understand how objects in bags are duplicated after a PUT.
    levels.push(['(reduce /(λx /(λy /(put #y #x))) /(bag dot dot dot) __) (bag) (dot) (dot)', '(bag dot dot dot dot dot)', '"Addition" (union of multisets).']);
    levels.push(['(reduce /(λx /(λy /(== #x _))) (bag star star star) (star)) (star)', 'false', 'Testing boolean chain.']);
    //levels.push(['(reduce /(λx /(λy /(put #y #x))) (bag star star star) (bag)) (star)', 'star', 'test']);

    levels.push(['(put #x __) (map /(λx _) __) (λx) (bag) (bag star star star)', '(bag star star star star)', 'Must understand how PUT returns a bag, and how objects in the initial bag in PUT are duplicated.']);



    // DEBUG
    var json = [];
    levels.forEach((lvl) => {
        json.push({
            "description":lvl[2] ? lvl[2] : "",
            "board":lvl[0],
            "goal":lvl[1],
            "toolbox":""
        });
    });
    console.log(JSON.stringify(json, null, 4));


    //levels.push(['(null) (put _ __) (put _ __) (bag) (star) (diamond) (star) (if _ /star) (circle)', 'star']);
    //levels.push(['(put _ __) (map /(λx _) __) (== #x /star) (bag) (star) (diamond) (star) (if _ /star) (circle)', 'star']);

    // Introduces concept: Functions as goals.
    //levels.push(['(λx #x) (λx) (star)', '(λx #x)']);

    /*levels.push(['(λx #x) (triangle)', 'triangle']);
    levels.push(['(λx #x) (λx #x)', '(λx #x)']);
    levels.push(['(if false /triangle /rect)', 'rect']);
    levels.push(['(if _ circle triangle) (!= /triangle _) (star)', 'star']);
    levels.push(['(if _ /star /circle) (== /triangle _) (rect) (λx λx #x) (triangle)', 'star']);*/

    //levels.push(Level.make('(if _ /rect false) (if _ /star /circle) (== /triangle _) (rect) (triangle)', 'star'));

    return { // TODO: Add more resource types.
        audio:audioRsc,
        image:imageRsc,
        getImage:(name) => imageRsc[name],
        getAudio:(name) => audioRsc[name],
        getAnimation:(name) => animPresets[name].clone(),
        play:(alias, volume) => {
            if(volume) audioRsc[alias].volume = volume;
            else audioRsc[alias].volume = 1.0;
            audioRsc[alias].play();
        },
        buildLevel:(level_desc, canvas) => Level.make(level_desc[0], level_desc[1]).build(canvas),
        level:levels,
        getChapters:() => {
            if (chapter_load_prom) return chapter_load_prom.then(() => {
                chapter_load_prom = null;
                return new Promise(function(resolve, reject) {
                    resolve(chapters.slice());
                });
            });
            else return new Promise(function(resolve, reject) {
                resolve(chapters.slice());
            });
        },
        getChapter:(name) => {
            for (let c of chapters) {
                if (c.name === name) return c;
            }
            return undefined;
        }
    };
})();