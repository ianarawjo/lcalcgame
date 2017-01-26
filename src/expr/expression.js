
/** Foundation of all other expressions in Reduct.
 *	@module expression
 */

const EMPTY_EXPR_WIDTH = 50;
const DEFAULT_EXPR_HEIGHT = 50;
const DEFAULT_CORNER_RAD = 20;
var DEFAULT_RENDER_CTX = null;

/** A generic expression. Could be a lambda expression, could be an if statement, could be a for.
    In general, anything that takes in arguments and can reduce to some other value based on those arguments. */
class Expression extends mag.RoundedRect {
    constructor(holes=[]) {
        super(0, 0, EMPTY_EXPR_WIDTH, DEFAULT_EXPR_HEIGHT, DEFAULT_CORNER_RAD);

        this.holes = holes;
        this.padding = { left:10, inner:10, right:10 };
        this._size = { w:EMPTY_EXPR_WIDTH, h:DEFAULT_EXPR_HEIGHT };
        this.environment = null;
        this._layout = { 'direction': 'horizontal', 'align': 'vertical' };
        this.lockedInteraction = false;

        if (this.holes) {
            var _this = this;
            this.holes.forEach((hole) => {
                _this.addChild(hole);
            });
        }
    }
    equals(otherNode) {
        if (otherNode instanceof Expression && this.holes.length === otherNode.holes.length) {
            if (this.holes.length === 0)
                return this.value === otherNode.value;
            else {
                var b = true;
                for(let i = 0; i < this.holes.length; i++)
                    b &= this.holes[i].value === otherNode[i].value;
                return b;
            }
        }
        return false;
    }
    clone(parent=null) {
        var c = super.clone(parent);
        var children = c.children;
        c.children = [];
        c.holes = [];
        c.stroke = null;
        c.toolbox = null;
        children.forEach((child) => c.addArg(child));
        return c;
    }

    // Makes all inner expressions undraggable, 'binding' them permanently.
    bindSubexpressions() {
        this.holes.forEach((hole) => {
            if (hole instanceof Expression && !(hole instanceof MissingExpression)) {
                if (hole instanceof ValueExpr || hole instanceof BooleanPrimitive)
                    hole.lock();
                hole.bindSubexpressions();
            }
        });
    }

    addArg(arg) {
        this.holes.push(arg);
        this.addChild(arg);
    }

    removeArg(arg) {
        var idx = this.holes.indexOf(arg);
        if (idx > -1) {
            this.holes.splice(idx, 1); // remove 1 elem @ idx
            this.update();
        } else console.error('@ removeArg: Could not find arg ', arg, ' in expression.');
    }

    swap(arg, anotherArg) {
        if (!arg || anotherArg === undefined) return;
        var i = this.holes.indexOf(arg);
        if (i > -1) {

            if (anotherArg === null) {
                arg.detach();
                this.holes[i]._size = { w:50, h:50 };
                arg.stage.remove(arg);
            } else {

                this.holes.splice(i, 1, anotherArg);

                if (anotherArg) {
                    anotherArg.pos = arg.pos;
                    anotherArg.dragging = false;
                    anotherArg.parent = this;
                    anotherArg.scale = { x:0.85, y:0.85 };
                    anotherArg.onmouseleave();
                    anotherArg.onmouseup();
                }

                arg.parent = null;
            }
            this.update();
        }
        else console.log('Cannot swap: Argument ', arg, ' not found in parent.');
    }

    get holeCount() {
        return this.holes ? this.holes.length : 0;
    }

    // Sizes to match its children.
    get size() {
        var padding = this.padding;
        var width = 0;
        var height = DEFAULT_EXPR_HEIGHT;
        var sizes = this.getHoleSizes();
        var scale_x = this.scale.x;

        if (this._layout.direction == "vertical") {
            width = EMPTY_EXPR_WIDTH;
            height = 0;
        }

        if (sizes.length === 0) return { w:this._size.w, h:this._size.h };

        sizes.forEach((s) => {
            if (this._layout.direction == "vertical") {
                height += s.h;
                width = Math.max(width, s.w);
            }
            else {
                height = Math.max(height, s.h);
                width += s.w + padding.inner;
            }
        });

        if (this._layout.direction == "vertical" && this.padding.between) {
            height += this.padding.between * (sizes.length - 1);
        }

        if (this._layout.direction == "vertical") {
            height += 2 * padding.inner;
            width += padding.left + padding.right;
        }
        else {
            width += padding.right; // the end
        }

        return { w:width, h: height };
    }

    getHoleSizes() {
        if (!this.holes || this.holes.length === 0) return [];
        var sizes = [];
        this.holes.forEach((expr) => {
            var size = expr ? expr.size : {w:EMPTY_EXPR_WIDTH, h:DEFAULT_EXPR_HEIGHT};
            size.w *= expr.scale.x;
            size.h *= expr.scale.y;
            sizes.push(size);
        });
        return sizes;
    }

