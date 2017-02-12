(function() {
    "use strict";

    var style = {};

        // currently set colors
    var currentColors = [ defaultColors( 0 ) ],
        // currently set fonts
        font = [{
            bold: false,
            italic: false,
            underline: false,
//            proportional: true,
            original: 0     // the original integer value of the font
        }];


    /**
     * Get the default colors of a font object
     *
     * @param targetWindow
     * @returns {{text: number, background: number}}
     */
    function defaultColors( targetWindow ) {
        if( targetWindow === 1 ) {  // status line
            return {
                text: 15,
                background: 1
            };
        }
        else {
            return {
                text: 7,
                background: 0
            };
        }
    }


    /**
     * Set currently active font styles and colors to an element.
     *
     * @param elem
     * @param targetWindow
     */
    style.apply = function( elem, targetWindow ) {
        if( !currentColors[ targetWindow ] ) {
            currentColors[ targetWindow ] = defaultColors( targetWindow );
        }

        // TODO: don't wipe out other classes
        // TODO: parametrize – Vorple doesn't want interpreter to set colors!
//        elem.className = "textcolor-" + currentColors[ targetWindow ].text + " bgcolor-" + currentColors[ targetWindow ].background;

        /*
        // TODO: cleaner solution
        if( outputWindow.indexOf( elem ) > 0 ) {    // skips main window (index 0) on purpose
            elem.className += " hugowindow";
        }
        */

        if( !font[ targetWindow ] ) {
            font[ targetWindow ] = {};
        }

        for( var prop in font[ targetWindow ] ) {
            if( font[ targetWindow ].hasOwnProperty( prop ) && font[ targetWindow ][ prop ] ) {
                elem.className += " font-" + prop;
            }
        }

        if( !font[ targetWindow ].proportional ) {
//            elem.className += " font-fixed-width";
        }

        // apply same styles to the prompt
        if( targetWindow === 0 ) {
            // haven.prompt.input.className = elem.className;
        }
    };


    style.color = {
        restore: function( oldState ) {
            currentColors = oldState;
        },

        /**
         * Set colors in windows
         *
         * @param which
         * @param color
         * @param targetWindow
         */
        set: function( which, color, targetWindow ) {
            if( !currentColors[ targetWindow ] ) {
                currentColors[ targetWindow ] = defaultColors( targetWindow );
            }

//                console.log( 'changing', which, 'color to', color, 'in window', targetWindow );
            if( currentColors[ targetWindow ][ which ] === color ) {
                // the color doesn't change, do nothing
                return;
            }

            haven.buffer.flush( targetWindow );

            currentColors[ targetWindow ][ which ] = color;
            // style.apply( flushedText, targetWindow );
        }
    };


    /**
     * Restore the entire style state.
     *
     * @param oldState
     */
    style.restore = function( oldState ) {
        font = oldState;
    };


    /**
     * Set a current style attribute.
     *
     * @param {string} type  bold, italic, underline, or proportional
     * @param {boolean} value
     * @param {number} targetWindow
     */
    style.set = function( type, value, targetWindow ) {
        haven.buffer.flush( targetWindow );
        font[ targetWindow ][ type ] = value;
    };


    haven.style = style;
})();