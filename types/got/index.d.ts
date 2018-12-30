// Type definitions for got 9.3
// Project: https://github.com/sindresorhus/got#readme
// Definitions by: BendingBender <https://github.com/BendingBender>
//                 Linus Unnebäck <https://github.com/LinusU>
//                 Konstantin Ikonnikov <https://github.com/ikokostya>
//                 Stijn Van Nieuwenhuyse <https://github.com/stijnvn>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.3

/// <reference types="node"/>

import { Url, URL } from 'url';
import * as http from 'http';
import * as https from 'https';
import * as nodeStream from 'stream';
import { CookieJar } from 'tough-cookie';

export = got;

declare class RequestError extends StdError {
    name: 'RequestError';
}

declare class ReadError extends StdError {
    name: 'ReadError';
}

declare class ParseError extends StdError {
    name: 'ParseError';
    statusCode: number;
    statusMessage: string;
}

declare class HTTPError extends StdError {
    name: 'HTTPError';
    statusCode: number;
    statusMessage: string;
    headers: http.IncomingHttpHeaders;
}

declare class MaxRedirectsError extends StdError {
    name: 'MaxRedirectsError';
    statusCode: number;
    statusMessage: string;
    redirectUrls: string[];
}

declare class UnsupportedProtocolError extends StdError {
    name: 'UnsupportedProtocolError';
}

declare class CancelError extends StdError {
    name: 'CancelError';
}

declare class TimeoutError extends StdError {
    name: 'TimeoutError';
}

declare class StdError extends Error {
    code?: string;
    host?: string;
    hostname?: string;
    method?: string;
    path?: string;
    protocol?: string;
    url?: string;
    response?: any;
}

declare const got: got.GotFn &
    Record<'get' | 'post' | 'put' | 'patch' | 'head' | 'delete', got.GotFn> &
    {
        stream: got.GotStreamFn & Record<'get' | 'post' | 'put' | 'patch' | 'head' | 'delete', got.GotStreamFn>;
        RequestError: typeof RequestError;
        ReadError: typeof ReadError;
        ParseError: typeof ParseError;
        HTTPError: typeof HTTPError;
        MaxRedirectsError: typeof MaxRedirectsError;
        UnsupportedProtocolError: typeof UnsupportedProtocolError;
        CancelError: typeof CancelError;
        TimeoutError: typeof TimeoutError;
    };

interface InternalRequestOptions extends https.RequestOptions {
    // Redeclare options with `any` type for allow specify types incompatible with http.RequestOptions.
    timeout?: any;
    agent?: any;
}

declare namespace got {
    interface GotFn {
        (url: GotUrl): GotPromise<string>;
        (url: GotUrl, options: GotJSONOptions): GotPromise<any>;
        (url: GotUrl, options: GotFormOptions<string>): GotPromise<string>;
        (url: GotUrl, options: GotFormOptions<null>): GotPromise<Buffer>;
        (url: GotUrl, options: GotBodyOptions<string>): GotPromise<string>;
        (url: GotUrl, options: GotBodyOptions<null>): GotPromise<Buffer>;
    }

    type GotStreamFn = (url: GotUrl, options?: GotOptions<string | null>) => GotEmitter & nodeStream.Duplex;

    type GotUrl = string | https.RequestOptions | Url | URL;

    /**
     * Hooks allow modifications during the request lifecycle. Hook functions may be async and are
     * run serially.
     *
     * @see https://github.com/sindresorhus/got#hooks
     * @template Options Request options.
     * @template Body Response body type.
     */
    interface Hooks<Options, Body extends Buffer | string | object> {
        beforeRequest?: Array<BeforeRequestHook<Options>>;
        beforeRedirect?: Array<BeforeRedirectHook<Options>>;
        beforeRetry?: Array<BeforeRetryHook<Options>>;
        afterResponse?: Array<AfterResponseHook<Options, Body>>;
    }

