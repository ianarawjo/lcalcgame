// A 'functional' wrapper to replication,
// for replacing x => xx and x => xxx.
class GiveExpr extends Expression {
    constructor(numExpr, exprToReplicate) {
        const txt = new TextExpr('give');
        const txtof = new TextExpr('of');
        super( [txt, numExpr, txtof, exprToReplicate] );
        this.padding = {
            left: 14,
            inner: 12,
            right: 14
        };

        // this.color = 'Plum';
        // this.reducableStrokeColor = 'Magenta';
        this.color = 'YellowGreen';
    }
    get exprToReplicate() {
        return this.holes[3];
    }
    get numExpr() {
        return this.holes[1];
    }
    get amountToGive() {
        if (this.numExpr.isPlaceholder())
            return -1;
        else if (this.numExpr instanceof NumberExpr) {
            const amount = this.numExpr.value();
            if (amount >= 0)
                return amount;
            else
                return -1;
        } else {
            console.warn('Cannot get amount.\n\
                First try reducing the number expr;\ it\'s a ',
                this.numExpr.constructor.name, ' type.');
            return -1;
        }
    }
    canReduce() {
        return this.amountToGive > -1 && !this.exprToReplicate.isPlaceholder() && !(this.hasTextbox() || this.hasPlaceholder());
    }
    reduce() {
        if (!this.canReduce()) return this;

        const n = this.amountToGive;
        if (n > 0) {
            let expr = this.exprToReplicate;
            let a = new Array(n);
            for (let i = 0; i < n; i++)
                a[i] = expr.clone();
            return a;
        }
        else return [];
    }
    onmouseclick() {
        this.performUserReduction();
    }
    performReduction(animated=true, logChangeData=null) {

        if (this.hasTextbox() || this.hasPlaceholder()) {
            this.animatePlaceholderChildren();
            Promise.reject("Has placeholder");
        }

        const reduced_exprs = this.reduce();
        if (reduced_exprs != this) {

            const swap = () => {
                if (!this.stage) return Promise.reject();

                const stage = this.stage;

                // Layout the reduced exprs horizontally:
                const pos = this.upperLeftPos();
                const padding = 4;
                const give_sz = this.absoluteSize;
                const full_w = reduced_exprs.reduce((acc, e) => e.absoluteSize.w + padding + acc, 0);
                let x = pos.x; let y = pos.y;
                reduced_exprs.forEach((e) => {
                    e.pos = { x:x + (give_sz.w - full_w) / 2.0, y:y + (give_sz.h - e.absoluteSize.h) / 2.0 };
                    e.anchor = { x:0, y:0 };
                    e.shadowOffset = 4;
                    e.scale = { x:1, y:1 };
                    x += e.absoluteSize.w + padding;
                });

                // Before performing the reduction, save the state of the board...
                stage.saveState();

                // Log this reduction:
                const js = this.toJavaScript();
                const reduced_js = reduced_exprs.map(e => e.toJavaScript()).join('; ');
                Logger.log('give-replication', { 'before':js, 'after':reduced_js });
                if (logChangeData === null)
                    logChangeData = { name: 'give-replication',
                                    before: js,
                                     after: reduced_js };

                // Remove this and replace with replicated expressions.
                const parent = this.parent || stage;
                parent.remove(this);
                reduced_exprs.forEach((e) => {
                    stage.add(e);
                    e.lockSubexpressions();
                });

                // Call update() on the new exprs.
                stage.update();

                // After performing the reduction, save the new state of the board.
                stage.saveState(logChangeData);

                return Promise.resolve();
            };

            if (animated)
                return new Promise((resolve, _reject) => {
                    var shatter = new ShatterExpressionEffect(this);
                    shatter.run(stage, (() => {
                        this.ignoreEvents = false;
                        resolve();
                    }).bind(this));
                    this.ignoreEvents = true;
                }).then(swap);
            else
                return swap();
        }
        return Promise.reject("Cannot reduce!");
    }

    // The value (if any) this expression represents.
    value() { return undefined; }
    toString() {
        let s = '(';
        for (let i = 0; i < this.holes.length; i++) {
            if (i > 0) s += ' ';
            s += this.holes[i].toString();
        }
        return s + ')';
    }
    toJavaScript() {
        return `give(${this.numExpr.toJavaScript()}, ${this.exprToReplicate.toJavaScript()})`;
    }
}
