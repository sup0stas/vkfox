angular.module('item', ['common', 'ui.keypress', 'request', 'anchor'])
    .directive('item', function () {
        return {
            controller: function ($scope) {
                $scope.reply = {
                    visible: false
                };

                /**
                 * Show block with text message input
                 *
                 * @param {Function} onSend
                 * @param {String} placeholder
                 */
                this.showReply = function (onSend, placeholder) {
                    $scope.reply.onSend = onSend;
                    $scope.reply.placeholder = placeholder;
                    $scope.reply.visible = !$scope.reply.visible;
                };

                $scope.onReply = function (message) {
                    $scope.reply.visible = false;
                    $scope.reply.onSend(message);
                };
            },
            templateUrl: '/modules/popup/item/item.tmpl.html',
            replace: true,
            transclude: true,
            restrict: 'E',
            scope: {
                owners: '=',
                reply: '=?',
                'class': '@'
            }
        };
    })
    .directive('itemAttachment', function () {
        return {
            templateUrl: '/modules/popup/item/attachment.tmpl.html',
            replace: true,
            transclude: true,
            restrict: 'E',
            scope: {
                type: '@',
                data: '='
            }
        };
    })
    .directive('itemActions', function () {
        return {
            template: '<div class="item__actions" ng-transclude></div>',
            replace: true,
            transclude: true,
            restrict: 'E'
        };
    })
    .directive('itemAction', function () {
        return {
            template: '<i class="item__action"></i>',
            replace: true,
            restrict: 'E'
        };
    })
    .directive('itemSendMessage', function (Request, $filter) {
        var title =  $filter('i18n')('Private message');

        return {
            transclude: true,
            require: '^item',
            restrict: 'A',
            scope: {
                uid: '=',
                chatId: '=?'
            },
            controller: function ($element, $transclude) {
                $transclude(function (clone) {
                    $element.append(clone);
                });
            },
            compile: function (tElement, tAttrs) {
                tAttrs.$set('title', title);
                return function (scope, element, attrs, itemCtrl) {
                    element.bind('click', function () {
                        scope.$apply(function () {
                            itemCtrl.showReply(function (message) {
                                var params = {
                                    message: message.trim()
                                };

                                if (scope.chatId) {
                                    params.chatId = scope.chatId;
                                } else {
                                    params.uid = scope.uid;
                                }

                                Request.api({
                                    code: 'return API.messages.send(' + JSON.stringify(params) + ');'
                                });
                            }, title);
                        });
                    });
                };
            }
        };
    })
    .directive('itemPostWall', function (Request, $filter) {
        var title =  $filter('i18n')('Wall post');

        return {
            transclude: true,
            require: '^item',
            restrict: 'A',
            scope: {
                uid: '='
            },
            controller: function ($element, $transclude) {
                $transclude(function (clone) {
                    $element.append(clone);
                });
            },
            compile: function (tElement, tAttrs) {
                tAttrs.$set('title', title);
                return function (scope, element, attrs, itemCtrl) {
                    element.bind('click', function () {
                        scope.$apply(function () {
                            itemCtrl.showReply(function (message) {
                                var params = {
                                    message: message.trim(),
                                    owner_id: scope.uid
                                };

                                Request.api({
                                    code: 'return API.wall.post(' + JSON.stringify(params) + ');'
                                });
                            }, title);
                        });
                    });
                };
            }
        };
    });
