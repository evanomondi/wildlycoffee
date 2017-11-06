"use strict";
app.controller('dashboardCtrl', function($scope, $location, $ionicSlideBoxDelegate, appConst, $ionicPopup, globalMethods, $translate, $ionicLoading, Services, $localStorage, $rootScope, $ionicHistory) {
    $scope.getCategories = function() {
        angular.element(document).ready(function() {
            $scope.handleCartListIcon('cart_list_icon1');
            $rootScope.cartCount = $localStorage.cart_list.length;
            if ($rootScope.categories.length == 0) {
                $ionicLoading.show();
                Services.webServiceCallPost('', appConst.services.get_menu_card).then(function(response) {
                    $ionicLoading.hide();
                    if (response[1].response.status == 1) {
                        if (response[0].data.menu.length > 0) {
                            var categoryResponse = [];
                            angular.forEach(response[0].data.menu, function(value, key) {
                                if (value.menu_image_name != '') {
                                    var extraData = {
                                        imageUrl: appConst.serviceUrl.menu_image_url + value.menu_image_name
                                    }
                                } else {
                                    var extraData = {
                                        imageUrl: 'img/screen.png'
                                    };
                                }
                                angular.extend(value, extraData);
                                categoryResponse.push(value);
                            });
                            $rootScope.categories = globalMethods.getDashboardGridView(categoryResponse, 2);
                        }
                        if (response[0].data.addons.length > 0) {
                            $rootScope.totalAddons = [];
                            angular.forEach(response[0].data.addons, function(value, key) {
                                var extraData = {
                                    "finalCost": value.price,
                                    "quantity": 1,
                                    imageUrl: appConst.serviceUrl.addon_image_url + value.addon_image
                                };
                                angular.extend(value, extraData);
                                $rootScope.totalAddons.push(value);
                            });
                        }
                        $scope.getSiteSettings();
                    }
                    $rootScope.dashboardHistoryId = $ionicHistory.currentHistoryId();
                });
            }
        });
    }
    $scope.handleCartListIcon = function(id) {
        if ($localStorage.cart_list.length > 0) {
            $('#' + id).show();
        } else {
            $('#' + id).hide();
        }
    }
    $scope.getSiteSettings = function() {
        var response = JSON.parse(localStorage.getItem('siteSettings'));
        $rootScope.siteSettings = response[0].data.siteDetails[0];
        $rootScope.languages = response[0].data.language_types;
        var fromDate = new Date(moment($rootScope.siteSettings.from_time, "HH:mm"));
        var toDate = new Date(moment($rootScope.siteSettings.to_time, "HH:mm"));
        var d1 = new Date();
        var d2 = new Date(fromDate);
        var d3 = new Date(toDate);
        if (globalMethods.checkTimings(d1, d2, d3, $translate.instant("crunchyRestaurantIsCurrentlyClosed"))) {
            var myPopup = $ionicPopup.show({
                templateUrl: 'modules/home/timingsPopup.html',
                title: $translate.instant("restarrentTimings"),
                cssClass: 'timings-popup',
                buttons: [{
                    text: $translate.instant("ok"),
                    type: 'button-assertive'
                }]
            });
        }
    }

    $scope.viewCart = function() {
        $location.path(appConst.path.cart_list);
        $rootScope.cartListBack_button = true;
    }

    $scope.openItem = function(item) {
        $location.path(appConst.path.items_list);
        $rootScope.selectedItem = item;
    }
    $scope.lockSlide = function() {
        $ionicSlideBoxDelegate.enableSlide(false);
    }

    $scope.next = function() {
        $ionicSlideBoxDelegate.enableSlide(true);
        $ionicSlideBoxDelegate.next();
        $ionicSlideBoxDelegate.enableSlide(false);
    };

    $scope.previous = function() {
        $ionicSlideBoxDelegate.enableSlide(true);
        $ionicSlideBoxDelegate.previous();
        $ionicSlideBoxDelegate.enableSlide(false);
    };
});
app.controller('cartListCtrl', function($scope, $location, appConst, globalMethods, $localStorage, $rootScope, $ionicHistory, findItemIndex, $translate) {
    $scope.cost = {
        totalCost: 0
    };
    $scope.noItemsInCart = "";
    $scope.cartListItems = [];
    $rootScope.orderDetails = [];

    $scope.cartListBack = function() {
        $ionicHistory.goBack();
    }
    $scope.edit_order = function(val) {
        if ($localStorage.cart_list.length > 0) {
            if (val == 'true') {
                $scope.handleEditDoneIcons('edit', 'done');
                $scope.editOrderVal = true;
            } else {
                $scope.handleEditDoneIcons('done', 'edit');
                $scope.editOrderVal = false;
            }
        } else {
            $scope.handleEditDoneIcons('', 'edit');
            $scope.handleEditDoneIcons('', 'done');
            $scope.editOrderVal = false;
        }
    }
    $scope.getCartList = function() {
        angular.element(document).ready(function() {
            $scope.handleEditDoneIcons('edit', 'done');
            $scope.editOrderVal = true;
            $scope.noItemsInCart = "";
            if ($localStorage.cart_list.length > 0) {
                $scope.cartListItems = [];
                angular.forEach($localStorage.cart_list, function(value, key) {
                    var extraData = {
                        "finalCost": value.costAfterSize,
                        "quantity": 1
                    };
                    angular.extend(value, extraData);
                    $scope.cartListItems.push(value);
                });
                $scope.calculateTotalCost($scope.cartListItems);
            } else {
                $scope.noItemsInCart = $translate.instant("noItemsInYourCart");
            }
        });
    }
    $scope.removeItem = function(array, id) {
        findItemIndex.findItemIndexInAddons(array, '', id).then(function(index) {
            if (index != -1) {
                array.splice(index, 1);
                $scope.removeItem(array, id);
            }
        });
    }
    $scope.remove_item_from_cart = function(item) {
        var index = findItemIndex.findItemIndexInCartList($localStorage.cart_list, '', item.item_id);
        if (index != -1) {
            if ($rootScope.bookedAddons.length > 0) {
                $scope.removeItem($rootScope.bookedAddons, item.item_id);
            }
            $localStorage.cart_list.splice(index, 1);
            $scope.cartListItems.splice(index, 1);
            $scope.calculateTotalCost($scope.cartListItems);
            $rootScope.cartCount = $scope.cartListItems.length;
            if ($localStorage.cart_list.length == 0) {
                $scope.handleEditDoneIcons('', 'edit');
                $scope.handleEditDoneIcons('', 'done');
                $scope.noItemsInCart = $translate.instant("noItemsInYourCart");
                $scope.editOrderVal = false;
                $rootScope.bookedAddons = [];
            }
        }
    }
    $scope.remove_addon_from_cart = function(item) {
        findItemIndex.findAddonIndexInCartList($rootScope.bookedAddons, '', item.addon_id).then(function(index) {
            if (index != -1) {
                $rootScope.bookedAddons.splice(index, 1);
                $scope.calculateTotalCost($scope.cartListItems);
                if ($localStorage.cart_list.length == 0) {
                    $scope.handleEditDoneIcons('', 'edit');
                    $scope.handleEditDoneIcons('', 'done');
                    $scope.noItemsInCart = $translate.instant("noItemsInYourCart");
                    $scope.editOrderVal = false;
                    $rootScope.bookedAddons = [];
                }
            }
        });


    }
    $scope.subtractQuantity = function(quantity) {
        if (parseInt(quantity) > 1) {
            return parseInt(quantity) - 1;
        } else {
            return parseInt(quantity);
        }
    }
    $scope.changeQuantity = function(quantity, unitCost) {
        return parseInt(quantity) * parseInt(unitCost);
    }
    $scope.calculateTotalCost = function(item) {
        $scope.cost.totalCost = 0;
        angular.forEach(item, function(value, key) {
            $scope.cost.totalCost = parseInt(value.finalCost) + parseInt($scope.cost.totalCost);
        });
        if ($rootScope.bookedAddons.length > 0) {
            angular.forEach($rootScope.bookedAddons, function(value, key) {
                $scope.cost.totalCost = parseInt(value.finalCost) + parseInt($scope.cost.totalCost);
            });
        }
    }
    $scope.addQuantity = function(quantity) {
        return parseInt(quantity) + 1;
    }
    $scope.changeQuantity = function(quantity, unitCost) {
        return parseInt(quantity) * parseInt(unitCost);
    }
    $scope.home = function() {
        $location.path(appConst.path.dashboard);
    };
    $scope.saveAndContinue = function() {
        angular.forEach($scope.cartListItems, function(value, key) {
            var itemDetails = {
                item_id: value.item_id,
                menu_id: value.menu_id,
                item_name: value.item_name,
                item_cost: value.item_cost,
                item_type: value.item_type,
                item_image_name: value.item_image_name,
                item_description: value.item_description,
                status: value.status,
                size_id: value.size_id,
                size_name: value.size_name,
                item_size_id: value.item_size_id,
                size_price: value.size_price,
                finalCost: value.finalCost,
                quantity: value.quantity
            }
            $rootScope.orderDetails.push(itemDetails);
        });
        $rootScope.totalCost = $scope.cost.totalCost;
        if (globalMethods.checkUserLogin()) {
            $location.path(appConst.path.home_delivery);
        } else {
            $rootScope.loginThrough = "order";
            $location.path(appConst.path.login);
        }
    }
    $scope.handleEditDoneIcons = function(idShow, idHide) {
        if ($localStorage.cart_list.length > 0) {
            $('#' + idShow).show();
            $('#' + idHide).hide();
        } else {
            $('#' + idShow).hide();
            $('#' + idHide).hide();
        }
    }
});
app.controller('changeLanguageCtrl', function($scope, $translate) {
    $scope.language = {
        name: localStorage.getItem('defaultLanguage')
    };

    $scope.setLanguage = function(item) {
        localStorage.setItem('defaultLanguage', item.language_code);
        $translate.use(localStorage.getItem('defaultLanguage'));

    }
});
app.controller('homeDeliveryCtrl', function($scope, $location, appConst, globalMethods, $ionicPopup, $ionicLoading, Services, $localStorage, $rootScope, $ionicModal, $filter, $translate) {
    $scope.booking = {};
    $scope.address = {};
    $scope.addressCheck = {};
    $rootScope.bookingAddress = {};
    $scope.homeDeliveryInit = function() {
        $scope.booking.phone = parseInt($localStorage.userProfile.phone);
        $scope.booking.choice = 'online';
        $scope.addressCheck.choice = '';
        $scope.booking.cost = $rootScope.totalCost;
        $scope.booking.location = '';
        $scope.booking.city = '';
        var params = {
            id: $localStorage.userProfile.id,
            email: $localStorage.userProfile.email,
            password: $localStorage.userProfile.password
        };
        $ionicLoading.show();
        Services.webServiceCallPost(params, 'get_user_address').then(function(response) {
            $ionicLoading.hide();
            if (response[1].response.status == 1) {
                $rootScope.addedAddress = response[0].data;
            }
        });
    }
    $scope.addAddress = function() {
        var params = {
            user_id: $localStorage.userProfile.id,
            email: $localStorage.userProfile.email,
            password: $localStorage.userProfile.password,
            city: '',
            landmark: '',
            house_no: '',
            apartment_name: '',
            other: ''
        };
        angular.extend(params, $scope.address);
        console.log("params  " + JSON.stringify(params));
        if (params.city == '') {
            window.plugins.toast.show($translate.instant("selectCity"), 'short', 'bottom');
        } else if (params.landmark == '') {
            window.plugins.toast.show($translate.instant("selectLandmark"), 'short', 'bottom');
        } else {

            $ionicLoading.show();
            Services.webServiceCallPost(params, 'add_user_address').then(function(response) {
                $ionicLoading.hide();
                if (response[1].response.status == 1) {
                    var params = {
                        id: $localStorage.userProfile.id,
                        email: $localStorage.userProfile.email,
                        password: $localStorage.userProfile.password
                    };
                    $ionicLoading.show();
                    Services.webServiceCallPost(params, 'get_user_address').then(function(response) {
                        $ionicLoading.hide();
                        if (response[1].response.status == 1) {
                            $rootScope.addedAddress = response[0].data;
                        }
                    });
                    $location.path('/app/home_delivery');
                }
            });
        }
    }

    $scope.selectBookingAddress = function(address) {
        $rootScope.bookingAddress = address;
    }
    $scope.setSaveOrderParams = function() {
        $rootScope.saveOrderParams = {
            email: $localStorage.userProfile.email,
            user_id: $localStorage.userProfile.id,
            order_date: moment($('#delivery_book_date').val(), ["DD-MM-YYYY HH:mm A"]).format("YYYY-MM-DD"),
            order_time: moment($('#delivery_book_date').val(), ["DD-MM-YYYY hh:mm A"]).format("hh:mm A"),
            total_cost: $rootScope.totalCost,
            customer_name: $localStorage.userProfile.first_name + ' ' + $localStorage.userProfile.last_name,
            phone: $scope.booking.phone,
            house_no: $rootScope.bookingAddress.house_no,
            apartment_name: $rootScope.bookingAddress.apartment_name,
            other: $rootScope.bookingAddress.other,
            address: $rootScope.bookingAddress.house_no + "  " + $rootScope.bookingAddress.apartment_name,
            landmark: $rootScope.bookingAddress.landmark,
            city: $rootScope.bookingAddress.city,
            state: '',
            pincode: '',
            order_type: 'home',
            payment_type: $scope.booking.choice,
            no_of_items: $rootScope.orderDetails.length,
            order_summary: JSON.stringify($rootScope.orderDetails),
            isAddons: $rootScope.bookedAddons.length > 0 ? 1 : 0,
            addons_summary: JSON.stringify($rootScope.bookedAddons),
        }
    }
    $scope.doPayment = function() {
        var from_date = new Date(moment($rootScope.siteSettings.from_time, "HH:mm"));
        var to_date = new Date(moment($rootScope.siteSettings.to_time, "HH:mm"));
        var d1 = new Date(moment($('#delivery_book_date').val(), ["DD-MM-YYYY HH:mm A"]).format("YYYY-MM-DD hh:mm A"));
        var d2 = new Date(from_date);
        var d3 = new Date(to_date);
        if ($('#delivery_book_date').val() == '') {
            window.plugins.toast.show($translate.instant("specifyDate"), 'short', 'bottom');
        } else if (globalMethods.checkTimings(d1, d2, d3, $translate.instant("crunchyRestaurantNotAvailableOnSelectedTime"))) {
            var myPopup = $ionicPopup.show({
                templateUrl: 'modules/home/timingsPopup.html',
                title: $translate.instant("restaruentTimings"),
                cssClass: 'timings-popup',
                buttons: [{
                    text: $translate.instant("ok"),
                    type: 'button-assertive'
                }]
            });
        } else if ($scope.addressCheck.choice == '') {
            window.plugins.toast.show($translate.instant("selectAddress"), 'short', 'bottom');
        } else if ($scope.booking.choice == 'online') {
            $scope.setSaveOrderParams();
            $location.path(appConst.path.payment);
        } else if ($scope.booking.choice == 'cash') {
            $scope.setSaveOrderParams();
            $scope.transaction_details = {
                transaction_id: '',
                paid_date: '',
                payer_name: '',
                payer_email: '',
                payment_status: ''
            };
            $scope.saveOrder();
        }
    }

    $scope.open_cities_modal = function(page) {
        $rootScope.pageType = page;
        $ionicModal.fromTemplateUrl(appConst.page.search_cities_modalHtml, {
            scope: $scope,
            animation: 'slide-in-up',
            preserveScope: true
        }).then(function(modal) {
            $scope.search_cities_model = modal;
            globalMethods.get_locations();
            $scope.search_cities_model.show();
        });
    }
    $scope.close_cities_modal = function() {
        $scope.search_cities_model.hide();
    }
    $scope.locality = [];
    $scope.open_location_modal = function(page) {
        $rootScope.pageType = page;
        if ($scope.address.city && $scope.address.city != '') {
            $ionicModal.fromTemplateUrl(appConst.page.search_locations_modalHtml, {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope.search_location_model = modal;
                $scope.search_location_model.show();
            });
        } else {
            window.plugins.toast.show($translate.instant("selectCity"), 'short', 'bottom');
        }
    }
    $scope.close_location_modal = function() {
        $scope.search_location_model.hide();
    }
    $scope.select_city = function(item) {
        $scope.address.city = item.city_name;
        $rootScope.selectedCityId = item.city_id;
        $scope.close_cities_modal();
    }
    $scope.select_location = function(item) {
        $scope.address.landmark = item.locality;
        $scope.close_location_modal();
    }
    var year = new Date().getFullYear();
    var month = parseInt(new Date().getMonth());
    var date = parseInt(new Date().getDate() + 1);
    var hour = new Date().getHours();
    var minute = parseInt('00');
    var min = new Date(year, month, date, hour, minute);
    $scope.dateMin = $filter('date')(min, 'yyyy-MM-dd');
    var year = new Date().getFullYear();
    var minDate = new Date().getDate();
    var minMonth = new Date().getMonth();
    var date = parseInt('01');
    var time = parseInt('00');
    var mnt = parseInt(new Date().getMinutes());
    var minute = parseInt(mnt);
    var hour = parseInt(new Date().getHours());
    var min = new Date(year, minMonth, minDate, hour, minute);
    var max = new Date(year + 50, date, date, time, time);
    $('#delivery_book_date').mobiscroll().datetime({
        theme: 'android-ics',
        display: 'bottom',
        mode: 'scroller',
        dateOrder: 'dd M yy',
        dateFormat: "dd-mm-yy",
        minDate: min,
        maxDate: max
    });
    $scope.saveOrder = function() {
        angular.extend($rootScope.saveOrderParams, $scope.transaction_details);
        $ionicLoading.show();
        Services.webServiceCallPost($rootScope.saveOrderParams, appConst.services.save_order).then(function(response) {
            $ionicLoading.hide();
            if (response[1].response.status == 1) {
                $localStorage.cart_list = [];
                $rootScope.bookedAddons = [];
                $rootScope.orderDetails = [];
                $rootScope.saveOrderParams = {};
                $location.path(appConst.path.payment_status);
                window.plugins.toast.show(response[1].response.message, 'short', 'bottom');
            }
        });
    }
});
app.controller('itemsListCtrl', function($scope, $location, appConst, $ionicLoading, globalMethods, Services, $localStorage, $rootScope, findItemIndex, $translate) {
    $scope.selected_item;
    $scope.viewCart = function() {
        $location.path(appConst.path.cart_list);
        $rootScope.cartListBack_button = true;
    }
    $scope.getItemsList = function() {
        $scope.totalAddonsCost = 0;
        $ionicLoading.show();
        Services.webServiceCallPost($rootScope.selectedItem, appConst.services.get_items).then(function(response) {
            $ionicLoading.hide();
            $scope.handleCartListIcon('cart_list_icon2');
            if (response[1].response.status == 1) {
                $scope.subMenuItems = [];
                $scope.menuSubItems = [];
                $scope.itemTypes = [];
                if (response[0].data.items.length > 0) {
                    angular.forEach(response[0].data.items, function(value, key) {
                        if ($localStorage.cart_list.length > 0) {
                            var costAfterSizeValue = 0;
                            globalMethods.getCostAfterSizeValue(value.item_id).then(function(cost) {
                                costAfterSizeValue = cost != 0 ? cost : value.item_cost;
                                console.log("cost  " + cost);
                                if (value.item_image_name != '') {
                                    var extraData = {
                                        imageUrl: appConst.serviceUrl.item_image_url + value.item_image_name,
                                        size_id: '',
                                        size_name: '',
                                        item_size_id: '',
                                        size_price: '',
                                        costAfterSize: costAfterSizeValue
                                    };
                                } else {
                                    var extraData = {
                                        imageUrl: 'img/logo.png',
                                        costAfterSize: value.item_cost
                                    };
                                }
                                angular.extend(value, extraData);
                                $scope.subMenuItems.push(value);
                                $scope.menuSubItems.push(value);
                            });
                        } else {
                            if (value.item_image_name != '') {
                                var extraData = {
                                    imageUrl: appConst.serviceUrl.item_image_url + value.item_image_name,
                                    size_id: '',
                                    size_name: '',
                                    item_size_id: '',
                                    size_price: '',
                                    costAfterSize: value.item_cost
                                };
                            } else {
                                var extraData = {
                                    imageUrl: 'img/logo.png',
                                    costAfterSize: value.item_cost
                                };
                            }
                            angular.extend(value, extraData);
                            $scope.subMenuItems.push(value);
                            $scope.menuSubItems.push(value);
                        }

                    });
                } else {
                    $scope.noItemsAvailable = $translate.instant("no") + " " + $rootScope.selectedItem.menu_name + " " + $translate.instant("availableNow");
                }
                if (response[0].data.item_types.length > 0) {
                    $scope.itemTypes.push({
                        text: "All",
                        value: "All"
                    });
                    angular.forEach(response[0].data.item_types, function(value, key) {
                        var extraData = {
                            text: value.item_type,
                            value: value.item_type
                        };
                        $scope.itemTypes.push(extraData);
                    });
                    $scope.data = {
                        clientSide: 'All'
                    };
                }


            }
        });
    }
    $scope.handleCartListIcon = function(id) {
        if ($localStorage.cart_list.length > 0) {
            $('#' + id).show();
        } else {
            $('#' + id).hide();
        }
    }
    $scope.chooseItemType = function(type) {
        $scope.menuSubItems = $scope.subMenuItems;
        if (type == 'Addons') {
            $scope.menuSubItems = [];
            $scope.menuSubItems = $rootScope.totalAddons;
            $scope.data.clientSide = 'Addons';
        } else {
            $scope.data.clientSide = type;
            $scope.menuSubItems = $scope.subMenuItems;
        }
    }
    $scope.openSelectedItem = function(item) {
        $location.path(appConst.path.selected_item);
        angular.element(document).ready(function() {
            var selectedItemScope = angular.element(document.getElementById('selected_item_page')).scope();
            selectedItemScope.selected_item = item;
        });
    };
    $scope.addToCart = function(item) {
        if (findItemIndex.findItemIndexInCartList($localStorage.cart_list, '', item.item_id) == -1) {
            $localStorage.cart_list.push(item);
            $rootScope.cartCount = $localStorage.cart_list.length;
            $scope.handleCartListIcon('cart_list_icon2');
            window.plugins.toast.show($translate.instant("itemAddedToCart"), 'short', 'bottom');
        } else {
            window.plugins.toast.show($translate.instant("alreadyAddedToCart"), 'short', 'bottom');
        }
    }
    $scope.totalAddonsCost = 0;
    $scope.addonsTabInit = function() {
        angular.element(document).ready(function() {
            $scope.totalAddonsCost = 0;
            angular.forEach($localStorage.cart_list, function(value, key) {
                $scope.totalAddonsCost = parseInt(value.finalCost) + parseInt($scope.totalAddonsCost);
            });
        });
    }
    $scope.addQuantity = function(quantity) {
        return parseInt(quantity) + 1;
    }
    $scope.subtractQuantity = function(quantity) {
        if (parseInt(quantity) > 1) {
            return parseInt(quantity) - 1;
        } else {
            return parseInt(quantity);
        }
    }
    $scope.calculateAddonTotal = function(cost, quantity, operation) {
        if (quantity != 0) {
            if (operation == 'add') {
                $scope.totalAddonsCost = parseInt($scope.totalAddonsCost) + parseInt(cost);
            } else if (operation == 'subtract') {
                $scope.totalAddonsCost = parseInt($scope.totalAddonsCost) - parseInt(cost);
            }
        }
    }
    $scope.changeAddonQuantity = function(quantity, unitCost) {
        return parseInt(quantity) * parseInt(unitCost);
    }
});
app.controller('offersCtrl', function($scope, $location, appConst, $ionicLoading, Services, $translate) {
    $scope.bookingCoupons = [];
    $scope.offersInt = function() {
        $ionicLoading.show();
        Services.webServiceCallPost('', appConst.services.get_offers).then(function(response) {
            $ionicLoading.hide();
            var offersScope = angular.element(document.getElementById('offersPage')).scope();
            if (response[1].response.status == 1) {
                offersScope.offers = response[0].data;
            }
        });
    }
    $scope.offerItems = [];
    $scope.offerName = {};
    $scope.offerDetails = function(offer) {
        $location.path(appConst.path.offerDetails);
        angular.element(document).ready(function() {
            $ionicLoading.show();
            Services.webServiceCallPost(offer, appConst.services.get_offer_details).then(function(response) {
                $ionicLoading.hide();
                var offerDetailsScope = angular.element(document.getElementById('offerDetailsPage')).scope();
                offerDetailsScope.offerName.name = offer.offer_name;
                if (response[1].response.status == 1) {
                    offerDetailsScope.offerItems = [];
                    if (response[0].data.products.length > 0) {
                        angular.forEach(response[0].data.products, function(value, key) {
                            if (!value.menu_image_name && value.menu_image_name != '') {
                                var extraData = {
                                    imageUrl: appConst.serviceUrl.item_image_url + value.item_image_name
                                }
                            } else {
                                var extraData = {
                                    imageUrl: 'img/logo.png'
                                }
                            }
                            angular.extend(value, extraData);
                            offerDetailsScope.offerItems.push(value);
                        });
                    } else {
                        offerDetailsScope.noItemsAvailable = $translate.instant("noItemsAvailable");
                    }
                }
            });
        });
    }
});
app.controller('orderHistoryCtrl', function($scope, $location, appConst, globalMethods, $ionicLoading, Services, $localStorage, $rootScope, $translate) {
    $rootScope.estimates = [];
    $scope.orders = [];
    $scope.orderHistoryInit = function() {
        if (globalMethods.checkUserLogin()) {
            $ionicLoading.show();
            Services.webServiceCallPost($localStorage.userProfile, appConst.services.order_history).then(function(response) {
                $ionicLoading.hide();
                var orderHistoryScope = angular.element(document.getElementById('orderHistoryPage')).scope();
                if (response[1].response.status == 1) {
                    if (response[0].data.length > 0) {
                        orderHistoryScope.orders = response[0].data;
                    }
                }
            });
        } else {
            $rootScope.loginThrough = 'orderHistory';
            $location.path(appConst.path.login);
        }
    }
    $scope.orderItems = [];
    $scope.openOrderHistoryDetails = function(order) {
        $location.path(appConst.path.ordersHistoryDetails);
        angular.element(document).ready(function() {
            $ionicLoading.show();
            Services.webServiceCallPost(order, appConst.services.order_item_details).then(function(response) {
                $ionicLoading.hide();
                var orderHistoryDetailsScope = angular.element(document.getElementById('orderHistoryDetailsPage')).scope();
                if (response[1].response.status == 1) {
                    orderHistoryDetailsScope.orderItems = [];
                    if (response[0].data.length > 0) {
                        angular.forEach(response[0].data, function(value, key) {
                            if (value.item_image_name && value.item_image_name != '' && value.item_image_name != null) {
                                var extraData = {
                                    imageUrl: appConst.serviceUrl.item_image_url + value.item_image_name
                                };
                            } else {
                                var extraData = {
                                    imageUrl: 'img/logo.png'
                                };
                            }
                            angular.extend(value, extraData);
                            orderHistoryDetailsScope.orderItems.push(value);
                        });
                    } else {
                        orderHistoryDetailsScope.noItemsAvailable = $translate.instant("noItemsAvailable");
                    }
                }
            });
        });
    }
    $scope.home = function() {
        $location.path(appConst.path.dashboard);
    };
});
app.controller('paymentCtrl', function($scope, $location, stripe, checkCustomer, appConst, PaypalService, $ionicLoading, Services, $localStorage, $rootScope, $ionicModal, $ionicHistory, $translate) {
    $scope.payment = {};
    $ionicModal.fromTemplateUrl(appConst.page.stripe_modalHtml, {
        scope: $scope,
        animation: 'slide-in-up',
        preserveScope: true
    }).then(function(modal) {
        $scope.payment.amount = $rootScope.totalCost;
        $scope.stripePaymentModal = modal;
    });

    $scope.openStripePaymentModal = function() {
        $scope.years = [];
        for (var year = (new Date).getFullYear(), i = 1; 16 > i; i++) {
            var y = {
                value: year
            };
            $scope.years.push(y);
            year++;
        }
        $scope.months = [{
            value: "01"
        }, {
            value: "02"
        }, {
            value: "03"
        }, {
            value: "04"
        }, {
            value: "05"
        }, {
            value: "06"
        }, {
            value: "07"
        }, {
            value: "08"
        }, {
            value: "09"
        }, {
            value: "10"
        }, {
            value: "11"
        }, {
            value: "12"
        }];
        $scope.stripePaymentModal.show();
    }
    $scope.closeStripePaymentModal = function() {
        $scope.stripePaymentModal.hide();
    }
    $scope.paypalPayment = function() {
        PaypalService.initPaymentUI().then(function() {
            PaypalService.makePayment($rootScope.totalCost, "Total").then(function(data) {
                $scope.transaction_details = {
                    transaction_id: data.response.id,
                    paid_date: data.response.create_time,
                    payer_name: $localStorage.userProfile.first_name + " " + $localStorage.userProfile.last_name,
                    payer_email: $localStorage.userProfile.email,
                    payment_status: data.response.state
                };
                if (data.response.state == 'approved') {
                    $scope.saveOrder();
                } else {
                    window.plugins.toast.show(response[1].response.message, 'short', 'bottom');
                }
            });
        });
    }
    $scope.paymentConfirmInit = function() {
        var history = $ionicHistory.viewHistory().histories[$rootScope.dashboardHistoryId];
        for (var i = history.stack.length - 1; i >= 0; i--) {
            if (history.stack[i].stateName == 'app.dashboard') {
                $ionicHistory.backView(history.stack[i]);
            }
        }
    }
    $scope.stripePayment = function() {
        var stripePaymentScope = angular.element(document.getElementById('stripePaymentForm')).scope();
        if (parseFloat(stripePaymentScope.payment.amount) > 0) {
            $ionicLoading.show();
            var cardDetails = {
                customerId: $localStorage.stripeAccountDetails.id,
                cardNo: stripePaymentScope.payment.cardNo,
                month: stripePaymentScope.payment.ExpMonth,
                year: stripePaymentScope.payment.ExpYear,
                cvc: stripePaymentScope.payment.cvc,
                amount: parseFloat(stripePaymentScope.payment.amount),
                userName: "" + $localStorage.userProfile.firstName + " " + $localStorage.userProfile.lastName
            };
            stripe.getMyAccountDetails($localStorage.stripeAccountDetails.id).then(function(data) {
                if (data) {
                    if (data.sources) {
                        if (data.sources.data.length > 0) {
                            var cardNoString = stripePaymentScope.payment.cardNo.toString();
                            if (checkCustomer.isCardExist(data.sources.data, cardNoString.substring(cardNoString.length - 4, cardNoString.length))) {
                                stripe.doPayment(cardDetails).then(function(data) {
                                    $scope.transaction_details = {
                                        transaction_id: data.id,
                                        paid_date: data.created,
                                        payer_name: data.customer,
                                        payer_email: data.receipt_email,
                                        payment_status: data.paid
                                    };
                                    $ionicLoading.hide();
                                    if (data.error) {
                                        window.plugins.toast.showShortBottom(data.error.message);
                                    } else {
                                        $scope.closeStripePaymentModal();
                                        $scope.saveOrder();
                                    }
                                });
                            } else {
                                stripe.addNewCard(cardDetails).then(function(data) {
                                    if (data.error) {
                                        $ionicLoading.hide();
                                        window.plugins.toast.showShortBottom(data.error.message);
                                        window.plugins.toast.showShortBottom(data.error.code);
                                    } else {
                                        stripe.doPayment(cardDetails).then(function(data) {
                                            $ionicLoading.hide();
                                            $scope.transaction_details = {
                                                transaction_id: data.id,
                                                paid_date: data.created,
                                                payer_name: data.customer,
                                                payer_email: data.receipt_email,
                                                payment_status: data.paid
                                            };
                                            window.plugins.toast.showShortBottom(response.response[1].response.message);
                                            $scope.closeStripePaymentModal();
                                            $scope.saveOrder();
                                        });
                                    }
                                });
                            }
                        } else {
                            stripe.addNewCard(cardDetails).then(function(data) {
                                if (data.error) {
                                    $ionicLoading.hide();
                                    window.plugins.toast.showShortBottom(data.error.message);
                                    window.plugins.toast.showShortBottom(data.error.code);
                                } else {
                                    stripe.doPayment(cardDetails).then(function(data) {
                                        $scope.transaction_details = {
                                            transaction_id: data.id,
                                            paid_date: data.created,
                                            payer_name: data.customer,
                                            payer_email: data.receipt_email,
                                            payment_status: data.paid
                                        };
                                        $ionicLoading.hide();
                                        $scope.closeStripePaymentModal();
                                        $scope.saveOrder();
                                    });
                                }
                            });
                        }
                    } else if (data.error) {
                        $ionicLoading.hide();
                        window.plugins.toast.showShortBottom($translate.instant("invalidCard"));
                    }
                }
            });
        } else {
            window.plugins.toast.showShortBottom($translate.instant("amountMustBeGreaterThanZero"));
        }
    }
    $scope.saveOrder = function() {
        angular.extend($rootScope.saveOrderParams, $scope.transaction_details);
        $ionicLoading.show();
        Services.webServiceCallPost($rootScope.saveOrderParams, appConst.services.save_order).then(function(response) {
            $ionicLoading.hide();
            if (response[1].response.status == 1) {
                $localStorage.cart_list = [];
                $rootScope.bookedAddons = [];
                $rootScope.orderDetails = [];
                $rootScope.saveOrderParams = {};
                $rootScope.cartCount = $localStorage.cart_list.length;
                $location.path(appConst.path.payment_status);
                window.plugins.toast.show(response[1].response.message, 'short', 'bottom');
            }
        });
    }
    $scope.checkCVC = function(value, max) {
        var string = "" + value;
        if (string.length <= max) {
            $scope.payment.cvc = $scope.payment.cvc;
        } else {
            $scope.payment.cvc = parseInt(string.substring(0, max));
        }
    }
    $scope.checkLength = function(value, max) {
        var string = "" + value;
        if (string.length <= max) {
            $scope.payment.cardNo = $scope.payment.cardNo;
        } else {
            $scope.payment.cardNo = parseInt(string.substring(0, max));
        }
    }
});
app.controller('selectedItemCtrl', function($scope, $location, appConst, $localStorage, $ionicPopup, $rootScope, $ionicModal, findItemIndex, $translate) {
    $scope.addToCart = function(item) {
        if (findItemIndex.findItemIndexInCartList($localStorage.cart_list, '', item.item_id) == -1) {
            $localStorage.cart_list.push(item);
            $rootScope.cartCount = $localStorage.cart_list.length;
            $scope.handleCartListIcon('cart_list_icon2');
            window.plugins.toast.show($translate.instant("itemAddedToCart"), 'short', 'bottom');
        } else {
            window.plugins.toast.show($translate.instant("alreadyAddedToCart"), 'short', 'bottom');
        }
    }
    $scope.customizeOrder = function(item) {
        $scope.itemSizes = item.options;
        console.log(JSON.stringify($scope.itemSizes));
        $scope.data = {};
        var selectedItemScope = angular.element(document.getElementById('selected_item_page')).scope();
        $scope.radioCheck = selectedItemScope.selected_item.size_id;
        angular.forEach($scope.itemSizes, function(value, key) {
            if (value.price == selectedItemScope.selected_item.costAfterSize) {
                $scope.radioCheck = value.option_id;
            }
        });

        var myPopup = $ionicPopup.show({
            templateUrl: 'modules/home/sizes-popup.html',
            scope: $scope,
            cssClass: 'customizeOrder',
            buttons: [{
                text: $translate.instant("cancel")
            }, {
                text: '<b>' + $translate.instant("done") + '</b>',
                type: 'button-assertive',
                onTap: function(e) {
                    myPopup.close();
                }
            }]
        });
    };

    $scope.itemSizes = [];
    $scope.selectedItemSize = function(size) {
        var selectedItemScope = angular.element(document.getElementById('selected_item_page')).scope();
        selectedItemScope.selected_item.size_id = size.option_id;
        selectedItemScope.selected_item.size_name = size.option_name;
        selectedItemScope.selected_item.item_size_id = size.item_option_id;
        selectedItemScope.selected_item.size_price = size.price;
        selectedItemScope.selected_item.costAfterSize = size.price;
        console.log(selectedItemScope.selected_item.costAfterSize);
        angular.forEach($localStorage.cart_list, function(value, key) {
            if (selectedItemScope.selected_item.item_id == value.item_id) {
                value.costAfterSize = size.price;
            }
        });
        $scope.radioCheck = selectedItemScope.selected_item.size_id;
    }
    $scope.done_sizes_model = function() {
        $scope.sizes_model.hide();
    }
    $scope.close_sizes_modal = function() {
        $scope.sizes_model.hide();
    }


    $scope.addQuantity = function(quantity) {
        return parseInt(quantity) + 1;
    }
    $scope.subtractQuantity = function(quantity) {
        if (parseInt(quantity) > 1) {
            return parseInt(quantity) - 1;
        } else {
            return parseInt(quantity);
        }
    }
    $scope.calculateAddonTotal = function(cost, quantity, operation) {
        if (quantity != 0) {
            if (operation == 'add') {
                //items_list_scope.totalAddonsCost = parseInt(items_list_scope.totalAddonsCost) + parseInt(cost);
            } else if (operation == 'subtract') {
                //items_list_scope.totalAddonsCost = parseInt(items_list_scope.totalAddonsCost) - parseInt(cost);
            }
        }
    }
    $scope.changeAddonQuantity = function(quantity, unitCost) {
        return parseInt(quantity) * parseInt(unitCost);
    }
    $scope.selectAddon = function(item, addonCheck, index) {
        if (addonCheck) {
            findItemIndex.findAddonIndexInCartList($rootScope.bookedAddons, '', item.addon_id).then(function(index) {
                console.log("add     " + index);
                if (index == -1) {
                    $rootScope.bookedAddons.push(item);
                    console.log("Array add  " + JSON.stringify($rootScope.bookedAddons));
                }
            });
        } else {
            findItemIndex.findAddonIndexInCartList($rootScope.bookedAddons, '', item.addon_id).then(function(index) {
                console.log("remove   " + index);
                if (index != -1) {
                    $rootScope.bookedAddons.splice(index, 1);
                    console.log("Array remove " + JSON.stringify($rootScope.bookedAddons));
                }
            });

        }
    }
    $scope.open_addons_model = function(item) {
        $ionicModal.fromTemplateUrl('modules/home/addons.html', {
            scope: $scope,
            animation: 'slide-in-up',
            preserveScope: true
        }).then(function(modal) {
            $scope.addons_model = modal;
            if (item.addons.length > 0) {
                $scope.itemAddons = [];
                $rootScope.totalAddons = [];
                angular.forEach(item.addons, function(value, key) {
                    var setInterest = false;
                    var quantity = 1;
                    if ($rootScope.bookedAddons.length > 0) {
                        angular.forEach($rootScope.bookedAddons, function(interestValue, interestKey) {
                            if (value.addon_id == interestValue.addon_id) {
                                setInterest = true;
                                quantity = interestValue.quantity;
                            }
                        });
                    }
                    var extraData = {
                        "finalCost": value.price,
                        "quantity": quantity,
                        interests: setInterest,
                        imageUrl: appConst.serviceUrl.addon_image_url + value.addon_image
                    };
                    angular.extend(value, extraData);
                    $scope.itemAddons.push(value);
                });
            }
            $scope.addons_model.show();
        });
    }
    $scope.close_addons_model = function() {
        $scope.addons_model.hide();
    }
    $scope.viewCart = function() {
        $location.path(appConst.path.cart_list);
        $rootScope.cartListBack_button = true;
    }
    $scope.handleCartListIcon = function(id) {
        if ($localStorage.cart_list.length > 0) {
            $('#' + id).show();
        } else {
            $('#' + id).hide();
        }
    }
});

