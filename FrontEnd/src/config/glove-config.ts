/**
 * Glove Auto-Send & Processing Configuration
 * Adjust these values to fine-tune how the glove interacts with the backend.
 */

export const GLOVE_CONFIG = {
    // Speak Page Settings
    SPEAK: {
        IDLE_TIMEOUT: 1500000,           // Time (ms) of inactivity before auto-sending
        MAX_SENTENCE_DURATION: 600000,  // Max time (ms) a sentence can build before auto-sending
        MAX_CHARS: 30,                // Max characters before auto-sending
        CHECK_INTERVAL: 1000,          // How often (ms) to check for auto-send triggers
    },

    // Chat Page Settings
    CHAT: {
        IDLE_TIMEOUT: 10000,           // Time (ms) of inactivity before auto-sending in chat
        CHECK_INTERVAL: 1000,          // How often (ms) to check for auto-send triggers
    },

    // Common Settings
    MIN_LETTER_CONFIDENCE: 0.6,        // Minimum confidence to accept a letter
    AUTO_SPACE_MS: 1500,               // Auto-space threshold

    // Sensor Thresholds
    THRESHOLDS: {
        FINGERS: 0.5,                  // Threshold for active fingers (A1-A5)
        B1_INVERTED: 0.5,              // Threshold for B1 sensor (A6)
        B2: {                          // Thresholds for B2 sensor (A7) - State 0/1/2
            STATE_2: 0.25,             // If norm < 0.15 -> 2
            STATE_1: 0.40              // If norm < 0.35 -> 1, else 0
        }
    }
};
