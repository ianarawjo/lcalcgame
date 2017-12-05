var primitives = [
    { opname:'star', description:'A star.' },
    { opname:'rect', description:'A rectangle.' },
    { opname:'diamond', description:'A rectangle (tilt your head 45 degrees).' },
    { opname:'triangle', description:'A triangle.' },
    { opname:'circle', description:'A circle.' },
    { opname:'true', description:'A primitive boolean representing TRUE.' },
    { opname:'false', description:'A primitive boolean representing FALSE.' },
    { opname:'_', example:'(== _ _) yields a test for equality with both arguments e1 and e2 as empty spaces.', description:'An empty space for an expression.' }
];
var operators = [
    { opname:'if', usage:'(if <condition> <branch>)', example:'(if true star) gives (star).', description:'Basic conditional. Returns nothing if condition evals to FALSE, the branch if condition evals to TRUE.' },
    { opname:'ifelse', usage:'(ifelse <condition> <branch> <else_branch>)', example:'(ifelse false star triangle) gives (triangle).', description:'True conditional. Reduces to else_branch if condition evals to FALSE, the branch if condition evals to TRUE.' },
    { opname:'==', usage:'(== <e1> <e2>)', example:'(== star star) gives (true).', description:'Test for equality between two expressions.' },
    { opname:'!=', usage:'(!= <e1> <e2>)', example:'(!= star star) gives (false).', description:'Negated test for equality between two expressions.' },
    { opname:'map', usage:'(map <oneParamFunc> <iterable>)', example:'(map /(λx /star) __) yields a map with an empty spot for a bag, and a constant function that yields a (star).', description:'Map <func> over all the expressions in <iterable>, return all the mapped expressions.' },
    { opname:'reduce', usage:'(reduce <twoParamFunc> <iterable> <initializer>)', example:'(reduce /(λx /(λx /(== #x /star))) (bag star star star) (star)) yields, basically, star is star is star is star...', description:'Reduce from Python.' },
    { opname:'put', usage:'(put <e> <iterable>)', example:'(put star (bag rect)) gives (bag star rect).', description:'Puts the expression inside the iterable, e.g. a star inside a bag.' },
    { opname:'pop', usage:'(pop <iterable>)', example:'(pop (bag star rect)) gives either a star or a rect.', description:'Pops an item from the iterable. If this is a bag, the item returned is random.' }
];
var iterables = [
    { opname:'bag', usage:'(bag item1 item2 ... itemN)', example:'(bag star rect triangle) spawns a bag with three primitives in it.', description:'An unordered multiset.' },
    { opname:'__', example:'(== __ __) yields a test for equality between two bags and only two bags.', description:'Similar to "_". An empty space that only takes an iterable (or a defined function like put which yields an iterable).' }
];
var lambdas = [
    { opname:'λx', usage:'(λx <e1> ... <eN>)', example:'(λx #x #x) is the replicator.', description:'A hole for a variable definition in a lambda expression.' },
    { opname:'#x', usage:'(#x)', example:'(λx #x) is identity.', description:'A pipe representing a binding to the name "x". You can also use y, z, w, etc.' },
    { opname:'#_x', usage:'(#_x)', example:'(λx #_x) is identity with a movable pipe.', description:'Same as #x except you can move it out of the expression.' },
];

function cleanTags(str) {
    if (!str) return str;
    return str.replace(/\</g,"&lt;").replace(/\>/g,"&gt;");
}

/**
 * A programmatically-generated Gannt chart for the current progression of the game,
 * similar to the progression table presented in our CHI 2017 paper.
 * @param  {[type]} table  A <table> DOM element.
 * @param  {[type]} chapters A sequential list of game chapters, parsed from their JSON descriptions.
 */
