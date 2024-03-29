
const CONTENTS = [
    ".",
    "index.css",
    "index.js"
];


// sw.js

const cache_name = "PWA_Cache"; // The string used to identify our cache

self.addEventListener("install", event => {
    event.waitUntil(
        caches
            .open(cache_name)
            .then(cache => {
                return cache.addAll(CONTENTS);
            })
            .catch(err => console.log(err))
    );
});

//Fetch first, and cache in fallback
async function getFromNetworkOrCache(request) {
    let response = null;
    
    try {
        response = await fetch(request);
    } catch {
        return caches.match(request)
    }

    const cache = await caches.open(cache_name);
    cache.put(request, response.clone());
    return response;
}


self.addEventListener('fetch', function(event) {
    let req = event.request;

    // If fetch is a navigation, answer with the "." ressource instead, to simulate serving a PWA
    if (req.mode === "navigate") {
        req = new Request(new URL(".", this.serviceWorker.scriptURL));
    }

    event.respondWith(getFromNetworkOrCache(req))
});



