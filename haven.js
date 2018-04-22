import {addCallback, finalCallback} from "./assets";
import {init as initFile} from "./file";
import {init as inputInit} from "./input";
import {remove} from "./loader";
import {init as initOptions} from "./options";
import {init as initPromt} from "./prompt";
import {init as initStyle} from "./style";
import FastClick from "./vendor/fastclick";

/**
 * Starts the C engine. The engine should have replaced main() with an
 * otherwise empty function that only stores the command line arguments
 * for passing to the real main() later.
 *
 * startEngine() calls haven_start() in the C code, which should run
 * the real main() function that has been renamed to something else.
 *
 * Example:
 *
 * static char **my_argv;
 *
 * int main(int argc, char *argv[])
 * {
     *    my_argv = argv;
     *    return 0;
     * }
 *
 * int EMSCRIPTEN_KEEPALIVE haven_start()
 * {
     *    return real_main(2, my_argv);
     * }
 *
 * int real_main(int argc, char *argv[])  // renamed from main()
 */
function startEngine() {
    _haven_start();
}


/**
 * Start the game. If assets haven't loaded yet, the game starts
 * as soon as they're ready.
 */
export function start( opt ) {
    // load the Emterpreter engine
    const xhr = new XMLHttpRequest();

    xhr.open( 'GET', 'engine.bin', true );
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
        Module.emterpreterFile = xhr.response;

        const script = document.createElement( 'script' );
        script.src = 'engine.js';
        document.body.appendChild( script );
    };
    xhr.send( null );

    // read options from URL
    initOptions( opt.options );

    // load the story file
    initFile( opt.virtualStoryfile );

    // set up input handlers
    addCallback( function( cb ) {
        inputInit();
        cb();
    } );

    // set up the prompt
    initPromt( {
        enginePrompt: !!opt.enginePrompt,
        unicode: !!opt.unicode
    } );

    // initialize style options
    initStyle( {
        engineColors: !!opt.engineColors,
        engineFontFamily: !!opt.engineFontFamily
    } );

    // remove the loader
    addCallback( function( cb ) {
        remove();
        cb();
    } );

    // start the engine
    finalCallback( startEngine );

    /**
     * fastclick.js initializer - fixes tapping issues in mobile browsers
     */
    if( 'addEventListener' in document ) {
        document.addEventListener( 'DOMContentLoaded', function() {
            FastClick.attach( document.body );
        }, false );
    }
}

import * as fileMethods from "./file";
import * as promptMethods from "./prompt";
import * as stateMethods from "./state";
import * as windowMethods from "./window";

// expose methods for the C engine to use
window.haven = {
    file: fileMethods,
    prompt: promptMethods,
    state: stateMethods,
    window: windowMethods
};