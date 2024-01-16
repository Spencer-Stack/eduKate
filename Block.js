// this is the visualBlock used by the visualController
class Block {
    constructor(id, block_type, tab, vc, x = 0, y = 0) {
        this.id = id;
        this.block_type = block_type;
        this.tab = tab;
        this.visualController = vc; // Reference to the VisualController
        this.x = x;                // Initial x coordinate
        this.y = y;                // Initial y coordinate
        this.element = this.createBlockElement();
    }

    createBlockElement() {
        const blockElement = $('<div>')
            .addClass('block')
            .attr('draggable', 'true')
            .attr('data-tab', this.tab)
            .attr('data-placed', 'true')
            .css({
                position: 'absolute', // Set position to absolute
                left: this.x + 'px',  // Set initial left position
                top: this.y + 'px',   // Set initial top position
            });

        const imageElement = $('<img>')
            .attr('src', this.block_type.img_path)
            .attr('alt', "Nuh uh")
            .attr('draggable', false)
            .addClass('block_image')            
            .on('dragstart', (event) => {
                event.preventDefault(); // Prevent default drag behavior of the image
            });

        blockElement.append(imageElement);

        // Add drag start event listener
        blockElement.on('dragstart', () => {
            this.visualController.dragging_block = { id: this.id, tab: this.tab, inside: true };
        });

        blockElement.on('mousedown', (event) => {
            this.visualController.dragging_block_offset.x = event.clientX - this.x;
            this.visualController.dragging_block_offset.y = event.clientY - this.y;
        });

        return blockElement;
    }

    // Method to update the block's position
    updatePosition(left, top) {
        let offset = this.visualController.workspace.offset();
        this.x = left;
        this.y = top;
        this.element.css({
            left: this.x - offset.left + 'px',
            top: this.y - offset.top + 'px',
        });
    }

    shiftBlock(amount, dir) {
        let offset = this.visualController.workspace.offset();
        if (dir == "right"){
            this.x += amount;
        } else{
            this.x -= amount;
        }
        this.element.css({
            left: this.x - offset.left + 'px',
        });
    }

    flash(){
        $(this.element).toggleClass("flash_transition");
        setTimeout(function() {
          $(this.element).toggleClass("flash_transition");
        }, 1000);
    }
}