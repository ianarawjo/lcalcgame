// The panel at the bottom of the screen.
class Toolbox extends mag.ImageRect {

    constructor(x, y, w, h, exprs=[]) {
        super(x, y, w, h, 'toolbox-bg');
        this.items = exprs;
        this.padding = 20;
    }

    get leftEdgePos() { return { x:this.padding * 2 + this.pos.x, y:this.size.h / 2.0 + this.pos.y }; }

    // Adds an expression to the toolbox. Animates to new position.
    addExpression(e, animated=true) {

        // Add expression to toolbox.
        let toolbox = this;
        this.items.push(e);
        e.toolbox = this;
        //e.onmousedrag = function (pos) {
        //    super.onmousedrag(pos); // perform whatever the drag event is on this expression
        //    toolbox.removeExpression(e); // remove this expression from the toolbox
        //};

        // Disable the onclick handler so that you can't reduce things
        // in the toolbox
        e._origonmouseclick = e.onmouseclick;
        e.onmouseclick = function() {};

        // Animate new expression to toolbox position.
        this.setLayout(animated);
    }

    // Removes an expression from toolbox.
    removeExpression(e, animated=true) {
        let idx = this.items.indexOf(e);
        if (idx > -1) {
            this.items.splice(idx, 1);
            this.setLayout(animated); // rearrange remaining items
            e.scale = { x: 1, y: 1 };
            // Restore the onclick handler
            e.onmouseclick = e._origonmouseclick;
        }
    }

    // Set expression positions in toolbox.
    setLayout(animated=false) {
        let pos = this.leftEdgePos;
        this.items.forEach((e) => {
            e.update();
            e.anchor = { x:0, y:0.5 };
            if (animated)
                Animate.tween(e, { pos:pos }, 300, (elapsed) => Math.pow(elapsed, 0.5));
            else
                e.pos = pos;
            pos = addPos(pos, { x:e.size.w + this.padding, y:0 } );
        });
    }

    ondropped(node, pos) {

        if (!node.toolbox) {
            // Can't drag nodes onto toolbox that aren't already elements --
            // once it's placed on the board, you can't drag it back.
            Logger.log('toolbox-reject', node.toString());
            Animate.tween(node, { pos:{x:node.pos.x, y:this.pos.y - node.size.h * 1.2} }, 200, (elapsed) => Math.pow(elapsed, 2));
            return;
        } else if (node.toolbox && node.toolbox != this) {
            console.error('@ Toolbox.ondropped: Node toolbox does not match current toolbox instance.');
            return;
        }

        // User changed their minds about removing item from toolbox.
        // Add item back to the toolbox.
        this.addExpression(node);
        Logger.log('toolbox-addback', node.toString());
    }

}
