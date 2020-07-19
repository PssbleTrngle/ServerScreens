import React, { useContext, useEffect, useRef } from 'react';

export interface DialogProps {
    text: string;
    buttons: {
        text: string;
        className?: string;
        click?: () => unknown
    }[];
}

export const GenericDialog = ({ dialog }: { dialog: DialogProps }) => {
    const { close } = useDialog();

    return (
        <div className='generic'>
            <p>{dialog.text}</p>
            <ul>
                {dialog.buttons.map(({ text, className, click }, i) =>
                    <button key={i} onClick={() => {
                        if (click) click();
                        close();
                    }} {...{ className }}>
                        {text}
                    </button>
                )}
            </ul>
        </div>
    )
}

const Dialog = () => {
    const [children] = useContext(DialogContext);
    const { close } = useDialog();
    const ref = useRef(null);

    useEffect(() => {
        const listener = (e: KeyboardEvent) => {
            if (e.keyCode === 27) close();
        }
        window.addEventListener('keydown', listener);
        return () => window.removeEventListener('keydown', listener);
    })

    return (
        <>
            {children && <div onClick={close} className='curtain' />}
            {/*<CSSTransition in={!!children} key='dialog' timeout={200} {...{ ref }}>*/}
            {children &&
                <div className='dialog enter-done' {...{ ref }}>
                    {children}
                </div>
            }
            {/*</CSSTransition>*/}
        </>
    )
}

const DialogContext = React.createContext<[
    JSX.Element | null,
    (d: JSX.Element | null) => void
]>([null, () => { }]);

export const useDialog = () => {
    const [, open] = useContext(DialogContext);
    const close = () => open(null);
    return { open, close };
}

export const Provider = DialogContext.Provider;

export default Dialog;