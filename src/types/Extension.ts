export type MessagePayload = {
    action: 'processData';
    payload: {
        // Hier deine Datenstruktur definieren, z.B.
        key: string;
        value: any;
    };
};

export type MessageResponse = {
    status: 'success' | 'error';
    message?: string;
};