app.controller('menuCtrl', function($scope, $location, appConst, globalMethods, $localStorage, $rootScope, $translate) {
    $scope.editProfile = {
        first_name: '',
        last_name: '',
        identity: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        landmark: ''
    };
    $scope.openEditProfile = function() {
        if (globalMethods.checkUserLogin()) {
            $location.path(appConst.path.editProfile);
            angular.element(document).ready(function() {
                var editProfileScope = angular.element(document.getElementById('editProfilePage')).scope();
                editProfileScope.editProfile.first_name = $localStorage.userProfile.first_name;
                editProfileScope.editProfile.last_name = $localStorage.userProfile.last_name;
                editProfileScope.editProfile.identity = $localStorage.userProfile.email;
                editProfileScope.editProfile.phone = parseInt($localStorage.userProfile.phone);
                editProfileScope.editProfile.address = $localStorage.userProfile.address;
                editProfileScope.editProfile.city = $localStorage.userProfile.city;
                editProfileScope.editProfile.state = $localStorage.userProfile.state;
                editProfileScope.editProfile.pincode = $localStorage.userProfile.pincode;
                editProfileScope.editProfile.landmark = $localStorage.userProfile.landmark;
            });
        } else {
            $location.path(appConst.path.login);
        }
    }
    $scope.openViewProfile = function() {
        $location.path('/app/viewProfile');
    }

    $scope.editProfileInit = function() {
        if (globalMethods.checkUserLogin()) {
            $location.path(appConst.path.editProfile);
            angular.element(document).ready(function() {
                var editProfileScope = angular.element(document.getElementById('editProfilePage')).scope();
                editProfileScope.editProfile.first_name = $localStorage.userProfile.first_name;
                editProfileScope.editProfile.last_name = $localStorage.userProfile.last_name;
                editProfileScope.editProfile.identity = $localStorage.userProfile.email;
                editProfileScope.editProfile.phone = parseInt($localStorage.userProfile.phone);
                editProfileScope.editProfile.address = $localStorage.userProfile.address;
                editProfileScope.editProfile.city = $localStorage.userProfile.city;
                editProfileScope.editProfile.state = $localStorage.userProfile.state;
                editProfileScope.editProfile.pincode = $localStorage.userProfile.pincode;
                editProfileScope.editProfile.landmark = $localStorage.userProfile.landmark;
            });
        } else {
            $location.path(appConst.path.login);
        }
    }
    $scope.setLogin = function(){
        $rootScope.loginThrough = '';
    }
    $scope.settings = function() {
        $location.path(appConst.path.changeLanguage);
        angular.element(document).ready(function() {
            var changeLanguageScope = angular.element(document.getElementById('changeLanguage')).scope();
            changeLanguageScope.language.name = localStorage.getItem('defaultLanguage');
        });
    }
    $scope.shareToFriends = function() {
        window.plugins.socialsharing.share($translate.instant("crunchy"), $translate.instant("crunchyAppForRestaurant"), '', 'url Here');
    }
    $scope.setCartListBack_button = function() {
        $rootScope.cartListBack_button = false;
    }
    $scope.openPlaystore = function() {
        cordova.getAppVersion.getPackageName().then(function(name) {
            cordova.plugins.market.open(name, {
                success: function() {},
                failure: function() {}
            });
        });
    }
    $scope.logout = function() {
        localStorage.setItem('pageName', '');
        $localStorage.cart_list = [];
        delete $localStorage.userProfile;
        $rootScope = undefined;
        window.plugins.toast.show($translate.instant("signoutSuccessfully"), 'short', 'bottom');
    };
    $scope.checkUserLogin = function() {
        return globalMethods.checkUserLogin();
    }
});

