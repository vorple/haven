(function() {
    "use strict";

        // currently set colors
    var currentColors = [ defaultColors( 0 ) ],
        // custom colors set by extra opcode 1100
        customColors = {},
        // container for text that's being flushed to the output
        flushedText = document.createElement( 'span' ),
        // currently set fonts
        font = [{
            bold: false,
            italic: false,
            underline: false,
            proportional: false,
            original: 0     // the original integer value of the font
        }],
        // output buffer
        outputBuffer = [ "" ],
        // the parent of Hugo windows
        outputContainer = document.getElementById( 'output' ),
        // list of all Hugo windows
        outputWindow = [ document.getElementById( 'window0' ) ],
        // cursor position
        position = [{
            col: null,
            line: null
        }],
        windowDimensions = [],
        useWindowing = hugojs_options.windowing;


    /**
     * Add lines to the output.
     *
     * @param amount Number of lines
     * @param column Number of spaces that are added to the last line
     * @param hugoWindow
     */
    function createLines( amount, column, hugoWindow ) {
        for( var i = 0; i < amount; ++i ) {
            var newlineFiller = document.createElement( 'span' );
            newlineFiller.className = 'font-fixed-width';
            newlineFiller.innerHTML = '\n';
            hugoui.getOutputWindow( hugoWindow ).appendChild( newlineFiller );
        }

        if( column > 0 ) {
            var spaceFiller = document.createElement( 'span' );
            spaceFiller.innerHTML = Array( column ).join( " " );
            spaceFiller.className = 'font-fixed-width';
            hugoui.getOutputWindow( hugoWindow ).appendChild( spaceFiller );
        }

        hugoui.position.reset( hugoWindow );
    }


    /**
     * Set the default colors to a font object
     *
     * @param hugoWindow
     * @returns {{text: number, background: number}}
     */
    function defaultColors( hugoWindow ) {
        if( hugoWindow === 1 ) {
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
     * Turn text HTML-printable
     *
     * @param text
     * @returns {string}
     */
    function encodeHtml( text ) {
        var encoded = "";
        for( var i = 0; i < text.length; ++i ) {

            // Extended Latin-1 characters need to be added as HTML entities
            if( text.charCodeAt( i ) > 127 ) {
                encoded += "&#" + text.charCodeAt( i ) + ";";
            }
            else {
                switch( text[ i ] ) {
                    case '&':
                        encoded += '&amp;';
                        break;

                    case '<':
                        encoded += '&lt;';
                        break;

                    case '>':
                        encoded += '&gt;';
                        break;

                    case '\r':
                        encoded += '\n';
                        break;

                    default:
                        encoded += text[ i ];
                        break;
                }
            }
        }

        return encoded;
    }


    /**
     * When the window size changes, measures the window width in characters.
     */
    function measureDimensions() {
        var dimensions = {
            window: {
                width: parseInt( window.getComputedStyle( outputContainer ).width, 10 ),
                height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
            },
            line: {},
            char: {}
        };

        var measureElem = document.createElement( 'span' ),
            outputDimensions = dimensions.window,
            measureElemHeight;

        measureElem.innerHTML = '00000<br>00000<br>00000';
        measureElem.className = 'font-fixed-width';
        measureElem.style.display = 'inline-block';

        outputContainer.appendChild( measureElem );

        dimensions.char.width = measureElem.offsetWidth / 5;
        dimensions.line.width = Math.floor( outputDimensions.width / dimensions.char.width - 1 );

        measureElem.style.display = 'block';
        measureElemHeight = measureElem.clientHeight;
        measureElem.innerHTML += '<br>00000<br>00000';
        dimensions.char.height = ( measureElem.clientHeight - measureElemHeight ) / 2;
        dimensions.line.height = Math.floor( outputDimensions.height / dimensions.char.height );

        measureElem.parentNode.removeChild( measureElem );

//        console.log(dimensions);
        return dimensions;
    }


    /**
     * Prints text to a specific spot in the text window.
     *
     * @param line
     * @param col
     * @param newContent
     * @param hugoWindow
     */
    function replacePart( line, col, newContent, hugoWindow ) {
//        console.log( 'Replacing line', line, 'col', col, 'with', newContent.innerHTML, 'in window', hugoWindow );
        var output = hugoui.getOutputWindow( hugoWindow ),
            nodes = textNodesUnder( output ),
            range = document.createRange(),
            textContent,
            currentLine = 1, currentCol = 1, startFound = false, endCounter = 0;

        var overflow = (function() {
            for( var i = 0; i < nodes.length; ++i ) {
                textContent = nodes[ i ].textContent;
                if( currentLine === line ) {
                    for( var j = 0; j < textContent.length; ++j ) {
                        if( startFound ) {
                            endCounter++;
                            if( endCounter === newContent.textContent.length || textContent[ j ] === '\n' ) {
                                range.setEnd( nodes[i], j );
                                return false;
                            }
                        }
                        else if( currentCol === col ) {
                            range.setStart( nodes[i], j );
                            startFound = true;
                            if( j === textContent.length - 1 ) {
                                range.setEnd( nodes[i], j );
                                return false;
                            }
                        }
                        else if( textContent[j] === '\n' ) {
                            var filler = document.createTextNode( Array( col - currentCol + 1 ).join( ' ' ) + '\n' );
                            nodes[i].textContent = textContent.substr( 0, j ) + ' ';
                            nodes[i].parentNode.insertBefore( filler, nodes[i].nextSibling );
                            range.setStart( filler, col - currentCol - 1 );
                            range.setEnd( filler, col - currentCol - 1 );
                            return false;
                        }

                        currentCol++;
                    }
                }
                else {
                    if( textContent.indexOf( '\n' ) > -1 ) {
                        currentLine++;
                    }
                }
            }

            return true;
        })();

        if( overflow ) {
            createLines( position[ hugoWindow ].line - currentLine, col, hugoWindow );
            output.appendChild( newContent );
            return;
        }

        if( newContent.textContent.indexOf( '\n' ) > -1 ) {
            newContent.textContent = newContent.textContent.replace( '\n', '' );
            position[ hugoWindow ].line++;
            position[ hugoWindow ].col = 1;
        }
        else {
            position[ hugoWindow ].col += newContent.textContent.length;
        }

        range.deleteContents();
        range.insertNode( newContent );

        if( !newContent.nextSibling ) {
            position[ hugoWindow ].line = null;
            position[ hugoWindow ].col = null;
        }
    }


    /**
     * Sets the cursor position for printing later.
     *
     * @param col
     * @param line
     * @param hugoWindow
     */
    function setPosition( col, line, hugoWindow ) {
        if( !position[ hugoWindow ] ) {
            position[ hugoWindow ] = {};
        }

        position[ hugoWindow ].col = col;
        position[ hugoWindow ].line = line;
    }


    /**
     * Send the window dimensions to the engine
     */
    function sendWindowDimensions() {
        var dimensions = measureDimensions();
//        console.log( 'sending dimensions', dimensions);

        Module.ccall(
            'hugo_set_window_dimensions',
            'null',
            [ 'number', 'number', 'number', 'number', 'number', 'number' ],
            [
                dimensions.window.width,
                dimensions.window.height,
                dimensions.line.width,
                dimensions.line.height,
                dimensions.char.width,
                dimensions.char.height
            ]
        );
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


    hugoui.color = {
        /**
         * Set colors in windows
         *
         * @param which
         * @param color
         * @param hugoWindow
         */
        set: function( which, color, hugoWindow ) {
            if( !currentColors[ hugoWindow ] ) {
                currentColors[ hugoWindow ] = defaultColors( hugoWindow );
            }

//                console.log( 'changing', which, 'color to', color, 'in window', hugoWindow );
            if( currentColors[ hugoWindow ][ which ] === color ) {
                // the color doesn't change, do nothing
                return;
            }

            hugoui.buffer.flush( hugoWindow );

            currentColors[ hugoWindow ][ which ] = color;
            setStyle( flushedText, hugoWindow );
        }
    };

    // can the screen be scrolled? Set to false after screen clear
    hugoui.doScroll = false;

    hugoui.font = {
        /**
         * Set font styles
         *
         * @param f
         * @param hugoWindow
         */
        set: function( f, hugoWindow ) {
            hugoui.buffer.flush( hugoWindow );

            if( !font[ hugoWindow ] ) {
                font[ hugoWindow ] = {};
            }

            font[ hugoWindow ].bold = !!( f & 1 );
            font[ hugoWindow ].italic = !!( f & 2 );
            font[ hugoWindow ].underline = !!( f & 4 );
            font[ hugoWindow ].proportional = !!( f & 8 );
            font[ hugoWindow ].original = f;

            setStyle( flushedText, hugoWindow );
        }
    };


    /**
     * Get all data required to later reconstruct the UI state.
     */
    hugoui.getUIState = function() {
        var windowContents = [],
            promptParent = hugoui.prompt.form.parentNode,
            lastChild;

        // put prompt away during the save
        if( promptParent ) {
            promptParent.removeChild( hugoui.prompt.form );
        }

        // remove the >
        lastChild =  outputWindow[ 0 ].lastChild;
        outputWindow[ 0 ].removeChild( lastChild );

        for( var i = 0; i < outputWindow.length; ++i ) {
            windowContents[ i ] = outputWindow[ i ].innerHTML;
        }

        // put back what was removed
        outputWindow[ 0 ].appendChild( lastChild );

        if( promptParent ) {
            promptParent.appendChild( hugoui.prompt.form );
        }

        // this should be done better, but remove the last line break
        // because restoring adds one back again
        var lastLbr = windowContents[ 0 ].lastIndexOf( '\n' );
        windowContents[ 0 ] = windowContents[ 0 ].substring( 0, lastLbr ) + windowContents[ 0 ].substring( lastLbr + 1 );

        return {
            cmdHistory: hugoui.getCmdHistory(),
            currentColors: currentColors,
            font: font,
            position: position,
            title: document.title,
            windowDimensions: windowDimensions,
            windowContents: windowContents
        };
    };


    /**
     * Restore saved UI state.
     */
    hugoui.restoreUI = function() {
        var state = hugoui.readUIState(),
            i;

        if( !state ) {
            return;
        }

        hugoui.clear();

        windowDimensions = state.windowDimensions;

        for( i = 0; i < state.windowContents.length; ++i ) {
            hugoui.window.create( i, windowDimensions[ i ].left, windowDimensions[ i ].top, windowDimensions[ i ].right, windowDimensions[ i ].bottom );
        }

        currentColors = state.currentColors;
        font = state.font;
        position = state.position;
        document.title = state.title || "HugoJS";

        for( i = 0; i < state.windowContents.length; ++i ) {
            outputWindow[ i ].innerHTML = state.windowContents[ i ];
            setStyle( outputWindow[ i ], i );
        }

        setStyle( document.body, 0 );

        // set the same style we had when saving
        Module.ccall(
            'hugojs_set_font',
            'null',
            [ 'int' ],
            [ font[0].original ]
        );

        Module.ccall(
            'hugojs_set_colors',
            'null',
            [ 'int', 'int' ],
            [ currentColors[0].text, currentColors[0].background ]
        );

        // restore command history
        hugoui.setCmdHistory( state.cmdHistory || [] );

        // scroll to the bottom
        window.scrollTo( 0, 9e9 );
        hugoui.doScroll = true;
    };


    /**
     * Pass outputWindow to other modules.
     */
    hugoui.getOutputWindow = function( hugoWindow ) {
        return outputWindow[ hugoWindow ];
    };


    /**
     * Remove the loader and send current window dimensions.
     *
     * Called by the engine when it needs to init the display.
     */
    hugoui.initScreen = function() {
        var loader = document.getElementById( 'loader' );

        if( loader ) {
            loader.parentNode.removeChild( loader );
        }

        sendWindowDimensions();
    };


    // tracks whether text has been printed in the main window since the last scroll
    hugoui.isTextPrinted = false;


    /**
     * Set the cursor position.
     */
    hugoui.position = {
        reset: function( hugoWindow ) {
            // if no window specified, reset all positions
            if( hugoWindow === undefined ) {
                position = {
                    col: null,
                    line: null
                };
            }
            else {
                setPosition( null, null, hugoWindow );
            }
        },

        set: function( column, line, hugoWindow ) {
//                console.log( 'setting position  line', line, 'col', column, 'window', hugoWindow );
            setPosition( column, line, hugoWindow );
        }
    };

    hugoui.scrollOrFocus = scrollOrFocus;

    hugoui.sendWindowDimensions = sendWindowDimensions;


    /**
     * Sets a custom color for a color code.
     */
    hugoui.setCustomColor = function( color, r, g, b ) {
        console.log( arguments );
        customColors[ color ] = [ r, g, b ];
        hugoui.buffer.flush();
    };

    /**
     * Sets the window title. Called by the engine.
     *
     * @param title
     */
    hugoui.setTitle = function( title ) {
        document.title = title;
    };


    hugoui.window = {
        /**
         * Create a new Hugo window.
         *
         * @param hugoWindow
         * @param left
         * @param top
         * @param right
         * @param bottom
         */
        create: function( hugoWindow, left, top, right, bottom ) {
//                console.log( 'creating window', hugoWindow + ':  left', left, 'top', top, 'right', right, 'bottom', bottom );
            var newWindow,
                dimensions = measureDimensions(),
                charHeight = dimensions.char.height;

            windowDimensions[ hugoWindow ] = {
                left: left,
                top: top,
                right: right,
                bottom: bottom
            };

            if( !useWindowing ) {
                return false;
            }

            // the main window only changes size
            if( hugoWindow === 0 ) {
//                outputWindow[0].style.paddingLeft = ( left - 1 ) + 'px';
                outputWindow[0].style.paddingTop = ( ( top - 1 ) * dimensions.char.height ) + 'px';
//                outputWindow[0].style.width = ( ( right + 1 ) * dimensions.char.width ) + 'px';
                return;
            }

            if( outputWindow[ hugoWindow ] ) {
                outputContainer.removeChild( outputWindow[ hugoWindow ] );
            }

            newWindow = document.createElement( 'div' );
            newWindow.id = 'window' + hugoWindow;
            newWindow.className = 'hugowindow';
            newWindow.style.height = charHeight * ( bottom - top + 1) + 'px';
            newWindow.style.top = ( ( top - 1 ) * charHeight ) + 'px';
            newWindow.style.marginLeft = ( left - 1 ) + 'px';
            newWindow.style.width = ( ( right - left + 2 ) * dimensions.char.width ) + 'px';

            outputContainer.appendChild( newWindow );

            outputWindow[ hugoWindow ] = newWindow;
            setStyle( newWindow, hugoWindow );
        }
    };


    /**
     * INIT
     */

    // send window dimensions to the engine when the screen size changes
    window.addEventListener( 'resize', sendWindowDimensions, false );

    window.hugoui = hugoui;
})( window.hugoui || {} );
