angular.module('tooltip', []).run(function () {
    jQuery('body').tooltip({
        selector: '[title]',
        container: '.app',
        delay: { show: 1000, hide: false},
        placement: function () {
            var $container = jQuery(this.options.container),
                containerOffset = $container.offset(),
                offset = this.$element.offset(),
                top = offset.top - containerOffset.top,
                left = offset.left - containerOffset.top,
                height = $container.outerHeight(),
                width = $container.outerWidth(),
                vert = 0.5 * height - top,
                vertPlacement = vert > 0 ? 'bottom' : 'top',
                horiz = 0.5 * width - left,
                horizPlacement = horiz > 0 ? 'right' : 'left',
                placement = Math.abs(horiz) > Math.abs(vert) ?  horizPlacement : vertPlacement;

            return placement;
        }
    });

    // Hide popup on click
    jQuery('body').on('show', '[title]', function (e) {
        jQuery(e.target).one('click', function () {
            jQuery(this).data('tooltip').$tip.remove();
        });
    });
});