app.controller('profileCtrl', function($scope, $location, appConst, globalMethods, $ionicLoading, Services, $localStorage, $rootScope, $ionicModal, $translate) {
    $scope.editProfile = {
        first_name: '',
        last_name: '',
        identity: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        landmark: ''
    };
    $scope.profile = {};
    $scope.search_cities_model;
    $scope.openEditProfile = function() {
        if (globalMethods.checkUserLogin()) {
            $location.path(appConst.path.editProfile);
            angular.element(document).ready(function() {
                var editProfileScope = angular.element(document.getElementById('editProfilePage')).scope();
                editProfileScope.editProfile.first_name = $localStorage.userProfile.first_name;
                editProfileScope.editProfile.last_name = $localStorage.userProfile.last_name;
                editProfileScope.editProfile.identity = $localStorage.userProfile.email;
                editProfileScope.editProfile.phone = parseInt($localStorage.userProfile.phone);
                editProfileScope.editProfile.address = $localStorage.userProfile.address;
                editProfileScope.editProfile.city = $localStorage.userProfile.city;
                editProfileScope.editProfile.state = $localStorage.userProfile.state;
                editProfileScope.editProfile.pincode = $localStorage.userProfile.pincode;
                editProfileScope.editProfile.landmark = $localStorage.userProfile.landmark;
            });
        } else {
            $location.path(appConst.path.login);
        }
    }
    $scope.userAddressInit = function() {
        if (globalMethods.checkUserLogin()) {
            $scope.profile = $localStorage.userProfile;
            $rootScope.addressPageTitle = $translate.instant("addAddress");
            var params = {
                id: $localStorage.userProfile.id,
                email: $localStorage.userProfile.email,
                password: $localStorage.userProfile.password
            };
            $ionicLoading.show();
            Services.webServiceCallPost(params, 'get_user_address').then(function(response) {
                $ionicLoading.hide();
                if (response[1].response.status == 1) {
                    $rootScope.addedAddress = response[0].data;
                }
            });
        } else {
            $location.path(appConst.path.login);
        }
    }
    $scope.open_cities_modal = function(page) {
        $ionicModal.fromTemplateUrl(appConst.page.search_cities_modalHtml, {
            scope: $scope,
            animation: 'slide-in-up',
            preserveScope: true
        }).then(function(modal) {
            $scope.search_cities_model = modal;
            $scope.search_cities_model.show();
            globalMethods.get_locations();
        });
    }
    $scope.close_cities_modal = function() {
        $scope.search_cities_model.hide();
    }
    $scope.locality = [];
    $scope.open_location_modal = function(page) {
        var addAddress_profile_scope = angular.element(document.getElementById('addAddress_profile_page')).scope();
        if (addAddress_profile_scope.address.city && addAddress_profile_scope.address.city != '') {
            $ionicModal.fromTemplateUrl(appConst.page.search_locations_modalHtml, {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope.search_location_model = modal;
                $scope.search_location_model.show();
            });
        } else {
            window.plugins.toast.show($translate.instant("selectCity"), 'short', 'bottom');
        }
    }
    $scope.close_location_modal = function() {
        $scope.search_location_model.hide();
    }
    $scope.address = {
        city: '',
        landmark: '',
        house_no: '',
        apartment_name: '',
        other: ''
    };
    $scope.select_city = function(item) {
        var addAddress_profile_scope = angular.element(document.getElementById('addAddress_profile_page')).scope();
        addAddress_profile_scope.address.city = item.city_name;
        $rootScope.selectedCityId = item.city_id;
        $scope.close_cities_modal();
    }
    $scope.select_location = function(item) {
        $scope.address.landmark = item.locality;
        $scope.close_location_modal();

    }
    $scope.addAddress = function() {
        var params = {
            user_id: $localStorage.userProfile.id,
            email: $localStorage.userProfile.email,
            password: $localStorage.userProfile.password,
            city: '',
            landmark: '',
            house_no: '',
            apartment_name: '',
            other: ''
        };
        angular.extend(params, $scope.address);
        console.log("params  " + JSON.stringify(params));
        if (params.city == '') {
            window.plugins.toast.show($translate.instant("selectCity"), 'short', 'bottom');
        } else if (params.landmark == '') {
            window.plugins.toast.show($translate.instant("selectLandmark"), 'short', 'bottom');
        } else {
            $ionicLoading.show();
            Services.webServiceCallPost(params, 'add_user_address').then(function(response) {
                $ionicLoading.hide();
                if (response[1].response.status == 1) {
                    $location.path('/app/viewProfile');
                }
            });
        }
    }
    $scope.openEditAddress = function(address) {
        if (address != '') {
            $rootScope.addressPageTitle = $translate.instant("editAddress");
        } else {
            $rootScope.addressPageTitle = $translate.instant("addAddress");
        }
        $rootScope.openEditAddress = address;
        $location.path('/app/addAddress_profile');
    }
    $scope.editAddressInit = function() {
        if ($rootScope.openEditAddress != '') {
            $scope.address = $rootScope.openEditAddress;
        } else {
            $scope.address = {};
        }
    }
    $scope.editAddress = function(address) {
        var params = {
            user_id: $localStorage.userProfile.id,
            email: $localStorage.userProfile.email,
            password: $localStorage.userProfile.password,
            ua_id: address.ua_id
        };
        angular.extend(params, $scope.address);
        $ionicLoading.show();
        Services.webServiceCallPost(params, 'edit_user_address').then(function(response) {
            $ionicLoading.hide();
            if (response[1].response.status == 1) {
                $location.path('/app/viewProfile');
            }
        });
    }
    $scope.deleteAddress = function(address) {
        var params = {
            user_id: $localStorage.userProfile.id,
            email: $localStorage.userProfile.email,
            password: $localStorage.userProfile.password,
            ua_id: address.ua_id
        };
        $ionicLoading.show();
        Services.webServiceCallPost(params, 'delete_user_address').then(function(response) {
            $ionicLoading.hide();
            if (response[1].response.status == 1) {
                $location.path('/app/viewProfile');
            }
        });
    }
    $scope.updateProfile = function() {
        var editProfileScope = angular.element(document.getElementById('editProfilePage')).scope();
        var extraData = {
            id: $localStorage.userProfile.id
        };
        angular.extend(editProfileScope.editProfile, extraData);
        $ionicLoading.show();
        Services.webServiceCallPost(editProfileScope.editProfile, appConst.services.edit_profile).then(function(response) {
            $ionicLoading.hide();
            if (response[1].response.status == 1) {
                $localStorage.userProfile.first_name = editProfileScope.editProfile.first_name;
                $localStorage.userProfile.last_name = editProfileScope.editProfile.last_name;
                $localStorage.userProfile.email = editProfileScope.editProfile.identity;
                $localStorage.userProfile.phone = editProfileScope.editProfile.phone;
                $localStorage.userProfile.address = editProfileScope.editProfile.address;
                $localStorage.userProfile.city = editProfileScope.editProfile.city;
                $localStorage.userProfile.state = editProfileScope.editProfile.state;
                $localStorage.userProfile.pincode = editProfileScope.editProfile.pincode;
                $localStorage.userProfile.landmark = editProfileScope.editProfile.landmark;
                window.plugins.toast.show(response[1].response.message, 'short', 'bottom');
            }
        });
    }
});
app.controller('aboutUsCtrl', function($scope, $location, appConst, uiGmapGoogleMapApi, $ionicLoading, Services, $rootScope) {
    $scope.home = function() {
        $location.path(appConst.path.dashboard);
    };
    $scope.aboutUs = function() {
        if ($rootScope.appVersion == '') {
            cordova.getAppVersion.getVersionNumber().then(function(version) {
                $rootScope.appVersion = version;
            });
        }
        uiGmapGoogleMapApi.then(function(maps) {
            $scope.map = {
                zoom: 18,
                bounds: {},
                center: {
                    latitude: $rootScope.siteSettings.latitude,
                    longitude: $rootScope.siteSettings.longitude
                }
            };
            $scope.markers = [{
                latitude: $rootScope.siteSettings.latitude,
                longitude: $rootScope.siteSettings.longitude,
                title: $rootScope.siteSettings.site_title,
                id: 1
            }];
            $scope.windowCoords = {};
            $scope.onClick = function(marker, eventName, model) {
                $scope.map.center.latitude = model.latitude;
                $scope.map.center.longitude = model.longitude;
                $scope.map.zoom = 18;
                $scope.windowCoords.latitude = model.latitude;
                $scope.windowCoords.longitude = model.longitude;
                $scope.parkName = model.title;
                $scope.show = true;
            };
            $scope.closeClick = function() {
                $scope.show = false;
            };
            $scope.options = {
                scrollwheel: false
            };
            $scope.show = false;
        });
        $scope.pagesInfo();
    }
    $scope.pagesInfo = function() {
        $ionicLoading.show();
        Services.webServiceCallPost('', appConst.services.pages).then(function(response) {
            $ionicLoading.hide();
            if (response[1].response.status == 1) {
                if (response[0].data.length > 0) {
                    $rootScope.pages = response[0].data;
                }
            }
        });
    }
});