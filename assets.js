(function() {
    var assets = {};

        // assets that need to load before we can start
    var expectedAssets = [ 'engine', 'storyfile' ],

        // functions that are called when all assets have loaded
        callbacks = [],

        // the callback that's called the very last
        lastCallback;


    /**
     * When all assets are ready, run the callbacks.
     */
    function done() {
        var i = 0,
            metaCallback = function() {
                i++;
                if( i < callbacks.length ) {
                    callbacks[ i ]( metaCallback );
                }
                else if( lastCallback ) {
                    lastCallback();
                }
            };

        if( callbacks.length === 0 ) {
            return;
        }

        callbacks[ 0 ]( metaCallback );
    }


    /**
     * Adds a callback that's run when all assets are ready.
     * If all assets have already loaded, call the callback immediately.
     *
     * The first parameter of the callback function must be a function that
     * itself calls as a callback when it has finished.
     *
     * @param cb
     */
    assets.addCallback = function( cb ) {
        if( expectedAssets.length === 0 ) {
            // make the function consistently asynchronous
            setTimeout( cb, 0 );
        }

        callbacks.push( cb );
    };

    /**
     * Add an expected asset to the list.
     *
     * @param {function} asset
     */
    assets.expect = function( asset ) {
        if( expectedAssets.length === 0 ) {
            console.warn( 'An expected asset "' + asset + '" was added '
                + 'but all previous assets have already finished loading' );
            return;
        }

        expectedAssets.push( asset );
    };


    /**
     * As a bit of a hack this ensures the game starting callback is always
     * the last one.
     *
     * @param cb
     */
    assets.finalCallback = function( cb ) {
        lastCallback = cb;
    };


    /**
     * When an asset has finished loading, this method should be called.
     *
     * @param asset The name of the asset that's ready
     * @returns {boolean} true if asset was expected
     */
    assets.finished = function( asset ) {
        var index = expectedAssets.indexOf( asset );

        if( index === -1 ) {
            return false;
        }

        // remove from the list of expected assets
        expectedAssets.splice( index, 1 );

        // if everything's ready, run the callbacks
        if( expectedAssets.length === 0 ) {
            done();
        }

        return true;
    };

    haven.assets = assets;
})( window.haven || {} );