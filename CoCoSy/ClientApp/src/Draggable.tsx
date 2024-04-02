import React, { ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
interface DraggableProps {
    id: string;
    children: ReactNode;
    disabled: boolean;
}
function Draggable(props: DraggableProps) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: props.id, disabled: props.disabled
    });
    const style = {
        // Outputs `translate3d(x, y, 0)`
        transform: CSS.Translate.toString(transform),
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            {props.children}
        </div>
    );
}

export { Draggable }