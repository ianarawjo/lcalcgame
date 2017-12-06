// A boolean compare function like ==, !=, >, >=, <=, <.
class CompareExpr extends Expression {
    static operatorMap() {
        return { '==':'is', '!=':'is not', '>':'>', '<':'<' };
    }
    static textForFuncName(fname) {
        var map = CompareExpr.operatorMap();
        if (fname in map) return map[fname];
        else              return fname;
    }
    constructor(b1, b2, compareFuncName='==') {
        var compare_text = new TextExpr(CompareExpr.textForFuncName(compareFuncName));
        compare_text.color = 'black';
        super([b1, compare_text, b2]);
        this.funcName = compareFuncName;
        this.color = "HotPink";
        this._origColor = "HotPink";
        this.reducableStrokeColor = "DeepPink";
        this.padding = { left:20, inner:10, right:30 };
    }
    get constructorArgs() { return [this.holes[0].clone(), this.holes[2].clone(), this.funcName]; }
    get leftExpr() { return this.holes[0]; }
    get operatorExpr() { return this.holes[1]; }
    set operatorExpr(e) { this.holes[1] = e; }
    get rightExpr() { return this.holes[2]; }
    onmouseclick(pos) {
        console.log('Expressions are equal: ', this.compare());
        this.performUserReduction();
    }

    update() {
        super.update();
        if (this.rightExpr instanceof BooleanPrimitive || this.rightExpr instanceof CompareExpr)
            this.rightExpr.color = '#ff99d1';
        if (this.leftExpr instanceof BooleanPrimitive || this.leftExpr instanceof CompareExpr)
            this.leftExpr.color = '#ff99d1';
    }

    reduce() {
        var cmp = this.compare();
        if (cmp === true)       return new (ExprManager.getClass('true'))();
        else if (cmp === false) return new (ExprManager.getClass('false'))();
        else if (this.funcName === "+" || this.funcName === "=") return true;
        else                    return this;
    }

    canReduce() {
        // Allow comparisons with lambdas.
        return this.leftExpr && this.rightExpr &&
            (this.operatorExpr.canReduce() || this.operatorExpr instanceof OpLiteral) &&
            (this.leftExpr.canReduce() || this.leftExpr.isValue() ||
             this.leftExpr instanceof LambdaExpr) &&
            (this.rightExpr.canReduce() || this.rightExpr.isValue()) ||
            this.rightExpr instanceof LambdaExpr;
    }

