import { flush } from "./buffer";
import { scrollOrFocus, setDoScroll } from "./prompt";
import error from "./error";

// current mode of input the game expects: buffer, getkey, getline or endgame.
// null is no input accepted (during startup)
let inputMode = null;

// stores keypresses pressed when the engine isn't specifically expecting them ("buffer" inputMode)
const keypressBuffer = [];

let isTextPrinted = false;


/**
 * Returns the current input mode.
 *
 * @returns {string}
 */
export function getMode() {
    return inputMode;
}


export function init() {
    // listen to keypresses and mouse clicks
    document.addEventListener( 'keydown', keypress.send, false );
    document.addEventListener( 'click', keypress.send, false );
}


let keyResponse = function() {};

export const keypress = {
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
        flush();

        if( isTextPrinted ) {
            scrollOrFocus();
        }

        return keypressBuffer.length > 0;
    },

    send: function( e ) {
        const keyCode = e.keyCode;
        const doc = document.documentElement;
        const scrolltop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

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
                scrollOrFocus( e );
                return;

            case 'getkey':
                // continue with script
                break;

            case 'endgame':
                window.location = hugojs_options.exit_url;
                return;

            default:
                error( 'Interpreter error: unknown input mode ' + inputMode );
        }

        inputMode = 'buffer';

        // let the scroll handler take this if we're not at the end of the page
        if( scrolltop + window.innerHeight < document.body.clientHeight - 40 ) {
            scrollOrFocus( e );
            return;
        }

        keyResponse( keyCode );
    },

    wait: function() {
        inputMode = 'getkey';

        flush();
        setDoScroll();

        // if there's something in the keypress buffer, "push" that key
        if( keypressBuffer.length > 0 ) {
            setTimeout( () => keypress.send({ keyCode: keypressBuffer.shift() }), 0 );
        }
    },

    waitPromise: function() {
        return new Promise( resolve => {
            keyResponse = ( cmd ) => resolve( cmd );
        });
    }
};


/**
 * Set a new input mode.
 *
 * @param mode
 */
export function setMode( mode ) {
    inputMode = mode;
}


/**
 * Makes a note that text has been printed on the screen since last check
 *
 * @param newState
 */
export function textWasPrinted( newState = true ) {
    isTextPrinted = newState;
}

export function getTextWasPrinted() {
    return textWasPrinted;
}