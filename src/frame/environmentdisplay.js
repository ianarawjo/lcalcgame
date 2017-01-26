class EnvironmentDisplay extends Expression {
    constructor(x, y, w, h) {
        super([]);
        this._pos = { x: x, y: y };
        this._size = { w: w, h: h };
        this.padding = { left: 0, inner: 20, between: 15, right: 0 };

        this._layout = { direction: "vertical", align: "horizontal" };
        this.bindings = {};
        this._state = 'open';
        this._height = 1.0;
        this._animation = null;
    }

    get pos() {
        return this._pos;
    }

    set pos(pos) {}

    get size() {
        return this._size;
    }

    get _origPos() { return super.pos; }
    get _origSize() { return super.size; }

    updateBinding(name, expr) {
        let display = this.bindings[name];
        if (!display) {
            display = new (ExprManager.getClass('reference_display'))(name, new MissingExpression(new Expression()));
            this.bindings[name] = display;
        }
        display.ignoreEvents = true;
        if (expr) {
            expr = expr.clone();
            expr.scale = { x: 1, y: 1 };
            expr.anchor = { x:0, y:0.5 };
            expr.unlock();
            expr.update();
            display.setExpr(expr);
        }
    }

    getEnvironment() {
        return this.stage.environment;
    }

    updateBindings() {
        if (this.stage) window.stage = this.stage;

        if (!this.stage) return;

        let env = this.getEnvironment();

        for (let name of Object.keys(env.bound)) {
            this.updateBinding(name, env.lookupDirect(name));
        }
        for (let name of env.names()) {
            this.updateBinding(name, env.lookup(name));
        }

        this.holes = this.children = Object.keys(this.bindings).sort().map((name) => this.bindings[name]);
    }

    update() {
        this.updateBindings();
        super.update();
    }

    highlight(name) {
        let display = this.bindings[name];
        if (display) {
            Animate.blink(display.getExpr());
        }
    }

    drawBackground(ctx, pos, boundingSize) {
        ctx.fillStyle = '#FFF8DC';
        ctx.fillRect(pos.x, pos.y, boundingSize.w, boundingSize.h);
    }

    drawInternal(ctx, pos, boundingSize) {
        this.drawBackground(ctx, pos, boundingSize);
    }

    // Show an animation in preparation for updating a binding
    prepareAssign(name) {
        if (this.bindings[name] && this.bindings[name].prepareAssign) {
            return this.bindings[name].prepareAssign();
        }
        return null;
    }

    getBinding(name) {
        return this.bindings[name];
    }
}

class SpreadsheetEnvironmentDisplay extends EnvironmentDisplay {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this._layout = { direction: "vertical", align: "none" };
        this.padding = { left: 0, inner: 0, between: 0, right: 0 };
        this.maxLabelSize = 30;
    }

    updateBindings(env) {
        super.updateBindings(env);

        this.holes = Object.keys(this.bindings).sort().map((name) => this.bindings[name]);
        this.holes.forEach((e) => {
            this.maxLabelSize = Math.max(this.maxLabelSize, e.nameLabel.pos.x + e.nameLabel.size.w);
        });
        this.holes.forEach((e) => {
            e.valuePos = this.maxLabelSize + 5;
        });
    }

    drawInternal(ctx, pos, boundingSize) {
        super.drawInternal(ctx, pos, boundingSize);
        this.drawGrid(ctx);
    }

    drawGrid(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 0.5;

        let y = this.absolutePos.y;
        this.holes.forEach((display) => {
            y = display.absolutePos.y + display.absoluteSize.h / 2;
            ctx.moveTo(display.absolutePos.x, y);
            ctx.lineTo(display.absolutePos.x + this.absoluteSize.w, y);
        });

        let maxY = this.absolutePos.y + this.absoluteSize.h - 42.5;
        while (y < maxY) {
            y += 42.5;
            ctx.moveTo(this.absolutePos.x, Math.floor(y));
            ctx.lineTo(this.absolutePos.x + this.absoluteSize.w, Math.floor(y));
        }

        ctx.moveTo(this.absolutePos.x + this.maxLabelSize, this.absolutePos.y);
        ctx.lineTo(this.absolutePos.x + this.maxLabelSize, this.absolutePos.y + this.absoluteSize.h);
        ctx.stroke();
        ctx.restore();
    }
}
