"use strict";
angular.module('socialLogins', []).factory('socialLogin', function($http, $localStorage, $ionicLoading, $q, $cordovaOauth) {
    return {
        facebook:function(o){
            var e="https://graph.facebook.com/me?fields=id,gender,first_name,last_name,picture,email,birthday&access_token=",a=$q.defer();
            return $localStorage.facebook&&""!=$localStorage.facebook?($ionicLoading.show(),$http.get(e+$localStorage.facebook).then(function(o){$ionicLoading.hide(),a.resolve(o.data)})):($ionicLoading.show(),$cordovaOauth.facebook(o,["email","public_profile"]).then(function(o){$localStorage.facebook=o.access_token,$http.get(e+o.access_token).then(function(o){$ionicLoading.hide(),a.resolve(o.data)})},function(o){$ionicLoading.hide(),a.resolve(o)})),a.promise;
        },
        google:function(o){
            var e="https://www.googleapis.com/plus/v1/people/me?access_token=",t=$q.defer();
            return $localStorage.google&&""!=$localStorage.google?($ionicLoading.show(),$http.get(e+$localStorage.google).then(function(o){$ionicLoading.hide(),t.resolve(o.data)})):($ionicLoading.show(),$cordovaOauth.google(o,["https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/userinfo.email"]).then(function(o){$localStorage.google=o.access_token,$http.get(e+o.access_token).then(function(o){$ionicLoading.hide(),t.resolve(o.data)})},function(o){$ionicLoading.hide(),t.resolve(o)})),t.promise;
        }
    }
});
