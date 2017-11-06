"use strict";
app.factory('globalMethods', function($http, $rootScope, $timeout, $localStorage, appConst, $ionicPopup, $translate, $ionicLoading, $location, $q, Services) {
    $rootScope.categories = [];
    if(!$localStorage.cart_list){
        $localStorage.cart_list = [];
    }
    $rootScope.locations = [];
    $rootScope.bookedAddons = [];
    $rootScope.cities = [];
    $rootScope.localities = [];
    $rootScope.appVersion = '';
    return {
        // scope, scopeArray, response, subArray
        assignResponseToArray: function(scope, scopeArray, response, subArray) {
            if (response[1].response.status == 1) {
                if (scope) {
                    if (scopeArray) {
                        scopeArray = [];
                        if (subArray.length > 0) {
                            scope.scopeArray = subArray;
                        } else if (response[0].data > 0) {
                            scope.scopeArray = response[0].data;
                        }
                    }
                }
            }
        },
        get_locations: function() {
            $ionicLoading.show();
            Services.webServiceCallPost('', 'get_service_location').then(function(response) {
                $ionicLoading.hide();
                $rootScope.locations = [];
                if (response[1].response.status == 1) {
                    if (response[0].data.locations.length > 0) {
                        $rootScope.locations = response[0].data.locations;
                    }
                    if (response[0].data.cities.length > 0) {
                        $rootScope.cities = response[0].data.cities;
                    }
                }
            });
        },
        getDashboardGridView: function(array, columns) {
            var grid = [],
                col, row = -1;
            if (array.length > 0) {
                angular.forEach(array, function(value, key) {
                    col = key % columns;
                    if (col === 0) {
                        grid[++row] = [];
                    }
                    grid[row][col] = array[key];
                });
            }
            return grid;
        },
        checkUserLogin: function() {
            if ($localStorage.userProfile && $localStorage.userProfile.id && $localStorage.userProfile.id != '') {
                $rootScope.user = $localStorage.userProfile;
                return true;
            } else {
                $rootScope.user = {
                    "first_name": $translate.instant("guest"),
                    "last_name": $translate.instant("user"),
                    "phone": $translate.instant("welcome")
                };
                return false;
            }
        },
        checkTimings: function(d1, d2,d3,message) {
            $rootScope.from_date = d2;
            $rootScope.to_date = d3;
            $rootScope.message = message;
            var d1Date= new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(),"00","00","00");
            var d2Date= new Date(d2.getFullYear(), d2.getMonth(), d2.getDate(),"00","00","00");
            var d3Date= new Date(d3.getFullYear(), d2.getMonth(), d3.getDate(),"00","00","00");
            var d1Time= new Date("00", "00", "00",d1.getHours(),d1.getMinutes(),"00");
            var d2Time= new Date("00", "00", "00",d2.getHours(),d2.getMinutes(),"00");
            var d3Time= new Date("00", "00", "00",d3.getHours(),d3.getMinutes(),"00");
             if(+d1Date>=+d2Date){
                   if(+d1Time<+d2Time){
                        return true;
                    }else if(+d1Time>+d3Time){
                        return true;
                    }else{
                        return false;
                    }
             }else{
                 return true;
             }
        },
        getCostAfterSizeValue : function(id){
         var deferred = $q.defer();
            if($localStorage.cart_list.length>0){
                angular.forEach($localStorage.cart_list, function(value, key) {
                    console.log("value1.item_id  "+value.item_id);
                    console.log("value.item_id  "+id);
                    if(value.item_id==id){
                         deferred.resolve(value.costAfterSize);
                    }else{
                         deferred.resolve(0);
                    }
                });
            }
            return deferred.promise;
        }
    }
});
app.factory('stripe', function($http, $rootScope, $timeout, $localStorage, $translate, $ionicLoading, $q) {
    $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
    return {
        createStripeCustomer: function(data) {
            var q = $q.defer();
            stripe.customers.create({
                email: data.email,
                description: "" + data.username + " "+ $translate.instant("crunchyAccount")
            }, function(result) {
                q.resolve(result);
            });
            return q.promise;
        },
        customersList: function() {
            var q = $q.defer();
            stripe.customers.list({
                limit: 1000
            }, function(result) {
                q.resolve(result);
            });
            return q.promise;
        },
        getMyAccountDetails: function(customerId) {
            var q = $q.defer();
            stripe.customers.retrieve(customerId, function(customer) {
                q.resolve(customer);
            });
            return q.promise;
        },
        addNewCard: function(data) {
            var q = $q.defer();
            stripe.customers.createCard(data.customerId, {
                    card: {
                        number: data.cardNo,
                        exp_month: data.month,
                        exp_year: data.year,
                        cvc: data.cvc,
                        name: data.userName
                    }
                },
                function(result) {
                    q.resolve(result);
                });
            return q.promise;
        },
        doPayment: function(data) {
            var q = $q.defer();
            var amount = Math.round((parseFloat(data.amount) * parseFloat('0.15')) * parseInt('100')); // amount sent into
            stripe.charges.create({
                    amount: amount,
                    currency: 'usd',
                    card: {
                        number: data.cardNo,
                        exp_month: data.month,
                        exp_year: data.year,
                        cvc: data.cvc,
                        name: data.userName
                    },
                    description: "" + data.amount +" "+$translate.instant("debitedThroughCrunchyAccount")
                },
                function(result) {
                    q.resolve(result);
                });
            return q.promise;
        }
    }
});
app.factory('checkCustomer', function($http, $rootScope, $timeout, $localStorage, $ionicLoading, $q) {
    $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
    return {
        isCustomerExist: function(Array, action) {
            var result = -1;
            angular.forEach(Array, function(value, index) {
                if (value.email == action) {
                    result = index;
                }
            });
            return result;
        },
        isCardExist: function(Array, action) {
            var result = false;
            angular.forEach(Array, function(value, index) {
                if (value.last4 == action) {
                    result = true;
                }
            });
            return result;
        },
    }
});
app.factory('PaypalService', ['$q', '$ionicPlatform', '$filter', '$timeout', '$localStorage','$rootScope', function($q, $ionicPlatform, $filter, $timeout, $localStorage,$rootScope) {
    var init_defer;
    var service = {
        initPaymentUI: initPaymentUI,
        createPayment: createPayment,
        configuration: configuration,
        onPayPalMobileInit: onPayPalMobileInit,
        makePayment: makePayment
    };

    function initPaymentUI() {
        init_defer = $q.defer();
        $ionicPlatform.ready().then(function() {
            var clientIDs = {
                "PayPalEnvironmentProduction": $rootScope.siteSettings.PayPalEnvironmentProduction,
                "PayPalEnvironmentSandbox": $rootScope.siteSettings.PayPalEnvironmentSandbox
            };
            PayPalMobile.init(clientIDs, onPayPalMobileInit);
        });
        return init_defer.promise;
    }

    function createPayment(total, name) {
        var payment = new PayPalPayment("" + total, $rootScope.siteSettings.currency, "" + name, "Sale");
        return payment;
    }

    function configuration() {
        var config = new PayPalConfiguration({
            merchantName: $rootScope.siteSettings.merchantName,
            merchantPrivacyPolicyURL: $rootScope.siteSettings.merchantPrivacyPolicyURL,
            merchantUserAgreementURL: $rootScope.siteSettings.merchantUserAgreementURL
        });
        return config;
    }

    function onPayPalMobileInit() {
        $ionicPlatform.ready().then(function() {
            var environment = $rootScope.siteSettings.account_type == "sandbox" ? 'PayPalEnvironmentSandbox' : 'PayPalEnvironmentProduction';
            PayPalMobile.prepareToRender(environment, configuration(), function() {
                $timeout(function() {
                    init_defer.resolve();
                });

            });
        });
    }

    function makePayment(total, name) {
        var defer = $q.defer();
        total = $filter('number')(total, 2);
        $ionicPlatform.ready().then(function() {
            PayPalMobile.renderSinglePaymentUI(createPayment(total, name), function(result) {
                $timeout(function() {
                    defer.resolve(result);
                });
            }, function(error) {
                $timeout(function() {
                    defer.reject(error);
                });
            });
        });
        return defer.promise;
    }
    return service;
}]);
