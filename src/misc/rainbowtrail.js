class RainbowTrail extends mag.Rect {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.time = 0;
    }
    drawInternal(ctx, pos, boundingSize) {

        var x, y;
        var t = this.time;


            let gradient = ctx.createLinearGradient(boundingSize.w/4.0, 0, boundingSize.w, 0);
            gradient.addColorStop(0, 'red');
            gradient.addColorStop(1 / 6, 'orange');
            gradient.addColorStop(2 / 6, 'yellow');
            gradient.addColorStop(3 / 6, 'green');
            gradient.addColorStop(4 / 6, 'blue');
            gradient.addColorStop(5 / 6, 'indigo');
            gradient.addColorStop(1, 'violet');
            this.gradient = gradient;

        // Save the state
        ctx.save();
        ctx.fillStyle = this.gradient;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;

        ctx.translate(pos.x, pos.y);

        // Rainbow effect's animated contour
        var startY = boundingSize.h/2.0;
        var dist = boundingSize.h;
        var amp = 8;
        ctx.beginPath();
        for(x=0; x<=360; x+=1){
            y = startY - dist/2*(x/360) - amp*Math.sin(x*Math.PI/56+t/100)*(x/360)*Math.pow(((360-x)/360), 0.5);
            ctx.lineTo(x/360*boundingSize.w,y);
        }
        for(x=360; x>=0; x-=1){
            y = startY + dist/2*(x/360) - amp*Math.sin(x*Math.PI/56+t/80)*(x/360)*Math.pow(((360-x)/360), 0.5);
            ctx.lineTo(x/360*boundingSize.w,y);
        }
        ctx.fill();
        ctx.stroke();

        ctx.restore();

    }
}
