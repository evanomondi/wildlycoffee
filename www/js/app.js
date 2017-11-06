"use strict";
var app = angular.module('starter', ['ionic', 'ngStorage', 'ngAnimate', 'declarations', 'socialLogins', 'ngCordovaOauth', 'uiGmapgoogle-maps', 'pascalprecht.translate'], function($httpProvider) {
    var param = function(obj) {
        var query = '',
            name, value, fullSubName, subName, subValue, innerObj, i;
        for (name in obj) {
            value = obj[name];
            if (value instanceof Array) {
                for (i = 0; i < value.length; ++i) {
                    subValue = value[i];
                    fullSubName = name + '[' + i + ']';
                    innerObj = {};
                    innerObj[fullSubName] = subValue;
                    query += param(innerObj) + '&';
                }
            } else if (value instanceof Object) {
                for (subName in value) {
                    subValue = value[subName];
                    fullSubName = name + '[' + subName + ']';
                    innerObj = {};
                    innerObj[fullSubName] = subValue;
                    query += param(innerObj) + '&';
                }
            } else if (value !== undefined && value !== null)
                query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
        }
        return query.length ? query.substr(0, query.length - 1) : query;
    };
    $httpProvider.defaults.transformRequest = [function(data) {
        return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
    }];
});
app.run(function($ionicPlatform, $rootScope, $translate) {
    $ionicPlatform.ready(function() {
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
            if (ionic.Platform.isAndroid()) {
                StatusBar.backgroundColorByHexString("#ee2e2e");
            } else {
                StatusBar.styleDefault();
            }
        }
        if (localStorage.getItem('defaultLanguage')) {
            $translate.use(localStorage.getItem('defaultLanguage'));
        }
    });
});

