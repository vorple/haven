(function() {
    "use strict";

    var win = {};

        // DOM containers for windows
    var outputWindows = [ document.getElementById( 'window0' ) ],
        // the parent of all windows
        mainContainer = document.getElementById( 'output' ),
        currentContainers = [ outputWindows[0] ],
        position = [],
        windowDimensions = [];


    /**
     * Add lines to the output.
     *
     * @param amount Number of lines
     * @param column Number of spaces that are added to the last line
     * @param havenWindow
     */
    function createLines( amount, column, havenWindow ) {
        for( var i = 0; i < amount; ++i ) {
            var newlineFiller = document.createElement( 'span' );
            newlineFiller.className = 'font-fixed-width';
            newlineFiller.innerHTML = '\n';
            outputWindows[ havenWindow ].appendChild( newlineFiller );
        }

        if( column > 0 ) {
            var spaceFiller = document.createElement( 'span' );
            spaceFiller.innerHTML = Array( column ).join( " " );
            spaceFiller.className = 'font-fixed-width';
            outputWindows[ havenWindow ].appendChild( spaceFiller );
        }

        win.position.reset( havenWindow );
    }


    /**
     * Prints text to a specific spot in the text window.
     *
     * @param line
     * @param col
     * @param newContent
     * @param havenWindow
     */
    function replacePart( line, col, newContent, havenWindow ) {
//        console.log( 'Replacing line', line, 'col', col, 'with', newContent.innerHTML, 'in window', havenWindow );
        var output = outputWindows[ havenWindow ],
            nodes = textNodesUnder( output ),
            range = document.createRange(),
            textContent,
            currentLine = 1, currentCol = 1, startFound = false, endCounter = 0;

        // check if the new content goes on top of existing content or does the
        // container "overflow" (i.e. new lines need to be created as a padding)
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
            createLines( position[ havenWindow ].line - currentLine, col, havenWindow );
            output.appendChild( newContent );
            return;
        }

        if( newContent.textContent.indexOf( '\n' ) > -1 ) {
            newContent.textContent = newContent.textContent.replace( '\n', '' );
            position[ havenWindow ].line++;
            position[ havenWindow ].col = 1;
        }
        else {
            position[ havenWindow ].col += newContent.textContent.length;
        }

        range.deleteContents();
        range.insertNode( newContent );

        if( !newContent.nextSibling ) {
            position[ havenWindow ].line = null;
            position[ havenWindow ].col = null;
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
     * Append content to a window.
     *
     * @param content
     * @param targetWindow
     */
    win.append = function( content, targetWindow ) {
        var textContainer = document.createElement( 'span' );

        if( !position[ targetWindow ] ) {
            position[ targetWindow ] = {
                col: null,
                line: null
            };
        }

        haven.style.apply( textContainer, targetWindow );
        textContainer.innerHTML = content;
        // console.log( content, content.length );

        if( position[ targetWindow ].col !== null && position[ targetWindow ].line !== null ) {
             replacePart( position[ targetWindow ].line, position[ targetWindow ].col, textContainer, targetWindow );
        }
        else {
//             outputWindows[ targetWindow ].appendChild( textContainer );
            currentContainers[ targetWindow ].appendChild( textContainer );
        }
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

            win.position.reset( targetWindow );
        }

        // don't scroll automatically right after clearing the main window
        if( targetWindow < 1 ) {
            // hugoui.doScroll = false;
        }
    };


    /**
     * Create a new window (Hugo only).
     *
     * @param outputWindow
     * @param left
     * @param top
     * @param right
     * @param bottom
     */
    win.create = function( outputWindow, left, top, right, bottom ) {
//        console.log( 'creating window', outputWindow + ':  left', left, 'top', top, 'right', right, 'bottom', bottom );
        var newWindow,
            dimensions = win.measureDimensions(),
            charHeight = dimensions.char.height,
            mainContainer = haven.window.get( 0 ).parentNode;

        windowDimensions[ outputWindow ] = {
            left: left,
            top: top,
            right: right,
            bottom: bottom
        };

        if( !haven.options.get( 'windowing' ) ) {
            return false;
        }

        // the main window only changes size
        if( outputWindow === 0 ) {
//                outputWindow[0].style.paddingLeft = ( left - 1 ) + 'px';
            haven.window.get( 0 ).style.paddingTop = ( ( top - 1 ) * dimensions.char.height ) + 'px';
//                outputWindow[0].style.width = ( ( right + 1 ) * dimensions.char.width ) + 'px';
            return;
        }

        if( haven.window.get( outputWindow ) ) {
            mainContainer.removeChild( haven.window.get( outputWindow ) );
        }

        newWindow = document.createElement( 'div' );
        newWindow.id = 'window' + outputWindow;
        newWindow.className = 'havenwindow font-fixed-width';
        newWindow.style.height = charHeight * ( bottom - top + 1) + 'px';
        newWindow.style.top = ( ( top - 1 ) * charHeight ) + 'px';
        newWindow.style.marginLeft = ( left - 1 ) + 'px';
        newWindow.style.width = ( ( right - left + 2 ) * dimensions.char.width ) + 'px';

        outputWindows[ outputWindow ] = newWindow;
        currentContainers[ outputWindow ] = newWindow;
        haven.window.container.append( newWindow, mainContainer );
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
     * Get all data required to later reconstruct the UI state.
     */
    win.getUIState = function() {
        var windowContents = [],
            promptElem = haven.prompt.get(),
            promptParent = promptElem.parentNode,
            lastChild;

        // put prompt away during the save
        if( promptParent ) {
            promptParent.removeChild( promptElem );
        }

        // remove the >
        lastChild = outputWindows[ 0 ].lastChild;
        outputWindows[ 0 ].removeChild( lastChild );

        for( var i = 0; i < outputWindows.length; ++i ) {
            windowContents[ i ] = outputWindows[ i ].innerHTML;
        }

        // put back what was removed
        outputWindows[ 0 ].appendChild( lastChild );

        if( promptParent ) {
            promptParent.appendChild( promptElem );
        }

        // this should be done better, but remove the last line break
        // because restoring adds one back again
        var lastLbr = windowContents[ 0 ].lastIndexOf( '\n' );
        windowContents[ 0 ] = windowContents[ 0 ].substring( 0, lastLbr ) + windowContents[ 0 ].substring( lastLbr + 1 );

        return {
            cmdHistory: haven.prompt.history.get(),
            currentColors: haven.style.color.get(),
            font: haven.style.font.get(),
            position: position,
            title: document.title,
            windowDimensions: windowDimensions,
            windowContents: windowContents
        };
    };


    /**
     * When the window size changes, measure the window width in characters (Hugo only)
     */
    win.measureDimensions = function() {
        var outputContainer = haven.window.get( 0 ).parentNode,
            dimensions = {
                window: {
                    width: parseInt( window.getComputedStyle( outputContainer ).width, 10 ),
                    height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
                },
                line: {},
                char: {}
            },
            measureElem = document.createElement( 'span' ),
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
    };


    /**
     * Set the cursor position inside the target window. Hugo only.
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

        set: function( col, line, havenWindow ) {
            if( !position[ havenWindow ] ) {
                position[ havenWindow ] = {};
            }

            position[ havenWindow ].col = col;
            position[ havenWindow ].line = line;
        }
    };


    /**
     * Set the window title
     *
     * @param title
     */
    win.setTitle = function( title ) {
        document.title = title;
    };

    haven.window = win;
})();