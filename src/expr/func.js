// Acts as a named wrapper for a def'd expression.
class NamedFuncExpr extends Expression {
    constructor(name, paramNames, ...args) {

        let txt_name;
        let exprs;

        // Special case: Player has to enter name of call.
        if (name === '_t_varname') {
            let typebox = TypeInTextExpr.fromExprCode('_t_varname', (final_txt) => {
                // After the player 'commits' to a valid call name,
                // swap the text-enter field with plain text.
                this.holes[0] = new TextExpr(final_txt + '(');
                this.holes[0].color = 'black';
                this.holes.splice(1, 1); // remove extra open parentheses
                this.name = final_txt;
                this.update();
            });
            txt_name = new TextExpr('');
            exprs = [typebox, txt_name];
        } else {
            txt_name = new TextExpr(name);
            txt_name.color = 'black';
            exprs = [ txt_name ];
        }

        // Special case: Player has to enter params of call.
        if (paramNames === '_t_params') {
            let params_typebox = TypeInTextExpr.fromExprCode('_t_params', (final_txt) => {
                // After the player 'commits' to valid call parameters,
                // swap the text-enter field with plain text.
                let dummy_call = `foo${final_txt}`;
                this.holes[0].text += '(';
                this.holes = [this.holes[0]]; // remove everything but the call name
                let parsedArguments = __PARSER.parse(dummy_call).args;
                console.log(parsedArguments);
                for ( let i = 0; i < parsedArguments.length; i++ ) {
                    if (i > 0) this.holes.push(new TextExpr(','));
                    this.holes.push(parsedArguments[i]);
                }
                this.holes.push(new TextExpr(')'))
                this.update();
            });
            exprs.push(params_typebox);
        } else { // Construct params from provided arguments.
            txt_name.text += '(';
            for ( let i = 0; i < args.length; i++ ) {
                if (i > 0) exprs.push(new TextExpr(','));
                exprs.push(args[i].clone());
            }
            exprs.push(new TextExpr(')'))
        }

        super(exprs);

        this.newArgs = [];
        this.color = 'OrangeRed';
        this.name = name;
        this.paramNames = paramNames;
    }

    canReduce() {

        // First let's check that call is fully defined...
        if (this.hasPlaceholderChildren()) {
            let missing = this.getPlaceholderChildren();
            // If not, attempt to resolve inner typeboxes...
            for (let m of missing) {
                if (m instanceof TypeInTextExpr && m.canReduce())
                    m.reduce();
                // else m.animatePlaceholderStatus();
            }
            return false;
        }
        else if (this.funcExpr && this.funcExpr.hasPlaceholderChildren()) {
            // this.funcExpr.animatePlaceholderChildren();
            return false;
        }
        else return true;
    }

    get expr() {
        return new NamedFuncExpr(this.name, this.paramNames, ...this.args);
    }

    get funcExpr() {
        return this.stage.functions[this.name];
    }
    getJSGlobalDefHeader() {
        let global_funcs = this.stage.functions;
        let js_header = "";
        for (var funcname in global_funcs) {
            if (funcname !== this.name) {
                js_header += global_funcs[funcname].toJavaScript() + '\n';
            }
        }
        return js_header;
    }

    get args() {
        let args = [];
        for (let i = 1; i < this.holes.length-1; i++) {
            if (i % 2 === 1)
                args.push( this.holes[i].clone() );
        }
        return args;
    }
    get constructorArgs() {
        return [ this.name, this.paramNames, ...this.args ];
    }

    onmouseclick() {
        //console.log(this);
        this.performReduction();
    }
    reduce() {
        if (!this.canReduce()) return this;

        let refDefineExpr = Level.getStage().functions[this.name];
        if (refDefineExpr == null)
            return this;

        this._wrapped_ref = refDefineExpr;
        this.scale = refDefineExpr.scale;
        let expr = this.funcExpr.expr.clone();

        for (let it = 1; it < this.holes.length; ++it) {
            this.holes[it] = this.holes[it].reduceCompletely();
        }

        if (!expr || expr instanceof MissingExpression)
            return this;
        else {

            // Blink any unfilled 'holes'
            let incomplete_exprs = mag.Stage.getNodesWithClass(MissingExpression, [], true, [expr]).filter((e) => (!(e instanceof LambdaHoleExpr)));
            if (incomplete_exprs.length > 0) {
                //console.log(incomplete_exprs);
                incomplete_exprs.forEach((e) => Animate.blink(e, 1000, [1,0,0], 2));
                return this;
            }

            // This should 'reduce' by applying the arguments to the wrapped expression.
            // First, let's check that we HAVE arguments...
            var isValidArgument = (a) => a && (a instanceof Expression) && !(a instanceof MissingExpression);
            var validateAll = (arr, testfunc) => arr.reduce((prev, x) => prev && testfunc(x), true);
            let args = this.args;
            if (args.length === 0 || validateAll(args, isValidArgument)) { // true if all args valid

                // All the arguments check out. Now we need to apply them.
                let expr = this.funcExpr;

                /*
                    TODO: Turn body of function into JS code, then execute that
                    and funnel the output into the ES6Parser to return the correct Reduct block:
                 */
                // * We have to be very careful here, in case the program hangs! *
                // eval("while(1) {}");
                this._javaScriptFunction = expr.toJavaScript();
                if (this._javaScriptFunction) {
                    const headers = '__star="star";\n__rect="rect";\n' + this.getJSGlobalDefHeader();
                    let js_code = headers + '(' + this._javaScriptFunction + ")(" +
                          args.map((a) => a.toJavaScript()).join(',') +
                          ");";
                    let geval = eval; // equivalent to calling eval in the global scope
                    let rtn;
                    console.log(args);
                    console.log('Eval\'ing ', js_code);

                    try {
                        rtn = geval(js_code);
                        console.log('Result = ', rtn);
                        if (typeof rtn === "string")
                            expr = ES6Parser.parse('"' + rtn + '"');
                        else
                            expr = ES6Parser.parse(rtn.toString());
                    } catch (e) {
                        if (e instanceof SyntaxError) {
                            console.warn(e.message);
                        }
                        console.log(e);
                        return this; // Abort
                    }
                } else {
                    if (args.length > 0) {
                        expr = expr.expr.clone(); // get inner expression
                        expr = args.reduce((lambdaExpr, arg) => lambdaExpr.applyExpr(arg), expr); // Chains application to inner lambda expressions.
                    }
                }

                Resource.play('define-convert');

                // Disable editing the DefineExpr after its been used once.
                this._wrapped_ref.lockSubexpressions((e) => (!(e instanceof DragPatch)));
                this._wrapped_ref.lock();

                return expr.clone(); // to be safe we'll clone it.
            }
        }

        return this;
    }

    // Whoa... meta.
    toString() {
        let s = '(' + this.name; // e.g. '(length'
        let args = this.args;
        for ( let i = 0; i < args.length; i++ )
            s += ' ' + args[i].toString();
        s += ')';
        return s;
    }
    toJavaScript() {
        let name = this.name;
        let args = this.args.map((x) => x.toJavaScript()).join(', ');
        return `${this.name}(${args})`;
    }
}
