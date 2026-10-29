// Preparação comum a todos os testes (vitest.setupFiles).
import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Sem os globais do Vitest, o Testing Library não desmonta os componentes sozinho entre os testes.
afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
});

// O jsdom ainda não implementa os métodos do <dialog>.
HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.open = true;
};
HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.open = false;
};
