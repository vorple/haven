window.Module = {
    arguments: [ '-q', '-u', '/storyfile.gblorb' ],
    preRun: [],
    postRun: [ function() { haven.assets.finished( 'engine' ); } ],
    print: function( text ) {
        // The engine should always use the custom hugoui text printing methods.
        // Anything printed to stdout is an error.
        haven.error( text );
    },
    printErr: function() {
        console.log( arguments );
        haven.error( Array.prototype.slice.call(arguments).join(' ') );
    }
};