/** A node representing a line-based path, ending in a pointed arrow.
 * Contains ArrowPath.
 * @module arrowpath
 */

class ArrowPath extends mag.Node {
    constructor(points=[], stroke={color:'black', lineWidth:1}, arrowWidth=8,drawArrow=true) {
        super(0, 0);
        this.stroke = stroke;
        this.points = points;
        this.arrowWidth = arrowWidth;
        this.drawArrowHead = drawArrow;
        this.percentDrawn = 1;
    }

    get absolutePos() {
        var pos = this.pos;
        if (this.parent) {
            let abs_scale = this.parent.absoluteScale;
            return addPos( {x:pos.x*abs_scale.x,
                            y:pos.y*abs_scale.y},
                            this.parent.upperLeftPos( this.parent.absolutePos , this.parent.absoluteSize ));
        }
        else return pos;
    }

    get color() {
        return this.stroke.color;
    }
    set color(clr) {
        this.stroke.color = clr;
    }
    get pathLength() {
        let len = 0;
        for (let i = 1; i < this.points.length; i++)
            len += distBetweenPos(this.points[i-1], this.points[i]);
        return len;
    }
    addPoint(pt) {
        if (!this.points) this.points = [];
        this.points.push( {x:pt.x, y:pt.y} );
    }
    pointAtIndex(i) {
        return { x:this.points[i].x, y:this.points[i].y };
    }
    get lastPoint() {
        return this.pointAtIndex(this.points.length-1);
    }
    get lastSegment() {
        let p1 = this.pointAtIndex(this.points.length-2);
        let p2 = this.pointAtIndex(this.points.length-1);
        return fromTo(p1, p2);
    }

    // Takes a number from 0.0 to 1.0, representing start to end, respectively,
    // and returns the corresponding position along the path if it were treated like a single line.
    posAlongPath(elapsed) {
        if (elapsed < 0) return this.pointAtIndex(0);
        else if (elapsed > 1) return this.lastPoint;

        let totalLen = this.pathLength;
        let fraction = 0;
        for (let i = 1; i < this.points.length; i++) {
            let len = distBetweenPos(this.points[i-1], this.points[i]);
            if (elapsed < fraction + len / totalLen) {
                let seg_elapsed = elapsed - fraction;
                let vec = fromTo(this.points[i-1], this.points[i]);
                let seg_len = lengthOfPos(vec) * seg_elapsed;
                return addPos( this.points[i-1], rescalePos(vec, seg_len) );
            }
            fraction += len / totalLen;
        }

        return this.lastPoint;
    }
    indexOfPointNearest(elapsed) {
        if (elapsed < 0) return this.pointAtIndex(0);
        else if (elapsed > 1) return this.lastPoint;

        let totalLen = this.pathLength;
        let fraction = 0;
        for (let i = 1; i < this.points.length; i++) {
            let len = distBetweenPos(this.points[i-1], this.points[i]);
            if (elapsed < fraction + len / totalLen)
                return i-1;
            fraction += len / totalLen;
        }

        return this.points.length-1;
    }

    draw(ctx, offset) {
        this.drawInternal(ctx, this.absolutePos);
    }

    // Draw path.
    drawInternal(ctx, pos) {
        if (!this.points || this.points.length === 0) return;
        let abs_scale = this.parent.absoluteScale;
        let lastpt = this.lastPoint; //addPos( pos, this.lastPoint );

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.scale(abs_scale.x, abs_scale.y);

        setStrokeStyle(ctx, this.stroke);
        ctx.fillStyle = null;

        // Draw lines.
        let startpt = this.points[0];
        ctx.beginPath();
        ctx.moveTo(startpt.x, startpt.y);

        if (this.percentDrawn > 0.999) {
            this.points.slice(1).forEach((pt) => {
                let p = pt;
                ctx.lineTo(p.x, p.y);
            });
        } else {
            let idx = this.indexOfPointNearest(this.percentDrawn);
            if (idx > 1) {
                this.points.slice(1, idx).forEach((pt) => {
                    let p = pt;
                    ctx.lineTo(p.x, p.y);
                });
            }
        }
        if (this.stroke) ctx.stroke();

        // Draw arrowhead.
        if (this.drawArrowHead) {
            let lastseg = reversePos( rescalePos( this.lastSegment, this.arrowWidth ) ); // Vector pointing from final point to 2nd-to-last point.
            let leftpt = addPos( rotateBy(lastseg, Math.PI / 4.0), lastpt );
            let rightpt = addPos( rotateBy(lastseg, -Math.PI / 4.0), lastpt );
            ctx.fillStyle = this.stroke ? this.stroke.color : null;
            setStrokeStyle(ctx, null);
            ctx.beginPath();
            ctx.moveTo(  lastpt.x,  lastpt.y  );
            ctx.lineTo(  leftpt.x,  leftpt.y  );
            ctx.lineTo( rightpt.x, rightpt.y  );
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}
