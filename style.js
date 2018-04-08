import { flush } from "./buffer";
import { get as getOption } from "./options";
import { get as getPrompt } from "./prompt";

// currently set colors
let currentColors = [ defaultColors( 0 ) ];

// currently set fonts
let currentFont = [ defaultStyles() ];

// let engine decide text and background colors?
let engineColors = true;

// ignore font family settings? (proportional/fixed-width)
let ignoreFontFamily = false;


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
        proportional: true,
        original: 0     // the original integer value of the font
    };
}


/**
 * Set currently active font styles and colors to an element.
 *
 * @param elem
 * @param targetWindow
 */
export function apply( elem, targetWindow ) {
    const newClasses = [];
    const prompt = getPrompt().getElementsByTagName( 'INPUT' )[ 0 ];
    const setPromptStyle = (targetWindow === 0);

    if( !currentColors[ targetWindow ] ) {
        currentColors[ targetWindow ] = defaultColors( targetWindow );
    }

    if( engineColors ) {
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

    if( !currentFont[ targetWindow ] ) {
        currentFont[ targetWindow ] = defaultStyles();
    }

    for( let prop in currentFont[ targetWindow ] ) {
        if( ignoreFontFamily && prop === 'proportional' ) {
            continue;
        }

        if( currentFont[ targetWindow ].hasOwnProperty( prop ) ) {
            elem.classList.remove( "font-" + prop );

            if( setPromptStyle ) {
                prompt.classList.remove( "font-" + prop );
            }

            if( currentFont[ targetWindow ][ prop ] ) {
                newClasses.push( "font-" + prop );
            }
        }
    }

    if( !ignoreFontFamily && currentFont[ targetWindow ].hasOwnProperty( 'proportional' ) && !currentFont[ targetWindow ].proportional ) {
        newClasses.push( "font-fixed-width" );
    }

    for( let i = 0; i < newClasses.length; ++i ) {
        elem.classList.add( newClasses[ i ] );

        if( setPromptStyle ) {
            prompt.classList.add( newClasses[ i ] );
        }
    }
};


export const color = {
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

        if( currentColors[ targetWindow ][ which ] === color ) {
            // the color doesn't change, do nothing
            return;
        }

        flush( targetWindow );

        currentColors[ targetWindow ][ which ] = color;
    }
};


export const font = {
    get: function() {
        return currentFont;
    }
};


export function init( options ) {
    ignoreFontFamily = !options.engineFontFamily;
    engineColors = options.engineColors;
}


/**
 * Restore the entire style state.
 *
 * @param oldState
 */
export function restore( oldState ) {
    currentFont = oldState;
}


/**
 * Set a current style attribute.
 *
 * @param {string} type  bold, italic, underline, or proportional
 * @param {boolean} value
 * @param {number} targetWindow
 */
export function set( type, value, targetWindow ) {
    flush( targetWindow );
    currentFont[ targetWindow ][ type ] = value;
}
