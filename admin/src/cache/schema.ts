import type {CacheSchema} from '../../../src/libs/admin/api_types';

export type {CacheSchema};

export function isPrimitive(schema: CacheSchema|undefined): boolean {
    return !schema || !schema.type || !['array', 'object'].includes(schema.type)
}

export function fieldLabel(key: string, schema: CacheSchema): string {
    return schema.title || key
}

export function visibleProperties(schema: CacheSchema): [string, CacheSchema][] {
    return Object.entries(schema.properties || {}).filter(([, property]) => !property['x-hidden'])
}

/* Whether anything under this node can be edited : decides if a field shows as an input. */
export function hasEditable(schema: CacheSchema|undefined): boolean {
    if (!schema) {
        return false
    }
    if (schema['x-editable']) {
        return true
    }
    if ('object' === schema.type) {
        return Object.values(schema.properties || {}).some(hasEditable)
    }

    return false
}

/* The label of a value of a closed list, or null when the schema has no such list. */
export function optionTitle(schema: CacheSchema|undefined, value: any): string|null {
    if (!schema?.oneOf) {
        return null
    }
    const option = schema.oneOf.find(option => option.const === value)

    return option ? option.title ?? String(option.const) : String(value)
}

/* The value a new array item starts with. */
export function defaultValue(schema: CacheSchema|undefined): any {
    if (schema?.oneOf?.length) {
        return schema.oneOf[0].const
    }
    switch (schema?.type) {
        case 'object':
            return Object.fromEntries(Object.entries(schema.properties || {}).map(([key, property]) => [key, defaultValue(property)]))
        case 'array':
            return []
        case 'number':
        case 'integer':
            return 0
        case 'boolean':
            return false
        default:
            return ''
    }
}

/* What element actions receive to designate an element : its `id` when it has one, its index otherwise. */
export function elementId(value: any, index: number): string|number {
    return value && 'object' === typeof value && null !== value.id && undefined !== value.id ? value.id : index
}
