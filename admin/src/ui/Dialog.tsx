import React, {ReactNode, useEffect, useRef} from 'react';

/* Native modal <dialog> : Esc closes it (through onClose), focus is trapped by the browser. */
export function Dialog({title, onClose, children, footer, wide = false}: {title: string, onClose: () => void, children: ReactNode, footer: ReactNode, wide?: boolean}) {
    const ref = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const dialog = ref.current
        if (dialog && !dialog.open) {
            dialog.showModal()
        }

        return () => dialog?.close()
    }, [])

    return <dialog ref={ref} className={wide ? 'wide' : undefined} onCancel={(event) => {
        event.preventDefault()
        onClose()
    }}>
        <h3>{title}</h3>
        <div className="dialog-body">{children}</div>
        <div className="dialog-footer">{footer}</div>
    </dialog>
}

export function ConfirmDialog({title, message, confirmLabel, busy, error, onConfirm, onClose}: {
    title: string,
    message: ReactNode,
    confirmLabel: string,
    busy: boolean,
    error: string|null,
    onConfirm: () => void,
    onClose: () => void,
}) {
    return <Dialog title={title} onClose={busy ? () => {} : onClose} footer={<>
        <button type="button" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="button" className="danger" onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</button>
    </>}>
        <p>{message}</p>
        {error ? <p className="warning">{error}</p> : null}
    </Dialog>
}
