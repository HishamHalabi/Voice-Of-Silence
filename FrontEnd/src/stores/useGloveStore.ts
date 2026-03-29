import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GLOVE_LOGIC_INTERNAL_CONFIG, LineBreakTransformer } from '@/lib/glove-logic';

// @ts-ignore
interface SerialPort extends EventTarget {
    open(options: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
    readable: ReadableStream<string> | null;
}

interface GloveState {
    // @ts-ignore
    ports: SerialPort[];
    readers: ReadableStreamDefaultReader[];
    detectedDevices: [boolean, boolean];
    isCollecting: boolean;
    minValues: number[];
    maxValues: number[];
    arduino1Data: number[];
    arduino2Data: number[];

    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    toggleCollecting: () => void;
    updateData: (data: number[], arduinoIndex: 1 | 2) => void;
    resetCalibration: () => void;
}

export const useGloveStore = create<GloveState>()(
    persist(
        (set, get) => ({
            ports: [],
            readers: [],
            detectedDevices: [false, false],
            isCollecting: false,
            minValues: Array(7).fill(1023),
            maxValues: Array(7).fill(0),
            arduino1Data: [0, 0, 0, 0, 0],
            arduino2Data: [0, 0],

            connect: async () => {
                // @ts-ignore
                if (!navigator.serial) {
                    throw new Error('Web Serial not supported in this browser');
                }

                try {
                    // 1. Check if we already have a suitable port authorized
                    const existingPorts = await navigator.serial.getPorts();
                    let port = null;

                    // If we have existing ports, let's see if one is available and not already in use
                    if (existingPorts.length > 0) {
                        // Filter out ports we already have in our state
                        const available = existingPorts.filter(p => !get().ports.includes(p));
                        if (available.length > 0) {
                            port = available[0];
                        }
                    }

                    // 2. If no available existing port, request a new one
                    if (!port) {
                        // @ts-ignore
                        const options = GLOVE_LOGIC_INTERNAL_CONFIG.portFilters.length > 0
                            ? { filters: GLOVE_LOGIC_INTERNAL_CONFIG.portFilters }
                            : {};
                        // @ts-ignore
                        port = await navigator.serial.requestPort(options);
                    }

                    // 3. Attempt to open safely
                    try {
                        await port.open({ baudRate: GLOVE_LOGIC_INTERNAL_CONFIG.baudRate });
                    } catch (openErr: any) {
                        if (openErr.name === 'InvalidStateError') {
                            // Port might already be open. Let's try to proceed if we can.
                            console.warn("Port already open, continuing...");
                        } else {
                            throw openErr;
                        }
                    }

                    const reader = port.readable!
                        .pipeThrough(new TextDecoderStream())
                        .pipeThrough(new TransformStream(new LineBreakTransformer()))
                        .getReader();

                    set(state => ({
                        ports: [...state.ports, port],
                        readers: [...state.readers, reader]
                    }));

                    // Listening loop
                    (async () => {
                        try {
                            while (true) {
                                const { value, done } = await reader.read();
                                if (done) break;
                                if (value) {
                                    const parts = value.trim().match(/\d+/g)?.map(Number);
                                    if (parts) {
                                        if (parts.length === 5) {
                                            get().updateData(parts, 1);
                                        } else if (parts.length === 2) {
                                            get().updateData(parts, 2);
                                        }
                                    }
                                }
                            }
                        } catch (err) {
                            console.error('Stream processing error:', err);
                        } finally {
                            reader.releaseLock();
                            // If stream stops, remove from our active lists
                            set(state => ({
                                ports: state.ports.filter(p => p !== port),
                                readers: state.readers.filter(r => r !== reader)
                            }));
                        }
                    })();

                } catch (err: any) {
                    console.error('Glove Connection Error:', err);
                    if (err.name === 'NetworkError' || err.message.includes('open')) {
                        throw new Error('Port is busy. Close Arduino IDE and other apps, then try again.');
                    }
                    throw err;
                }
            },

            disconnect: async () => {
                const { ports, readers } = get();
                for (const port of ports) {
                    try { await port.close(); } catch (e) { }
                }
                set({
                    ports: [],
                    readers: [],
                    detectedDevices: [false, false],
                    isCollecting: false,
                    minValues: Array(7).fill(1023),
                    maxValues: Array(7).fill(0),
                    arduino1Data: [0, 0, 0, 0, 0],
                    arduino2Data: [0, 0]
                });
            },

            toggleCollecting: () => set(state => ({ isCollecting: !state.isCollecting })),

            updateData: (parts, arduinoIndex) => {
                set(state => {
                    const newMin = [...state.minValues];
                    const newMax = [...state.maxValues];
                    const offset = arduinoIndex === 1 ? 0 : 5;

                    parts.forEach((val, i) => {
                        const idx = offset + i;
                        if (val < newMin[idx]) newMin[idx] = val;
                        if (val > newMax[idx]) newMax[idx] = val;
                    });

                    const newDevices = [...state.detectedDevices] as [boolean, boolean];
                    newDevices[arduinoIndex - 1] = true;

                    return {
                        minValues: newMin,
                        maxValues: newMax,
                        detectedDevices: newDevices,
                        [arduinoIndex === 1 ? 'arduino1Data' : 'arduino2Data']: parts
                    };
                });
            },

            resetCalibration: () => set({
                minValues: Array(7).fill(1023),
                maxValues: Array(7).fill(0)
            })
        }),
        {
            name: 'glove-storage',
            partialize: (state) => ({ minValues: state.minValues, maxValues: state.maxValues }),
        }
    )
);
