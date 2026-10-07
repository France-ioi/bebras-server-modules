import React, {useState} from 'react';
import {CacheSchema, elementId} from './schema';
import {SchemaView} from './SchemaView';
import {SchemaForm} from './SchemaForm';
import {ConfirmDialog, Dialog} from '../ui/Dialog';
import {Empty} from '../ui/Layout';

type RunElementAction = (actionId: string, params: any) => Promise<void>;

interface Editing {
    index: number;
    draft: any;
}

/* One card per element of the cache, with the element actions declared in items['x-actions']. */
export function CacheGrid({schema, values, runAction, onImage}: {schema: CacheSchema, values: any[], runAction: RunElementAction, onImage: (src: string) => void}) {
    const itemSchema = schema.items
    const actions = itemSchema?.['x-actions'] || {}
    const [editing, setEditing] = useState<Editing|null>(null)
    const [deleting, setDeleting] = useState<number|null>(null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string|null>(null)

    if (!values.length) {
        return <Empty>The cache is empty.</Empty>
    }

    const close = () => {
        setEditing(null)
        setDeleting(null)
        setError(null)
    }

    const submit = async (actionId: string, params: any) => {
        setBusy(true)
        setError(null)
        try {
            await runAction(actionId, params)
            close()
        } catch (e) {
            setError((e as Error).message)
        } finally {
            setBusy(false)
        }
    }

    return <>
        <div className="cache-grid">
            {values.map((value, index) => <div className="card" key={String(elementId(value, index))}>
                <SchemaView schema={itemSchema} value={value} onImage={onImage}/>
                {actions.edit || actions.delete
                    ? <div className="card-actions">
                        {actions.edit ? <button type="button" onClick={() => setEditing({index, draft: structuredClone(value)})}>Edit</button> : null}
                        {actions.delete ? <button type="button" className="danger" onClick={() => setDeleting(index)}>Delete</button> : null}
                    </div>
                    : null}
            </div>)}
        </div>

        {editing && actions.edit
            ? <Dialog title={`Edit element #${editing.index + 1}`} wide onClose={busy ? () => {} : close} footer={<>
                <button type="button" onClick={close} disabled={busy}>Cancel</button>
                <button type="button" className="primary" disabled={busy}
                        onClick={() => submit(actions.edit!, {id: elementId(values[editing.index], editing.index), value: editing.draft})}>
                    {busy ? 'Saving…' : 'Save'}
                </button>
            </>}>
                <SchemaForm schema={itemSchema} value={editing.draft} onImage={onImage} onChange={(draft) => setEditing({...editing, draft})}/>
                {error ? <p className="warning">{error}</p> : null}
            </Dialog>
            : null}

        {null !== deleting && actions.delete
            ? <ConfirmDialog title="Delete element"
                             message={`Delete element #${deleting + 1} from the cache? This cannot be undone.`}
                             confirmLabel="Delete" busy={busy} error={error} onClose={close}
                             onConfirm={() => submit(actions.delete!, {id: elementId(values[deleting], deleting)})}/>
            : null}
    </>
}