app.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, appConst, $translateProvider) {
    $ionicConfigProvider.backButton.text('').previousTitleText(false);
    $ionicConfigProvider.views.transition('android');
    $ionicConfigProvider.tabs.position('top');
    $.ajax({
        type: "POST",
        url: appConst.serviceUrl.service + 'get_site_settings',
        crossDomain: true,
        dataType: "json",
        data: '',
        timeout: 2000000,
        async: true,
        success: function(response) {
            if (response[1].response.status == 1) {
                var translations = {};
                localStorage.setItem('googleApiKey', response[0].data.siteDetails[0].google_api);
                localStorage.setItem('facebookApiKey', response[0].data.siteDetails[0].facebook_api);
                localStorage.setItem('siteSettings', JSON.stringify(response));
                var response = JSON.parse(localStorage.getItem('siteSettings'));
                angular.forEach(response[0].data.language_types, function(value, key) {
                    translations = value.language_strings;
                    $translateProvider.translations(value.language_code, translations);
                    if (!localStorage.getItem('defaultLanguage')) {
                        if (response[0].data.siteDetails[0].language_id === value.id) {
                            localStorage.setItem('defaultLanguage', value.language_code);
                        }
                    }
                });
            }
        },
        error: function(xhr, ajaxOptions, thrownError) {
            if (xhr.status == 0) {
                window.plugins.toast.showShortBottom($translate.instant("timedOutError"));
            } else if (xhr.status == 404) {
                window.plugins.toast.showShortBottom($translate.instant("timedOutError"));
            } else {
                window.plugins.toast.showShortBottom($translate.instant("timedOutError"));
            }
        },
        beforeSend: function() {},
        complete: function() {}
    });

    $stateProvider
        .state(appConst.state.app, {
            url: appConst.url.app,
            abstract: true,
            templateUrl: appConst.page.menuHtml,
            controller: 'menuCtrl'
        })
        .state(appConst.state.login, {
            url: appConst.url.login,
            views: {
                'menuContent': {
                    templateUrl: appConst.page.loginHtml,
                    controller: appConst.ctrl.authentication
                }
            }
        })
        .state(appConst.state.registration, {
            url: appConst.url.registration,
            views: {
                '': {
                    templateUrl: appConst.page.registrationHtml,
                    controller: appConst.ctrl.authentication
                }
            }
        })

    .state(appConst.state.forgetPassword, {
            url: appConst.url.forgetPassword,
            views: {
                '': {
                    templateUrl: appConst.page.forgotPasswordHtml,
                    controller: appConst.ctrl.authentication
                }
            }
        })
        .state(appConst.state.resetPassword, {
            url: appConst.url.resetPassword,
            views: {
                '': {
                    templateUrl: appConst.page.resetPasswordHtml,
                    controller: appConst.ctrl.authentication
                }
            }
        })
        .state(appConst.state.changePassword, {
            url: appConst.url.changePassword,
            views: {
                'menuContent': {
                    templateUrl: appConst.page.changePasswordHtml,
                    controller: appConst.ctrl.authentication
                }
            }
        })
        .state(appConst.state.changeLanguage, {
            url: appConst.url.changeLanguage,
            views: {
                'menuContent': {
                    templateUrl: appConst.page.changeLanguageHtml,
                    controller: 'changeLanguageCtrl'
                }
            }
        })
        .state(appConst.state.viewProfile, {
            url: appConst.url.viewProfile,
            views: {
                'menuContent': {
                    templateUrl: appConst.page.viewProfileHtml,
                    controller: 'profileCtrl'
                }
            }
        })
        .state(appConst.state.selected_item, {
            url: appConst.url.selected_item,
            views: {
                'menuContent': {
                    templateUrl: appConst.page.selected_itemHtml,
                    controller: 'selectedItemCtrl'
                }
            }
        })
        .state(appConst.state.editProfile, {
            url: appConst.url.editProfile,
            views: {
                'menuContent': {
                    templateUrl: appConst.page.editProfileHtml,
                    controller: 'profileCtrl'
                }
            }
        })
        .state(appConst.state.dashboard, {
            url: appConst.url.dashboard,
            views: {
                'menuContent': {
                    templateUrl: appConst.page.dashboardHtml,
                    controller: appConst.ctrl.dashboard
                }
            }
        })
        .state(appConst.state.items_list, {
            url: appConst.url.items_list,
            views: {
                'menuContent': {
                    templateUrl: appConst.page.items_listHtml,
                    controller: 'itemsListCtrl'
                }
            }
        })

    .state(appConst.state.cart_list, {
            url: appConst.url.cart_list,
            views: {
                'menuContent': {
                    templateUrl: appConst.page.cart_listHtml,
                    controller: 'cartListCtrl'
                }
            }
        })
        .state(appConst.state.orders_history, {
            url: appConst.url.orders_history,
            views: {
                'menuContent': {
                    templateUrl: appConst.page.orders_historyHtml,
                    controller: 'orderHistoryCtrl'
                }
            }
        })
        .state(appConst.state.ordersHistoryDetails, {
            url: appConst.url.ordersHistoryDetails,
            views: {
                'menuContent': {
                    templateUrl: appConst.page.orderHistoryDetailsHtml,
                    controller: 'orderHistoryCtrl'
                }
            }
        })
        .state(appConst.state.about_us, {
            url: appConst.url.about_us,
            views: {
                'menuContent': {
                    templateUrl: appConst.page.about_usHtml,
                    controller: 'aboutUsCtrl'
                }
            }
        })
        .state(appConst.state.termsConditions, {
            url: appConst.url.termsConditions,
            templateUrl: appConst.page.termsConditionsHtml,
            controller: ''
        })
        .state(appConst.state.payment_status, {
            url: appConst.url.payment_status,
            templateUrl: appConst.page.payment_statusHtml,
            controller: 'paymentCtrl'

        })
        .state(appConst.state.offers, {
            url: appConst.url.offers,
            views: {
                'menuContent': {
                    templateUrl: appConst.page.offersHtml,
                    controller: 'offersCtrl'
                }
            }
        })
        .state(appConst.state.offerDetails, {
            url: appConst.url.offerDetails,
            views: {
                'menuContent': {
                    templateUrl: appConst.page.offerDetailsHtml,
                    controller: 'offersCtrl'
                }
            }
        })
        .state(appConst.state.home_delivery, {
            url: appConst.url.home_delivery,
            views: {
                'menuContent': {
                    templateUrl: appConst.page.home_deliveryHtml,
                    controller: 'homeDeliveryCtrl'
                }
            }
        })
        .state(appConst.state.payment, {
            url: appConst.url.payment,
            views: {
                'menuContent': {
                    templateUrl: appConst.page.paymentHtml,
                    controller: 'paymentCtrl'
                }
            }
        })
        .state('app.addAddress', {
            url: '/addAddress',
            views: {
                'menuContent': {
                    templateUrl: 'modules/home/addAddress.html',
                    controller: 'homeDeliveryCtrl'
                }
            }
        })
        .state('app.addAddress_profile', {
            url: '/addAddress_profile',
            views: {
                'menuContent': {
                    templateUrl: 'modules/home/addAddress_profile.html',
                    controller: 'profileCtrl'
                }
            }
        });
    $urlRouterProvider.otherwise('/app/dashboard');
});