    update() {
        var _this = this;
        this.children = [];

        this.holes.forEach((expr) => _this.addChild(expr));
        // In the centering calculation below, we need this expr's
        // size to be stable. So we first set the scale on our
        // children, then compute our size once to lay out the
        // children.
        this.holes.forEach((expr) => {
            expr.anchor = { x:0, y:0.5 };
            expr.scale = { x:0.85, y:0.85 };
            expr.update();
        });
        var size = this.size;
        var padding = this.padding.inner;
        var x = this.padding.left;
        var y = this.size.h / 2.0 + (this.exprOffsetY ? this.exprOffsetY : 0);
        if (this._layout.direction == "vertical") {
            y = padding;
        }

        this.holes.forEach((expr) => { // Update hole expression positions.
            expr.anchor = { x:0, y:0.5 };
            expr.pos = { x:x, y:y };
            expr.scale = { x:0.85, y:0.85 };
            expr.update();

            if (this._layout.direction == "vertical") {
                y += expr.anchor.y * expr.size.h * expr.scale.y;
                var offset = x;

                // Centering
                if (this._layout.align == "horizontal") {
                    var innerWidth = size.w;
                    var scale = expr.scale.x;
                    offset = (innerWidth - scale * expr.size.w) / 2;
                }

                expr.pos = { x:offset, y:y };

                y += (1 - expr.anchor.y) * expr.size.h * expr.scale.y;
                if (this.padding.between) y += this.padding.between;
            }
            else {
                x += expr.size.w * expr.scale.x + padding;
            }
        });

        this.children = this.holes; // for rendering
    }

    // Apply arguments to expression
    apply(args) {
        // ... //
    }

    // Apply a single argument at specified arg index
    applyAtIndex(idx, arg) {
        // ... //
    }

    // Get the containing environment for this expression
    getEnvironment() {
        if (this.environment) return this.environment;

        if (this.parent) return this.parent.getEnvironment();

        if (this.stage) return this.stage.environment;

        return null;
    }

    // Can this expression step to a value?
    canReduce() {
        return false;
    }

    // Is this expression already a value?
    isValue() {
        return false;
    }

    // Is this expression missing any subexpressions?
    isComplete() {
        for (let child of this.holes) {
            if (child instanceof MissingExpression || (child instanceof Expression && !child.isComplete())) {
                return false;
            }
        }
        return true;
    }

    // Reduce this expression to another.
    // * Returns the newly built expression. Leaves this expression unchanged.
    reduce(options=undefined) {
        return this;
    }

    // Try and reduce the given child expression before continuing with our reduction
    performSubReduction(expr, animated=true) {
        return new Promise((resolve, reject) => {
            let result = expr.performReduction(animated);
            if (result instanceof Promise) {
                result.then((result) => {
                    if (result instanceof Expression) result.lock();

                    window.setTimeout(() => {
                        resolve(result);
                    }, 600);
                });
            }
            else {
                let delay = 250;
                if (!result) {
                    result = expr;
                    delay = 0;
                }
                if (result instanceof Expression && !(result instanceof MissingExpression)) result.lock();
                window.setTimeout(() => {
                    resolve(result);
                }, delay);
            }
        });
    }

    // * Swaps this expression for its reduction (if one exists) in the expression hierarchy.
    performReduction() {
        var reduced_expr = this.reduce();
        if (reduced_expr !== undefined && reduced_expr != this) { // Only swap if reduction returns something > null.

            console.warn('performReduction with ', this, reduced_expr);

            if (!this.stage) return;

            this.stage.saveState();
            Logger.log('state-save', this.stage.toString());

            // Log the reduction.
            let reduced_expr_str;
            if (reduced_expr === null)
                reduced_expr_str = '()';
            else if (Array.isArray(reduced_expr))
                reduced_expr_str = reduced_expr.reduce((prev,curr) => (prev + curr.toString() + ' '), '').trim();
            else reduced_expr_str = reduced_expr.toString();
            Logger.log('reduction', { 'before':this.toString(), 'after':reduced_expr_str });

            var parent = this.parent ? this.parent : this.stage;
            if (reduced_expr) reduced_expr.ignoreEvents = this.ignoreEvents; // the new expression should inherit whatever this expression was capable of as input
            parent.swap(this, reduced_expr);

            // Check if parent expression is now reducable.
            if (reduced_expr && reduced_expr.parent) {
                var try_reduce = reduced_expr.parent.reduceCompletely();
                if (try_reduce != reduced_expr.parent && try_reduce !== null) {
                    Animate.blink(reduced_expr.parent, 400, [0,1,0], 1);
                }
            }

            if (reduced_expr)
                reduced_expr.update();

            return reduced_expr;
        }
    }
    reduceCompletely() { // Try to reduce this expression and its subexpressions as completely as possible.
        var e = this;
        var prev_holes = e.holes;
        if (e.children.length === 0) return e.reduce();
        else {
            e.holes = e.holes.map((hole) => {
                if (hole instanceof Expression)
                    return hole.reduceCompletely();
                else
                    return hole;
            });
            e.children = [];
            e.holes.forEach((hole) => e.addChild(hole));
            var red = e.reduce();
            e.children = [];
            e.holes = prev_holes;
            e.holes.forEach((hole) => e.addChild(hole));
            return red;
        }
    }

