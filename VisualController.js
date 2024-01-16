class VisualController {
    constructor() {
        this.virtual_controller = new VirtualController();
        this.logic_controller = null; // gets set by creation of logic controller
        this.workspace = $('#workspace'); // Select the workspace using jQuery
        this.block_id = 0;
        this.blocks = {};
        this.dragging_block = null; // Initialize dragging_block to null
        this.dragging_block_offset = { x: 0, y: 0 }; // Initialize the offset

        // Initialize event handlers
        this.initializeDragAndDrop();
        this.initializeTabSelection();
        this.initializeActionButtons();

        this.block_size = 100; // Size of the blocks
        this.snap_threshold = 0.5;

        // Keep track of what is snapped where so double snapping doesnt work
        // Each block that is created has an id: (left:, right:)
        this.snapped_connections = {};

        // smiley
        this.smiley_interval = null;

        // selectors
        this.hor_sel = $('#horizontal_selector');
        this.ver_sel = $('#vertical_selector');
        this.sel_target = null;
        // this.introSequence();
    }

    introSequence(){
        this.moveSelTarget('run')
            .then(() => this.custDelayReset(2500))
            .then(() => this.moveSelTarget('stop'))
            .then(() => this.custDelayReset(2500))
            .then(() => this.moveSelTarget('virtual_toggle'))
            .then(() => this.custDelayReset(2500))
            .then(() => this.moveSelTarget('grid_house'))
            .then(() => this.custDelayReset(3000))
            .then(() => this.moveSelTarget('tab-selection'))
            .then(() => this.custDelayReset(2500))
            .then(() => this.moveSelTarget('action-buttons'))
            .then(() => this.custDelayReset(2500))
            .then(() => this.moveSelTarget('block-display'))
            .then(() => this.custDelayReset(2500))
            .then(() => this.moveSelTarget('workspace'))
            .then(() => this.custDelayReset(2500))
            .then(() => this.moveSelTarget('console'))
            .then(() => this.custDelayReset(2500))
            .then(() => this.moveSelTarget(null))
            .then(() => this.custDelayReset(2500));
    }

    custDelayReset(time) {
        let targetId = this.sel_target;
        // reset tile images
        $('.tile_img').css({'z-index': 0});
        // this.showTextBubble();
        return new Promise(resolve => {
            setTimeout(() => {
                $("#" + targetId).css({'z-index': 0});
                resolve();
            }, time);
        });
    }

    // Initialize drag and drop behavior
    initializeDragAndDrop() {
        let _this = this;

        // Prevent default drag behavior
        this.workspace.on('dragover', (event) => {
            event.preventDefault();
        });

        $('#work_area').on('dragover', (event) => {
            event.preventDefault();
        });

        // Handle mouse down event on blocks
        $('.block').on("mousedown", function (event) {
            // Calculate the offset between the mouse and the block
            const offset = $(this).offset();
            _this.dragging_block_offset.x = event.clientX - offset.left;
            _this.dragging_block_offset.y = event.clientY - offset.top;
        });

        // Handle the drop event on the document that isnt the workspace
        $('#work_area').on('drop', (event) => {
            event.preventDefault();
            if (this.dragging_block) {
                const dropTarget = $(event.target);
                // Check if the drop occurred outside the workspace
                if (!dropTarget.is(this.workspace)) {
                    // Delete the dragging_block if dropped outside the workspace
                    this.deleteBlock(this.dragging_block.id);
                    this.dragging_block = null;
                    this.dragging_block_offset = { x: 0, y: 0 };
                }
            }
        });

        // Handle the drop event
        this.workspace.on('drop', (event) => {
            event.preventDefault();

            if (this.dragging_block) {
                // Retrieve data from the dragging_block
                const blockTab = this.dragging_block.tab;
                const alreadyInside = this.dragging_block.inside;
                const blockType = new BlockType(this.dragging_block.block_type); // name of the blocktype

                // Calculate the drop position based on the offset
                const dropX = event.clientX - this.dragging_block_offset.x;
                const dropY = event.clientY - this.dragging_block_offset.y;

                if (alreadyInside) {
                    const blockId = this.dragging_block.id;
                    let existingBlock = this.blocks[blockId];
                    this.snapToExistingBlock(existingBlock, dropX, dropY);
                } else {
                    // Create a new block using the data
                    const newBlock = new Block(this.block_id, blockType, blockTab, this);

                    this.blocks[this.block_id] = newBlock;

                    // Add this block to list of snapped blocks
                    this.snapped_connections[this.block_id] = {"left": null, "right": null};
                    this.snapToExistingBlock(newBlock, dropX, dropY);

                    this.workspace.append(newBlock.element);
                    this.block_id += 1;
                }

                // Reset dragging_block to null and offset to zero
                this.dragging_block = null;
                this.dragging_block_offset = { x: 0, y: 0 };
            }
        });

        // Handle dragstart event listeners on blocks
        $('.block').on('dragstart', (event) => {
            const blockTab = $(event.target).data('tab');
            const blockType = $(event.target).data('block_type');

            // Set the dragging_block to the current block
            this.dragging_block = { id: -1, block_type: blockType, tab: blockTab, inside: false };
        });
    }

    deleteBlock(blockId) {
        const block = this.blocks[blockId];
        if (block) {
            block.element.remove();
            delete this.blocks[blockId];
            this.resetSnaps(blockId);
        }
    }

    // Snap the block to an existing block's left or right
    // TODO determine if its worth it to show when two blocks can snap continuously
    snapToExistingBlock(blockToMove, dropX, dropY) {
        let did_snap = false;
        let left_min_dist = 1000;
        let left_info = {"btm": null, "block": null};
        let right_min_dist = 1000;
        let right_info = {"btm": null, "block": null};

        for (var id in this.blocks){
            let block = this.blocks[id];
            if (block.id !== blockToMove.id) {
                let leftX = block.x;
                let rightX = block.x + this.block_size;
                let height = block.y + this.block_size / 2;

                let dxLeft = leftX - dropX - this.block_size / 2;
                let dxRight = rightX - dropX - this.block_size / 2;
                let dxVert = height - dropY - this.block_size / 2;

                let threshold = this.block_size * this.snap_threshold;
                let left_dist = Math.sqrt(dxLeft * dxLeft + dxVert * dxVert);
                let right_dist = Math.sqrt(dxRight * dxRight + dxVert * dxVert);
                if (left_dist < threshold && left_dist < left_min_dist) {
                    did_snap = true;
                    left_min_dist = left_dist;
                    left_info["btm"] = blockToMove;
                    left_info["block"] = block;
                }

                if (right_dist < threshold && right_dist < right_min_dist) {
                    did_snap = true;
                    right_min_dist = right_dist;
                    right_info["btm"] = blockToMove;
                    right_info["block"] = block;
                }
            }
        }

        // If not snapped to either side, update the position to the drop location
        if (!did_snap) {
            blockToMove.updatePosition(dropX, dropY);
            this.leftSnapCheck(this.snapped_connections[blockToMove.id], null, null);
            this.resetSnaps(blockToMove.id);
        } else{
            // one or more of the infos is set
            if (left_min_dist != 1000){
                // left is populated
                left_info["btm"].updatePosition(left_info["block"].x - this.block_size - 1, left_info["block"].y);
            }
            if (right_min_dist != 1000){
                // right is populated
                right_info["btm"].updatePosition(right_info["block"].x + this.block_size + 1, right_info["block"].y);
            }
            this.updateSnaps(left_info, right_info);
        }
    }

    // if a block is removed from the left of another block, shift those blocks
    // over to the left

    // left info is the information for what block it is on the left of
    // right info is same for right
    updateSnaps(left_info, right_info){
        // if left_info or right_info is null, the other one must be set
        // and that means its at the end of a line
        // if they are both set, that means its in the middle of a line

        let btm_id = null;
        let old_cons = null;
        let rb = null;
        let lb = null;

        const updateConnection = (info, side) => {
            if (info["block"] !== null) {
                const b_id = info["block"].id;
                const btm = info["btm"].id;
                this.snapped_connections[b_id][side] = btm;
                this.snapped_connections[btm][side === "left" ? "right" : "left"] = b_id;
            }
        };
        if (left_info["block"] === null && right_info["block"] !== null) {
            // it's at the very right of the line, update accordingly
            btm_id = right_info["btm"].id;
            old_cons = this.snapped_connections[btm_id];
            lb = right_info["block"].id;
            this.resetSnaps(btm_id);
            updateConnection(right_info, "right");
        } else if (left_info["block"] !== null && right_info["block"] === null) {
            // it's at the very left of the line, update accordingly
            btm_id = left_info["btm"].id;
            old_cons = this.snapped_connections[btm_id];
            rb = left_info["block"].id;
            this.resetSnaps(btm_id);
            updateConnection(left_info, "left");
        } else {
            // it is in the middle, set them both and then shift
            btm_id = left_info["btm"].id;
            old_cons = this.snapped_connections[btm_id];
            lb = right_info["block"].id;
            rb = left_info["block"].id;
            this.resetSnaps(btm_id);
            updateConnection(right_info, "right");
            updateConnection(left_info, "left");

            this.shiftBlocks(left_info["block"].id, "right");
        }

        this.leftSnapCheck(old_cons, rb, lb);
    }

    // TODO make it not move left if it was the first element (most left)

    // this also has to refresh the chain
    // rb and lb are where its going now to avoid collapsing when it shouldnt
    leftSnapCheck(old_cons, rb, lb){
        // check that this block is the left of any other blocks that its now not
        // if so, shift it over to the left

        let l = old_cons["left"];
        let r = old_cons["right"];

        if (l != null && l == lb){
            return;
        }

        if (r != null && r == rb){
            return;
        }

        if (r != null){
            if (l != null){
                this.snapped_connections[l]["right"] = r;
                this.snapped_connections[r]["left"] = l;
            }
            this.shiftBlocks(r, "left");
        }
    }

    // shift blocks across whenever one is inserted between two blocks
    // block is is the id to start the shifting from
    shiftBlocks(block_id, dir){
        let i = 0;
        while (block_id != null && i < 10){
            let block = this.blocks[block_id];
            block.shiftBlock(this.block_size + 1, dir);
            // then find the next block to shift over
            block_id = this.snapped_connections[block_id]["right"];
            i += 1;
        }
    }

    // takes a block_id and removes it from all snaps and its own snap
    resetSnaps(block_id){
        this.snapped_connections[block_id] = {"left": null, "right": null};
        for (var key in this.snapped_connections){
            let obj = this.snapped_connections[key];
            let left = obj["left"];
            let right = obj["right"];
            if (left == block_id){
                this.snapped_connections[key]["left"] = null;
            }
            if (right == block_id){
                this.snapped_connections[key]["right"] = null;
            }
        }
    }

    // Initialize tab selection
    initializeTabSelection() {
        // Initial tab selection
        this.showBlocks('Initialise');

        // Handle tab button click using event delegation
        $('.header').on('click', '.tab-button', (event) => {
            const tabText = $(event.target).text();
            this.showBlocks(tabText);
        });
    }

    // Show blocks based on the selected tab
    // TODO consider animating this swap over to make it apparent / look nice
    showBlocks(selectedTab) {
        $('.block[data-placed="false"]').hide();
        $('.block[data-tab="' + selectedTab + '"]').show();
    }

    // Initialize action buttons
    // TODO construct the logic Controller, probably a parser and what not
    initializeActionButtons() {
        let _this = this;
        // Set up the run, stop, save, and load action buttons
        // These buttons will be connected to the logic controller in the future

        $('.virtual_toggle').on('click', function () {
            $('#virtual').toggleClass('expanded');
            $('#arrow').toggleClass('expanded');
        });

        $('#run').on('click', function () {
            // Call the logic controller's run or setup function
            _this.logic_controller.reset();
            _this.virtual_controller.reset();
            _this.logic_controller.parseVisual(_this.blocks, _this.snapped_connections);
            _this.logic_controller.execute(_this.virtual_controller);
        });

        $('#stop').on('click', function () {
            // Call the logic controller's stop function
            var smiley = $('.smiley');
            _this.smiley();
            smiley.css({'display': 'flex'});
        });

        $('#load').on('click', function () {
            // Call the logic controller's load function
            _this.playAnimation();
        });

        $('#save').on('click', function () {
            // Call the logic controller's save function
        });
    }

    showTextBubble(x, y, text) {
        $("#textBubbleContent").text(text); // Set the text
        $("#textBubble").css({ // Position the bubble
            "left": x + "px",
            "top": y + "px",
            "display": "block" // Make it visible
        });
    }

    doSelMovement(target){
        let elem = $("#"+target);
        $("#overlay").fadeIn(2000);
        elem.css({'z-index': 11});
        // set up all variables needed
        let position = elem.offset();
        let top = position.top;
        let left = position.left;
        let width = elem.outerWidth();
        let height = elem.outerHeight();
        let padding = 20;

        // show the selectors
        this.hor_sel.css({'visibility': 'visible'});
        this.ver_sel.css({'visibility': 'visible'});

        // set the selector widths and heights
        let hor_sel_height = height + padding;
        this.hor_sel.css({'height': hor_sel_height + "px"});

        let ver_sel_width = width + padding;
        this.ver_sel.css({'width': ver_sel_width + "px"});

        // set selector positions
        let hor_sel_top = top - padding / 2;
        this.hor_sel.css({'top': hor_sel_top + "px"});

        let ver_sel_left = left - padding / 2;
        this.ver_sel.css({'left': ver_sel_left + "px"});
    }

    moveSelTarget(target){
        let _this = this;
        let completedPromise = Promise.resolve();
        this.sel_target = target;

        if (target == null){
            this.hor_sel.css({'visibility': 'hidden'});
            this.ver_sel.css({'visibility': 'hidden'});
            $("#overlay").fadeOut(2000);
        } else{
            if (target == 'grid_house' || target == 'python_output'){
                if (!$('#virtual_toggle').hasClass('expanded')){
                    $('#virtual').toggleClass('expanded');
                    $('#arrow').toggleClass('expanded'); 
                    setTimeout(() => {
                        _this.doSelMovement(target);
                        $('.tile_img').css({'z-index': 11});
                    }, 500);               
                }
            } else{
                _this.doSelMovement(target);
            }
        }

        return completedPromise;
    }  

    smiley(){
        var _this = this;
        var smiley = document.getElementById('smiley');
        var smile_x = 500;
        var smile_y = 100;
        var smile_size = 50;
        var velocityX = 2;
        var velocityY = 0;
        var gravity = 0.02;
        var rotation = 0;
        var spin = 5;
        var mouse = { x: 0, y: 0 };
    
        function moveSmiley() {
            applyMouseForce();
            var newX = smile_x + velocityX;
            var newY = smile_y + velocityY;
    
            // Gravity effect
            velocityY += gravity;
    
            // Check for floor collision
            if (newY + smile_size > window.innerHeight) {
                newY = window.innerHeight - smile_size;
                velocityY = -velocityY * 0.99; // Lose some energy on bounce
                changeSpin();
            }

            if (newY < 0){
                newY = 0;
                velocityY = -velocityY * 0.9; // Lose some energy on bounce
                changeSpin();
            }
    
            // Check for wall collision
            if (newX < 0 || newX + smile_size > window.innerWidth) {
                if (newX < 0){
                    newX = 0;
                } else {
                    newX = window.innerWidth - smile_size;
                }
                velocityX = -velocityX * 0.9;
                changeSpin();
            }
    
            // Apply rotation
            rotation += spin;
            smiley.style.transform = `rotate(${rotation}deg)`;
    
            // Move the smiley
            smiley.style.left = smile_x + 'px';
            smiley.style.top = smile_y + 'px';

            smile_x = newX;
            smile_y = newY;
        }
    
        function changeSpin() {
            spin = -spin;
        }

        function applyMouseForce() {
            var dx = smile_x - mouse.x;
            var dy = smile_y - mouse.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
    
            if (distance < 200) { // Repel if within 150px radius
                var force = (200 - distance) / 300;
                velocityX -= force * (dx / distance);
                velocityY -= force * (dy / distance);

                // Change color based on distance
                var colorIntensity = Math.max(0, (200 - distance) / 200);
                var red = 255 * colorIntensity;
                var green = 255 * (1 - colorIntensity);
                var blue = 0;
                smiley.style.backgroundColor = `rgb(${red},${green},${blue})`;
            } else {
                // Reset to original color when the mouse is far away
                smiley.style.backgroundColor = 'yellow';
            }
        }
    
        document.addEventListener('mousemove', function(event) {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        });

        $(document).on('click', '.smiley', function(event) {
            clearInterval(_this.smiley_interval);
            _this.smiley_interval = null;
        });
    
        // Start animation
        this.smiley_interval = setInterval(moveSmiley, 1);
    }
}