function constructGanttChart(table, chapters) {

    // A color object, to color the cells and interpolate between colors.
    let rgb = (r, g, b) => ({ r:r, g:g, b:b });
    let rgbToCSS = (c) => ('rgb(' + Math.round(c.r) + ',' + Math.round(c.g) + ',' + Math.round(c.b) + ')');
    let mixColors = (c1, c2, ratio) => ({ r:(c1.r*(1-ratio)+c2.r*ratio), g:(c1.g*(1-ratio)+c2.g*ratio), b:(c1.b*(1-ratio)+c2.b*ratio) });

    let concepts = {
        'Lambda':{
            'color': rgb(200, 200, 200),
            'matches': [ 'λ', 'lambda', '=>' ]
        },
        'Numbers':{
            'color': rgb(160, 160, 160),
            'matches': [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+' ]
        },
        'Boolean':{
            'color': rgb(255, 105, 180),
            'matches': [ '==', '!=', 'true', 'false' ]
        },
        'Equality':{
            'color': rgb(255, 182, 193),
            'matches': [ '==', '!=' ]
        },
        'Give':{
            'color': rgb(120, 200, 120),
            'matches': [ 'give' ]
        },
        'Typing Verb.': {
            'color': rgb(255,228,181),
            'matches': [],
            'matcher': (lvl) => 'typing_hints' in lvl
        },
        'Typing Free': {
            'color': rgb(255,165,0),
            'matches': [ '_t_', '>>>' ],
            'excluding': (lvl, exprs) => ('typing_hints' in lvl) ||
                         exprs.some(e => /_t_string|_t_fullstring/.test(e))
        },
        'Typing Str.': {
            'color': rgb(255, 239, 0),
            'matches': ['_t_string', '_t_fullstring'],
            'matcher': (lvl, exprs) => ('typing_solution' in lvl) && lvl['typing_solution'].some(e => /.*('.*'|".*").*/.test(e))
        },
        'Conditional':{
            'color': rgb(0, 206, 209),
            'matches': [ 'if', 'ifelse', /([^?]*)\?([^:]*):([^;]*)/ ] // matches the ternary op, thanks https://stackoverflow.com/a/26739863
        },
        'Map':{
            'color': rgb(120, 200, 120),
            'matches': [ 'map' ]
        },
        'L. Operators':{
            'color': rgb(255, 182, 213),
            'matches': [ '&&', '||', '!', ' > ', ' < ' ]
        },
        'Bags':{
            'color': rgb(255, 239, 0),
            'matches': [ 'bag' ]
        },
        'Array Objects':{
            'color': rgb(40, 200, 40),
            'matches': [ 'arrayobj', '[]', '__', "_t_array" ]
        },
        'Object define':{
            'color': rgb(154,205,50),
            'matches': [ 'class' ]
        },
        'Define':{
            'color': rgb(255, 40, 40),
            'matches': [ 'define' ]
        },
        'Variables':{
            'color': rgb(80, 120, 244),
            'matches': [ '$' ]
        },
        'Assignment':{
            'color': rgb(120, 120, 204),
            'matches': [ 'assign' ]
        },
        'Sequences':{
            'color': rgb( 140, 200, 244),
            'matches': [ 'sequence' ]
        },
        'Loops':{
            'color': rgb( 240, 200, 144),
            'matches': [ 'repeat' ]
        },
        'Snappables':{
            'color': rgb(	230,230,250),
            'matches': [ 'snappable' ]
        },
        'Choice Block':{
            'color': rgb( 	216,191,216),
            'matches': [ 'choice' ]
        }
    };

    // Rows are concepts,
    // columns are levels.
    // * A table cell is specified by an object w/ properties { 'text', (OPTIONAL)'color' } *
    //var level_name_cell = { 'text':'Level #' };
    var row_names = [ ]; // we'll take the transpose of this
    Object.keys(concepts).forEach((concept) => row_names.push({
        'text':concept,
        'color':concepts[concept].color
    }));

    const conceptContainsExpr = (concept, e) => {
        for (let match of concept.matches) {
            if (match instanceof RegExp) { // Concepts can be expressed as regex patterns.
                if (match.test(e)) return true;
            }
            else if (typeof e === 'object') {}
            else if (e.indexOf(match) > -1) {
                // We have a match.
                return true;
            }
        }
        return false;
    };
    const levelContainsConcept = (level, concept) => {

        // First, get all the expressions in one place:
        let exprs = [];
        let merge = (e, es) => {
            if (Array.isArray(e))
                return es.concat(e);
            else if (typeof e === 'object')
                return es.concat(Object.keys(e).map((k) => e[k]));
            else
                return es.concat([e]);
        };
        if (level.board) exprs = merge(level.board, exprs);
        if (level.toolbox) exprs = merge(level.toolbox, exprs);
        if (level.goal) exprs = merge(level.goal, exprs);
        if (level.globals) exprs = merge(level.globals, exprs);

        // This info is useful in typing-based
        // levels where it's hard to determine what
        // concepts are needed to solve the problem.
        let typing_verbatim = [];
        let typing_free = [];
        if (level.typing_hints) typing_verbatim = merge(level.typing_hints, typing_verbatim);
        if (level.typing_solution) typing_free = merge(level.typing_solution, typing_free);

        // Now iterate through and check for concept matches:
        let match = false;
        const conceptMatch = (exprs) => {
            for (let e of exprs) {
                if (conceptContainsExpr(concept, e)) {
                    if (!('excluding' in concept) || !concept.excluding(level, exprs)) {
                        // We have a match.
                        return true;
                    }
                }
            }
            if ('matcher' in concept && concept.matcher(level, exprs)) {
                return true;
            }
            return false;
        }
        if (conceptMatch(typing_verbatim)) return 'typed-verbatim';
        if (conceptMatch(typing_free)) return 'typed-free';
        if (conceptMatch(exprs)) return true;

        // No match found!
        return false;
    };

    // Checks whether level contains a given concept,
    // and creates a table cell out of it.
    let toCell = (level, lvl_idx, concept, conceptName) => {
        let url = 'index.html?level=' + lvl_idx;
        let contains = levelContainsConcept(level, concept);
        if (contains !== false) {
            let color = concept.color;

            if (false && conceptName.indexOf('Typing') === -1) {
                if (contains === 'typed-verbatim') // Make typed expressions appear darker in the chart.
                    color = mixColors(color, rgb(100,0,255), 0.25)
                else if (contains === 'typed-free') // Make typed-free expressions appear even darker in the chart.
                    color = mixColors(color, rgb(0,0,255), 0.5)
            }

            if (level.fade && !('showFade' in level && level.showFade === false)) {
                for (let e in level.fade) {
                    if (conceptContainsExpr(concept, e)) {
                        color = rgb(60, 60, 90);
                        break;
                    }
                }
            }
            return { 'text':'', 'color':color, 'url':url };
        } else
            return { 'text':'', 'color':rgb(255, 255, 255), 'url':url };
    };

    // Fill in the table data
    var cells = []; // In format: [ [..row0..], [..row1..], ..., [..rowN..] ]
    var total_num_lvls = Resource.level.length;
    var curr_lvl_count = 0;
    var rows = row_names.map((cell) => ([cell]));
    var heading_row = [ {'text':'', 'border':'none'} ];
    for (let chapter of chapters) {
        let levels = Resource.level.slice(chapter.startIdx, chapter.endIdx+1);
        levels.forEach((level, idx) => {
            for (let row of rows) {
                let concept = concepts[row[0].text];
                row.push( toCell(level, curr_lvl_count + idx, concept, row[0].text) );
            } // for each row, # of cells == # of levels + 1

            if (idx === 0) {
                heading_row.push( {'text':chapter.name, 'width': (chapter.name === 'Defining Objects' ? '40px' : '10px'), 'border':'left'} );
            }
            else heading_row.push( {'text':'', 'border':'none'} );
        });
        curr_lvl_count += levels.length;
    }

    // Create chapter heading row
    rows.splice(0, 0, heading_row);

    // Create DOM table from data
    let setupDOMCell = (DOMcell, cell_desc) => {
        const url = cell_desc.url;
        const clr = 'color' in cell_desc ? cell_desc.color : rgb(255, 255, 255);
        $(DOMcell).css('background-color', rgbToCSS(clr));
        let div = document.createElement('div');
        $(div).text(cell_desc.text);
        if(cell_desc.text.trim().length === 0) {
            $(div).css('width','1px');
            $(div).css('margin','0px');
            $(div).css('padding','0px');
        }
        else if ('width' in cell_desc) $(div).css('width',cell_desc.width);
        else $(div).css('width','100px');
        $(div).css('padding','5px');
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
            } else
                $(DOMcell).css('border-style', cell_desc.border);
        }
        if (url) {
            $(DOMcell).attr('title', 'Level ' + url.replace('index.html?level=', ''));
            $(DOMcell).addClass('cell')
            $(DOMcell).on('click', () => {
                window.open(url, '_blank');
            });
            $(DOMcell).mouseenter(function () {
                let c = rgbToCSS(mixColors(clr, rgb(255,255,255), 0.6));
                $(this).css('background-color', c);
            });
            $(DOMcell).mouseleave(function() {
                $(this).css('background-color', rgbToCSS(clr));
            });
        }
        //$(DOMcell).innerHTML = '<p>' + ('text' in cell_desc ? cell_desc.text : ' ') + '</p>';
        //$(DOMcell).css('width','50px');
        //$(DOMcell).css('height','50px');
    };
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let DOMrow = table.insertRow(i);
        for (let j = 0; j < row.length; j++) {
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

        row = table.insertRow(i+1);
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
        row = table.insertRow(i+2);
        row.insertCell(0).innerHTML = '<a href="' + 'index.html?level=' + (i + startIdx) + '" target="_blank">' + levels[i].board + '</a>';
        row.insertCell(1).innerHTML = levels[i].goal;
        row.insertCell(2).innerHTML = levels[i].toolbox || '';
        row.insertCell(3).innerHTML = levels[i].description || '';
    }
}