    detach() {
        if (this.parent) {
            var ghost_expr;
            if (this.droppedInClass)
                ghost_expr = new this.droppedInClass(this);
            else
                ghost_expr = new MissingExpression(this);

            let stage = this.parent.stage;
            let beforeState = stage.toString();
            let detachedExp = this.toString();
            let parent = this.parent;

            parent.swap(this, ghost_expr);

            this.parent = null;
            stage.add(this);
            stage.bringToFront(this);

            let afterState = stage.toString();
            Logger.log('detached-expr', {'before':beforeState, 'after':afterState, 'item':detachedExp });
            stage.saveState();
            Logger.log('state-save', afterState);

            this.shell = ghost_expr;
        }
        if (this.toolbox) {

            if (this.stage) {
                this.stage.saveState();
                Logger.log('state-save', this.stage.toString());
            }

            this.toolbox.removeExpression(this); // remove this expression from the toolbox
            Logger.log('toolbox-dragout', this.toString());
        }

        if (this.lockedInteraction) {
            this.unlockInteraction();
        }
    }

    lock() {
        this.shadowOffset = 0;
        this.ignoreEvents = true;
        this.locked = true;
    }
    unlock() {
        this.shadowOffset = 2;
        this.ignoreEvents = false;
        this.locked = false;
    }
    lockSubexpressions(filterFunc=null) {
        this.holes.forEach((child) => {
            if (child instanceof Expression) {
                if (!filterFunc || filterFunc(child))
                    child.lock();
                child.lockSubexpressions(filterFunc);
            }
        });
    }
    unlockSubexpressions(filterFunc=null) {
        this.holes.forEach((child) => {
            if (child instanceof Expression) {
                if (!filterFunc || filterFunc(child))
                    child.unlock();
                child.unlockSubexpressions(filterFunc);
            }
        });
    }

    lockInteraction() {
        if (!this.lockedInteraction) {
            this.lockedInteraction = true;
            this._origonmouseclick = this.onmouseclick;
            this.onmouseclick = function(pos) {
                if (this.parent) this.parent.onmouseclick(pos);
            }.bind(this);
            this.holes.forEach((child) => {
                if (child instanceof Expression) {
                    child.lockInteraction();
                }
            });
        }
    }

    unlockInteraction() {
        if (this.lockedInteraction) {
            this.lockedInteraction = false;
            this.onmouseclick = this._origonmouseclick;
            this.holes.forEach((child) => {
                if (child instanceof Expression) {
                    child.unlockInteraction();
                }
            });
        }
    }

    hits(pos, options=undefined) {
        if (this.locked) return this.hitsChild(pos, options);
        else             return super.hits(pos, options);
    }

    onmousedrag(pos) {
        if (this.ignoreEvents) return;

        super.onmousedrag(pos);

        const rightX = pos.x + this.absoluteSize.w;
        //if (rightX < GLOBAL_DEFAULT_SCREENSIZE.width) { // Clipping to edges
            this.pos = pos;
        //} else this.pos = { x:GLOBAL_DEFAULT_SCREENSIZE.width - this.absoluteSize.w, y:pos.y };

        if (!this.dragging) {
            this.detach();
            this.posBeforeDrag = this.absolutePos;
            this.stage.bringToFront(this);
            this.dragging = true;
        }
    }
    onmouseup(pos) {
        if (this.dragging && this.shell) {

            if(!this.parent) this.scale = { x:1, y:1 };
            this.shell = null;

            Logger.log('detach-commit', this.toString());
        }
        if (this.dragging) {
            if (this.toolbox && !this.toolbox.hits(pos)) {
                this.toolbox = null;

                Logger.log('toolbox-remove', this.toString());

                if (this.stage) {
                    this.stage.saveState();
                    Logger.log('state-save', this.stage.toString());
                }
            }

            Logger.log('moved', {'item':this.toString(), 'prevPos':JSON.stringify(this.posBeforeDrag), 'newPos':JSON.stringify(this.pos)});
        }
        //if (this.toolbox) this.toolbox = null;
        this.dragging = false;
    }

    // The value (if any) this expression represents.
    value() { return undefined; }
    toString() {
        if (this.holes.length === 1) return this.holes[0].toString();
        let s = '(';
        for (let i = 0; i < this.holes.length; i++) {
            if (i > 0) s += ' ';
            s += this.holes[i].toString();
        }
        return s + ')';
    }
}
