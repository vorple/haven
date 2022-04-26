/**
 * Synchronize virtual filesystem status with IndexedDB.
 */
 let isSyncing = false;
 let queueResync = false;
 let callbackQueue = [];
 
  export function syncfs( toPersistent = false, callback = null ) {
     if( callback ) {
         callbackQueue.push( callback );
     }
 
     if( isSyncing ) {
         queueResync = true;
     }
     else {
         isSyncing = true;
 
         FS.syncfs( toPersistent, function() {
             isSyncing = false;
 
             if( queueResync ) {
                 queueResync = false;
                 syncfs( toPersistent );
             }
             else {
                 for( let i = 0; i < callbackQueue.length; ++i ) {
                     callbackQueue[i]();
                 }
 
                 callbackQueue = [];
             }
         });
     }
 }
 