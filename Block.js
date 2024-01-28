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
        this.was_last_moved = false;
    }

    setLastMoved(moved){
        this.was_last_moved = moved;
        // show moved on top
        if (moved){
            this.element.css({'z-index': 1});
        } else{
            this.element.css({'z-index': 0});
        }
    }

    createBlockElement() {
        // minor change
        const blockElement = $('<div>')
            .addClass('block')
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
            .addClass('block_image');

        let slide_element = null;
        if (this.block_type.name == "start_loop"){
            slide_element = $('<div>', { class: 'slider' });

            // Add notches to the slider
            for (var i = 0; i < 5; i++) {
                slide_element.append($('<div>', { class: 'notch' }));
            }

            // Add the arrow to the slider
            var arrow = $('<div>', { class: 'loop_arrow' });
            slide_element.append(arrow);

            blockElement.append(slide_element);
        }

        blockElement.append(imageElement);

        blockElement.on('mousedown', (event) => {
            // ignore if slider is pressed
            if ($(event.target).hasClass('slider') || $(event.target).closest('.slider').length > 0) {
                return;
            }
            this.visualController.dragging_block_offset.x = event.clientX - this.x;
            this.visualController.dragging_block_offset.y = event.clientY - this.y;

            this.visualController.dragging_block = { id: this.id };
            // here, have to construct chunk and remove from snaps etc
            this.visualController.handleInsideBlockMove(this);
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
            top: this.y - this.visualController.wsov + 'px', // offset by the original offset, not what it is now
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
        $(this.element).addClass('rotating').on('animationend', function() {
            $(this).removeClass('rotating');
        });
    }

    setCurrentlyDragging(dragging){
        if (dragging){
            this.element.addClass('currently_dragging');
        } else{
            this.element.removeClass('currently_dragging');
        }
    }

    setCanTransition(transition){
        if (transition){
            this.element.addClass('with-transition');
        } else{
            this.element.removeClass('with-transition');
        }
    }

    // if the block is a loop, get its loop count value
    getLoopCount() {
        let arrow = $(this.element).find('.loop_arrow');
        let slider = $(this.element).find('.slider');

        var closestNotchIndex = -1; // Initializing to an invalid index
        var closestDist = Infinity;
        slider.find('.notch').each(function(index) {
            var notchLeft = $(this).position().left;
            var dist = Math.abs(arrow.position().left - notchLeft);
            if (dist < closestDist) {
                closestDist = dist;
                closestNotchIndex = index; // Save the index of the closest notch
            }
        });

        return closestNotchIndex + 1;
    }
}