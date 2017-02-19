(function() {
    "use strict";

    var buffer = {};

        // output buffers for all windows
    var outputBuffer = [ "" ];


    /**
     * Make text HTML-printable
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
     * Add text to the text buffer
     *
     * @param text
     * @param targetWindow
     */
    buffer.append = function( text, targetWindow ) {
        if( !outputBuffer[ targetWindow ] ) {
            outputBuffer[ targetWindow ] = "";
        }

        if( text.indexOf( '\n' ) > -1 || text.indexOf( '\r' ) > -1 ) {
            var nextLBR = Math.max( text.lastIndexOf( '\n' ), text.lastIndexOf( '\r' ) ) + 1;

            outputBuffer[ targetWindow ] += encodeHtml( text.substr( 0, nextLBR ) );
            haven.buffer.flush( targetWindow );
            outputBuffer[ targetWindow ] = encodeHtml( text.substr( nextLBR ) );
        }
        else {
            outputBuffer[ targetWindow ] += encodeHtml( text );
        }
    };

    
    /**
     * Print out the text buffer
     *
     * @param targetWindow
     */
    buffer.flush = function flush( targetWindow ) {
        if( targetWindow === undefined ) {
            for( var i in outputBuffer ) {
                flush( +i );
            }
        }

        if( !outputBuffer[ targetWindow ] || !haven.window.get( targetWindow ) ) {
            return;
        }

//        console.log('flushing', outputBuffer[ targetWindow ] );
        // if( outputBuffer[ targetWindow ] === '\n') debugger;

        haven.window.append( outputBuffer[ targetWindow ], targetWindow );
        outputBuffer[ targetWindow ] = "";

        if( targetWindow === 0 ) {
            haven.isTextPrinted = true;
        }
    };

    /**
     * Add a newline to the buffer.
     *
     * @param targetWindow
     */
    buffer.newline = function( targetWindow ) {
        if( outputBuffer[ targetWindow ] ) {
            outputBuffer[ targetWindow ] += '\n';
        }
        else {
            outputBuffer[ targetWindow ] = '\n';
        }

        haven.buffer.flush( targetWindow );
    };


    haven.buffer = buffer;
})();