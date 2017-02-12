window.Module = {
    arguments: [],
    preRun: [],
    postRun: [ function() { haven.assets.finished( 'engine' ); } ],
    print: function( text ) {
        // The engine should always use the custom text printing methods.
        // Anything printed to stdout is an error.
        haven.error( text );
    },
    printErr: function() {
        console.log( arguments );
        haven.error( Array.prototype.slice.call(arguments).join(' ') );
    },
    TOTAL_MEMORY: 33554432  // Twice the default; this is enough to run any existing Glulx game.
};