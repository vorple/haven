import { textWasPrinted } from "./input";

// output buffers for all windows
const outputBuffer = [ "" ];


/**
 * Make text HTML-printable
 *
 * @param text
 * @returns {string}
 */
function encodeHtml( text ) {
    let encoded = "";
    for( let i = 0; i < text.length; ++i ) {

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
export function append( text, targetWindow ) {
    if( !outputBuffer[ targetWindow ] ) {
        outputBuffer[ targetWindow ] = "";
    }

    if( text.indexOf( '\n' ) > -1 || text.indexOf( '\r' ) > -1 ) {
        const nextLBR = Math.max( text.lastIndexOf( '\n' ), text.lastIndexOf( '\r' ) ) + 1;

        outputBuffer[ targetWindow ] += encodeHtml( text.substr( 0, nextLBR ) );
        flush( targetWindow );
        outputBuffer[ targetWindow ] = encodeHtml( text.substr( nextLBR ) );
    }
    else {
        outputBuffer[ targetWindow ] += encodeHtml( text );
    }
}


/**
 * Print out the text buffer
 *
 * @param targetWindow
 */
export function flush( targetWindow ) {
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
        textWasPrinted( true );
    }
}

/**
 * Add a newline to the buffer.
 *
 * @param targetWindow
 */
export function newline( targetWindow ) {
    if( outputBuffer[ targetWindow ] ) {
        outputBuffer[ targetWindow ] += '\n';
    }
    else {
        outputBuffer[ targetWindow ] = '\n';
    }

    flush( targetWindow );
}
