/**
 * Express 4 does not automatically forward rejected async handlers to
 * error middleware. Wrap async callbacks at router registration time so a
 * persistence failure reaches the terminal error response and releases any
 * response-scoped write lock.
 */
function wrapHandler(handler) {
    if (Array.isArray(handler)) {
        return handler.map(wrapHandler);
    }

    if (typeof handler !== "function" || handler.constructor?.name !== "AsyncFunction") {
        return handler;
    }

    if (handler.length === 4) {
        return function asyncErrorRouteHandler(error, req, res, next) {
            return Promise.resolve(handler(error, req, res, next)).catch(next);
        };
    }

    return function asyncRouteHandler(req, res, next) {
        return Promise.resolve(handler(req, res, next)).catch(next);
    };
}

export function wrapAsyncRouteHandlers(router) {
    for (const method of ["all", "delete", "get", "head", "options", "patch", "post", "put", "use"]) {
        const original = router[method].bind(router);
        router[method] = (...args) => original(...args.map(wrapHandler));
    }

    return router;
}
