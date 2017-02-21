(function () {

    angular
        .module('loc8rApp')
        .controller('registerCtrl', registerCtrl);

    registerCtrl.$inject = ['$location','authentication'];
    function registerCtrl($location, authentication) {
        var vm = this;

        vm.pageHeader = {
            title: 'Cuenta Nueva'
        };

        vm.credentials = {
            name : "",
            email : "",
            password : "",
            username : ""
        };
        
        vm.returnPage = $location.search().page || '/';

        vm.onSubmit = function () {
            vm.formError = "";
            if (!vm.credentials.name ||!vm.credentials.username || !vm.credentials.email || !vm.credentials.password) {
                vm.formError = "Todo los campos son requeridos";
                return false;
            } else {
                vm.doRegister();
            }
        };

        vm.doRegister = function() {
            vm.formError = "";
            authentication
                .register(vm.credentials)
                .error(function(err){
                    vm.formError = err;
                })
                .then(function(){
                    $location.search('page', null);
                    $location.path(vm.returnPage);
                });
        };

    }
    
})();