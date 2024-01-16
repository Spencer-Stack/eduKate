// might need a global map for going from integers to ids for images?

$(document).ready(function (){
    const visualController = new VisualController();
    const logicController = new LogicController(visualController);
    visualController.logic_controller = logicController;
});