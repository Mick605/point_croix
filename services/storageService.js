class StorageClass {
    constructor() {
        this.load();
    }

    async load() {
        this.db = await idb.openDB('point_croix', 1, {
            upgrade(db, oldVersion, newVersion, transaction) {
                if (!db.objectStoreNames.contains('images')) {
                    db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
                }
            }
        })
    }

    async getAllImages() {
        return await this.db.getAll('images');
    }

    async getOneImage(id) {
        return await this.db.get('images', id);
    }

    async addImageInDb(imgObject) {
        await this.db.put('images', imgObject);

        let cursor = await this.db.transaction('images').store.openCursor(null, 'prev');
        return cursor.value;
    }

    async deleteImageInDb(imgObject) {
        await this.db.delete('images', imgObject.id);
    }
}

const Storage = new StorageClass();
export default Storage;