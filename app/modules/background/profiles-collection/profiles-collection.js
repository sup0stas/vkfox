angular.module(
    'profiles-collection',
    ['request', 'mediator', 'longpoll', 'users']
).factory('ProfilesCollection', function (Request, Mediator, Users) {
    var UPDATE_NON_FRIENDS_PERIOD = 1000;

    return Backbone.Collection.extend({
        initialize: function () {
            Mediator.sub('longpoll:updates', this._onFriendUpdates.bind(this));

            this._updateNonFriends();
        },
        _updateNonFriends: _.debounce(function () {
            var
            self = this,
            uids = this.where({
                isFriend: undefined,
                // don't select groups profiles
                gid: undefined
            }).map(function (model) {
                return model.get('uid');
            });

            console.log('_updateNonFriends; uids.length:', uids.length);
            if (uids.length) {
                Users.getProfilesById(uids).then(function (profiles) {
                    profiles.forEach(function (profile) {
                        var model = self.get(profile.uid);
                        if (model) {
                            model.set('online', profile.online);
                        }
                    });
                }).always(this._updateNonFriends.bind(this));
            } else {
                this._updateNonFriends();
            }

        }, UPDATE_NON_FRIENDS_PERIOD),
        /**
         * @see http://vk.com/developers.php?oid=-17680044&p=Connecting_to_the_LongPoll_Server
         *
         * @param [Array] updates
         */
        _onFriendUpdates: function (updates) {
            updates.forEach(function (update) {
                var type = update[0],
                    userId = Math.abs(update[1]), model;

                // 8,-$user_id,0 -- друг $user_id стал онлайн
                // 9,-$user_id,$flags -- друг $user_id стал оффлайн
                // ($flags равен 0, если пользователь покинул сайт (например, нажал выход) и 1,
                // если оффлайн по таймауту (например, статус away))
                if (type === 9 || type === 8) {
                    model = this.get(Number(userId));
                    if (model) {
                        model.set('online', Number(type === 8));
                    }
                }
            }, this);
        }
    });
});
