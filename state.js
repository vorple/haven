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
         * Delete the autosave file.
         */
        remove: function() {
            try {
                FS.unlink( autosaveFilename );
            }
            catch(e) {}
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
        },

        save: function() {
            if( !haven.options.get( 'autosave' ) ) {
                return;
            }

            // save UI state
            FS.writeFile(
                autosaveFilename + '_uidata',
                JSON.stringify( haven.window.getUIState() ),
                { encoding: 'utf8' }
            );

            // trigger engine autosave
            Module.ccall(
                'haven_save_autosave',
                'int',
                [ 'string' ],
                [ autosaveFilename ]
            );
        },

        /**
         * Remember the autosave's filename
         * @param filename
         */
        setName: function( filename ) {
            autosaveFilename = filename;
        }
    };


    /**
     * Restore saved UI state.
     */
    state.restoreUI = function() {
        var savedState = readUIState(),
            windowCount,
            i;

        if( !savedState ) {
            return;
        }

        // if windowing has been set off in options, restore only the main window
        if( haven.options.get( 'windowing' ) ) {
            windowCount = savedState.windowContents.length;
        }
        else {
            windowCount = 1;
        }

        haven.window.clear();

        for( i = 0; i < windowCount; ++i ) {
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

        if( savedState.title ) {
            document.title = savedState.title;
        }

        for( i = 0; i < savedState.windowContents.length; ++i ) {
            haven.window.get( i ).innerHTML = savedState.windowContents[ i ];
            haven.style.apply( haven.window.get( i ), i );
        }

        haven.style.apply( document.body, 0 );

        // TODO: only for Hugo!
        // set the same style we had when saving
        Module.ccall(
            'hugojs_set_font',
            'null',
            [ 'int' ],
            [ savedState.font[0].original ]
        );

        Module.ccall(
            'hugojs_set_colors',
            'null',
            [ 'int', 'int' ],
            [ savedState.currentColors[0].text, savedState.currentColors[0].background ]
        );

        // restore command history
        haven.prompt.history.set( savedState.cmdHistory || [] );

        // scroll to the bottom
        window.scrollTo( 0, 9e9 );
        haven.prompt.setDoScroll();
    };


    window.haven.state = state;
})();