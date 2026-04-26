import React, { useState } from 'react';
import { AppBackground } from './AppBackground';
import { TextEntry } from './TextEntry';

export function NameEntryPage({ onConfirm }: { onConfirm: (name: string) => void }) {
    const [name, setName] = useState('');
    return (
        <AppBackground >
            <TextEntry
                value={name}
                onChange={setName}
                onCommit={onConfirm}
                placeholder="Name"
                icon={"\uf058"}
                autoFocus
            />
        </AppBackground>
    );
}
