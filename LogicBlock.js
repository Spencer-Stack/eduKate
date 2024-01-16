// logic blocks are created when the visual blocks are parsed by the visual controller
class LogicBlock {
    // basically double linked list for blocks
    constructor(id, visualBlock, next, prev, type) {
        this.id = id;
        this.visualBlock = visualBlock;
        this.next = next; // either a logic block or a block_set_host
        this.prev = prev; // either a logic block or a block_set_host
        this.block_type = type;
    }

    static constructFromVisual(visual_block, snap){
        let prev = snap['left'];
        let next = snap['right'];
        let logic_block = new LogicBlock(visual_block.id, visual_block, next, prev, visual_block.block_type);
        return logic_block;
    }

    execute(virtual_controller, callback){
        if (this.block_type.name == "move_right"){
            virtual_controller.moveBaby("right");
        } else if (this.block_type.name == "move_up"){
            virtual_controller.moveBaby('up');
        } else if (this.block_type.name == "move_down"){
            virtual_controller.moveBaby('down');
        } else if (this.block_type.name == "move_left"){
            virtual_controller.moveBaby('left');
        }
        this.visualBlock.flash();

        // Call the callback after a one-second delay
        setTimeout(() => {
            callback();
        }, 1000); // Delay of 1000 milliseconds (1 second)
    }
}