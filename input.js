import { flush } from "./buffer";
import error from "./error";
import { get as getOption } from "./options";
import { get as getPrompt, scrollOrFocus, setDoScroll } from "./prompt";

// current mode of input the game expects: buffer, getkey, getline or endgame.
// null is no input accepted (during startup)
let inputMode = null;

// stores keypresses pressed when the engine isn't specifically expecting them ("buffer" inputMode)
const keypressBuffer = [];

let isTextPrinted = false;

// custom keypress hooks
let submitHook = null;

// is input blocked?
let blocked = false;

let keyResponse = () => {};

/**
 * Prevents user input.
 */
export function block() {
    blocked = true;
}


/**
 * Returns the current input mode.
 *
 * @returns {string}
 */
export function getMode() {
    return inputMode;
}


/**
 * Returns the isTextPrinted flag.
 */
export function getIsTextPrinted() {
    return isTextPrinted;
}


/**
 * Registers listeners and hooks
 *
 * @param {object} opt
 */
export function init( opt ) {
    // register hooks
    if( typeof opt.expectHook === "function" ) {
        keypress.addListener( opt.expectHook );
    }

    submitHook = opt.submitHook;

    // listen to keypresses and mouse clicks
    const keypressFunction = ( ...args ) => {
        if( !blocked ) {
            keypress.send( ...args );
        }
    };

    document.addEventListener( "keydown", keypressFunction, false );
    document.addEventListener( "click", keypressFunction, false );
}


/**
 * Returns the input block status
 *
 * @returns {boolean} True if blocked
 */
export function isBlocked() {
    return blocked;
}


const keypressListeners = [];

export const keypress = {
    /**
     * Add a listener that's called when the engine starts waiting for a keypress.
     *
     * @param {function} listener The function that's called
     * @returns {function} A function that will remove the listener when called.
     */
    addListener: function( listener ) {
        keypressListeners.push( listener );

        return () => keypress.removeListener( listener );
    },

    /**
     * Called when the game starts.
     */
    init: function() {
        // start expecting keypresses
        if( !inputMode ) {
            inputMode = "buffer";
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

    /**
     * Remove a keypress listener.
     *
     * @param {function} listener The function to remove
     * @returns {boolean} True if the listener was found and removed, false if it wasn't found as a listener
     */
    removeListener: function( listener ) {
        const index = keypressListeners.indexOf( listener );

        if( index === -1 ) {
            return false;
        }

        keypressListeners.splice( index, 1 );

        return true;
    },

    /**
     * Send the keypress to the engine.
     *
     * @param {object} e The keypress event.
     */
    send: function( e ) {
        const keyCode = e.keyCode;
        const isClick = e instanceof MouseEvent;
        const doc = document.documentElement;
        const scrolltop = ( window.pageYOffset || doc.scrollTop ) - ( doc.clientTop || 0 );
        const promptHidden = !getPrompt().parentNode;
        let shouldSendChar = false;

        // don't react to modifier keys
        if( e.altKey || e.ctrlKey || e.metaKey || e.shiftKey ) {
            return;
        }

        switch( inputMode ) {
            case "buffer":
                keypressBuffer.push( keyCode );
                break;

            case "getline":
            case null:
                // do nothing except scroll
                scrollOrFocus( e );
                return;

            case "getkey":
                if( e.preventDefault ) {
                    e.preventDefault();
                }
                // continue with script
                shouldSendChar = true;
                break;

            case "endgame":
                window.location = getOption( "exit_url" );
                return;

            default:
                error( "Interpreter error: unknown input mode " + inputMode );
        }

        // let the scroll handler take this if we're not at the end of the page
        if( scrolltop + window.innerHeight < document.body.clientHeight - ( promptHidden ? 0 : 40 ) ) {
            scrollOrFocus( e );

            // If the force flag is set, continue with the action.
            // Otherwise this was a user action and we can interpret it as
            // "just scroll to bottom".
            if( !e.force ) {
                return;
            }
        }

        inputMode = "buffer";

        if( shouldSendChar ) {
            if( typeof submitHook === "function" ) {
                const hook = submitHook({
                    event: e.force ? null : e,
                    input: isClick ? null : keyCode,
                    original: isClick ? null : keyCode,
                    userAction: !e.force,
                    mouseClick: isClick
                });

                if( typeof hook === "object" && hook.then ) {
                    hook.then( () => window.Glk.sendChar( keyCode ) );
                    return;
                }
            }

            if( window.Glk ) {
                window.Glk.sendChar( keyCode );
            }
            else {
                keyResponse( keyCode );
            }
        }

    },

    wait: function() {
        inputMode = "getkey";

        flush();
        scrollOrFocus();
        setDoScroll();

        setTimeout( () => {
            keypressListeners.forEach( listener => listener() );

            // if there's something in the keypress buffer, "push" that key
            if( keypressBuffer.length > 0 ) {
                keypress.send({ keyCode: keypressBuffer.shift() });
            }
        }, 1 );
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

/**
 * Unblock the UI.
 */
export function unblock() {
    blocked = false;
}
