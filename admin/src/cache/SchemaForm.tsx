import React from 'react';
import {CacheSchema, defaultValue, fieldLabel, hasEditable, visibleProperties} from './schema';
import {SchemaView, Thumbnail} from './SchemaView';

interface Props {
    schema: CacheSchema|undefined;
    value: any;
    onChange: (value: any) => void;
    onImage: (src: string) => void;
}

/* Edits only the nodes marked `x-editable`; everything else is shown read-only.
   Objects are always walked into, since editable fields may sit anywhere below them. */
export function SchemaForm({schema, value, onChange, onImage}: Props) {
    if (!schema || schema['x-hidden']) {
        return null
    }

    if ('object' === schema.type) {
        if (!hasEditable(schema)) {
            return <SchemaView schema={schema} value={value} onImage={onImage}/>
        }
        const current = value && 'object' === typeof value ? value : {}

        return <div className="fields">
            {visibleProperties(schema).map(([key, property]) => <div className="field" key={key}>
                <div className="field-label">{fieldLabel(key, property)}{property['x-editable'] ? null : <span className="muted"> (read-only)</span>}</div>
                <div className="field-value">
                    <SchemaForm schema={property} value={current[key]} onImage={onImage} onChange={(next) => onChange({...current, [key]: next})}/>
                </div>
            </div>)}
        </div>
    }

    if (!schema['x-editable']) {
        return <SchemaView schema={schema} value={value} onImage={onImage}/>
    }

    if ('array' === schema.type) {
        return <ArrayForm schema={schema} value={value} onChange={onChange} onImage={onImage}/>
    }

    return <LeafInput schema={schema} value={value} onChange={onChange} onImage={onImage}/>
}

function ArrayForm({schema, value, onChange, onImage}: Props & {schema: CacheSchema}) {
    const items: any[] = Array.isArray(value) ? value : []
    const set = (next: any[]) => onChange(next)
    const move = (from: number, to: number) => {
        const next = [...items]
        next.splice(to, 0, next.splice(from, 1)[0])
        set(next)
    }

    return <div className="array-form">
        {items.map((item, index) => <div className="array-row" key={index}>
            <div className="array-item">
                <SchemaForm schema={schema.items} value={item} onImage={onImage} onChange={(next) => set(items.map((old, i) => i === index ? next : old))}/>
            </div>
            <div className="array-buttons">
                <button type="button" title="Move up" disabled={0 === index} onClick={() => move(index, index - 1)}>↑</button>
                <button type="button" title="Move down" disabled={items.length - 1 === index} onClick={() => move(index, index + 1)}>↓</button>
                <button type="button" title="Remove" className="danger" onClick={() => set(items.filter((_, i) => i !== index))}>✕</button>
            </div>
        </div>)}
        <button type="button" onClick={() => set([...items, defaultValue(schema.items)])}>+ Add</button>
    </div>
}

function LeafInput({schema, value, onChange, onImage}: Props & {schema: CacheSchema}) {
    if (schema.oneOf) {
        /* Options are addressed by index, so any const (null included) round-trips untouched. */
        const index = schema.oneOf.findIndex(option => option.const === value)

        return <select value={-1 === index ? '' : String(index)} onChange={(event) => onChange(schema.oneOf![Number(event.target.value)].const)}>
            {-1 === index ? <option value="" disabled>{String(value)} (unknown)</option> : null}
            {schema.oneOf.map((option, i) => <option key={i} value={String(i)}>{option.title ?? String(option.const)}</option>)}
        </select>
    }

    switch (schema.type) {
        case 'boolean':
            return <input type="checkbox" checked={!!value} onChange={(event) => onChange(event.target.checked)}/>
        case 'number':
        case 'integer':
            return <input type="number" step={'integer' === schema.type ? 1 : 'any'} value={null === value || undefined === value ? '' : value}
                          onChange={(event) => onChange('' === event.target.value ? null : Number(event.target.value))}/>
        default:
            if ('textarea' === schema.format) {
                return <textarea rows={6} value={value ?? ''} onChange={(event) => onChange(event.target.value)}/>
            }
            if ('image-url' === schema.format) {
                return <div className="image-input">
                    <input type="url" value={value ?? ''} onChange={(event) => onChange(event.target.value)}/>
                    {value ? <Thumbnail src={value} onOpen={onImage}/> : null}
                </div>
            }

            return <input type="text" value={value ?? ''} onChange={(event) => onChange(event.target.value)}/>
    }
}
