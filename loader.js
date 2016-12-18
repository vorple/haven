(function() {
    "use strict";

    var loader = {};

    loader.remove = function() {
        var loaderOverlay = document.getElementById( 'loader' );

        if( loaderOverlay ) {
            loaderOverlay.parentNode.removeChild( loaderOverlay );
        }
    };

    haven.loader = loader;
})();
