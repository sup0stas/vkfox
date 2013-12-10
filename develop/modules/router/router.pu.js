var Vow = require('vow'),
    Mediator = require('mediator/mediator.js');
    // TODO
    // Tracker = require('tracker/tracker.js');

require('buddies/buddies.pu.js');
require('settings/settings.pu.js');
require('news/news.pu.js');
require('chat/chat.pu.js');
require('angular').module('app')
    .config(function ($routeProvider, $locationProvider, $compileProvider, $provide) {
        // Make Addon SDK compatible
        $provide.decorator('$sniffer', function ($delegate) {
            $delegate.history = false;
            return $delegate;
        });
        $locationProvider.html5Mode(false);

        $compileProvider.urlSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|chrome-extension|resource):/);

        $routeProvider
            .when('/news', {
                redirectTo: '/news/my'
            })
            .when('/:tab', {
                templateUrl: function (params) {
                    return [
                        'modules/', params.tab,
                        '/', params.tab, '.tmpl.html'
                    ].join('');
                }
            })
            .when('/:tab/:subtab', {
                templateUrl: function (params) {
                    return [
                        'modules/', params.tab,
                        '/', params.tab, '.tmpl.html'
                    ].join('');
                }
            });
    })
    .run(function ($location, $rootScope) {
        // default tab is chat
        var notificationsPromise = Vow.promise(),
            authPromise = Vow.promise(),
            lastPathPromise = Vow.promise(),
            READY = 2; //ready status from auth module

        $rootScope.$on('$routeChangeSuccess', function (scope, current) {
            Mediator.pub('router:change', current.params);
            if (current.params.tab) {
                // Tracker.trackPage();
                Mediator.pub('router:lastPath:put', $location.path());
            }
        });
        Mediator.sub('notifications:queue', function (queue) {
            notificationsPromise.fulfill(queue);
        });
        Mediator.sub('auth:state', function (state) {
            authPromise.fulfill(state);
        });
        Mediator.sub('router:lastPath', function (lastPath) {
            lastPathPromise.fulfill(lastPath);
        });
        Vow.all([notificationsPromise, authPromise]).spread(function (queue, state) {
            $rootScope.$apply(function () {
                if (state === READY) {
                    if (queue.length) {
                        // queue contains updates from tabs.
                        // Property 'type' holds value
                        $location.path('/' + queue[queue.length - 1].type);
                        $location.replace();
                    } else {
                        lastPathPromise.then(function (lastPath) {
                            $rootScope.$apply(function () {
                                $location.path(lastPath);
                                $location.replace();
                            });
                        });
                    }
                }
            });
        });
        authPromise.then(function (state) {
            if (state !== READY) {
                Mediator.pub('auth:oauth');
                window.close();
            }
        });
        Mediator.pub('auth:state:get');
        Mediator.pub('notifications:queue:get');
        Mediator.pub('router:lastPath:get');
    });
