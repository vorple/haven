(function() {
    "use strict";

    var win = {};

        // DOM containers for windows
    var outputWindows = [ document.getElementById( 'window0' ) ],
        // the parent of all windows
        mainContainer = document.getElementById( 'output' ),
        currentContainers = [ outputWindows[0] ],
        position = [];


    /**
     * Append content to a window.
     *
     * @param content
     */
    win.append = function( content, targetWindow ) {
        var textContainer = document.createElement( 'span' );

        haven.style.apply( textContainer, targetWindow );
        textContainer.innerHTML = content;

        /*
         if( position[ targetWindow ].col !== null && position[ targetWindow ].line !== null ) {
         replacePart( position[ targetWindow ].line, position[ targetWindow ].col, flushedText, targetWindow );
         }
         else {
         outputWindow[ targetWindow ].appendChild( flushedText );
         }
         */

        currentContainers[ targetWindow ].appendChild( textContainer );
    };


    /**
     * Clears an output window.
     *
     * @param targetWindow
     */
    win.clear = function( targetWindow ) {
        if( targetWindow === undefined ) {
            haven.buffer.flush( 0 );
            mainContainer.innerHTML = "";
            mainContainer.appendChild( outputWindows[ 0 ] );
            haven.style.apply( outputWindows[ 0 ], 0 );
            haven.style.apply( document.body, 0 );
            win.position.reset();
        }
        else {
            if( !outputWindows[ targetWindow ] ) {
                return;
            }

// console.log( 'clear window', targetWindow );
            haven.buffer.flush( targetWindow );
            outputWindows[ targetWindow ].innerHTML = "";
            haven.style.apply( outputWindows[ targetWindow ], targetWindow );

            // when clearing the main window, set the entire page's style
            if( targetWindow === 0 ) {
                haven.style.apply( document.body, 0 );
            }

            // hugoui.position.reset( targetWindow );
        }

        // don't scroll automatically right after clearing the main window
        if( targetWindow < 1 ) {
            // hugoui.doScroll = false;
        }
    };


    /**
     * Output containers inside the windows.
     */
    win.container = {
        append: function( container, target ) {
            if( typeof target === 'number' ) {
                outputWindows[ target ].appendChild( container );
            }
            else {
                target.appendChild( container );
            }
        },

        get: function( targetWindow ) {
            return currentContainers[ targetWindow ];
        },

        set: function( newContainer, targetWindow ) {
            currentContainers[ targetWindow ] = newContainer;
        }
    };


    /**
     * Returns the output window element.
     *
     * @param targetWindow
     * @returns {*}
     */
    win.get = function( targetWindow ) {
        return outputWindows[ targetWindow ];
    };


    /**
     * Set the cursor position inside the target window.
     *
     * @type {{reset: reset, set: set}}
     */
    win.position = {
        reset: function( targetWindow ) {
            // if no window specified, reset all positions
            if( targetWindow === undefined ) {
                position = {
                    col: null,
                    line: null
                };
            }
            else {
                win.position.set( null, null, targetWindow );
            }
        },

        restore: function( oldState ) {
            position = oldState;
        },

        set: function( col, line, hugoWindow ) {
            if( !position[ hugoWindow ] ) {
                position[ hugoWindow ] = {};
            }

            position[ hugoWindow ].col = col;
            position[ hugoWindow ].line = line;
        }
    };

    haven.window = win;
})();