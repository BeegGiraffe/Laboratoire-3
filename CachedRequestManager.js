import * as utilities from "./utilities.js";
import * as serverVariables from "./serverVariables.js";

let requestCachesExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");

global.requestCaches = [];
global.cachedRepositoriesCleanerStarted = false;

export default class CachedRequestManager {
    static startCachedRequestsCleaner() {
        /* démarre le processus de nettoyage des caches périmées */
        setInterval(CachedRequestManager.flushExpired, requestCachesExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic requests data caches cleaning process started...]");
    }
    static add(url, content, ETag = "") {
        /* mise en cache */
        if (!cachedRepositoriesCleanerStarted) {
            cachedRepositoriesCleanerStarted = true;
            CachedRequestManager.startCachedRequestsCleaner();
        }
        if (url != "") {
            CachedRequestManager.clear(url);
            requestCaches.push({
                url,
                content,
                ETag,
                Expire_Time: utilities.nowInSeconds() + requestCachesExpirationTime
            });
            console.log(BgWhite + FgBlue, `[Data of ${url} request has been cached]`);
        }
    }
    static find(url) {
        /* retourne la cache associée à l'url */
        try {
            if (url != "") {
                for (let cache of requestCaches) {
                    if (cache.url == url) {
                        // renew cache
                        cache.Expire_Time = utilities.nowInSeconds() + requestCachesExpirationTime;
                        console.log(BgWhite + FgBlue, `[${cache.url} data retrieved from cache]`);
                        return cache;
                    }
                }
            }
        } catch (error) {
            console.log(BgWhite + FgRed, "[request cache error!]", error);
        }
        return null;
    }
    static clear(url) {
        /* efface la cache associée à l’url */
        if (url != "") {
            let indexToDelete = [];
            let index = 0;
            for (let cache of requestCaches) {
                if (cache.url == url) indexToDelete.push(index);
                index++;
            }
            utilities.deleteByIndex(requestCaches, indexToDelete);
        }
    }
    static flushExpired() {
        /* efface les caches expirées */
        let now = utilities.nowInSeconds();
        for (let cache of requestCaches) {
            if (cache.Expire_Time <= now) {
                console.log(BgWhite + FgBlue, "Cached file data of " + cache.url + ".json expired");
            }
        }
        requestCaches = requestCaches.filter( cache => cache.Expire_Time > now);
    }
    static get(HttpContext) {
        /*Chercher la cache correspondant à l'url de la requête. Si trouvé,
        Envoyer la réponse avec
        HttpContext.response.JSON( content, ETag, true /* from cache )*/
        if (HttpContext.url != "") {
            for (let cache of requestCaches) {
                if (HttpContext.url == cache.url) {
                    HttpContext.response.JSON( cache.content, cache.ETag, true);
                    return cache;
                }
            }
        }
    }
}