    performReduction(animated=true) {
        if (this.operatorExpr instanceof OpLiteral) {
            const op = this.operatorExpr.toString();
            const locked = this.locked;
            const _swap = (expr) => {
                const parent = this.parent || this.stage;
                if (locked) expr.lock();
                parent.swap(this, expr);
                expr.lockSubexpressions();
            };
            if (op === '=') {
                const assign = new (ExprManager.getClass('assign'))(this.leftExpr.clone(), this.rightExpr.clone());
                _swap(assign);
                return assign.performReduction();
            }
            else if (op === '+') {
                const add = new (ExprManager.getClass('+'))(this.leftExpr.clone(), this.rightExpr.clone());
                _swap(add);
                return add.performReduction();
            }
            else {
                this.operatorExpr = new TextExpr(op);
                this.funcName = op;
                this.lockSubexpressions();
            }
        }
        else if (this.operatorExpr instanceof TypeInTextExpr && !this.operatorExpr.isCommitted()) {
            this.operatorExpr.typeBox.carriageReturn();
        }

        if (this.leftExpr && this.rightExpr && !(this.leftExpr.isValue() && this.rightExpr.isValue())) {
            let animations = [];
            let genSubreduceAnimation = (expr) => {
                let before = expr;
                return this.performSubReduction(expr, true).then((result) => {
                    if (result != before)
                        return Promise.resolve();
                    else
                        return Promise.reject("@ CompareExpr.performReduction: Subexpression did not reduce!");
                });
            };
            if (!this.leftExpr.isValue() && !(this.leftExpr instanceof LambdaExpr))
                animations.push(genSubreduceAnimation(this.leftExpr));
            if (!this.rightExpr.isValue() && !(this.rightExpr instanceof LambdaExpr))
                animations.push(genSubreduceAnimation(this.rightExpr));
            return Promise.all(animations).then(() => {
                if (this.reduce() != this) {
                    return after(500).then(() => this.performReduction(animated));
                }
                return Promise.reject("@ CompareExpr.performReduction: Subexpressions did not reduce!");
            });
        }
        if (this.reduce() != this) {
            if (animated) {
                return new Promise((resolve, _reject) => {
                    var shatter = new ShatterExpressionEffect(this);
                    shatter.run(stage, (() => {
                        this.ignoreEvents = false;
                        resolve(super.performReduction());
                    }).bind(this));
                    this.ignoreEvents = true;
                });
            }
            else super.performReduction();
        }
        return Promise.reject("Cannot reduce!");
    }
    compare() {
        if (this.operatorExpr instanceof OpLiteral) {
            this.funcName = this.operatorExpr.toString();
        } else if (!this.operatorExpr.canReduce())
            return undefined;

        if (this.funcName === '==') {
            if (!this.rightExpr || !this.leftExpr) return undefined;

            var lval = this.leftExpr instanceof LambdaExpr ?
                this.leftExpr.toString() : this.leftExpr.value();
            var rval = this.rightExpr instanceof LambdaExpr ?
                this.rightExpr.toString() : this.rightExpr.value();

            // Variables that are equal reduce to TRUE, regardless of whether they are bound!!
            if (!lval && !rval && this.leftExpr instanceof LambdaVarExpr && this.rightExpr instanceof LambdaVarExpr)
                return this.leftExpr.name === this.rightExpr.name;

            //console.log('leftexpr', this.leftExpr.constructor.name, this.leftExpr instanceof LambdaVarExpr, lval);
            //console.log('rightexpr', this.rightExpr.constructor.name, rval);

            if (lval === undefined || rval === undefined)
                return undefined;
            else if (Array.isArray(lval) && Array.isArray(rval))
                return setCompare(lval, rval, (e, f) => (e.toString() === f.toString()));
            else
                return lval === rval;
        } else if (this.funcName === '!=') {
            return this.leftExpr.value() !== this.rightExpr.value();
        } else if (this.funcName === 'and' || this.funcName === 'or' || this.funcName === 'and not' || this.funcName === 'or not') {
            if (!this.rightExpr || !this.leftExpr) return undefined;

            var lval = this.leftExpr.value();
            var rval = this.rightExpr.value();

            if (lval === undefined || rval === undefined)
                return undefined;

            //console.log('leftexpr', this.leftExpr.constructor.name, this.leftExpr instanceof LambdaVarExpr, lval);
            //console.log('rightexpr', this.rightExpr.constructor.name, rval);

            if (this.funcName === 'and')
                return (lval === true) && (rval === true);
            else if (this.funcName === 'and not')
                return (lval === true) && !(rval === true);
            else if (this.funcName === 'or')
                return (lval === true) || (rval === true);
            else if (this.funcName === 'or not')
                return (lval === true) || !(rval === true);
            else {
                console.warn('Logical operator "' + this.funcName + '" not implemented.');
                return undefined;
            }
        } else if (this.funcName === '>' || this.funcName === '<') {

            if (!this.rightExpr || !this.leftExpr) return undefined;

            var lval = this.leftExpr.value();
            var rval = this.rightExpr.value();

            if (lval === undefined || rval === undefined)
                return undefined;
            else if (typeof lval !== 'number' || typeof rval !== 'number') {
                console.warn('Operand for ' + this.funcName + ' does not reduce to a number value.', lval, rval);
                return undefined;
            }
            else if (this.funcName === '>')
                return lval > rval;
            else if (this.funcName === '<')
                return lval < rval;
        } else {
            //console.warn('Compare function "' + this.funcName + '" not implemented.');
            return undefined;
        }
    }

