var ExprManager = (function() {
    let pub = {};

    var _FADE_MAP = {
        'apply':    [ApplyExpr],
        'if':       [LockIfStatement, InlineLockIfStatement, IfStatement],
        'ifelse':   [IfElseStatement],
        'ifelseblock': [IfElseBlockStatement],
        'triangle': [TriangleExpr],//, FadedTriangleExpr, StringTriangleExpr],
        'rect':     [RectExpr],//, FadedRectExpr, StringRectExpr],
        'star':     [StarExpr],//, FadedStarExpr, StringStarExpr],
        'circle':   [CircleExpr],//, FadedCircleExpr, StringCircleExpr],
        'diamond':  [RectExpr],//, FadedRectExpr, StringRectExpr],
        'dynamic_variant':  [DynamicVariantExpr],
        '_':        [MissingExpression],
        '__':       [MissingBracketExpression],
        '_b':       [MissingKeyExpression, MissingBooleanExpression],
        '_t':       [TypeInTextExpr],
        '_n':       [MissingNumberExpression],
        '_l':       [MissingLambdaExpression],
        '_v':       [MissingChestExpression, MissingVariableExpression],
        'true':     [KeyTrueExpr, TrueExpr, GraphicFadedTrueExpr],
        'false':    [KeyFalseExpr, FalseExpr, GraphicFadedFalseExpr],
        'number':   [NumberExpr, FadedNumberExpr],
        'cmp':      [MirrorCompareExpr, FadedCompareExpr],
        '==':       [MirrorCompareExpr, FadedCompareExpr, GraphicFadedCompareExpr],
        '+':        [AddExpr], //[StringAddExpr],
        '-':        [SubtractionExpr],
        '*':        [MultiplicationExpr],
        '%':        [ModuloClockExpr, AnimatedModuloExpr, ModuloExpr],
        '--':       [DivisionExpr],
        '++':       [StringAddExpr],
        '!=':       [MirrorCompareExpr, FadedCompareExpr],
        'and':      [CompareExpr],
        'or':       [CompareExpr],
        '>':        [CompareExpr],
        '<':        [CompareExpr],
        'not':      [UnaryOpExpr],
        'bag':      [BagExpr, BracketArrayExpr],
        'array':    [BracketArrayExpr],
        'count':    [CountExpr],
        'map':      [SimpleMapFunc, FadedMapFunc],
        'reduce':   [ReduceFunc],
        'put':      [PutExpr],
        'pop':      [PopExpr],
        'define':   [DefineExpr, FadedDefineExpr],
        'var':      [LambdaVarExpr, HalfFadedLambdaVarExpr, FadedLambdaVarExpr, FadedLambdaVarExpr, JumpingChestVarExpr, ChestVarExpr, LabeledChestVarExpr, LabeledVarExpr, VtableVarExpr],
        'reference_display':[DisplayChest, LabeledDisplayChest, SpreadsheetDisplay],
        'environment_display':[EnvironmentDisplay, SpreadsheetEnvironmentDisplay],
        'hole':     [LambdaHoleExpr, HalfFadedLambdaHoleExpr, FadedES6LambdaHoleExpr],// DelayedFadedES6LambdaHoleExpr],
        'lambda':   [LambdaHoleExpr, HalfFadedLambdaHoleExpr, FadedES6LambdaHoleExpr],// DelayedFadedES6LambdaHoleExpr],
        'lambda_abstraction':   [LambdaExpr], //EnvironmentLambdaExpr],
        'assign':   [JumpingAssignExpr, AssignExpr, EqualsAssignExpr],
        'sequence': [NotchedSequence, SemicolonNotchedSequence, SemicolonSequence],
        'repeat':   [RepeatLoopExpr, FadedRepeatLoopExpr],
        'choice':   [ChoiceExpr],
        'snappable':[Snappable, FadedSnappable],//, NotchSnappable],
        'level':    [ReductStageExpr],
        'arrayobj': [ArrayObjectExpr],
        'stringobj':[StringObjectExpr],
        'infinite': [InfiniteExpression],
        'notch':    [NotchHangerExpr],
        'namedfunc':[NamedFuncExpr],
        'vargoal':  [VariableGoalDisplay],
        'return':   [ReturnStatement],
        'string':   [StringValueExpr, ColorlessStringValueExpr],
        'typing_str':   [TypeInStringValueExpr, ColorlessTypeInStringValueExpr],
        'typing_array':   [TypeInArrayExpr],
        'give':     [GiveExpr]
    };
    var fade_levels = {};
    var DEFAULT_FADE_LEVEL = 0;

    pub.setFadeLevelMap = (lvls) => {
        fade_levels = lvls;
    };

    const primitives = ['triangle', 'rect', 'star', 'circle', 'diamond'];
    pub.isPrimitive = (str) => {
        return primitives.indexOf(str) > -1;
    };

    // Classes that should not show the 'sparkle' when they are faded.
    const FADE_EXCEPTIONS = [JumpingChestVarExpr, JumpingAssignExpr, EnvironmentDisplay];

    pub.isExcludedFromFadingAnimation = (expr) => {
        for (let klass of FADE_EXCEPTIONS) {
            if (expr instanceof klass) return true;
        }
        return false;
    };

    pub.fadeBordersAt = (lvl) => {
        if (DEFAULT_FADE_LEVEL >= 4) return [];

        let prog = fade_levels;
        let borders = [];
        for (var t in prog) {
            if (t === 'primitives') continue;

            let fade_lvl_obj = prog[t];
            for (let i = 0; i < fade_lvl_obj.length; i++) {
                if (fade_lvl_obj[i].level_idx === lvl)
                    borders.push( [t, pub.getFadeLevel(t, lvl-1), pub.getFadeLevel(t, lvl), true]  );
            }
        }
        return borders.map((b) => ({ 'unfadedClass': _FADE_MAP[b[0]][b[1]],
                                     'fadedClass':   _FADE_MAP[b[0]][b[2]],
                                     'key':          b[0]                   }));
    };
    pub.fadesAtBorder = true;

    pub.hasClass = (ename) => {
        return ename in _FADE_MAP;
    };
    pub.getClass = (ename) => {
        if (ename in _FADE_MAP) {
            return _FADE_MAP[ename][pub.getFadeLevel(ename)];
        } else {
            console.error('Expression type ' + ename + ' is not in the fade map.');
            return undefined;
        }
    };
    pub.getFadeLevel = (ename, lvl) => {
        if (typeof lvl === 'undefined') lvl = level_idx;

        //let is_primitive = primitives.indexOf(ename) > -1;

        if (ename in fade_levels) {

            let lvl_map = fade_levels[ename];
            let cur_level = 0;
            for (let i = 0; i < lvl_map.length; i++) {
                let o = lvl_map[i];
                if (ExprManager.fadesAtBorder === false && o.level_idx < lvl) {
                    cur_level = o.fade_level;
                }
                else if (ExprManager.fadesAtBorder === true && o.level_idx <= lvl) {
                    cur_level = o.fade_level;
                }
            }
            if (DEFAULT_FADE_LEVEL > cur_level)
                return pub.getDefaultFadeLevel(ename);
            else
                return cur_level;
        }
        else return pub.getDefaultFadeLevel(ename);
    };
    pub.getDefaultFadeLevel = (ename) => {
        if (DEFAULT_FADE_LEVEL >= pub.getNumOfFadeLevels(ename))
            return pub.getNumOfFadeLevels(ename) - 1;
        else
            return DEFAULT_FADE_LEVEL;
    };
    pub.getNumOfFadeLevels = (ename) => {
        if (!ename) return;
        else if (!(ename in _FADE_MAP)) {
            console.error('Expression type ' + ename + ' is not in the fade map.');
            return;
        }
        return _FADE_MAP[ename].length;
    };
    pub.setFadeLevel = (ename, index) => {
        if (!ename) return;
        else if (!(ename in _FADE_MAP)) {
            console.error('Expression type ' + ename + ' is not in the fade map.');
            return;
        } else if (pub.getNumOfFadeLevels(ename) >= index) {
            console.warn('Expression type ' + ename + ' has only ' + pub.getNumOfFadeLevels(ename) + ' fade levels. (' + index + 'exceeds)');
            index = pub.getNumOfFadeLevels(ename) - 1; // Set to max fade.
        }
        fade_levels[ename] = index;
    };
    pub.setDefaultFadeLevel = (index) => {
        if (index >= 0) DEFAULT_FADE_LEVEL = index;
    };
    pub.clearFadeLevels = () => {
        fade_levels = {};
    };

    return pub;
})();
