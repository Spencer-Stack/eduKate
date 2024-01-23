class VirtualController {
    constructor() {
        this.grid_n = 0;
        this.grid_container = $("#grid_house");
        this.active_grid = [];
        this.levels = [];
        this.cur_level = null; // this stuff will eventually be loaded from localStorage
        this.cur_level_index = 0;

        this.baby_x = null;
        this.baby_y = null;

        // Use .then to execute code after the data is ready
        this.initialiseLevels().then(() => {
            this.changeColumns();
            this.setGridContainer(this.default_grid);
            this.active_grid = this.default_grid.map(tile => new VirtualTile(tile.index, tile.tile_type.name));
            this.drawBaby();
        });
    }

    changeColumns() {
        $(':root').css('--tile_cols', this.grid_n);
    }

    initialiseLevels() {
        // Return a new Promise
        return new Promise(async (resolve, reject) => {
            try {
                let level_1 = await Level.create(1, 0, 1); // Await the Promise returned by Level.create
                let level_2 = await Level.create(2, 0, 2);
                this.levels = [level_1, level_2];
                this.cur_level = level_1;
                this.baby_x = this.cur_level.doll_start_x;
                this.baby_y = this.cur_level.doll_start_y;
                this.default_grid = this.cur_level.default_grid;
                this.grid_n = this.cur_level.grid_n;
    
                resolve(); // Resolve the Promise when done
            } catch (error) {
                reject(error); // Reject the Promise if there are any errors
            }
        });
    }

    nextLevel(){
        this.cur_level_index += 1;
        this.cur_level = this.levels[this.cur_level_index];
        this.reset();
    }

    reset(){
        this.baby_x = this.cur_level.doll_start_x;
        this.baby_y = this.cur_level.doll_start_y;
        this.default_grid = this.cur_level.default_grid;
        this.grid_n = this.cur_level.grid_n;

        this.active_grid = this.default_grid.map(tile => new VirtualTile(tile.index, tile.tile_type.name));
        this.setGridContainer(this.default_grid);
        this.drawBaby();
    }

    // sets the gridContainer element based on either default or active grid
    setGridContainer(base_grid) {
        this.grid_container.empty();
        for (var cell of base_grid) {
            this.grid_container.append(cell.element);
        }
    }

    // replace the tile at index index with a tile type name
    replaceTile(index, name){
        // replace it logically
        let new_tile = new VirtualTile(index, name);
        this.active_grid.splice(index, 1, new_tile);

        // swap the tile out visually
        const cur_elem = this.grid_container.children().eq(index);
        cur_elem.replaceWith(new_tile.element);
    }

    // moves the baby, changes the tiles
    moveBaby(dir){
        let old_index = this.baby_x + this.baby_y * this.grid_n;
        if (dir == "left" && this.baby_x > 0){
            this.baby_x -= 1;
        } else if (dir == "right" && this.baby_x < this.grid_n - 1){
            this.baby_x += 1;
        } else if (dir == "down" && this.baby_y < this.grid_n - 1){
            this.baby_y += 1;
        } else if (dir == "up" && this.baby_y > 0){
            this.baby_y -= 1;
        }
        this.replaceTile(old_index, this.default_grid[old_index].tile_type.name);
        this.drawBaby();
    }

    drawBaby(){
        let cur_index = this.baby_x + this.baby_y * this.grid_n;
        this.replaceTile(cur_index, 'the_doll');
    }
}
