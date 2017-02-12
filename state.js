(function() {
    "use strict";

    var state = {};

    var autosaveFilename = "";


    /**
     * Read the UI state from the filesystem.
     */
    var readUIState = function() {
        try {
            var state = FS.readFile(
                autosaveFilename + '_uidata',
                {encoding: 'utf8'}
            );

            return JSON.parse( state );
        }
        catch(e) {
            return null;
        }
    };


    state.autosave = {
        /**
         * Remember the autosave's filename
         * @param filename
         */
        setName: function( filename ) {
            autosaveFilename = filename;
        },

        /**
         * Pass the autosave's filename to the engine that takes care of
         * reloading the save.
         */
        restore: function() {
            try {
                // Try to open the autosave file.
                // If it doesn't exist, this throws an error.
                FS.stat( autosaveFilename );

                Module.ccall(
                    'hugojs_set_autosave_filename',
                    'null',
                    [ 'string' ],
                    [ autosaveFilename ]
                );
            }
            catch(e) {
                // autosave file doesn't exist, do nothing
            }
        }
    };


    /**
     * Restore saved UI state.
     */
    state.restoreUI = function() {
        var savedState = readUIState(),
            i;

        if( !savedState ) {
            return;
        }

        haven.window.clear();

        for( i = 0; i < savedState.windowContents.length; ++i ) {
            haven.window.create(
                i,
                savedState.windowDimensions[ i ].left,
                savedState.windowDimensions[ i ].top,
                savedState.windowDimensions[ i ].right,
                savedState.windowDimensions[ i ].bottom
            );
        }

        haven.style.color.restore( savedState.currentColors );
        haven.style.restore( savedState.font );
        haven.window.position.restore( savedState.position );
        document.title = savedState.title || "HugoJS";

        for( i = 0; i < savedState.windowContents.length; ++i ) {
            haven.window.get( i ).innerHTML = savedState.windowContents[ i ];
            haven.style.apply( outputWindow[ i ], i );
        }

        haven.style.apply( document.body, 0 );

        /* ***
        // set the same style we had when saving
        Module.ccall(
            'hugojs_set_font',
            'null',
            [ 'int' ],
            [ font[0].original ]
        );

        Module.ccall(
            'hugojs_set_colors',
            'null',
            [ 'int', 'int' ],
            [ currentColors[0].text, currentColors[0].background ]
        );

        */

        // restore command history
        haven.prompt.history.set( savedState.cmdHistory || [] );

        // scroll to the bottom
        window.scrollTo( 0, 9e9 );
       // hugoui.doScroll = true;
    };


    window.haven.state = state;
})();