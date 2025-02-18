import React from 'react';
import ReactDOM from 'react-dom/client';

import App from '../App';

const rootEl = document.getElementById(process.env.MOUNT_ID);
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