    /**
     * @param options Normalized request options.
     */
    type BeforeRequestHook<Options> = (options: Options) => any;

    /**
     * @param options Normalized request options.
     */
    type BeforeRedirectHook<Options> = (options: Options) => any;

    /**
     * @param options Normalized request options.
     * @param error Error from previous attempt.
     * @param retryCount Number of retry.
     */
    type BeforeRetryHook<Options> = (options: Options, error: GotError, retryCount: number) => any;

    /**
     * @param response Response object.
     * @param retryWithMergedOptions Retries request with the updated options.
     */
    type AfterResponseHook<Options, Body extends Buffer | string | object> = (
        response: Response<Body>,
        retryWithMergedOptions: (updateOptions: Options) => GotPromise<Body>
    ) => Response<Body> | Promise<Response<Body>>;

    interface GotBodyOptions<E extends string | null> extends GotOptions<E> {
        body?: string | Buffer | nodeStream.Readable;
        hooks?: Hooks<GotBodyOptions<E>, string | Buffer | nodeStream.Readable>;
    }

    interface GotJSONOptions extends GotOptions<string | null> {
        // Body must be an object or array. See https://github.com/sindresorhus/got/issues/511
        body?: object;
        form?: boolean;
        json: true;
        hooks?: Hooks<GotJSONOptions, object>;
    }

    interface GotFormOptions<E extends string | null> extends GotOptions<E> {
        body?: Record<string, any>;
        form: true;
        json?: boolean;
        hooks?: Hooks<GotFormOptions<E>, Record<string, any>>;
    }

    interface GotOptions<E extends string | null> extends InternalRequestOptions {
        baseUrl?: string;
        cookieJar?: CookieJar;
        encoding?: E;
        query?: string | object;
        timeout?: number | TimeoutOptions;
        retry?: number | RetryOptions;
        followRedirect?: boolean;
        decompress?: boolean;
        useElectronNet?: boolean;
        throwHttpErrors?: boolean;
        agent?: http.Agent | boolean | AgentOptions;
        cache?: Cache;
    }

    /**
     * Contains properties to constrain the duration of each phase of the request lifecycle.
     *
     * @see https://github.com/sindresorhus/got#timeout
     */
    interface TimeoutOptions {
        /**
         * Starts when a socket is assigned and ends when the hostname has been resolved. Does not
         * apply when using a Unix domain socket.
         */
        lookup?: number;
        /**
         * Starts when `lookup` completes (or when the socket is assigned if lookup does not apply
         * to the request) and ends when the socket is connected.
         */
        connect?: number;
        /**
         * Starts when `connect` completes and ends when the handshaking process completes (HTTPS
         * only).
         */
        secureConnect?: number;
        /**
         * Starts when the socket is connected. See [request.setTimeout](https://nodejs.org/api/http.html#http_request_settimeout_timeout_callback).
         */
        socket?: number;
        /**
         * Starts when the request has been written to the socket and ends when the response headers
         * are received.
         */
        response?: number;
        /**
         * Starts when the socket is connected and ends with the request has been written to the
         * socket.
         */
        send?: number;
        /**
         * Starts when the request is initiated and ends when the response's end event fires.
         */
        request?: number;
    }

    type RetryFunction = (retry: number, error: any) => number;

    interface RetryOptions {
        retries?: number | RetryFunction;
        methods?: Array<'GET' | 'PUT' | 'HEAD' | 'DELETE' | 'OPTIONS' | 'TRACE'>;
        statusCodes?: Array<408 | 413 | 429 | 500 | 502 | 503 | 504>;
        maxRetryAfter?: number;
    }

    interface AgentOptions {
        http: http.Agent;
        https: https.Agent;
    }

    interface Cache {
        set(key: string, value: any, ttl?: number): any;
        get(key: string): any;
        delete(key: string): any;
    }

    interface Response<B extends Buffer | string | object> extends http.IncomingMessage {
        body: B;
        url: string;
        requestUrl: string;
        fromCache: boolean;
        redirectUrls?: string[];
    }

