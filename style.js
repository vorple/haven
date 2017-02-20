(function() {
    "use strict";

    var style = {};

        // currently set colors
    var currentColors = [ defaultColors( 0 ) ],
        // currently set fonts
        font = [ defaultStyles() ];


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
     * Default styles of the font
     */
    function defaultStyles() {
        return {
            bold: false,
            italic: false,
            underline: false,
            proportional: false,
            original: 0     // the original integer value of the font
        };
    }


    /**
     * Set currently active font styles and colors to an element.
     *
     * @param elem
     * @param targetWindow
     */
    style.apply = function( elem, targetWindow ) {
        var newClasses = [],
            prompt = haven.prompt.get().getElementsByTagName('INPUT')[0],
            setPromptStyle = (targetWindow === 0);

        if( !currentColors[ targetWindow ] ) {
            currentColors[ targetWindow ] = defaultColors( targetWindow );
        }

        if( haven.options.get( 'engineColors' ) ) {
            newClasses.push( "textcolor-" + currentColors[ targetWindow ].text );
            newClasses.push( "bgcolor-" + currentColors[ targetWindow ].background );
        }

        // remove old class styles
        elem.className = elem.className.replace( /\b(text|bg)color-\d+/g, "" );
        elem.classList.remove( "font-fixed-width" );

        if( setPromptStyle ) {
            prompt.className = prompt.className.replace( /\b(text|bg)color-\d+/g, "" );
            prompt.classList.remove( "font-fixed-width" );
        }

        if( !font[ targetWindow ] ) {
            font[ targetWindow ] = defaultStyles();
        }

        for( var prop in font[ targetWindow ] ) {
            if( font[ targetWindow ].hasOwnProperty( prop ) ) {
                elem.classList.remove( "font-" + prop );

                if( setPromptStyle ) {
                    prompt.classList.remove( "font-" + prop );
                }

                if( font[ targetWindow ][ prop ] ) {
                    newClasses.push( "font-" + prop );
                }
            }
        }

        if( font[ targetWindow ].hasOwnProperty( 'proportional' ) && !font[ targetWindow ].proportional ) {
            newClasses.push( "font-fixed-width" );
        }

        for( var i = 0; i < newClasses.length; ++i ) {
            elem.classList.add( newClasses[ i ] );

            if( setPromptStyle ) {
                prompt.classList.add( newClasses[ i ] );
            }
        }
    };


    style.color = {
        get: function() {
            return currentColors;
        },

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


    style.font = {
        get: function() {
            return font;
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