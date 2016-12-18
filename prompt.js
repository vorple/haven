(function() {
    "use strict";

    var prompt = {};


        // command history
    var cmdHistory = [],

        // current position in the command history. -1: new input
        currentCmdHistory = -1,

        // stores the currently typed command when browsing the history
        currentCmdText = "",
        
        // should the screen scroll down? Set to false after screen clear.
        doScroll = false,

        // input element
        inputElem = document.getElementById( 'lineinput-field' ),

        // input element's X position in relation to the window
        inputX = 0,

        // has text been printed on screen?
        isTextPrinted = false,

        // prefix, i.e. the > or whatever else is shown before the input field
        prefixElem = document.getElementById( 'lineinput-prefix' ),

        // the parent prompt element
        promptElem = document.getElementById( 'lineinput' ),

        // new event type for others (mainly Vorple) who need to know when line
        // input is available
        lineinputReadyEvent = new CustomEvent( 'lineinputReady' );


    /**
     * Append the line input to the transcript.
     *
     * @param caret
     * @param inputText
     * @param targetContainer
     */
    function appendPrompt( caret, inputText, targetContainer ) {
        var target = haven.window.container.get( targetContainer ),
            lastLineinput = document.createElement( 'div' ),
            lastPrefix = document.createElement( 'span' ),
            lastCommand = document.createElement( 'span' );

        // remove the last marker from the previously last input
        var previousLastPrompt = document.getElementsByClassName( 'lineinput last' );

        for( var i = previousLastPrompt.length - 1; i >= 0; --i ) {
            previousLastPrompt[ i ].classList.remove( 'last' );
        }

        lastLineinput.className = 'lineinput last';
        lastPrefix.className = 'prompt-prefix';
        lastCommand.className = 'prompt-input';

        lastPrefix.innerHTML = caret;
        lastCommand.innerHTML = inputText;

        lastLineinput.appendChild( lastPrefix );
        lastLineinput.appendChild( lastCommand );

        target.appendChild( lastLineinput );
    }


    /**
     * Change the prompt input to next or previous command in the command history.
     *
     * @param delta 1 for next command, -1 for previous
     */
    function getCmdFromHistory( delta ) {
        var current = currentCmdHistory,
            new_current = current + delta;

        if( current === -1 ) {
            currentCmdText = inputElem.value;
        }

        // Check it's within range
        if( new_current < cmdHistory.length && new_current >= 0 )
        {
            inputElem.value = cmdHistory[ new_current ];
            currentCmdHistory = new_current;
        }
        else if( new_current === -1 ) {
            inputElem.value = currentCmdText;
            currentCmdHistory = new_current;
        }
    }


    /**
     * Resize the input field so that it fits on the same line as the prompt.
     */
    function resizeInput() {
        inputElem.style.width = ( haven.window.get( 0 ).clientWidth - inputX - 2 ) + 'px';
    }


    /**
     * Scroll down until text content becomes visible.
     */
    function scrollToContent() {
        var output = haven.window.get( 0 ),
            statusline = haven.window.get( 1 ),
            nodes = textNodesUnder( output ),
            scrolltop = (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0),
            nonWhitespaceRegex = /\S/,
            newScrollTop;

        for( var i = 0; i < nodes.length; ++i ) {
            if( nonWhitespaceRegex.test( nodes[i].textContent ) ) {
                newScrollTop = nodes[i].parentNode.getBoundingClientRect().top - window.innerHeight / 3;

                if( statusline ) {
                    newScrollTop += statusline.getBoundingClientRect().height;
                }

                if( scrolltop < newScrollTop ) {
                    window.scrollTo( 0, newScrollTop );
                }
                return;
            }
        }
    }


    /**
     * Get all text nodes contained by a DOM node
     *
     * From http://stackoverflow.com/a/10730777
     *
     * @param node
     * @returns {Array}
     */
    function textNodesUnder( node ) {
        var all = [];
        for( node = node.firstChild; node; node = node.nextSibling ) {
            if( node.nodeType == 3 ) {
                all.push( node );
            }
            else {
                all = all.concat( textNodesUnder( node ) );
            }
        }
        return all;
    }


    /**
     * Getter for the lineinput element.
     *
     * @returns {Element}
     */
    prompt.get = function() {
        return promptElem;
    };


    /**
     * Hide the prompt and stop expecting line input.
     */
    prompt.hide = function() {
        haven.input.setMode( 'buffer' );

        if( promptElem.parentNode ) {
            promptElem.parentNode.removeChild( promptElem );
        }
    };


    /**
     * Add, remove, and clear commands in the history.
     */
    prompt.history = {
        /**
         * Add a command to the command history.
         *
         * @param cmd
         * @returns {boolean} True if successful
         */
        add: function( cmd ) {
            if( cmd ) {
                cmdHistory.push( cmd );
                return true;
            }

            return false;
        },


        /**
         * Clear the entire command history.
         */
        clear: function() {
            cmdHistory = [];
        },


        /**
         * Returns a copy of the entire command history.
         *
         * @returns {Array}
         */
        get: function() {
            return cmdHistory.slice();
        },


        /**
         * Remove a single item from the command history.
         *
         * @param {number} index The index of the command to remove. If empty,
         *  the last command will be removed.
         * @returns {boolean} True if removal was successful.
         */
        remove: function( index ) {
            if( cmdHistory.length === 0 ) {
                return false;
            }

            if( typeof index !== 'number' ) {
                cmdHistory.pop();
                return true;
            }

            if( index < 0 || index >= cmdHistory.length ) {
                return false;
            }

            cmdHistory.splice( index, 1 );
        },


        /**
         * Sets a completely new command history.
         *
         * @param {Array} newHistory An array of strings that becomes the new
         *  command history.
         */
        set: function( newHistory ) {
            cmdHistory = newHistory.slice();
        }
    };


    /**
     * Initialize line input event handlers.
     */
    prompt.init = function() {

        // handle line input submission
        promptElem.addEventListener( 'submit', function( e ) {
            e.preventDefault();

            /*
             // Change accented characters to plain ASCII.
             // The engine doesn't receive non-ASCII characters correctly.
             input.value = input.value.replace( /[^\u0000-\u007E]/g, function( a ) {
             return diacriticsMap[ a ] || a;
             });
             */

            // save input to history
            if( inputElem.value !== cmdHistory[0] && /\S/.test( inputElem.value ) )
            {
                cmdHistory.unshift( inputElem.value );
            }

            // reset the current spot in the command history
            currentCmdHistory = -1;

            // append the command to the transcript, unless the submit events tells us not to
            if( !( e.detail && e.detail.silent ) ) {
                appendPrompt( prompt.prefix.get(), inputElem.value, 0 );
            }

            // pass the command to the engine
            Module.ccall(
                'haven_getline',
                'null',
                [ 'string' ],
                [ inputElem.value + '\n' ]
            );

            // cleanup
            inputElem.value = "";
            prompt.hide();
        }, false );

        // Command history. Adapted from Parchment.
        inputElem.addEventListener( 'keydown', function( e ) {
            var keyCode = e.which || e.keyCode;

            // Check for up/down to use the command history
            if ( keyCode === 38 ) // up -> prev
            {
                getCmdFromHistory( 1 );
                e.preventDefault();
            }
            if ( keyCode === 40 ) // down -> next
            {
                getCmdFromHistory( -1 );
                e.preventDefault();
            }
        }, false );

        // resize input field when window size changes
        window.addEventListener( 'resize', resizeInput, false );

        // remove the prompt from the DOM
        promptElem.parentNode.removeChild( promptElem );
    };


    /**
     * Returns true if the command prompt is ready for line input.
     */
    prompt.isReady = function() {
        return haven.input.getMode() === 'getline';
    };


    prompt.prefix = {
        /**
         * Get the current prompt prefix.
         *
         * @returns {string|*}
         */
        get: function() {
            return prefixElem.innerHTML;
        },

        /**
         * Set the caret (>) that's shown before the command input.
         * The caret is expected to be "clean" i.e. it's safe to use innerHTML
         * to place it in the element.
         *
         * @param {string} prefix
         */
        set: function( prefix ) {
            prefixElem.innerHTML = prefix;
        }
    };


    /**
     * Either scroll the page down one page, or if the prompt is visible,
     * set focus to the prompt.
     *
     * @param e
     */
    prompt.scrollOrFocus = function( e ) {
        var doc = document.documentElement,
            scrolltop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0),
            selection = window.getSelection ||
                function() {
                    return document.selection ? document.selection.createRange().text : '';
                },
            playAreaHeight = window.innerHeight;

        if( haven.window.get( 1 ) ) {
            playAreaHeight = window.innerHeight - haven.window.get( 1 ).getBoundingClientRect().height;
        }

        // let non-ASCII keycodes, navigation keys, keys pressed with ctrl/alt/cmd pass
        // so that they don't block browser shortcuts
        if( e && ( e.keycode === 32 || e.keyCode > 127 || e.altKey || e.ctrlKey || e.metaKey ) ) {
            return;
        }

        // Only intercept on things that aren't inputs and if the user isn't selecting text
        // and if the prompt is available
        if( !e || ( e.target && e.target.nodeName !== 'INPUT' && selection().toString() === '' ) ) {
            // If the input box is close to the viewport then focus it
            if( scrolltop + window.innerHeight > document.body.clientHeight - 40 ) {
                if( promptElem.parentNode ) {
                    window.scrollTo( 0, 9e9 );

                    // Manually reset the target in case focus/trigger don't - we don't want the trigger to recurse
                    inputElem.focus();

                    // Stop propagating after re-triggering it, so that the trigger will work for all keys
                    if( e && e.stopPropagation && document.activeElement !== inputElem ) {
                        e.stopPropagation();
                    }
                }
            }
            else {
                // if there's no prompt, scroll down one pageful
                if( doScroll ) {
                    window.scrollTo( 0, scrolltop + playAreaHeight - 40 );

                    // focus on the prompt if it's visible
                    if( promptElem.parentNode && scrolltop + playAreaHeight + window.innerHeight - 40 >= document.body.clientHeight ) {
                        inputElem.focus();
                    }

                    if( e && e.preventDefault ) {
                        e.preventDefault();
                    }
                }
                // otherwise just scroll the content into view
                else {
                    scrollToContent();
                }

                // Intercept the backspace key
                if( e && e.type === 'keydown' && (e.which || e.keyCode) === 8 ) {
                    return false;
                }
            }
        }

        isTextPrinted = false;
    };


    /**
     * Show the prompt and start expecting line input.
     */
    prompt.show = function() {
        haven.input.setMode( 'getline' );
        haven.buffer.flush();
        haven.window.get( 0 ).appendChild( promptElem );

        // calculate input's location and resize to fit
        inputX = prefixElem.offsetWidth;
        // inputX = inputElem.offsetLeft - haven.window.get( 0 ).offsetLeft;

        resizeInput();

        // scroll page down or give the prompt focus
        prompt.scrollOrFocus();
        doScroll = true;

        // do autosave when line input is expected
        // hugoui.autosave();

        //
        promptElem.dispatchEvent( lineinputReadyEvent );
    };

    haven.prompt = prompt;
})();