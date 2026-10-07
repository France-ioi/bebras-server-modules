import {CacheSchema, fieldLabel, isPrimitive, optionTitle, visibleProperties} from './schema';

function Missing() {
    return <span className="empty">—</span>
}

export function Thumbnail({src, onOpen}: {src: string, onOpen: (src: string) => void}) {
    return <button type="button" className="thumbnail" onClick={() => onOpen(src)} title="View full size">
        <img src={src} alt="" loading="lazy"/>
    </button>
}

/* Read-only rendering of a cache value, driven by its schema. Fields are stacked one below the other. */
export function SchemaView({schema, value, onImage}: {schema: CacheSchema|undefined, value: any, onImage: (src: string) => void}) {
    if (schema?.['x-hidden']) {
        return null
    }
    /* Before the empty check : null may be one of the listed values. */
    const title = optionTitle(schema, value)
    if (null !== title) {
        return <span className="text">{title}</span>
    }
    if (null === value || undefined === value || '' === value) {
        return <Missing/>
    }

    if ('image-url' === schema?.format) {
        return 'string' === typeof value ? <Thumbnail src={value} onOpen={onImage}/> : <Missing/>
    }

    switch (schema?.type) {
        case 'object':
            if ('object' !== typeof value) {
                return <span>{String(value)}</span>
            }

            return <div className="fields">
                {visibleProperties(schema).map(([key, property]) => <div className="field" key={key}>
                    <div className="field-label">{fieldLabel(key, property)}</div>
                    <div className="field-value"><SchemaView schema={property} value={value[key]} onImage={onImage}/></div>
                </div>)}
            </div>
        case 'array':
            if (!Array.isArray(value)) {
                return <span>{String(value)}</span>
            }
            if (!value.length) {
                return <Missing/>
            }

            return <ul className={isPrimitive(schema.items) ? 'values' : 'values nested'}>
                {value.map((item, index) => <li key={index}><SchemaView schema={schema.items} value={item} onImage={onImage}/></li>)}
            </ul>
        case 'boolean':
            return <span>{value ? 'yes' : 'no'}</span>
        case 'string':
        case 'number':
        case 'integer':
            return <span className="text">{String(value)}</span>
        default:
            /* Untyped : show whatever is there. */
            return 'object' === typeof value
                ? <pre className="inline">{JSON.stringify(value, null, 2)}</pre>
                : <span className="text">{String(value)}</span>
    }
}
