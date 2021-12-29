
const CONTENTS = [
    ".",
    "index.css",
    "index.js",
    "sw.js"
];


// sw.js

let cache_name = "PWA_Cache"; // The string used to identify our cache

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


//Cache first, then network and add to cache
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.open(cache_name).then(function(cache) {
            return cache.match(event.request).then(function (response) {
                return response || fetch(event.request).then(function(response) {
                    cache.put(event.request, response.clone());
                    return response;
                });
            });
        })
    );
});



