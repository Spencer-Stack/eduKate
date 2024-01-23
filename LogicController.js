// logical execution will use BlockSets
// A blockset is a set of blocks that are apart of the same piece of functionality (main, func, if, loop, etc)

class LogicController {
    constructor(virtual_controller) {
        this.blocks = {}; // logic blocks, indexed by id (unordered, as opposed to the blockSet)
        this.virtual_controller = virtual_controller;
        // main block set is the block set that contains all blocks in the program
        this.block_set = new BlockSet();
        this.all_block_set_hosts = [];
    }

    addBlock(block){
        this.block_set.addBlock(block);
    }

    execute(controllers){
        this.block_set.execute(controllers, () => {
            if (this.block_set.executing){
                controllers.visual_controller.setConsole("Program run successfully");
            }
        });
    }

    stopExecution(){
        this.block_set.stopExecution();
    }

    // checks to see if a block needs to pop or push new blocksets
    getCurrentBlockSet(block_sets, block){
        if (block.block_type.name == "start_loop"){
            // this means we need to create a new loop object
            let loop = new Loop();
            loop.setStart(block.id);
            block_sets.push(loop);
            this.all_block_set_hosts.push(loop);
        } else if (block.block_type.name == "end_loop"){
            // when this pops, it needs to add it back to the next highest level as a 'block'
            let filled = block_sets.pop();
            filled.setEnd(block.id);
        }
        return block_sets[block_sets.length - 1];
    }

    // only both with the starts and ends of block sets?
    blockSetHostIn(id){
        for (var block_set_host of this.all_block_set_hosts){
            if (block_set_host.block_set.start == id){
                return [true, block_set_host];
            } 
            else if (block_set_host.block_set.end == id){
                return [false, block_set_host];
            }
        }
        return [null, null];
    }

    reset(){
        this.blocks = {};
        this.block_set = new BlockSet();
        this.all_block_set_hosts = [];
    }

    // this checks to make sure the syntax of the loops is correct
    loopCheck(start_block_id, blocks, snaps){
        let next = start_block_id;
        let block = null;

        // cant dip below 0, can't end on anything but 0
        let running_loop_count = 0;

        while (next != null){
            block = blocks[next];
            let block_snap = snaps[block.id];
            next = block_snap['right'];

            if (block.block_type.name == "start_loop"){
                running_loop_count += 1;
            } else if (block.block_type.name == "end_loop"){
                running_loop_count -= 1;
            }

            if (running_loop_count < 0){
                alert("There is a loop finish block incorrectly before a loop start block");
                return false;
            }
        }

        if (running_loop_count > 0){
            alert("There are more loop start blocks that loop finish blocks");
            return false;
        }

        return true;
    }

    // given a list of visual blocks and their snaps, build out all of the blocksets and logic blocks
    parseVisual(blocks, snaps){
        // this is a list of blocksets, they act as scopes for blocks
        // when a start loop or if statement is reached, we go into another blockset
        // when it ends, the block set is popped back out of
        let _this = this;
        let block_sets = [this];
        let cur_block_set_host = this;
        this.all_block_set_hosts.push(this);

        let start_block = null;
        Object.keys(blocks).forEach(function(key) {
            let b = blocks[key];
            if (b.block_type.name == "start_virtual"){
                start_block = b;
            }
        });

        if (start_block == null){
            alert("no start block found");
            return;
        }

        let loops_fine = this.loopCheck(start_block.id, blocks, snaps);
        if (!loops_fine){
            return;
        }

        let dont_add = ["start_loop", "end_loop"];

        let next = start_block.id;
        let block = null;

        while (next != null){
            block = blocks[next];
            let block_snap = snaps[block.id];
            // first check to see if the block set needs to change
            cur_block_set_host = this.getCurrentBlockSet(block_sets, block);

            let logic_block = LogicBlock.constructFromVisual(block, block_snap);
            // add new logic block to list of all blocks
            this.blocks[block.id] = logic_block;

            // then add it to the specific block set if its an actual block
            if (!dont_add.includes(logic_block.block_type.name)){
                cur_block_set_host.addBlock(logic_block);
            } else if (logic_block.block_type.name == "start_loop"){
                let level_above = block_sets[block_sets.length - 2];
                level_above.addBlock(cur_block_set_host) // add the cur host
            }
            next = block_snap['right'];
        }

        Object.keys(_this.blocks).forEach(function(key) {
            let b = _this.blocks[key];
            if (b.next != null){
                // now go and set all of the next's correctly for the normal blocks and loop objects
                let [is_start, block_host] = _this.blockSetHostIn(b.next);
                if (block_host != null){
                    // this means either this block is pointing to start or end of block set host
                    if (is_start){
                        b.next = block_host;
                    } else{
                        b.next = null;
                    }
                }
            }

            if (b.prev != null){
                let [is_start, block_host] = _this.blockSetHostIn(b.prev);
                if (block_host != null){
                    if (is_start){
                        b.prev = null;
                    } else{
                        b.prev = block_host;
                        block_host.block_set.next = b.id;
                    }
                }
            }
        });

        // this now leaves with a nice structure, where execution is left to right
    }
}