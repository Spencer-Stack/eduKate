class BlockSet {
    constructor() {
        this.blocks = [];
        this.next = null;
        this.start = null;
        this.end = null;
        this.block_exec_delay = 1000;
    }

    execute(virtual_controller, callback) {
        let index = 0;

        const executeBlockWithDelay = () => {
            if (index < this.blocks.length) {
                const currentBlock = this.blocks[index];
                currentBlock.execute(virtual_controller, () => {
                    index++;
                    executeBlockWithDelay();
                });
            } else {
                callback(); // Call the callback when all blocks are executed
            }
        };

        executeBlockWithDelay();
    }

    addBlock(block) {
        this.blocks.push(block);
    }

    setStart(start) {
        this.start = start;
    }

    setEnd(end) {
        this.end = end;
    }
}