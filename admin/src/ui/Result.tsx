import React from 'react';
import {Empty} from './Layout';

const IMAGE_URL = /^https?:\/\/[^\s"'<>]+\.(png|jpe?g|webp|gif|svg)(\?[^\s"'<>]*)?$/i

/* A generation result : an image url, JSON (pretty-printed), or raw text. */
export function Result({result}: {result: string|null}) {
    if (!result) {
        return <Empty>Empty result.</Empty>
    }

    const trimmed = result.trim()

    if (IMAGE_URL.test(trimmed)) {
        return <>
            <p><a href={trimmed}>{trimmed}</a></p>
            <p><img className="result" src={trimmed} alt="Generated image"/></p>
        </>
    }

    if (/^[\[{]/.test(trimmed)) {
        try {
            return <pre>{JSON.stringify(JSON.parse(trimmed), null, 2)}</pre>
        } catch (e) {
            /* not JSON after all, fall through */
        }
    }

    return <pre>{result}</pre>
}
