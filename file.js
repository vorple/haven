(function() {
    "use strict";

    var file = {};

    var interpreterLoaded = false,
        isGamefileLoaded = false,
        gamefile,
        checksum,
        datadir,
        storyFilename;


    /**
     * FNV32-algorithm to calculate the story file's checksum.
     * The checksum is used to name the directories for save games.
     *
     * Taken from https://codepen.io/ImagineProgramming/post/checksum-algorithms-in-javascript-checksum-js-engine
     */
    function fnv32( a ) {
        var len = a.length,
            fnv = 0;

        for( var i = 0; i < len; i++ ) {
            fnv = (fnv + (((fnv << 1) + (fnv << 4) + (fnv << 7) + (fnv << 8) + (fnv << 24)) >>> 0)) ^ (a[ i ] & 0xff);
        }

        return fnv >>> 0;
    }


    /**
     * Writes the loaded game file into the virtual file system, but only
     * if both the interpreter and the game file are both loaded.
     *
     * @return {boolean} true when all required assets have finished loading
     */
    function writeGamefile( done ) {
        if( !interpreterLoaded || !isGamefileLoaded ) {
            if( !interpreterLoaded ) {
                document.getElementById( 'loader-message' ).innerHTML = 'Loading interpreter';
            }
            else {
                document.getElementById( 'loader-message' ).innerHTML = 'Loading game file';
            }
        }

        document.getElementById( 'loader-message' ).innerHTML = 'Starting game';

        FS.writeFile(
            storyFilename,
            gamefile,
            { encoding: 'binary' }
        );

        // create the virtual savefile directory if it doesn't exist
        datadir = '/gamedata_' + checksum;

        if( !FS.analyzePath( datadir ).exists ) {
            FS.mkdir( datadir );
        }

        FS.mount( IDBFS, { root: '.' }, datadir );

        // create a directory for shared game data
        if( !FS.analyzePath( 'gamedata' ).exists ) {
            FS.mkdir( 'gamedata' );
        }

        FS.mount( IDBFS, { root: '.' }, 'gamedata' );
        FS.chdir( 'gamedata' );

        // synchronize with local data
        FS.syncfs( true, function() {
            if( haven.options.get( 'autosave' ) ) {
                haven.state.autosave.setName( '/gamedata_' + checksum + '/autosave' );
                haven.state.autosave.restore();
            }

            // start reacting to keypresses
            haven.input.keypress.init();

            done();
        });
    }


    /**
     * Start loading the story file.
     */
    file.init = function( virtualFilename ) {
        var gameUrl = haven.options.get( 'story' ),
            requestUrl,
            proxyOption = haven.options.get( 'use_proxy' ),
            useProxy;

        storyFilename = virtualFilename;

        if( !gameUrl ) {
            haven.error( "No story file specified" );
        }

        var xmlhttp = new XMLHttpRequest();

        switch( "" + proxyOption ) {
            case 'always':
            case 'true':
            case '1':
                useProxy = true;
                break;

            case 'never':
            case 'false':
            case '0':
                useProxy = false;
                break;

//          case 'auto':
            default:
                // use proxy for CORS requests
                useProxy = /^https?:\/\//.test( gameUrl ) && gameUrl.indexOf( window.location.protocol + '//' + window.location.host ) !== 0;

                // warn about invalid option
                if( proxyOption !== 'auto' ) {
                    console.warn( 'Unknown use_proxy option "' + proxyOption + '", using "auto"' );
                }
                break;
        }

        if( useProxy ) {
            requestUrl = haven.options.get( 'proxy_url' ).split( '%s' ).join( encodeURIComponent( gameUrl ) );
        }
        else {
            requestUrl = gameUrl;
        }

        haven.assets.addCallback( writeGamefile );

        xmlhttp.responseType = "arraybuffer";

        xmlhttp.onreadystatechange = function () {
            if( xmlhttp.readyState == XMLHttpRequest.DONE ) {
                switch( xmlhttp.status ) {
                    case 200:
                        isGamefileLoaded = true;
                        gamefile = new Uint8Array( xmlhttp.response );
                        checksum = fnv32( gamefile ).toString( 16 );

                        // signal that the story file is ready
                        haven.assets.finished( 'storyfile' );
                        break;

                    case 404:
                        haven.error( "Game file not found" );
                        break;

                    case 415:
                        if( useProxy ) {
                            haven.error( String.fromCharCode.apply( null, new Uint8Array( xmlhttp.response ) ) );
                        }
                        else {
                            haven.error( 'Unsupported Media Type error encountered when loading game file' );
                        }
                        break;

                    case 0:     // probably cross-origin error
                        haven.error( "Unspecified error loading game file (possibly cross-origin restriction)" );
                        break;

                    default:
                        haven.error( "Error loading game file. Server returned status code " + xmlhttp.status + " (" + xmlhttp.statusText + ")" );
                        break;
                }
            }
        };

        xmlhttp.open( "GET", requestUrl, true );
        // xmlhttp.setRequestHeader( 'X-Proxy-URL', gameUrl );
        xmlhttp.send();
    };


    /**
     * Ask the user to provide a file name.
     *
     * @param why The reason why a file is being prompted.
     *            One of "for command recording", "for command playback",
     *            "to restore", "to save" or "to begin transcription (or printer name)"
     */
    file.prompt = function( why ) {
        var filename = prompt( "Enter filename " + why );

        if( filename && /\S/.test( filename ) ) {
            haven.prompt.input.value = datadir + '/' + filename.split( '/' ).join( '-' );
        }
        else {
            haven.prompt.input.value = "";
        }

        // we'll have to wait for the UI to get ready before submitting the input
        setTimeout( function() {
            haven.prompt.form.dispatchEvent( new Event( 'submit' ) );

            // ..and another timeout to sync the filesystem.
            // We should hook to the file save itself, but this should do for now,
            // especially since this exists only as a backup measure if the
            // same thing in the onbeforeunload event fails.
            setTimeout( function() {
                FS.syncfs( false, function () {} );
            }, 1000 );
        }, 1 );
    };


    /**
     * Read the UI state from the filesystem.
     */
    file.readUIState = function() {
        try {
            var state = FS.readFile(
                autosaveFilename + '_haven_uidata',
                {encoding: 'utf8'}
            );

            return JSON.parse( state );
        }
        catch(e) {
            return null;
        }
    };


    /**
     * Synchronize virtual filesystem status with IndexedDB.
     * Called by the engine.
     */
    file.syncfs = function() {
        FS.syncfs( false, function() {} );
    };


    // store data saved by the game file
    window.onbeforeunload = function() {
        FS.syncfs( false, function() {} );
    };

    document.getElementById( 'loader-message' ).innerHTML = 'Loading interpreter and game file';

    haven.file = file;
})();
