import React, {useEffect, useRef} from 'react';

/* Full-screen viewer : closes on Esc, on the ✕ button, or on a click outside the image.
   A modal <dialog> so it also stacks above an open edit dialog (both live in the top layer). */
export function ImageLightbox({src, onClose}: {src: string, onClose: () => void}) {
    const ref = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const dialog = ref.current
        if (dialog && !dialog.open) {
            dialog.showModal()
        }

        return () => dialog?.close()
    }, [])

    return <dialog ref={ref} className="lightbox" aria-label="Image viewer" onClick={onClose} onCancel={(event) => {
        event.preventDefault()
        onClose()
    }}>
        <button type="button" className="lightbox-close" aria-label="Close" onClick={onClose}>✕</button>
        <img src={src} alt="" onClick={(event) => event.stopPropagation()}/>
        <a className="lightbox-link" href={src} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>{src}</a>
    </dialog>
}
