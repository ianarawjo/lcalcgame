// Display variants need to not be subclasses to not confuse the fader
class DisplayChest extends Expression {
    constructor(name, expr) {
        super([expr]);
        this.name = name;
        this.childPos = this.origChildPos = { x: 0, y: -20 };

        if (!expr) return;
        this.setExpr(expr);
    }

    open() {}
    close() {}

    setExpr(expr) {
        this.holes[0] = expr;
        expr.ignoreEvents = true;
        expr.anchor = { x: 0.5, y: 0 };
        expr.scale = { x: 0.7, y: 0.7 };
        expr.pos = {
            x: this.childPos.x,
            y: this.childPos.y,
        };
    }

    update() {
        this.children = [];
        this.holes.forEach((expr) => this.addChild(expr));

        this.childPos.x = this.origChildPos.x = this.size.w / 2;

        this.holes[0].update();
    }

    getExpr() {
        return this.holes[0];
    }

    performReduction() {}

    prepareAssign() {
        let target = {
            childPos: {
                x: this.origChildPos.x,
                y: -200,
            },
        };
        return Animate.tween(this, target, 600).after(() => {
            this.childPos = { x: this.origChildPos.x, y: this.origChildPos.y };
        });
    }

    drawInternal(ctx, pos, boundingSize) {
        let size = this._size;
        let scale = this.absoluteScale;
        let offsetX = (boundingSize.w - size.w * scale.x) / 2;
        ctx.drawImage(ChestImages.lidOpen(this.name), pos.x + offsetX, pos.y, size.w * scale.x, size.h * scale.y);
        this.holes[0].pos = {
            x: this.childPos.x,
            y: this.childPos.y,
        };
    }

    drawInternalAfterChildren(ctx, pos, boundingSize) {
        let size = this._size;
        let scale = this.absoluteScale;
        let offsetX = (boundingSize.w - size.w * scale.x) / 2;
        ctx.drawImage(ChestImages.base(this.name), pos.x + offsetX, pos.y, size.w * scale.x, size.h * scale.y);
    }
}

class LabeledDisplayChest extends DisplayChest {
    constructor(name, expr) {
        super(name, expr);
        this.label = new TextExpr(name);
        this.label.color = 'white';
        this.label.scale = { x: 0.8, y: 0.8 };
        this.label.anchor = { x: 0.5, y: 0.7 };
        this.holes.push(this.label);
    }

    update() {
        super.update();
        let expr = this.getExpr();

        this.label.pos = {
            x: this.childPos.x,
            y: this.size.h / 2,
        };
    }

    draw(ctx) {
        if (!ctx) return;
        ctx.save();
        if (this.opacity !== undefined && this.opacity < 1.0) {
            ctx.globalAlpha = this.opacity;
        }
        var boundingSize = this.absoluteSize;
        var upperLeftPos = this.upperLeftPos(this.absolutePos, boundingSize);
        this.drawInternal(ctx, upperLeftPos, boundingSize);
        this.holes[0].parent = this;
        this.holes[0].draw(ctx);
        this.drawInternalAfterChildren(ctx, upperLeftPos, boundingSize);
        this.label.parent = this;
        this.label.draw(ctx);
        ctx.restore();
    }
}

class LabeledDisplay extends Expression {
    constructor(name, expr) {
        super([]);
        this.name = name;
        this.nameLabel = new TextExpr(name);
        this.nameLabel.color = 'black';
        this.equals = new TextExpr("=");
        this.equals.color = 'black';
        this.value = expr;
        this.addArg(this.nameLabel);
        this.addArg(this.equals);
        this.addArg(this.value);
        this.setExpr(expr);
        this.origValue = null;
    }

    open(preview) {
        if (!this.origValue) {
            this.origValue = this.value;
            this.setExpr(preview);
        }
    }

    close() {
        if (this.origValue) {
            this.setExpr(this.origValue);
            this.origValue = null;
        }
    }

    getExpr() {
        if (this.origValue) {
            return this.origValue;
        }
        return this.holes[2];
    }

    setExpr(expr) {
        if (this.holes.length < 3) return;
        expr.pos = { x: 0, y: 0 };
        this.holes[2] = expr;
        expr.scale = { x: 1.0, y: 1.0 };
        expr.anchor = { x: 0, y: 0.5 };
        expr.stroke = null;
        expr.ignoreEvents = true;
        expr.parent = this;
        this.value = expr;
        this.update();
    }

    drawInternal(ctx, pos, boundingSize) {}
}

class SpreadsheetDisplay extends Expression {
    constructor(name, expr) {
        super([]);
        this.name = name;
        this.nameLabel = new TextExpr(name);
        this.nameLabel.color = 'black';
        this.value = expr;
        this.addArg(this.nameLabel);
        this.addArg(this.value);
        this.setExpr(expr);
        this.origValue = null;

        this._fixedSize = { w: 0, h: 0 };
        this.valuePos = 0;
    }

    update() {
        super.update();
        this.holes[1].pos = {
            x: this.valuePos + 10,
            y: this.holes[1].pos.y,
        };
    }

    open(preview) {
        if (!this.origValue) {
            this.origValue = this.value;
            this.setExpr(preview);
        }
    }

    close() {
        if (this.origValue) {
            this.setExpr(this.origValue);
            this.origValue = null;
        }
    }

    getExpr() {
        if (this.origValue) {
            return this.origValue;
        }
        return this.holes[1];
    }

    setExpr(expr) {
        expr.pos = { x: 0, y: 0 };
        this.holes[1] = expr;
        expr.scale = { x: 1.0, y: 1.0 };
        expr.anchor = { x: 0, y: 0.5 };
        expr.stroke = null;
        expr.ignoreEvents = true;
        expr.parent = this;
        this.value = expr;
        this.update();
    }

    drawInternal(ctx, pos, boundingSize) {}
}
