# ♻️ Cleaner Droid (Old Post Cleaner)

> *The best way to fix a mistake is to remove it.*

**Cleaner Droid** is a specialized script for bulk-deleting old X (Twitter) posts. It is engineered to evade "bot detection" algorithms by simulating human imperfection.

## 🤖 The "Human Jitter" Engine
Unlike standard bulk-deleters which fire API requests in a perfect loop (e.g., every 500ms), **Cleaner Droid** introduces:
*   **Randomized Delays**: Waits between 800ms and 1500ms randomly between actions.
*   **Cursor Drift**: Simulates mouse movement lag before clicking buttons.
*   **"Fatigue" breaks**: Pauses for longer periods after processing a batch of tweets (Cooldown Mode).

## 🚀 Usage

1.  Go to your X Profile -> **Media** or **Posts** tab.
2.  Append `#clean_at` to the URL (or `#clean_at=HH:MM` to schedule it).
    *   Example: `https://x.com/your_name/media#clean_at`
3.  The **Cleaner GUI** will appear in the bottom left.
4.  Press **F23** (or the Start button if visible) to engage.

## ⚙️ Configuration
You can edit the `CONFIG` object in the script source:

```javascript
const CONFIG = {
    daysPost: 28,        // Delete posts older than 28 days
    daysRepost: 4,       // Un-repost items older than 4 days
    batchLimit: 40,      // Take a break after 40 deletions
    minSafeYear: 2010    // Safety stop
};
```

## ⚠️ Warning
**Use with caution.** While this script attempts to be "Bot-Safe", aggressive deletion can still trigger X's automated account locks.
*   **Monitor the process.** Do not leave it running overnight unattended.
*   **Respect the Cooldowns.** If the script says "COOLDOWN", let it rest.