    type GotPromise<B extends Buffer | string | object> = Promise<Response<B>> & { cancel(): void };

    interface GotEmitter {
        addListener(event: 'request', listener: (req: http.ClientRequest) => void): this;
        addListener(event: 'response', listener: (res: http.IncomingMessage) => void): this;
        addListener(event: 'redirect', listener: (res: http.IncomingMessage, nextOptions: GotOptions<string | null> & Url) => void): this;
        addListener(event: 'error', listener: (error: GotError, body?: any, res?: http.IncomingMessage) => void): this;
        addListener(event: 'downloadProgress', listener: (progress: Progress) => void): this;
        addListener(event: 'uploadProgress', listener: (progress: Progress) => void): this;

        on(event: 'request', listener: (req: http.ClientRequest) => void): this;
        on(event: 'response', listener: (res: http.IncomingMessage) => void): this;
        on(event: 'redirect', listener: (res: http.IncomingMessage, nextOptions: GotOptions<string | null> & Url) => void): this;
        on(event: 'error', listener: (error: GotError, body?: any, res?: http.IncomingMessage) => void): this;
        on(event: 'downloadProgress', listener: (progress: Progress) => void): this;
        on(event: 'uploadProgress', listener: (progress: Progress) => void): this;

        once(event: 'request', listener: (req: http.ClientRequest) => void): this;
        once(event: 'response', listener: (res: http.IncomingMessage) => void): this;
        once(event: 'redirect', listener: (res: http.IncomingMessage, nextOptions: GotOptions<string | null> & Url) => void): this;
        once(event: 'error', listener: (error: GotError, body?: any, res?: http.IncomingMessage) => void): this;
        once(event: 'downloadProgress', listener: (progress: Progress) => void): this;
        once(event: 'uploadProgress', listener: (progress: Progress) => void): this;

        prependListener(event: 'request', listener: (req: http.ClientRequest) => void): this;
        prependListener(event: 'response', listener: (res: http.IncomingMessage) => void): this;
        prependListener(event: 'redirect', listener: (res: http.IncomingMessage, nextOptions: GotOptions<string | null> & Url) => void): this;
        prependListener(event: 'error', listener: (error: GotError, body?: any, res?: http.IncomingMessage) => void): this;
        prependListener(event: 'downloadProgress', listener: (progress: Progress) => void): this;
        prependListener(event: 'uploadProgress', listener: (progress: Progress) => void): this;

        prependOnceListener(event: 'request', listener: (req: http.ClientRequest) => void): this;
        prependOnceListener(event: 'response', listener: (res: http.IncomingMessage) => void): this;
        prependOnceListener(event: 'redirect', listener: (res: http.IncomingMessage, nextOptions: GotOptions<string | null> & Url) => void): this;
        prependOnceListener(event: 'error', listener: (error: GotError, body?: any, res?: http.IncomingMessage) => void): this;
        prependOnceListener(event: 'downloadProgress', listener: (progress: Progress) => void): this;
        prependOnceListener(event: 'uploadProgress', listener: (progress: Progress) => void): this;

        removeListener(event: 'request', listener: (req: http.ClientRequest) => void): this;
        removeListener(event: 'response', listener: (res: http.IncomingMessage) => void): this;
        removeListener(event: 'redirect', listener: (res: http.IncomingMessage, nextOptions: GotOptions<string | null> & Url) => void): this;
        removeListener(event: 'error', listener: (error: GotError, body?: any, res?: http.IncomingMessage) => void): this;
        removeListener(event: 'downloadProgress', listener: (progress: Progress) => void): this;
        removeListener(event: 'uploadProgress', listener: (progress: Progress) => void): this;
    }

    type GotError = RequestError | ReadError | ParseError | HTTPError | MaxRedirectsError | UnsupportedProtocolError | CancelError | TimeoutError;

    interface Progress {
        percent: number;
        transferred: number;
        total: number | null;
    }
}
