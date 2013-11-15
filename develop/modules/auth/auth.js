var RETRY_INTERVAL = 10000, //ms
    CREATED = 1,
    IN_PROGRESS = 1,
    READY = 2,

    Config = require('modules/config/config.js'),
    Mediator = require('modules/mediator/mediator.js'),
    Browser = require('modules/browser/browser.js');

var _ = require('underscore')._,
    Backbone = require('backbone'),
    Vow = require('vow'),

    model = new Backbone.Model(),
    Auth, page,
    state = CREATED, authPromise = Vow.promise();

function closeAuthTabs() {
    if (Browser.firefox) {
        throw "Not implemented";
    } else {
        chrome.tabs.query({url: Config.AUTH_DOMAIN + '*'}, function (tabs) {
            tabs.forEach(function (tab) {
                chrome.tabs.remove(tab.id);
            });
        });
    }
}

function tryLogin() {
    if (Browser.firefox) {
        page = require("sdk/page-worker").Page({
            contentScript: 'self.postMessage(decodeURIComponent(window.location.href));',
            contentURL: Config.AUTH_URI,
            onMessage: function (url) {
                console.log('url', url);
                Mediator.pub('auth:iframe', url);
            }
        });
    } else {
        throw "Not implemented";
        // if (!$iframe) {
            // $iframe = angular.element(
                // '<iframe/>',
                // {name : 'vkfox-login-iframe'}
            // ).appendTo('body');
        // }
        // $iframe.attr('src', Config.AUTH_URI);
    }
}
function freeLogin() {
    if (Browser.firefox) {
        page.destroy();
    } else {
        throw "Not implemented";
        // $iframe.remove();
        // $iframe = null;
    }
    page = null;
}

function onSuccess(data) {
    state = READY;
    Browser.setIconOnline();
    authPromise.fulfill(data);
}

Mediator.sub('auth:iframe', function (url) {
    try {
        model.set('userId',  parseInt(url.match(/user_id=(\w+)(?:&|$)/i)[1], 10));
        model.set('accessToken',  url.match(/access_token=(\w+)(?:&|$)/i)[1]);

        closeAuthTabs();
        freeLogin();
    } catch (e) {
        // TODO control console.log
        console.log(e);
    }
}.bind(this));

Mediator.sub('auth:state:get', function () {
    Mediator.pub('auth:state', state);
});

Mediator.sub('auth:oauth', function () {
    chrome.tabs.create({url: Config.AUTH_URI});
});

Mediator.sub('auth:login', function (force) {
    Auth.login(force);
});

model.on('change:accessToken', function () {
    Mediator.pub('auth:success', model.toJSON());
});

module.exports = {
    retry: _.debounce(function () {
        if (state === IN_PROGRESS) {
            this.login(true);
            this.retry();
        }
    }, RETRY_INTERVAL),
    login: function (force) {
        if (force || state === CREATED) {
            Browser.setIconOffline();
            state = IN_PROGRESS;

            if (authPromise.isFulfilled()) {
                authPromise = Vow.promise();
            }

            tryLogin();
            this.retry();

            Mediator.unsub('auth:success', onSuccess);
            Mediator.once('auth:success', onSuccess);
        }
        return authPromise;
    },
    getAccessToken: function () {
        return exports.login().then(function () {
            return model.get('accessToken');
        });
    },
    getUserId: function () {
        return exports.login().then(function () {
            return model.get('userId');
        });
    }
};

module.exports.login();
