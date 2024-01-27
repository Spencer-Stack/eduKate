// might need a global map for going from integers to ids for images?

$(document).ready(function (){
    const visualController = new VisualController();
    const logicController = new LogicController(visualController);
    const accountController = new AccountController('account', 'programs', visualController);    
    visualController.logic_controller = logicController;
    visualController.account_controller = accountController;
});