    drawInternal(ctx, pos, boundingSize) {
        ctx.fillStyle = 'black';
        setStrokeStyle(ctx, this.stroke);
        if (this.shadowOffset !== 0)
            this.drawBaseShape( ctx, {x:pos.x, y:pos.y+this.shadowOffset}, boundingSize );
        ctx.fillStyle = this.color;
        this.drawBaseShape(ctx, pos, boundingSize);
    }
    drawBaseShape(ctx, pos, boundingSize) {
        hexaRect( ctx,
                  pos.x, pos.y,
                  boundingSize.w, boundingSize.h,
                  true, this.stroke ? true : false,
                  this.stroke ? this.stroke.opacity : null);
    }

    detach() {
        super.detach();
        this.color = this._origColor;
    }

    toString() {
        return (this.locked ? '/' : '') + '(' + this.funcName + ' ' + this.leftExpr.toString() + ' ' + this.rightExpr.toString() + ')';
    }
    toJavaScript() {
        const js_forms = {
            '==':'a == b',
            '!=':'a != b',
            'and':'a && b',
            'or':'a || b',
            'or not':'a || !b',
            'and not':'a && !b',
            '>':'a > b',
            '<':'a < b',
            '>=':'a >= b',
            '<=':'a <= b',
            '>>>':'a >>> b', // typing operator...
            '>>':'a >> b', // missing op expr
            '+':'a + b'
        };
        let opName = this.funcName;
        if (this.operatorExpr instanceof MissingOpExpression)
            opName = '>>';
        else if (this.operatorExpr instanceof TypeInTextExpr)
            opName = '>>>';
        else if (this.operatorExpr instanceof OpLiteral)
            opName = this.operatorExpr.toString();

        if (opName in js_forms) {
            let template = js_forms[opName];
            const inner_exprs = { 'a':this.leftExpr.toJavaScript(), 'b':this.rightExpr.toJavaScript() };
            const isString = x => ((x.match(/\'/g) || []).length === 2 && x.indexOf("'") === 0 && (x.lastIndexOf("'") === (x.length-1)));
            let final_expr = template.replace(/a|b/g, (match) => {
                // Replaces a with leftExpr and b with rightExpr,
                // adding parentheses if necessary.
                let s = inner_exprs[match];
                if (!isString(s) && /\s/g.test(s)) // if this value isn't a string and it has whitespace, we need to wrap it in parentheses...
                    return '(' + s + ')';
                else
                    return s;
            });
            return final_expr;
        } else {
            console.error('@ CompareExpr.toJavaScript: Operator name ' + this.funcName + ' not in mappings.');
            return '__ERROR()';
        }
    }
}

/** Faded compare variants. */
class FadedCompareExpr extends CompareExpr {
    constructor(b1, b2, compareFuncName='==') {
        super(b1, b2, compareFuncName);
        this.holes[1].text = compareFuncName;
    }
}

class GraphicFadedCompareExpr extends FadedCompareExpr {
    constructor(b1, b2, compareFuncName='==') {
        super(b1, b2, compareFuncName);
        this._color = this._origColor = "lightgray";
        this.operatorExpr.color = SyntaxColor.for('operator');
        this.baseShape = 'rounded';
    }
    drawBaseShape(ctx, pos, size) {
        if (this.baseShape === 'hexa')
            super.drawBaseShape(ctx, pos, size);
        else
            roundRect(ctx,
                  pos.x, pos.y,
                  size.w, size.h,
                  this.radius*this.absoluteScale.x, this.color ? true : false, this.stroke ? true : false,
                  this.stroke ? this.stroke.opacity : null,
                  this.notches ? this.notches : null);
    }
}

/* Defines the NOT unary operator, '!' */
class UnaryOpExpr extends Expression {
    constructor(b, unaryOpName='not') {
        var compare_text = new TextExpr(unaryOpName);
        compare_text.color = 'black';
        super([compare_text, b]);
        this.funcName = unaryOpName;
        this.color = "HotPink";
        this.padding = { left:20, inner:10, right:30 };
    }
    get constructorArgs() { return [this.rightExpr.clone(), this.funcName]; }
    get operatorExpr() { return this.holes[0]; }
    get rightExpr() { return this.holes[1]; }
    onmouseclick(pos) {
        if (!this._animating) {
            this.performReduction();
        }
    }

    update() {
        super.update();
        if (this.rightExpr instanceof BooleanPrimitive || this.rightExpr instanceof CompareExpr)
            this.rightExpr.color = '#ff99d1';
    }

    reduce() {

        if (!this.rightExpr) return this;

        let rval = this.rightExpr.value();
        if (rval === undefined) return this;

        if (rval === true)       return new (ExprManager.getClass('false'))();
        else if (rval === false) return new (ExprManager.getClass('true'))();
        else {
            console.log('@ UnaryOpExpr.reduce: Non-boolean values cannot be negated at this time.');
            return this;
        }
    }

    canReduce() {
        return this.rightExpr && (this.rightExpr.canReduce() || this.rightExpr.isValue());
    }

    performReduction(animated=true) {

        if (this.rightExpr && !this.rightExpr.isValue() && !this._animating) {
            this._animating = true;
            let before = this.rightExpr;
            return this.performSubReduction(this.rightExpr, true).then(() => {
                this._animating = false;
                if (this.rightExpr != before) {
                    return this.performReduction();
                }
            });
        }

        if (this.reduce() != this) {
            if (animated) {
                return new Promise((resolve, _reject) => {
                    var shatter = new ShatterExpressionEffect(this);
                    shatter.run(stage, (() => {
                        this.ignoreEvents = false;
                        resolve(super.performReduction());
                    }).bind(this));
                    this.ignoreEvents = true;
                });
            }
            else super.performReduction();
        }
        return null;
    }

    drawInternal(ctx, pos, boundingSize) {
        ctx.fillStyle = 'black';
        setStrokeStyle(ctx, this.stroke);
        if (this.shadowOffset !== 0) {
            hexaRect( ctx,
                      pos.x, pos.y+this.shadowOffset,
                      boundingSize.w, boundingSize.h,
                      true, this.stroke ? true : false,
                      this.stroke ? this.stroke.opacity : null);
        }
        ctx.fillStyle = this.color;
        hexaRect( ctx,
                  pos.x, pos.y,
                  boundingSize.w, boundingSize.h,
                  true, this.stroke ? true : false,
                  this.stroke ? this.stroke.opacity : null);
    }

    toString() {
        return (this.locked ? '/' : '') + '(' + this.funcName + ' ' + this.rightExpr.toString() + ')';
    }
    toJavaScript() {
        return `!(${this.rightExpr.toJavaScript()})`;
    }
}

class MirrorCompareExpr extends CompareExpr {
    constructor(b1, b2, compareFuncName='==') {
        super(b1, b2, compareFuncName);

        this.children = [];
        this.holes = [];
        this.padding = { left:20, inner:0, right:40 };

        this.addArg(b1);

        // Mirror graphic
        var mirror = new MirrorExpr(0, 0, 86, 86);
        mirror.exprInMirror = b2.clone();
        this.addArg(mirror);

        this.addArg(b2);
    }
    get constructorArgs() { return [this.holes[0].clone(), this.holes[2].clone(), this.funcName]; }
    get leftExpr() { return this.holes[0]; }
    get mirror() { return this.holes[1]; }
    get rightExpr() { return this.holes[2]; }
    expressionToMirror() {
        let isMirrorable = (expr) => (!(!expr || expr instanceof LambdaVarExpr || expr instanceof MissingExpression));
        if (isMirrorable(this.leftExpr))
            return this.leftExpr.clone();
        else if (isMirrorable(this.rightExpr))
            return this.rightExpr.clone();
        else
            return null;
    }
    update() {
        super.update();
        if (this.reduce() != this) {
            this.mirror.exprInMirror = new (ExprManager.getClass('true'))().graphicNode;
            this.mirror.broken = !this.compare();
        } else {
            this.mirror.exprInMirror = this.expressionToMirror();
            this.mirror.broken = false;
        }
    }

    // Animation effects
    performReduction() {
        return new Promise((resolve, reject) => {
            if (!this.isReducing && this.reduce() != this) {
                var stage = this.stage;
                var shatter = new MirrorShatterEffect(this.mirror);
                shatter.run(stage, (() => {
                    this.ignoreEvents = false;
                    resolve(super.performReduction(false));
                }).bind(this));
                this.ignoreEvents = true;
                this.isReducing = true;
            }
            else {
                reject();
            }
        });
    }
}
