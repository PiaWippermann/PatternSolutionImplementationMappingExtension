export type MessagePayload = {
    action: 'processData';
    payload: {
        // Hier deine Datenstruktur definieren, z.B.
        key: string;
        value: unknown;
    };
};

export type MessageResponse = {
    status: 'success' | 'error';
    message?: string;
};
