class Loop {
    constructor() {
        this.block_set = new BlockSet();
        this.loop_count = 3; // Change the number of loop iterations as needed
    }

    execute(virtual_controller, callback) {
        let loopIndex = 0;

        const executeLoop = () => {
            if (loopIndex < this.loop_count) {
                this.block_set.execute(virtual_controller, () => {
                    loopIndex++;
                    executeLoop(); // Start the next loop iteration
                });
            } else{
                callback();
            }
        };

        executeLoop(); // Start the first loop iteration
    }

    addBlock(block) {
        this.block_set.addBlock(block);
    }

    setEnd(end) {
        this.block_set.setEnd(end);
    }

    setStart(start) {
        this.block_set.setStart(start);
    }
}