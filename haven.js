(function() {
    "use strict";

    var haven = {};

    /**
     * Starts the C engine. The engine should have replaced main() with an
     * otherwise empty function that only stores the command line arguments
     * for passing to the real main() later.
     *
     * startEngine() calls haven_start() in the C code, which should run
     * the real main() function that has been renamed to something else.
     *
     * Example:
     *
     * static char **my_argv;
     *
     * int main(int argc, char *argv[])
     * {
     *    my_argv = argv;
     *    return 0;
     * }
     *
     * int EMSCRIPTEN_KEEPALIVE haven_start()
     * {
     *    return real_main(2, my_argv);
     * }
     *
     * int real_main(int argc, char *argv[])  // renamed from main()
     */
    function startEngine() {
        _haven_start();
    }


    /**
     * Show an error message and halt.
     */
    haven.error = function( message ) {
        var elem = document.createElement( 'div' ),
            spinner = document.getElementById( 'spinner' ),
            loader = document.getElementById( 'loader' );

        elem.id = 'fatal-error';
        elem.innerHTML = message;
        document.body.appendChild( elem );

        // remove spinner animation if error happened on load
        if( spinner ) {
            spinner.parentNode.removeChild( spinner );
        }

        // visual notification that loading has stopped
        if( loader ) {
            loader.className = 'stopped';
        }

        throw new Error( message );
    };


    /**
     * Start the game. If assets haven't loaded yet, the game starts
     * as soon as they're ready.
     */
    haven.start = function( opt ) {
        // read options from URL
        haven.options.init( opt.options );

        // load the story file
        haven.file.init( opt.virtualStoryfile );

        // set up input handlers
        haven.assets.addCallback( function( cb ) {
            haven.input.init();
            cb();
        });

        // set up the prompt
        haven.prompt.init({
            enginePrompt: !!opt.enginePrompt,
            unicode: !!opt.unicode
        });

        // remove the loader
        haven.assets.addCallback( function( cb ) {
            haven.loader.remove();
            cb();
        });

        // start the engine
        haven.assets.finalCallback( startEngine );

        /**
         * fastclick.js initializer - fixes tapping issues in mobile browsers
         */
        if( 'addEventListener' in document ) {
            document.addEventListener( 'DOMContentLoaded', function() {
                FastClick.attach( document.body );
            }, false );
        }
    };

    window.haven = haven;
})();