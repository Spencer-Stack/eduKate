class VirtualController {
    constructor() {
        this.grid_n = 4;
        this.grid_container = $("#grid_house");
        this.default_grid = [];
        this.active_grid = [];

        this.baby_x = 0;
        this.baby_y = 3;

        this.initialiseGridPromise = this.initialiseGrid();

        // Use .then to execute code after the data is ready
        this.initialiseGridPromise.then(() => {
            this.setGridContainer(this.default_grid);
            this.active_grid = this.default_grid.map(tile => new VirtualTile(tile.index, tile.tile_type.name));
            this.drawBaby();
        });
    }

    async initialiseGrid() {
        try {
            const response = await fetch('virtual_configs/virtual_start.txt');
            const data = await response.text();
            const lines = data.split('\n');
            let i = 0;

            for (const line of lines) {
                const words = line.trim().split(' ');

                for (const word of words) {
                    this.default_grid.push(new VirtualTile(i, word));
                    i += 1;
                }
            }
        } catch (error) {
            console.error('Error reading the file:', error);
        }
    }

    reset(){
        this.baby_x = 0;
        this.baby_y = 3;
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