function initGantt() {
    Resource.setCurrentLoadSequence('init');
    LOAD_REDUCT_RESOURCES(Resource);
    Resource.afterLoadSequence('init', () => {
        var table_gannt = document.getElementById('gannt');
        Resource.getChapters().then((chapters) => {
            constructGanttChart(table_gannt, chapters);
        });
    });
}

function init() {

    Resource.setCurrentLoadSequence('init');
    LOAD_REDUCT_RESOURCES(Resource);
    Resource.afterLoadSequence('init', () => {

        var table_primitives = document.getElementById('primitives');
        var table_operators  = document.getElementById('operators');
        var table_iterables  = document.getElementById('iterables');
        var table_lambdas    = document.getElementById('lambdas');

        constructTable(table_primitives, primitives);
        constructTable(table_operators, operators);
        constructTable(table_iterables, iterables);
        constructTable(table_lambdas, lambdas);

        var div_levels = document.getElementById('level_tables');
        Resource.getChapters().then((chapters) => {
            var all_levels = Resource.level;

            for (var c = 0; c < chapters.length; c++) {
                var name = chapters[c].name;
                var desc = chapters[c].description;
                var idx = chapters[c].startIdx;
                var next_idx = ((c < chapters.length - 1) ? chapters[c+1].startIdx : all_levels.length);

                var table = document.createElement('table');
                constructLevelsTable(name, desc, table, all_levels.slice(idx, next_idx), idx);
                div_levels.appendChild(table);
                div_levels.appendChild(document.createElement('p'));
            }
        });

    });
}
