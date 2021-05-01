import { addCallback, finalCallback, finished } from "./assets";
import { init as initInput } from "./input";
import { init as initBuffer } from "./buffer";
import { remove } from "./loader";
import { init as initOptions } from "./options";
import { init as initPrompt } from "./prompt";
import { init as initStyle } from "./style";
import { init as initWindow } from "./window";

// hook that's called when the game ends (engine stops)
let quitHook = null;


/**
 * Start the game. If assets haven't loaded yet, the game starts
 * as soon as they're ready.
 */
export async function start( opt ) {
    // create the HTML structure
    let havenElement;
    let containerId = "haven";  // default main container id

    // opt.container can supply a different main container element or id
    if( opt.container instanceof Element ) {
        havenElement = opt.container;
    }
    else if( opt.container && typeof opt.container === "string" ) {
        havenElement = document.querySelector( opt.container );

        if( !havenElement ) {
            if( opt.container.charAt( 0 ) === "#" && opt.container.indexOf( " " ) === -1 ) {
                containerId = opt.container.substr( 1 );
            }
            else {
                throw new Error( `Can't find element "${opt.container}" to use as the main container` );
            }
        }
    }
    else {
        havenElement = document.getElementById( "haven" );
    }

    if( !havenElement ) {
        havenElement = document.createElement( "main" );
        havenElement.id = containerId;
        document.body.appendChild( havenElement );
    }

    let outputElement = document.getElementById( "output" );

    if( !outputElement ) {
        outputElement = document.createElement( "div" );
        outputElement.id = "output";
        havenElement.appendChild( outputElement );
    }

    let windowElement = document.getElementById( "window0" );

    if( !windowElement ) {
        windowElement = document.createElement( "div" );
        windowElement.id = "window0";
        windowElement.setAttribute( "aria-live", "polite" );
        windowElement.setAttribute( "aria-atomic", "false" );
        windowElement.setAttribute( "aria-relevant", "additions" );

        outputElement.appendChild( windowElement );
    }

    let loaderContainer = document.getElementById( "loader" );

    if( !loaderContainer ) {
        loaderContainer = document.createElement( "div" );
        loaderContainer.id = "loader";
        havenElement.appendChild( loaderContainer );
    }

    let loaderMessageElement = document.getElementById( "loader-message" );

    if( !loaderMessageElement ) {
        loaderMessageElement = document.createElement( "h2" );
        loaderMessageElement.id = "loader-message";
        loaderContainer.appendChild( loaderMessageElement );
    }

    let spinnerElement = document.getElementById( "spinner" );

    if( !spinnerElement ) {
        spinnerElement = document.createElement( "h2" );
        spinnerElement.id = "spinner";
        spinnerElement.innerText = ".";
        loaderContainer.appendChild( spinnerElement );
    }

    loaderMessageElement.innerText = "Loading interpreter and game file";

    // read options from URL
    initOptions( opt.options );

    // load the story file
    const storyFile = opt.loadStoryFile ? await opt.loadStoryFile( opt.virtualStoryfile ) : null;

    // set up window elements
    initWindow();

    // set up input handlers
    initInput({
        expectHook: opt.hooks && opt.hooks.expectKeypress,
        submitHook: opt.hooks && opt.hooks.submitKeypress
    });

    // set up output handlers
    initBuffer({
        outputFilter: opt.hooks && opt.filters.output
    });

    // set up the prompt
    initPrompt({
        engineInputFunction: opt.engineInputFunction,
        enginePrompt: !!opt.enginePrompt,
        expectHook: opt.hooks && opt.hooks.expectCommand,
        inputFilter: opt.filters && opt.filters.input,
        submitHook: opt.hooks && opt.hooks.submitCommand,
        unicode: !!opt.unicode
    });

    // initialize style options
    initStyle({
        engineColors: !!opt.engineColors,
        engineFontFamily: !!opt.engineFontFamily
    });

    // remove the loader
    addCallback( remove );

    // add the quit hook
    if( opt.hooks && opt.hooks.quit ) {
        quitHook = opt.hooks.quit;
    }

    // start the engine
    finalCallback( () => opt.startEngine( storyFile ) );

    finished( "storyfile" );
}


import * as bufferMethods from "./buffer";
import * as fileMethods from "./file";
import * as inputMethods from "./input";
import * as promptMethods from "./prompt";
import * as stateMethods from "./state";
import * as windowMethods from "./window";

// expose methods for the C engine to use
window.haven = {
    buffer: bufferMethods,
    file: fileMethods,
    input: inputMethods,
    prompt: promptMethods,
    state: stateMethods,
    window: windowMethods
};


/**
 * Called by the engine to tell that the game has ended
 */
export function engineStops() {
    if( typeof quitHook === "function" ) {
        quitHook();
    }
}
