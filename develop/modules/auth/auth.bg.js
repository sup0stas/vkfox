var RETRY_INTERVAL = 10000, //ms
    CREATED = 1,
    IN_PROGRESS = 1,
    READY = 2,

    Config = require('config/config.js'),
    Mediator = require('mediator/mediator.js'),
    Env = require('env/env.js'),
    Browser = require('browser/browser.bg.js');

var _ = require('shim/underscore.js')._,
    Backbone = require('backbone'),
    Vow = require('shim/vow.js'),

    model = new Backbone.Model(),
    Auth, page, iframe,
    state = CREATED, authPromise = Vow.promise(),

    tryLogin = (function () {
        var tryLogin = Env.firefox ? function () {
            page = require("sdk/page-worker").Page({
                contentScript: 'self.postMessage(decodeURIComponent(window.location.href));',
                contentURL: Config.AUTH_URI,
                onMessage: function (url) {
                    Mediator.pub('auth:iframe', url);
                }
            });
        } : function () {
            if (!iframe) {
                iframe = document.createElement("iframe");
                iframe.name = 'vkfox-login-iframe';
                document.body.appendChild(iframe);
            }
            iframe.setAttribute('src', Config.AUTH_URI + '&time=' + Date.now());
        };

        return tryLogin;
    })(),

    freeLogin = (function () {
        return Env.firefox ? function () {
            page.destroy();
            page = null;
        } : function () {
            document.body.removeChild(iframe);
            iframe = null;
        };
    })();

function onSuccess(data) {
    state = READY;
    Browser.setIconOnline();
    authPromise.fulfill(data);
}

// We need to authorize in own window, after user was logined in a tab
// In google chrome we use content-script for this purpose (declared in manifest.js)
if (Env.firefox) {
    require("sdk/page-mod").PageMod({
        include: [
            "http://oauth.vk.com/blank.html*",
            "https://oauth.vk.com/blank.html*"
        ],
        onAttach: function () {
            Auth.login(true);
        }
    });
}

Mediator.sub('auth:iframe', function (url) {
    try {
        model.set('userId',  parseInt(url.match(/user_id=(\w+)(?:&|$)/i)[1], 10));
        model.set('accessToken',  url.match(/access_token=(\w+)(?:&|$)/i)[1]);

        // After successful login we should close all auth tabs
        Browser.closeTabs(Config.AUTH_DOMAIN);
        freeLogin();
    } catch (e) {
        console.log(e);
    }
}.bind(this));

Mediator.sub('auth:state:get', function () {
    Mediator.pub('auth:state', state);
});

Mediator.sub('auth:oauth', function () {
    Browser.createTab(Config.AUTH_URI);
});

Mediator.sub('auth:login', function (force) {
    Auth.login(force);
});

model.on('change:accessToken', function () {
    Mediator.pub('auth:success', model.toJSON());
});


module.exports = Auth = {
    retry: _.debounce(function () {
        if (state === IN_PROGRESS) {
            Auth.login(true);
            Auth.retry();
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
            Auth.retry();

            Mediator.unsub('auth:success', onSuccess);
            Mediator.once('auth:success', onSuccess);
        }
        return authPromise;
    },
    getAccessToken: function () {
        return Auth.login().then(function () {
            return model.get('accessToken');
        });
    },
    getUserId: function () {
        return Auth.login().then(function () {
            return model.get('userId');
        });
    }
};

Auth.login();
