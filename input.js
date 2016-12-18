(function() {
    var input = {};

        // current mode of input the game expects: buffer, getkey, getline or endgame.
        // null is no input accepted (during startup)
    var inputMode = null,

        // stores keypresses pressed when the engine isn't specifically expecting them ("buffer" inputMode)
        keypressBuffer = [];


    /**
     * Returns the current input mode.
     *
     * @returns {string}
     */
    input.getMode = function() {
        return inputMode;
    };


    input.init = function() {
        // listen to keypresses and mouse clicks
        document.addEventListener( 'keydown', input.keypress.send, false );
        document.addEventListener( 'click', input.keypress.send, false );

        // fix Mobile Safari bug that breaks fixed positioning when the virtual keyboard pops up
        if( 'ontouchstart' in window ) {
            // the focus event at the start of the game doesn't open the keyboard
            var firstFocus = true;

            input.addEventListener( 'focus', function () {
                if( !firstFocus ) {
                    document.body.classList.add( "safarifix" );
                }
                else {
                    firstFocus = false;
                }
            } );

            input.addEventListener( 'blur', function () {
                document.body.classList.remove( "safarifix" );
            } );
        }
    };


    input.keypress = {
        /**
         * Called when the game starts.
         */
        init: function() {
            // start expecting keypresses
            if( !inputMode ) {
                inputMode = 'buffer';
            }
        },

        /**
         * Check if there's a keypress waiting in the buffer.
         *
         * Called by the engine.
         *
         * @returns {boolean}
         */
        isWaiting: function() {
            haven.buffer.flush();

            if( haven.isTextPrinted ) {
                haven.scrollOrFocus();
            }

            return keypressBuffer.length > 0;
        },

        send: function( e ) {
            var keyCode = e.keyCode,
                doc = document.documentElement,
                scrolltop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

            // don't react to modifier keys
            if( e.altKey || e.ctrlKey || e.metaKey || e.shiftKey ) {
                return;
            }

            switch( inputMode ) {
                case 'buffer':
                    keypressBuffer.push( keyCode );
                    break;

                case 'getline':
                case null:
                    // do nothing except scroll
                    haven.prompt.scrollOrFocus(e);
                    return;

                case 'getkey':
                    // continue with script
                    break;

                case 'endgame':
                    window.location = hugojs_options.exit_url;
                    return;

                default:
                    haven.error( 'Interpreter error: unknown input mode ' + inputMode );
            }

            inputMode = 'buffer';

            // let the scroll handler take this if we're not at the end of the page
            if( scrolltop + window.innerHeight < document.body.clientHeight - 40 ) {
                haven.prompt.scrollOrFocus(e);
                return;
            }

            Module.ccall(
                'haven_getkey',
                'null',
                [ 'number' ],
                [ keyCode ]
            );
        },

        wait: function() {
            inputMode = 'getkey';

            haven.buffer.flush();

            haven.doScroll = true;

            // if there's something in the keypress buffer, "push" that key
            if( keypressBuffer.length > 0 ) {
                haven.keypress.send({ keyCode: keypressBuffer.shift() });
            }
        }
    };


    /**
     * Set a new input mode.
     *
     * @param mode
     */
    input.setMode = function( mode ) {
        inputMode = mode;
    };
    
    haven.input = input;
})();