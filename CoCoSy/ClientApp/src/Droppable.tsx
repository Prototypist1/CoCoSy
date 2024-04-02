import React, { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';


interface DroppableProps {
    id: string;
    children: ReactNode;
}
function Droppable(props: DroppableProps) {
    const { isOver, setNodeRef } = useDroppable({
        id: props.id,
    });

    return (
        <div ref={setNodeRef} >
            {props.children}
        </div>
    );
}

export {Droppable }