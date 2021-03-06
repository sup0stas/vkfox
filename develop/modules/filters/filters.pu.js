var _ = require('shim/underscore.js')._,
    Config = require('config/config.js'),
    moment = require('moment'),
    I18N = require('i18n/i18n.pu.js');

require('rectify/rectify.pu.js');
require('angular').module('app')
    .filter('i18n', function () {
        return function (input) {
            if (input) {
                return I18N.get.apply(I18N, arguments);
            }
        };
    })
    .filter('duration', function () {
        /**
        * Returns time duration in format 'HH:mm'
        *
        * @param {Array} seconds
        *
        * @returns {String}
        */
        return function (seconds) {
            if (seconds) {
                return moment.unix(seconds).format('HH:mm');
            }
        };
    })
    .filter('timeago', function () {
        return function (timestamp) {
            if (timestamp) {
                return moment(timestamp).fromNow();
            }
        };
    })
    .filter('capitalize', function () {
        /**
         * Returns capitalized text
         *
         * @param {String} seconds
         *
         * @returns {String}
         */
        return function (str) {
            if (str && str.length) {
                return str[0].toUpperCase() + str.substr(1);
            }
        };
    })
    .filter('where', function () {
        /**
         * Returns object from collection,
         * by it's key/value pair
         *
         * @param {Array} input
         * @param {String} property
         * @param {Mixed} value
         *
         * @returns {Object}
         */
        return function (input, property, value) {
            var obj;
            if (input) {
                obj  = {};
                obj[property] = value;
                return _(input).findWhere(obj);
            }
        };
    })
    .filter('name', function () {
        /**
         * Returns names from profile's data
         *
         * @param {Object|Array} input
         *
         * @returns {String} String
         */
        return function (input) {
            if (input) {
                return [].concat(input).map(function (owner) {
                    //group profile
                    if (owner.name) {
                        return owner.name;
                    //user profile
                    } else {
                        return owner.first_name + ' ' + owner.last_name;
                    }
                }).join(', ');
            }
        };
    })
    .filter('addVKBase', function () {
        return function (path) {
            if (path.indexOf(Config.VK_BASE) === -1) {
                if (path.charAt(0) === '/') {
                    path = path.substr(1);
                }
                path = Config.VK_BASE + path;
            }
            return path;
        };
    })
    .filter('slice', function () {
        return function (arr, start, end) {
            if (arr) {
                return arr.slice(start, end);
            }
        };
    })
    .filter('isArray', function () {
        return function (input) {
            return angular.isArray(input);
        };
    });
