import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { IconPage } from './IconPage';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const isIconRoute = false; // window.location.pathname === '/icon';

root.render(
    <React.StrictMode>
        {isIconRoute ? <IconPage /> : <App />}
    </React.StrictMode>
);