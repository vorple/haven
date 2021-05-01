/**
 * Synchronize virtual filesystem status with IndexedDB.
 */
 export function syncfs() {
    FS.syncfs( false, function() {});
}
