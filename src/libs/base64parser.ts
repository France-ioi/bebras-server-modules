import mime from 'mime';

type BufferResult = {
    ext: string | null;
    buffer: Buffer;
};

type Callback = (err: Error | false, result?: BufferResult) => void;

export default {
    createBuffer(data: string, callback: Callback): void {
        const regex = /^data:(.+);base64,(.*)$/;
        const match = data.match(regex);

        if (!match || match.length !== 3) {
            return callback(new Error("Can't parse base64 data"));
        }

        const mimeType = match[1];
        const base64Data = match[2];
        const ext = mime.getExtension(mimeType);

        callback(false, {
            ext,
            buffer: Buffer.from(base64Data, 'base64'),
        });
    },
}
