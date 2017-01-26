/** A subclass of Stage that assumes Nodes are Expressions
    and allows for saving state. */
class ReductStage extends mag.Stage {
    constructor(canvas=null) {
        super(canvas);
        this.stateStack = [];
        this.environment = new Environment();
    }

    // Save state of game board and push onto undo stack.
    saveState() {
        // TODO: DML save and restore the environment as well.
        var board = this.expressionNodes().map((n) => n.clone());
        board = board.filter((n) => !(n instanceof ExpressionEffect));
        var toolbox = this.toolboxNodes().map((n) => n.clone());
        this.stateStack.push( { 'board':board, 'toolbox':toolbox } );
    }

    // Restore previous state of game board.
    restoreState() {
        if (this.stateStack.length > 0) {
            //this.nodes = this.stateStack.pop();

            this.expressionNodes().forEach((n) => this.remove(n));
            this.toolboxNodes().forEach((n) => this.remove(n));
            let restored_state = this.stateStack.pop();
            restored_state.board.forEach((n) => this.add(n));
            restored_state.toolbox.forEach((n) => {
                n.toolbox = this.toolbox;
                this.add(n);
            });

            this.update();
            this.draw();

            Logger.log('state-restore', this.toString());
        }
    }
    dumpState() {
        if (this.stateStack.length > 0) {
            this.stateStack.pop();
        }
    }

    // Checks for level completion.
    update() {
        super.update();

        if (this.isCompleted) {
            let level_complete = this.isCompleted();

            if (level_complete) {

                // DEBUG TEST FLYTO ANIMATION.
                if (!this.ranCompletionAnim) {

                    Logger.log( 'victory', { 'final_state':this.toString(), 'num_of_moves':undefined } );

                    let you_win = () => {

                        if (level_idx < 1) {
                            var cmp = new mag.ImageRect(GLOBAL_DEFAULT_SCREENSIZE.w / 2, GLOBAL_DEFAULT_SCREENSIZE.h / 2, 740 / 2, 146 / 2, 'victory');
                            cmp.anchor = { x:0.5, y:0.5 };
                            this.add(cmp);
                            this.draw();

                            Resource.play('victory');
                            Animate.wait(1080).after(function () {
                                next();
                            });
                        } else { // Skip victory jingle on every level after first.
                            next();
                        }
                    };

                    let pairs = level_complete;
                    let num_exploded = 0;
                    let playedSplosionAudio = false;

                    pairs.forEach((pair, idx) => {
                        var node = pair[0];
                        var goalNode = pair[1];
                        node.ignoreEvents = true;

                        Resource.play('matching-goal');

                        var blinkCount = level_idx === 0 ? 2 : 1;
                        Animate.blink([node, goalNode], 2500 / 2.0 * blinkCount, [0, 1, 1], blinkCount).after(() => {
                            //Resource.play('shootwee');

                            this.playerWon = true;

                            //Animate.flyToTarget(node, goalNode.absolutePos, 2500.0, { x:200, y:300 }, () => {
                                SplosionEffect.run(node);
                                SplosionEffect.run(goalNode);

                                if (!playedSplosionAudio) {
                                    // Play sFx.
                                    Resource.play('splosion');
                                    playedSplosionAudio = true;
                                }

                                goalNode.parent.removeChild(goalNode);
                                num_exploded++;
                                if (num_exploded === pairs.length) {
                                    Animate.wait(500).after(you_win);
                                }
                            //});

                        });


                    });

                    this.ranCompletionAnim = true;
                }
            }
        }
    }

    onmouseclick(pos) {

        // Let player click to continue.
        if (!__IS_MOBILE && this.playerWon) {
            Logger.log('clicked-to-continue', '');
            next();
        }

        super.onmouseclick(pos);
    }

    toString() {
        let stringify = (nodes) => nodes.reduce((prev, curr) => {
            let s = curr.toString();
            if (s === '()') return prev; // Skip empty expressions.
            else            return (prev + curr.toString() + ' ');
        }, '').trim();

        let board = this.expressionNodes();
        let toolbox = this.toolboxNodes();
        let exp = {
            'board': stringify(board),
            'toolbox': stringify(toolbox)
        };

        return JSON.stringify(exp);
    }
}
