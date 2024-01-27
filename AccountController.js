// Define a class to manage account data
class AccountController {
    constructor(accountKey, programKey, visual_controller) {
        this.accountKey = accountKey;
        this.programKey = programKey;
        this.vc = visual_controller;
        this.handleEvents();
    }

    handleEvents(){
        let _this = this;
        $('#save_program').click(function() {
            var programName = $('#programName').val();
            $('#saveProgramModal').modal('hide');
            _this.saveProgram(_this.vc.snapped_connections, _this.vc.blocks, programName);
        });
    }

    loadAccountData() {
        // Load account data from localStorage
        const data = localStorage.getItem(this.storageKey);
        if (data) {
            try {
                // Parse the JSON string back to an object
                return JSON.parse(data);
            } catch (e) {
                // Handle possible JSON parsing errors
                console.error('Error parsing account data:', e);
                return this.createDefaultData();
            }
        } else {
            // Initialize with default values if not present in localStorage
            return this.createDefaultData();
        }
    }

    convertEpochToFormattedDate(epoch) {
        var date = new Date(epoch);
        var hours = date.getHours();
        var minutes = "0" + date.getMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes.slice(-2);
    
        var day = "0" + date.getDate();
        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var month = monthNames[date.getMonth()];
        var year = date.getFullYear();
    
        return day.slice(-2) + ' ' + month + ' ' + year + ', ' + hours + ':' + minutes + ampm;
    }
    

    populateLoadTable() {
        let _this = this;
        let loaded = this.loadProgramsData();
        let programs = [];
        for (var key of Object.keys(loaded)){
            let obj = loaded[key];
            let program = {};
            program['id'] = key;
            program['name'] = obj['meta']['name'];
            program['time'] = this.convertEpochToFormattedDate(obj['meta']['time']);
            console.log(obj, program);
            programs.push(program);
        }
    
        $("#overlay").fadeIn(300);
        $('#programGrid').empty();
        programs.forEach(program => {
            $('#programGrid').append(`
                <div class="col-md-4">
                    <div class="card" id="card_${program.id}">
                        <div class="card-body">
                            <h5 class="card-title">${program.name}</h5>
                            <p class="card-text" style="font-style: italic;">${program.time}</p>
                            <div class="d-flex justify-content-between">
                                <button class="btn load-btn" style="width: 48%;">Load</button>
                                <button class="btn delete-btn" style="width: 48%;">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        });

        $('#programContainer').show();

        $('#closeBtn').click(function() {
            $('#programContainer').hide();
            $('#overlay').fadeOut(300);
        });
    
        $(document).mouseup(function(e) {
            var container = $("#programContainer");
    
            // if the target of the click isn't the container nor a descendant of the container
            if (!container.is(e.target) && container.has(e.target).length === 0) {
                container.hide();
                $('#overlay').fadeOut(300);
            }
        });
    
        // Event listeners for load and delete buttons
        $(document).on('click', '.load-btn', function() {
            // Load program logic
            let str_id = $(this).closest('.card').attr('id');
            let id = parseInt(str_id.split("_")[1]);
            let program = _this.loadProgramsData()[id];
            console.log(program);
        });
    
        $(document).on('click', '.delete-btn', function() {
            // Delete program logic
            if (confirm("Are you sure you want to delete this program?")) {
                $(this).closest('.col-md-4').remove();
            }
        });
    }
    
    loadProgramsData() {
        let program_serial = localStorage.getItem(this.programKey);
        let objects = JSON.parse(program_serial);
        return objects;
    }

    stripCircular(blocks){
        let propertiesToKeep = ['id', 'block_type', 'tab', 'x', 'y'];
        let cleaned = [];
        for (var key of Object.keys(blocks)) {
            let block = blocks[key];
            let cleanedBlock = {};
            propertiesToKeep.forEach(prop => {
                if (block.hasOwnProperty(prop)) {
                    cleanedBlock[prop] = block[prop];
                }
            });
    
            cleaned.push(cleanedBlock);
        }
        return cleaned;
    }

    // saves the current program to the save string via localStorage
    saveProgram(snaps, blocks, programName) {
        let programTime = Date.now();
        let meta = {'time': programTime, 'name': programName};

        let new_blocks = this.stripCircular(blocks);
        let programs = this.loadProgramsData();
        if (programs == null){
            let obj = {0: {'snaps': snaps, 'blocks': new_blocks, 'meta': meta}};
            let serial = JSON.stringify(obj);
            localStorage.setItem(this.programKey, serial);
        } else{
            let len = Object.keys(programs).length;
            programs[len] = {'snaps': snaps, 'blocks': new_blocks, 'meta': meta};
            let serial = JSON.stringify(programs);
            localStorage.setItem(this.programKey, serial);
        }
    }

    // need to create a nice structure for what is getting saved
    createDefaultData() {
        return {
            has_seen_intro: false,
            level: 1,
            program_count: 0
        };
    }

    saveAccountData() {
        // Convert account data to JSON string and save in localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(this.accountData));
    }

    updateData(updates) {
        // Update account data
        Object.assign(this.accountData, updates);
        // Save updated data to localStorage
        this.saveAccountData();
    }
}